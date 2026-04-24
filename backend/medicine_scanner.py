from google import genai
from google.genai import errors
from google.genai import types
import mimetypes
from pathlib import Path
import sys
import time
from config import GEMINI_API_KEY

VERBOSE = False  # Set to True for debug output

client = None
MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.0-flash"]
RETRY_DELAYS_SECONDS = [3, 6, 12, 20]


def _get_client():
    global client
    if client is not None:
        return client

    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Set it as an environment variable before using AI endpoints."
        )

    client = genai.Client(api_key=GEMINI_API_KEY)
    return client


def _log(msg):
    if VERBOSE:
        print(f"[DEBUG] {msg}", file=sys.stderr)


def _resolve_image_path(image_path):
    candidate = Path(image_path)

    if candidate.is_file():
        return candidate

    backend_candidate = Path(__file__).resolve().parent / candidate
    if backend_candidate.is_file():
        return backend_candidate

    base = candidate.with_suffix("") if candidate.suffix else candidate
    for ext in (".jpg", ".jpeg", ".png"):
        ext_candidate = base.with_suffix(ext)
        if ext_candidate.is_file():
            return ext_candidate

        backend_ext_candidate = Path(__file__).resolve().parent / ext_candidate
        if backend_ext_candidate.is_file():
            return backend_ext_candidate

    return None


def _get_status_code(error):
    """Extract HTTP status code from an API error."""
    status_code = getattr(error, "status_code", None)
    if status_code is None:
        status_code = getattr(error, "code", None)
    return status_code


def _is_quota_exhausted(error):
    """Check if the error indicates that the daily/free-tier quota is fully used up (limit: 0).
    Per-minute rate limits with remaining daily quota ARE retryable, so we don't flag those."""
    error_msg = str(error)
    # 'limit: 0' means the free tier quota is literally zero — retrying is pointless
    if "limit: 0," in error_msg or "limit: 0\n" in error_msg or error_msg.rstrip().endswith("limit: 0"):
        return True
    # Also check for PerDay quota violations specifically
    if "PerDay" in error_msg and "RESOURCE_EXHAUSTED" in error_msg:
        return True
    return False


def _is_transient_api_error(error):
    if not isinstance(error, errors.APIError):
        return False
    return _get_status_code(error) in (408, 429, 500, 502, 503, 504)


def _generate_with_resilience(prompt, image_bytes, mime_type):
    last_error = None
    error_details = []
    active_client = _get_client()

    for model_name in MODEL_CANDIDATES:
        _log(f"Trying model: {model_name}")
        for attempt, delay in enumerate(RETRY_DELAYS_SECONDS, start=1):
            try:
                response = active_client.models.generate_content(
                    model=model_name,
                    contents=[
                        prompt,
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    ],
                )
                return response.text

            except errors.APIError as error:
                last_error = error
                status_code = _get_status_code(error)
                detail = f"Model={model_name}, attempt={attempt}, status={status_code}, error={error}"
                error_details.append(detail)
                _log(detail)

                # Model not found — skip to next model
                if status_code == 404:
                    _log(f"Model {model_name} not found (404), skipping.")
                    break

                # Daily quota fully exhausted — no point retrying this model
                if status_code == 429 and _is_quota_exhausted(error):
                    _log(f"Daily quota exhausted for {model_name}, skipping to next model.")
                    break

                # Non-retryable error — fail immediately with details
                if not _is_transient_api_error(error):
                    raise RuntimeError(
                        f"Gemini API request failed (status {status_code}): {error}"
                    ) from error

                # Retryable error — wait and retry
                if attempt < len(RETRY_DELAYS_SECONDS):
                    _log(f"Retrying in {delay}s...")
                    time.sleep(delay)
                    continue

                # Exhausted retries for this model, try next
                _log(f"Exhausted retries for {model_name}")
                break

            except Exception as error:
                # Catch unexpected errors (network issues, timeouts, etc.)
                last_error = error
                detail = f"Model={model_name}, attempt={attempt}, unexpected_error={type(error).__name__}: {error}"
                error_details.append(detail)
                _log(detail)

                if attempt < len(RETRY_DELAYS_SECONDS):
                    _log(f"Retrying in {delay}s after unexpected error...")
                    time.sleep(delay)
                    continue
                break

    # Build a detailed error message
    details_str = "\n  ".join(error_details) if error_details else "No error details captured."
    error_msg = (
        f"Gemini API failed after trying all models and retries.\n"
        f"Error details:\n  {details_str}\n"
        f"Possible fixes:\n"
        f"  1. Check if your API key is valid (config.py)\n"
        f"  2. Check your quota at https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas\n"
        f"  3. Check billing is enabled at https://aistudio.google.com/apikey\n"
        f"  4. Wait a minute and try again (rate limiting)\n"
        f"  5. Try generating a new API key at https://aistudio.google.com/apikey"
    )

    if last_error is not None:
        raise RuntimeError(error_msg) from last_error
    raise RuntimeError("Unable to scan medicine label — no models were attempted.")


def scan_medicine_label(image_path):
    resolved_path = _resolve_image_path(image_path)
    if resolved_path is None:
        raise FileNotFoundError(
            f"Medicine image not found: '{image_path}'. "
            "Try a valid file like 'med10.jpeg'."
        )

    mime_type, _ = mimetypes.guess_type(str(resolved_path))
    if not mime_type:
        mime_type = "image/jpeg"

    image_bytes = resolved_path.read_bytes()
    
    prompt = """
    Look at this medicine packaging, strip, or box image carefully.
    Find and extract the following information.
    
    Return ONLY this JSON, nothing else, no markdown:
    {
      "drug_name": "name of the medicine",
      "batch_number": "batch or lot number — usually starts with letters like BN, Batch No, B.No",
      "expiry_date": "expiry date in MM/YYYY format",
      "manufacturer": "name of manufacturing company",
      "hologram_present": true or false
    }
    
    For batch_number: look for text near words like "Batch", "B.No", "Lot", "Mfg Batch".
    For expiry_date: look for "Exp", "Use before", "Expiry".
    For hologram: look for any shiny sticker or security mark on the packaging.
    If you cannot find a field, use empty string "".
    Return only valid JSON.
    """
    
    return _generate_with_resilience(prompt, image_bytes, mime_type)

# TEST
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python medicine_scanner.py med1.jpg")
    else:
        # Enable verbose mode when running directly
        VERBOSE = True
        try:
            result = scan_medicine_label(sys.argv[1])
            print(result)
        except FileNotFoundError as error:
            print(f"ERROR: {error}")
        except RuntimeError as error:
            print(f"ERROR: {error}")
        except Exception as error:
            print(f"Unexpected scanner error ({type(error).__name__}): {error}")
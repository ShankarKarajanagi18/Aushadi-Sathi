from google import genai
from google.genai import errors
from google.genai import types
import mimetypes
from pathlib import Path
import sys
import time
from config import GEMINI_API_KEY

client = None
MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.0-flash"]
RETRY_DELAYS_SECONDS = [2, 4, 8]


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


def _resolve_image_path(image_path):
  """Resolve image path and try common extension alternatives when missing."""
  candidate = Path(image_path)

  if candidate.is_file():
    return candidate

  # Try relative to this file (backend folder) when called from elsewhere.
  backend_candidate = Path(__file__).resolve().parent / candidate
  if backend_candidate.is_file():
    return backend_candidate

  # Try common extension alternatives: .jpg/.jpeg/.png in the same folder.
  base = candidate.with_suffix("") if candidate.suffix else candidate
  for ext in (".jpg", ".jpeg", ".png"):
    ext_candidate = base.with_suffix(ext)
    if ext_candidate.is_file():
      return ext_candidate

    backend_ext_candidate = Path(__file__).resolve().parent / ext_candidate
    if backend_ext_candidate.is_file():
      return backend_ext_candidate

  return None


def _is_transient_api_error(error):
  if not isinstance(error, errors.APIError):
    return False

  status_code = getattr(error, "status_code", None)
  if status_code is None:
    status_code = getattr(error, "code", None)

  # Handle temporary throttling and overloaded backend responses.
  return status_code in (408, 429, 500, 502, 503, 504)


def _fallback_prescription_json():
  """Fallback payload when model calls fail due to quota/availability."""
  return (
    '{"medicines": [], "diagnosis": "", '
    '"doctor_notes": "AI quota exceeded. Please retry after a minute."}'
  )


def _generate_with_resilience(prompt, image_bytes, mime_type):
  last_error = None
  active_client = _get_client()

  for model_name in MODEL_CANDIDATES:
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
        status_code = getattr(error, "status_code", None)
        if status_code is None:
          status_code = getattr(error, "code", None)

        # Model is unavailable for this API version; try next candidate.
        if status_code == 404:
          break

        if not _is_transient_api_error(error):
          raise

        if attempt < len(RETRY_DELAYS_SECONDS):
          time.sleep(delay)
          continue

        # Retries exhausted for this model, move to next model candidate.
        break

  if last_error is not None:
    raise RuntimeError(
      "Gemini API is temporarily unavailable after retries and model fallbacks. "
      "Please try again in a minute."
    ) from last_error

  raise RuntimeError("Unable to generate prescription summary.")

def read_prescription(image_path):
  resolved_path = _resolve_image_path(image_path)
  if resolved_path is None:
    raise FileNotFoundError(
      f"Prescription image not found: '{image_path}'. "
      "Try an existing file like 'test_prescription.jpeg'."
    )

  mime_type, _ = mimetypes.guess_type(str(resolved_path))
  if not mime_type:
    mime_type = "image/jpeg"

  image_bytes = resolved_path.read_bytes()

  prompt = """
    You are a helpful medical assistant for patients in India.
    Read this prescription image carefully.
    Extract and return JSON with exactly these fields:
    {
      "medicines": [
        {
          "name": "medicine name",
          "dose": "dose amount",
          "frequency": "how many times per day",
          "timing": "before food / after food / with food",
          "duration": "how many days"
        }
      ],
      "diagnosis": "what condition if mentioned",
      "doctor_notes": "any special instructions"
    }
    If handwritten, do your best to read it.
    Return only valid JSON, nothing else. No explanation, no markdown.
    """

  try:
    return _generate_with_resilience(prompt, image_bytes, mime_type)
  except RuntimeError:
    return _fallback_prescription_json()

# TEST — run this file directly to test
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python prescription_reader.py yourprescription.jpg")
    else:
      try:
        result = read_prescription(sys.argv[1])
        print(result)
      except FileNotFoundError as error:
        print(error)
      except RuntimeError as error:
        print(error)
import json
import re
import requests
from config import OPENROUTER_API_KEY, GEMINI_API_KEY
from english_explainer import explain_schedule_in_english
from kannada_explainer import explain_schedule_in_kannada
from hindi_explainer import explain_schedule_in_hindi


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
SCHEDULE_MODELS = [
    "openrouter/free",
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-2.5-flash",
    "google/gemini-2.5-flash-8b",
    "openai/gpt-4o-mini",
    "meta-llama/llama-3.3-70b-instruct:free",
]


def _strip_markdown_fences(text):
    """Remove markdown code fences (```json ... ```) from LLM output."""
    raw = str(text or "").strip()
    if raw.startswith("```"):
        newline_idx = raw.find("\n")
        if newline_idx != -1:
            raw = raw[newline_idx + 1:]
        else:
            raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return raw.strip()


def _normalize_prescription_input(prescription_input):
    """Extract standard medicine list from various JSON formats or dicts."""
    if isinstance(prescription_input, str):
        try:
            data = json.loads(prescription_input)
        except Exception:
            return {"medicines": [], "raw": prescription_input}
    elif isinstance(prescription_input, dict):
        data = prescription_input
    elif isinstance(prescription_input, list):
        data = {"medicines": prescription_input}
    else:
        data = {"medicines": []}

    # Unwrap nested structures if present
    if "prescription" in data and isinstance(data["prescription"], dict):
        data = data["prescription"]

    medicines = data.get("medicines") or data.get("medications") or []
    if not isinstance(medicines, list):
        medicines = []

    clean_meds = []
    for item in medicines:
        if isinstance(item, dict):
            name = str(item.get("name") or item.get("medicine_name") or "").strip()
            if not name and "medicine" in item:
                name = str(item.get("medicine") or "").strip()
            dose = str(item.get("dose") or item.get("dosage") or "").strip()
            frequency = str(item.get("frequency") or "").strip()
            duration = str(item.get("duration") or "").strip()
            timing = str(item.get("timing") or item.get("food") or item.get("instructions") or "").strip()
            
            if name:
                clean_meds.append({
                    "name": name,
                    "dose": dose or "unsure, ask your pharmacist",
                    "frequency": frequency or "unsure, ask your pharmacist",
                    "duration": duration or "as prescribed",
                    "timing": timing or "unsure, ask your pharmacist"
                })

    return {
        "medicines": clean_meds,
        "diagnosis": str(data.get("diagnosis") or "").strip(),
        "doctor_notes": str(data.get("doctor_notes") or "").strip()
    }


def _call_llm_json(prompt, system_prompt=None):
    """Call OpenRouter LLM candidates and return text output."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/ShankarKarajanagi18/AushadhiSaathi",
        "X-Title": "AushadhiSaathi-ScheduleBuilder",
    }

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    for model_name in SCHEDULE_MODELS:
        payload = {
            "model": model_name,
            "temperature": 0.1,
            "max_tokens": 1400,
            "messages": messages,
        }
        try:
            response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                res_data = response.json()
                choices = res_data.get("choices") or []
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    if content:
                        return content
        except Exception:
            continue

    return None


def _validate_schedule_schema(schedule_data, allowed_names):
    """
    Validate that schedule_data strictly conforms to:
    {
      "schedule": { "morning": [], "afternoon": [], "night": [] },
      "interactions": [{ "medicines": [], "risk": "low|medium|high", "note": "" }],
      "warnings": []
    }
    and never invents medicines not in input.
    """
    if not isinstance(schedule_data, dict):
        return False, "Output must be a JSON object"

    schedule = schedule_data.get("schedule")
    if not isinstance(schedule, dict):
        return False, "Missing 'schedule' object"

    for slot in ("morning", "afternoon", "night"):
        if slot not in schedule or not isinstance(schedule[slot], list):
            return False, f"Missing or invalid slot list '{slot}' in schedule"

    interactions = schedule_data.get("interactions")
    if not isinstance(interactions, list):
        return False, "Missing or invalid 'interactions' list"

    valid_risks = {"low", "medium", "high"}
    for inter in interactions:
        if not isinstance(inter, dict):
            return False, "Items in 'interactions' must be objects"
        if "medicines" not in inter or not isinstance(inter["medicines"], list):
            return False, "Each interaction must contain a 'medicines' list"
        risk = str(inter.get("risk", "")).lower().strip()
        if risk not in valid_risks:
            return False, f"Interaction risk '{risk}' must be one of: low, medium, high"
        if "note" not in inter:
            return False, "Each interaction must contain a 'note' string"

    warnings = schedule_data.get("warnings")
    if not isinstance(warnings, list):
        return False, "Missing or invalid 'warnings' list"

    # Verify no invented medicines (if input medicines provided)
    if allowed_names:
        allowed_normalized = [re.sub(r"[^a-zA-Z0-9]", "", n.lower()) for n in allowed_names]
        
        for slot in ("morning", "afternoon", "night"):
            for item in schedule[slot]:
                if not isinstance(item, dict):
                    return False, f"Item in schedule.{slot} must be an object"
                med_name = str(item.get("medicine") or item.get("name") or "").strip()
                if not med_name:
                    return False, f"Missing medicine name in schedule.{slot}"
                
                med_norm = re.sub(r"[^a-zA-Z0-9]", "", med_name.lower())
                # Check if med_norm matches or contains any allowed name
                matched = any(
                    an in med_norm or med_norm in an or (len(an) >= 4 and an[:4] in med_norm)
                    for an in allowed_normalized
                )
                if not matched:
                    return False, f"Invented medicine '{med_name}' not found in input prescription"

    return True, None


def _fallback_schedule(normalized_input):
    """
    Deterministic rule-based schedule and safety check generator.
    Guarantees strict schema compliance and reliability even when LLM is unavailable.
    """
    medicines = normalized_input.get("medicines", [])
    morning = []
    afternoon = []
    night = []

    for med in medicines:
        name = med.get("name", "Medicine")
        dose = med.get("dose") or "unsure, ask your pharmacist"
        freq_str = str(med.get("frequency") or "").lower()
        timing_str = str(med.get("timing") or "").lower()

        # Determine food instruction
        if any(w in timing_str for w in ("before", "ac", "empty", "bbf", "ಮೊದಲು")):
            food = "before food"
        elif any(w in timing_str for w in ("after", "pc", "af", "ನಂತರ")):
            food = "after food"
        elif any(w in timing_str for w in ("with food", "meals", "ಊಟದ ಜೊತೆಗೆ")):
            food = "with food"
        else:
            food = "unsure, ask your pharmacist"

        item = {
            "medicine": name,
            "dose": dose,
            "food": food,
            "instruction": "Take with a glass of water as prescribed."
        }

        # Frequency mapping
        # TDS / 3 times / 1-1-1
        if any(f in freq_str for f in ("1-1-1", "tid", "tds", "3 times", "thrice", "three times")):
            morning.append(item)
            afternoon.append(item)
            night.append(item)
        # BD / 2 times / 1-0-1
        elif any(f in freq_str for f in ("1-0-1", "bd", "bid", "2 times", "twice", "two times")):
            morning.append(item)
            night.append(item)
        # 1-1-0
        elif "1-1-0" in freq_str:
            morning.append(item)
            afternoon.append(item)
        # 0-1-0 or afternoon
        elif any(f in freq_str for f in ("0-1-0", "afternoon", "noon")):
            afternoon.append(item)
        # 0-0-1 or night / bedtime / hs
        elif any(f in freq_str for f in ("0-0-1", "night", "hs", "bedtime", "evening")):
            night.append(item)
        # Once daily or default: morning
        elif any(f in freq_str for f in ("1-0-0", "od", "qd", "once", "1 time")):
            morning.append(item)
        else:
            # Ambiguous frequency: schedule in morning with pharmacist guidance note
            unclear_item = dict(item)
            unclear_item["instruction"] = "Dose timing unspecified: unsure, ask your pharmacist."
            morning.append(unclear_item)

    # Basic interaction checks between common drug classes
    interactions = []
    med_names = [m.get("name", "").lower() for m in medicines]

    # NSAID combination check
    nsaids = [n for n in med_names if any(k in n for k in ("ibuprofen", "diclofenac", "naproxen", "aceclofenac", "aspirin"))]
    if len(nsaids) >= 2:
        interactions.append({
            "medicines": nsaids[:2],
            "risk": "medium",
            "note": "Multiple NSAID painkillers detected together. Risk of increased stomach irritation."
        })

    # Paracetamol + painkiller combination check
    has_pcm = any("paracetamol" in n or "crocin" in n or "dolo" in n or "calpol" in n for n in med_names)
    other_pain = [n for n in med_names if any(k in n for k in ("combiflam", "ibuprofen", "tramadol"))]
    if has_pcm and other_pain:
        interactions.append({
            "medicines": ["Paracetamol", other_pain[0]],
            "risk": "low",
            "note": "Check combined paracetamol content to avoid exceeding 4000mg maximum daily limit."
        })

    # Antibiotic + Antacid check
    has_abx = any(k in n for n in med_names for k in ("cipro", "doxy", "azith", "amox", "levoflox"))
    has_antacid = any(k in n for n in med_names for k in ("pantop", "omepra", "rabepra", "gelusil", "antacid", "sucra"))
    if has_abx and has_antacid:
        interactions.append({
            "medicines": ["Antibiotic", "Antacid/PPI"],
            "risk": "low",
            "note": "Take antibiotic at least 2 hours apart from antacids to ensure proper absorption."
        })

    if not interactions:
        interactions.append({
            "medicines": [m.get("name", "Medicine") for m in medicines[:2]],
            "risk": "low",
            "note": "No hazardous drug interactions detected among the prescribed medications."
        })

    warnings = [
        "Take all medications with clean drinking water at the same scheduled times daily.",
        "Do not stop or skip antibiotic courses early, even if you begin feeling better.",
        "If you experience unusual dizziness, vomiting, or skin rash, consult your doctor immediately."
    ]

    return {
        "schedule": {
            "morning": morning,
            "afternoon": afternoon,
            "night": night,
        },
        "interactions": interactions,
        "warnings": warnings,
    }


def build_schedule(prescription_input):
    """
    Main entry point for Daily Dose Schedule + Safety Check.
    Input: extracted prescription JSON (medicine name, dose, frequency, duration, food instructions).
    Output: Strict JSON matching:
    {
      "schedule": { "morning": [], "afternoon": [], "night": [] },
      "interactions": [{ "medicines": [], "risk": "low|medium|high", "note": "" }],
      "warnings": []
    }
    Rules:
    - 1 LLM call with structured prompt forcing JSON-only.
    - Rule: say "unsure, ask your pharmacist" rather than guess.
    - Rule: never invent medicines not in input.
    - Validates schema and retries ONCE if invalid.
    - Resilient rule-based fallback if LLM offline.
    """
    normalized = _normalize_prescription_input(prescription_input)
    medicines = normalized.get("medicines", [])
    
    if not medicines:
        return _fallback_schedule(normalized)

    allowed_names = [m["name"] for m in medicines if m.get("name")]
    input_json_str = json.dumps(normalized, indent=2)

    system_prompt = (
        "You are an expert clinical pharmacist AI for rural health patients in India. "
        "Your task is to organize prescribed medicines into a strict 3-column daily schedule (morning, afternoon, night), "
        "perform a clinical drug interaction safety check (risk: low, medium, or high), and provide safety warnings. "
        "You must respond with ONLY raw, valid JSON. Never include markdown code fences, backticks, or outside conversational text."
    )

    base_prompt = f"""
Given this extracted prescription data:
{input_json_str}

STRICT OUTPUT FORMAT:
You MUST output ONLY valid JSON matching this exact structure:
{{
  "schedule": {{
    "morning": [
      {{
        "medicine": "Medicine name exactly from input",
        "dose": "Dosage amount from input (or 'unsure, ask your pharmacist')",
        "food": "before food" | "after food" | "with food" | "unsure, ask your pharmacist",
        "instruction": "Timing or instructions"
      }}
    ],
    "afternoon": [
      {{
        "medicine": "Medicine name exactly from input",
        "dose": "Dosage amount from input (or 'unsure, ask your pharmacist')",
        "food": "before food" | "after food" | "with food" | "unsure, ask your pharmacist",
        "instruction": "Timing or instructions"
      }}
    ],
    "night": [
      {{
        "medicine": "Medicine name exactly from input",
        "dose": "Dosage amount from input (or 'unsure, ask your pharmacist')",
        "food": "before food" | "after food" | "with food" | "unsure, ask your pharmacist",
        "instruction": "Timing or instructions"
      }}
    ]
  }},
  "interactions": [
    {{
      "medicines": ["Medicine A", "Medicine B"],
      "risk": "low" | "medium" | "high",
      "note": "Clinical interaction explanation"
    }}
  ],
  "warnings": [
    "Clinical warning or precaution"
  ]
}}

CRITICAL SAFETY & SCHEDULING CONSTRAINTS:
1. NEVER INVENT MEDICINES: You must only include medicines explicitly listed in the input ({', '.join(allowed_names)}). Absolutely do not add any outside medications.
2. RULE OF CERTAINTY: If any dose, timing, frequency, or food instruction (before food vs after food) is unclear or missing, you MUST say "unsure, ask your pharmacist" rather than guess.
3. TIMETABLE SLOTS:
   - Once daily: place in morning or night based on medicine class, or keep slot if specified.
   - Twice daily (BD/BID): morning and night.
   - Thrice daily (TDS/TID): morning, afternoon, and night.
   - If frequency is unknown, schedule in morning with "unsure, ask your pharmacist" in instruction.
4. INTERACTIONS:
   - Identify drug-drug interactions between the prescribed medicines.
   - Assign risk strictly as "low", "medium", or "high".
   - If no hazardous interactions exist, return a low-risk entry noting that no significant interactions were detected.
5. WARNINGS:
   - Provide 1 to 3 relevant practical warnings (e.g. hydration, not skipping doses, avoiding alcohol).
"""

    # First Attempt
    response_text = _call_llm_json(base_prompt, system_prompt)
    if response_text:
        cleaned_text = _strip_markdown_fences(response_text)
        try:
            parsed = json.loads(cleaned_text)
            is_valid, error_reason = _validate_schedule_schema(parsed, allowed_names)
            if is_valid:
                return parsed
        except Exception as e:
            error_reason = str(e)
    else:
        error_reason = "No response from LLM provider"

    # Retry Once with feedback if first attempt was invalid
    retry_prompt = f"""
{base_prompt}

ATTENTION - YOUR PREVIOUS ATTEMPT FAILED WITH ERROR:
{error_reason}

Please fix the error. Return strictly valid JSON with exact keys:
schedule (with morning, afternoon, night lists),
interactions (list of objects with medicines, risk: low|medium|high, note),
warnings (list of strings).
NEVER invent medicines not in {allowed_names}.
Say "unsure, ask your pharmacist" rather than guess.
"""
    retry_text = _call_llm_json(retry_prompt, system_prompt)
    if retry_text:
        cleaned_retry = _strip_markdown_fences(retry_text)
        try:
            parsed_retry = json.loads(cleaned_retry)
            is_valid, _ = _validate_schedule_schema(parsed_retry, allowed_names)
            if is_valid:
                return parsed_retry
        except Exception:
            pass

    # If both attempts failed or API is offline, return resilient fallback
    return _fallback_schedule(normalized)


def generate_schedule_summaries(schedule_result):
    """
    Generate spoken summaries in English, Kannada, and Hindi using explainer modules.
    """
    summary_en = explain_schedule_in_english(schedule_result)
    summary_kn = explain_schedule_in_kannada(schedule_result)
    summary_hi = explain_schedule_in_hindi(schedule_result)
    return {
        "en": summary_en,
        "kn": summary_kn,
        "hi": summary_hi,
    }


import google.generativeai as genai
import json
from google.api_core.exceptions import ResourceExhausted
from config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")


def _fallback_kannada_explanation(prescription_json_string):
  """Return a basic Kannada explanation when Gemini is unavailable."""
  try:
    data = json.loads(prescription_json_string)
  except Exception:
    return (
      "ಕ್ಷಮಿಸಿ, ಈಗ ಸರ್ವರ್ ಬ್ಯುಸಿ ಇದೆ. ಔಷಧಿಯನ್ನು ವೈದ್ಯರು ಹೇಳಿದಂತೆ ಮಾತ್ರ ತೆಗೆದುಕೊಳ್ಳಿ. "
      "ಅಸಹಜ ಲಕ್ಷಣಗಳು ಬಂದರೆ ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
    )

  medicines = data.get("medicines", []) or []
  diagnosis = (data.get("diagnosis") or "").strip()
  notes = (data.get("doctor_notes") or "").strip()

  lines = []
  if diagnosis:
    lines.append(f"ನಿಮ್ಮ ಸಮಸ್ಯೆ: {diagnosis}.")
  else:
    lines.append("ವೈದ್ಯರು ಕೊಟ್ಟ ಔಷಧಿಗಳನ್ನು ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ತೆಗೆದುಕೊಳ್ಳಿ.")

  if medicines:
    lines.append("ಔಷಧಿ ವಿವರ:")
    for med in medicines[:5]:
      name = (med.get("name") or "ಔಷಧಿ").strip()
      dose = (med.get("dose") or "").strip()
      timing = (med.get("timing") or "").strip()
      frequency = (med.get("frequency") or "").strip()
      duration = (med.get("duration") or "").strip()
      lines.append(
        f"{name}: {dose} {timing} {frequency} {duration}".strip()
      )

  if notes:
    lines.append(f"ವೈದ್ಯರ ಸೂಚನೆ: {notes}")

  lines.append("ಜ್ವರ, ವಾಂತಿ, ಅಲರ್ಜಿ ಹೆಚ್ಚಾದರೆ ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.")
  return "\n".join(lines)

def explain_in_kannada(prescription_json_string):
    prompt = f"""
    You are a friendly doctor's assistant explaining a prescription 
    to a poor semi-literate patient in Bengaluru. 
    Explain in very simple, spoken Kannada — not written formal Kannada.
    Use words a domestic worker or daily wage earner would understand.
    
    Prescription data: {prescription_json_string}
    
    Explain these things in simple Kannada:
    1. What is the patient's condition (if mentioned)
    2. Each medicine — what it does in simple words
    3. When to take each medicine — morning, afternoon, night
    4. Before food or after food
    5. Important warnings
    6. When to come back to doctor
    
    Keep it under 150 words. 
    Return ONLY the Kannada explanation text. Nothing else.
    """
    
    try:
      response = model.generate_content(prompt)
      return response.text
    except ResourceExhausted:
      return _fallback_kannada_explanation(prescription_json_string)
    except Exception:
      return _fallback_kannada_explanation(prescription_json_string)

# TEST
if __name__ == "__main__":
    # Paste a sample JSON here to test
    sample = '''
    {
      "medicines": [
        {
          "name": "Crocin 500mg",
          "dose": "1 tablet",
          "frequency": "3 times a day",
          "timing": "after food",
          "duration": "5 days"
        }
      ],
      "diagnosis": "Fever",
      "doctor_notes": "Rest well"
    }
    '''
    result = explain_in_kannada(sample)
    print(result)
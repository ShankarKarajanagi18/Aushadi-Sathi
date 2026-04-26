import json
import re

def _clean_medical_text_in_english(text):
    raw = str(text or "").strip()
    if not raw:
        return ""

    converted = raw

    replacements = [
        (r"\bno\s+vomiting\b", "vomiting"),
        (r"\bno\s+nausea\b", "nausea"),
        (r"\bno\s+bloating\b", "bloating"),
        (r"\bno\s+pain\s+abdomen\b", "abdominal pain"),
        (r"\bno\s+abdomen\s+pain\b", "abdominal pain"),
        (r"\bno\s+altered\s+bowel\s+movements\b", "altered bowel habits"),
        (r"\bno\s+altered\s+bowel\s+habits\b", "altered bowel habits"),
        (r"\bno\s+fever\b", "fever"),
        (r"\bno\s+cough\b", "cough"),
        (r"\bno\s+pain\b", "pain"),
        (r"\bpain\s+abdomen\b", "abdominal pain"),
        (r"\babdomen\s+pain\b", "abdominal pain"),
    ]

    for pattern, replacement in replacements:
        converted = re.sub(pattern, replacement, converted, flags=re.IGNORECASE)

    # Replace "x 4 days" with "for 4 days"
    converted = re.sub(r"\bx\s*(\d+)\s*days\b", r"for \1 days", converted, flags=re.IGNORECASE)

    # Clean up punctuation and repeated spaces
    converted = re.sub(r"\s+", " ", converted).strip(" ,;")
    return converted

def _fallback_english_explanation(prescription_json_string):
  """Return a detailed English explanation when AI is unavailable."""
  try:
    data = json.loads(prescription_json_string)
  except Exception:
    return (
      "Sorry, unable to generate explanation at the moment. Please take the medicines as prescribed by your doctor. "
      "Contact a doctor immediately if you notice any severe side effects."
    )

  medicines = data.get("medicines", []) or []
  diagnosis = (data.get("diagnosis") or "").strip()
  notes = (data.get("doctor_notes") or "").strip()

  lines = []
  if diagnosis:
    diagnosis_en = _clean_medical_text_in_english(diagnosis)
    lines.append(f"Your diagnosis: {diagnosis_en}.")
  else:
    lines.append("Please take the prescribed medicines exactly on time. Do not change the dosage yourself.")

  if medicines:
    for med in medicines[:5]:
      name = (med.get("name") or "Medicine").strip()
      dose = (med.get("dose") or "").strip()
      timing = (med.get("timing") or "").strip()
      frequency = (med.get("frequency") or "").strip()
      duration = (med.get("duration") or "").strip()
      parts = [part for part in [name, dose, timing, frequency, duration] if part]
      lines.append("; ".join(parts) + ".")
      lines.append("If you experience nausea, allergies, or breathing difficulty, consult your doctor immediately.")

  if notes:
    notes_en = _clean_medical_text_in_english(notes)
    lines.append(f"Doctor's notes: {notes_en}")

  lines.append("If you miss a dose, do not double the next dose.")
  lines.append("If symptoms do not improve in 2-3 days, or if fever/vomiting/allergies worsen, visit a doctor immediately.")
  return "\n".join(lines)


def _build_spoken_english_explanation(prescription_json_string):
  data = json.loads(prescription_json_string)
  medicines = data.get("medicines", []) or []
  diagnosis = (data.get("diagnosis") or "").strip()
  notes = (data.get("doctor_notes") or "").strip()

  lines = [
    "Hello. The doctor has prescribed some medicines for you. I will now explain how to take them.",
  ]

  if diagnosis:
    diagnosis_en = _clean_medical_text_in_english(diagnosis)
    lines.append(f"These medicines are prescribed for your {diagnosis_en}.")
  else:
    lines.append("The specific health issue is not mentioned here, but please take the medicines as directed.")

  if medicines:
    for index, med in enumerate(medicines[:6], start=1):
      name = str(med.get("name") or "Medicine").strip()
      purpose = str(med.get("purpose") or med.get("use") or "").strip()
      prefix = "First medicine" if index == 1 else "Second medicine" if index == 2 else f"Medicine number {index}"
      
      if purpose:
        lines.append(f"{prefix} is '{name}'. This is for {purpose}.")
      else:
        lines.append(f"{prefix} is '{name}'.")

      dose = str(med.get("dose") or "").strip()
      frequency = str(med.get("frequency") or "").strip()
      timing = str(med.get("timing") or "").strip()
      duration = str(med.get("duration") or "").strip()
      
      parts = []
      if dose: parts.append(dose)
      if frequency: parts.append(frequency)
      if timing: parts.append(timing)
      
      instruction = ", ".join(parts)
      if instruction:
        line = f"Take '{name}' as follows: {instruction}."
      else:
        line = f"Please take '{name}'."
        
      if duration:
        line += f" Continue this for {duration}."
        
      lines.append(line)

      medicine_note = (med.get("note") or med.get("instructions") or "").strip()
      if medicine_note:
        lines.append(f"Special instruction for this medicine: {medicine_note}")

  else:
    lines.append("I could not find medicine details in this prescription. Please verify with the doctor.")

  if notes:
    notes_en = _clean_medical_text_in_english(notes)
    lines.append(f"Additional notes from the doctor: {notes_en}")

  lines.append("If you miss a dose, do not take two medicines together next time.")
  lines.append("If you experience severe allergies, vomiting, dizziness, or breathing trouble, stop the medicine and contact your doctor immediately.")
  lines.append("If you are already taking other medicines, please inform your doctor before continuing.")

  lines.append("Final note: Take all medicines on time without skipping.")
  lines.append("If you face any issues, please consult the doctor immediately.")
  return "\n".join(lines)


def explain_in_english(prescription_json_string):
    try:
      return _build_spoken_english_explanation(prescription_json_string)
    except Exception:
      return _fallback_english_explanation(prescription_json_string)

import json
import re


def _fallback_hindi_explanation(prescription_json_string):
    """Return a detailed Hindi explanation when AI is unavailable."""
    try:
        data = json.loads(prescription_json_string)
    except Exception:
        return (
            "माफ़ कीजिए, अभी व्याख्या तैयार नहीं हो सकी। "
            "कृपया डॉक्टर के बताए अनुसार ही दवाइयां लें। "
            "अगर कोई परेशानी महसूस हो, तो तुरंत डॉक्टर या आशा दीदी से संपर्क करें।"
        )

    medicines = data.get("medicines", []) or []
    diagnosis = (data.get("diagnosis") or "").strip()
    notes = (data.get("doctor_notes") or "").strip()

    lines = [
        "नमस्ते! डॉक्टर ने आपके लिए जो दवाइयां लिखी हैं, उन्हें समय पर लेना बहुत ज़रूरी है।"
    ]

    if diagnosis:
        diagnosis_hi = _translate_medical_text_to_hindi(diagnosis)
        lines.append(f"आपकी बीमारी / समस्या: {diagnosis_hi}।")
    else:
        lines.append("डॉक्टर के बताए अनुसार दवा समय पर लें। अपने आप दवा की मात्रा न बदलें।")

    if medicines:
        for med in medicines[:5]:
            name = (med.get("name") or "दवा").strip()
            dose = _normalize_dose_text(med.get("dose") or "")
            timing = _normalize_time_text(med.get("timing") or "")
            frequency = _normalize_frequency_text(med.get("frequency") or "")
            duration = _normalize_duration_text(med.get("duration") or "")
            parts = [p for p in [name, dose, timing, frequency, duration] if p]
            lines.append(" • " + "; ".join(parts) + "।")

    if notes:
        notes_hi = _translate_medical_text_to_hindi(notes)
        lines.append(f"डॉक्टर की खास सलाह: {notes_hi}")

    lines.append("अगर कोई खुराक छूट जाए, तो अगली बार दो गोलियां एक साथ कभी न खाएं।")
    lines.append("अगर 2-3 दिन में सुधार न दिखे, या उल्टी/एलर्जी बढ़े, तो तुरंत डॉक्टर को दिखाएं।")
    return "\n".join(lines)


def _clean_value(value, default="डॉक्टर या फार्मासिस्ट से पूछकर पक्का करें"):
    text = str(value or "").strip()
    return text if text else default


def _translate_medical_text_to_hindi(text):
    raw = str(text or "").strip()
    if not raw:
        return ""

    converted = raw

    replacements = [
        (r"\busg\s*abdomen\b", "पेट का अल्ट्रासाउंड टेस्ट"),
        (r"\busg\b", "अल्ट्रासाउंड जांच"),
        (r"\bdm\b", "शुगर (डायबिटीज)"),
        (r"\bhtn\b", "हाई ब्लड प्रेशर (उच्च रक्तचाप)"),
        (r"\bno\s+vomiting\b", "उल्टी"),
        (r"\bno\s+nausea\b", "जी मिचलाना"),
        (r"\bno\s+bloating\b", "पेट फूलना या गैस"),
        (r"\bno\s+pain\s+abdomen\b", "पेट दर्द"),
        (r"\bno\s+abdomen\s+pain\b", "पेट दर्द"),
        (r"\bno\s+altered\s+bowel\s+movements\b", "शौच में बदलाव"),
        (r"\bno\s+altered\s+bowel\s+habits\b", "शौच में बदलाव"),
        (r"\bno\s+fever\b", "बुखार"),
        (r"\bno\s+cough\b", "खांसी"),
        (r"\bno\s+pain\b", "दर्द"),
        (r"\bpain\s+abdomen\b", "पेट दर्द"),
        (r"\babdomen\s+pain\b", "पेट दर्द"),
        (r"\bvomiting\b", "उल्टी"),
        (r"\bnausea\b", "जी मिचलाना"),
        (r"\bbloating\b", "पेट में गैस और फूलना"),
        (r"\bfever\b", "बुखार"),
        (r"\bcough\b", "खांसी"),
        (r"\bcold\b", "सर्दी-जुकाम"),
        (r"\bheadache\b", "सिरदर्द"),
        (r"\bweakness\b", "कमजोरी"),
        (r"\bfatigue\b", "थकान"),
        (r"\bdiarrhoea\b", "दस्त"),
        (r"\bloose\s+motion\b", "पतले दस्त"),
        (r"\bconstipation\b", "कब्ज"),
        (r"\bacidity\b", "पेट में जलन और एसिडिटी"),
        (r"\bgas\b", "गैस की समस्या"),
        (r"\binfection\b", "कीटाणुओं का इन्फेक्शन (संक्रमण)"),
        (r"\ballergy\b", "एलर्जी और खुजली"),
        (r"\bitching\b", "खुजली"),
        (r"\brash\b", "त्वचा पर लाल दाने"),
        (r"\bhypertension\b", "हाई ब्लड प्रेशर"),
        (r"\bdiabetes\b", "डायबिटीज (शुगर की बीमारी)"),
    ]

    for pattern, replacement in replacements:
        converted = re.sub(pattern, replacement, converted, flags=re.IGNORECASE)

    converted = re.sub(r"\bx\s*(\d+)\s*days\b", r"\1 दिनों के लिए", converted, flags=re.IGNORECASE)
    converted = re.sub(r"\b(\d+)\s*days\b", r"\1 दिन", converted, flags=re.IGNORECASE)
    converted = re.sub(r"\b(\d+)\s*weeks\b", r"\1 हफ्ते", converted, flags=re.IGNORECASE)
    converted = re.sub(r"\b(\d+)\s*week\b", r"\1 हफ्ता", converted, flags=re.IGNORECASE)
    converted = re.sub(r"\b(\d+)\s*months\b", r"\1 महीने", converted, flags=re.IGNORECASE)

    converted = re.sub(r"\s+", " ", converted).strip(" ,;")
    return converted


def _normalize_duration_text(duration):
    text = str(duration or "").strip().lower()
    if not text:
        return ""

    text = text.replace("days", "दिन").replace("day", "दिन")
    text = text.replace("weeks", "हफ्ते").replace("week", "हफ्ता")
    text = text.replace("months", "महीने").replace("month", "महीना")
    return text


def _normalize_time_text(timing):
    text = str(timing or "").strip().lower()
    if not text:
        return ""

    if any(w in text for w in ("before", "ac", "bbf", "empty", "पहले")):
        return "खाना खाने से पहले"
    if any(w in text for w in ("after", "pc", "af", "बाद")):
        return "खाना खाने के बाद"
    if any(w in text for w in ("with food", "साथ")):
        return "खाने के साथ"

    if "morning" in text or "am" in text or "सुबह" in text:
        return "सुबह"
    if "night" in text or "pm" in text or "रात" in text:
        return "रात को"
    if "afternoon" in text or "दोपहर" in text:
        return "दोपहर को"
    if "evening" in text or "शाम" in text:
        return "शाम को"
    if "30 m" in text or "30 min" in text:
        return "खाना खाने से आधा घंटा पहले"

    return text


def _spoken_medicine_name(name):
    text = str(name or "दवा").strip()
    return text


def _normalize_frequency_text(frequency):
    text = str(frequency or "").strip().lower()
    if not text:
        return ""

    if text in {"od", "qd", "1-0-0", "0-1-0", "0-0-1"}:
        return "दिन में एक बार"
    if text in {"bd", "bid", "b.i.d", "1-0-1", "1-1-0"}:
        return "दिन में दो बार (सुबह और रात)"
    if text in {"tid", "tds", "t.i.d", "1-1-1"}:
        return "दिन में तीन बार (सुबह, दोपहर और रात)"
    if text in {"qid", "q.i.d", "1-1-1-1"}:
        return "दिन में चार बार"
    if text in {"sos", "prn", "as needed", "when required"}:
        return "सिर्फ ज़रूरत पड़ने पर"
    if text in {"hs", "bt"}:
        return "रात को सोने से पहले"

    if "once" in text or ("1" in text and "day" in text) or text in {"1", "1.0", "1 time", "1 times"}:
        return "दिन में एक बार"
    if "twice" in text or ("2" in text and "day" in text) or text in {"2", "2.0", "2 time", "2 times"}:
        return "दिन में दो बार"
    if "thrice" in text or ("3" in text and "day" in text) or text in {"3", "3.0", "3 time", "3 times"}:
        return "दिन में तीन बार"

    return text


def _normalize_dose_text(dose):
    text = str(dose or "").strip().lower()
    if not text:
        return ""

    text = text.replace("tablets", "गोलियां").replace("tablet", "गोली")
    text = text.replace("tabs", "गोलियां").replace("tab", "गोली")
    text = text.replace("capsules", "कैप्सूल").replace("capsule", "कैप्सूल")
    text = text.replace("ml", "एम.एल")
    text = text.replace("tsp", "चम्मच")
    return text


def _infer_purpose_from_name(name):
    """Best-effort plain Hindi purpose inference from common medicine names."""
    text = str(name or "").strip().lower()
    if not text:
        return ""

    if "paracetamol" in text or "crocin" in text or "dolo" in text or "calpol" in text:
        return "बुखार और शरीर का दर्द कम करने के लिए"
    if "pantop" in text or "omepraz" in text or "sompraz" in text or "rabepraz" in text or "gelusil" in text or "antacid" in text:
        return "पेट की गैस, सीने की जलन और एसिडिटी कम करने के लिए"
    if "cetiriz" in text or "levocet" in text or "allegra" in text or "avil" in text:
        return "एलर्जी, खुजली, छींकें और बहती नाक रोकने के लिए"
    if "amox" in text or "azith" in text or "cef" in text or "cipro" in text or "doxy" in text:
        return "इन्फेक्शन यानी शरीर के कीटाणुओं को खत्म करने के लिए एंटीबायोटिक दवा"
    if "telma" in text or "amlodipine" in text or "atenolol" in text or "losartan" in text:
        return "ब्लड प्रेशर (रक्तचाप) को सामान्य रखने के लिए"
    if "metformin" in text or "glim" in text or "glic" in text or "insulin" in text:
        return "खून में शुगर (डायबिटीज) का स्तर नियंत्रित रखने के लिए"
    if "ors" in text or "electral" in text:
        return "शरीर में पानी और नमक की कमी पूरी करने के लिए"
    if "iron" in text or "folic" in text or "ferrous" in text:
        return "खून की कमी (एनीमिया) दूर करने और ताकत के लिए"
    if "vitamin" in text or "zinc" in text or "becosules" in text:
        return "शरीर की कमजोरी दूर करने और बीमारी से लड़ने की ताकत के लिए"
    if "combiflam" in text or "ibuprofen" in text or "diclofenac" in text or "aceclo" in text:
        return "तेज दर्द और सूजन कम करने के लिए"

    return ""


def _infer_purpose_from_context(diagnosis, notes):
    context = f"{str(diagnosis or '').lower()} {str(notes or '').lower()}"
    if not context.strip():
        return "आपकी सेहत में सुधार लाने के लिए"

    if "dm" in context or "diabet" in context or "sugar" in context:
        return "खून में शुगर नियंत्रित रखने के लिए"
    if "htn" in context or "bp" in context or "hypert" in context:
        return "ब्लड प्रेशर सामान्य रखने के लिए"
    if "acid" in context or "gas" in context or "burn" in context:
        return "पेट की जलन और गैस ठीक करने के लिए"
    if "vomit" in context or "nausea" in context:
        return "उल्टी और जी मिचलाना रोकने के लिए"
    if "pain" in context:
        return "दर्द से आराम पाने के लिए"
    if "infection" in context or "fever" in context:
        return "बुखार और इन्फेक्शन ठीक करने के लिए"

    return "आपकी सेहत में सुधार लाने के लिए"


def _extract_purpose_text(medicine, diagnosis, notes):
    purpose = (
        medicine.get("purpose")
        or medicine.get("use")
        or medicine.get("indication")
        or medicine.get("reason")
        or ""
    )
    purpose = str(purpose).strip()
    if purpose:
        return _translate_medical_text_to_hindi(purpose)

    inferred = _infer_purpose_from_name(medicine.get("name"))
    if inferred:
        return inferred

    return _infer_purpose_from_context(diagnosis, notes)


def _build_spoken_hindi_explanation(prescription_json_string):
    data = json.loads(prescription_json_string)
    medicines = data.get("medicines", []) or []
    diagnosis = (data.get("diagnosis") or "").strip()
    notes = (data.get("doctor_notes") or "").strip()
    diagnosis_hi = _translate_medical_text_to_hindi(diagnosis)
    notes_hi = _translate_medical_text_to_hindi(notes)

    lines = [
        "नमस्ते! डॉक्टर ने आपके लिए कुछ दवाइयां लिखी हैं। आइए आसान भाषा में समझते हैं कि कौन सी दवा कब और कैसे लेनी है।",
    ]

    if diagnosis:
        lines.append(f"यह दवाइयां आपकी इस समस्या के लिए हैं: {diagnosis_hi}।")
    else:
        lines.append("कृपया सभी दवाइयों को डॉक्टर के बताए अनुसार समय पर लें।")

    if medicines:
        for index, med in enumerate(medicines[:6], start=1):
            name = str(med.get("name") or "दवा").strip()
            purpose = _extract_purpose_text(med, diagnosis, notes)
            prefix = "पहली दवा" if index == 1 else "दूसरी दवा" if index == 2 else f"दवा नंबर {index}"

            if purpose:
                lines.append(f"{prefix} है '{name}'। यह {purpose}।")
            else:
                lines.append(f"{prefix} है '{name}'।")

            dose = _normalize_dose_text(med.get("dose") or "")
            frequency = _normalize_frequency_text(med.get("frequency") or "")
            timing = _normalize_time_text(med.get("timing") or "")
            duration = _normalize_duration_text(med.get("duration") or "")

            parts = []
            if dose:
                parts.append(dose)
            if timing:
                parts.append(timing)
            if frequency:
                parts.append(frequency)

            if parts:
                instruction = ", ".join(parts)
                line = f"'{name}' को ऐसे लेना है: {instruction}।"
            else:
                line = f"कृपया '{name}' को डॉक्टर के बताए अनुसार लें।"

            if duration:
                line += f" इसे लगातार {duration} तक लेते रहें।"

            lines.append(line)

            medicine_note = (med.get("note") or med.get("instructions") or "").strip()
            if medicine_note:
                lines.append(f"इस दवा के लिए खास निर्देश: {_translate_medical_text_to_hindi(medicine_note)}।")

    else:
        lines.append("पर्चे में कोई दवा साफ़ नहीं दिख रही है। कृपया डॉक्टर या फार्मासिस्ट से जांच कराएं।")

    if notes:
        lines.append(f"डॉक्टर की अतिरिक्त सलाह: {notes_hi}।")

    lines.append("ध्यान रखें: अगर कभी दवा छूट जाए, तो अगली बार दो गोलियां एक साथ कभी न खाएं।")
    lines.append("अगर दवा लेने के बाद शरीर पर लाल दाने, खुजली, ज्यादा उल्टी या सांस लेने में परेशानी हो, तो तुरंत दवा रोककर डॉक्टर से मिलें।")
    lines.append("अगर आप पहले से कोई दूसरी दवा ले रहे हैं, तो डॉक्टर को ज़रूर बताएं।")
    lines.append("आखिरी बात: सभी दवाइयां सही समय पर लें और पूरा कोर्स खत्म करें। स्वस्थ रहें!")

    return "\n".join(lines)


def explain_in_hindi(prescription_json_string):
    """Generate a spoken, simple Hindi explanation for the prescription."""
    try:
        return _build_spoken_hindi_explanation(prescription_json_string)
    except Exception:
        return _fallback_hindi_explanation(prescription_json_string)


def explain_schedule_in_hindi(schedule_data):
    """Generate a spoken Hindi summary for daily dose timetable and safety check."""
    if not isinstance(schedule_data, dict):
        return "यह आपकी दवा समय-सारणी है। किसी भी सवाल के लिए फार्मासिस्ट या डॉक्टर से पूछें।"

    schedule = schedule_data.get("schedule") or {}
    morning = schedule.get("morning") or []
    afternoon = schedule.get("afternoon") or []
    night = schedule.get("night") or []
    interactions = schedule_data.get("interactions") or []
    warnings = schedule_data.get("warnings") or []

    lines = [
        "नमस्ते! यह आपकी दैनिक दवा समय-सारणी और सुरक्षा जानकारी है।"
    ]

    def _format_hi_item(m):
        med_name = _spoken_medicine_name(m.get("medicine") or m.get("name") or "दवा")
        dose_raw = str(m.get("dose") or "").strip()
        dose_hi = _normalize_dose_text(dose_raw)
        if "unsure" in dose_raw.lower():
            dose_hi = "मात्रा के लिए फार्मासिस्ट से पूछें"

        timing_raw = str(m.get("food") or m.get("timing") or "").strip()
        timing_hi = _normalize_time_text(timing_raw)
        if "unsure" in timing_raw.lower():
            timing_hi = "खाने से पहले या बाद में, फार्मासिस्ट से पूछें"

        parts = [med_name]
        if dose_hi:
            parts.append(dose_hi)
        if timing_hi:
            parts.append(timing_hi)
        return ", ".join(parts)

    # Morning
    if morning:
        items = [_format_hi_item(m) for m in morning]
        lines.append("सुबह लेने वाली दवाइयां: " + "; ".join(items) + "।")
    else:
        lines.append("सुबह के समय कोई दवा नहीं है।")

    # Afternoon
    if afternoon:
        items = [_format_hi_item(m) for m in afternoon]
        lines.append("दोपहर को लेने वाली दवाइयां: " + "; ".join(items) + "।")
    else:
        lines.append("दोपहर के समय कोई दवा नहीं है।")

    # Night
    if night:
        items = [_format_hi_item(m) for m in night]
        lines.append("रात को लेने वाली दवाइयां: " + "; ".join(items) + "।")
    else:
        lines.append("रात के समय कोई दवा नहीं है।")

    # Safety
    high_or_med = [
        item for item in interactions
        if str(item.get("risk", "")).lower() in ("high", "medium")
    ]
    if high_or_med:
        lines.append("दवा सुरक्षा की ज़रूरी चेतावनी:")
        for item in high_or_med[:2]:
            meds = ", ".join(item.get("medicines") or [])
            note_hi = _translate_medical_text_to_hindi(item.get("note", ""))
            lines.append(f"{meds} दवाइयों के बारे में: {note_hi}")
    elif interactions:
        lines.append("दवा सुरक्षा जांच: इन दवाइयों के बीच कोई खतरनाक रिएक्शन नहीं मिला है।")
    else:
        lines.append("दवा सुरक्षा जांच: आपकी सभी दवाइयां सुरक्षित हैं।")

    if warnings:
        for w in warnings[:2]:
            lines.append("खास सावधानी: " + _translate_medical_text_to_hindi(w))

    lines.append("यह जानकारी सिर्फ आपकी सुविधा के लिए है। किसी भी परेशानी में तुरंत डॉक्टर या आशा दीदी से मिलें।")
    return "\n".join(lines)


if __name__ == "__main__":
    sample = '''
    {
      "medicines": [
        {
          "name": "Paracetamol 500mg",
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
    result = explain_in_hindi(sample)
    print(result)

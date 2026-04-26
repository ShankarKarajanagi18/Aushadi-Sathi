import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from config import FIREBASE_KEY_PATH

# Initialize Firebase (only if not already initialized)
if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_KEY_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def check_expiry(expiry_string):
    """Returns True if medicine is expired"""
    try:
        if not expiry_string:
            return False
        parts = expiry_string.strip().split('/')
        month = int(parts[0])
        year = int(parts[1])
        expiry = datetime(year, month, 1)
        return datetime.now() > expiry
    except:
        return False

def verify_medicine(scan_result_dict):
    batch = scan_result_dict.get('batch_number', '').strip().upper()
    expiry = scan_result_dict.get('expiry_date', '')
    hologram = scan_result_dict.get('hologram_present', True)
    
    # Check 1 — Is batch in CDSCO fake/NSQ list?
    if batch:
        nsq_match = db.collection('nsq_medicines')\
            .where('batch_number', '==', batch).get()
        if len(list(nsq_match)) > 0:
            return {
                "status": "RED",
                "color": "🔴",
                "reason": "This batch is in CDSCO's fake/substandard drug list",
                "kannada": "ಈ ಔಷಧಿ ನಕಲಿ ಅಥವಾ ಕಳಪೆ ಗುಣಮಟ್ಟದ್ದು. ತಕ್ಷಣ ಬಳಸಬೇಡಿ.",
                "english": "This medicine is fake or of substandard quality. Do not use immediately."
            }
    
    # Check 2 — Is medicine expired?
    if check_expiry(expiry):
        return {
            "status": "RED",
            "color": "🔴",
            "reason": "Medicine is expired",
            "kannada": "ಈ ಔಷಧಿಯ ಅವಧಿ ಮುಗಿದಿದೆ. ಬಳಸಬೇಡಿ.",
            "english": "This medicine has expired. Do not use."
        }
    
    # Check 3 — Hologram missing?
    if not hologram:
        return {
            "status": "YELLOW",
            "color": "🟡",
            "reason": "Security hologram not found on packaging",
            "kannada": "ಔಷಧಿಯ ಮೇಲೆ ಭದ್ರತಾ ಚಿಹ್ನೆ ಕಾಣುತ್ತಿಲ್ಲ. ಜಾಗರೂಕರಾಗಿರಿ.",
            "english": "Security hologram is missing on the packaging. Please be careful."
        }
    
    # All checks passed
    purpose = scan_result_dict.get('purpose', '')
    when_to_take = scan_result_dict.get('when_to_take', '')
    side_effects = scan_result_dict.get('side_effects', '')
    
    kan_purpose = scan_result_dict.get('kannada_purpose', '')
    kan_when = scan_result_dict.get('kannada_when_to_take', '')
    kan_side = scan_result_dict.get('kannada_side_effects', '')

    eng_text = "This medicine is safe. You can use it without hesitation."
    if purpose:
        eng_text += f"\n\nPurpose: {purpose}"
    if when_to_take:
        eng_text += f"\nWhen to take: {when_to_take}"
    if side_effects:
        eng_text += f"\nSide effects: {side_effects}"

    kan_text = "ಈ ಔಷಧಿ ಸುರಕ್ಷಿತವಾಗಿದೆ. ನಿಸ್ಸಂಕೋಚವಾಗಿ ಬಳಸಬಹುದು."
    if kan_purpose:
        kan_text += f"\n\nಉದ್ದೇಶ: {kan_purpose}"
    if kan_when:
        kan_text += f"\nಯಾವಾಗ ತೆಗೆದುಕೊಳ್ಳಬೇಕು: {kan_when}"
    if kan_side:
        kan_text += f"\nಅಡ್ಡ ಪರಿಣಾಮಗಳು: {kan_side}"

    return {
        "status": "GREEN",
        "color": "🟢",
        "reason": "No issues found",
        "kannada": kan_text,
        "english": eng_text
    }
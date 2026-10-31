import os
from dotenv import load_dotenv

# Load .env file from the same directory as this script
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

raw_openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
raw_gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()

# Auto-detect if user swapped keys:
# Google Gemini keys from AI Studio start with "AIza"
# OpenRouter keys start with "sk-or-"
if raw_openrouter_key.startswith("AIza") and not raw_gemini_key:
    GEMINI_API_KEY = raw_openrouter_key
    OPENROUTER_API_KEY = ""
elif raw_gemini_key.startswith("sk-or-") and not raw_openrouter_key:
    OPENROUTER_API_KEY = raw_gemini_key
    GEMINI_API_KEY = ""
else:
    OPENROUTER_API_KEY = raw_openrouter_key
    GEMINI_API_KEY = raw_gemini_key

FIREBASE_KEY_PATH = os.environ.get("FIREBASE_KEY_PATH", "firebase-key.json")
TTS_API_KEY = os.environ.get("TTS_API_KEY", "")

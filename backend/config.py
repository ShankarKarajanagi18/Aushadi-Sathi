import os
from pathlib import Path

# Load from environment to avoid committing secrets to source control.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Resolve firebase key path relative to backend folder by default.
_default_firebase_key = Path(__file__).resolve().parent / "firebase-key.json"
FIREBASE_KEY_PATH = os.getenv("FIREBASE_KEY_PATH", str(_default_firebase_key))
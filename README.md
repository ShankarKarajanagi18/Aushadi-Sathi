# 💊 AushadhiSaathi — AI-Powered Medicine Safety Assistant

<div align="center">

**Empowering ASHA Workers & Rural Patients with AI-driven medicine safety**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-API-000000?logo=flask)](https://flask.palletsprojects.com)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📖 About

**AushadhiSaathi** (ಔಷಧಿಸಾಥಿ — "Medicine Companion") is a full-stack AI-powered platform that bridges the healthcare literacy gap in rural India. It enables **ASHA (Accredited Social Health Activist) workers** and **patients** to:

- 📸 **Scan prescriptions** — Extract medicine names, dosages, and timing from handwritten or printed prescriptions using AI vision models.
- ✅ **Verify medicine safety** — Check batch numbers against CDSCO's Not-of-Standard-Quality (NSQ) and spurious drug databases, detect expired medicines, and flag missing security holograms.
- 🗣️ **Listen to guidance in Kannada & English** — AI-generated explanations are converted to natural speech using ElevenLabs multilingual TTS.
- 💬 **Chat with a health assistant** — An AI-powered chatbot answers medicine-related questions in both Kannada and English.
- 📱 **Send SMS instructions** — ASHA workers can compose and queue patient medication reminders.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Prescription OCR** | AI vision models extract medicine name, dose, frequency, timing, and duration from prescription images |
| **Medicine Verification** | Scans medicine packaging to extract batch number, expiry date, manufacturer, and hologram status; cross-references against CDSCO NSQ database |
| **Traffic-Light Safety Verdict** | 🟢 GREEN (safe), 🟡 YELLOW (caution — missing hologram), 🔴 RED (expired or flagged batch) |
| **Bilingual Support** | Full Kannada (ಕನ್ನಡ) and English support — dynamically toggle UI language and all AI-generated content |
| **Voice Guidance** | ElevenLabs multilingual TTS for Kannada; English TTS with gTTS/Google Translate fallback |
| **AI Health Chatbot** | OpenRouter-powered chatbot for medicine queries, dose timing, and side-effect guidance |
| **ASHA Worker Dashboard** | Dedicated login, patient management, prescription/medicine scan workflows, SMS composer, and full scan history |
| **Medicine Usage Details** | For safe (GREEN) medicines, AI extracts purpose, when to take, and common side effects |
| **Nearest ASHA Locator** | Find nearby ASHA workers by area or GPS coordinates |
| **CDSCO Data Pipeline** | Extract NSQ/spurious drug data from CDSCO PDFs → CSV → Firestore for real-time batch verification |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  HomePage │ ScanPrescription │ MedVerification │ Chat   │
│  AshaLogin │ AshaWorker │ AshaHistory │ NearestAsha     │
│                                                         │
│  i18n (Kannada/English) │ LanguageContext │ Translations │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼──────────────────────────────────┐
│                  BACKEND (Flask + Python)                │
│                                                         │
│  app.py ─── Routes & Business Logic                     │
│    ├── prescription_reader.py  (OpenRouter Vision OCR)  │
│    ├── medicine_scanner.py     (OpenRouter Vision OCR)  │
│    ├── verifier.py             (Firestore NSQ lookup)   │
│    ├── kannada_explainer.py    (Kannada AI explanation)  │
│    ├── english_explainer.py    (English AI explanation)  │
│    ├── tts_kannada.py          (ElevenLabs/gTTS)        │
│    └── tts_english.py          (ElevenLabs/gTTS)        │
│                                                         │
│  External APIs: OpenRouter │ ElevenLabs │ Firebase      │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
AushadhiSaathi/
├── backend/
│   ├── app.py                    # Flask API server (all routes)
│   ├── config.py                 # Environment variable loader
│   ├── prescription_reader.py    # Prescription image → structured JSON
│   ├── medicine_scanner.py       # Medicine package image → structured JSON
│   ├── verifier.py               # Safety verification (NSQ, expiry, hologram)
│   ├── kannada_explainer.py      # Kannada explanation generator
│   ├── english_explainer.py      # English explanation generator
│   ├── tts_kannada.py            # Kannada text-to-speech (ElevenLabs + fallbacks)
│   ├── tts_english.py            # English text-to-speech
│   ├── extract_cdsco.py          # CDSCO PDF → CSV data pipeline
│   ├── load_firestore.py         # CSV → Firestore uploader
│   ├── map.py                    # Nearby pharmacy map generator
│   ├── cdsco_clean.csv           # Cleaned NSQ medicine data
│   ├── firebase-key.json         # Firebase service account (DO NOT COMMIT)
│   ├── .env                      # API keys (DO NOT COMMIT)
│   ├── audio/                    # Generated audio files
│   └── templates/map.html        # Generated pharmacy map
│
├── frontend/
│   ├── package.json              # Wrapper npm scripts
│   └── aushadhi-app/
│       ├── package.json          # React app config
│       ├── public/
│       │   ├── index.html        # HTML entry point
│       │   ├── manifest.json     # PWA manifest
│       │   ├── logo192.png       # App icon (192×192)
│       │   └── logo512.png       # App icon (512×512)
│       └── src/
│           ├── App.js            # Router & page layout
│           ├── api.js            # Backend API helpers
│           ├── App.css           # Global styles & design system
│           ├── CameraCapture.js  # Camera component
│           ├── i18n/
│           │   ├── LanguageContext.js   # React context for language state
│           │   └── translations.js     # Kannada/English UI strings
│           ├── hooks/
│           │   └── useAshaSession.js   # ASHA session hook
│           └── pages/
│               ├── HomePage.js             # Landing page
│               ├── ScanPrescriptionPage.js # Prescription scanner
│               ├── MedVerificationPage.js  # Medicine verifier
│               ├── HealthChatPage.js       # AI health chatbot
│               ├── AshaLoginPage.js        # ASHA worker login
│               ├── AshaWorkerPage.js       # ASHA dashboard
│               ├── AshaHistoryPage.js      # Scan/verification history
│               └── NearestAshaPage.js      # Nearest ASHA locator
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 16+ |
| npm | 8+ |
| Firebase Project | Firestore enabled |
| OpenRouter API Key | Required ([get one here](https://openrouter.ai/keys)) |
| ElevenLabs API Key | Optional but recommended ([get one here](https://elevenlabs.io)) |

### 1. Clone the Repository

```bash
git clone https://github.com/ShankarKarajanagi18/Aushadi-Sathi.git
cd AushadhiSaathi
```

### 2. Backend Setup

```powershell
# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install flask flask-cors firebase-admin requests pdfplumber folium geopy gtts python-dotenv

# Create environment file
cd backend
```

Create `backend/.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
TTS_API_KEY=your_elevenlabs_api_key
FIREBASE_KEY_PATH=firebase-key.json
```

Place your Firebase service account JSON at `backend/firebase-key.json`.

```powershell
# Start the backend
python app.py
```

The Flask API will run at **http://localhost:5000**.

### 3. Frontend Setup

```powershell
cd frontend\aushadhi-app
npm install
npm start
```

The React app will run at **http://localhost:3000**.

---

## 🔌 API Endpoints

### Core APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Service info and route listing |
| `GET` | `/health` | Health check |
| `POST` | `/read-prescription` | Extract prescription data from image (bilingual) |
| `POST` | `/verify-medicine` | Verify medicine safety from packaging image |
| `POST` | `/speak` | Convert text to Kannada speech (base64 MP3) |
| `POST` | `/report-medicine` | Submit medicine safety report |
| `GET` | `/get-reports` | Fetch recent safety reports |

### ASHA Worker APIs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/asha/login` | Register/login ASHA worker |
| `GET` | `/asha/worker/<nhm_id>` | Get worker profile |
| `GET` | `/asha/dashboard` | Worker dashboard with recent activity |
| `POST` | `/asha/patients/upsert` | Create/update patient record |
| `GET` | `/asha/patients` | List patients |
| `POST` | `/asha/workflows/prescription-scan` | Scan prescription (ASHA workflow) |
| `POST` | `/asha/workflows/medicine-verify` | Verify medicine (ASHA workflow) |
| `POST` | `/asha/workflows/send-sms` | Queue SMS to patient |
| `GET` | `/asha/workflows/history` | Scan/verification history |
| `GET` | `/asha/workers/nearest` | Find nearest ASHA workers |

### AI Chatbot API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/assistant/chat` | AI health assistant (bilingual, OpenRouter-powered) |

### Example Request

```json
{
  "image": "base64_encoded_image_string",
  "language": "kn"
}
```

---

## 🌐 Bilingual Support

AushadhiSaathi supports **dynamic language switching** between English and Kannada:

- **UI Labels:** All buttons, headings, and labels toggle instantly via `LanguageContext`.
- **AI Explanations:** Both Kannada and English explanations are generated simultaneously during scan. Switching languages shows pre-cached results — no re-scan needed.
- **Voice Guidance:** Audio is generated using:
  - **ElevenLabs** `eleven_multilingual_v2` model for high-quality Kannada/English speech
  - **gTTS** as first fallback
  - **Google Translate TTS** as final fallback

---

## 📊 CDSCO Data Pipeline

### Extract NSQ Data from PDFs

```powershell
cd backend

# Process all PDFs in the backend folder
python extract_cdsco.py

# Or process a specific PDF
python extract_cdsco.py "CDSCO NSQ june25.pdf" cdsco_clean.csv
```

### Upload to Firestore

```powershell
python load_firestore.py
```

This uploads `cdsco_clean.csv` into the `nsq_medicines` Firestore collection for real-time batch verification.

---

## 🔧 Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ Yes | AI vision models for OCR + chatbot |
| `TTS_API_KEY` | 🔶 Recommended | ElevenLabs API key for high-quality multilingual TTS |
| `FIREBASE_KEY_PATH` | ✅ Yes | Path to Firebase service account JSON |
| `REACT_APP_API_BASE_URL` | ⬜ Optional | Override backend URL (default: `http://localhost:5000`) |

---

## 🛡️ Security Notes

> **⚠️ Never commit these files to version control:**
> - `backend/.env` (API keys)
> - `backend/firebase-key.json` (Firebase credentials)

- Rotate any exposed API keys immediately.
- Generated audio files in `backend/audio/` may contain patient-facing medical text — handle with care.
- The ASHA login system is session-based using `localStorage`. For production, implement proper authentication (e.g., Firebase Auth or OTP).

---

## 🧪 Testing

### Backend Scripts

```powershell
cd backend

# Test prescription reading
python prescription_reader.py test_prescription.jpeg

# Test medicine scanning
python medicine_scanner.py med10.jpeg

# Test Kannada TTS
python tts_kannada.py

# Test English TTS
python tts_english.py
```

### Frontend

```powershell
cd frontend/aushadhi-app
npm test
```

---

## 📱 Mobile App (PWA)

AushadhiSaathi is configured as a **Progressive Web App**. Users can install it directly from their mobile browser:

1. Open the app URL in Chrome on Android.
2. Tap the **"Add to Home Screen"** prompt (or use the browser menu → "Install app").
3. The app launches in full-screen mode like a native app.

For a native Android APK, consider wrapping the React build with [Capacitor](https://capacitorjs.com/).

---

## 🗺️ Roadmap

- [ ] Firebase Authentication (OTP-based login for ASHA workers)
- [ ] Offline mode with Service Worker caching
- [ ] Hindi and Tamil language support
- [ ] Native Android app via Capacitor
- [ ] Patient medication reminders (scheduled notifications)
- [ ] Dashboard analytics for PHC supervisors
- [ ] Integration with government health APIs (ABDM/ABHA)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ⚕️ Medical Disclaimer

> **AushadhiSaathi is an assistive tool, not a substitute for professional medical advice.** OCR and AI results can be inaccurate, especially with handwritten prescriptions or unclear medicine packaging. Always confirm medicines, dosages, timing, and safety concerns with a qualified doctor or pharmacist.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for India's rural healthcare workforce**

*AushadhiSaathi — ಔಷಧಿಸಾಥಿ — Your Medicine Companion*

</div>

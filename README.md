# 🏙️ Build for Bengaluru Hackathon — AushadhiSaathi (ಔಷಧಿಸಾಥಿ)
### 💊 AI-Powered Medicine Safety Assistant for Karnataka

---

## 📖 Project Overview




Every day in Bangalore or in India, patients leave government hospitals with prescriptions written in English they cannot read — and medicines that may be fake. Over 100 million Indians cannot understand their own prescription. 10% of medicines in India are substandard or counterfeit.
No consumer-facing tool exists to solve either problem. Poor patients — domestic workers, elderly, daily wage earners — take wrong doses, miss doses, or unknowingly consume fake medicines. Both problems silently worsen health outcomes for the people who can least afford it.

**AushadhiSaathi** ("Medicine Companion") is a free web app — no download, no login, works on any phone — that solves both problems in one flow:

**Prescription Reading** — Patient photographs their prescription → Gemini Vision reads it → spoken Kannada explanation: what the disease is, what each medicine does, when to take it, food rules, warning signs.

**Medicine Verification** — At the chemist, patient photographs the medicine packaging → batch number, expiry, hologram, and manufacturer are verified against India's official CDSCO NSQ database in seconds → speaks GREEN, YELLOW, or RED in Kannada. RED medicines can be reported with one tap, building a crowd-sourced map of counterfeit drug hotspots across Bengaluru.

**ASHA Worker Dashboard** — Dedicated login, patient management, medicine verification, prescription scanning, SMS reminders, and scan history — giving frontline health workers a free tool to serve their communities better.

Built for Bengaluru first, it works identically for any government hospital patient across Karnataka. Future language additions (Hindi, Telugu, Tamil) will extend it to all of India.

---

## 🗺️ Who We Build For

AushadhiSaathi is built for the people who visit hospitals in Bengaluru and across Karnataka — daily wage earners, domestic workers, elderly patients, pregnant women, farmers, and rural labourers. These are people who cannot read an English prescription, cannot tell if a medicine is genuine, and have no existing tool to help them. Here is how the app serves each of them:

- **Daily wage earners and domestic workers** in areas like Shivajinagar and Koramangala leave Victoria Hospital or Bowring Hospital with a prescription they cannot read. They take the wrong dose or skip doses entirely. AushadhiSaathi lets them photograph the prescription and hear a full explanation in Kannada — what the disease is, what each medicine does, when to take it, and what food to avoid.

- **Elderly patients** cannot tell if the medicine they just bought from the local chemist is genuine or counterfeit. They photograph the medicine packaging and hear GREEN, YELLOW, or RED in Kannada within seconds — before they pay or consume anything.

- **Families of pregnant women** are especially vulnerable to substandard medicines. The app verifies every batch against India's official CDSCO NSQ database and instantly locates the nearest ASHA worker if further help is needed.

- **ASHA workers** are the last mile of healthcare for millions of patients across Karnataka. Currently they have no tool to verify medicines before distributing them. The ASHA dashboard gives them a full workflow — verify medicine batches, scan prescriptions for patients, manage patient records, and send SMS medication reminders.

- **Farmers and labourers** in district towns like Mysuru, Hubballi, Belagavi, Tumakuru, and Raichur visit government hospitals and face the same English prescription problem. The Kannada voice flow works identically outside Bengaluru — any patient, any Karnataka district.

---

## 🛠️ Tech Stack

### Google Technologies *(core foundation)*

| Technology | How it's used |
|---|---|
| **Firebase Firestore** | Stores CDSCO NSQ medicine database, community RED reports, ASHA profiles, patient records, scan history |
| **Firebase Hosting** | Hosts the React PWA — zero cost, scalable |
| **Gemini API — Vision** | Reads prescription images and medicine packaging → structured JSON |
| **Gemini API — Text** | Generates Kannada and English explanations of prescriptions and safety verdicts |
| **Google Stitch** | Designed and generated the React frontend UI components |
| **Antigravity IDE** | Development environment used to build the project during the hackathon |
| **Google Flow** | Generated the project demo video |
| **Google TTS** | Converts Kannada and English explanations to natural speech |
| **Google Maps Platform** | Geo-tags RED medicine reports; powers the nearest ASHA worker locator |

### Additional Technologies

| Technology | Role |
|---|---|
| React 18 | Frontend framework |
| Python / Flask | Backend API |
| ElevenLabs TTS | High-quality Kannada voice (Google TTS as fallback) |
| pdfplumber | CDSCO PDF data extraction |

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.10+, Node.js 16+, npm 8+
- Firebase project with Firestore and Hosting enabled
- Gemini API key from [Google AI Studio](https://aistudio.google.com)

### 1. Clone

```bash
git clone https://github.com/ShankarKarajanagi18/Aushadi-Sathi.git
cd AushadhiSaathi
```

### 2. Backend

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .\.venv\Scripts\Activate.ps1
pip install flask flask-cors firebase-admin requests pdfplumber folium geopy gtts python-dotenv
```

Create `backend/.env`:

```env
OPENROUTER_API_KEY=your_gemini_api_key
TTS_API_KEY=your_elevenlabs_api_key    # optional
FIREBASE_KEY_PATH=firebase-key.json
```

Place your Firebase service account JSON at `backend/firebase-key.json`.

```bash
cd backend
python app.py                    # runs at http://localhost:5000
```

### 3. CDSCO Data Pipeline *(run once)*

```bash
cd backend
python extract_cdsco.py          # CDSCO PDFs → cdsco_clean.csv
python load_firestore.py         # CSV → Firebase Firestore nsq_medicines collection
```

### 4. Frontend

```bash
cd frontend/aushadhi-app
npm install
npm start                        # runs at http://localhost:3000
```

> ⚠️ Never commit `backend/.env` or `backend/firebase-key.json`.

---

## 🎬 Demo Video

Generated using **Google Flow** — walks through both core flows (prescription reading and medicine verification) with real app footage and Kannada voice output.

---

## 🔮 Future Improvements


. Combined with offline support for low-connectivity rural areas and integration with India's ABDM/ABHA health infrastructure, the goal is to make AushadhiSaathi useful for every low-income patient in the country.

---

## ⚕️ Medical Disclaimer

AushadhiSaathi is an assistive tool, not a substitute for professional medical advice. Always confirm medicines, dosages, and safety with a qualified doctor or pharmacist.

---

## 📂 Project Structure

```
AushadhiSaathi/
├── backend/
│   ├── app.py                    # Flask API — all routes
│   ├── config.py                 # Environment variable loader
│   ├── prescription_reader.py    # Prescription image → JSON (Gemini Vision)
│   ├── medicine_scanner.py       # Medicine packaging → JSON (Gemini Vision)
│   ├── verifier.py               # NSQ verification logic (Firestore lookup)
│   ├── kannada_explainer.py      # Kannada explanation generator (Gemini)
│   ├── english_explainer.py      # English explanation generator (Gemini)
│   ├── tts_kannada.py            # Kannada TTS (ElevenLabs + Google TTS fallback)
│   ├── tts_english.py            # English TTS
│   ├── extract_cdsco.py          # CDSCO PDF → CSV pipeline
│   ├── load_firestore.py         # CSV → Firebase Firestore uploader
│   ├── map.py                    # Bengaluru counterfeit hotspot map
│   └── cdsco_clean.csv           # Cleaned NSQ medicine data
│
└── frontend/aushadhi-app/
    └── src/
        ├── App.js                      # Router and layout
        ├── api.js                      # Backend API helpers
        ├── CameraCapture.js            # Camera component
        ├── i18n/
        │   ├── LanguageContext.js      # Kannada/English language state
        │   └── translations.js        # All UI strings in both languages
        └── pages/
            ├── HomePage.js             # Landing page
            ├── ScanPrescriptionPage.js # Prescription scanner
            ├── MedVerificationPage.js  # Medicine verifier
            ├── HealthChatPage.js       # AI health chatbot
            ├── AshaLoginPage.js        # ASHA worker login
            ├── AshaWorkerPage.js       # ASHA dashboard
            ├── AshaHistoryPage.js      # Scan history
            └── NearestAshaPage.js      # Nearest ASHA locator
```

---

<div align="center">

*AushadhiSaathi — ಔಷಧಿಸಾಥಿ — Your Medicine Companion*

**Built in 30 hours · Build for Bengaluru Hackathon · REVA University · April 2025**

</div>

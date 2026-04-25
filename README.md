# AushadhiSaathi

AushadhiSaathi is a full-stack medicine safety assistant. It helps users scan prescriptions, understand medicine instructions in Kannada, verify medicine packaging against known NSQ/spurious drug data, and generate voice guidance for easier patient use.

## Features

- Scan prescription images and extract medicine name, dose, timing, frequency, and duration.
- Generate Kannada medicine guidance from prescription results.
- Convert Kannada guidance to speech using ElevenLabs with fallback TTS options.
- Scan medicine labels or packaging to extract drug name, batch number, expiry date, manufacturer, and hologram status.
- Verify medicine batches against Firestore NSQ medicine data.
- Flag medicines as `GREEN`, `YELLOW`, or `RED` based on safety checks.
- Download a red-alert medicine report from the frontend.
- Load CDSCO/NSQ data from PDFs into CSV and Firestore.
- Generate a nearby pharmacy map for Bangalore using OpenStreetMap/Nominatim.

## Tech Stack

**Backend**

- Python
- Flask
- Flask-CORS
- Firebase Admin SDK / Firestore
- OpenRouter vision models for prescription and medicine image parsing
- ElevenLabs, gTTS, and Google Translate TTS fallback for Kannada audio
- pdfplumber for CDSCO PDF extraction
- folium and geopy for pharmacy map generation

**Frontend**

- React
- Create React App
- Browser camera APIs
- Fetch API for backend calls

## Project Structure

```text
AushadhiSaathi/
+-- backend/
|   +-- app.py                    # Flask API server
|   +-- config.py                 # Environment variable loading
|   +-- prescription_reader.py    # Prescription image extraction
|   +-- medicine_scanner.py       # Medicine package image extraction
|   +-- verifier.py               # Firestore-based medicine verification
|   +-- kannada_explainer.py      # Kannada guidance generation
|   +-- tts_kannada.py            # Kannada text-to-speech
|   +-- extract_cdsco.py          # Extract CDSCO PDF tables to CSV
|   +-- load_firestore.py         # Upload cleaned NSQ data to Firestore
|   +-- map.py                    # Generate nearby pharmacy map
|   +-- cdsco_clean.csv           # Cleaned medicine safety data
|   +-- audio/                    # Generated audio files
|   +-- templates/map.html        # Generated pharmacy map
+-- frontend/
|   +-- package.json              # Wrapper scripts
|   +-- aushadhi-app/
|       +-- package.json          # React app dependencies and scripts
|       +-- src/
|           +-- App.js
|           +-- CameraCapture.js
|           +-- features/
+-- README.md
```

## Prerequisites

- Python 3.10 or newer
- Node.js and npm
- Firebase project with Firestore enabled
- OpenRouter API key
- Optional: ElevenLabs API key for primary Kannada TTS

## Backend Setup

1. Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install backend dependencies:

```powershell
pip install flask flask-cors firebase-admin requests pdfplumber folium geopy gtts
```

3. Create `backend/.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
TTS_API_KEY=your_elevenlabs_api_key
FIREBASE_KEY_PATH=firebase-key.json
```

4. Place your Firebase service account JSON at:

```text
backend/firebase-key.json
```

5. Start the backend:

```powershell
cd backend
python app.py
```

The Flask API runs at:

```text
http://localhost:5000
```

## Frontend Setup

1. Install dependencies:

```powershell
cd frontend\aushadhi-app
npm install
```

2. Optional: create `frontend/aushadhi-app/.env` if the API is not running on the default URL:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

3. Start the React app:

```powershell
npm start
```

The frontend usually runs at:

```text
http://localhost:3000
```

You can also run the wrapper script from `frontend/`:

```powershell
cd frontend
npm start
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Backend service info and route list |
| `GET` | `/health` | Health check |
| `POST` | `/read-prescription` | Accepts a base64 image and returns extracted prescription data, Kannada explanation, and optional audio |
| `POST` | `/verify-medicine` | Accepts a base64 medicine image and returns scan data plus safety verdict |
| `POST` | `/speak` | Converts Kannada text to base64 MP3 audio |
| `POST` | `/report-medicine` | Saves a user medicine report to Firestore |
| `GET` | `/get-reports` | Fetches recent medicine reports from Firestore |

### Example Request Body

```json
{
  "image": "base64_encoded_image_without_data_url_prefix"
}
```

## Data Workflow

### Extract CDSCO PDF Data

Run this from the backend folder to process all PDFs in `backend/` and write `cdsco_clean.csv`:

```powershell
cd backend
python extract_cdsco.py
```

Process a single PDF:

```powershell
python extract_cdsco.py "CDSCO NSQ june25.pdf" cdsco_clean.csv
```

### Load NSQ Data Into Firestore

```powershell
cd backend
python load_firestore.py
```

This uploads rows from `cdsco_clean.csv` into the `nsq_medicines` Firestore collection.

## Useful Scripts

Backend:

```powershell
python app.py
python prescription_reader.py test_prescription.jpeg
python medicine_scanner.py med10.jpeg
python extract_cdsco.py
python load_firestore.py
python map.py
```

Frontend:

```powershell
npm start
npm run build
npm test
```

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Yes | Used for image-to-text prescription and medicine scanning |
| `TTS_API_KEY` | Optional | ElevenLabs API key for primary Kannada TTS |
| `FIREBASE_KEY_PATH` | Yes | Path to Firebase service account JSON |
| `REACT_APP_API_BASE_URL` | Optional | React app backend URL |

## Security Notes

- Do not commit `backend/.env`.
- Do not commit `backend/firebase-key.json`.
- Rotate any exposed API keys or Firebase service account keys.
- Generated audio files in `backend/audio/` may contain patient-facing medical text and should be handled carefully.

## Medical Disclaimer

AushadhiSaathi is an assistive tool. OCR and AI results can be wrong, especially with handwritten prescriptions or unclear medicine packaging. Users should always confirm medicines, dose, timing, and safety concerns with a qualified doctor or pharmacist.

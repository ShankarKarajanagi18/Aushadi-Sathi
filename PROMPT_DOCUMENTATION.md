# AushadhiSaathi (ಔಷಧಿಸಾಥಿ) — Complete Prompt & Engineering Documentation
> **AI-Powered Medicine Safety & Prescription Assistant for Rural & Semi-Urban India**  
> *From Initial Concept to Production-Ready Healthcare Platform*

---

## Document Overview & Conventions
This document is a comprehensive, chronological record of every prompt, architectural decision, failure, and iteration across the entire lifecycle of **AushadhiSaathi**. It is prepared for technical and job assessments to showcase hands-on prompt engineering, system design, error recovery, and end-to-end product implementation.

### Prompt Notation
- **`[Original Prompt]`**: Quoted word-for-word from workspace history and agent interaction logs.
- **`[Reconstructed from code]`**: Accurately reconstructed from the codebase for features built during initial exploratory design iterations where raw chat logs were not preserved. These are clearly marked and never misrepresented as original prompt logs.

---

## Table of Contents
1. [Project Summary](#1-project-summary)
   - [Problem Statement](#problem-statement)
   - [Target Users & Context](#target-users--context)
   - [Full Technology Stack](#full-technology-stack)
   - [AI Tools & Why Each Was Chosen](#ai-tools--why-each-was-chosen)
2. [Phase 1: Foundation (Architecture & Core Infrastructure)](#2-phase-1-foundation)
   - [1.1 Project Idea & Architecture Prompt](#11-project-idea--architecture-prompt)
   - [1.2 Flask Backend API Setup](#12-flask-backend-api-setup)
   - [1.3 Firebase Firestore Schema & DB Client](#13-firebase-firestore-schema--db-client)
   - [1.4 React PWA & Navigation Routing](#14-react-pwa--navigation-routing)
   - [1.5 Kannada & English i18n Localization](#15-kannada--english-i18n-localization)
3. [Phase 2: Core AI Features](#3-phase-2-core-ai-features)
   - [2.1 Prescription Reader (Image to JSON via Gemini Vision)](#21-prescription-reader-image-to-json-via-gemini-vision)
   - [2.2 Second-Pass Dose & Frequency Verification Prompt](#22-second-pass-dose--frequency-verification-prompt)
   - [2.3 Spoken Kannada & English Clinical Explainers](#23-spoken-kannada--english-clinical-explainers)
   - [2.4 Vernacular Text-to-Speech (TTS) Voice Engine](#24-vernacular-text-to-speech-tts-voice-engine)
   - [2.5 Medicine Packaging & Blister Pack Scanner](#25-medicine-packaging--blister-pack-scanner)
   - [2.6 CDSCO NSQ PDF Data Extraction Pipeline](#26-cdsco-nsq-pdf-data-extraction-pipeline)
   - [2.7 Three-Tier Medicine Safety Verification Logic (GREEN/YELLOW/RED)](#27-three-tier-medicine-safety-verification-logic-greenyellowred)
4. [Phase 3: Community & ASHA Worker Platform](#4-phase-3-community--asha-worker-platform)
   - [3.1 Crowd-Sourced RED Counterfeit Reporting & Hotspot Map](#31-crowd-sourced-red-counterfeit-reporting--hotspot-map)
   - [3.2 ASHA Worker Secure Login & Authentication](#32-asha-worker-secure-login--authentication)
   - [3.3 ASHA Dashboard & Clinical Workflow Management](#33-asha-dashboard--clinical-workflow-management)
   - [3.4 Patient Phone Management & Automatic Cloud Sync](#34-patient-phone-management--automatic-cloud-sync)
   - [3.5 Scan & Verification Audit History](#35-scan--verification-audit-history)
   - [3.6 Nearest ASHA Worker Locator with Haversine Geolocation](#36-nearest-asha-worker-locator-with-haversine-geolocation)
   - [3.7 Empathetic Health AI Chatbot with Medical Guardrails](#37-empathetic-health-ai-chatbot-with-medical-guardrails)
5. [Phase 4: Recent Improvements & Production Hardening](#5-phase-4-recent-improvements--production-hardening)
   - [4.1 Daily Dose Timetable & Drug-Drug Interaction Safety Engine](#41-daily-dose-timetable--drug-drug-interaction-safety-engine)
   - [4.2 Full Hindi Language Expansion](#42-full-hindi-language-expansion)
   - [4.3 End-to-End System Audit & Bug Identification](#43-end-to-end-system-audit--bug-identification)
   - [4.4 Live Firestore Connection & Authentication Diagnostics](#44-live-firestore-connection--authentication-diagnostics)
   - [4.5 Human-Centered Health Chat Greeting & Suggestion Chips](#45-human-centered-health-chat-greeting--suggestion-chips)
   - [4.6 Multilingual ASHA Dashboard & Reactive SMS Preview Regeneration](#46-multilingual-asha-dashboard--reactive-sms-preview-regeneration)
6. [Every Prompt Deep-Dive: Lifecycle & Iterations](#6-every-prompt-deep-dive-lifecycle--iterations)
7. [Prompt Engineering Techniques I Used](#7-prompt-engineering-techniques-i-used)
   - [Technique 1: Structured JSON Output Enforcement](#technique-1-structured-json-output-enforcement)
   - [Technique 2: Clinical Safety Guardrails & Conservative Fallbacks](#technique-2-clinical-safety-guardrails--conservative-fallbacks)
   - [Technique 3: Step-by-Step Task & Context Constraints](#technique-3-step-by-step-task--context-constraints)
   - [Technique 4: "Don't Change Other Flows" Scoped Refactoring](#technique-4-dont-change-other-flows-scoped-refactoring)
   - [Technique 5: In-Band Automated & Headless Verification](#technique-5-in-band-automated--headless-verification)
8. [Challenges and How I Solved Them](#8-challenges-and-how-i-solved-them)
   - [Challenge 1: Mock vs Live Firestore Dual-Mode Integration](#challenge-1-mock-vs-live-firestore-dual-mode-integration)
   - [Challenge 2: Hardcoded Language Defaults Overriding User Selection](#challenge-2-hardcoded-language-defaults-overriding-user-selection)
   - [Challenge 3: Developer & Diagnostic Jargon Leaking to Users](#challenge-3-developer--diagnostic-jargon-leaking-to-users)
   - [Challenge 4: Handwriting OCR Noise & Hallucinated Doses](#challenge-4-handwriting-ocr-noise--hallucinated-doses)
   - [Challenge 5: Windows `firebase-key.json.json` Extension Bug](#challenge-5-windows-firebase-keyjsonjson-extension-bug)

---

## 1. Project Summary

### Problem Statement
In government and district hospitals across Karnataka and broader India, over 100 million low-income patients leave clinics every day holding paper prescriptions written in English medical handwriting that they cannot read. Furthermore, regulatory investigations by the Central Drugs Standard Control Organisation (CDSCO) reveal that up to 10% of drugs in the supply chain are Not of Standard Quality (NSQ) or spurious. Low-income patients—domestic workers, construction laborers, rural farmers, and the elderly—often take incorrect dosages, combine incompatible pills, miss critical antibiotics, or consume counterfeit drugs. Frontline healthcare workers (ASHA workers) lacked any unified, digital tool to verify drug packages, manage patient medication regimens, and dispatch vernacular SMS alerts.

### Target Users & Context
1. **Daily Wage Earners & Domestic Workers**: Illiterate in English or medical terminology; require audio guidance in simple Kannada or Hindi explaining what each pill is for and when to swallow it.
2. **Rural Elderly & Chronic Patients**: Managing hypertension or diabetes; unable to read tiny expiration dates and lot numbers on foil strips; vulnerable to expired medicines.
3. **Mothers & Families of Vulnerable Patients**: Need immediate verification before administering pediatric or maternal pharmaceuticals.
4. **Frontline ASHA Workers (Accredited Social Health Activists)**: Community liaisons who require a mobile station to scan prescriptions, verify batch authenticity against government databases, track patient history, and send vernacular instructions.

### Full Technology Stack
- **Frontend**: React 18 Single-Page PWA, Tailwind CSS & Vanilla CSS design tokens, Material Symbols, Context API i18n (`LanguageContext`).
- **Backend**: Python 3.10+, Flask REST API, Flask-CORS, python-dotenv, requests, pdfplumber.
- **Database & Cloud**: Google Cloud Firestore (collections: `nsq_medicines`, `asha_workers`, `patients`, `reports`, `asha_prescription_scans`, `asha_medicine_verifications`, `asha_messages`), Firebase Hosting.
- **AI & Vision Pipeline**: OpenRouter gateway targeting Google Gemini 2.5 Flash Vision, Gemini 2.5 Pro, and fallback models (`gpt-4o-mini`, `qwen2.5-vl`, `llama-3.2-vision`).
- **Voice / Speech**: Google Cloud Text-to-Speech (gTTS fallback) and ElevenLabs multilingual TTS.
- **Mapping & Geolocation**: OpenStreetMap / Nominatim, Folium, and Haversine mathematical distance calculation.

### AI Tools & Why Each Was Chosen
| AI Tool / Framework | Role in Platform | Why It Was Chosen |
|---|---|---|
| **Google Gemini Vision** | Prescription OCR & Packaging Vision | Chosen for state-of-the-art vision understanding on messy, unconstrained handwritten doctor handwriting and distorted blister pack typography under poor lighting. |
| **OpenRouter Gateway** | Multi-Model Routing & Resilience | Selected as a unified gateway to allow automated fallback across model families (Gemini Flash → Gemini Pro → Qwen → GPT-4o-mini) whenever free-tier rate limits or transient outages occur. |
| **Antigravity IDE** | Agentic Development Workspace | DeepMind’s agentic IDE enabled autonomous end-to-end pair programming: writing code, diagnosing logs, controlling headless browsers, and validating fixes synchronously. |
| **Google Stitch** | UI/UX Generation & Material Tokens | Used to generate clean, accessible, mobile-first layouts, color systems, and accessible components conforming to Material 3 design tokens. |
| **Google TTS & ElevenLabs** | Vernacular Audio Generation | High naturalness speech synthesis in Kannada, Hindi, and Indian-accented English, allowing semi-literate users to listen rather than read. |

---

## 2. Phase 1: Foundation

### 1.1 Project Idea & Architecture Prompt
*Context: Defining the core application architecture and system requirements.*

```text
[Reconstructed from code]
Act as a principal healthcare software architect. Design a mobile-first web application called AushadhiSaathi ("Medicine Companion") tailored for low-income patients and ASHA workers in Karnataka, India.

Core requirements:
1. Two distinct user paths: Public Patient mode (zero login, zero barrier) and ASHA Worker mode (NHM ID authentication).
2. Prescription reading: Photograph paper prescription -> extract clinical data -> generate Class-5 level spoken Kannada audio.
3. Medicine verification: Photograph medicine packaging -> extract batch number, expiry date, manufacturer, and hologram -> verify against CDSCO NSQ database -> return instant GREEN, YELLOW, or RED safety verdicts.
4. Backend: Lightweight Python Flask REST API with clean modular separation for OCR, explainers, verifier, and TTS.
5. Database: Google Cloud Firestore storing official CDSCO drug bans, ASHA worker profiles, patient rosters, and crowd-sourced counterfeit reports.
6. Frontend: Responsive React PWA with bilingual support (Kannada and English).
```
- **What it produced**: Clean two-tier architecture diagram, modular directory structure (`backend/` and `frontend/aushadhi-app/`), and defined JSON schemas between client and API.
- **What was wrong / limitations**: Initial plan assumed direct client-side Firestore access from browser, which presented security risks for API keys.
- **Follow-up prompt that fixed it**: Refactored architecture so that the React frontend communicated exclusively with the Flask backend, which authenticated with Firestore via Firebase Admin SDK service account credentials.

---

### 1.2 Flask Backend API Setup
*Context: Creating `backend/app.py` with CORS, routing, error handling, and audio persistence.*

```text
[Reconstructed from code]
Create a modular Flask application in backend/app.py that serves as the central API for AushadhiSaathi.
Include:
1. CORS configuration permitting cross-origin requests from the React dev server (http://localhost:3000) and Firebase Hosting.
2. Endpoints:
   - GET /health: Health check.
   - POST /read-prescription: Accepts base64 image; returns extracted prescription JSON, Kannada explanation, English explanation, and base64 audio.
   - POST /verify-medicine: Accepts base64 image; returns scanned packaging details and GREEN/YELLOW/RED verdict.
   - POST /report-medicine: Logs suspected counterfeit medicines with GPS coordinates to Firestore.
   - POST /speak: Accepts text and language ('kn', 'en', 'hi'); returns synthesized base64 MP3 audio.
3. Clean error-handling wrapper catching transient API timeouts and returning 400/500 JSON errors with descriptive messages.
```
- **What it produced**: Complete Flask REST API with endpoints, file decoding helpers, and tempfile lifecycle handlers.
- **What was wrong / limitations**: Audio files generated were held only in memory, causing repeated API calls on every audio replay.
- **Follow-up prompt that fixed it**: Added an `_save_audio_base64` utility saving MP3 files into `backend/audio/` with unique filenames, returning both the base64 payload and a static audio URI.

---

### 1.3 Firebase Firestore Schema & DB Client
*Context: Initializing `backend/firebase_db.py` to support both authenticated live mode and resilient mock mode.*

```text
[Reconstructed from code]
Implement backend/firebase_db.py to initialize Google Cloud Firestore.
Requirements:
1. Read service account key from FIREBASE_KEY_PATH specified in config.py.
2. If firebase-key.json is present and valid, initialize the official firebase_admin app and return the live Firestore client.
3. If the credential file is missing or invalid, do not crash. Instead, construct a fully functional in-memory MockFirestore client with collections, documents, stream(), get(), add(), and where() query chaining.
4. Pre-populate the mock database with representative CDSCO fake batches, test ASHA workers (KA123456, ASHA001), and sample patient records.
```
- **What it produced**: Dual-mode database layer that runs locally in zero-dependency mock mode while connecting seamlessly to live Google Cloud Firestore when credentials are provided.
- **What was wrong / limitations**: Initial mock queries did not support `.order_by("created_at", direction="DESCENDING")` or `.limit()`, causing dashboard sorting exceptions.
- **Follow-up prompt that fixed it**: Extended `MockQuery` class with Python-level lambda sorting on timestamps and slicing for `.limit()`.

---

### 1.4 React PWA & Navigation Routing
*Context: Setting up `frontend/aushadhi-app/src/App.js` with React Router.*

```text
[Reconstructed from code]
Build the root React application structure with react-router-dom v6 in frontend/aushadhi-app/src/App.js.
Routes required:
- /: HomePage with big accessible action cards for Prescription Reading, Medicine Verification, and ASHA Portal.
- /scan-prescription: Dedicated scanning interface with live camera feed and file upload options.
- /med-verification: Medicine packaging verification scanner.
- /health-chat: AI healthcare assistant chat.
- /asha-login: ASHA worker credential entry.
- /asha-worker: ASHA frontline worker dashboard.
- /asha-history: Complete audit log of community scans.
- /nearest-asha: GPS-based locator for local ASHA workers.
Ensure the layout is wrapped in a LanguageProvider for global state.
```
- **What it produced**: Clean declarative router, centralized layout containers, and shared navigation headers.
- **What was wrong / limitations**: Direct navigation between flows retained stale patient phone numbers or scan results in state.
- **Follow-up prompt that fixed it**: Tied session and patient caches to `localStorage` keys (`currentPatientPhone`, `ashaSession`), with lifecycle cleanup on logout.

---

### 1.5 Kannada & English i18n Localization
*Context: Implementing `LanguageContext.js`, `LanguageSwitcher.js`, and `translations.js`.*

```text
[Reconstructed from code]
Create a lightweight, dependency-free internationalization (i18n) system for React:
1. LanguageContext.js: Store active language ('en' | 'kn' | 'hi') with persistence in localStorage ('appLang'). Provide toggleLang and setLanguage actions.
2. translations.js: Dictionary of all UI strings with natural translations in English, Kannada (ಕನ್ನಡ), and Hindi (हिंदी).
3. LanguageSwitcher.js: Compact, pill-shaped toggle button placed in headers across all pages.
4. Support dynamic translation lookups: t(key) returning active language string with fallback to English.
```
- **What it produced**: Zero-dependency i18n system that allowed immediate client-side UI translation.
- **What was wrong / limitations**: Only switched static UI button labels; backend API calls still defaulted to sending hardcoded language flags.
- **Follow-up prompt that fixed it**: Exposed `useLang()` hook across all view components, injecting `language: lang` directly into every backend fetch payload.

---

## 3. Phase 2: Core AI Features

### 2.1 Prescription Reader (Image to JSON via Gemini Vision)
*Context: Developing `backend/prescription_reader.py` with multi-model vision routing.*

```text
[Reconstructed from code]
You are a helpful medical assistant for patients in India.
Read this prescription image carefully.
Extract and return JSON with exactly these fields:
{
  "medicines": [
    {
      "name": "medicine name",
      "dose": "dose amount",
      "frequency": "how many times per day",
      "timing": "before food / after food / with food",
      "duration": "how many days"
    }
  ],
  "diagnosis": "what condition if mentioned",
  "doctor_notes": "any special instructions"
}
Important medicine extraction rules:
- Extract every distinct medicine that is visible in the prescription.
- Do not merge separate medicines into one object.
- If multiple medicine lines are present, return one object per medicine.
- Preserve the medicine name exactly as visible, even if capitalization or spacing differs.
- Do not invent medicines that are not visible.
If handwritten, do your best to read it.
Critical dose extraction rules:
- Preserve exact visible quantity in dose (for example: "2 tablets", "1 tablet", "1/2 tablet", "5 ml").
- Never guess or default to "1" when dosage is not written. If uncertain, leave as "".
Return ONLY raw, valid JSON. Never include markdown code fences or backticks.
```
- **What it produced**: Clean JSON extraction with accurate medicine lists, diagnostic notes, and durations.
- **What was wrong / limitations**: Single-pass OCR occasionally hallucinated "1 tablet" for abbreviations like "OD" or missed frequency markings written as "1-0-1".
- **Follow-up prompt that fixed it**: Implemented a mandatory second-pass dose verification prompt (`_refine_with_dose_verification`).

---

### 2.2 Second-Pass Dose & Frequency Verification Prompt
*Context: Correcting OCR errors by focusing exclusively on dosage numbers.*

```text
[Reconstructed from code]
You are validating medicine dose extraction from a prescription image.
Given the initial JSON below, re-check ONLY dose/frequency/timing/duration fields from the image.

Rules:
- Preserve drug names exactly unless clearly wrong.
- For dose: copy visible quantity exactly (examples: "2 tablets", "1/2 tablet", "5 ml").
- Never default to "1" when not visible. If uncertain, use empty string "".
- Return valid JSON only in this schema:
{
  "medicines": [
    {"name": "", "dose": "", "frequency": "", "timing": "", "duration": ""}
  ],
  "diagnosis": "",
  "doctor_notes": ""
}

Initial JSON:
{initial_json_text}
```
- **What it produced**: Elimination of false-positive "1 tablet" defaults; correct preservation of pediatric liquid measurements (e.g., "5 ml twice daily").
- **What was wrong / limitations**: If the vision model returned markdown backticks (````json ... ````), standard `json.loads()` threw parsing errors.
- **Follow-up prompt that fixed it**: Created `_strip_markdown_fences(text)` regex sanitizer before invoking the JSON parser.

---

### 2.3 Spoken Kannada & English Clinical Explainers
*Context: Translating medical abbreviations (e.g., "Telma 40mg OD x 30d") into warm, spoken Kannada.*

```text
[Reconstructed from code]
Write a conversational Kannada explanation generator for patients in Karnataka.
Input: Prescription JSON with medicines, dosages, frequencies, and doctor notes.
Output: Spoken, friendly Kannada script structured as:
1. Warm greeting: "ನಮಸ್ಕಾರ, ವೈದ್ಯರು ನಿಮಗೆ ಕೆಲವು ಮಾತ್ರೆಗಳನ್ನು ನೀಡಿದ್ದಾರೆ..."
2. Condition explanation: Explain diagnosis in plain Kannada (e.g., "ರಕ್ತದೊತ್ತಡವನ್ನು ನಿಯಂತ್ರಣದಲ್ಲಿ ಇಡಲು").
3. Step-by-step instructions: Iterate through each medicine with its colloquial purpose, timing with respect to food, and course duration.
4. Critical safety precautions: What to do if a dose is missed (never take two tablets at once), warning signs (swelling, nausea, breathlessness), and reminder to complete the course.
```
- **What it produced**: Natural, culturally grounded spoken scripts that village elders and daily wage earners could instantly comprehend.
- **What was wrong / limitations**: Pure LLM generation occasionally transliterated brand names phonetically into Kannada characters in ways that chemists could not recognize.
- **Follow-up prompt that fixed it**: Implemented `_build_spoken_kannada_explanation` keeping drug brand names in clear Latin quotes (`'Telma 40mg OD'`) while surrounding instructions were fully localized into idiomatic Kannada.

---

### 2.4 Vernacular Text-to-Speech (TTS) Voice Engine
*Context: Building `tts_kannada.py` and `tts_english.py`.*

```text
[Reconstructed from code]
Create backend/tts_kannada.py and backend/tts_english.py to convert generated clinical explanations into audio files:
1. Primary engine: ElevenLabs API using expressive Indian/Kannada voice profiles for lifelike cadence.
2. Fallback engine: Google Text-to-Speech (gTTS) using language code 'kn' and 'en-in' if ElevenLabs API key is missing or quota is exhausted.
3. Encode generated MP3 audio as base64 string and return in JSON response for browser <audio> playback.
4. Save local copy in backend/audio/ directory for caching.
```
- **What it produced**: Fast audio synthesis returning base64 data URIs playable on any mobile browser without external players.
- **What was wrong / limitations**: Large base64 strings occasionally bloated HTTP response sizes when explanations were long.
- **Follow-up prompt that fixed it**: Added both inline base64 and cached file paths, allowing web clients to stream directly if desired.

---

### 2.5 Medicine Packaging & Blister Pack Scanner
*Context: Developing `backend/medicine_scanner.py` to extract manufacturing and security details.*

```text
[Reconstructed from code]
Look at this medicine packaging, strip, or box image carefully.
Find and extract the following information.

Return ONLY this JSON, nothing else, no markdown:
{
  "drug_name": "name of the medicine",
  "composition": "active ingredients. If not visible, infer based on recognizable drug_name",
  "batch_number": "batch or lot number — usually starts with letters like BN, Batch No, B.No",
  "expiry_date": "expiry date in MM/YYYY format",
  "manufacturer": "name of manufacturing company",
  "hologram_present": true or false,
  "purpose": "What this medicine is typically used for (1 short sentence)",
  "when_to_take": "General guidance on when to take this medicine (e.g. after food)",
  "side_effects": "Common side effects to watch out for",
  "kannada_purpose": "Same purpose translated to Kannada",
  "kannada_when_to_take": "Same guidance translated to Kannada",
  "kannada_side_effects": "Same side effects translated to Kannada"
}

For batch_number: look for text near words like "Batch", "B.No", "Lot", "Mfg Batch".
For expiry_date: look for "Exp", "Use before", "Expiry".
For hologram: look for any shiny sticker or security mark on packaging.
If you cannot find a field, use empty string "".
Return only valid JSON.
```
- **What it produced**: High-accuracy parsing of lot codes, expiry dates, and anti-counterfeiting security marks from real packaging photos.
- **What was wrong / limitations**: Batch numbers on blister packs are often stamped or debossed on silver foil, causing optical glare.
- **Follow-up prompt that fixed it**: Added regex search fallbacks looking for alphanumeric patterns adjacent to keywords "B.No", "LOT", and "BN".

---

### 2.6 CDSCO NSQ PDF Data Extraction Pipeline
*Context: Building `extract_cdsco.py` and `load_firestore.py` to ingest official government ban lists.*

```text
[Reconstructed from code]
Write an automated data pipeline to parse monthly CDSCO Not-of-Standard-Quality (NSQ) and Spurious Drug PDF bulletins into structured data.
1. Use pdfplumber to extract tables across multiple PDF documents in backend/.
2. Normalize table columns: drug_name, batch_number, manufacturer, reason_for_failure.
3. Account for shifting serial numbers (Sr. No.) that offset data columns.
4. Export cleaned dataset to backend/cdsco_clean.csv.
5. Create load_firestore.py to upload clean records to Google Cloud Firestore under the nsq_medicines collection, indexed by batch_number.
```
- **What it produced**: Processed 10+ official CDSCO PDF bulletins, loading over 1,000 flagged drug batches into Firestore.
- **What was wrong / limitations**: PDF table headers varied across monthly releases, with some tables having 4 columns and others 7.
- **Follow-up prompt that fixed it**: Implemented `_normalize_row()` with regex detection for serial numbers and merged remaining text into the `reason` field.

---

### 2.7 Three-Tier Medicine Safety Verification Logic (GREEN/YELLOW/RED)
*Context: Developing `backend/verifier.py` implementing the clinical decision tree.*

```text
[Reconstructed from code]
Write backend/verifier.py to evaluate scanned medicine packages against safety criteria:
Input: Scanned metadata dictionary (batch_number, expiry_date, hologram_present, drug_name).

Verification Tree:
1. Check 1 (Critical): Query Firestore 'nsq_medicines' where batch_number == batch. If match found -> status = RED, color = 🔴, reason = "This batch is in CDSCO's fake/substandard drug list".
2. Check 2 (Expiry): Parse expiry MM/YYYY. If current date > expiry -> status = RED, color = 🔴, reason = "Medicine has expired. Do not use."
3. Check 3 (Security): If hologram_present is False -> status = YELLOW, color = 🟡, reason = "Security hologram not found on packaging. Please exercise caution."
4. If all checks pass -> status = GREEN, color = 🟢, reason = "No issues found. Medicine is authentic and valid."
Provide plain-spoken explanations for each verdict in Kannada, English, and Hindi.
```
- **What it produced**: Deterministic, life-saving verification engine protecting patients before ingestion.
- **What was wrong / limitations**: Case sensitivity between scanned batch ("b.no: 123a") and database batch ("123A") caused false negatives.
- **Follow-up prompt that fixed it**: Normalized all batch numbers by stripping whitespace, removing punctuation, and converting to uppercase (`.strip().upper()`).

---

## 4. Phase 3: Community & ASHA Worker Platform

### 3.1 Crowd-Sourced RED Counterfeit Reporting & Hotspot Map
*Context: Enabling users to report counterfeit drugs and plotting community alerts in `map.py`.*

```text
[Reconstructed from code]
Implement community reporting for counterfeit drugs:
1. Endpoint POST /report-medicine: Accepts batch_number, drug_name, latitude, and longitude; saves to Firestore 'reports' collection with server timestamp.
2. Endpoint GET /get-reports: Fetches recent counterfeit drug reports.
3. backend/map.py: Generate an interactive Folium map centered on Bengaluru displaying verified counterfeit hotspots with red warning markers.
```
- **What it produced**: Interactive map and API logging geo-coordinates of substandard drug distribution points.
- **What was wrong / limitations**: If patient denied GPS permissions, coordinates defaulted to `null` and threw backend errors.
- **Follow-up prompt that fixed it**: Handled missing GPS gracefully by defaulting to city center coordinates (12.9716° N, 77.5946° E) with clear "approximate location" metadata.

---

### 3.2 ASHA Worker Secure Login & Authentication
*Context: Building `AshaLoginPage.js` and `/asha/login`.*

```text
[Reconstructed from code]
Build ASHA worker authentication in frontend/aushadhi-app/src/pages/AshaLoginPage.js and backend/app.py:
1. Validate National Health Mission ID (NHM ID, e.g., 'KA123456', 'ASHA001') and 10-digit mobile number.
2. Verify worker against Firestore 'asha_workers' collection.
3. Support worker registration if profile does not exist yet.
4. Save session in localStorage ('ashaSession') containing nhm_id, full_name, and village.
```
- **What it produced**: Secure login workflow tailored for accredited health workers across Karnataka districts.
- **What was wrong / limitations**: Workers typing lowercase NHM IDs failed authentication against uppercase records.
- **Follow-up prompt that fixed it**: Created `_normalize_nhm_id()` running `.strip().upper()` across all authentication queries.

---

### 3.3 ASHA Dashboard & Clinical Workflow Management
*Context: Implementing `AshaWorkerPage.js` as the command center for frontline visits.*

```text
[Reconstructed from code]
Design the ASHA Worker Dashboard (frontend/aushadhi-app/src/pages/AshaWorkerPage.js):
1. Display worker profile header with photo, name, NHM ID badge, and language switcher.
2. Prominent patient phone number input with live validation.
3. Dual action cards:
   - "Scan Prescription": Camera capture or image upload.
   - "Medicine Verification": Camera capture or image upload.
4. Display recent scanned medicine cards with dosages, frequency, and status badges.
5. "SMS Preview" section showing the patient explanation message.
6. "Send SMS to Patient" button calling POST /asha/workflows/send-sms.
```
- **What it produced**: Frontline dashboard consolidating patient records, scanning tools, and SMS workflows.
- **What was wrong / limitations**: Prescription scanning and verification buttons originally redirected away to separate pages, losing patient context upon return.
- **Follow-up prompt that fixed it**: Added hidden file inputs on the dashboard itself, allowing ASHA workers to capture or upload directly without leaving the screen.

---

### 3.4 Patient Phone Management & Automatic Cloud Sync
*Context: Upserting patient profiles to Firestore in `/asha/patients/upsert`.*

```text
[Reconstructed from code]
Create POST /asha/patients/upsert endpoint:
Accepts: nhm_id, phone (10 digits), and area/village.
Behavior:
- Normalize phone number by stripping non-digit characters.
- Query Firestore 'patients' document keyed by normalized phone.
- If patient exists, update last_seen_at and assigned ASHA worker.
- If patient is new, create profile.
- Return success and link subsequent scans to this patient.
```
- **What it produced**: Reliable patient roster linked directly to local ASHA workers.
- **What was wrong / limitations**: Trailing spaces or hyphens in phone numbers created duplicate records.
- **Follow-up prompt that fixed it**: Enforced `_normalize_phone()` regex replacing all `\D` non-digits and validating `len == 10`.

---

### 3.5 Scan & Verification Audit History
*Context: Implementing `AshaHistoryPage.js` and `/asha/workflows/history`.*

```text
[Reconstructed from code]
Build a comprehensive scan audit history for ASHA workers:
1. Endpoint GET /asha/workflows/history: Returns sorted recent prescription scans and medicine verifications filtered by nhm_id and optional patient_phone.
2. Frontend page AshaHistoryPage.js: Displays timestamped cards showing drug name, dosage, frequency, status badge (GREEN/YELLOW/RED or Rx), and associated patient phone.
```
- **What it produced**: Transparent clinical audit trail for tracking prescribed drugs and counterfeit alerts.
- **What was wrong / limitations**: Firestore compound queries required manual composite indexes that threw errors in development.
- **Follow-up prompt that fixed it**: Queried collections by `nhm_id` and performed client-side/in-memory timestamp sorting via `_sorted_firestore_docs()`.

---

### 3.6 Nearest ASHA Worker Locator with Haversine Geolocation
*Context: Developing `NearestAshaPage.js` and `/asha/workers/nearest`.*

```text
[Reconstructed from code]
Create a location-based service to help patients find their nearest active ASHA worker:
1. Implement Haversine formula in Python (_distance_km) calculating great-circle distance between user GPS (lat, lng) and worker locations.
2. Endpoint GET /asha/workers/nearest: Accepts lat, lng, area, and limit; returns active workers sorted by distance in kilometers.
3. Frontend page NearestAshaPage.js: Prompts for device geolocation, displays nearest workers with phone numbers, village names, and direct call buttons.
```
- **What it produced**: Vital community bridge connecting isolated rural patients with their nearest health advocate.
- **What was wrong / limitations**: In desktop testing without GPS sensors, the page stalled waiting for browser location permission.
- **Follow-up prompt that fixed it**: Added fallback village/area dropdown search allowing patients to find workers by typing their taluk or village name.

---

### 3.7 Empathetic Health AI Chatbot with Medical Guardrails
*Context: Developing `HealthChatPage.js` and OpenRouter chat completions in `backend/app.py`.*

```text
[Reconstructed from code]
You are AushadhiSaathi, a helpful and empathetic rural healthcare assistant in India.
Your role is to assist patients and ASHA workers with medicine timing, side effects, and basic health guidance.
Keep your answers safe, concise (2-3 short paragraphs maximum), and very easy to understand.
If there is a severe symptom or emergency, strongly advise contacting a doctor or going to the nearest hospital immediately.
CRITICAL REQUIREMENT: You MUST respond completely in {lang_name} (English, Kannada, or Hindi). Do NOT use any other language.
Never invent dosages. Never diagnose diseases. Emphasize that you are an AI assistant and not a medical doctor.
```
- **What it produced**: Safe, conversational vernacular guidance answering everyday patient questions regarding food timings and forgotten doses.
- **What was wrong / limitations**: When LLM calls timed out, users saw blank message bubbles or developer stack traces.
- **Follow-up prompt that fixed it**: Created `_rule_based_health_reply()` fallback answering common queries (Metformin, Paracetamol, side effects, pregnancy) without crashing.

---

## 5. Phase 4: Recent Improvements & Production Hardening

### 4.1 Daily Dose Timetable & Drug-Drug Interaction Safety Engine
*Context: Building `schedule_builder.py` and `DoseScheduleSection.js`.*

```text
[Reconstructed from code]
You are an expert clinical pharmacist AI for rural health patients in India.
Your task is to organize prescribed medicines into a strict 3-column daily schedule (morning, afternoon, night),
perform a clinical drug interaction safety check (risk: low, medium, or high), and provide safety warnings.
You must respond with ONLY raw, valid JSON. Never include markdown code fences, backticks, or outside conversational text.

STRICT OUTPUT FORMAT:
{
  "schedule": {
    "morning": [{"medicine": "", "dose": "", "food": "before food|after food|with food|unsure, ask your pharmacist", "instruction": ""}],
    "afternoon": [...],
    "night": [...]
  },
  "interactions": [{"medicines": ["Med A", "Med B"], "risk": "low|medium|high", "note": ""}],
  "warnings": [""]
}

Rules:
- Say "unsure, ask your pharmacist" rather than guess unknown food timings.
- Never invent medicines not present in the input.
- Validate output schema and fall back to deterministic rule engine if LLM fails.
```
- **What it produced**: Visual morning-afternoon-night medication schedule with food instruction icons and drug-interaction warnings.
- **What was wrong / limitations**: Frontend expected timetable under both keys `schedule` and `timetable`, causing empty tables when keys mismatched.
- **Follow-up prompt that fixed it**: Added `"timetable": schedule_result.get("schedule", {})` alias in `backend/app.py`.

---

### 4.2 Full Hindi Language Expansion
*Context: Adding `hindi_explainer.py`, `tts_hindi.py`, and Hindi translations across UI.*

```text
[Reconstructed from code]
Expand AushadhiSaathi with complete Hindi language support across all features:
1. backend/hindi_explainer.py: Simple, Class-5 friendly spoken Hindi explanation generator for prescriptions and schedules.
2. backend/tts_hindi.py: Hindi TTS synthesis using ElevenLabs with gTTS ('hi') fallback.
3. translations.js: Complete Hindi translation dictionary for all UI buttons, headings, error banners, and navigation items.
4. Support 3-way language toggle: EN | ಕನ್ನಡ | हिंदी across all pages.
```
- **What it produced**: Seamless trilingual support catering to both South Indian (Kannada) and North Indian (Hindi) linguistic populations.
- **What was wrong / limitations**: Some Hindi explanations used heavy Sanskritized medical terminology unfamiliar to rural speakers.
- **Follow-up prompt that fixed it**: Refined vocabulary to everyday conversational terms (e.g., using "दवा" instead of "औषधि", "भोजन के बाद" instead of "अन्नोपरांत").

---

### 4.3 End-to-End System Audit & Bug Identification
*Context: Comprehensive QA audit prompt executed on October 28, 2026.*

```text
[Original Prompt]
Test AushadhiSaathi end to end and report what works and what is broken. Do not rewrite features. Only fix small bugs, and list every change you make.

Setup:
1. Check that backend/.env has the API keys and that .env is gitignored.
2. Start the Flask backend and the React frontend. Report any startup errors.

Test each flow and give PASS/FAIL with the exact error for failures:
1. Prescription flow: use a sample prescription image (or create a dummy one). Check image upload, extraction JSON, Kannada explanation, English explanation, and TTS audio playback.
2. Medicine verification flow: test one medicine in the CDSCO/Firestore data and one that isn't. Check the GREEN / YELLOW / RED result and the spoken verdict.
3. Report a RED medicine and check that it is saved.
4. ASHA flow: login, add a patient, scan history, nearest ASHA page.
5. Health chat: send 2 messages in English and 2 in Kannada.
6. Language switch between Kannada and English (and Hindi/schedule if implemented).
7. Edge cases: blurry image, non-prescription image, empty upload, API key failure. The app should show a friendly error and not crash.

Also check for hardcoded keys, console errors, and mobile layout at 390px width.

Finish with a table: feature | status | issue | fix applied. Then list the top 5 remaining problems in order of priority.
```
- **What it produced**: Complete automated test report identifying passing flows, mock Firestore state, developer strings in chat, and ASHA dashboard language persistence issues.
- **What was wrong / limitations**: Discovered that `app.py` was running in mock database mode because `firebase-key.json` was not active.
- **Follow-up prompt that fixed it**: User provided credentials to link the live Google Cloud Firestore instance.

---

### 4.4 Live Firestore Connection & Authentication Diagnostics
*Context: Verifying real database connection after providing credentials.*

```text
[Original Prompt]
it is connect to Firestore or not
```
Followed by:
```text
[Original Prompt]
is this correct
is i added
```
- **What it produced**: Diagnostic verification confirming that `backend/firebase-key.json` authenticated with live Google Cloud project `aushadhi-saathi` and `is_mock_db` evaluated to `False`.
- **What was wrong / limitations**: Windows File Explorer had automatically renamed the uploaded credential file to `firebase-key.json.json` because file extensions were hidden.
- **Follow-up prompt that fixed it**: Executed PowerShell `Move-Item` to rename `firebase-key.json.json` to `firebase-key.json`, re-triggering clean authentication.

---

### 4.5 Human-Centered Health Chat Greeting & Suggestion Chips
*Context: Eliminating developer jargon and adding tappable prompts.*

```text
[Original Prompt]
In HealthChatPage.js, the first bot message says "Namaskara. I am connected to the live backend now. Ask any medicine or dosage question." Replace it:

1. Remove all mentions of backend/connection status from user-facing text.
2. Move the greeting into translations.js with keys for Kannada, English and Hindi, and make the chat use the selected language (and update it if the language is switched before the first message).
3. Use short, warm, plain wording, for example:
   - EN: "Namaskara! I'm your medicine helper. Ask me about your medicines, doses, or food rules. I'm not a doctor, so for emergencies please visit a hospital."
   - KN and HI: natural, simple equivalents, not word-for-word translations.
4. Add 3 tappable suggestion chips under the greeting, such as "When should I take my tablet?", "I missed a dose", "Can I take it after food?", also translated in all three languages.
5. Search the whole frontend for other developer-style strings (e.g. "backend", "mock", "debug", "test") shown to users and list them. Fix any you find.
Don't change any chat API logic.
```
- **What it produced**: Warm, empathetic greeting in `translations.js` (`welcomeMsg`), 3 interactive quick-tap suggestion chips, and complete removal of all technical developer terms across the codebase.
- **What was wrong / limitations**: Switching languages after chat had started originally retained the initial greeting in the previous language.
- **Follow-up prompt that fixed it**: Added reactive check updating the greeting message if no user interactions had taken place yet.

---

### 4.6 Multilingual ASHA Dashboard & Reactive SMS Preview Regeneration
*Context: Fixing hardcoded Kannada preview and enabling real-time language switching without rescanning.*

```text
[Original Prompt]
In AshaWorkerPage.js, the SMS preview and explanation always come out in Kannada, whatever language is selected in the app.

Fix it:
1. Pass the currently selected language (en / kn / hi) from LanguageContext when calling the prescription and medicine endpoints from this page.
2. In app.py, make sure those routes read that language and use the matching explainer (english_explainer, kannada_explainer, hindi_explainer) instead of defaulting to Kannada.
3. Build the SMS preview text from the explanation in the selected language only.
4. If the user changes language after scanning, regenerate the preview in the new language without needing a rescan.

Don't change any other flows. Test all three languages with the same prescription and show me the preview text for each.
```
- **What it produced**: Full multilingual workflow on `AshaWorkerPage.js`: selected language passed to backend; Firestore storing all 3 explanations; SMS preview built strictly from active language; and instant regeneration on language switch without rescanning.
- **What was wrong / limitations**: Historical scans previously saved to Firestore only had `kannada_explanation` in their document fields.
- **Follow-up prompt that fixed it**: Added automatic backfill enrichment in `/asha/workflows/history` and a dedicated `POST /asha/workflows/explain-prescription` endpoint generating missing language translations dynamically.

---

## 6. Every Prompt Deep-Dive: Lifecycle & Iterations

The following table documents the iterative lifecycle of prompts, illustrating how initial limitations were systematically diagnosed and resolved:

| Feature / Goal | Original / Reconstructed Prompt Summary | What It Produced | What Was Wrong / Failed | Follow-Up Fix Prompt & Resolution |
|---|---|---|---|---|
| **Prescription Vision Extraction** | Extract medicines, doses, frequencies, and notes from image into JSON (`[Reconstructed from code]`) | Parsed structured medicine list from handwritten prescription images | Vision model occasionally defaulted empty doses to "1" or hallucinated "1 tablet" for abbreviations | Implemented `_refine_with_dose_verification` second pass explicitly instructing model never to guess "1" |
| **Medicine Safety Verifier** | Verify packaging batch number against CDSCO NSQ records (`[Reconstructed from code]`) | Evaluated batch against ban database returning GREEN, YELLOW, or RED | Case sensitivity and leading spaces caused batch "B-104" to miss matching "B104" | Normalized batch strings via `.strip().upper()` and regex alphanumeric cleaner before Firestore lookup |
| **ASHA Worker Dashboard** | Render worker hub with prescription & med verification tools (`[Reconstructed from code]`) | Frontline workflow page with action cards and SMS preview | Action buttons navigated away from dashboard, losing active patient phone state | Added hidden `<input type="file">` refs on dashboard for direct, in-place uploading |
| **Health Chat Greeting** | "In HealthChatPage.js, the first bot message says 'Namaskara. I am connected to the live backend now...' Replace it..." (`[Original Prompt]`) | Empathetic greeting with 3 interactive suggestion chips | Switching language after mount did not update the welcome message | Added reactive `useEffect` watching `[lang]` updating unedited chat sessions |
| **ASHA Multilingual Preview** | "In AshaWorkerPage.js, the SMS preview and explanation always come out in Kannada... Fix it..." (`[Original Prompt]`) | SMS preview generated in selected language (`en`/`kn`/`hi`) | Older Firestore records lacked English and Hindi text fields | Created `_enrich_workflow_items` and `/asha/workflows/explain-prescription` backfill generator |

---

## 7. Prompt Engineering Techniques I Used

### Technique 1: Structured JSON Output Enforcement
- **Concept**: Language models naturally tend to wrap outputs in conversational introductions or markdown fences (````json ... ````). In an automated healthcare pipeline, non-JSON text causes fatal parsing crashes.
- **How I Applied It**: Enforced strict schemas with explicit zero-markdown instructions and programmatic sanitization wrappers.
- **Real Code Example** (from `backend/schedule_builder.py`):
```python
system_prompt = (
    "You are an expert clinical pharmacist AI for rural health patients in India. "
    "Your task is to organize prescribed medicines into a strict 3-column daily schedule (morning, afternoon, night), "
    "perform a clinical drug interaction safety check (risk: low, medium, or high), and provide safety warnings. "
    "You must respond with ONLY raw, valid JSON. Never include markdown code fences, backticks, or outside conversational text."
)
```

### Technique 2: Clinical Safety Guardrails & Conservative Fallbacks
- **Concept**: In medical software, hallucinating a dosage or omitting an emergency hospital warning can cause direct physical harm. Prompts must be strictly bounded to prevent the AI from acting as a prescribing physician.
- **How I Applied It**: Programmed explicit negative constraints: "Never guess dosage. If uncertain, state 'unsure, ask your pharmacist'. Never diagnose. For emergency symptoms, urge hospital visit immediately."
- **Real Code Example** (from `backend/app.py`):
```python
system_prompt = (
    "You are AushadhiSaathi, a helpful and empathetic rural healthcare assistant in India. "
    "Keep your answers safe, concise (2-3 short paragraphs maximum), and very easy to understand. "
    "If there is a severe symptom or emergency, strongly advise contacting a doctor or going to the nearest hospital immediately. "
    f"CRITICAL REQUIREMENT: You MUST respond completely in {lang_name}. Do NOT use any other language."
)
```

### Technique 3: Step-by-Step Task & Context Constraints
- **Concept**: Complex clinical reasoning degrades when an LLM is asked to perform OCR, dosage parsing, interaction cross-referencing, and multi-language translation all in a single prompt.
- **How I Applied It**: Decomposed the pipeline into discrete stages:
  1. *Stage 1*: Visual extraction to raw JSON (`prescription_reader.py`).
  2. *Stage 2*: Dosage validation pass (`_refine_with_dose_verification`).
  3. *Stage 3*: Clinical scheduling & interaction analysis (`schedule_builder.py`).
  4. *Stage 4*: Vernacular spoken translation (`kannada_explainer.py`, `hindi_explainer.py`).

### Technique 4: "Don't Change Other Flows" Scoped Refactoring
- **Concept**: When modifying an active system with multiple user roles, agents or developers can inadvertently alter working sibling endpoints or break UI contracts.
- **How I Applied It**: Used explicit constraint instructions in prompts ("Don't change any other flows", "Preserve existing chat API logic").
- **Real Code Example** (from Phase 4 user prompt):
> *"Don't change any other flows. Test all three languages with the same prescription and show me the preview text for each."*  
This ensured that patient scanning, emergency map reporting, and health chat remained completely stable while the ASHA dashboard was refactored.

### Technique 5: In-Band Automated & Headless Verification
- **Concept**: Prompt engineering is incomplete without deterministic verification. Simply inspecting code is insufficient to guarantee that an LLM followed formatting instructions.
- **How I Applied It**: Wrote automated test scripts (`test_schedule_feature.py`, `test_hindi_feature.py`) and utilized Antigravity’s `browser_subagent` to drive headless Chrome instances, capture DOM text, and record visual screenshots across language states.

---

## 8. Challenges and How I Solved Them

### Challenge 1: Mock vs Live Firestore Dual-Mode Integration
- **The Issue**: Developers testing without service account JSON files experienced server crashes upon startup. Later, when authenticating with Google Cloud, switching between environments risked data loss.
- **The Solution**: Built `backend/firebase_db.py` with an auto-detecting proxy pattern. It checks if `firebase-key.json` exists; if found, it connects via `firebase_admin.credentials.Certificate`; if absent, it transparently instantiates an in-memory `MockFirestore` database with identical chaining methods (`collection().where().stream()`).

### Challenge 2: Hardcoded Language Defaults Overriding User Selection
- **The Issue**: In `AshaWorkerPage.js`, the SMS preview and explanation always appeared in Kannada regardless of whether the user selected English or Hindi in the language switcher.
- **The Solution**:
  1. Updated `_process_prescription_image` in `backend/app.py` to accept `language` and call the matching explainer module.
  2. Updated Firestore persistence to store `explanation`, `english_explanation`, `kannada_explanation`, and `hindi_explanation` simultaneously.
  3. Added a reactive `useEffect` on `AshaWorkerPage.js` that listens to `lang` changes and regenerates the preview text in real-time without requiring the user to re-upload or re-scan the prescription image.

### Challenge 3: Developer & Diagnostic Jargon Leaking to Users
- **The Issue**: Diagnostic messages intended for internal debugging (e.g., `"Namaskara. I am connected to the live backend now"`, `"Mock DB active"`, `"Debug mode"`) were visible in user-facing health chat bubbles and headers.
- **The Solution**: Conducted a repository-wide string audit. Migrated all greetings to `translations.js` (`welcomeMsg`) with human, empathetic phrasing ("Namaskara! I'm your medicine helper..."), and added three quick-tap suggestion chips for intuitive mobile navigation.

### Challenge 4: Handwriting OCR Noise & Hallucinated Doses
- **The Issue**: Doctors' handwriting on prescription slips often featured rapid abbreviations (e.g., "1 tab TDS", "1/2 tab HS"). Standard vision prompts frequently hallucinated "1 tablet" or skipped frequency indications.
- **The Solution**: Introduced a dedicated two-pass verification architecture in `prescription_reader.py`: Pass 1 extracts general drug candidates; Pass 2 freezes drug names and focuses solely on numeric doses, fractions ("1/2"), and frequencies, falling back to clean empty strings rather than inaccurate defaults.

### Challenge 5: Windows `firebase-key.json.json` Extension Bug
- **The Issue**: On Windows operating systems with "Hide extensions for known file types" enabled, saving the service account key resulted in `firebase-key.json.json`. Python reported `FileNotFoundError: firebase-key.json`, causing the backend to silently fall back to mock mode.
- **The Solution**: Diagnosed the exact filesystem path using PowerShell terminal commands, executed a clean rename to `firebase-key.json`, and verified that `app.py` reloaded and printed `[Firebase] Successfully connected to Firestore`.

---

<div align="center">

**AushadhiSaathi (ಔಷಧಿಸಾಥಿ) — Healthcare for Everyone**  
*Built for Bengaluru & Karnataka · Scaled for India*

</div>

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import json
import math
import os
import re
import tempfile
import traceback
from datetime import datetime, timezone
from pathlib import Path

import firebase_admin
try:
    from firebase_admin import firestore
except ImportError:
    firestore = None
import requests

from config import FIREBASE_KEY_PATH, OPENROUTER_API_KEY
from firebase_db import init_db
from kannada_explainer import explain_in_kannada
from english_explainer import explain_in_english
from hindi_explainer import explain_in_hindi
from medicine_scanner import scan_medicine_label
from prescription_reader import read_prescription
from tts_kannada import text_to_kannada_speech
from tts_english import text_to_english_speech
from tts_hindi import text_to_hindi_speech
from verifier import verify_medicine
from schedule_builder import build_schedule, generate_schedule_summaries



app = Flask(__name__)
CORS(app)

db, is_mock_db = init_db(FIREBASE_KEY_PATH)


def _server_timestamp():
    if not is_mock_db and firestore:
        return firestore.SERVER_TIMESTAMP
    return datetime.now(timezone.utc).isoformat()


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _normalize_nhm_id(nhm_id):
    return str(nhm_id or "").strip().upper()


def _normalize_phone(phone):
    return re.sub(r"\D", "", str(phone or ""))


def _to_json_safe(value):
    if isinstance(value, dict):
        return {k: _to_json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_to_json_safe(v) for v in value]
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            return str(value)
    return value


def _save_audio_base64(audio_base64, prefix):
    audio_dir = Path(__file__).resolve().parent / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    audio_path = audio_dir / f"{prefix}_{timestamp}.mp3"
    audio_path.write_bytes(base64.b64decode(audio_base64))
    return str(audio_path)


def _save_temp_image(image_base64):
    image_bytes = base64.b64decode(image_base64)
    temp_file = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    try:
        temp_file.write(image_bytes)
        temp_file.flush()
        return temp_file.name
    finally:
        temp_file.close()


def _process_prescription_image(image_base64, language="en"):
    temp_path = _save_temp_image(image_base64)
    try:
        prescription_json = read_prescription(temp_path)
        prescription = json.loads(prescription_json)
        
        kannada_text = explain_in_kannada(prescription_json)
        english_text = explain_in_english(prescription_json)
        hindi_text = explain_in_hindi(prescription_json)
        
        lang_norm = str(language or "en").strip().lower()
        if lang_norm == "kn":
            explanation_text = kannada_text
            lang_prefix = "kannada"
        elif lang_norm == "hi":
            explanation_text = hindi_text
            lang_prefix = "hindi"
        else:
            explanation_text = english_text
            lang_prefix = "english"

        explanation_audio = None
        explanation_audio_error = None
        try:
            if lang_norm == "kn":
                explanation_audio = text_to_kannada_speech(explanation_text)
            elif lang_norm == "hi":
                explanation_audio = text_to_hindi_speech(explanation_text)
            else:
                explanation_audio = text_to_english_speech(explanation_text)
        except Exception as audio_error:
            explanation_audio_error = str(audio_error)

        explanation_audio_path = None
        explanation_audio_save_error = None
        if explanation_audio:
            try:
                explanation_audio_path = _save_audio_base64(explanation_audio, f"{lang_prefix}_explanation")
            except Exception as save_error:
                explanation_audio_save_error = str(save_error)

        return {
            "prescription": prescription,
            "explanation": explanation_text,
            "english_explanation": english_text,
            "kannada_explanation": kannada_text,
            "hindi_explanation": hindi_text,
            "explanation_audio": explanation_audio if lang_norm == "en" else None,
            "kannada_explanation_audio": explanation_audio if lang_norm == "kn" else None,
            "hindi_explanation_audio": explanation_audio if lang_norm == "hi" else None,
            "audio": explanation_audio,
            "audio_path": explanation_audio_path,
            "explanation_audio_path": explanation_audio_path if lang_norm == "en" else None,
            "kannada_explanation_audio_path": explanation_audio_path if lang_norm == "kn" else None,
            "hindi_explanation_audio_path": explanation_audio_path if lang_norm == "hi" else None,
            "explanation_audio_error": explanation_audio_error,
            "explanation_audio_save_error": explanation_audio_save_error,
            "language": lang_norm
        }
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)


def _process_medicine_verification(image_base64, language="en"):
    temp_path = _save_temp_image(image_base64)
    try:
        scan_json_string = scan_medicine_label(temp_path)
        scan_result = json.loads(scan_json_string)
        verdict = verify_medicine(scan_result)

        kannada_text = verdict.get('kannada', '')
        english_text = verdict.get('english', '')
        hindi_text = verdict.get('hindi', '')

        lang_norm = str(language or "en").strip().lower()
        if lang_norm == "kn":
            explanation_text = kannada_text
            lang_prefix = "kannada"
        elif lang_norm == "hi":
            explanation_text = hindi_text
            lang_prefix = "hindi"
        else:
            explanation_text = english_text
            lang_prefix = "english"
        
        explanation_audio = None
        explanation_audio_error = None
        if explanation_text:
            try:
                if lang_norm == "kn":
                    explanation_audio = text_to_kannada_speech(explanation_text)
                elif lang_norm == "hi":
                    explanation_audio = text_to_hindi_speech(explanation_text)
                else:
                    explanation_audio = text_to_english_speech(explanation_text)
            except Exception as audio_error:
                explanation_audio_error = str(audio_error)

        explanation_audio_path = None
        explanation_audio_save_error = None
        if explanation_audio:
            try:
                explanation_audio_path = _save_audio_base64(explanation_audio, f"{lang_prefix}_med_explanation")
            except Exception as save_error:
                explanation_audio_save_error = str(save_error)

        return {
            "scan_result": scan_result,
            "verdict": verdict,
            "explanation": explanation_text,
            "english_explanation": english_text,
            "kannada_explanation": kannada_text,
            "hindi_explanation": hindi_text,
            "explanation_audio": explanation_audio if lang_norm == "en" else None,
            "kannada_explanation_audio": explanation_audio if lang_norm == "kn" else None,
            "hindi_explanation_audio": explanation_audio if lang_norm == "hi" else None,
            "audio": explanation_audio,
            "audio_path": explanation_audio_path,
            "explanation_audio_path": explanation_audio_path if lang_norm == "en" else None,
            "kannada_explanation_audio_path": explanation_audio_path if lang_norm == "kn" else None,
            "hindi_explanation_audio_path": explanation_audio_path if lang_norm == "hi" else None,
            "explanation_audio_error": explanation_audio_error,
            "explanation_audio_save_error": explanation_audio_save_error,
            "language": lang_norm
        }
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)


def _distance_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None
    earth_radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(earth_radius_km * c, 2)


def _rule_based_health_reply(question):
    text = str(question or "").strip().lower()
    if not text:
        return "Please ask your health query in English or Kannada."
    if "metformin" in text:
        return "Metformin is usually taken with or after food to reduce stomach discomfort. Follow the exact dose advised by your doctor."
    if "paracetamol" in text:
        return "Paracetamol is commonly taken for fever or pain. Keep dose intervals and avoid exceeding prescribed daily limits."
    if "side effect" in text or "reaction" in text:
        return "If you notice severe side effects like breathing trouble, swelling, or persistent vomiting, seek immediate medical care."
    if "pregnan" in text:
        return "During pregnancy, avoid self-medication. Please consult a qualified doctor or your ASHA worker before taking medicines."
    return "I can help with dose timing, side effects, and basic medicine guidance. For emergencies, contact your nearest health worker immediately."


def _ask_openrouter(question, language="EN"):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    lang_upper = str(language or "EN").strip().upper()
    if lang_upper == "KN":
        lang_name = "Kannada"
    elif lang_upper == "HI":
        lang_name = "Hindi"
    else:
        lang_name = "English"

    
    system_prompt = (
        "You are AushadhiSaathi, a helpful and empathetic rural healthcare assistant in India. "
        "Your role is to assist patients and ASHA workers with medicine timing, side effects, and basic health guidance. "
        "Keep your answers safe, concise (2-3 short paragraphs maximum), and very easy to understand. "
        "If there is a severe symptom or emergency, strongly advise contacting a doctor or going to the nearest hospital immediately. "
        f"CRITICAL REQUIREMENT: You MUST respond completely in {lang_name}. Do NOT use any other language."
    )

    models_to_try = [
        "google/gemini-2.5-flash-8b",
        "google/gemini-2.5-flash",
        "openai/gpt-4o-mini",
        "meta-llama/llama-3-8b-instruct:free",
        "qwen/qwen2.5-72b-instruct:free"
    ]

    for model in models_to_try:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ]
        }
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=20)
            response.raise_for_status()
            data = response.json()
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            continue

    # Fallback to rule-based if all API calls fail
    return _rule_based_health_reply(question)


def _sorted_firestore_docs(docs, limit=10):
    rows = []
    for doc in docs:
        data = doc.to_dict() or {}
        rows.append({"id": doc.id, **_to_json_safe(data)})

    rows.sort(key=lambda item: item.get("created_at") or item.get("timestamp") or "", reverse=True)
    return rows[:limit]


def _list_endpoints():
    endpoints = {}
    for rule in app.url_map.iter_rules():
        if rule.endpoint == "static":
            continue
        methods = sorted([m for m in rule.methods if m not in {"HEAD", "OPTIONS"}])
        if not methods:
            continue
        if len(methods) > 1:
            endpoints[rule.endpoint] = f"{'/'.join(methods)} {rule.rule}"
        else:
            endpoints[rule.endpoint] = f"{methods[0]} {rule.rule}"
    return dict(sorted(endpoints.items()))


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "AushadhiSaathi backend",
        "status": "running",
        "time": _now_iso(),
        "endpoints": _list_endpoints(),
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "AushadhiSaathi backend is running!"})


@app.route("/read-prescription", methods=["POST"])
def read_prescription_api():
    try:
        data = request.get_json(silent=True) or {}
        image_base64 = data.get("image")
        language = str(data.get("language", "en")).strip()

        if not image_base64:
            return jsonify({"success": False, "error": "Missing image field"}), 400

        result = _process_prescription_image(image_base64, language=language)
        return jsonify({"success": True, **result})
    except Exception as error:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/api/schedule", methods=["POST"])
def schedule_api():
    try:
        data = request.get_json(silent=True) or {}
        prescription_input = data.get("prescription") or data.get("medicines") or data
        language = str(data.get("language", "en")).strip().lower()

        # Build schedule JSON with LLM / resilient fallback
        schedule_result = build_schedule(prescription_input)

        # Generate English, Kannada, and Hindi spoken summaries using explainer modules
        summaries = generate_schedule_summaries(schedule_result)
        summary_en = summaries.get("en", "")
        summary_kn = summaries.get("kn", "")
        summary_hi = summaries.get("hi", "")

        # Generate audio using existing TTS modules
        audio_en = None
        audio_kn = None
        audio_hi = None
        audio_error = None

        try:
            if language == "hi":
                audio_hi = text_to_hindi_speech(summary_hi)
                try:
                    audio_en = text_to_english_speech(summary_en)
                except Exception:
                    pass
            elif language == "kn":
                audio_kn = text_to_kannada_speech(summary_kn)
                try:
                    audio_en = text_to_english_speech(summary_en)
                except Exception:
                    pass
            else:
                audio_en = text_to_english_speech(summary_en)
                try:
                    audio_kn = text_to_kannada_speech(summary_kn)
                except Exception:
                    pass
        except Exception as tts_err:
            audio_error = str(tts_err)

        selected_audio = (
            audio_hi if language == "hi"
            else audio_kn if language == "kn"
            else audio_en
        )
        if not selected_audio:
            selected_audio = audio_hi or audio_kn or audio_en

        # Never log or store real patient data
        return jsonify({
            "success": True,
            "schedule": schedule_result.get("schedule", {}),
            "timetable": schedule_result.get("schedule", {}),
            "interactions": schedule_result.get("interactions", []),
            "warnings": schedule_result.get("warnings", []),
            "summary_en": summary_en,
            "summary_kn": summary_kn,
            "summary_hi": summary_hi,
            "audio_en": audio_en,
            "audio_kn": audio_kn,
            "audio_hi": audio_hi,
            "audio": selected_audio,
            "audio_error": audio_error,
            "language": language
        })
    except Exception as error:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(error)}), 500



@app.route("/verify-medicine", methods=["POST"])
def verify_medicine_api():
    try:
        data = request.get_json(silent=True) or {}
        image_base64 = data.get("image")
        language = str(data.get("language", "en")).strip()

        if not image_base64:
            return jsonify({"success": False, "error": "Missing image field"}), 400

        result = _process_medicine_verification(image_base64, language=language)
        return jsonify({"success": True, **result})
    except Exception as error:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/speak", methods=["POST"])
def speak():
    try:
        payload = request.get_json(silent=True) or {}
        text = payload.get("text")
        language = str(payload.get("language", "kn")).strip().lower()

        if not text:
            return jsonify({"success": False, "error": "Missing text"}), 400

        if language == "hi":
            audio_base64 = text_to_hindi_speech(text)
            lang_prefix = "hindi"
        elif language == "en":
            audio_base64 = text_to_english_speech(text)
            lang_prefix = "english"
        else:
            audio_base64 = text_to_kannada_speech(text)
            lang_prefix = "kannada"

        audio_path = None
        audio_save_error = None
        try:
            audio_path = _save_audio_base64(audio_base64, f"{lang_prefix}_tts_output")
        except Exception as save_error:
            audio_save_error = str(save_error)

        return jsonify({
            "success": True,
            "audio": audio_base64,
            "audio_path": audio_path,
            "audio_save_error": audio_save_error,
        })
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/report-medicine", methods=["POST"])
def report_medicine():
    try:
        data = request.get_json(silent=True) or {}
        db.collection("reports").add({
            "batch_number": str(data.get("batch_number", "")).strip(),
            "drug_name": str(data.get("drug_name", "")).strip(),
            "latitude": float(data.get("latitude") or 0),
            "longitude": float(data.get("longitude") or 0),
            "timestamp": _server_timestamp(),
        })
        return jsonify({"success": True, "message": "Report submitted"})
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/get-reports", methods=["GET"])
def get_reports():
    try:
        direction = firestore.Query.DESCENDING if firestore else "DESCENDING"
        docs = db.collection("reports").order_by("timestamp", direction=direction).limit(50).get()
        reports = [{"id": doc.id, **_to_json_safe(doc.to_dict())} for doc in docs]
        return jsonify({"success": True, "reports": reports})
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/asha/login", methods=["POST"])
def asha_login():
    try:
        data = request.get_json(silent=True) or {}
        full_name = str(data.get("full_name", "")).strip()
        nhm_id = _normalize_nhm_id(data.get("nhm_id"))
        phone = _normalize_phone(data.get("phone"))
        village = str(data.get("village", "")).strip()
        language = str(data.get("language", "EN")).strip().upper() or "EN"

        if not full_name or not nhm_id or len(phone) != 10:
            return jsonify({
                "success": False,
                "error": "full_name, nhm_id and a valid 10-digit phone are required",
            }), 400

        worker_ref = db.collection("asha_workers").document(nhm_id)
        existing = worker_ref.get()
        now = _server_timestamp()

        payload = {
            "full_name": full_name,
            "nhm_id": nhm_id,
            "phone": phone,
            "village": village,
            "language": language,
            "status": "active",
            "updated_at": now,
            "last_login_at": now,
        }
        if not existing.exists:
            payload["created_at"] = now

        worker_ref.set(payload, merge=True)

        db.collection("asha_sessions").add({
            "nhm_id": nhm_id,
            "phone": phone,
            "full_name": full_name,
            "login_at": now,
            "source": "web_html",
        })

        worker_doc = worker_ref.get().to_dict() or payload
        return jsonify({"success": True, "worker": _to_json_safe(worker_doc)})
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/asha/worker/<nhm_id>", methods=["GET"])
def get_asha_worker(nhm_id):
    try:
        worker_id = _normalize_nhm_id(nhm_id)
        doc = db.collection("asha_workers").document(worker_id).get()
        if not doc.exists:
            return jsonify({"success": False, "error": "Worker not found"}), 404
        return jsonify({"success": True, "worker": {"id": doc.id, **_to_json_safe(doc.to_dict())}})
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/asha/patients/upsert", methods=["POST"])
def upsert_patient():
    try:
        data = request.get_json(silent=True) or {}
        phone = _normalize_phone(data.get("phone"))
        nhm_id = _normalize_nhm_id(data.get("nhm_id"))
        if len(phone) != 10 or not nhm_id:
            return jsonify({"success": False, "error": "Valid phone and nhm_id are required"}), 400

        patient_ref = db.collection("patients").document(phone)
        patient_ref.set({
            "phone": phone,
            "name": str(data.get("name", "")).strip(),
            "gender": str(data.get("gender", "")).strip(),
            "age": data.get("age"),
            "area": str(data.get("area", "")).strip(),
            "notes": str(data.get("notes", "")).strip(),
            "last_updated_by": nhm_id,
            "last_updated_at": _server_timestamp(),
        }, merge=True)

        patient = patient_ref.get().to_dict() or {}
        return jsonify({"success": True, "patient": _to_json_safe(patient)})
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/asha/patients", methods=["GET"])
def get_patients():
    try:
        phone = _normalize_phone(request.args.get("phone"))
        limit = int(request.args.get("limit", 20))

        if phone:
            doc = db.collection("patients").document(phone).get()
            if not doc.exists:
                return jsonify({"success": True, "patients": []})
            return jsonify({"success": True, "patients": [{"id": doc.id, **_to_json_safe(doc.to_dict())}]})

        direction = firestore.Query.DESCENDING if firestore else "DESCENDING"
        docs = db.collection("patients").order_by("last_updated_at", direction=direction).limit(limit).stream()
        patients = [{"id": doc.id, **_to_json_safe(doc.to_dict())} for doc in docs]
        return jsonify({"success": True, "patients": patients})
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


def _enrich_workflow_items(scans, verifications):
    for item in scans:
        rx = item.get("prescription")
        if rx:
            rx_str = json.dumps(rx) if isinstance(rx, dict) else str(rx)
            try:
                if not item.get("english_explanation"):
                    item["english_explanation"] = explain_in_english(rx_str)
                if not item.get("kannada_explanation"):
                    item["kannada_explanation"] = explain_in_kannada(rx_str)
                if not item.get("hindi_explanation"):
                    item["hindi_explanation"] = explain_in_hindi(rx_str)
                if not item.get("explanation"):
                    item_lang = str(item.get("language") or "en").lower()
                    if item_lang == "kn":
                        item["explanation"] = item["kannada_explanation"]
                    elif item_lang == "hi":
                        item["explanation"] = item["hindi_explanation"]
                    else:
                        item["explanation"] = item["english_explanation"]
            except Exception as e:
                pass

    for item in verifications:
        verdict = item.get("verdict") or {}
        if not item.get("english_explanation"):
            item["english_explanation"] = verdict.get("english") or item.get("explanation") or ""
        if not item.get("kannada_explanation"):
            item["kannada_explanation"] = verdict.get("kannada") or ""
        if not item.get("hindi_explanation"):
            item["hindi_explanation"] = verdict.get("hindi") or ""
        if not item.get("explanation"):
            item_lang = str(item.get("language") or "en").lower()
            if item_lang == "kn":
                item["explanation"] = item["kannada_explanation"]
            elif item_lang == "hi":
                item["explanation"] = item["hindi_explanation"]
            else:
                item["explanation"] = item["english_explanation"]


@app.route("/asha/dashboard", methods=["GET"])
def asha_dashboard():
    try:
        nhm_id = _normalize_nhm_id(request.args.get("nhm_id"))
        if not nhm_id:
            return jsonify({"success": False, "error": "nhm_id is required"}), 400

        worker_doc = db.collection("asha_workers").document(nhm_id).get()
        if not worker_doc.exists:
            return jsonify({"success": False, "error": "Worker not found"}), 404

        recent_scans_raw = db.collection("asha_prescription_scans").where("nhm_id", "==", nhm_id).limit(50).stream()
        recent_verifications_raw = db.collection("asha_medicine_verifications").where("nhm_id", "==", nhm_id).limit(50).stream()
        recent_messages_raw = db.collection("asha_messages").where("nhm_id", "==", nhm_id).limit(50).stream()

        scans = _sorted_firestore_docs(recent_scans_raw, limit=5)
        verifications = _sorted_firestore_docs(recent_verifications_raw, limit=5)
        _enrich_workflow_items(scans, verifications)

        dashboard = {
            "worker": {"id": worker_doc.id, **_to_json_safe(worker_doc.to_dict())},
            "recent_prescription_scans": scans,
            "recent_medicine_verifications": verifications,
            "recent_messages": _sorted_firestore_docs(recent_messages_raw, limit=5),
        }
        return jsonify({"success": True, "dashboard": dashboard})
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/asha/workflows/prescription-scan", methods=["POST"])
def asha_prescription_scan():
    try:
        data = request.get_json(silent=True) or {}
        nhm_id = _normalize_nhm_id(data.get("nhm_id"))
        patient_phone = _normalize_phone(data.get("patient_phone"))
        image_base64 = data.get("image")
        language = str(data.get("language", "en")).strip().lower()

        if not nhm_id or len(patient_phone) != 10 or not image_base64:
            return jsonify({"success": False, "error": "nhm_id, patient_phone and image are required"}), 400

        result = _process_prescription_image(image_base64, language=language)

        db.collection("asha_prescription_scans").add({
            "nhm_id": nhm_id,
            "patient_phone": patient_phone,
            "prescription": result["prescription"],
            "explanation": result["explanation"],
            "english_explanation": result.get("english_explanation", result["explanation"]),
            "kannada_explanation": result.get("kannada_explanation"),
            "hindi_explanation": result.get("hindi_explanation"),
            "language": language,
            "audio_path": result.get("audio_path"),
            "explanation_audio_path": result.get("explanation_audio_path"),
            "kannada_explanation_audio_path": result.get("kannada_explanation_audio_path"),
            "hindi_explanation_audio_path": result.get("hindi_explanation_audio_path"),
            "created_at": _server_timestamp(),
        })

        return jsonify({"success": True, **result})
    except Exception as error:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/asha/workflows/medicine-verify", methods=["POST"])
def asha_medicine_verify():
    try:
        data = request.get_json(silent=True) or {}
        nhm_id = _normalize_nhm_id(data.get("nhm_id"))
        patient_phone = _normalize_phone(data.get("patient_phone"))
        image_base64 = data.get("image")
        language = str(data.get("language", "en")).strip().lower()

        if not nhm_id or len(patient_phone) != 10 or not image_base64:
            return jsonify({"success": False, "error": "nhm_id, patient_phone and image are required"}), 400

        result = _process_medicine_verification(image_base64, language=language)
        db.collection("asha_medicine_verifications").add({
            "nhm_id": nhm_id,
            "patient_phone": patient_phone,
            "scan_result": result["scan_result"],
            "verdict": result["verdict"],
            "explanation": result["explanation"],
            "english_explanation": result.get("english_explanation", result["explanation"]),
            "kannada_explanation": result.get("kannada_explanation"),
            "hindi_explanation": result.get("hindi_explanation"),
            "language": language,
            "audio_path": result.get("audio_path"),
            "explanation_audio_path": result.get("explanation_audio_path"),
            "kannada_explanation_audio_path": result.get("kannada_explanation_audio_path"),
            "hindi_explanation_audio_path": result.get("hindi_explanation_audio_path"),
            "created_at": _server_timestamp(),
        })

        return jsonify({"success": True, **result})
    except Exception as error:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/asha/workflows/send-sms", methods=["POST"])
def asha_send_sms():
    try:
        data = request.get_json(silent=True) or {}
        nhm_id = _normalize_nhm_id(data.get("nhm_id"))
        patient_phone = _normalize_phone(data.get("patient_phone"))
        message = str(data.get("message", "")).strip()

        if not nhm_id or len(patient_phone) != 10 or not message:
            return jsonify({"success": False, "error": "nhm_id, patient_phone and message are required"}), 400

        db.collection("asha_messages").add({
            "nhm_id": nhm_id,
            "patient_phone": patient_phone,
            "message": message,
            "channel": "sms",
            "status": "queued",
            "created_at": _server_timestamp(),
        })

        return jsonify({"success": True, "status": "queued", "message": "Message queued and logged"})
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/asha/workflows/history", methods=["GET"])
def asha_workflow_history():
    try:
        nhm_id = _normalize_nhm_id(request.args.get("nhm_id"))
        patient_phone = _normalize_phone(request.args.get("patient_phone"))
        limit = int(request.args.get("limit", 10))

        if not nhm_id:
            return jsonify({"success": False, "error": "nhm_id is required"}), 400

        scans_query = db.collection("asha_prescription_scans").where("nhm_id", "==", nhm_id)
        verifications_query = db.collection("asha_medicine_verifications").where("nhm_id", "==", nhm_id)
        messages_query = db.collection("asha_messages").where("nhm_id", "==", nhm_id)

        if patient_phone:
            scans_query = scans_query.where("patient_phone", "==", patient_phone)
            verifications_query = verifications_query.where("patient_phone", "==", patient_phone)
            messages_query = messages_query.where("patient_phone", "==", patient_phone)

        scans_raw = scans_query.limit(100).stream()
        verifications_raw = verifications_query.limit(100).stream()
        messages_raw = messages_query.limit(100).stream()

        scans = _sorted_firestore_docs(scans_raw, limit=limit)
        verifications = _sorted_firestore_docs(verifications_raw, limit=limit)
        _enrich_workflow_items(scans, verifications)

        return jsonify({
            "success": True,
            "history": {
                "scans": scans,
                "verifications": verifications,
                "messages": _sorted_firestore_docs(messages_raw, limit=limit),
            },
        })
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/asha/workflows/explain-prescription", methods=["POST"])
@app.route("/explain-prescription", methods=["POST"])
def explain_prescription_route():
    try:
        data = request.get_json(silent=True) or {}
        prescription = data.get("prescription")
        language = str(data.get("language", "en")).strip().lower()

        if not prescription:
            return jsonify({"success": False, "error": "prescription is required"}), 400

        rx_str = json.dumps(prescription) if isinstance(prescription, dict) else str(prescription)

        if language == "kn":
            explanation = explain_in_kannada(rx_str)
        elif language == "hi":
            explanation = explain_in_hindi(rx_str)
        else:
            explanation = explain_in_english(rx_str)

        return jsonify({
            "success": True,
            "explanation": explanation,
            "language": language
        })
    except Exception as error:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/asha/workers/nearest", methods=["GET"])
def nearest_workers():
    try:
        area = str(request.args.get("area", "")).strip().lower()
        lat = request.args.get("lat")
        lng = request.args.get("lng")
        limit = int(request.args.get("limit", 10))

        lat = float(lat) if lat not in (None, "") else None
        lng = float(lng) if lng not in (None, "") else None

        docs = db.collection("asha_workers").where("status", "==", "active").limit(100).stream()
        workers = []
        for doc in docs:
            worker = doc.to_dict() or {}
            worker["id"] = doc.id
            village = str(worker.get("village", "")).lower()
            if area and area not in village:
                continue

            location = worker.get("location") or {}
            d_km = _distance_km(lat, lng, location.get("lat"), location.get("lng"))
            worker["distance_km"] = d_km
            workers.append(_to_json_safe(worker))

        workers.sort(key=lambda item: item.get("distance_km") if item.get("distance_km") is not None else 999999)
        return jsonify({"success": True, "workers": workers[:limit]})
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/assistant/chat", methods=["POST"])
def assistant_chat():
    try:
        data = request.get_json(silent=True) or {}
        nhm_id = _normalize_nhm_id(data.get("nhm_id"))
        patient_phone = _normalize_phone(data.get("patient_phone"))
        question = str(data.get("message", "")).strip()
        language = str(data.get("language", "EN")).strip().upper() or "EN"

        if not question:
            return jsonify({"success": False, "error": "message is required"}), 400

        answer = _ask_openrouter(question, language)
        db.collection("asha_chat").add({
            "nhm_id": nhm_id,
            "patient_phone": patient_phone,
            "question": question,
            "answer": answer,
            "language": language,
            "created_at": _server_timestamp(),
        })

        return jsonify({"success": True, "answer": answer})
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

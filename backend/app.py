from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import base64
import tempfile
import os

from prescription_reader import read_prescription
from kannada_explainer import explain_in_kannada
from medicine_scanner import scan_medicine_label
from verifier import verify_medicine

app = Flask(__name__)
CORS(app)  # Allow React frontend to call this API

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "service": "AushadhiSaathi backend",
        "status": "running",
        "endpoints": {
            "health": "GET /health",
            "read_prescription": "POST /read-prescription",
            "verify_medicine": "POST /verify-medicine"
        }
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "AushadhiSaathi backend is running!"})

@app.route('/read-prescription', methods=['POST'])
def read_prescription_api():
    try:
        data = request.json
        image_base64 = data['image']
        
        # Save image temporarily
        image_bytes = base64.b64decode(image_base64)
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
            f.write(image_bytes)
            temp_path = f.name
        
        # Read prescription
        prescription_json = read_prescription(temp_path)
        
        # Generate Kannada explanation
        kannada_text = explain_in_kannada(prescription_json)
        
        # Cleanup
        os.unlink(temp_path)
        
        return jsonify({
            "success": True,
            "prescription": json.loads(prescription_json),
            "kannada_explanation": kannada_text
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/verify-medicine', methods=['POST'])
def verify_medicine_api():
    try:
        data = request.json
        image_base64 = data['image']
        
        # Save image temporarily
        image_bytes = base64.b64decode(image_base64)
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
            f.write(image_bytes)
            temp_path = f.name
        
        # Scan label
        scan_json_string = scan_medicine_label(temp_path)
        scan_result = json.loads(scan_json_string)
        
        # Verify
        verdict = verify_medicine(scan_result)
        
        # Cleanup
        os.unlink(temp_path)
        
        return jsonify({
            "success": True,
            "scan_result": scan_result,
            "verdict": verdict
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
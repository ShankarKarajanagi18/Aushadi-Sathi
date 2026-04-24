# Save as final_test.py
from prescription_reader import read_prescription
from kannada_explainer import explain_in_kannada
from medicine_scanner import scan_medicine_label
from verifier import verify_medicine
import json

print("=== TEST 1: Prescription Flow ===")
try:
	presc_json = read_prescription("test_prescription.jpg")
	print("Prescription:", presc_json)
	kannada = explain_in_kannada(presc_json)
	print("Kannada:", kannada)
except Exception as e:
	print("Prescription flow failed:", e)

print("\n=== TEST 2: Medicine Verification ===")
try:
	scan = scan_medicine_label("med1.jpg")
	print("Scan:", scan)
	verdict = verify_medicine(json.loads(scan))
	print("Verdict:", verdict['status'], verdict['kannada'])
except Exception as e:
	print("Medicine verification flow failed:", e)
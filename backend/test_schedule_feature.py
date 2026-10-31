import json
import unittest
from schedule_builder import (
    build_schedule,
    generate_schedule_summaries,
    _validate_schedule_schema,
    _fallback_schedule,
    _normalize_prescription_input
)
from app import app


class TestScheduleFeature(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.sample_prescription = {
            "medicines": [
                {
                    "name": "Paracetamol 500mg",
                    "dose": "1 tablet",
                    "frequency": "1-0-1",
                    "timing": "after food",
                    "duration": "5 days"
                },
                {
                    "name": "Pantoprazole 40mg",
                    "dose": "1 tablet",
                    "frequency": "1-0-0",
                    "timing": "before food",
                    "duration": "7 days"
                },
                {
                    "name": "Amoxicillin 500mg",
                    "dose": "1 capsule",
                    "frequency": "1-1-1",
                    "timing": "after food",
                    "duration": "5 days"
                }
            ],
            "diagnosis": "Bacterial fever with gastric acidity",
            "doctor_notes": "Drink warm water and avoid oily food."
        }

    def test_schema_validation_valid(self):
        valid_data = {
            "schedule": {
                "morning": [{"medicine": "Paracetamol 500mg", "dose": "1 tablet", "food": "after food"}],
                "afternoon": [],
                "night": [{"medicine": "Paracetamol 500mg", "dose": "1 tablet", "food": "after food"}]
            },
            "interactions": [
                {"medicines": ["Paracetamol 500mg"], "risk": "low", "note": "Safe when taken as directed."}
            ],
            "warnings": ["Take on time."]
        }
        is_valid, err = _validate_schedule_schema(valid_data, ["Paracetamol 500mg"])
        self.assertTrue(is_valid, f"Validation failed with: {err}")

    def test_schema_validation_rejects_invented_medicine(self):
        invented_data = {
            "schedule": {
                "morning": [{"medicine": "InventedDrugXYZ 100mg", "dose": "1 tab", "food": "after food"}],
                "afternoon": [],
                "night": []
            },
            "interactions": [],
            "warnings": []
        }
        is_valid, err = _validate_schedule_schema(invented_data, ["Paracetamol 500mg"])
        self.assertFalse(is_valid)
        self.assertIn("Invented medicine", str(err))

    def test_schema_validation_rejects_invalid_risk(self):
        invalid_risk_data = {
            "schedule": {"morning": [], "afternoon": [], "night": []},
            "interactions": [{"medicines": ["A"], "risk": "critical_danger", "note": "bad"}],
            "warnings": []
        }
        is_valid, err = _validate_schedule_schema(invalid_risk_data, [])
        self.assertFalse(is_valid)
        self.assertIn("must be one of: low, medium, high", str(err))

    def test_fallback_schedule_generation(self):
        normalized = _normalize_prescription_input(self.sample_prescription)
        result = _fallback_schedule(normalized)
        
        # Verify strict keys
        self.assertIn("schedule", result)
        self.assertIn("interactions", result)
        self.assertIn("warnings", result)
        self.assertIn("morning", result["schedule"])
        self.assertIn("afternoon", result["schedule"])
        self.assertIn("night", result["schedule"])

        # Check morning items
        morning_meds = [m["medicine"] for m in result["schedule"]["morning"]]
        self.assertIn("Paracetamol 500mg", morning_meds)
        self.assertIn("Pantoprazole 40mg", morning_meds)
        self.assertIn("Amoxicillin 500mg", morning_meds)

        # Check food instructions
        for m in result["schedule"]["morning"]:
            if m["medicine"] == "Pantoprazole 40mg":
                self.assertEqual(m["food"], "before food")
            if m["medicine"] == "Paracetamol 500mg":
                self.assertEqual(m["food"], "after food")

    def test_spoken_summaries(self):
        fallback = _fallback_schedule(_normalize_prescription_input(self.sample_prescription))
        summaries = generate_schedule_summaries(fallback)
        self.assertIn("en", summaries)
        self.assertIn("kn", summaries)
        self.assertTrue(len(summaries["en"]) > 50)
        self.assertTrue(len(summaries["kn"]) > 50)
        self.assertIn("Paracetamol", summaries["en"])

    def test_api_schedule_route_post(self):
        response = self.app.post(
            "/api/schedule",
            data=json.dumps({"prescription": self.sample_prescription, "language": "en"}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("schedule", data)
        self.assertIn("interactions", data)
        self.assertIn("warnings", data)
        self.assertIn("summary_en", data)
        self.assertIn("summary_kn", data)
        # Check timetable slots
        schedule = data["schedule"]
        self.assertIsInstance(schedule.get("morning"), list)
        self.assertIsInstance(schedule.get("afternoon"), list)
        self.assertIsInstance(schedule.get("night"), list)

    def test_api_schedule_unsure_handling(self):
        # Ambiguous medicine with no frequency or food instruction
        ambiguous_payload = {
            "prescription": {
                "medicines": [
                    {
                        "name": "Vitamin D3",
                        "dose": "",
                        "frequency": "",
                        "timing": ""
                    }
                ]
            }
        }
        response = self.app.post(
            "/api/schedule",
            data=json.dumps(ambiguous_payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get("success"))
        morning_items = data["schedule"].get("morning", [])
        self.assertTrue(len(morning_items) > 0)
        food_or_instruction = f"{morning_items[0].get('food', '')} {morning_items[0].get('instruction', '')} {morning_items[0].get('dose', '')}"
        self.assertIn("unsure, ask your pharmacist", food_or_instruction.lower())


if __name__ == "__main__":
    unittest.main()

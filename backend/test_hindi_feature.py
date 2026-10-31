import unittest
import json
from app import app
from hindi_explainer import explain_in_hindi, explain_schedule_in_hindi, _fallback_hindi_explanation
from tts_hindi import text_to_hindi_speech


class TestHindiFeature(unittest.TestCase):

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

    def test_hindi_explainer_fallback(self):
        """Test rule-based Hindi fallback generator produces simple Class 5 friendly Hindi."""
        explanation = _fallback_hindi_explanation(self.sample_prescription)
        self.assertIsInstance(explanation, str)
        self.assertGreater(len(explanation), 30)
        # Check for key Hindi vocabulary
        self.assertTrue(
            any(word in explanation for word in ["नमस्ते", "दवा", "गोली", "सुबह", "शाम", "भोजन", "सलाह"]),
            f"Expected Hindi keywords in fallback explanation, got: {explanation}"
        )

    def test_hindi_explainer_live_or_fallback(self):
        """Test explain_in_hindi produces valid non-empty Hindi string."""
        explanation = explain_in_hindi(self.sample_prescription)
        self.assertIsInstance(explanation, str)
        self.assertGreater(len(explanation), 30)

    def test_hindi_schedule_explainer(self):
        """Test explain_schedule_in_hindi generates clear timetable instructions."""
        sample_schedule = {
            "schedule": {
                "morning": [{"medicine": "Pantoprazole 40mg", "dose": "1 tablet", "food": "before food"}],
                "afternoon": [{"medicine": "Amoxicillin 500mg", "dose": "1 capsule", "food": "after food"}],
                "night": [{"medicine": "Paracetamol 500mg", "dose": "1 tablet", "food": "after food"}]
            },
            "interactions": [],
            "warnings": ["समय पर दवा लें।"]
        }
        summary = explain_schedule_in_hindi(sample_schedule)
        self.assertIsInstance(summary, str)
        self.assertGreater(len(summary), 20)
        self.assertTrue(
            any(w in summary for w in ["सुबह", "दोपहर", "रात", "दवा"]),
            f"Summary should have time-of-day Hindi terms, got: {summary}"
        )

    def test_tts_hindi(self):
        """Test text_to_hindi_speech produces base64 MP3 audio."""
        test_text = "नमस्ते, यह आपकी दवा का समय है।"
        audio_b64 = text_to_hindi_speech(test_text)
        self.assertIsNotNone(audio_b64)
        self.assertIsInstance(audio_b64, str)
        self.assertGreater(len(audio_b64), 500)

    def test_schedule_route_hindi(self):
        """Test POST /api/schedule with language='hi'."""
        response = self.app.post(
            "/api/schedule",
            data=json.dumps({
                "prescription": self.sample_prescription,
                "language": "hi"
            }),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("timetable", data)
        self.assertIn("summary_hi", data)
        self.assertIsNotNone(data.get("summary_hi"))
        self.assertGreater(len(data.get("summary_hi", "")), 10)
        self.assertIn("audio_hi", data)
        self.assertIsNotNone(data.get("audio_hi"))
        self.assertGreater(len(data.get("audio_hi", "")), 500)
        # Check active audio is the Hindi one
        self.assertEqual(data.get("audio"), data.get("audio_hi"))

    def test_schedule_route_kannada_and_english_regression(self):
        """Test existing Kannada and English flows still work as expected."""
        # Test Kannada
        kn_res = self.app.post(
            "/api/schedule",
            data=json.dumps({
                "prescription": self.sample_prescription,
                "language": "kn"
            }),
            content_type="application/json"
        )
        self.assertEqual(kn_res.status_code, 200)
        kn_data = kn_res.get_json()
        self.assertTrue(kn_data.get("success"))
        self.assertIn("summary_kn", kn_data)
        self.assertIn("audio_kn", kn_data)

        # Test English
        en_res = self.app.post(
            "/api/schedule",
            data=json.dumps({
                "prescription": self.sample_prescription,
                "language": "en"
            }),
            content_type="application/json"
        )
        self.assertEqual(en_res.status_code, 200)
        en_data = en_res.get_json()
        self.assertTrue(en_data.get("success"))
        self.assertIn("summary_en", en_data)
        self.assertIn("audio_en", en_data)

    def test_speak_route_all_languages(self):
        """Test POST /speak for kn, en, and hi."""
        for lang_code, sample_str in [("hi", "नमस्ते"), ("kn", "ನಮಸ್ಕಾರ"), ("en", "Hello")]:
            res = self.app.post(
                "/speak",
                data=json.dumps({"text": sample_str, "language": lang_code}),
                content_type="application/json"
            )
            self.assertEqual(res.status_code, 200, f"Failed for {lang_code}")
            data = res.get_json()
            self.assertTrue(data.get("success"), f"Speech not successful for {lang_code}")
            self.assertIsNotNone(data.get("audio"), f"Audio missing for {lang_code}")


if __name__ == "__main__":
    unittest.main()

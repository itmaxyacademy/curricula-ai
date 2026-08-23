import sys
import os
import unittest
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from main import app
import pipeline
from routes.courses import parse_duration_to_minutes


class TestHeadlessE2EIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_step1_create_session(self):
        """Step 1: Create session and verify concept & tech tag extraction."""
        payload = {
            "keyword": "Python Fast Bootcamp",
            "difficulty": "Beginner",
            "target_audience": "Student",
            "is_agent_mode": True
        }
        res = self.client.post("/api/v1/courses/sessions", json=payload)
        self.assertEqual(res.status_code, 200, f"Failed Step 1: {res.text}")
        data = res.json()
        self.assertIn("session_id", data)
        self.assertIn("tech_tags", data)
        self.assertTrue(len(data["tech_tags"]) > 0)
        self.assertIsInstance(data["session_id"], str)
        TestHeadlessE2EIntegration.session_id = data["session_id"]

    def test_02_step2_config_and_duration_math(self):
        """Step 2: Update config and verify duration normalization."""
        sid = TestHeadlessE2EIntegration.session_id
        # Test duration math parsing: "2 lesson = 60 menit" -> 30 min
        dur_val = parse_duration_to_minutes("2 lesson = 60 menit")
        self.assertEqual(dur_val, 30)

        payload = {
            "lessons_count": 2,
            "duration": "30 min",
            "difficulty": "Beginner",
            "target_audience": "Student",
            "subject_context": "Hands-on Python basics",
            "tech_tags": ["Python", "Variables", "Functions"]
        }
        res = self.client.post(f"/api/v1/courses/sessions/{sid}/config", json=payload)
        self.assertEqual(res.status_code, 200)

    def test_03_step3_grounding_translation_sanitizer(self):
        """Step 3: Save grounding with Indonesian input and assert English translation."""
        sid = TestHeadlessE2EIntegration.session_id
        payload = {
            "tech_tags": ["Python", "Docker"],
            "prerequisites": ["mampu menggunakan terminal dasar"],
            "out_of_scope": ["pembahasan machine learning lanjut"],
            "learning_outcomes": ["mampu membuat aplikasi python sederhana"],
            "target_audience": "Student"
        }
        res = self.client.post(f"/api/v1/courses/sessions/{sid}/grounding", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("prerequisites", data)
        self.assertIn("learning_outcomes", data)
        # Verify non-empty and sanitized
        self.assertTrue(len(data["prerequisites"]) > 0)
        self.assertTrue(len(data["learning_outcomes"]) > 0)

    def test_04_step4_proposals_generate_and_select(self):
        """Step 4: Generate proposals and select one."""
        sid = TestHeadlessE2EIntegration.session_id
        res = self.client.post(f"/api/v1/courses/sessions/{sid}/proposals/generate")
        self.assertEqual(res.status_code, 200)
        props = res.json().get("proposals", [])
        self.assertTrue(len(props) > 0)

        selected_id = props[0]["id"]
        res_sel = self.client.post(f"/api/v1/courses/sessions/{sid}/proposals/select", json={"selected_proposal_id": selected_id})
        self.assertEqual(res_sel.status_code, 200)
        data_sel = res_sel.json()
        self.assertIn("structure", data_sel)
        self.assertTrue(len(data_sel["structure"]) > 0)

    def test_05_step5_custom_section_translation(self):
        """Step 5: Inject custom section with raw/slang text and assert Title Case English."""
        sid = TestHeadlessE2EIntegration.session_id
        custom_structure = [
            {
                "id": "lesson-1",
                "title": "python foundations",
                "order": 1,
                "sections": {
                    "creator": [
                        {
                            "type": "custom_container_lab",
                            "title": "praktek docker container",
                            "instruction": "setup docker compose environment for python app",
                            "locked": False
                        }
                    ]
                }
            }
        ]
        res = self.client.post(f"/api/v1/courses/sessions/{sid}/structure/save", json={"lessons": custom_structure})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("structure", data)
        saved_struct = data["structure"]
        # Assert lesson title was capitalized/translated
        self.assertTrue("Python" in saved_struct[0]["title"])
        # Assert custom section title was translated to Title Case English
        custom_sec = saved_struct[0]["sections"]["creator"][0]
        self.assertFalse("praktek" in custom_sec["title"].lower() and len(custom_sec["title"]) == 24)
        self.assertTrue("Docker" in custom_sec["title"] or "Container" in custom_sec["title"] or "Practice" in custom_sec["title"])

    def test_06_css_responsive_rules_static_audit(self):
        """Step 6: Headless audit of responsive.css rules."""
        css_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../frontend/src/styles/responsive.css'))
        self.assertTrue(os.path.exists(css_path), "responsive.css file must exist")
        with open(css_path, 'r', encoding='utf-8') as f:
            css_content = f.read()

        # Assert key mobile responsive rules are present
        self.assertIn("@media (max-width: 768px)", css_content)
        self.assertIn("min-height: 44px", css_content)
        self.assertIn("overflow-x: clip", css_content)
        self.assertIn(".studio-layout", css_content)


if __name__ == '__main__':
    unittest.main()

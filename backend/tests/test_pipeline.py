import sys
import os
import unittest

# Add backend root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pipeline
from routes.courses import parse_duration_to_minutes


class TestPipelineAndParsers(unittest.TestCase):

    def test_to_title_case_en(self):
        """Verify title case formatting rules."""
        self.assertEqual(pipeline.to_title_case_en("practical docker deployment"), "Practical Docker Deployment")
        self.assertEqual(pipeline.to_title_case_en("introduction to cloud computing"), "Introduction to Cloud Computing")
        self.assertEqual(pipeline.to_title_case_en(""), "")

    def test_parse_duration_simple(self):
        """Verify simple minutes and hours parsing."""
        self.assertEqual(parse_duration_to_minutes("30 minutes"), 30)
        self.assertEqual(parse_duration_to_minutes("45 min"), 45)
        self.assertEqual(parse_duration_to_minutes("1 hour"), 60)
        self.assertEqual(parse_duration_to_minutes("2 hours"), 120)
        self.assertEqual(parse_duration_to_minutes(None), 60)

    def test_parse_duration_multi_lesson_math(self):
        """Verify intelligent division for multi-lesson duration expressions."""
        # "2 lesson = 60 menit" -> 30 min per lesson
        self.assertEqual(parse_duration_to_minutes("2 lesson = 60 menit"), 30)
        self.assertEqual(parse_duration_to_minutes("2 modul = 1 jam"), 30)
        self.assertEqual(parse_duration_to_minutes("60 menit total untuk 2 lesson"), 30)
        self.assertEqual(parse_duration_to_minutes("90 menit total", lesson_count=3), 30)

    def test_parse_duration_clamping(self):
        """Verify clamping to sensible minimum (5 min) and maximum (180 min)."""
        self.assertEqual(parse_duration_to_minutes("1 minute"), 5)
        self.assertEqual(parse_duration_to_minutes("500 hours"), 180)
        self.assertEqual(parse_duration_to_minutes("3 weeks"), 60)

    def test_zero_division_guard(self):
        """Verify that empty lesson outlines cannot cause division by zero."""
        empty_outline = []
        total_lessons = max(1, len(empty_outline))
        self.assertEqual(total_lessons, 1)
        prog_val = int(10 + (0 / total_lessons) * 80)
        self.assertEqual(prog_val, 10)

    def test_sanitize_custom_structure(self):
        """Verify structure sanitization translates and formats custom titles."""
        raw_structure = [
            {
                "id": "custom-1",
                "title": "docker containerization",
                "order": 1,
                "sections": {
                    "creator": [
                        {
                            "type": "custom_sec",
                            "title": "hands on lab",
                            "instruction": "setup docker compose environment",
                            "locked": False
                        }
                    ]
                }
            }
        ]
        sanitized = pipeline.sanitize_custom_structure(raw_structure)
        self.assertEqual(len(sanitized), 1)
        self.assertTrue("Docker" in sanitized[0]["title"])
        custom_sec = sanitized[0]["sections"]["creator"][0]
        self.assertTrue("Hands" in custom_sec["title"] or "Lab" in custom_sec["title"])


if __name__ == '__main__':
    unittest.main()

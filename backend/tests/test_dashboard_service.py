import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.dashboard_service import calculate_unlocked_day, resolve_active_course


class CalculateUnlockedDayTests(unittest.TestCase):
    def test_unlocks_the_next_day_after_previous_day_is_completed(self):
        course_days = [
            SimpleNamespace(id=1, day_number=1),
            SimpleNamespace(id=2, day_number=2),
            SimpleNamespace(id=3, day_number=3),
        ]
        day_progress = {
            1: {"total_modules": 2, "completed_modules": 2},
            2: {"total_modules": 3, "completed_modules": 1},
            3: {"total_modules": 2, "completed_modules": 0},
        }

        self.assertEqual(calculate_unlocked_day(course_days, day_progress), 2)

    def test_keeps_the_latest_completed_day_unlocked(self):
        course_days = [
            SimpleNamespace(id=1, day_number=1),
            SimpleNamespace(id=2, day_number=2),
            SimpleNamespace(id=3, day_number=3),
        ]
        day_progress = {
            1: {"total_modules": 2, "completed_modules": 2},
            2: {"total_modules": 3, "completed_modules": 3},
            3: {"total_modules": 2, "completed_modules": 2},
        }

        self.assertEqual(calculate_unlocked_day(course_days, day_progress), 3)

    def test_does_not_unlock_next_day_when_completed_today(self):
        course_days = [
            SimpleNamespace(id=1, day_number=1),
            SimpleNamespace(id=2, day_number=2),
        ]
        day_progress = {
            1: {
                "total_modules": 2,
                "completed_modules": 2,
                "completed_at_max": datetime.utcnow()
            },
            2: {
                "total_modules": 2,
                "completed_modules": 0,
                "completed_at_max": None
            }
        }
        # Since it was completed today (utcnow), day 2 should NOT unlock today
        self.assertEqual(calculate_unlocked_day(course_days, day_progress), 1)

    def test_unlocks_next_day_when_completed_yesterday(self):
        course_days = [
            SimpleNamespace(id=1, day_number=1),
            SimpleNamespace(id=2, day_number=2),
        ]
        day_progress = {
            1: {
                "total_modules": 2,
                "completed_modules": 2,
                "completed_at_max": datetime.utcnow() - timedelta(days=1)
            },
            2: {
                "total_modules": 2,
                "completed_modules": 0,
                "completed_at_max": None
            }
        }
        # Since it was completed yesterday, day 2 should unlock
        self.assertEqual(calculate_unlocked_day(course_days, day_progress), 2)

    def test_resolves_selected_course_before_most_recent_enrollment(self):
        courses = [
            (SimpleNamespace(course_id=2), SimpleNamespace(id=2, title="Java Training")),
            (SimpleNamespace(course_id=1), SimpleNamespace(id=1, title="C# Training")),
        ]

        resolved_enrollment, resolved_course = resolve_active_course(courses, 1)

        self.assertEqual(resolved_course.id, 1)
        self.assertEqual(resolved_course.title, "C# Training")


if __name__ == "__main__":
    unittest.main()

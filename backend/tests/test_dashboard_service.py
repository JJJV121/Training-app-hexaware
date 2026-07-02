import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.dashboard_service import calculate_unlocked_day


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


if __name__ == "__main__":
    unittest.main()

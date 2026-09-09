"""
Unit tests for Timeline Schedule & Minutengenaue Tages-Regie
"""

import unittest
from datetime import datetime
from fastapi.testclient import TestClient

from backend.main import app
from backend.models import ScheduleTimeSettings
from backend.schedule.timeline_engine import (
    generate_daily_timeline,
    get_schedule_settings,
    update_schedule_settings,
    toggle_timeline_task,
    reset_timeline_tasks,
    time_to_minutes
)


class TestTimelineSchedule(unittest.TestCase):
    def setUp(self):
        reset_timeline_tasks()
        update_schedule_settings({
            "wake_up_time": "06:30",
            "work_start_time": "08:00",
            "lunch_time": "12:30",
            "work_end_time": "17:00",
            "dinner_time": "18:30",
            "evening_prep_time": "20:00",
            "bed_time": "22:30"
        })
        self.client = TestClient(app)

    def tearDown(self):
        reset_timeline_tasks()

    def test_timeline_generation_and_sorting(self):
        timeline_res = generate_daily_timeline(
            today_plan=None,
            tomorrow_plan=None,
            family_members=[],
            settings=ScheduleTimeSettings(),
            current_dt=datetime(2026, 9, 9, 11, 0)
        )

        self.assertGreater(len(timeline_res.timeline), 10)
        # Verify chronological order
        prev_min = -1
        for t in timeline_res.timeline:
            cur_min = time_to_minutes(t.time_str)
            self.assertGreaterEqual(cur_min, prev_min, f"Task {t.title} at {t.time_str} is out of order")
            prev_min = cur_min

        # Verify key stations exist
        task_ids = [t.id for t in timeline_res.timeline]
        self.assertIn("task-morning-water", task_ids)
        self.assertIn("task-lunchbox-grab", task_ids)
        self.assertIn("task-breakfast-eat", task_ids)
        self.assertIn("task-morning-snack", task_ids)
        self.assertIn("task-lunch-eat", task_ids)
        self.assertIn("task-store-alert", task_ids)
        self.assertIn("task-store-visit", task_ids)
        self.assertIn("task-dinner-cook", task_ids)
        self.assertIn("task-dinner-eat", task_ids)
        self.assertIn("task-prep-tomorrow", task_ids)
        self.assertIn("task-defrost-check", task_ids)
        self.assertIn("task-evening-water", task_ids)

    def test_prep_tomorrow_summary(self):
        timeline_res = generate_daily_timeline(
            today_plan=None,
            tomorrow_plan=None,
            family_members=[],
            settings=ScheduleTimeSettings(),
            current_dt=datetime(2026, 9, 9, 20, 5)
        )

        prep = timeline_res.prep_tomorrow
        self.assertIsNotNone(prep)
        self.assertIn("Overnight", prep.breakfast_title)
        self.assertGreater(len(prep.overnight_tasks), 2)
        self.assertFalse(prep.is_prep_finished)

    def test_toggle_task_and_progress(self):
        toggle_timeline_task("task-morning-water", True)
        toggle_timeline_task("task-lunchbox-grab", True)

        timeline_res = generate_daily_timeline(
            today_plan=None,
            tomorrow_plan=None,
            family_members=[],
            current_dt=datetime(2026, 9, 9, 7, 0)
        )

        task_water = next(t for t in timeline_res.timeline if t.id == "task-morning-water")
        self.assertTrue(task_water.is_completed)
        self.assertEqual(task_water.urgency, "done")
        self.assertGreater(timeline_res.progress_percent, 0)

    def test_api_endpoints(self):
        # 1. GET /api/schedule/timeline
        res = self.client.get("/api/schedule/timeline")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("timeline", data)
        self.assertIn("prep_tomorrow", data)
        self.assertIn("settings", data)

        # 2. POST /api/schedule/settings
        res_set = self.client.post("/api/schedule/settings", json={"wake_up_time": "07:00", "work_end_time": "16:30"})
        self.assertEqual(res_set.status_code, 200)
        self.assertEqual(res_set.json()["wake_up_time"], "07:00")
        self.assertEqual(res_set.json()["work_end_time"], "16:30")

        # 3. POST /api/schedule/task/{task_id}/toggle
        res_tog = self.client.post("/api/schedule/task/task-morning-water/toggle", json={"is_completed": True})
        self.assertEqual(res_tog.status_code, 200)
        water_task = next(t for t in res_tog.json()["timeline"] if t["id"] == "task-morning-water")
        self.assertTrue(water_task["is_completed"])

        # 4. POST /api/schedule/prep-tomorrow/complete
        res_prep = self.client.post("/api/schedule/prep-tomorrow/complete")
        self.assertEqual(res_prep.status_code, 200)
        prep_task = next(t for t in res_prep.json()["timeline"] if t["id"] == "task-prep-tomorrow")
        self.assertTrue(prep_task["is_completed"])
        self.assertTrue(res_prep.json()["prep_tomorrow"]["is_prep_finished"])


if __name__ == "__main__":
    unittest.main()

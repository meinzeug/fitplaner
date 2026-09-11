import unittest
from backend.models import FamilyMember
from backend.nutrition.calculator import enrich_family_member
from backend.planner.generator import generate_weekly_plan, swap_meal_in_plan
from backend.planner.shopping_list import generate_shopping_list_from_plan


class TestBudgetAndWeeks(unittest.TestCase):
    def setUp(self):
        raw_members = [
            {
                "id": "mem-1",
                "name": "Dennis",
                "gender": "male",
                "age": 32,
                "height_cm": 182,
                "weight_kg": 85,
                "activity_level": "moderate",
                "goal": "lose_weight",
                "dietary_preference": "all",
                "allergies": [],
                "disliked_foods": [],
            },
            {
                "id": "mem-2",
                "name": "Sarah",
                "gender": "female",
                "age": 29,
                "height_cm": 168,
                "weight_kg": 62,
                "activity_level": "light",
                "goal": "maintain",
                "dietary_preference": "all",
                "allergies": [],
                "disliked_foods": [],
            },
        ]
        self.members = [enrich_family_member(m) for m in raw_members]

    def test_current_week_and_offsets(self):
        # Current week (offset 0)
        plan_cur = generate_weekly_plan(self.members, week_offset=0, budget=120.0)
        self.assertEqual(plan_cur.week_offset, 0)
        self.assertTrue("KW" in plan_cur.week_label)
        self.assertEqual(len(plan_cur.days), 7)
        self.assertEqual(plan_cur.days[0].day_name, "Montag")
        self.assertEqual(plan_cur.days[6].day_name, "Sonntag")

        # Next week (offset 1)
        plan_next = generate_weekly_plan(self.members, week_offset=1, budget=120.0)
        self.assertEqual(plan_next.week_offset, 1)
        self.assertNotEqual(plan_cur.start_date, plan_next.start_date)

        # Previous week (offset -1)
        plan_prev = generate_weekly_plan(self.members, week_offset=-1, budget=120.0)
        self.assertEqual(plan_prev.week_offset, -1)
        self.assertNotEqual(plan_cur.start_date, plan_prev.start_date)

    def test_budget_status_calculation(self):
        # High budget -> "ok"
        plan_ok = generate_weekly_plan(self.members, week_offset=0, budget=200.0)
        self.assertEqual(plan_ok.budget_status, "ok")
        self.assertGreater(plan_ok.budget_difference, 0)

        # Tight budget -> "warning" or "exceeded"
        plan_tight = generate_weekly_plan(self.members, week_offset=0, budget=105.0)
        self.assertIn(plan_tight.budget_status, ["ok", "warning", "exceeded"])

        # Low budget -> "exceeded"
        plan_exceeded = generate_weekly_plan(self.members, week_offset=0, budget=50.0)
        self.assertEqual(plan_exceeded.budget_status, "exceeded")
        self.assertLess(plan_exceeded.budget_difference, 0)

    def test_shopping_list_budget_metrics(self):
        plan = generate_weekly_plan(self.members, week_offset=2, budget=150.0)
        shopping = generate_shopping_list_from_plan(plan)
        self.assertEqual(shopping.week_offset, 2)
        self.assertEqual(shopping.budget, 150.0)
        self.assertIsNotNone(shopping.budget_status)
        self.assertEqual(shopping.budget_difference, round(150.0 - shopping.total_price, 2))

    def test_save_custom_weekly_plan_endpoint(self):
        from fastapi.testclient import TestClient
        from backend.main import app
        client = TestClient(app)
        plan = generate_weekly_plan(self.members, week_offset=0, budget=120.0)
        res = client.post("/api/plan/save", json={"week_offset": 0, "plan": plan.model_dump()})
        self.assertEqual(res.status_code, 200)
        saved = res.json()
        self.assertEqual(saved["week_offset"], 0)
        self.assertEqual(len(saved["days"]), 7)


if __name__ == "__main__":
    unittest.main()

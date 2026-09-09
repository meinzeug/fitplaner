"""
Unit tests for Weekly Plan Generator and Shopping List Aggregator.
"""

import unittest
from backend.nutrition.calculator import enrich_family_member
from backend.planner.generator import generate_weekly_plan, swap_meal_in_plan
from backend.planner.shopping_list import generate_shopping_list_from_plan, format_whatsapp_export


class TestPlannerAndShoppingList(unittest.TestCase):

    def setUp(self):
        self.member1 = enrich_family_member({
            "id": "mem-1", "name": "Dennis", "gender": "male", "age": 32,
            "height_cm": 184, "weight_kg": 85, "activity_level": "moderate",
            "goal": "gain_muscle", "dietary_preference": "all", "allergies": []
        })
        self.member2 = enrich_family_member({
            "id": "mem-2", "name": "Sarah", "gender": "female", "age": 30,
            "height_cm": 168, "weight_kg": 64, "activity_level": "moderate",
            "goal": "lose_weight", "dietary_preference": "all", "allergies": []
        })
        self.family = [self.member1, self.member2]

    def test_weekly_plan_generation(self):
        plan = generate_weekly_plan(self.family)
        self.assertEqual(len(plan.days), 7)

        for day in plan.days:
            # Check meal types
            self.assertEqual(day.breakfast.meal_type, "breakfast_lunchbox")
            self.assertEqual(day.lunch.meal_type, "lunch_lunchbox")
            self.assertEqual(day.dinner.meal_type, "dinner_home")

            # Check individual portions exist for both members
            self.assertIn("mem-1", day.portions)
            self.assertIn("mem-2", day.portions)

            # Dennis should have higher calories than Sarah due to bodyweight & muscle gain goal
            dennis_cals = day.daily_nutrition_by_member["mem-1"]["calories"]
            sarah_cals = day.daily_nutrition_by_member["mem-2"]["calories"]
            self.assertGreater(dennis_cals, sarah_cals)

    def test_shopping_list_aggregation(self):
        plan = generate_weekly_plan(self.family)
        shopping_list = generate_shopping_list_from_plan(plan)

        # Should have items in Netto and NP
        self.assertGreater(len(shopping_list.items_netto), 0)
        self.assertGreater(len(shopping_list.items_np), 0)
        self.assertGreater(shopping_list.total_price, 0)
        self.assertGreater(shopping_list.total_savings, 0)

        # Check export text formatting
        wa_text = format_whatsapp_export(shopping_list)
        self.assertIn("NETTO MARKEN-DISCOUNT", wa_text)
        self.assertIn("NP DISCOUNT", wa_text)
        self.assertIn("Ersparnis", wa_text)


if __name__ == "__main__":
    unittest.main()

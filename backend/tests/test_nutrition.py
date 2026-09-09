"""
Unit tests for nutrition calculations and portion scaling.
"""

import unittest
from backend.nutrition.calculator import (
    calculate_bmr, calculate_tdee, calculate_target_macros,
    enrich_family_member, scale_recipe_for_person
)
from backend.models import Recipe, RecipeIngredient


class TestNutritionCalculations(unittest.TestCase):

    def test_bmr_calculation_male(self):
        # Dennis: 85kg, 184cm, 32 years old
        # BMR = 10*85 + 6.25*184 - 5*32 + 5 = 850 + 1150 - 160 + 5 = 1845 kcal
        bmr = calculate_bmr(gender="male", weight_kg=85, height_cm=184, age=32)
        self.assertEqual(bmr, 1845.0)

    def test_bmr_calculation_female(self):
        # Sarah: 64kg, 168cm, 30 years old
        # BMR = 10*64 + 6.25*168 - 5*30 - 161 = 640 + 1050 - 150 - 161 = 1379 kcal
        bmr = calculate_bmr(gender="female", weight_kg=64, height_cm=168, age=30)
        self.assertEqual(bmr, 1379.0)

    def test_tdee_and_goal_targets(self):
        bmr = 1845.0
        tdee = calculate_tdee(bmr, "moderate")  # 1845 * 1.55 = 2859.75
        self.assertAlmostEqual(tdee, 2859.8, places=1)

        macros = calculate_target_macros(weight_kg=85, tdee=tdee, goal="gain_muscle")
        # Target calories should have a surplus (~3145)
        self.assertGreater(macros["target_calories"], tdee)
        # Protein should be approx 85 * 2.2 = 187g
        self.assertEqual(macros["target_protein_g"], 187)

    def test_portion_scaling(self):
        member_data = {
            "id": "mem-1",
            "name": "Dennis",
            "gender": "male",
            "age": 32,
            "height_cm": 184,
            "weight_kg": 85,
            "activity_level": "moderate",
            "goal": "maintain",
            "dietary_preference": "all",
            "allergies": []
        }
        member = enrich_family_member(member_data)

        sample_recipe = Recipe(
            id="test-1",
            title="Overnight Oats",
            meal_type="breakfast_lunchbox",
            prep_time_minutes=5,
            base_calories=400,
            base_protein_g=20,
            base_carbs_g=50,
            base_fat_g=10,
            ingredients=[
                RecipeIngredient(name="Haferflocken", base_amount=60, unit="g"),
                RecipeIngredient(name="Heidelbeeren", base_amount=50, unit="g"),
            ],
            instructions=["Verrühren"],
        )

        portion = scale_recipe_for_person(sample_recipe, member, "breakfast_lunchbox")
        self.assertEqual(portion.member_name, "Dennis")
        self.assertGreater(portion.scale_factor, 0.5)
        self.assertGreater(portion.scaled_calories, 0)
        self.assertEqual(len(portion.scaled_ingredients), 2)


if __name__ == "__main__":
    unittest.main()

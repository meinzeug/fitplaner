"""
Unit tests for Recipe Universe (1,200+ recipes), zero repetition over weeks,
multi-supermarket digital leaflets, and realistic leaflet validity horizons.
"""

import unittest
from backend.models import FamilyMember
from backend.nutrition.calculator import enrich_family_member
from backend.nutrition.recipe_universe import (
    get_all_universe_recipes, filter_universe_recipes, get_universe_stats, get_recipe_by_id
)
from backend.planner.generator import generate_weekly_plan
from backend.scrapers.leaflets import get_all_leaflets, get_leaflet_by_retailer
from backend.planner.shopping_list import generate_shopping_list_from_plan


class TestRecipeUniverseAndSupermarkets(unittest.TestCase):

    def setUp(self):
        self.member = enrich_family_member({
            "id": "mem-1", "name": "Dennis", "gender": "male", "age": 32,
            "height_cm": 184, "weight_kg": 85, "activity_level": "active",
            "goal": "gain_muscle", "dietary_preference": "all", "allergies": []
        })
        self.family = [self.member]

    def test_recipe_universe_volume(self):
        recipes = get_all_universe_recipes()
        self.assertGreaterEqual(len(recipes), 1000, "Recipe database must contain at least 1,000 recipes")
        stats = get_universe_stats()
        self.assertTrue(stats["is_ai_free"])
        self.assertGreaterEqual(stats["breakfasts"], 300)
        self.assertGreaterEqual(stats["lunches"], 300)
        self.assertGreaterEqual(stats["dinners"], 300)

    def test_recipe_diets_coverage(self):
        # All major dietary styles must have plenty of compatible recipes
        diets_to_test = [
            "vegetarian", "vegan", "pescetarian", "no_pork",
            "high_protein", "low_carb", "gluten_free", "lactose_free"
        ]
        for diet in diets_to_test:
            matches = filter_universe_recipes(diet=diet)
            self.assertGreater(len(matches), 50, f"Diet '{diet}' must have at least 50 recipes")

    def test_zero_repetition_across_weeks(self):
        plan_w0 = generate_weekly_plan(self.family, week_offset=0)
        plan_w1 = generate_weekly_plan(self.family, week_offset=1)
        plan_w2 = generate_weekly_plan(self.family, week_offset=2)

        # Compare Monday dinners across week 0, week 1, week 2
        w0_dinner_titles = [d.dinner.title for d in plan_w0.days]
        w1_dinner_titles = [d.dinner.title for d in plan_w1.days]
        w2_dinner_titles = [d.dinner.title for d in plan_w2.days]

        # Ensure week 1 doesn't repeat week 0 dinners
        overlap_0_1 = set(w0_dinner_titles).intersection(set(w1_dinner_titles))
        self.assertEqual(len(overlap_0_1), 0, f"Weeks 0 and 1 should have 0 overlapping dinners: {overlap_0_1}")

        overlap_1_2 = set(w1_dinner_titles).intersection(set(w2_dinner_titles))
        self.assertEqual(len(overlap_1_2), 0, f"Weeks 1 and 2 should have 0 overlapping dinners: {overlap_1_2}")

    def test_leaflet_validity_horizon(self):
        # Week 0 = active
        plan_w0 = generate_weekly_plan(self.family, week_offset=0)
        self.assertEqual(plan_w0.leaflet_availability_status, "active")

        # Week 1 = preview
        plan_w1 = generate_weekly_plan(self.family, week_offset=1)
        self.assertEqual(plan_w1.leaflet_availability_status, "preview")

        # Week 2+ = not_yet_published
        plan_w2 = generate_weekly_plan(self.family, week_offset=2)
        self.assertEqual(plan_w2.leaflet_availability_status, "not_yet_published")
        self.assertIn("erscheinen erst am", plan_w2.leaflet_availability_note)

    def test_multi_supermarket_leaflets(self):
        all_leaflets = get_all_leaflets()
        retailer_names = [l.retailer for l in all_leaflets]

        # Netto, NP, Lidl, Aldi Nord, Aldi Süd, Rewe, Kaufland, Edeka
        self.assertIn("Netto", retailer_names)
        self.assertIn("NP", retailer_names)
        self.assertIn("Lidl", retailer_names)
        self.assertIn("Aldi Nord", retailer_names)
        self.assertIn("Aldi Süd", retailer_names)
        self.assertIn("Rewe", retailer_names)
        self.assertIn("Kaufland", retailer_names)
        self.assertIn("Edeka", retailer_names)

        lidl_brochure = get_leaflet_by_retailer("Lidl")
        self.assertIsNotNone(lidl_brochure)
        self.assertGreater(len(lidl_brochure.pages), 0)

    def test_multi_retailer_shopping_list(self):
        plan = generate_weekly_plan(self.family, week_offset=0)
        shopping_list = generate_shopping_list_from_plan(plan)

        self.assertIsNotNone(shopping_list.items_by_retailer)
        self.assertGreater(shopping_list.total_price, 0)
        self.assertGreater(shopping_list.total_savings, 0)


if __name__ == "__main__":
    unittest.main()

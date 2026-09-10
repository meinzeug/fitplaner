"""
Unit tests for Recipe Universe (1,200+ recipes), zero repetition over weeks,
multi-supermarket digital leaflets, and realistic leaflet validity horizons.
"""

import unittest
from backend.models import FamilyMember
from backend.nutrition.calculator import enrich_family_member, scale_recipe_for_person
from backend.nutrition.recipe_universe import (
    get_all_universe_recipes, filter_universe_recipes, get_universe_stats, get_recipe_by_id
)
from backend.planner.generator import generate_weekly_plan, swap_meal_in_plan
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
        self.assertGreaterEqual(len(recipes), 100, "Recipe database must contain at least 100 hand-curated recipes")
        stats = get_universe_stats()
        self.assertTrue(stats["is_ai_free"])
        self.assertGreaterEqual(stats["breakfasts"], 30)
        self.assertGreaterEqual(stats["lunches"], 30)
        self.assertGreaterEqual(stats["dinners"], 30)

    def test_clean_purchasable_ingredients(self):
        """Ensures NO ingredients have combined strings like 'Brokkoli & Olivenöl'."""
        recipes = get_all_universe_recipes()
        for r in recipes:
            for ing in r.ingredients:
                self.assertNotIn(" & ", ing.name, f"Ingredient '{ing.name}' in '{r.title}' must not contain '&'")
                self.assertNotIn(" und ", ing.name, f"Ingredient '{ing.name}' in '{r.title}' must not contain 'und'")
                self.assertGreater(ing.base_amount, 0, f"Amount for '{ing.name}' in '{r.title}' must be positive")

    def test_recipe_diets_coverage(self):
        # All major dietary styles must have plenty of compatible recipes
        diets_to_test = [
            ("vegetarian", 30),
            ("vegan", 15),
            ("pescetarian", 40),
            ("no_pork", 50),
            ("high_protein", 30),
            ("gluten_free", 30),
            ("lactose_free", 30),
        ]
        for diet, min_count in diets_to_test:
            matches = filter_universe_recipes(diet=diet)
            self.assertGreaterEqual(len(matches), min_count, f"Diet '{diet}' must have at least {min_count} recipes")

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

    def test_supermarket_filtering_netto_np_only(self):
        """Verifies that when only ['Netto', 'NP'] are active, no unselected retailers appear in the plan."""
        active = ["Netto", "NP"]
        plan = generate_weekly_plan(
            family_members=self.family,
            week_offset=0,
            active_retailers=active,
            primary_retailer="Netto"
        )
        self.assertEqual(plan.active_retailers, active)
        self.assertIn("Netto, NP", plan.leaflet_availability_note)
        self.assertNotIn("Lidl", plan.leaflet_availability_note)
        self.assertNotIn("Rewe", plan.leaflet_availability_note)

        allowed_retailers = {"Netto", "NP", "Vorratskammer"}
        for day in plan.days:
            for meal in [day.breakfast, day.lunch, day.dinner]:
                for ing in meal.ingredients:
                    self.assertIn(
                        ing.matched_offer_retailer,
                        allowed_retailers,
                        f"Found unselected retailer '{ing.matched_offer_retailer}' in recipe '{meal.title}'"
                    )
            for member_id, portions in day.portions.items():
                for meal_key, portion in portions.items():
                    for scaled_ing in portion.scaled_ingredients:
                        self.assertIn(
                            scaled_ing.matched_retailer,
                            allowed_retailers,
                            f"Found unselected retailer '{scaled_ing.matched_retailer}' in scaled ingredient '{scaled_ing.name}'"
                        )

    def test_plan_reshuffling_with_seed_and_shuffle(self):
        """Verifies that shuffle=True with different seeds reshuffles meals and identical seeds produce the same plan."""
        plan_seed_a1 = generate_weekly_plan(self.family, week_offset=0, shuffle=True, seed=42)
        plan_seed_a2 = generate_weekly_plan(self.family, week_offset=0, shuffle=True, seed=42)
        a1_meals = [(d.breakfast.title, d.lunch.title, d.dinner.title) for d in plan_seed_a1.days]
        a2_meals = [(d.breakfast.title, d.lunch.title, d.dinner.title) for d in plan_seed_a2.days]
        self.assertEqual(a1_meals, a2_meals, "Same seed must produce identical meal plans")

        plan_seed_b = generate_weekly_plan(self.family, week_offset=0, shuffle=True, seed=99999)
        b_meals = [(d.breakfast.title, d.lunch.title, d.dinner.title) for d in plan_seed_b.days]
        self.assertNotEqual(a1_meals, b_meals, "Different seeds must produce different meal selections")

    def test_swap_meal_remaps_to_active_retailers(self):
        """Verifies that swap_meal_in_plan remaps ingredients of swapped recipe to active retailers."""
        active = ["Netto", "NP"]
        plan = generate_weekly_plan(self.family, week_offset=0, active_retailers=active, primary_retailer="Netto")
        all_recipes = get_all_universe_recipes()
        foreign_recipe = next(
            r for r in all_recipes
            if any(ing.matched_offer_retailer in ["Lidl", "Rewe", "Kaufland"] for ing in r.ingredients)
        )
        updated_plan = swap_meal_in_plan(
            plan=plan,
            day_index=0,
            meal_type="dinner",
            new_recipe_id=foreign_recipe.id,
            family_members=self.family,
            active_retailers=active,
            primary_retailer="Netto"
        )
        allowed_retailers = {"Netto", "NP", "Vorratskammer"}
        for ing in updated_plan.days[0].dinner.ingredients:
            self.assertIn(ing.matched_offer_retailer, allowed_retailers)
        for scaled_ing in updated_plan.days[0].portions[self.member.id]["dinner"].scaled_ingredients:
            self.assertIn(scaled_ing.matched_retailer, allowed_retailers)

    def test_scale_recipe_respects_active_and_primary_retailer(self):
        """Verifies that scale_recipe_for_person remaps unselected retailers to primary_retailer."""
        all_recipes = get_all_universe_recipes()
        rewe_recipe = next(
            r for r in all_recipes
            if any(ing.matched_offer_retailer == "Rewe" for ing in r.ingredients)
        )
        portion = scale_recipe_for_person(
            recipe=rewe_recipe,
            member=self.member,
            meal_type="dinner_home",
            active_retailers=["Netto", "NP"],
            primary_retailer="Netto"
        )
        for ing in portion.scaled_ingredients:
            self.assertIn(ing.matched_retailer, ["Netto", "NP", "Vorratskammer"])

    def test_api_plan_generate_reshuffles(self):
        """Verifies that POST /api/plan/generate produces reshuffled meal selections."""
        from fastapi.testclient import TestClient
        from backend.main import app
        client = TestClient(app)
        res1 = client.post("/api/plan/generate?week_offset=0")
        self.assertEqual(res1.status_code, 200)
        meals1 = [(d["breakfast"]["title"], d["lunch"]["title"], d["dinner"]["title"]) for d in res1.json()["days"]]

        different_found = False
        for _ in range(5):
            res2 = client.post("/api/plan/generate?week_offset=0")
            self.assertEqual(res2.status_code, 200)
            meals2 = [(d["breakfast"]["title"], d["lunch"]["title"], d["dinner"]["title"]) for d in res2.json()["days"]]
            if meals1 != meals2:
                different_found = True
                break
        self.assertTrue(different_found, "Calling POST /api/plan/generate should reshuffle meals")

    def test_get_or_create_weekly_plan_cache_invalidation_on_retailer_change(self):
        """Verifies that get_or_create_weekly_plan invalidates cache when settings.active_retailers change."""
        from backend.main import get_or_create_weekly_plan, weekly_plans_store
        from backend.settings_storage import get_app_settings, save_app_settings
        settings = get_app_settings()
        orig_retailers = list(settings.active_retailers)
        try:
            settings.active_retailers = ["Netto", "NP"]
            save_app_settings(settings)
            plan1 = get_or_create_weekly_plan(0)
            self.assertEqual(plan1.active_retailers, ["Netto", "NP"])

            settings.active_retailers = ["Lidl", "Rewe"]
            save_app_settings(settings)
            plan2 = get_or_create_weekly_plan(0)
            self.assertEqual(plan2.active_retailers, ["Lidl", "Rewe"])
        finally:
            settings.active_retailers = orig_retailers
            save_app_settings(settings)
            weekly_plans_store.clear()

    def test_option_a_mixed_family_dinner_vegetarian_and_lunch_individualized(self):
        """
        Verifies Option A:
        - Dinner is cooked in 1 shared pot for the entire family and MUST be 100% vegetarian-compliant
          when a family member is vegetarian (no chicken, pork, beef, fish).
        - Both Dennis and Juna share the exact same dinner.
        - Juna's breakfast and lunch are strictly vegetarian.
        - Dennis can receive his high-protein lunches.
        - PersonMealPortion contains recipe_id.
        """
        dennis = enrich_family_member({
            "id": "mem-1", "name": "Dennis", "gender": "male", "age": 42,
            "height_cm": 172, "weight_kg": 65, "activity_level": "moderate",
            "goal": "gain_muscle", "dietary_preference": "high_protein", "allergies": ["fisch"]
        })
        juna = enrich_family_member({
            "id": "mem-3", "name": "Juna Fee", "gender": "female", "age": 12,
            "height_cm": 150, "weight_kg": 42, "activity_level": "moderate",
            "goal": "maintain", "dietary_preference": "vegetarian", "allergies": []
        })
        family = [dennis, juna]

        meat_keywords = ["hähnchen", "huhn", "pute", "rind", "schwein", "hackfleisch", "lachs", "thunfisch", "fisch", "garnele", "salami", "schinken", "speck"]

        plan = generate_weekly_plan(family_members=family, week_offset=0, shuffle=True, seed=12345)

        for day in plan.days:
            # 1. Dinner shared pot check
            self.assertTrue(
                "vegetarian" in day.dinner.diet_types or "vegan" in day.dinner.diet_types,
                f"Day {day.day_name} dinner '{day.dinner.title}' must be vegetarian or vegan"
            )
            for ing in day.dinner.ingredients:
                self.assertFalse(
                    any(m in ing.name.lower() for m in meat_keywords),
                    f"Day {day.day_name} dinner '{day.dinner.title}' contains meat ingredient '{ing.name}'"
                )

            d_p = day.portions[dennis.id]
            j_p = day.portions[juna.id]

            # Dennis and Juna share the exact same dinner (Option A 1-pot)
            self.assertEqual(d_p["dinner"].recipe_id, day.dinner.id)
            self.assertEqual(j_p["dinner"].recipe_id, day.dinner.id)
            self.assertEqual(d_p["dinner"].recipe_title, j_p["dinner"].recipe_title)

            # Recipe ID must be set
            self.assertIsNotNone(d_p["breakfast"].recipe_id)
            self.assertIsNotNone(d_p["lunch"].recipe_id)
            self.assertIsNotNone(j_p["breakfast"].recipe_id)
            self.assertIsNotNone(j_p["lunch"].recipe_id)

            # Juna's breakfast & lunch must strictly have NO meat or fish
            for meal_key in ["breakfast", "lunch"]:
                j_portion = j_p[meal_key]
                for ing in j_portion.scaled_ingredients:
                    self.assertFalse(
                        any(m in ing.name.lower() for m in meat_keywords),
                        f"Juna's {meal_key} '{j_portion.recipe_title}' contains forbidden ingredient '{ing.name}'"
                    )

            # Dennis's lunch and breakfast must NOT contain fish (his allergy)
            for meal_key in ["breakfast", "lunch", "dinner"]:
                d_portion = d_p[meal_key]
                for ing in d_portion.scaled_ingredients:
                    self.assertNotIn("fisch", ing.name.lower())
                    self.assertNotIn("lachs", ing.name.lower())
                    self.assertNotIn("thunfisch", ing.name.lower())


if __name__ == "__main__":
    unittest.main()

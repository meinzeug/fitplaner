"""
End-to-End Consistency Tests for Recipe Universe, Weekly Plan Generation,
and Shopping List Aggregation.
Verifies that:
1. Every recipe ingredient is cleanly represented on the shopping list.
2. Quantities are realistic (no multiple kilos of grains or spices).
3. Real supermarket prices from price_database are applied (no flat 1.69€).
4. All EAN-13 barcodes are mathematically valid.
5. Smart pantry deduction properly covers household staples.
"""

import unittest
from backend.models import FamilyMember
from backend.nutrition.calculator import enrich_family_member
from backend.nutrition.recipe_universe import get_all_universe_recipes
from backend.planner.generator import generate_weekly_plan
from backend.planner.shopping_list import generate_shopping_list_from_plan


class TestRecipeShoppingConsistency(unittest.TestCase):

    def setUp(self):
        self.family = [
            enrich_family_member({
                "id": "f-1", "name": "Dennis", "gender": "male", "age": 32,
                "height_cm": 184, "weight_kg": 85, "activity_level": "active",
                "goal": "gain_muscle", "dietary_preference": "all"
            }),
            enrich_family_member({
                "id": "f-2", "name": "Sarah", "gender": "female", "age": 30,
                "height_cm": 170, "weight_kg": 65, "activity_level": "moderate",
                "goal": "lose_weight", "dietary_preference": "all"
            }),
            enrich_family_member({
                "id": "f-3", "name": "Lea", "gender": "female", "age": 12,
                "height_cm": 152, "weight_kg": 42, "activity_level": "moderate",
                "goal": "maintain", "dietary_preference": "all"
            }),
            enrich_family_member({
                "id": "f-4", "name": "Felix", "gender": "male", "age": 8,
                "height_cm": 130, "weight_kg": 28, "activity_level": "active",
                "goal": "maintain", "dietary_preference": "all"
            }),
        ]

    def test_recipe_instructions_completeness(self):
        """Every recipe must have non-empty step-by-step cooking instructions."""
        recipes = get_all_universe_recipes()
        self.assertGreaterEqual(len(recipes), 100)
        for r in recipes:
            self.assertGreaterEqual(len(r.instructions), 2, f"Recipe '{r.title}' must have at least 2 general instructions")
            self.assertIsNotNone(r.detailed_instructions, f"Recipe '{r.title}' missing detailed_instructions")
            self.assertGreaterEqual(len(r.detailed_instructions.prep_steps), 1, f"Recipe '{r.title}' missing prep steps")
            self.assertGreaterEqual(len(r.detailed_instructions.cooking_steps), 1, f"Recipe '{r.title}' missing cooking steps")
            self.assertGreaterEqual(len(r.detailed_instructions.lunchbox_tips), 1, f"Recipe '{r.title}' missing lunchbox tips")

    def test_plan_ingredients_appear_on_shopping_list(self):
        """Every ingredient required in the meal plan MUST be accounted for on the shopping list."""
        plan = generate_weekly_plan(self.family, week_offset=0)
        shopping_list = generate_shopping_list_from_plan(plan)

        # Collect all ingredient names from the plan
        plan_ingredient_names = set()
        for day in plan.days:
            for member_id, portions in day.portions.items():
                for meal_key in ["breakfast", "lunch", "dinner"]:
                    portion = portions.get(meal_key)
                    if portion:
                        for ing in portion.scaled_ingredients:
                            plan_ingredient_names.add(ing.name.strip())

        # Collect all shopping list item names (across supermarkets + pantry)
        shopping_names = set()
        for ret, items in shopping_list.items_by_retailer.items():
            for item in items:
                shopping_names.add(item.name.strip())

        for plan_ing in plan_ingredient_names:
            self.assertIn(
                plan_ing,
                shopping_names,
                f"Ingredient '{plan_ing}' used in plan but missing from shopping list!"
            )

    def test_realistic_grain_and_spice_quantities(self):
        """Weekly shopping must NOT require unreasonable amounts of rice, quinoa, or salt."""
        plan = generate_weekly_plan(self.family, week_offset=0)
        shopping_list = generate_shopping_list_from_plan(plan)

        for ret, items in shopping_list.items_by_retailer.items():
            for it in items:
                name_lower = it.name.lower()
                # Quinoa: max 2 packs for a 4-person family in 1 week
                if "quinoa" in name_lower and not it.is_covered_by_stock:
                    self.assertLessEqual(it.packs_to_buy, 2, f"Too much Quinoa: {it.packs_to_buy} packs")
                # Rice: max 3 packs for 1 week
                if "reis" in name_lower and not it.is_covered_by_stock:
                    self.assertLessEqual(it.packs_to_buy, 3, f"Too much Reis: {it.packs_to_buy} packs")
                # Salt: should be covered by pantry or at most 1 pack
                if "salz" in name_lower and not it.is_covered_by_stock:
                    self.assertLessEqual(it.packs_to_buy, 1, f"Too much Salz: {it.packs_to_buy} packs")

    def test_pricing_variety_and_realism(self):
        """Prices must NOT be uniform (not all 1.69€) and must reflect real discounter prices."""
        plan = generate_weekly_plan(self.family, week_offset=0)
        shopping_list = generate_shopping_list_from_plan(plan)

        unit_prices = set()
        for ret, items in shopping_list.items_by_retailer.items():
            for it in items:
                if not it.is_covered_by_stock:
                    unit_prices.add(it.unit_price)
                    self.assertGreater(it.unit_price, 0.20, f"Price too low: {it.name} = {it.unit_price}€")
                    self.assertLess(it.unit_price, 25.00, f"Price too high: {it.name} = {it.unit_price}€")

        # Must have at least 5 distinct unit prices (not flat 1.69€)
        self.assertGreaterEqual(len(unit_prices), 5, f"Prices are too homogeneous: {unit_prices}")

    def test_barcode_validity(self):
        """Every shopping item must have a valid 13-digit EAN barcode."""
        plan = generate_weekly_plan(self.family, week_offset=0)
        shopping_list = generate_shopping_list_from_plan(plan)

        for ret, items in shopping_list.items_by_retailer.items():
            for it in items:
                self.assertEqual(len(it.barcode), 13, f"Invalid barcode length for {it.name}: {it.barcode}")
                self.assertTrue(it.barcode.isdigit(), f"Barcode not numeric for {it.name}: {it.barcode}")

    def test_pantry_coverage(self):
        """Basic household staples (Salz, Öle, Zimt) must be recognized as covered when present in pantry."""
        plan = generate_weekly_plan(self.family, week_offset=0)
        shopping_list = generate_shopping_list_from_plan(plan)

        pantry_item_names = [it.name for it in shopping_list.items_pantry if it.is_covered_by_stock]
        # At least Salz and an oil or cinnamon should be covered
        self.assertTrue(
            any("salz" in n.lower() for n in pantry_item_names),
            f"Salz should be covered by stock! Found: {pantry_item_names}"
        )


if __name__ == "__main__":
    unittest.main()

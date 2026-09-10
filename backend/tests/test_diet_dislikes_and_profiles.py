import unittest
from backend.models import FamilyMember, Recipe, RecipeIngredient
from backend.nutrition.diet_validator import (
    is_recipe_diet_compatible,
    recipe_violates_allergies,
    recipe_violates_dislikes,
    is_dairy_ingredient,
    is_egg_ingredient,
    is_meat_ingredient,
    is_seafood_ingredient,
    sanitize_recipe_diets_and_allergens,
    filter_recipes_for_family,
)
from backend.planner.generator import generate_weekly_plan
import backend.main
from backend.main import save_family_member, delete_family_member, MemberInput


class TestDietDislikesAndProfiles(unittest.TestCase):
    def test_member_id_collision_prevention(self):
        """
        Problem 2 Verification:
        When 1 member is deleted leaving only e.g. 'mem-2', adding a new member
        must generate 'mem-3' (or higher) and MUST NOT overwrite 'mem-2'.
        """
        backend.main.family_profiles.clear()

        # Create member 1 and member 2
        m1 = save_family_member(MemberInput(
            name="Member 1", gender="male", age=30, height_cm=180, weight_kg=75,
            activity_level="moderate", goal="maintain", dietary_preference="all",
            allergies=[], disliked_foods=["rindfleisch"]
        ))
        m2 = save_family_member(MemberInput(
            name="Member 2", gender="female", age=28, height_cm=168, weight_kg=60,
            activity_level="moderate", goal="maintain", dietary_preference="vegetarian",
            allergies=["nuesse"], disliked_foods=["pilze"]
        ))

        self.assertEqual(m1.id, "mem-1")
        self.assertEqual(m2.id, "mem-2")
        self.assertEqual(len(backend.main.family_profiles), 2)
        self.assertEqual(m1.disliked_foods, ["rindfleisch"])
        self.assertEqual(m2.disliked_foods, ["pilze"])

        # Delete member 1 -> Only member 2 remains
        delete_family_member(m1.id)
        self.assertEqual(len(backend.main.family_profiles), 1)
        self.assertEqual(backend.main.family_profiles[0].id, "mem-2")

        # Now add member 3 -> Must NOT be named 'mem-2' and must NOT replace member 2!
        m3 = save_family_member(MemberInput(
            name="Member 3", gender="female", age=25, height_cm=165, weight_kg=55,
            activity_level="light", goal="lose_weight", dietary_preference="vegan",
            allergies=[], disliked_foods=[]
        ))

        self.assertEqual(m3.id, "mem-3")
        self.assertEqual(len(backend.main.family_profiles), 2)
        self.assertEqual(backend.main.family_profiles[0].id, "mem-2")
        self.assertEqual(backend.main.family_profiles[0].name, "Member 2")
        self.assertEqual(backend.main.family_profiles[1].id, "mem-3")
        self.assertEqual(backend.main.family_profiles[1].name, "Member 3")

    def test_disliked_foods_preserved_in_member_input(self):
        """Verify disliked_foods is accepted and persisted by MemberInput."""
        m = save_family_member(MemberInput(
            name="Test Dislikes", gender="male", age=35, height_cm=175, weight_kg=70,
            activity_level="moderate", goal="maintain", dietary_preference="all",
            allergies=["gluten"], disliked_foods=["lachs", "brokkoli", "rosinen"]
        ))
        self.assertEqual(m.disliked_foods, ["lachs", "brokkoli", "rosinen"])
        delete_family_member(m.id)

    def test_vegan_weekly_plan_has_zero_animal_products(self):
        """
        Problem 1 Verification:
        When a user is vegan, EVERY meal in the weekly plan across all 7 days
        must have 0 meat, 0 fish, 0 dairy, 0 egg, and 0 honey.
        """
        vegan_member = FamilyMember(
            id="mem-vegan",
            name="Vegan User",
            gender="female",
            age=26,
            height_cm=168.0,
            weight_kg=58.0,
            activity_level="moderate",
            goal="maintain",
            dietary_preference="vegan",
            allergies=[],
            disliked_foods=[],
        )

        plan = generate_weekly_plan([vegan_member])

        for day in plan.days:
            # Check breakfast, lunch, and dinner portions for the vegan member
            portions = day.portions[vegan_member.id]
            for meal_key, portion in portions.items():
                self.assertIsNotNone(portion.recipe_title)
                for ing in portion.scaled_ingredients:
                    ing_name = ing.name
                    self.assertFalse(is_meat_ingredient(ing_name), f"Meat '{ing_name}' in vegan {meal_key} on {day.day_name}")
                    self.assertFalse(is_seafood_ingredient(ing_name), f"Fish '{ing_name}' in vegan {meal_key} on {day.day_name}")
                    self.assertFalse(is_dairy_ingredient(ing_name), f"Dairy '{ing_name}' in vegan {meal_key} on {day.day_name}")
                    self.assertFalse(is_egg_ingredient(ing_name), f"Egg '{ing_name}' in vegan {meal_key} on {day.day_name}")

    def test_vegetarian_weekly_plan_has_zero_meat_or_fish(self):
        """
        Problem 1 Verification:
        When a user is vegetarian, EVERY meal across all 7 days must have 0 meat and 0 fish.
        """
        veg_member = FamilyMember(
            id="mem-veg",
            name="Vegetarian User",
            gender="male",
            age=32,
            height_cm=182.0,
            weight_kg=76.0,
            activity_level="moderate",
            goal="maintain",
            dietary_preference="vegetarian",
            allergies=[],
            disliked_foods=[],
        )

        plan = generate_weekly_plan([veg_member])

        for day in plan.days:
            portions = day.portions[veg_member.id]
            for meal_key, portion in portions.items():
                for ing in portion.scaled_ingredients:
                    ing_name = ing.name
                    self.assertFalse(is_meat_ingredient(ing_name), f"Meat '{ing_name}' in veg {meal_key} on {day.day_name}")
                    self.assertFalse(is_seafood_ingredient(ing_name), f"Fish '{ing_name}' in veg {meal_key} on {day.day_name}")

    def test_mixed_family_option_a_shared_pot(self):
        """
        When household has 1 Omnivore and 1 Vegetarian:
        Shared dinner MUST be 100% vegetarian (Omnivore eats vegetarian dinner).
        """
        omnivore = FamilyMember(
            id="mem-omni", name="Omni", gender="male", age=30, height_cm=180, weight_kg=80,
            activity_level="moderate", goal="maintain", dietary_preference="all"
        )
        vegetarian = FamilyMember(
            id="mem-veg", name="Veggie", gender="female", age=28, height_cm=170, weight_kg=60,
            activity_level="moderate", goal="maintain", dietary_preference="vegetarian"
        )

        plan = generate_weekly_plan([omnivore, vegetarian], meal_sharing={"breakfast": "individual", "lunch": "individual", "dinner": "shared"})

        for day in plan.days:
            # Dinner is shared
            self.assertTrue("vegetarian" in day.dinner.diet_types or "vegan" in day.dinner.diet_types,
                            f"Shared dinner {day.dinner.title} is not vegetarian!")
            for ing in day.dinner.ingredients:
                self.assertFalse(is_meat_ingredient(ing.name), f"Meat in shared dinner: {ing.name}")
                self.assertFalse(is_seafood_ingredient(ing.name), f"Fish in shared dinner: {ing.name}")

    def test_dislike_rindfleisch_and_lachs_filters(self):
        """
        Verify that disliking 'Rindfleisch' strictly filters 'Rinderhack' and 'Rindersteak',
        and disliking 'Lachs' strictly filters 'Lachsfilet' and 'Räucherlachs'.
        """
        recipe_rind = Recipe(
            id="test-rind", title="Würzige Rinderhack-Pfanne", meal_type="dinner_home",
            prep_time_minutes=15, cook_time_minutes=20, base_calories=600, base_protein_g=40,
            base_carbs_g=30, base_fat_g=20,
            ingredients=[RecipeIngredient(name="Rinderhack", base_amount=150, unit="g")],
            instructions=["Anbraten"]
        )
        self.assertTrue(recipe_violates_dislikes(recipe_rind, ["rindfleisch"]))
        self.assertTrue(recipe_violates_dislikes(recipe_rind, ["rind"]))
        self.assertTrue(recipe_violates_dislikes(recipe_rind, ["hackfleisch"]))
        self.assertTrue(recipe_violates_dislikes(recipe_rind, ["fleisch"]))

        recipe_lachs = Recipe(
            id="test-lachs", title="Feiner Räucherlachs mit Kartoffeln", meal_type="dinner_home",
            prep_time_minutes=10, cook_time_minutes=15, base_calories=500, base_protein_g=35,
            base_carbs_g=40, base_fat_g=15,
            ingredients=[RecipeIngredient(name="Räucherlachs", base_amount=100, unit="g")],
            instructions=["Servieren"]
        )
        self.assertTrue(recipe_violates_dislikes(recipe_lachs, ["lachs"]))
        self.assertTrue(recipe_violates_dislikes(recipe_lachs, ["fisch"]))

    def test_egg_dislike_and_allergy_no_false_positive_on_naturreis(self):
        """
        Verify that disliking or being allergic to 'ei' / 'eier' DOES NOT filter Naturreis or Leinsamen.
        """
        recipe_reis = Recipe(
            id="test-reis", title="Reis-Gemüse-Pfanne", meal_type="dinner_home",
            prep_time_minutes=10, cook_time_minutes=20, base_calories=450, base_protein_g=15,
            base_carbs_g=70, base_fat_g=10,
            ingredients=[
                RecipeIngredient(name="Naturreis", base_amount=100, unit="g"),
                RecipeIngredient(name="Leinsamen", base_amount=15, unit="g"),
            ],
            instructions=["Kochen"]
        )
        self.assertFalse(recipe_violates_allergies(recipe_reis, ["eier"]))
        self.assertFalse(recipe_violates_dislikes(recipe_reis, ["ei"]))
        self.assertFalse(recipe_violates_dislikes(recipe_reis, ["eier"]))

    def test_plant_milk_lactose_exemption(self):
        """
        Verify plant drinks (Hafermilch, Mandelmilch, Kokosmilch) do not violate lactose allergy.
        """
        recipe_porridge = Recipe(
            id="test-porridge", title="Hafermilch Beeren Porridge", meal_type="breakfast_lunchbox",
            prep_time_minutes=5, cook_time_minutes=5, base_calories=400, base_protein_g=15,
            base_carbs_g=60, base_fat_g=8,
            ingredients=[
                RecipeIngredient(name="Haferflocken", base_amount=80, unit="g"),
                RecipeIngredient(name="Hafermilch", base_amount=200, unit="ml"),
            ],
            instructions=["Kochen"]
        )
        self.assertFalse(recipe_violates_allergies(recipe_porridge, ["laktose"]))

        recipe_dairy = Recipe(
            id="test-dairy", title="Quark mit Milch", meal_type="breakfast_lunchbox",
            prep_time_minutes=5, cook_time_minutes=0, base_calories=300, base_protein_g=25,
            base_carbs_g=20, base_fat_g=5,
            ingredients=[
                RecipeIngredient(name="Magerquark", base_amount=200, unit="g"),
                RecipeIngredient(name="Milch", base_amount=50, unit="ml"),
            ],
            instructions=["Verrühren"]
        )
        self.assertTrue(recipe_violates_allergies(recipe_dairy, ["laktose"]))


if __name__ == "__main__":
    unittest.main()

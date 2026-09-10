"""
Unit tests for Pantry Shelf Stability and Leftover Logic.
Verifies that:
1. Fresh products (Fleisch, Fisch, frisches Gemüse, Beeren, Kühlregal) NEVER migrate to the pantry.
2. Only durable dry goods (Nudeln, Reis, Quinoa, Haferflocken, Kerne, Nüsse, Linsen, Gewürze, Öle) are pantry-eligible.
3. Leftover quantities on shopping list and during cart booking are only created for durable dry goods.
"""

import unittest
from backend.pantry.shelf_stability import is_shelf_stable_dry_good
from backend.pantry.inventory_manager import (
    book_shopping_cart_to_pantry, find_pantry_item_by_name, delete_pantry_item, _pantry_store
)
from backend.nutrition.calculator import enrich_family_member
from backend.planner.generator import generate_weekly_plan
from backend.planner.shopping_list import generate_shopping_list_from_plan


class TestPantryShelfStability(unittest.TestCase):

    def test_shelf_stability_classification(self):
        # 1. Fresh goods must return False
        fresh_items = [
            "Hähnchenbrust", "Putenbrustfilet", "Rinderhack mager", "Rindersteak",
            "Norwegisches Lachsfilet", "Kabeljaufilet", "Regenbogenforelle", "Garnelen",
            "Deutscher Brokkoli", "Zucchini frisch", "Rote Paprika", "Salatgurke",
            "Strauchtomaten", "Blattspinat", "Babyspinat", "Champignons frisch",
            "Bio Heidelbeeren", "Himbeeren", "Erdbeeren", "Bananen", "Äpfel",
            "Skyr Natur", "Magerquark", "Körniger Frischkäse", "Feta", "Mozzarella",
            "Bio Eier 10er", "Vollmilch 3.5%", "Butter", "Naturtofu", "TK Beerenmischung"
        ]
        for item in fresh_items:
            self.assertFalse(
                is_shelf_stable_dry_good(item),
                f"Fresh item '{item}' must NOT be shelf-stable!"
            )

        # 2. Durable dry goods must return True
        dry_items = [
            "Bio Haferflocken", "Dinkelflocken", "Bio Quinoa", "Naturreis", "Basmati Reis",
            "Vollkorn Spaghetti", "Penne", "Vollkornnudeln", "Couscous", "Bulgur",
            "Rote Linsen", "Walnüsse gehackt", "Mandeln", "Kürbiskerne", "Sonnenblumenkerne",
            "Chiasamen", "Leinsamen", "Cashewkerne", "Natives Olivenöl", "Rapsöl",
            "Salz", "Schwarzer Pfeffer", "Paprikapulver edelsüß", "Zimt gemahlen",
            "Oregano getrocknet", "Tomatenmark", "Dosentomaten stückig", "Knäckebrot"
        ]
        for item in dry_items:
            self.assertTrue(
                is_shelf_stable_dry_good(item),
                f"Durable dry good '{item}' must BE shelf-stable!"
            )

    def test_book_shopping_cart_rejects_fresh_items(self):
        cart = [
            {
                "name": "Frisches Hähnchenbrustfilet Spezial",
                "total_quantity": 400.0,
                "leftover_after_purchase": 100.0,
                "unit": "g",
                "category": "Kühlregal / Proteine",
            },
            {
                "name": "Frischer Knackiger Brokkoli",
                "total_quantity": 500.0,
                "leftover_after_purchase": 150.0,
                "unit": "g",
                "category": "Obst & Gemüse",
            },
            {
                "name": "Bio Quinoa Premium",
                "total_quantity": 500.0,
                "leftover_after_purchase": 220.0,
                "unit": "g",
                "category": "Trockensortiment & Vollkorn",
            },
        ]

        booked = book_shopping_cart_to_pantry(cart)
        booked_names = [b.name for b in booked]

        # Fresh items must NOT be booked
        self.assertNotIn("Frisches Hähnchenbrustfilet Spezial", booked_names)
        self.assertNotIn("Frischer Knackiger Brokkoli", booked_names)
        self.assertIsNone(find_pantry_item_by_name("Frisches Hähnchenbrustfilet Spezial"))
        self.assertIsNone(find_pantry_item_by_name("Frischer Knackiger Brokkoli"))

        # Dry good must be booked with its surplus (220g) as Restmenge!
        self.assertIn("Bio Quinoa Premium", booked_names)
        quinoa_pantry = find_pantry_item_by_name("Bio Quinoa Premium")
        self.assertIsNotNone(quinoa_pantry)
        self.assertEqual(quinoa_pantry.current_quantity, 220.0)
        self.assertEqual(quinoa_pantry.source, "Restmenge")

        # Cleanup
        delete_pantry_item(quinoa_pantry.id)

    def test_shopping_list_flags_fresh_vs_dry_goods(self):
        family = [
            enrich_family_member({
                "id": "f-1", "name": "Dennis", "gender": "male", "age": 32,
                "height_cm": 184, "weight_kg": 85, "activity_level": "active",
                "goal": "gain_muscle", "dietary_preference": "all"
            })
        ]
        plan = generate_weekly_plan(family, week_offset=0)
        shopping_list = generate_shopping_list_from_plan(plan)

        for store, items in shopping_list.items_by_retailer.items():
            for item in items:
                name_lower = item.name.lower()
                is_fresh = any(kw in name_lower for kw in ["hähnchen", "pute", "lachs", "brokkoli", "gurke", "spinat", "beere"])
                if is_fresh:
                    self.assertFalse(
                        item.is_pantry_eligible,
                        f"Fresh item '{item.name}' should have is_pantry_eligible=False"
                    )
                    self.assertEqual(
                        item.leftover_after_purchase, 0.0,
                        f"Fresh item '{item.name}' must have 0.0 leftover for pantry!"
                    )

                is_dry = any(kw in name_lower for kw in ["haferflocken", "quinoa", "reis", "nudel", "walnuss"])
                if is_dry:
                    self.assertTrue(
                        item.is_pantry_eligible,
                        f"Dry good '{item.name}' should have is_pantry_eligible=True"
                    )


if __name__ == "__main__":
    unittest.main()

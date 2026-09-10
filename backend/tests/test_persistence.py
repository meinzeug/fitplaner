import unittest
import os
import tempfile
from backend.models import FamilyMember, PantryItem, CustomShoppingItem, AppSettings
from backend.persistence import (
    save_family_profiles, load_family_profiles,
    save_pantry_items, load_pantry_items,
    save_custom_shopping_items, load_custom_shopping_items,
    FAMILY_PROFILES_FILE, PANTRY_ITEMS_FILE, CUSTOM_SHOPPING_FILE
)

class TestPersistenceLayer(unittest.TestCase):
    def test_family_profiles_persistence(self):
        member = FamilyMember(
            id="mem-test-999",
            name="Oma Erna",
            gender="female",
            age=72,
            height_cm=162.0,
            weight_kg=68.0,
            activity_level="light",
            goal="maintain",
            dietary_preference="all",
            allergies=["laktose"],
            water_intake_ml=1800,
        )
        # Save member
        current = load_family_profiles()
        test_list = current + [member]
        save_family_profiles(test_list)

        # Reload fresh from disk
        reloaded = load_family_profiles()
        ids = [m.id for m in reloaded]
        self.assertIn("mem-test-999", ids)
        oma = next(m for m in reloaded if m.id == "mem-test-999")
        self.assertEqual(oma.name, "Oma Erna")
        self.assertEqual(oma.allergies, ["laktose"])
        self.assertEqual(oma.water_intake_ml, 1800)

        # Clean up
        cleaned = [m for m in reloaded if m.id != "mem-test-999"]
        save_family_profiles(cleaned)
        reloaded_after_clean = load_family_profiles()
        self.assertNotIn("mem-test-999", [m.id for m in reloaded_after_clean])

    def test_pantry_items_persistence(self):
        item = PantryItem(
            id="pan-test-123",
            name="Test Bio-Dinkelvollkornnudeln",
            current_quantity=750.0,
            unit="g",
            category="Trockensortiment",
            mhd_date="2027-10-15",
            shelf_life_status="fresh",
            days_left=400,
            standard_pack_size=500.0,
            source="Vorratskammer",
        )
        current = load_pantry_items()
        test_list = current + [item]
        save_pantry_items(test_list)

        reloaded = load_pantry_items()
        found = next((i for i in reloaded if i.id == "pan-test-123"), None)
        self.assertIsNotNone(found)
        self.assertEqual(found.current_quantity, 750.0)
        self.assertEqual(found.mhd_date, "2027-10-15")

        # Clean up
        cleaned = [i for i in reloaded if i.id != "pan-test-123"]
        save_pantry_items(cleaned)

    def test_custom_shopping_items_persistence(self):
        item = CustomShoppingItem(
            id="custom-test-456",
            name="Zahnbürsten Bio",
            quantity=2.0,
            unit="Stück",
            store="Netto",
        )
        current = load_custom_shopping_items()
        test_list = current + [item]
        save_custom_shopping_items(test_list)

        reloaded = load_custom_shopping_items()
        found = next((i for i in reloaded if i.id == "custom-test-456"), None)
        self.assertIsNotNone(found)
        self.assertEqual(found.name, "Zahnbürsten Bio")

        # Clean up
        cleaned = [i for i in reloaded if i.id != "custom-test-456"]
        save_custom_shopping_items(cleaned)

if __name__ == "__main__":
    unittest.main()

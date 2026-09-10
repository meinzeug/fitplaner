"""
Tests for AppSettings, Custom Retailer Filtering on Shopping Lists & Weekly Plans,
and Pantry Item Editing (MHD, Quantities, Names).
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import AppSettings, PantryItem
from backend.settings_storage import get_app_settings, save_app_settings
from backend.pantry.inventory_manager import get_all_pantry_items


class TestSettingsAndRetailerFilter(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        # Ensure fresh default settings
        save_app_settings(AppSettings(
            active_retailers=["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka"],
            primary_retailer="Netto",
            default_weekly_budget=150.0,
        ))

    def tearDown(self):
        # Reset back to full default
        save_app_settings(AppSettings())

    def test_settings_get_and_post(self):
        res = self.client.get("/api/settings")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["primary_retailer"], "Netto")
        self.assertIn("Lidl", data["active_retailers"])

        # Update settings to only Netto and Rewe
        res = self.client.post("/api/settings", json={
            "active_retailers": ["Netto", "Rewe"],
            "primary_retailer": "Netto",
            "default_weekly_budget": 135.0,
            "prefer_healthy_offers": True,
            "microbiome_plant_target": 35,
            "sync_auto_discovery": False,
            "device_role": "host"
        })
        self.assertEqual(res.status_code, 200)
        updated = res.json()
        self.assertEqual(updated["active_retailers"], ["Netto", "Rewe"])
        self.assertEqual(updated["default_weekly_budget"], 135.0)
        self.assertEqual(updated["microbiome_plant_target"], 35)

    def test_shopping_list_retailer_filtering(self):
        # Set only Lidl and Netto as active
        self.client.post("/api/settings", json={
            "active_retailers": ["Netto", "Lidl"],
            "primary_retailer": "Netto",
            "default_weekly_budget": 150.0,
        })

        res = self.client.get("/api/shopping-list")
        self.assertEqual(res.status_code, 200)
        sl = res.json()

        stores = list(sl["items_by_retailer"].keys())
        for store in stores:
            self.assertIn(store, ["Netto", "Lidl", "Vorratskammer"], f"Inactive store '{store}' found in shopping list!")

        # Verify NP, Kaufland, Rewe, Edeka, Aldi are NOT present
        for forbidden in ["NP", "Kaufland", "Rewe", "Edeka", "Aldi"]:
            self.assertNotIn(forbidden, stores, f"Forbidden store '{forbidden}' should have been filtered out!")

    def test_pantry_item_editing(self):
        # Retrieve pantry items
        res = self.client.get("/api/pantry")
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 0)

        target = items[0]
        target_id = target["id"]

        # Edit target item via PUT
        new_mhd = "2028-06-15"
        res = self.client.put(f"/api/pantry/{target_id}", json={
            **target,
            "name": f"{target['name']} Premium",
            "current_quantity": 999.0,
            "mhd_date": new_mhd,
        })
        self.assertEqual(res.status_code, 200)
        edited = res.json()
        self.assertEqual(edited["name"], f"{target['name']} Premium")
        self.assertEqual(edited["current_quantity"], 999.0)
        self.assertEqual(edited["shelf_life_status"], "fresh")
        self.assertGreater(edited["days_left"], 500)


if __name__ == "__main__":
    unittest.main()

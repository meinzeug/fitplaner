"""
Unit tests for Pantry Management, MHD tracking, Barcode & Receipt Parsing.
"""

import unittest
from datetime import datetime, timedelta
from backend.pantry.inventory_manager import (
    get_pack_size, deduct_consumption, book_shopping_cart_to_pantry,
    get_all_pantry_items, add_or_update_pantry_item
)
from backend.pantry.expiry_tracker import calculate_shelf_life_status
from backend.models import PantryItem, ScaledIngredient
from backend.scanners.receipt_scanner import parse_supermarket_receipt
from backend.scanners.barcode_service import DEMO_BARCODES


class TestPantryAndScanners(unittest.TestCase):

    def test_pack_size_lookup(self):
        size, unit = get_pack_size("Bio Haferflocken zart")
        self.assertEqual(size, 500.0)
        self.assertEqual(unit, "g")

        size_meat, unit_meat = get_pack_size("Hähnchenbrustfilet")
        self.assertEqual(size_meat, 400.0)
        self.assertEqual(unit_meat, "g")

    def test_mhd_shelf_life_status(self):
        now = datetime.now()

        # Expired (yesterday)
        exp_date = (now - timedelta(days=1)).strftime("%d.%m.%Y")
        status, days, _ = calculate_shelf_life_status(exp_date, "Quark")
        self.assertEqual(status, "expired")
        self.assertLess(days, 0)

        # Expiring soon (in 2 days)
        soon_date = (now + timedelta(days=2)).strftime("%d.%m.%Y")
        status_soon, days_soon, _ = calculate_shelf_life_status(soon_date, "Brokkoli")
        self.assertEqual(status_soon, "expiring_soon")

        # Fresh (in 30 days)
        fresh_date = (now + timedelta(days=30)).strftime("%d.%m.%Y")
        status_fresh, _, _ = calculate_shelf_life_status(fresh_date, "Reis")
        self.assertEqual(status_fresh, "fresh")

    def test_live_consumption_deduction(self):
        # Add test item with 500g
        item = PantryItem(
            id="test-pan-brok",
            name="Deutscher Brokkoli",
            current_quantity=500.0,
            unit="g",
            category="Obst & Gemüse",
        )
        add_or_update_pantry_item(item)

        # Deduct 350g used in a meal
        consumed = [
            ScaledIngredient(name="Deutscher Brokkoli", amount=350.0, unit="g")
        ]
        log = deduct_consumption(consumed)
        self.assertEqual(len(log), 1)
        self.assertEqual(log[0]["remaining_stock"], 150.0)

    def test_receipt_parsing(self):
        raw_receipt = """
        NETTO MARKEN-DISCOUNT
        FILIALE 1234
        DATUM: 09.09.2026

        BIO HAFERFLOCKEN 0,79 B
        BROKKOLI 500G 1,19 B
        NORW. LACHSFILET 4,29 B
        SUMME EUR 6,27
        VIELEN DANK FUER IHREN EINKAUF
        """
        parsed = parse_supermarket_receipt(raw_receipt)
        self.assertEqual(parsed.store_name, "Netto Marken-Discount")
        self.assertEqual(len(parsed.items), 3)
        self.assertEqual(parsed.total_amount, 6.27)
        names = [i.name for i in parsed.items]
        self.assertIn("Bio Haferflocken", names)


if __name__ == "__main__":
    unittest.main()

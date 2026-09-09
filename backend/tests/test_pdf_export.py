"""
Unit tests for PDF Export of Shopping List.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.planner.pdf_export import generate_shopping_list_pdf
from backend.planner.generator import generate_weekly_plan
from backend.nutrition.calculator import enrich_family_member
from backend.planner.shopping_list import generate_shopping_list_from_plan


class TestPdfExport(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.member = enrich_family_member({
            "id": "mem-1", "name": "Dennis", "gender": "male", "age": 32,
            "height_cm": 184, "weight_kg": 85, "activity_level": "active",
            "goal": "gain_muscle", "dietary_preference": "all", "allergies": []
        })
        self.family = [self.member]

    def test_pdf_generation_content_and_magic_bytes(self):
        plan = generate_weekly_plan(self.family, week_offset=0)
        s_list = generate_shopping_list_from_plan(plan)
        
        # Verify that items have exact product names, brands, and valid EAN-13 barcodes
        all_items = s_list.items_netto + s_list.items_np + s_list.items_pantry + s_list.items_lidl + s_list.items_aldi
        self.assertGreater(len(all_items), 0, "Shopping list must have items")
        for item in all_items:
            self.assertIsNotNone(item.exact_product_name, f"Item {item.name} must have exact product name")
            self.assertIsNotNone(item.brand, f"Item {item.name} must have brand")
            self.assertIsNotNone(item.barcode, f"Item {item.name} must have barcode")
            self.assertEqual(len(item.barcode), 13, f"Barcode {item.barcode} must be 13 digits")
            self.assertTrue(item.barcode.isdigit(), f"Barcode {item.barcode} must be numeric")

        pdf_bytes = generate_shopping_list_pdf(s_list)

        # PDF must start with %PDF header
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"), "Generated file must have valid PDF magic bytes")
        self.assertGreater(len(pdf_bytes), 1000, "PDF size must be realistic")

    def test_pdf_export_endpoint(self):
        response = self.client.get("/api/shopping-list/export-pdf?week_offset=0")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        self.assertIn("attachment", response.headers["content-disposition"])
        self.assertIn(".pdf", response.headers["content-disposition"])
        self.assertTrue(response.content.startswith(b"%PDF-"))


if __name__ == "__main__":
    unittest.main()

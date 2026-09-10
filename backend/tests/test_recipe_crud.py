"""
Unit tests for Recipe CRUD endpoints (GET, POST, PUT, DELETE) and Shopping List day filtering.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app


class TestRecipeCrudAndDayFilters(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_recipe_query_search_and_filtering(self):
        # 1. Search for Skyr recipes
        res = self.client.get("/api/recipes?query=Skyr")
        self.assertEqual(res.status_code, 200)
        recipes = res.json()
        self.assertGreater(len(recipes), 0)
        for r in recipes[:5]:
            match = "skyr" in r["title"].lower() or any("skyr" in ing["name"].lower() for ing in r["ingredients"]) or any("skyr" in t.lower() for t in r.get("tags", []))
            self.assertTrue(match)

        # 2. Filter by meal_type
        res_dinner = self.client.get("/api/recipes?meal_type=dinner_home&limit=10")
        self.assertEqual(res_dinner.status_code, 200)
        dinners = res_dinner.json()
        self.assertGreater(len(dinners), 0)
        for d in dinners:
            self.assertEqual(d["meal_type"], "dinner_home")

        # 3. Filter by diet
        res_veg = self.client.get("/api/recipes?diet=vegetarian&limit=10")
        self.assertEqual(res_veg.status_code, 200)
        vegs = res_veg.json()
        self.assertGreater(len(vegs), 0)
        for v in vegs:
            self.assertTrue("vegetarian" in v["diet_types"] or "vegan" in v["diet_types"])

    def test_recipe_crud_lifecycle(self):
        # Create a new test recipe
        test_recipe_id = "test-custom-crud-recipe-123"
        payload = {
            "id": test_recipe_id,
            "title": "Protein Power Bowl mit Kichererbsen",
            "meal_type": "lunch_lunchbox",
            "prep_time_minutes": 12,
            "cook_time_minutes": 8,
            "difficulty": "Einfach",
            "lunchbox_ready": True,
            "base_calories": 480,
            "base_protein_g": 32,
            "base_carbs_g": 45,
            "base_fat_g": 14,
            "allergens": ["sesam"],
            "diet_types": ["vegetarian", "high_protein"],
            "ingredients": [
                {
                    "name": "Kichererbsen",
                    "base_amount": 150.0,
                    "unit": "g",
                    "category": "Hülsenfrüchte",
                    "matched_offer_retailer": "Netto"
                },
                {
                    "name": "Tahini",
                    "base_amount": 20.0,
                    "unit": "g",
                    "category": "Basics",
                    "matched_offer_retailer": "NP"
                }
            ],
            "instructions": [
                "Kichererbsen abspülen und abtropfen lassen.",
                "Mit Tahini, Zitronensaft und Gewürzen anrühren.",
                "In die Brotdose packen und kalt genießen."
            ],
            "detailed_instructions": {
                "prep_steps": [
                    "Kichererbsendose öffnen und Kichererbsen in ein Sieb geben.",
                    "Unter fließendem kaltem Wasser gründlich abspülen, bis kein Schaum mehr entsteht.",
                    "Gründlich abtropfen lassen."
                ],
                "cooking_steps": [
                    "Kichererbsen in einer Pfanne bei mittlerer Hitze 5 Minuten mit Gewürzen anrösten.",
                    "Tahini mit 2 EL lauwarmem Wasser und Zitronensaft zu einem samtigen Dressing verrühren."
                ],
                "lunchbox_tips": [
                    "Dressing in einem separaten Döschen transportieren.",
                    "Im Kühlschrank bis zu 3 Tage haltbar."
                ]
            },
            "tags": ["PowerBowl", "Lunchbox", "Fitness"],
            "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"
        }

        # 1. POST
        res_post = self.client.post("/api/recipes", json=payload)
        self.assertEqual(res_post.status_code, 200)
        data = res_post.json()
        self.assertEqual(data["id"], test_recipe_id)
        self.assertEqual(data["title"], "Protein Power Bowl mit Kichererbsen")

        # 2. GET single
        res_get = self.client.get(f"/api/recipes/{test_recipe_id}")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["title"], "Protein Power Bowl mit Kichererbsen")

        # 3. PUT update
        payload["title"] = "Protein Power Bowl Deluxe mit Sesam"
        payload["base_protein_g"] = 35
        res_put = self.client.put(f"/api/recipes/{test_recipe_id}", json=payload)
        self.assertEqual(res_put.status_code, 200)
        self.assertEqual(res_put.json()["title"], "Protein Power Bowl Deluxe mit Sesam")
        self.assertEqual(res_put.json()["base_protein_g"], 35)

        # 4. DELETE
        res_del = self.client.delete(f"/api/recipes/{test_recipe_id}")
        self.assertEqual(res_del.status_code, 200)

        # 5. Verify 404 after deletion
        res_after = self.client.get(f"/api/recipes/{test_recipe_id}")
        self.assertEqual(res_after.status_code, 404)

    def test_shopping_list_days_query_parameter(self):
        # 1. Fetch full shopping list
        res_full = self.client.get("/api/shopping-list?week_offset=0")
        self.assertEqual(res_full.status_code, 200)
        full_data = res_full.json()
        self.assertIn("total_price", full_data)

        # 2. Filter for Mo & Di only
        res_partial = self.client.get("/api/shopping-list?week_offset=0&days=Montag,Dienstag")
        self.assertEqual(res_partial.status_code, 200)
        partial_data = res_partial.json()
        self.assertEqual(partial_data["selected_days"], ["Montag", "Dienstag"])
        # Partial total price should be <= full total price
        self.assertLessEqual(partial_data["total_price"], full_data["total_price"])

        # 3. WhatsApp export with days
        res_wa = self.client.get("/api/shopping-list/export-whatsapp?week_offset=0&days=Montag,Dienstag")
        self.assertEqual(res_wa.status_code, 200)
        wa_text = res_wa.json()["text"]
        self.assertIn("Einkaufstage", wa_text)
        self.assertIn("Montag", wa_text)

        # 4. PDF export with days
        res_pdf = self.client.get("/api/shopping-list/export-pdf?week_offset=0&days=Montag,Dienstag")
        self.assertEqual(res_pdf.status_code, 200)
        self.assertEqual(res_pdf.headers.get("content-type"), "application/pdf")
        self.assertTrue(res_pdf.content.startswith(b"%PDF"))


if __name__ == "__main__":
    unittest.main()

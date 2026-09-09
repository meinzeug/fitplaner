"""
Unit tests for Health Filter and Manufacturer Ingredient Analyzer.
"""

import unittest
from backend.nutrition.health_filter import evaluate_product_health
from backend.nutrition.ingredient_analyzer import (
    extract_additives_from_text, detect_hidden_sugars, calculate_health_evaluation,
    analyze_ingredient_locally
)


class TestHealthFilterAndAnalyzer(unittest.TestCase):

    def test_unhealthy_product_rejection(self):
        # Sweets, sugary drinks, junk foods must be rejected
        unhealthy_samples = [
            "Coca Cola Original", "Limonade 1.5L", "Kartoffelchips Paprika",
            "Vollmilch Schokolade", "Tiefkühlpizza Salami", "Wiener Würstchen", "Bockwurst"
        ]
        for name in unhealthy_samples:
            is_healthy, score, _ = evaluate_product_health(name)
            self.assertFalse(is_healthy, f"Product {name} should have been rejected!")
            self.assertLessEqual(score, 5)

    def test_healthy_product_acceptance(self):
        healthy_samples = [
            "Deutscher Brokkoli", "Bio Heidelbeeren", "Lachsfilet frisch",
            "Bio Haferflocken", "Gutes Land Magerquark", "Skyr Natur",
            "Bio Kichererbsen", "Rote Linsen", "Avocado essreif"
        ]
        for name in healthy_samples:
            is_healthy, score, _ = evaluate_product_health(name)
            self.assertTrue(is_healthy, f"Product {name} should have been accepted!")
            self.assertGreaterEqual(score, 8)

    def test_additive_and_e_number_detection(self):
        sample_label = "Zutaten: Schweinefleisch, Speisesalz, Konservierungsstoff: Natriumnitrit (E 250), Geschmacksverstärker: Mononatriumglutamat (E621)."
        additives = extract_additives_from_text(sample_label)
        codes = [a.code for a in additives]
        self.assertIn("E250", codes)
        self.assertIn("E621", codes)

        red_additives = [a for a in additives if a.risk_level == "red"]
        self.assertEqual(len(red_additives), 2)

    def test_hidden_sugar_detection(self):
        sample_label = "Zutaten: Wasser, Apfelsaft, Glukose-Fruktose-Sirup, Dextrose, Maltodextrin, Zitronensäure."
        sugars = detect_hidden_sugars(sample_label)
        self.assertIn("Glukose-fruktose-sirup", sugars)
        self.assertIn("Dextrose", sugars)
        self.assertIn("Maltodextrin", sugars)

    def test_local_analysis_verdict(self):
        analysis_healthy = analyze_ingredient_locally("Frischer Brokkoli")
        self.assertEqual(analysis_healthy.verdict, "Sehr gesund")
        self.assertGreaterEqual(analysis_healthy.health_score, 9)

        analysis_junk = analyze_ingredient_locally("Kartoffelchips")
        self.assertEqual(analysis_junk.verdict, "Ungesund/Gemieden")
        self.assertLessEqual(analysis_junk.health_score, 4)


if __name__ == "__main__":
    unittest.main()

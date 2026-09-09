"""
Unit tests for Family Vitality & 30-Plants Microbiome Challenge.
"""

import unittest
from backend.models import FamilyMember
from backend.health.vitality_engine import (
    calculate_family_vitality,
    calculate_water_target,
    calculate_fiber_target,
    get_age_group,
    get_role_title,
    scan_weekly_plants_diversity
)


class TestFamilyVitality(unittest.TestCase):
    def setUp(self):
        self.members = [
            FamilyMember(
                id="m1", name="Papa Dennis", gender="male", age=32,
                height_cm=184, weight_kg=85, activity_level="moderate", goal="gain_muscle"
            ),
            FamilyMember(
                id="m2", name="Mama Sarah", gender="female", age=30,
                height_cm=168, weight_kg=64, activity_level="moderate", goal="lose_weight"
            ),
            FamilyMember(
                id="m3", name="Lea", gender="female", age=12,
                height_cm=150, weight_kg=42, activity_level="active", goal="maintain"
            ),
            FamilyMember(
                id="m4", name="Felix", gender="male", age=8,
                height_cm=130, weight_kg=28, activity_level="active", goal="maintain"
            )
        ]

    def test_age_group_classification(self):
        self.assertEqual(get_age_group(4), "mini")
        self.assertEqual(get_age_group(8), "kid")
        self.assertEqual(get_age_group(12), "teen")
        self.assertEqual(get_age_group(17), "junior")
        self.assertEqual(get_age_group(32), "adult")
        self.assertEqual(get_age_group(68), "senior")

    def test_role_titles(self):
        self.assertIn("Wichtel", get_role_title(4))
        self.assertIn("Nachwuchskoch", get_role_title(8))
        self.assertIn("Sous-Chef", get_role_title(12))
        self.assertIn("Küchen-Chef", get_role_title(16))
        self.assertIn("Chef de Cuisine", get_role_title(32))

    def test_water_and_fiber_targets(self):
        water_dennis = calculate_water_target(self.members[0])
        self.assertGreaterEqual(water_dennis, 2500)

        water_felix = calculate_water_target(self.members[3])
        self.assertEqual(water_felix, 1500)

        fiber_dennis = calculate_fiber_target(self.members[0])
        self.assertGreaterEqual(fiber_dennis, 30)

        fiber_felix = calculate_fiber_target(self.members[3])
        self.assertEqual(fiber_felix, 13)  # age (8) + 5

    def test_family_vitality_score_calculation(self):
        vitality = calculate_family_vitality(self.members, plan=None)
        self.assertGreaterEqual(vitality.overall_score, 60)
        self.assertLessEqual(vitality.overall_score, 100)
        self.assertEqual(vitality.plants_target, 30)
        self.assertGreater(vitality.plants_count, 10)
        self.assertEqual(len(vitality.members), 4)

        # Check Felix has kid nutrient advice
        felix_detail = next(m for m in vitality.members if m.member_id == "m4")
        self.assertIn("Kalzium", felix_detail.key_focus_nutrient)

        # Check Lea has teen nutrient advice
        lea_detail = next(m for m in vitality.members if m.member_id == "m3")
        self.assertIn("Omega-3", lea_detail.key_focus_nutrient)


if __name__ == "__main__":
    unittest.main()

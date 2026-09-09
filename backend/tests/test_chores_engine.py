"""
Unit tests for Age-Appropriate Chore Delegation & Gamification.
"""

import unittest
from backend.models import FamilyMember
from backend.family.chore_engine import (
    generate_daily_chores,
    toggle_chore,
    get_current_chores
)


class TestChoresEngine(unittest.TestCase):
    def setUp(self):
        self.members = [
            FamilyMember(
                id="m1", name="Dennis", gender="male", age=32,
                height_cm=184, weight_kg=85, activity_level="moderate", goal="gain_muscle",
                chore_points=0
            ),
            FamilyMember(
                id="m2", name="Felix", gender="male", age=8,
                height_cm=130, weight_kg=28, activity_level="active", goal="maintain",
                chore_points=0
            ),
            FamilyMember(
                id="m3", name="Lea", gender="female", age=12,
                height_cm=150, weight_kg=42, activity_level="active", goal="maintain",
                chore_points=0
            )
        ]

    def test_chore_generation_respects_age(self):
        chores = generate_daily_chores(self.members, day_index=0)
        self.assertGreaterEqual(len(chores), 3)

        # Felix (8 J., Kid) should get kid-safe chores (max difficulty medium, min_age <= 8)
        felix_chores = [c for c in chores if c.assigned_member_id == "m2"]
        self.assertTrue(len(felix_chores) > 0)
        for c in felix_chores:
            self.assertLessEqual(c.min_age, 8)
            self.assertEqual(c.age_group, "kid")

        # Lea (12 J., Teen) should get teen chores (age_group == 'teen')
        lea_chores = [c for c in chores if c.assigned_member_id == "m3"]
        self.assertTrue(len(lea_chores) > 0)
        for c in lea_chores:
            self.assertEqual(c.age_group, "teen")

        # Dennis (32 J., Adult)
        adult_chores = [c for c in chores if c.assigned_member_id == "m1"]
        self.assertTrue(len(adult_chores) > 0)
        for c in adult_chores:
            self.assertEqual(c.age_group, "adult")

    def test_chore_toggle_and_points(self):
        chores = generate_daily_chores(self.members, day_index=0)
        felix_chore = next(c for c in chores if c.assigned_member_id == "m2")
        initial_points = self.members[1].chore_points

        # Complete chore
        updated, delta = toggle_chore(felix_chore.id, True, self.members)
        self.assertIsNotNone(updated)
        self.assertTrue(updated.is_completed)
        self.assertEqual(delta, updated.points)
        self.assertEqual(self.members[1].chore_points, initial_points + delta)

        # Uncheck chore
        updated2, delta2 = toggle_chore(felix_chore.id, False, self.members)
        self.assertFalse(updated2.is_completed)
        self.assertEqual(delta2, -updated.points)
        self.assertEqual(self.members[1].chore_points, initial_points)


if __name__ == "__main__":
    unittest.main()

import unittest
from backend.main import get_daily_hub, update_daily_action, get_substitutes
from backend.models import UpdateDailyStatusRequest


class TestDailyHubAndSubstitutes(unittest.TestCase):
    def setUp(self):
        # Reset state
        update_daily_action(UpdateDailyStatusRequest(action="reset_day"))
        update_daily_action(UpdateDailyStatusRequest(action="set_work_time", value="17:00"))

    def test_daily_hub_structure(self):
        hub = get_daily_hub()
        self.assertIn(hub.current_day_name, ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"])
        self.assertEqual(hub.work_end_time, "17:00")
        self.assertTrue(hub.is_store_open if hub.current_day_name != "Sonntag" else not hub.is_store_open)
        from backend.main import family_profiles
        self.assertTrue(len(hub.dinner_plate_portions) > 0)
        self.assertIn(family_profiles[0].name, hub.dinner_plate_portions)

        # Enriched linked recipes & instructions
        self.assertIsNotNone(hub.breakfast_recipe)
        self.assertIsNotNone(hub.lunch_recipe)
        self.assertIsNotNone(hub.lunchbox_breakfast)
        self.assertIn("quick_instructions", hub.lunchbox_breakfast)
        self.assertIsNotNone(hub.lunchbox_lunch)
        self.assertIn("quick_instructions", hub.lunchbox_lunch)

        # Station 4 Prep Tomorrow
        self.assertIsNotNone(hub.prep_tomorrow_summary)
        self.assertIn("breakfast_prep", hub.prep_tomorrow_summary)
        self.assertIn("lunchbox_prep", hub.prep_tomorrow_summary)
        self.assertEqual(hub.prep_tomorrow_summary["est_minutes"], 12)

    def test_work_end_time_and_store_status(self):
        updated = update_daily_action(UpdateDailyStatusRequest(action="set_work_time", value="16:15"))
        self.assertEqual(updated.work_end_time, "16:15")
        if updated.current_day_name != "Sonntag":
            self.assertIn("16:15", updated.store_status_text)

    def test_toggle_actions(self):
        res1 = update_daily_action(UpdateDailyStatusRequest(action="toggle_fresh_pick"))
        self.assertTrue(res1.is_fresh_pick_bought)

        res2 = update_daily_action(UpdateDailyStatusRequest(action="toggle_lunchbox"))
        self.assertTrue(res2.is_lunchbox_packed)

        res3 = update_daily_action(UpdateDailyStatusRequest(action="cook_dinner"))
        self.assertTrue(res3.is_dinner_cooked)

    def test_substitutes(self):
        subs_salmon = get_substitutes("Lachsfilet")
        self.assertIn("Forellenfilet", subs_salmon)

        subs_broccoli = get_substitutes("Brokkoli")
        self.assertIn("Zucchini frisch", subs_broccoli)

        subs_unknown = get_substitutes("Exotische Frucht")
        self.assertTrue(len(subs_unknown) > 0)


if __name__ == "__main__":
    unittest.main()

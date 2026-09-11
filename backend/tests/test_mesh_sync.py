"""
Unit tests for Semi-Autonomous Peer-to-Peer Mesh Sync (LAN & Bluetooth LE).
"""

import unittest
from backend.models import FamilyMember, MeshSyncPacket, FamilyChore
from backend.sync.mesh_sync import (
    get_mesh_status,
    create_local_sync_packet,
    merge_peer_sync_packet,
    FITPLANER_BLE_SERVICE_UUID
)


class TestMeshSync(unittest.TestCase):
    def setUp(self):
        self.members = [
            FamilyMember(
                id="m1", name="Dennis", gender="male", age=32,
                height_cm=184, weight_kg=85, activity_level="moderate", goal="gain_muscle",
                chore_points=10, water_intake_ml=1000
            )
        ]
        self.chores = [
            FamilyChore(
                id="chore-1", title="Tisch decken", description="Test",
                assigned_member_id="m1", assigned_member_name="Dennis",
                points=10, is_completed=False
            )
        ]
        self.daily_hub_state = {
            "lunchbox_packed": False,
            "fresh_pick_bought": False,
            "dinner_cooked": False
        }

    def test_mesh_status(self):
        status = get_mesh_status()
        self.assertIsNotNone(status.local_ip)
        self.assertTrue(status.is_bluetooth_ready)
        self.assertEqual(status.bluetooth_service_uuid, FITPLANER_BLE_SERVICE_UUID)
        self.assertIn(status.mode, ["lan_mesh", "offline_autonomous"])

    def test_create_and_merge_sync_packet(self):
        # Peer packet with completed chore and updated water/points
        peer_packet = MeshSyncPacket(
            device_id="phone-sarah",
            device_name="Sarahs Smartphone",
            timestamp="2026-09-09T20:00:00",
            sequence_id=42,
            checked_shopping_items=["item-spinat-1", "item-hafer-2"],
            completed_chores=["chore-1"],
            member_points={"m1": 25},
            member_water={"m1": 1500},
            lunchbox_packed=True,
            fresh_pick_bought=True,
            dinner_cooked=False
        )

        res = merge_peer_sync_packet(
            packet=peer_packet,
            chores=self.chores,
            members=self.members,
            daily_hub_state=self.daily_hub_state
        )

        self.assertEqual(res["status"], "success")
        self.assertTrue(self.chores[0].is_completed)
        self.assertEqual(self.members[0].chore_points, 25)
        self.assertEqual(self.members[0].water_intake_ml, 1500)
        self.assertTrue(self.daily_hub_state["lunchbox_packed"])
        self.assertTrue(self.daily_hub_state["fresh_pick_bought"])

    def test_bidirectional_sync_packet(self):
        from backend.models import BidirectionalSyncPacket, CustomShoppingItem
        from backend.sync.mesh_sync import merge_bidirectional_sync_packet

        packet = BidirectionalSyncPacket(
            device_id="phone-dennis",
            device_name="Dennis Smartphone (Autark)",
            household_passkey="FP-FITP-2026",
            timestamp="2026-09-11T12:00:00",
            checked_shopping_items=["Netto-Bananen", "NP-Skyr"],
            custom_shopping_items=[
                CustomShoppingItem(
                    id="custom-1",
                    name="Kaugummi",
                    quantity=2,
                    unit="Packung",
                    category="Snacks",
                    retailer="Netto"
                )
            ],
            daily_hub_state={"lunchbox_packed": True, "dinner_cooked": True}
        )

        resp = merge_bidirectional_sync_packet(
            packet=packet,
            server_device_name="FitPlaner PC-Server (Zuhause)",
            current_chores=self.chores,
            current_members=self.members,
            current_daily_hub=self.daily_hub_state
        )

        self.assertEqual(resp.status, "success")
        self.assertEqual(resp.server_device_name, "FitPlaner PC-Server (Zuhause)")
        self.assertIn("Netto-Bananen", resp.merged_data.checked_shopping_items)
        self.assertIn("NP-Skyr", resp.merged_data.checked_shopping_items)
        self.assertTrue(any(i.name == "Kaugummi" for i in resp.merged_data.custom_shopping_items))
        self.assertTrue(resp.merged_data.daily_hub_state.get("dinner_cooked"))

    def test_all_data_bidirectional_sync(self):
        from backend.models import BidirectionalSyncPacket, FamilyMember, AppSettings, ScheduleTimeSettings
        from backend.sync.mesh_sync import merge_bidirectional_sync_packet

        # Updated profile from mobile phone with modified allergies, target calories, weight, points
        phone_member = FamilyMember(
            id="m1", name="Dennis Smartphone", gender="male", age=33,
            height_cm=185, weight_kg=83.5, activity_level="active", goal="lose_weight",
            dietary_preference="high_protein", allergies=["laktose", "gluten"],
            disliked_foods=["rosenkohl"], target_calories=2200,
            chore_points=35, water_intake_ml=2200, role_title="Chefkoch"
        )
        new_child = FamilyMember(
            id="m2", name="Marie", gender="female", age=7,
            height_cm=125, weight_kg=24, activity_level="active", goal="maintain",
            role_title="Küchen-Fee", chore_points=15
        )

        packet = BidirectionalSyncPacket(
            device_id="phone-dennis",
            device_name="Dennis Smartphone",
            household_passkey="FP-FITP-2026",
            timestamp="2026-09-11T12:30:00",
            settings=AppSettings(primary_retailer="NP", default_weekly_budget=175.0),
            schedule_settings=ScheduleTimeSettings(wake_up_time="06:30", dinner_time="19:00"),
            profiles=[phone_member, new_child],
            recurring_rules=[
                {"id": "rec_milk_1", "name": "Bio-Vollmilch", "frequency": "weekly", "count_per_cycle": 3}
            ],
            health_dossiers={
                "m1": {"allergies": ["laktose", "gluten"], "blood_type": "A+"}
            }
        )

        resp = merge_bidirectional_sync_packet(
            packet=packet,
            server_device_name="FitPlaner PC-Server (Zuhause)",
            current_members=self.members
        )

        self.assertEqual(resp.status, "success")
        self.assertEqual(resp.summary["settings_merged"], 1)
        self.assertEqual(resp.summary["schedule_settings_merged"], 1)
        self.assertEqual(resp.summary["profiles_merged"], 2)
        self.assertEqual(resp.summary["recurring_merged"], 1)
        self.assertEqual(resp.summary["health_dossiers_merged"], 1)

        # Verify merged profile data
        merged_members = {m.id: m for m in resp.merged_data.profiles}
        self.assertIn("m1", merged_members)
        self.assertIn("m2", merged_members)
        m1 = merged_members["m1"]
        self.assertEqual(m1.name, "Dennis Smartphone")
        self.assertEqual(m1.weight_kg, 83.5)
        self.assertEqual(m1.target_calories, 2200)
        self.assertEqual(m1.chore_points, 35)
        self.assertEqual(m1.water_intake_ml, 2200)
        self.assertIn("gluten", m1.allergies)
        self.assertIn("laktose", m1.allergies)

        # Verify settings
        self.assertEqual(resp.merged_data.settings.primary_retailer, "NP")
        self.assertEqual(resp.merged_data.settings.default_weekly_budget, 175.0)
        self.assertEqual(resp.merged_data.schedule_settings.wake_up_time, "06:30")

    def test_unauthorized_sync_rejection(self):
        from fastapi import HTTPException
        from backend.models import BidirectionalSyncPacket
        from backend.sync.mesh_sync import merge_bidirectional_sync_packet

        # Packet without passkey or with invalid passkey (e.g. unknown guest in WiFi)
        bad_packet = BidirectionalSyncPacket(
            device_id="guest-phone-xyz",
            device_name="Gast im WLAN",
            household_passkey="WRONG-PASSKEY-1234",
            timestamp="2026-09-11T12:00:00"
        )

        with self.assertRaises(HTTPException) as ctx:
            merge_bidirectional_sync_packet(
                packet=bad_packet,
                server_device_name="FitPlaner PC-Server (Zuhause)"
            )
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("Zugriff verweigert", ctx.exception.detail)


if __name__ == "__main__":
    unittest.main()



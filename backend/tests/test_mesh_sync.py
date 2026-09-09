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


if __name__ == "__main__":
    unittest.main()

import os
import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import (
    CreateHouseholdRequest,
    JoinHouseholdRequest,
    LoginRequest,
    ChangePasswordRequest,
    ResetMemberPasswordRequest
)
from backend.auth.security import (
    hash_password,
    verify_password,
    hash_pin,
    verify_pin,
    generate_household_passkey,
    generate_pairing_qr_data_url,
    create_session,
    is_session_valid
)


class TestAuthRBAC(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_security_primitives(self):
        # 1. Password hashing
        p_hash, p_salt = hash_password("SuperSecret2026!")
        self.assertTrue(verify_password("SuperSecret2026!", p_hash, p_salt))
        self.assertFalse(verify_password("WrongPassword", p_hash, p_salt))

        # 2. PIN hashing (for kids)
        pin_hash, pin_salt = hash_pin("4321")
        self.assertTrue(verify_pin("4321", pin_hash, pin_salt))
        self.assertFalse(verify_pin("1234", pin_hash, pin_salt))

        # 3. Passkey generation
        passkey = generate_household_passkey()
        self.assertTrue(passkey.startswith("FP-"))
        self.assertEqual(len(passkey), 12)

        # 4. QR-Code Data URL
        qr = generate_pairing_qr_data_url("hh-1", "Familie Schmidt", passkey, "http://192.168.178.57:8090")
        self.assertTrue(qr.startswith("data:image/png;base64,"))

        # 5. Session token & validity
        sess = create_session("mem-1", "hh-1", "admin")
        self.assertTrue(is_session_valid(sess))
        self.assertEqual(sess["role"], "admin")

    def test_household_status(self):
        resp = self.client.get("/api/auth/household/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("is_initialized", data)
        self.assertIn("member_count", data)

    def test_login_and_me_flow(self):
        # 1. Login with Dennis (Admin default)
        login_resp = self.client.post("/api/auth/login", json={
            "username": "dennis",
            "password": "admin123",
            "device_id": "test-device-1",
            "device_name": "Test Laptop"
        })
        self.assertEqual(login_resp.status_code, 200)
        data = login_resp.json()
        self.assertTrue(data["success"])
        token = data["token"]
        self.assertEqual(data["member"]["role"], "admin")

        # 2. Access /api/auth/me with Bearer token
        me_resp = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_resp.status_code, 200)
        me_data = me_resp.json()
        self.assertEqual(me_data["member"]["name"], "Dennis")
        self.assertEqual(me_data["role"], "admin")
        self.assertTrue(me_data["is_admin"])

        # 3. Access /api/auth/me without token -> 401
        unauth_resp = self.client.get("/api/auth/me")
        self.assertEqual(unauth_resp.status_code, 401)

        # 4. Access admin pairing info
        pairing_resp = self.client.get("/api/auth/household/pairing-info", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(pairing_resp.status_code, 200)
        pairing_data = pairing_resp.json()
        self.assertIn("household_passkey", pairing_data)
        self.assertIn("pairing_qr", pairing_data)

        # 5. Logout
        logout_resp = self.client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(logout_resp.status_code, 200)

        # 6. Try accessing /api/auth/me after logout -> 401
        after_logout_resp = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(after_logout_resp.status_code, 401)

    def test_child_pin_login(self):
        # Felix (Kid) logs in with PIN
        login_resp = self.client.post("/api/auth/login", json={
            "username": "felix",
            "pin": "1234",
            "device_id": "tablet-felix",
            "device_name": "Felix Tablet"
        })
        self.assertEqual(login_resp.status_code, 200)
        data = login_resp.json()
        self.assertTrue(data["success"])
        token = data["token"]
        self.assertEqual(data["member"]["role"], "kid")

        # Kid tries to access admin pairing info -> 403 Forbidden
        pairing_resp = self.client.get("/api/auth/household/pairing-info", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(pairing_resp.status_code, 403)

    def test_household_join_validation(self):
        # Attempt to join with wrong passkey -> 401
        bad_join = self.client.post("/api/auth/household/join", json={
            "household_passkey": "FP-0000-0000",
            "username": "gast",
            "device_id": "stranger-phone",
            "device_name": "Unbekannt"
        })
        self.assertEqual(bad_join.status_code, 401)

        # Join with valid default passkey -> 200
        good_join = self.client.post("/api/auth/household/join", json={
            "household_passkey": "FP-FITP-2026",
            "username": "dennis",
            "device_id": "new-phone",
            "device_name": "Dennis Neues Handy"
        })
        self.assertEqual(good_join.status_code, 200)
        self.assertTrue(good_join.json()["success"])
        self.assertTrue(len(good_join.json()["members"]) > 0)

    def test_members_list_public(self):
        resp = self.client.get("/api/auth/household/members-list")
        self.assertEqual(resp.status_code, 200)
        members = resp.json()
        self.assertTrue(len(members) >= 4)
        dennis = next(m for m in members if m["name"] == "Dennis")
        self.assertEqual(dennis["role"], "admin")
        self.assertTrue(dennis["is_admin"])


if __name__ == "__main__":
    unittest.main()

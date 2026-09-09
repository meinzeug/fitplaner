import unittest
import os
from backend.installer import get_lan_ip, get_installer_info, register_device, remove_device, PairDeviceRequest
from fastapi.testclient import TestClient
from backend.main import app


class TestInstallerAndApk(unittest.TestCase):
    def test_lan_ip(self):
        ip = get_lan_ip()
        self.assertIsInstance(ip, str)
        self.assertTrue(len(ip) > 0)

    def test_installer_info(self):
        info = get_installer_info(8090)
        self.assertTrue(info.apk_available)
        self.assertIn("FitPlaner.apk", info.apk_download_url)
        self.assertTrue(info.qr_code_svg.startswith("<?xml") or "<svg" in info.qr_code_svg)

    def test_device_registration(self):
        req = PairDeviceRequest(
            device_id="test-phone-123",
            device_name="Test Phone",
            device_model="Pixel 8 Pro",
            assigned_member_id="mem-1"
        )
        dev = register_device(req, "192.168.1.50")
        self.assertEqual(dev.id, "test-phone-123")
        self.assertEqual(dev.name, "Test Phone")

        removed = remove_device("test-phone-123")
        self.assertTrue(removed)

    def test_api_endpoints(self):
        client = TestClient(app)
        res_info = client.get("/api/installer/info")
        self.assertEqual(res_info.status_code, 200)
        self.assertIn("apk_download_url", res_info.json())

        res_apk = client.get("/FitPlaner.apk")
        self.assertEqual(res_apk.status_code, 200)
        self.assertEqual(res_apk.headers["content-type"], "application/vnd.android.package-archive")


if __name__ == "__main__":
    unittest.main()

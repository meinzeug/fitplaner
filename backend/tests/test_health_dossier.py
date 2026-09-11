import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.persistence import get_health_dossier, save_health_dossier, delete_health_dossier


class TestHealthDossierApi(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.test_member_id = "mem-test-999"
        self.sample_dossier = {
            "member_id": self.test_member_id,
            "member_name": "Test Person",
            "blood_type": "0+",
            "rhesus_factor": "positive",
            "organ_donor_status": "yes",
            "organ_donor_notes": "Bereit zur Spende",
            "emergency_contacts": [
                {
                    "id": "ec-test-1",
                    "name": "Ehepartner",
                    "relationship": "Partner",
                    "phone": "+49 170 9999999",
                    "is_primary": True,
                }
            ],
            "primary_physician": {
                "name": "Dr. Med. Test",
                "phone": "+49 511 12345",
                "clinic_name": "Praxis Test",
                "address": "Teststraße 1, 30159 Hannover"
            },
            "insurance_info": {
                "provider_name": "Techniker Krankenkasse",
                "insurance_number": "T123456789",
                "has_travel_insurance": True,
                "travel_insurance_policy": "ADAC Plus",
                "emergency_hotline": "+49 89 222222"
            },
            "allergies": [
                {
                    "id": "all-test-1",
                    "substance": "Erdnuss",
                    "category": "food",
                    "criticality": "severe",
                    "reaction": "Anaphylaxie",
                    "verification_status": "confirmed",
                    "emergency_treatment": "EpiPen"
                }
            ],
            "conditions": [
                {
                    "id": "cond-test-1",
                    "name": "Zöliakie",
                    "icd10": "K90.0",
                    "status": "active",
                    "severity": "severe",
                    "dietary_implication": "Streng glutenfrei"
                }
            ],
            "medications": [
                {
                    "id": "med-test-1",
                    "trade_name": "L-Thyroxin 50",
                    "active_substance": "Levothyroxin-Natrium",
                    "dosage": "50 µg",
                    "schedule_morning": 1,
                    "schedule_noon": 0,
                    "schedule_evening": 0,
                    "schedule_night": 0,
                    "is_essential": True
                }
            ],
            "vaccinations": [
                {
                    "id": "vac-test-1",
                    "disease": "Tetanus",
                    "vaccine_name": "Tetanol Pur",
                    "date_administered": "2024-01-01",
                    "next_booster_due": "2034-01-01",
                    "is_up_to_date": True
                }
            ],
            "findings": [
                {
                    "id": "find-test-1",
                    "title": "Blutbild",
                    "doc_type": "lab_report",
                    "date": "2026-01-01",
                    "summary": "Alles im Normbereich",
                    "key_values": {"HbA1c": "5.1 %"}
                }
            ],
            "is_encrypted": False
        }

    def tearDown(self):
        delete_health_dossier(self.test_member_id)

    def test_save_and_get_health_dossier(self):
        # 1. Post dossier
        res = self.client.post(f"/api/health-dossier/{self.test_member_id}", json=self.sample_dossier)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "saved")
        self.assertEqual(data["member_id"], self.test_member_id)

        # 2. Get dossier
        res_get = self.client.get(f"/api/health-dossier/{self.test_member_id}")
        self.assertEqual(res_get.status_code, 200)
        get_data = res_get.json()
        self.assertEqual(get_data["status"], "ok")
        self.assertEqual(get_data["dossier"]["blood_type"], "0+")
        self.assertEqual(len(get_data["dossier"]["allergies"]), 1)
        self.assertEqual(get_data["dossier"]["allergies"][0]["substance"], "Erdnuss")

        # 3. Delete dossier
        res_del = self.client.delete(f"/api/health-dossier/{self.test_member_id}")
        self.assertEqual(res_del.status_code, 200)
        self.assertEqual(res_del.json()["status"], "deleted")

        # 4. Check not found after delete
        res_after = self.client.get(f"/api/health-dossier/{self.test_member_id}")
        self.assertEqual(res_after.json()["status"], "not_found")


if __name__ == "__main__":
    unittest.main()

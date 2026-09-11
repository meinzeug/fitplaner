"""
Household Security & Cryptographic Authentication Engine.
Implements PBKDF2-SHA256 password/PIN hashing, household pairing tokens,
and zero-cloud role-based access control (RBAC).
"""

import os
import time
import hmac
import base64
import secrets
import hashlib
from io import BytesIO
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any, List

import qrcode

# Default session duration: 30 days
SESSION_DURATION_DAYS = 30


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hashes a password with PBKDF2-HMAC-SHA256 using 100,000 rounds."""
    if salt is None:
        salt = secrets.token_hex(16)
    salt_bytes = salt.encode('utf-8')
    derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt_bytes, 100_000)
    return derived.hex(), salt


def verify_password(password: str, hash_hex: str, salt_hex: str) -> bool:
    """Verifies a password against the stored hash and salt."""
    if not password or not hash_hex or not salt_hex:
        return False
    calc_hash, _ = hash_password(password, salt_hex)
    return hmac.compare_digest(calc_hash, hash_hex)


def hash_pin(pin: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hashes a 4-6 digit kid PIN."""
    return hash_password(pin, salt)


def verify_pin(pin: str, hash_hex: str, salt_hex: str) -> bool:
    """Verifies a kid's numeric PIN."""
    return verify_password(pin, hash_hex, salt_hex)


def generate_household_passkey() -> str:
    """
    Generates a memorable and secure 8-character household passkey.
    Example: FP-K8N2-9P4W
    """
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # No 0/O, 1/I confusion
    p1 = "".join(secrets.choice(alphabet) for _ in range(4))
    p2 = "".join(secrets.choice(alphabet) for _ in range(4))
    return f"FP-{p1}-{p2}"


def generate_pairing_qr_data_url(household_id: str, household_name: str, passkey: str, server_url: str) -> str:
    """Generates a base64 Data URL PNG of a QR code containing pairing credentials."""
    payload = {
        "fitplaner_pairing": True,
        "v": 1,
        "family_id": household_id,
        "family_name": household_name,
        "passkey": passkey,
        "server_url": server_url
    }
    import json
    qr_text = json.dumps(payload)
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(qr_text)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#064e3b", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    b64_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"


def create_session(
    member_id: str,
    family_id: str,
    role: str,
    device_id: Optional[str] = None,
    device_name: Optional[str] = None
) -> Dict[str, Any]:
    """Creates a new authenticated session record."""
    token = secrets.token_urlsafe(32)
    now = datetime.now()
    expires_at = now + timedelta(days=SESSION_DURATION_DAYS)
    
    session = {
        "token": token,
        "member_id": member_id,
        "family_id": family_id,
        "role": role,
        "device_id": device_id or "unknown",
        "device_name": device_name or "Gerät",
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat()
    }
    return session


def is_session_valid(session: Dict[str, Any]) -> bool:
    """Checks if an auth session has not expired."""
    try:
        exp_str = session.get("expires_at")
        if not exp_str:
            return False
        exp = datetime.fromisoformat(exp_str)
        return datetime.now() < exp
    except Exception:
        return False

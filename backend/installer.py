"""
Installer, LAN Auto-Discovery, Smartphone Pairing & APK Distribution Service.
Allows zero-config Wi-Fi installation and household multi-device sync.
"""

import os
import socket
import io
import base64
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import qrcode
from qrcode.image.svg import SvgPathImage


def get_lan_ip() -> str:
    """Detects the host machine's primary local IP address in the home network."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


class PairedDevice(BaseModel):
    id: str
    name: str
    model: str
    ip_address: str
    connected_at: str
    last_sync: str
    is_online: bool = True
    assigned_member_id: Optional[str] = None


class InstallerInfoResponse(BaseModel):
    lan_ip: str
    port: int
    apk_available: bool
    apk_download_url: str
    apk_file_size_mb: Optional[float] = None
    pairing_url: str
    qr_code_svg: str
    qr_code_pairing_svg: str
    paired_devices: List[PairedDevice]


class PairDeviceRequest(BaseModel):
    device_id: str
    device_name: str
    device_model: str
    assigned_member_id: Optional[str] = None


# Household connected device registry
_paired_devices: List[PairedDevice] = [
    PairedDevice(
        id="dev-demo-1",
        name="Dennis' Smartphone",
        model="Android Phone",
        ip_address="192.168.178.42",
        connected_at="Heute, 18:30 Uhr",
        last_sync="Vor wenigen Minuten",
        is_online=True,
        assigned_member_id="mem-1"
    )
]


def generate_qr_svg(content: str) -> str:
    """Generates an inline SVG string for a given URL or text."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
        image_factory=SvgPathImage
    )
    qr.add_data(content)
    qr.make(fit=True)
    img = qr.make_image()
    stream = io.BytesIO()
    img.save(stream)
    svg_str = stream.getvalue().decode("utf-8")
    return svg_str


def get_apk_path() -> str:
    """Returns the path to the compiled APK."""
    # Check root FitPlaner.apk or gradle debug output
    root_apk = os.path.join(os.path.dirname(__file__), "..", "FitPlaner.apk")
    if os.path.isfile(root_apk):
        return root_apk
    gradle_apk = os.path.join(
        os.path.dirname(__file__), "..", "frontend", "android", "app",
        "build", "outputs", "apk", "debug", "app-debug.apk"
    )
    if os.path.isfile(gradle_apk):
        return gradle_apk
    return root_apk


def get_installer_info(port: int = 8090) -> InstallerInfoResponse:
    ip = get_lan_ip()
    apk_path = get_apk_path()
    apk_exists = os.path.isfile(apk_path)
    size_mb = round(os.path.getsize(apk_path) / (1024 * 1024), 2) if apk_exists else None

    apk_download_url = f"http://{ip}:{port}/FitPlaner.apk"
    pairing_url = f"fitplaner://pair?server=http://{ip}:{port}"

    qr_download = generate_qr_svg(apk_download_url)
    qr_pairing = generate_qr_svg(pairing_url)

    return InstallerInfoResponse(
        lan_ip=ip,
        port=port,
        apk_available=apk_exists,
        apk_download_url=apk_download_url,
        apk_file_size_mb=size_mb,
        pairing_url=pairing_url,
        qr_code_svg=qr_download,
        qr_code_pairing_svg=qr_pairing,
        paired_devices=_paired_devices
    )


def register_device(req: PairDeviceRequest, client_ip: str) -> PairedDevice:
    now_str = datetime.now().strftime("%d.%m.%Y, %H:%M Uhr")
    for d in _paired_devices:
        if d.id == req.device_id:
            d.name = req.device_name
            d.model = req.device_model
            d.ip_address = client_ip
            d.last_sync = now_str
            d.is_online = True
            if req.assigned_member_id:
                d.assigned_member_id = req.assigned_member_id
            return d

    new_device = PairedDevice(
        id=req.device_id,
        name=req.device_name,
        model=req.device_model,
        ip_address=client_ip,
        connected_at=now_str,
        last_sync=now_str,
        is_online=True,
        assigned_member_id=req.assigned_member_id
    )
    _paired_devices.append(new_device)
    return new_device


def remove_device(device_id: str) -> bool:
    global _paired_devices
    initial_len = len(_paired_devices)
    _paired_devices = [d for d in _paired_devices if d.id != device_id]
    return len(_paired_devices) < initial_len

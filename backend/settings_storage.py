"""
Persistent storage for AppSettings (Supermarket selection, budget, device role).
Saves to local backend/app_settings.json.
"""

import os
import json
from backend.models import AppSettings

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "app_settings.json")

_cached_settings: AppSettings = None


def get_app_settings() -> AppSettings:
    global _cached_settings
    if _cached_settings is not None:
        return _cached_settings

    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                _cached_settings = AppSettings(**data)
                return _cached_settings
        except Exception:
            pass

    _cached_settings = AppSettings()
    save_app_settings(_cached_settings)
    return _cached_settings


def save_app_settings(settings: AppSettings) -> AppSettings:
    global _cached_settings
    _cached_settings = settings
    try:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            f.write(settings.model_dump_json(indent=2))
    except Exception as e:
        print(f"Error saving settings: {e}")
    return _cached_settings

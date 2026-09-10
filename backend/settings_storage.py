"""
Persistent storage for AppSettings (Supermarket selection, budget, device role).
Saves to local backend/app_settings.json.
"""

import os
import json
from backend.models import AppSettings

def get_settings_file() -> str:
    path = os.environ.get("FITPLANER_SETTINGS_FILE")
    if path:
        return path
    data_dir = os.environ.get("FITPLANER_DATA_DIR")
    if data_dir:
        return os.path.join(data_dir, "app_settings.json")
    from backend.persistence import get_data_dir
    d_dir = get_data_dir()
    if os.environ.get("TESTING") == "1":
        return os.path.join(d_dir, "app_settings.json")
    return os.path.join(os.path.dirname(__file__), "app_settings.json")


SETTINGS_FILE = get_settings_file()

_cached_settings: AppSettings = None


def get_app_settings(reload: bool = False) -> AppSettings:
    global _cached_settings
    if _cached_settings is not None and not reload:
        return _cached_settings

    filepath = get_settings_file()
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                _cached_settings = AppSettings(**data)
                return _cached_settings
        except Exception as e:
            print(f"Warning: Failed to load settings from {filepath}: {e}")
            bak_path = f"{filepath}.corrupt.bak"
            try:
                import shutil
                shutil.copy2(filepath, bak_path)
                print(f"Backed up corrupted settings to {bak_path}")
            except Exception:
                pass

    _cached_settings = AppSettings()
    save_app_settings(_cached_settings)
    return _cached_settings


def save_app_settings(settings: AppSettings) -> AppSettings:
    global _cached_settings
    _cached_settings = settings
    filepath = get_settings_file()
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    temp_path = f"{filepath}.tmp"
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            f.write(settings.model_dump_json(indent=2))
            f.flush()
            os.fsync(f.fileno())
        os.replace(temp_path, filepath)
    except Exception as e:
        print(f"Error saving settings to {filepath}: {e}")
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
    return _cached_settings


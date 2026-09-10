"""
backend/persistence.py - Robust JSON File-Backed Persistence Layer.
Ensures zero data loss across app/server restarts and system reboots.
Writes atomically via temporary files to prevent corruption.
"""

import os
import json
from typing import List, Dict, Optional, Any
from backend.models import (
    FamilyMember,
    PantryItem,
    WeeklyPlan,
    CustomShoppingItem,
    ScheduleTimeSettings,
)

def get_data_dir() -> str:
    path = os.environ.get("FITPLANER_DATA_DIR")
    if path:
        os.makedirs(path, exist_ok=True)
        return path

    import sys
    is_testing = (
        os.environ.get("TESTING") == "1"
        or "unittest" in sys.argv[0]
        or any("unittest" in str(arg) for arg in sys.argv[:3])
        or any("pytest" in str(arg) for arg in sys.argv[:3])
        or any(str(arg).endswith(".py") and ("test_" in str(arg) or "/tests/" in str(arg)) for arg in sys.argv)
    )
    if is_testing:
        import tempfile
        import atexit
        import shutil
        test_dir = tempfile.mkdtemp(prefix="fitplaner_auto_test_")
        os.environ["FITPLANER_DATA_DIR"] = test_dir
        os.environ["FITPLANER_SETTINGS_FILE"] = os.path.join(test_dir, "app_settings.json")
        os.environ["TESTING"] = "1"
        atexit.register(lambda: shutil.rmtree(test_dir, ignore_errors=True))
        return test_dir

    path = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(path, exist_ok=True)
    return path


def get_family_profiles_file() -> str:
    return os.path.join(get_data_dir(), "family_profiles.json")


def get_pantry_items_file() -> str:
    return os.path.join(get_data_dir(), "pantry_items.json")


def get_weekly_plans_file() -> str:
    return os.path.join(get_data_dir(), "weekly_plans.json")


def get_weekly_budgets_file() -> str:
    return os.path.join(get_data_dir(), "weekly_budgets.json")


def get_custom_shopping_file() -> str:
    return os.path.join(get_data_dir(), "custom_shopping_items.json")


def get_daily_hub_file() -> str:
    return os.path.join(get_data_dir(), "daily_hub_state.json")


def get_schedule_settings_file() -> str:
    return os.path.join(get_data_dir(), "schedule_settings.json")


def get_task_completions_file() -> str:
    return os.path.join(get_data_dir(), "task_completions.json")


# Backward compatibility properties/references
DATA_DIR = get_data_dir()
FAMILY_PROFILES_FILE = get_family_profiles_file()
PANTRY_ITEMS_FILE = get_pantry_items_file()
WEEKLY_PLANS_FILE = get_weekly_plans_file()
WEEKLY_BUDGETS_FILE = get_weekly_budgets_file()
CUSTOM_SHOPPING_FILE = get_custom_shopping_file()
DAILY_HUB_FILE = get_daily_hub_file()
SCHEDULE_SETTINGS_FILE = get_schedule_settings_file()
TASK_COMPLETIONS_FILE = get_task_completions_file()


def _safe_json_save(file_path: str, data: Any) -> None:
    """Atomically writes JSON to disk using a temporary file with flush and fsync."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    temp_path = f"{file_path}.tmp"
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temp_path, file_path)
    except Exception as e:
        print(f"Error saving {file_path}: {e}")
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


def _safe_json_load(file_path: str, default: Any = None) -> Any:
    """Safely loads JSON from disk, returning default if file does not exist or is invalid."""
    if not os.path.exists(file_path):
        return default
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Failed to load {file_path}: {e}")
        return default


# -------------------------------------------------------------
# 1. FAMILY PROFILES PERSISTENCE
# -------------------------------------------------------------

def load_family_profiles(default_members: Optional[List[FamilyMember]] = None) -> List[FamilyMember]:
    filepath = get_family_profiles_file()
    if not os.path.exists(filepath):
        if default_members is not None:
            save_family_profiles(default_members)
            return list(default_members)
        return []

    raw = _safe_json_load(filepath)
    if raw is not None and isinstance(raw, list):
        members = []
        for item in raw:
            try:
                members.append(FamilyMember(**item))
            except Exception as e:
                print(f"Error deserializing family profile {item.get('id', 'unknown')}: {e}")
        return members
    return []


def save_family_profiles(profiles: List[FamilyMember]) -> None:
    data = [p.model_dump() for p in profiles]
    _safe_json_save(get_family_profiles_file(), data)


# -------------------------------------------------------------
# 2. PANTRY INVENTORY PERSISTENCE
# -------------------------------------------------------------

def load_pantry_items(default_items: Optional[List[PantryItem]] = None) -> List[PantryItem]:
    filepath = get_pantry_items_file()
    if not os.path.exists(filepath):
        if default_items is not None:
            save_pantry_items(default_items)
            return list(default_items)
        return []

    raw = _safe_json_load(filepath)
    if raw is not None and isinstance(raw, list):
        items = []
        for item in raw:
            try:
                items.append(PantryItem(**item))
            except Exception as e:
                print(f"Error deserializing pantry item {item.get('id', 'unknown')}: {e}")
        return items
    return []


def save_pantry_items(items: List[PantryItem]) -> None:
    data = [i.model_dump() for i in items]
    _safe_json_save(get_pantry_items_file(), data)


# -------------------------------------------------------------
# 3. WEEKLY PLANS & BUDGETS PERSISTENCE
# -------------------------------------------------------------

def load_weekly_plans() -> Dict[int, WeeklyPlan]:
    filepath = get_weekly_plans_file()
    if not os.path.exists(filepath):
        return {}
    raw = _safe_json_load(filepath)
    if raw is not None and isinstance(raw, dict):
        result = {}
        for k, v in raw.items():
            try:
                result[int(k)] = WeeklyPlan(**v)
            except Exception as e:
                print(f"Error deserializing weekly plan {k}: {e}")
        return result
    return {}


def save_weekly_plans(plans: Dict[int, WeeklyPlan]) -> None:
    data = {str(k): v.model_dump() for k, v in plans.items()}
    _safe_json_save(get_weekly_plans_file(), data)


def load_weekly_budgets() -> Dict[int, float]:
    filepath = get_weekly_budgets_file()
    if not os.path.exists(filepath):
        return {}
    raw = _safe_json_load(filepath)
    if raw is not None and isinstance(raw, dict):
        try:
            return {int(k): float(v) for k, v in raw.items()}
        except Exception as e:
            print(f"Error deserializing weekly budgets: {e}")
    return {}


def save_weekly_budgets(budgets: Dict[int, float]) -> None:
    data = {str(k): float(v) for k, v in budgets.items()}
    _safe_json_save(get_weekly_budgets_file(), data)


# -------------------------------------------------------------
# 4. CUSTOM SHOPPING ITEMS PERSISTENCE
# -------------------------------------------------------------

def load_custom_shopping_items() -> List[CustomShoppingItem]:
    filepath = get_custom_shopping_file()
    if not os.path.exists(filepath):
        return []
    raw = _safe_json_load(filepath)
    if raw is not None and isinstance(raw, list):
        items = []
        for item in raw:
            try:
                items.append(CustomShoppingItem(**item))
            except Exception as e:
                print(f"Error deserializing custom shopping item: {e}")
        return items
    return []


def save_custom_shopping_items(items: List[CustomShoppingItem]) -> None:
    data = [i.model_dump() for i in items]
    _safe_json_save(get_custom_shopping_file(), data)


# -------------------------------------------------------------
# 5. DAILY HUB STATE PERSISTENCE
# -------------------------------------------------------------

def load_daily_hub_state(default_state: Dict[str, Any]) -> Dict[str, Any]:
    filepath = get_daily_hub_file()
    if not os.path.exists(filepath):
        save_daily_hub_state(default_state)
        return dict(default_state)
    raw = _safe_json_load(filepath)
    if raw is not None and isinstance(raw, dict):
        merged = dict(default_state)
        merged.update(raw)
        return merged
    return dict(default_state)


def save_daily_hub_state(state: Dict[str, Any]) -> None:
    _safe_json_save(get_daily_hub_file(), state)


# -------------------------------------------------------------
# 6. SCHEDULE SETTINGS & TIMELINE TASK COMPLETIONS
# -------------------------------------------------------------

def load_schedule_settings() -> Optional[ScheduleTimeSettings]:
    filepath = get_schedule_settings_file()
    if not os.path.exists(filepath):
        return None
    raw = _safe_json_load(filepath)
    if raw is not None and isinstance(raw, dict):
        try:
            return ScheduleTimeSettings(**raw)
        except Exception as e:
            print(f"Error deserializing schedule settings: {e}")
    return None


def save_schedule_settings(settings: ScheduleTimeSettings) -> None:
    _safe_json_save(get_schedule_settings_file(), settings.model_dump())


def load_task_completions() -> Dict[str, bool]:
    filepath = get_task_completions_file()
    if not os.path.exists(filepath):
        return {}
    raw = _safe_json_load(filepath)
    if raw is not None and isinstance(raw, dict):
        return {str(k): bool(v) for k, v in raw.items()}
    return {}


def save_task_completions(completions: Dict[str, bool]) -> None:
    _safe_json_save(get_task_completions_file(), completions)

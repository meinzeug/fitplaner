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

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

FAMILY_PROFILES_FILE = os.path.join(DATA_DIR, "family_profiles.json")
PANTRY_ITEMS_FILE = os.path.join(DATA_DIR, "pantry_items.json")
WEEKLY_PLANS_FILE = os.path.join(DATA_DIR, "weekly_plans.json")
WEEKLY_BUDGETS_FILE = os.path.join(DATA_DIR, "weekly_budgets.json")
CUSTOM_SHOPPING_FILE = os.path.join(DATA_DIR, "custom_shopping_items.json")
DAILY_HUB_FILE = os.path.join(DATA_DIR, "daily_hub_state.json")
SCHEDULE_SETTINGS_FILE = os.path.join(DATA_DIR, "schedule_settings.json")
TASK_COMPLETIONS_FILE = os.path.join(DATA_DIR, "task_completions.json")


def _safe_json_save(file_path: str, data: Any) -> None:
    """Atomically writes JSON to disk using a temporary file."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    temp_path = f"{file_path}.tmp"
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
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
    raw = _safe_json_load(FAMILY_PROFILES_FILE)
    if raw and isinstance(raw, list):
        try:
            return [FamilyMember(**item) for item in raw]
        except Exception as e:
            print(f"Error deserializing family profiles: {e}")
    if default_members:
        save_family_profiles(default_members)
        return list(default_members)
    return []


def save_family_profiles(profiles: List[FamilyMember]) -> None:
    data = [p.model_dump() for p in profiles]
    _safe_json_save(FAMILY_PROFILES_FILE, data)


# -------------------------------------------------------------
# 2. PANTRY INVENTORY PERSISTENCE
# -------------------------------------------------------------

def load_pantry_items(default_items: Optional[List[PantryItem]] = None) -> List[PantryItem]:
    raw = _safe_json_load(PANTRY_ITEMS_FILE)
    if raw and isinstance(raw, list):
        try:
            return [PantryItem(**item) for item in raw]
        except Exception as e:
            print(f"Error deserializing pantry items: {e}")
    if default_items:
        save_pantry_items(default_items)
        return list(default_items)
    return []


def save_pantry_items(items: List[PantryItem]) -> None:
    data = [i.model_dump() for i in items]
    _safe_json_save(PANTRY_ITEMS_FILE, data)


# -------------------------------------------------------------
# 3. WEEKLY PLANS & BUDGETS PERSISTENCE
# -------------------------------------------------------------

def load_weekly_plans() -> Dict[int, WeeklyPlan]:
    raw = _safe_json_load(WEEKLY_PLANS_FILE)
    if raw and isinstance(raw, dict):
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
    _safe_json_save(WEEKLY_PLANS_FILE, data)


def load_weekly_budgets() -> Dict[int, float]:
    raw = _safe_json_load(WEEKLY_BUDGETS_FILE)
    if raw and isinstance(raw, dict):
        try:
            return {int(k): float(v) for k, v in raw.items()}
        except Exception as e:
            print(f"Error deserializing weekly budgets: {e}")
    return {}


def save_weekly_budgets(budgets: Dict[int, float]) -> None:
    data = {str(k): float(v) for k, v in budgets.items()}
    _safe_json_save(WEEKLY_BUDGETS_FILE, data)


# -------------------------------------------------------------
# 4. CUSTOM SHOPPING ITEMS PERSISTENCE
# -------------------------------------------------------------

def load_custom_shopping_items() -> List[CustomShoppingItem]:
    raw = _safe_json_load(CUSTOM_SHOPPING_FILE)
    if raw and isinstance(raw, list):
        try:
            return [CustomShoppingItem(**item) for item in raw]
        except Exception as e:
            print(f"Error deserializing custom shopping items: {e}")
    return []


def save_custom_shopping_items(items: List[CustomShoppingItem]) -> None:
    data = [i.model_dump() for i in items]
    _safe_json_save(CUSTOM_SHOPPING_FILE, data)


# -------------------------------------------------------------
# 5. DAILY HUB STATE PERSISTENCE
# -------------------------------------------------------------

def load_daily_hub_state(default_state: Dict[str, Any]) -> Dict[str, Any]:
    raw = _safe_json_load(DAILY_HUB_FILE)
    if raw and isinstance(raw, dict):
        merged = dict(default_state)
        merged.update(raw)
        return merged
    save_daily_hub_state(default_state)
    return dict(default_state)


def save_daily_hub_state(state: Dict[str, Any]) -> None:
    _safe_json_save(DAILY_HUB_FILE, state)


# -------------------------------------------------------------
# 6. SCHEDULE SETTINGS & TIMELINE TASK COMPLETIONS
# -------------------------------------------------------------

def load_schedule_settings() -> Optional[ScheduleTimeSettings]:
    raw = _safe_json_load(SCHEDULE_SETTINGS_FILE)
    if raw and isinstance(raw, dict):
        try:
            return ScheduleTimeSettings(**raw)
        except Exception as e:
            print(f"Error deserializing schedule settings: {e}")
    return None


def save_schedule_settings(settings: ScheduleTimeSettings) -> None:
    _safe_json_save(SCHEDULE_SETTINGS_FILE, settings.model_dump())


def load_task_completions() -> Dict[str, bool]:
    raw = _safe_json_load(TASK_COMPLETIONS_FILE)
    if raw and isinstance(raw, dict):
        return {str(k): bool(v) for k, v in raw.items()}
    return {}


def save_task_completions(completions: Dict[str, bool]) -> None:
    _safe_json_save(TASK_COMPLETIONS_FILE, completions)

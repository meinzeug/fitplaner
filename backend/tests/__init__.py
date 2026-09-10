"""
backend/tests/__init__.py - Test Suite Initialization & Strict Production Data Isolation.
Redirects FITPLANER_DATA_DIR and FITPLANER_SETTINGS_FILE to an isolated temporary directory
so that executing tests NEVER touches, alters, or resets production user database files.
"""

import os
import tempfile
import atexit
import shutil

# Set up dedicated isolated test environment directory
_test_temp_dir = tempfile.mkdtemp(prefix="fitplaner_test_env_")
os.environ["FITPLANER_DATA_DIR"] = _test_temp_dir
os.environ["FITPLANER_SETTINGS_FILE"] = os.path.join(_test_temp_dir, "app_settings.json")
os.environ["TESTING"] = "1"

# Update persistence and settings_storage module globals to point to test dir
try:
    import backend.persistence as p
    import backend.settings_storage as s
    p.DATA_DIR = p.get_data_dir()
    p.FAMILY_PROFILES_FILE = p.get_family_profiles_file()
    p.PANTRY_ITEMS_FILE = p.get_pantry_items_file()
    p.WEEKLY_PLANS_FILE = p.get_weekly_plans_file()
    p.WEEKLY_BUDGETS_FILE = p.get_weekly_budgets_file()
    p.CUSTOM_SHOPPING_FILE = p.get_custom_shopping_file()
    p.DAILY_HUB_FILE = p.get_daily_hub_file()
    p.SCHEDULE_SETTINGS_FILE = p.get_schedule_settings_file()
    p.TASK_COMPLETIONS_FILE = p.get_task_completions_file()
    s.SETTINGS_FILE = s.get_settings_file()
except Exception:
    pass

def _cleanup_test_env():
    try:
        shutil.rmtree(_test_temp_dir, ignore_errors=True)
    except Exception:
        pass

atexit.register(_cleanup_test_env)

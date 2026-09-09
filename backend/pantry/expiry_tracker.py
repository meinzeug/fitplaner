"""
MHD and Expiry Tracking with Smart Shelf-Life Heuristics.
"""

from datetime import datetime, timedelta
from typing import Tuple, Optional


SHELF_LIFE_DAYS_ESTIMATE = {
    # Perishable - Short (< 5 days)
    "lachs": 3,
    "fisch": 3,
    "hähnchen": 3,
    "pute": 3,
    "fleisch": 3,
    "heidelbeeren": 5,
    "beeren": 4,
    "erdbeeren": 3,
    "spinat": 4,

    # Medium (6 - 12 days)
    "brokkoli": 7,
    "gurke": 7,
    "paprika": 8,
    "zucchini": 7,
    "tomaten": 7,
    "avocado": 6,
    "eier": 21,
    "skyr": 16,
    "quark": 14,
    "frischkäse": 14,
    "feta": 20,

    # Long / Durable (Staples)
    "haferflocken": 180,
    "quinoa": 365,
    "reis": 365,
    "nudeln": 365,
    "linsen": 365,
    "kichererbsen": 365,
    "chiasamen": 365,
    "walnuss": 180,
    "mandeln": 180,
    "olivenöl": 365,
    "salz": 730,
    "knäckebrot": 180,
    "süßkartoffeln": 21,
}


def calculate_shelf_life_status(
    mhd_date_str: Optional[str] = None,
    product_name: str = "",
    reference_date: Optional[datetime] = None
) -> Tuple[str, Optional[int], str]:
    """
    Returns (status: 'fresh' | 'expiring_soon' | 'expired', days_left: int, formatted_mhd: str)
    """
    now = reference_date or datetime.now()

    if mhd_date_str:
        try:
            # Supports YYYY-MM-DD or DD.MM.YYYY
            if "." in mhd_date_str:
                dt = datetime.strptime(mhd_date_str.strip(), "%d.%m.%Y")
            else:
                dt = datetime.strptime(mhd_date_str.strip(), "%Y-%m-%d")

            days_left = (dt.date() - now.date()).days

            if days_left < 0:
                return "expired", days_left, dt.strftime("%d.%m.%Y")
            elif days_left <= 3:
                return "expiring_soon", days_left, dt.strftime("%d.%m.%Y")
            else:
                return "fresh", days_left, dt.strftime("%d.%m.%Y")
        except ValueError:
            pass

    # Heuristic fallback based on product name
    lower_name = product_name.lower()
    days_estimate = 14  # default medium
    for key, d in SHELF_LIFE_DAYS_ESTIMATE.items():
        if key in lower_name:
            days_estimate = d
            break

    estimated_date = now + timedelta(days=days_estimate)
    days_left = days_estimate
    status = "fresh" if days_left > 3 else "expiring_soon"

    return status, days_left, estimated_date.strftime("%d.%m.%Y")

"""
Pantry and Inventory Management with Pack-Size Logic and Consumption Tracking.
"""

import uuid
from datetime import datetime
from typing import List, Dict, Optional, Tuple, Any
from backend.models import PantryItem, ScaledIngredient
from backend.pantry.expiry_tracker import calculate_shelf_life_status


STANDARD_PACK_SIZES: Dict[str, Tuple[float, str]] = {
    # Name pattern -> (pack_size, unit)
    "haferflocken": (500.0, "g"),
    "skyr": (500.0, "g"),
    "quark": (500.0, "g"),
    "magerquark": (500.0, "g"),
    "hähnchen": (400.0, "g"),
    "pute": (400.0, "g"),
    "lachs": (300.0, "g"),
    "brokkoli": (500.0, "g"),
    "paprika": (500.0, "g"),
    "süßkartoffeln": (1000.0, "g"),
    "eier": (10.0, "Stück"),
    "knäckebrot": (250.0, "g"),
    "linsen": (500.0, "g"),
    "kichererbsen": (400.0, "g"),
    "frischkäse": (200.0, "g"),
    "hüttenkäse": (200.0, "g"),
    "walnuss": (200.0, "g"),
    "chiasamen": (250.0, "g"),
    "quinoa": (500.0, "g"),
    "reis": (500.0, "g"),
    "nudeln": (500.0, "g"),
    "penne": (500.0, "g"),
    "olivenöl": (500.0, "ml"),
    "mandelmilch": (1000.0, "ml"),
    "avocado": (300.0, "g"),
    "tortilla": (6.0, "Stück"),
    "heidelbeeren": (300.0, "g"),
}


# Pre-populate pantry with realistic staples
DEFAULT_PANTRY: List[PantryItem] = [
    PantryItem(
        id="pan-1",
        name="Haferflocken zart",
        current_quantity=400.0,
        unit="g",
        category="Vollkorn & Hülsenfrüchte",
        mhd_date="2026-12-31",
        shelf_life_status="fresh",
        days_left=113,
        standard_pack_size=500.0,
        source="Restmenge",
        added_date=datetime.now().strftime("%d.%m.%Y"),
    ),
    PantryItem(
        id="pan-2",
        name="Natives Olivenöl extra",
        current_quantity=450.0,
        unit="ml",
        category="Gesunde Fette & Nüsse",
        mhd_date="2027-06-30",
        shelf_life_status="fresh",
        days_left=294,
        standard_pack_size=500.0,
        source="Vorratskammer",
        added_date=datetime.now().strftime("%d.%m.%Y"),
    ),
    PantryItem(
        id="pan-3",
        name="Walnusskerne",
        current_quantity=150.0,
        unit="g",
        category="Gesunde Fette & Nüsse",
        mhd_date="2026-10-15",
        shelf_life_status="fresh",
        days_left=36,
        standard_pack_size=200.0,
        source="Restmenge",
        added_date=datetime.now().strftime("%d.%m.%Y"),
    ),
]

_pantry_store: List[PantryItem] = list(DEFAULT_PANTRY)


def get_pack_size(ingredient_name: str, fallback_unit: str = "g") -> Tuple[float, str]:
    """
    Looks up standard retail pack size for grocery item with automatic unit matching.
    """
    lower = ingredient_name.lower()
    for key, (size, unit) in STANDARD_PACK_SIZES.items():
        if key in lower:
            if unit == fallback_unit:
                return size, unit
            if fallback_unit == "g" and unit == "Stück":
                piece_weights = {"avocado": 150.0, "ei": 55.0, "tortilla": 60.0, "apfel": 150.0}
                weight_per_piece = 100.0
                for pw_key, pw in piece_weights.items():
                    if pw_key in lower:
                        weight_per_piece = pw
                        break
                return size * weight_per_piece, "g"
            elif fallback_unit == "Stück" and unit == "g":
                return max(1.0, round(size / 150.0)), "Stück"
            return size, unit

    # Default fallback
    if fallback_unit == "Stück":
        return 1.0, "Stück"
    elif fallback_unit == "ml":
        return 500.0, "ml"
    return 500.0, "g"


def get_all_pantry_items() -> List[PantryItem]:
    # Recalculate days left and status on retrieval
    for item in _pantry_store:
        status, days, formatted_mhd = calculate_shelf_life_status(item.mhd_date, item.name)
        item.shelf_life_status = status  # type: ignore
        item.days_left = days
    return _pantry_store


def find_pantry_item_by_name(name: str) -> Optional[PantryItem]:
    lower_target = name.lower()
    for item in _pantry_store:
        if lower_target in item.name.lower() or item.name.lower() in lower_target:
            return item
    return None


def add_or_update_pantry_item(item: PantryItem) -> PantryItem:
    # Calculate MHD
    status, days, formatted_mhd = calculate_shelf_life_status(item.mhd_date, item.name)
    item.shelf_life_status = status  # type: ignore
    item.days_left = days
    if not item.mhd_date:
        item.mhd_date = formatted_mhd

    if not item.added_date:
        item.added_date = datetime.now().strftime("%d.%m.%Y")

    for i, existing in enumerate(_pantry_store):
        if existing.id == item.id:
            _pantry_store[i] = item
            return item

    _pantry_store.append(item)
    return item


def delete_pantry_item(item_id: str) -> bool:
    global _pantry_store
    initial_len = len(_pantry_store)
    _pantry_store = [i for i in _pantry_store if i.id != item_id]
    return len(_pantry_store) < initial_len


def deduct_consumption(ingredients: List[ScaledIngredient]) -> List[Dict[str, Any]]:
    """
    Live deducts consumed amounts from pantry when a recipe is cooked.
    Returns audit log of deductions.
    """
    audit_log = []

    for ing in ingredients:
        pantry_match = find_pantry_item_by_name(ing.name)
        if pantry_match:
            old_qty = pantry_match.current_quantity
            new_qty = max(0.0, round(old_qty - ing.amount, 1))
            pantry_match.current_quantity = new_qty
            audit_log.append({
                "ingredient": ing.name,
                "deducted": ing.amount,
                "unit": ing.unit,
                "previous_stock": old_qty,
                "remaining_stock": new_qty,
            })
            # If stock reaches 0, we leave it as 0g so the user sees it's used up
        else:
            audit_log.append({
                "ingredient": ing.name,
                "deducted": ing.amount,
                "unit": ing.unit,
                "previous_stock": 0.0,
                "remaining_stock": 0.0,
                "note": "Nicht im Lager hinterlegt (frisch verbraucht)",
            })

    return audit_log


def book_shopping_cart_to_pantry(items: List[Dict[str, Any]]) -> List[PantryItem]:
    """
    Takes checked shopping list items and books purchased quantities into pantry.
    """
    booked = []
    for raw in items:
        name = raw.get("name", "")
        qty = float(raw.get("quantity") or raw.get("total_quantity") or 0.0)
        unit = raw.get("unit", "g")
        cat = raw.get("category", "Vorratskammer")
        mhd = raw.get("mhd_date")

        existing = find_pantry_item_by_name(name)
        if existing:
            existing.current_quantity = round(existing.current_quantity + qty, 1)
            if mhd:
                existing.mhd_date = mhd
            booked.append(existing)
        else:
            pack_size, _ = get_pack_size(name, unit)
            status, days, formatted_mhd = calculate_shelf_life_status(mhd, name)
            new_item = PantryItem(
                id=f"pan-{uuid.uuid4().hex[:6]}",
                name=name,
                current_quantity=qty,
                unit=unit,
                category=cat,
                mhd_date=mhd or formatted_mhd,
                shelf_life_status=status,  # type: ignore
                days_left=days,
                standard_pack_size=pack_size,
                source="Kauf",
                added_date=datetime.now().strftime("%d.%m.%Y"),
            )
            _pantry_store.append(new_item)
            booked.append(new_item)

    return booked

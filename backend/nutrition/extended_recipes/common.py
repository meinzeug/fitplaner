"""
Common utilities and ingredient factories for the Recipe Universe generator.
"""

from typing import Dict, Any, List, Optional

RETAILERS = ["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka"]

UNSPLASH_IMAGES = {
    "oats": "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600",
    "skyr": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600",
    "bread": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600",
    "eggs": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600",
    "pancakes": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
    "bowl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
    "salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
    "wrap": "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600",
    "pasta": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
    "salmon": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600",
    "chicken": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600",
    "curry": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600",
    "soup": "https://images.unsplash.com/photo-1547496502-affa22d38842?w=600",
    "steak": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600",
    "sweetpotato": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600",
    "veggie": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600",
    "fish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600",
    "generic": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600"
}


def make_ing(name: str, amount: float, unit: str, category: str, retailer_idx: int = 0) -> Dict[str, Any]:
    # Strictly check that no combined strings with & or und exist
    assert " & " not in name, f"Forbidden '&' in ingredient name: '{name}'"
    assert " und " not in name, f"Forbidden 'und' in ingredient name: '{name}'"
    assert amount > 0, f"Amount must be strictly positive: {amount} for '{name}'"

    retailer = RETAILERS[retailer_idx % len(RETAILERS)]
    return {
        "name": name,
        "base_amount": round(float(amount), 1),
        "unit": unit,
        "category": category,
        "matched_offer_retailer": retailer
    }


def create_recipe(
    r_id: str,
    title: str,
    meal_type: str,
    prep_min: int,
    cook_min: int,
    difficulty: str,
    lunchbox_ready: bool,
    cals: int,
    prot: int,
    carbs: int,
    fat: int,
    allergens: List[str],
    diet_types: List[str],
    ingredients: List[Dict[str, Any]],
    instructions: List[str],
    prep_steps: List[str],
    cooking_steps: List[str],
    lunchbox_tips: List[str],
    tags: List[str],
    image_key: str = "generic"
) -> Dict[str, Any]:
    # Verification of step constraints
    assert 3 <= len(prep_steps) <= 5, f"{r_id}: prep_steps length {len(prep_steps)} not in [3, 5]"
    assert 3 <= len(cooking_steps) <= 6, f"{r_id}: cooking_steps length {len(cooking_steps)} not in [3, 6]"
    assert 2 <= len(lunchbox_tips) <= 4, f"{r_id}: lunchbox_tips length {len(lunchbox_tips)} not in [2, 4]"
    assert 4 <= len(instructions) <= 6, f"{r_id}: instructions length {len(instructions)} not in [4, 6]"

    diets = list(diet_types)
    if "omnivore" not in diets:
        diets.append("omnivore")
    if "schwein" not in [i["name"].lower() for i in ingredients]:
        if "no_pork" not in diets:
            diets.append("no_pork")
    if "gluten" not in allergens and "gluten_free" not in diets:
        diets.append("gluten_free")
    if "laktose" not in allergens and "lactose_free" not in diets:
        diets.append("lactose_free")
    if prot >= 30 and "high_protein" not in diets:
        diets.append("high_protein")
    if carbs <= 30 and "low_carb" not in diets:
        diets.append("low_carb")
    if "clean_eating" not in diets:
        diets.append("clean_eating")

    return {
        "id": r_id,
        "title": title,
        "meal_type": meal_type,
        "prep_time_minutes": prep_min,
        "cook_time_minutes": cook_min,
        "difficulty": difficulty,
        "lunchbox_ready": lunchbox_ready,
        "base_calories": cals,
        "base_protein_g": prot,
        "base_carbs_g": carbs,
        "base_fat_g": fat,
        "allergens": allergens,
        "diet_types": diets,
        "ingredients": ingredients,
        "instructions": instructions,
        "detailed_instructions": {
            "prep_steps": prep_steps,
            "cooking_steps": cooking_steps,
            "lunchbox_tips": lunchbox_tips,
        },
        "tags": tags,
        "image_url": UNSPLASH_IMAGES.get(image_key, UNSPLASH_IMAGES["generic"])
    }

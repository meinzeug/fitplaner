"""
Recipe Universe Loader & Query Service.
Provides in-memory caching and ultra-fast filtering for 1,200+ authentic
German supermarket recipes across all 11 dietary styles and meal types.
"""

import os
import json
from typing import List, Dict, Optional, Any
from backend.models import Recipe, RecipeIngredient, DetailedInstruction

_RECIPES_CACHE: Optional[List[Recipe]] = None
_RECIPES_BY_ID: Dict[str, Recipe] = {}
_RECIPES_BY_MEAL: Dict[str, List[Recipe]] = {
    "breakfast_lunchbox": [],
    "lunch_lunchbox": [],
    "dinner_home": [],
}


def _get_universe_file_path() -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "recipes_universe.json")


def _load_universe_if_needed() -> List[Recipe]:
    global _RECIPES_CACHE, _RECIPES_BY_ID, _RECIPES_BY_MEAL

    if _RECIPES_CACHE is not None:
        return _RECIPES_CACHE

    json_path = _get_universe_file_path()
    if not os.path.exists(json_path):
        from backend.nutrition.generate_universe import build_universe
        build_universe()

    with open(json_path, "r", encoding="utf-8") as f:
        raw_list = json.load(f)

    recipes: List[Recipe] = []
    _RECIPES_BY_ID.clear()
    for k in _RECIPES_BY_MEAL:
        _RECIPES_BY_MEAL[k].clear()

    for item in raw_list:
        try:
            # Parse RecipeIngredient models
            ingredients = [
                RecipeIngredient(
                    name=ing.get("name", ""),
                    base_amount=float(ing.get("base_amount", 1.0)),
                    unit=ing.get("unit", "g"),
                    category=ing.get("category", "Basics"),
                    matched_offer_id=ing.get("matched_offer_id"),
                    matched_offer_retailer=ing.get("matched_offer_retailer"),
                    matched_offer_price=float(ing["matched_offer_price"]) if ing.get("matched_offer_price") is not None else None,
                )
                for ing in item.get("ingredients", [])
            ]

            # Parse DetailedInstruction if present
            detailed = None
            if "detailed_instructions" in item and item["detailed_instructions"]:
                d_data = item["detailed_instructions"]
                detailed = DetailedInstruction(
                    prep_steps=d_data.get("prep_steps", []),
                    cooking_steps=d_data.get("cooking_steps", []),
                    lunchbox_tips=d_data.get("lunchbox_tips", []),
                )

            recipe = Recipe(
                id=item["id"],
                title=item["title"],
                meal_type=item["meal_type"],
                prep_time_minutes=int(item.get("prep_time_minutes", 10)),
                cook_time_minutes=int(item.get("cook_time_minutes", 15)),
                difficulty=item.get("difficulty", "Einfach"),
                lunchbox_ready=bool(item.get("lunchbox_ready", True)),
                base_calories=int(item.get("base_calories", 500)),
                base_protein_g=int(item.get("base_protein_g", 30)),
                base_carbs_g=int(item.get("base_carbs_g", 50)),
                base_fat_g=int(item.get("base_fat_g", 15)),
                ingredients=ingredients,
                instructions=item.get("instructions", []),
                detailed_instructions=detailed,
                allergens=item.get("allergens", []),
                diet_types=item.get("diet_types", ["omnivore"]),
                tags=item.get("tags", []),
                image_url=item.get("image_url"),
            )
            recipes.append(recipe)
            _RECIPES_BY_ID[recipe.id] = recipe
            if recipe.meal_type in _RECIPES_BY_MEAL:
                _RECIPES_BY_MEAL[recipe.meal_type].append(recipe)
        except Exception:
            continue

    _RECIPES_CACHE = recipes
    return _RECIPES_CACHE


def get_all_universe_recipes() -> List[Recipe]:
    """Returns all recipes in the universe database (1,200+)."""
    return _load_universe_if_needed()


def get_recipe_by_id(recipe_id: str) -> Optional[Recipe]:
    """Finds a single recipe by its ID."""
    _load_universe_if_needed()
    return _RECIPES_BY_ID.get(recipe_id)


def filter_universe_recipes(
    meal_type: Optional[str] = None,
    diet: Optional[str] = None,
    exclude_allergens: Optional[List[str]] = None,
    disliked_foods: Optional[List[str]] = None,
) -> List[Recipe]:
    """
    Ultra-fast filtering of the universe database by meal_type, diet style,
    allergies, and disliked ingredients.
    """
    _load_universe_if_needed()

    if meal_type and meal_type in _RECIPES_BY_MEAL:
        candidates = _RECIPES_BY_MEAL[meal_type]
    else:
        candidates = _RECIPES_CACHE or []

    results: List[Recipe] = []
    norm_allergens = [a.lower().strip() for a in (exclude_allergens or []) if a.strip()]
    norm_dislikes = [d.lower().strip() for d in (disliked_foods or []) if d.strip()]

    for r in candidates:
        # 1. Dietary Preference Check
        if diet and diet != "all":
            if diet == "vegetarian":
                if "vegetarian" not in r.diet_types and "vegan" not in r.diet_types:
                    continue
            elif diet == "vegan":
                if "vegan" not in r.diet_types:
                    continue
            elif diet == "pescetarian":
                if not any(d in r.diet_types for d in ["pescetarian", "vegetarian", "vegan"]):
                    continue
            elif diet == "no_pork":
                if "no_pork" not in r.diet_types:
                    if any("schwein" in ing.name.lower() or "salami" in ing.name.lower() for ing in r.ingredients):
                        continue
            elif diet in ["high_protein", "low_carb", "gluten_free", "lactose_free", "mediterranean", "clean_eating"]:
                if diet not in r.diet_types:
                    continue

        # 2. Allergen Check
        if norm_allergens:
            has_allergen = False
            for a in r.allergens:
                if a.lower().strip() in norm_allergens:
                    has_allergen = True
                    break
            if has_allergen:
                continue

        # 3. Disliked Foods Check
        if norm_dislikes:
            has_dislike = False
            for ing in r.ingredients:
                ing_lower = ing.name.lower()
                for bad in norm_dislikes:
                    if bad in ing_lower:
                        has_dislike = True
                        break
                if has_dislike:
                    break
            if has_dislike:
                continue

        results.append(r)

    return results


def get_universe_stats() -> Dict[str, Any]:
    """Returns statistical metrics on the recipe database."""
    recipes = get_all_universe_recipes()
    diet_counts: Dict[str, int] = {}
    for r in recipes:
        for d in r.diet_types:
            diet_counts[d] = diet_counts.get(d, 0) + 1

    return {
        "total_recipes": len(recipes),
        "breakfasts": len(_RECIPES_BY_MEAL.get("breakfast_lunchbox", [])),
        "lunches": len(_RECIPES_BY_MEAL.get("lunch_lunchbox", [])),
        "dinners": len(_RECIPES_BY_MEAL.get("dinner_home", [])),
        "diet_distribution": diet_counts,
        "is_ai_free": True,
        "local_storage_mode": "offline_json",
    }

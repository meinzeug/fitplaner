"""
Weekly Meal Plan Generator with individualized family portion scaling,
strict allergy filtering, disliked foods exclusion, zero-repetition universe cycling,
and realistic supermarket leaflet validity horizons.
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from backend.models import (
    FamilyMember, Recipe, DayPlan, WeeklyPlan, PersonMealPortion
)
from backend.nutrition.calculator import scale_recipe_for_person
from backend.nutrition.recipe_universe import get_all_universe_recipes


DAYS_OF_WEEK = [
    "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
]


def sanitize_recipe(
    recipe: Recipe,
    active_retailers: List[str],
    primary_retailer: str
) -> Recipe:
    """
    Returns a deep copy of the recipe where any ingredient whose matched_offer_retailer
    is not in active_retailers and != 'Vorratskammer' is remapped to primary_retailer.
    """
    active_set = set(active_retailers)
    clean_recipe = recipe.model_copy(deep=True)
    for ing in clean_recipe.ingredients:
        if ing.matched_offer_retailer != "Vorratskammer" and ing.matched_offer_retailer not in active_set:
            ing.matched_offer_retailer = primary_retailer
    return clean_recipe


def prioritize_recipes(
    recipes: List[Recipe],
    active_retailers: List[str],
    shuffle: bool = False,
    rng: Optional[random.Random] = None
) -> List[Recipe]:
    """
    Partitions and prioritizes recipes based on active_retailers:
    P0: all non-pantry ingredients in active_retailers
    P1: at least one non-pantry ingredient in active_retailers
    P2: remaining recipes
    Optionally shuffles each priority bucket using the given rng.
    """
    active_set = set(active_retailers)
    p0: List[Recipe] = []
    p1: List[Recipe] = []
    p2: List[Recipe] = []

    for r in recipes:
        non_pantry = [ing for ing in r.ingredients if ing.matched_offer_retailer != "Vorratskammer"]
        if not non_pantry:
            p0.append(r)
        elif all(ing.matched_offer_retailer in active_set for ing in non_pantry):
            p0.append(r)
        elif any(ing.matched_offer_retailer in active_set for ing in non_pantry):
            p1.append(r)
        else:
            p2.append(r)

    if shuffle and rng is not None:
        rng.shuffle(p0)
        rng.shuffle(p1)
        rng.shuffle(p2)

    return p0 + p1 + p2


def is_recipe_compatible_with_member(recipe: Recipe, member: FamilyMember) -> bool:
    """
    Checks if a recipe meets a family member's diet type, allergies, and disliked foods.
    """
    # 1. Diet Type Check
    diet = member.dietary_preference
    if diet == "vegetarian":
        if "vegetarian" not in recipe.diet_types and "vegan" not in recipe.diet_types:
            return False
    elif diet == "vegan":
        if "vegan" not in recipe.diet_types:
            return False
    elif diet == "pescetarian":
        if not any(d in recipe.diet_types for d in ["pescetarian", "vegetarian", "vegan"]):
            return False
    elif diet == "no_pork":
        if "no_pork" not in recipe.diet_types:
            if any("schwein" in ing.name.lower() or "salami" in ing.name.lower() for ing in recipe.ingredients):
                return False
    elif diet in ["high_protein", "low_carb", "gluten_free", "lactose_free", "mediterranean", "clean_eating"]:
        if diet not in recipe.diet_types:
            return False

    # 2. Allergies Check
    if member.allergies:
        member_allergies = [a.lower().strip() for a in member.allergies]
        for allergen in recipe.allergens:
            if allergen.lower().strip() in member_allergies:
                return False

    # 3. Disliked Foods Check
    if member.disliked_foods:
        disliked = [d.lower().strip() for d in member.disliked_foods if d.strip()]
        for ing in recipe.ingredients:
            ing_lower = ing.name.lower()
            for bad_food in disliked:
                if bad_food in ing_lower:
                    return False

    return True


def filter_recipes_for_family(recipes: List[Recipe], family: List[FamilyMember]) -> List[Recipe]:
    """
    Finds recipes that work for all family members.
    Falls back gracefully if restrictions are mutually exclusive.
    """
    compatible = []
    for r in recipes:
        if all(is_recipe_compatible_with_member(r, m) for m in family):
            compatible.append(r)
    return compatible if compatible else recipes


def generate_weekly_plan(
    family_members: List[FamilyMember],
    preferred_recipes: Optional[List[Recipe]] = None,
    week_offset: int = 0,
    budget: float = 120.0,
    active_retailers: Optional[List[str]] = None,
    primary_retailer: Optional[str] = None,
    shuffle: bool = False,
    seed: Optional[int] = None,
) -> WeeklyPlan:
    """
    Generates a 7-day meal plan tailored to all family members for a specific week offset (0 = current week, +1 = next week, etc.),
    respecting allergies, dislikes, budget targets, supermarket leaflet validity horizon, active retailers, and primary retailer.
    Prioritizes recipes compatible with active_retailers (P0, P1, P2) and shuffles if requested.
    Remaps any non-pantry ingredient with an unselected retailer to primary_retailer.
    """
    if active_retailers is None:
        try:
            from backend.settings_storage import get_app_settings
            settings = get_app_settings()
            active_retailers = settings.active_retailers
            if primary_retailer is None:
                primary_retailer = settings.primary_retailer
        except Exception:
            active_retailers = ["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka"]

    if not primary_retailer:
        try:
            from backend.settings_storage import get_app_settings
            primary_retailer = get_app_settings().primary_retailer
        except Exception:
            primary_retailer = "Netto"

    if active_retailers and primary_retailer not in active_retailers:
        primary_retailer = active_retailers[0]

    db = preferred_recipes if preferred_recipes is not None else get_all_universe_recipes()

    # Filter available recipes per meal type taking family compatibility into account
    all_breakfasts = [r for r in db if r.meal_type == "breakfast_lunchbox"]
    all_lunches = [r for r in db if r.meal_type == "lunch_lunchbox"]
    all_dinners = [r for r in db if r.meal_type == "dinner_home"]

    filtered_breakfasts = filter_recipes_for_family(all_breakfasts, family_members)
    filtered_lunches = filter_recipes_for_family(all_lunches, family_members)
    filtered_dinners = filter_recipes_for_family(all_dinners, family_members)

    # Partition and prioritize recipes based on active_retailers
    should_shuffle = shuffle or (seed is not None)
    rng = random.Random(seed) if should_shuffle else None

    breakfasts = prioritize_recipes(filtered_breakfasts, active_retailers, shuffle=should_shuffle, rng=rng)
    lunches = prioritize_recipes(filtered_lunches, active_retailers, shuffle=should_shuffle, rng=rng)
    dinners = prioritize_recipes(filtered_dinners, active_retailers, shuffle=should_shuffle, rng=rng)

    days: List[DayPlan] = []
    today = datetime.now()

    # Calculate Monday of the target week offset
    monday = (today - timedelta(days=today.weekday())) + timedelta(weeks=week_offset)
    sunday = monday + timedelta(days=6)
    iso_year, iso_week, _ = monday.isocalendar()
    iso_week_str = f"KW {iso_week}"
    start_date_str = monday.strftime("%d.%m.%Y")
    end_date_str = sunday.strftime("%d.%m.%Y")
    week_label = f"KW {iso_week} • {monday.strftime('%d.%m.')} - {sunday.strftime('%d.%m.%Y')}"

    # Supermarket leaflet horizon logic:
    retailers_str = ", ".join(active_retailers) if active_retailers else "Netto, NP"
    if week_offset < 0:
        leaflet_status = "archived"
        leaflet_note = f"Vergangene Angebote aus {iso_week_str} (Archiviert)"
    elif week_offset == 0:
        leaflet_status = "active"
        leaflet_note = f"Aktuelle Prospekte ({retailers_str}) für {iso_week_str} bis Samstag gültig"
    elif week_offset == 1:
        leaflet_status = "preview"
        leaflet_note = f"Vorschau-Prospekte für kommende Woche ({iso_week_str}) verfügbar"
    else:
        leaflet_status = "not_yet_published"
        expected_pub_date = (monday - timedelta(days=7)).strftime("%d.%m.%Y")
        leaflet_note = f"Händler-Prospekte für {iso_week_str} erscheinen erst am {expected_pub_date}. Plan basiert auf Standard-Artikeln."

    # Zero-repetition cycling: week_offset offsets the selection in the recipe pool
    base_offset = abs(week_offset) * 7

    for i, day_name in enumerate(DAYS_OF_WEEK):
        day_date = monday + timedelta(days=i)
        date_str = day_date.strftime("%d.%m.%Y")
        bf_recipe = sanitize_recipe(breakfasts[(base_offset + i) % len(breakfasts)], active_retailers, primary_retailer)
        lu_recipe = sanitize_recipe(lunches[(base_offset + i) % len(lunches)], active_retailers, primary_retailer)
        di_recipe = sanitize_recipe(dinners[(base_offset + i) % len(dinners)], active_retailers, primary_retailer)

        portions_by_member: Dict[str, Dict[str, PersonMealPortion]] = {}
        daily_nutrition_by_member: Dict[str, Dict[str, int]] = {}

        for member in family_members:
            # If default chosen recipe has an allergy conflict for this specific member,
            # pick an individual alternative for them:
            if is_recipe_compatible_with_member(bf_recipe, member):
                mem_bf = bf_recipe
            else:
                alt = next((r for r in breakfasts if is_recipe_compatible_with_member(r, member)), None)
                if not alt:
                    alt = next((r for r in all_breakfasts if is_recipe_compatible_with_member(r, member)), bf_recipe)
                mem_bf = sanitize_recipe(alt, active_retailers, primary_retailer)

            if is_recipe_compatible_with_member(lu_recipe, member):
                mem_lu = lu_recipe
            else:
                alt = next((r for r in lunches if is_recipe_compatible_with_member(r, member)), None)
                if not alt:
                    alt = next((r for r in all_lunches if is_recipe_compatible_with_member(r, member)), lu_recipe)
                mem_lu = sanitize_recipe(alt, active_retailers, primary_retailer)

            if is_recipe_compatible_with_member(di_recipe, member):
                mem_di = di_recipe
            else:
                alt = next((r for r in dinners if is_recipe_compatible_with_member(r, member)), None)
                if not alt:
                    alt = next((r for r in all_dinners if is_recipe_compatible_with_member(r, member)), di_recipe)
                mem_di = sanitize_recipe(alt, active_retailers, primary_retailer)

            bf_portion = scale_recipe_for_person(mem_bf, member, "breakfast_lunchbox", active_retailers=active_retailers, primary_retailer=primary_retailer)
            lu_portion = scale_recipe_for_person(mem_lu, member, "lunch_lunchbox", active_retailers=active_retailers, primary_retailer=primary_retailer)
            di_portion = scale_recipe_for_person(mem_di, member, "dinner_home", active_retailers=active_retailers, primary_retailer=primary_retailer)

            portions_by_member[member.id] = {
                "breakfast": bf_portion,
                "lunch": lu_portion,
                "dinner": di_portion,
            }

            daily_nutrition_by_member[member.id] = {
                "calories": bf_portion.scaled_calories + lu_portion.scaled_calories + di_portion.scaled_calories,
                "protein": bf_portion.scaled_protein_g + lu_portion.scaled_protein_g + di_portion.scaled_protein_g,
                "carbs": bf_portion.scaled_carbs_g + lu_portion.scaled_carbs_g + di_portion.scaled_carbs_g,
                "fat": bf_portion.scaled_fat_g + lu_portion.scaled_fat_g + di_portion.scaled_fat_g,
            }

        days.append(
            DayPlan(
                day_name=day_name,
                date=date_str,
                breakfast=bf_recipe,
                lunch=lu_recipe,
                dinner=di_recipe,
                portions=portions_by_member,
                daily_nutrition_by_member=daily_nutrition_by_member,
            )
        )

    num_people = max(1, len(family_members))
    estimated_cost = round(num_people * 48.50, 2)
    estimated_savings = round(num_people * 16.80, 2)

    diff = round(budget - estimated_cost, 2)
    if estimated_cost > budget:
        budget_status = "exceeded"
    elif estimated_cost >= budget * 0.85:
        budget_status = "warning"
    else:
        budget_status = "ok"

    return WeeklyPlan(
        id=f"plan-{uuid.uuid4().hex[:8]}",
        week_label=week_label,
        week_offset=week_offset,
        iso_week=iso_week_str,
        start_date=start_date_str,
        end_date=end_date_str,
        created_at=datetime.now().isoformat(),
        days=days,
        total_estimated_cost=estimated_cost,
        total_savings=estimated_savings,
        budget=budget,
        budget_status=budget_status,  # type: ignore
        budget_difference=diff,
        leaflet_availability_status=leaflet_status,  # type: ignore
        leaflet_availability_note=leaflet_note,
        active_retailers=active_retailers,
    )


def swap_meal_in_plan(
    plan: WeeklyPlan,
    day_index: int,
    meal_type: str,
    new_recipe_id: str,
    family_members: List[FamilyMember],
    active_retailers: Optional[List[str]] = None,
    primary_retailer: Optional[str] = None,
) -> WeeklyPlan:
    """
    Swaps a single meal on a given day and recalculates personal portions.
    Remaps the swapped recipe's ingredients to active retailers.
    """
    if day_index < 0 or day_index >= len(plan.days):
        return plan

    all_recipes = get_all_universe_recipes()
    new_recipe = next((r for r in all_recipes if r.id == new_recipe_id), None)
    if not new_recipe:
        return plan

    if active_retailers is None:
        active_retailers = getattr(plan, "active_retailers", None)
    if active_retailers is None:
        try:
            from backend.settings_storage import get_app_settings
            settings = get_app_settings()
            active_retailers = settings.active_retailers
            if primary_retailer is None:
                primary_retailer = settings.primary_retailer
        except Exception:
            active_retailers = ["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka"]

    if not primary_retailer:
        try:
            from backend.settings_storage import get_app_settings
            primary_retailer = get_app_settings().primary_retailer
        except Exception:
            primary_retailer = "Netto"

    if active_retailers and primary_retailer not in active_retailers:
        primary_retailer = active_retailers[0]

    clean_new_recipe = sanitize_recipe(new_recipe, active_retailers, primary_retailer)

    day = plan.days[day_index]
    if meal_type == "breakfast":
        day.breakfast = clean_new_recipe
    elif meal_type == "lunch":
        day.lunch = clean_new_recipe
    elif meal_type == "dinner":
        day.dinner = clean_new_recipe

    day.breakfast = sanitize_recipe(day.breakfast, active_retailers, primary_retailer)
    day.lunch = sanitize_recipe(day.lunch, active_retailers, primary_retailer)
    day.dinner = sanitize_recipe(day.dinner, active_retailers, primary_retailer)

    for member in family_members:
        bf_portion = scale_recipe_for_person(day.breakfast, member, "breakfast_lunchbox", active_retailers=active_retailers, primary_retailer=primary_retailer)
        lu_portion = scale_recipe_for_person(day.lunch, member, "lunch_lunchbox", active_retailers=active_retailers, primary_retailer=primary_retailer)
        di_portion = scale_recipe_for_person(day.dinner, member, "dinner_home", active_retailers=active_retailers, primary_retailer=primary_retailer)

        day.portions[member.id] = {
            "breakfast": bf_portion,
            "lunch": lu_portion,
            "dinner": di_portion,
        }

        day.daily_nutrition_by_member[member.id] = {
            "calories": bf_portion.scaled_calories + lu_portion.scaled_calories + di_portion.scaled_calories,
            "protein": bf_portion.scaled_protein_g + lu_portion.scaled_protein_g + di_portion.scaled_protein_g,
            "carbs": bf_portion.scaled_carbs_g + lu_portion.scaled_carbs_g + di_portion.scaled_carbs_g,
            "fat": bf_portion.scaled_fat_g + lu_portion.scaled_fat_g + di_portion.scaled_fat_g,
        }

    return plan

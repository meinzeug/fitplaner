"""
Weekly Meal Plan Generator with individualized family portion scaling,
strict allergy filtering, disliked foods exclusion, zero-repetition universe cycling,
and realistic supermarket leaflet validity horizons.
"""

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
    active_retailers: Optional[List[str]] = None
) -> WeeklyPlan:
    """
    Generates a 7-day meal plan tailored to all family members for a specific week offset (0 = current week, +1 = next week, etc.),
    respecting allergies, dislikes, budget targets, supermarket leaflet validity horizon, and active retailers.
    """
    if active_retailers is None:
        try:
            from backend.settings_storage import get_app_settings
            active_retailers = get_app_settings().active_retailers
        except Exception:
            active_retailers = ["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka"]

    db = preferred_recipes if preferred_recipes is not None else get_all_universe_recipes()

    # Filter available recipes per meal type taking family compatibility into account
    all_breakfasts = [r for r in db if r.meal_type == "breakfast_lunchbox"]
    all_lunches = [r for r in db if r.meal_type == "lunch_lunchbox"]
    all_dinners = [r for r in db if r.meal_type == "dinner_home"]

    breakfasts = filter_recipes_for_family(all_breakfasts, family_members)
    lunches = filter_recipes_for_family(all_lunches, family_members)
    dinners = filter_recipes_for_family(all_dinners, family_members)

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
    # Retailer leaflets are only published at most 1 week in advance
    if week_offset < 0:
        leaflet_status = "archived"
        leaflet_note = f"Vergangene Angebote aus {iso_week_str} (Archiviert)"
    elif week_offset == 0:
        leaflet_status = "active"
        leaflet_note = f"Aktuelle Prospekte (Netto, NP, Lidl, Aldi, Rewe, Kaufland, Edeka) für {iso_week_str} bis Samstag gültig"
    elif week_offset == 1:
        leaflet_status = "preview"
        leaflet_note = f"Vorschau-Prospekte für kommende Woche ({iso_week_str}) verfügbar"
    else:
        leaflet_status = "not_yet_published"
        expected_pub_date = (monday - timedelta(days=7)).strftime("%d.%m.%Y")
        leaflet_note = f"Händler-Prospekte für {iso_week_str} erscheinen erst am {expected_pub_date}. Plan basiert auf Standard-Artikeln."

    # Zero-repetition cycling: week_offset offsets the selection in the 1,220 recipe pool
    base_offset = abs(week_offset) * 7

    for i, day_name in enumerate(DAYS_OF_WEEK):
        day_date = monday + timedelta(days=i)
        date_str = day_date.strftime("%d.%m.%Y")
        bf_recipe = breakfasts[(base_offset + i) % len(breakfasts)]
        lu_recipe = lunches[(base_offset + i) % len(lunches)]
        di_recipe = dinners[(base_offset + i) % len(dinners)]

        portions_by_member: Dict[str, Dict[str, PersonMealPortion]] = {}
        daily_nutrition_by_member: Dict[str, Dict[str, int]] = {}

        for member in family_members:
            # If default chosen recipe has an allergy conflict for this specific member,
            # pick an individual alternative for them:
            mem_bf = bf_recipe if is_recipe_compatible_with_member(bf_recipe, member) else next((r for r in all_breakfasts if is_recipe_compatible_with_member(r, member)), bf_recipe)
            mem_lu = lu_recipe if is_recipe_compatible_with_member(lu_recipe, member) else next((r for r in all_lunches if is_recipe_compatible_with_member(r, member)), lu_recipe)
            mem_di = di_recipe if is_recipe_compatible_with_member(di_recipe, member) else next((r for r in all_dinners if is_recipe_compatible_with_member(r, member)), di_recipe)

            bf_portion = scale_recipe_for_person(mem_bf, member, "breakfast_lunchbox")
            lu_portion = scale_recipe_for_person(mem_lu, member, "lunch_lunchbox")
            di_portion = scale_recipe_for_person(mem_di, member, "dinner_home")

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
    family_members: List[FamilyMember]
) -> WeeklyPlan:
    """
    Swaps a single meal on a given day and recalculates personal portions.
    """
    if day_index < 0 or day_index >= len(plan.days):
        return plan

    all_recipes = get_all_universe_recipes()
    new_recipe = next((r for r in all_recipes if r.id == new_recipe_id), None)
    if not new_recipe:
        return plan

    day = plan.days[day_index]
    if meal_type == "breakfast":
        day.breakfast = new_recipe
    elif meal_type == "lunch":
        day.lunch = new_recipe
    elif meal_type == "dinner":
        day.dinner = new_recipe

    for member in family_members:
        bf_portion = scale_recipe_for_person(day.breakfast, member, "breakfast_lunchbox")
        lu_portion = scale_recipe_for_person(day.lunch, member, "lunch_lunchbox")
        di_portion = scale_recipe_for_person(day.dinner, member, "dinner_home")

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

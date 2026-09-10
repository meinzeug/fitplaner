"""
Nutrition and Energy Expenditure Calculator using Mifflin-St Jeor equation.
"""

from typing import Dict, Any, List, Optional
from backend.models import FamilyMember, Recipe, PersonMealPortion, ScaledIngredient


PAL_FACTORS = {
    "sedentary": 1.2,      # Kaum Bewegung, reine Bürotätigkeit
    "light": 1.375,        # Leicht aktiv, sitzend mit wenig Bewegung
    "moderate": 1.55,      # Mäßig aktiv, z.B. Steh-/Gehtätigkeit oder 3x Sport/Woche
    "active": 1.725,       # Sehr aktiv, z.B. körperliche Arbeit oder 5x Sport/Woche
    "very_active": 1.9,    # Extrem aktiv, z.B. Bauarbeiter oder Leistungssportler
}

MEAL_RATIOS = {
    "breakfast_lunchbox": 0.28,  # ca. 28% der Tageskalorien
    "lunch_lunchbox": 0.36,      # ca. 36% der Tageskalorien
    "dinner_home": 0.36,         # ca. 36% der Tageskalorien
}


def calculate_bmr(gender: str, weight_kg: float, height_cm: float, age: int) -> float:
    """
    Calculates Basal Metabolic Rate (Grundumsatz) via Mifflin-St Jeor equation.
    Mann: 10 * kg + 6.25 * cm - 5 * Alter + 5
    Frau: 10 * kg + 6.25 * cm - 5 * Alter - 161
    """
    base = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age
    if gender.lower() == "male":
        return round(base + 5.0, 1)
    else:
        return round(base - 161.0, 1)


def calculate_tdee(bmr: float, activity_level: str) -> float:
    """
    Calculates Total Daily Energy Expenditure (Leistungsumsatz).
    """
    pal = PAL_FACTORS.get(activity_level, 1.4)
    return round(bmr * pal, 1)


def calculate_target_macros(
    weight_kg: float,
    tdee: float,
    goal: str,
    dietary_pref: str = "all"
) -> Dict[str, int]:
    """
    Calculates target calories and macro splits:
    - lose_weight: -20% deficit (capped at -500 kcal max)
    - maintain: 0%
    - gain_muscle: +10% surplus (+250 to 300 kcal)
    """
    if goal == "lose_weight":
        target_calories = int(max(1200, tdee * 0.8))
    elif goal == "gain_muscle":
        target_calories = int(tdee * 1.1)
    else:  # maintain
        target_calories = int(tdee)

    # Protein: 1.8g - 2.2g per kg bodyweight
    if goal == "gain_muscle" or dietary_pref == "high_protein":
        protein_g = int(round(weight_kg * 2.2))
    elif goal == "lose_weight":
        protein_g = int(round(weight_kg * 2.0))  # Higher protein helps retain muscle during deficit
    else:
        protein_g = int(round(weight_kg * 1.8))

    protein_calories = protein_g * 4

    # Fats: 25-30% of total calories (minimum 0.8g/kg for hormonal health)
    fat_calories = target_calories * 0.28
    fat_g = int(max(round(weight_kg * 0.8), round(fat_calories / 9)))
    actual_fat_calories = fat_g * 9

    # Carbs: Remaining calories
    remaining_calories = max(0, target_calories - protein_calories - actual_fat_calories)
    carbs_g = int(round(remaining_calories / 4))

    return {
        "target_calories": target_calories,
        "target_protein_g": protein_g,
        "target_carbs_g": carbs_g,
        "target_fat_g": fat_g,
    }


def enrich_family_member(member_data: Dict[str, Any]) -> FamilyMember:
    """
    Calculates and enriches a family member with BMR, TDEE, and target macros.
    """
    bmr = calculate_bmr(
        gender=member_data["gender"],
        weight_kg=float(member_data["weight_kg"]),
        height_cm=float(member_data["height_cm"]),
        age=int(member_data["age"]),
    )
    tdee = calculate_tdee(bmr, member_data["activity_level"])
    macros = calculate_target_macros(
        weight_kg=float(member_data["weight_kg"]),
        tdee=tdee,
        goal=member_data["goal"],
        dietary_pref=member_data.get("dietary_preference", "all"),
    )

    data = dict(member_data)
    data["bmr"] = bmr
    data["tdee"] = tdee
    data.update(macros)

    # Populate age-appropriate roles and water targets if not set
    age = int(data.get("age", 30))
    if age < 6:
        data.setdefault("age_group", "mini")
        data.setdefault("role_title", "🧸 Küchen-Wichtel")
        data.setdefault("daily_water_target_ml", 1200)
    elif age <= 9:
        data.setdefault("age_group", "kid")
        data.setdefault("role_title", "🥕 Nachwuchskoch")
        data.setdefault("daily_water_target_ml", 1500)
    elif age <= 14:
        data.setdefault("age_group", "teen")
        data.setdefault("role_title", "🔪 Sous-Chef")
        data.setdefault("daily_water_target_ml", 1800)
    elif age <= 18:
        data.setdefault("age_group", "junior")
        data.setdefault("role_title", "👨‍🍳 Küchen-Chef")
        data.setdefault("daily_water_target_ml", 2200)
    elif age <= 64:
        data.setdefault("age_group", "adult")
        data.setdefault("role_title", "👑 Chef de Cuisine")
        data.setdefault("daily_water_target_ml", max(2000, int(float(data.get("weight_kg", 75)) * 35)))
    else:
        data.setdefault("age_group", "senior")
        data.setdefault("role_title", "🌟 Gourmet-Mentor")
        data.setdefault("daily_water_target_ml", 2000)

    data.setdefault("chore_points", 0)
    data.setdefault("water_intake_ml", 0)
    data.setdefault("badges", [])

    return FamilyMember(**data)


def scale_recipe_for_person(
    recipe: Recipe,
    member: FamilyMember,
    meal_type: str,
    active_retailers: Optional[List[str]] = None,
    primary_retailer: Optional[str] = None
) -> PersonMealPortion:
    """
    Scales recipe quantities and macros to meet the person's specific meal calorie target.
    Ensures ScaledIngredient.matched_retailer respects active_retailers and falls back to primary_retailer.
    """
    if active_retailers is None:
        try:
            from backend.settings_storage import get_app_settings
            settings = get_app_settings()
            active_retailers = settings.active_retailers
            if not primary_retailer:
                primary_retailer = settings.primary_retailer
        except Exception:
            active_retailers = None

    if not primary_retailer:
        try:
            from backend.settings_storage import get_app_settings
            primary_retailer = get_app_settings().primary_retailer
        except Exception:
            primary_retailer = "Netto"

    if active_retailers and primary_retailer not in active_retailers:
        primary_retailer = active_retailers[0]

    ratio = MEAL_RATIOS.get(meal_type, 0.33)
    target_meal_calories = member.target_calories * ratio

    if recipe.base_calories > 0:
        scale_factor = round(target_meal_calories / recipe.base_calories, 2)
        # Avoid extreme outliers
        scale_factor = max(0.4, min(2.5, scale_factor))
    else:
        scale_factor = 1.0

    active_set = set(active_retailers) if active_retailers is not None else None
    scaled_ingredients: List[ScaledIngredient] = []
    for ing in recipe.ingredients:
        raw_amt = ing.base_amount * scale_factor
        # Round gracefully: if >= 10, round to integer; if < 10, round to 1 decimal
        if raw_amt >= 10:
            final_amt = round(raw_amt)
        else:
            final_amt = round(raw_amt, 1)

        retailer = ing.matched_offer_retailer
        if retailer and retailer != "Vorratskammer":
            if active_set is not None and retailer not in active_set:
                retailer = primary_retailer
        elif not retailer:
            retailer = primary_retailer

        scaled_ingredients.append(
            ScaledIngredient(
                name=ing.name,
                amount=final_amt,
                unit=ing.unit,
                matched_retailer=retailer,
            )
        )

    return PersonMealPortion(
        member_id=member.id,
        member_name=member.name,
        meal_type=recipe.meal_type,
        recipe_id=recipe.id,
        recipe_title=recipe.title,
        scale_factor=scale_factor,
        scaled_calories=int(round(recipe.base_calories * scale_factor)),
        scaled_protein_g=int(round(recipe.base_protein_g * scale_factor)),
        scaled_carbs_g=int(round(recipe.base_carbs_g * scale_factor)),
        scaled_fat_g=int(round(recipe.base_fat_g * scale_factor)),
        scaled_ingredients=scaled_ingredients,
    )

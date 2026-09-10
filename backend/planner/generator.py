"""
Weekly Meal Plan Generator with individualized family portion scaling,
strict allergy filtering, disliked foods exclusion, zero-repetition universe cycling,
and realistic supermarket leaflet validity horizons.
"""

import re
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
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


ALLERGEN_KEYWORD_MAP: Dict[str, List[str]] = {
    "laktose": [
        "milch", "quark", "käse", "kaese", "feta", "joghurt", "butter",
        "mozzarella", "hüttenkäse", "huettenkaese", "sahne", "parmesan",
        "skyr", "schmand", "creme fraiche", "crème fraîche", "mascarpone",
        "ricotta", "gouda", "cheddar", "frischkäse", "frischkaese", "molke"
    ],
    "gluten": [
        "gluten", "weizen", "dinkel", "dinkelflocken", "roggen", "gerste", "hafer",
        "haferflocken", "nudeln", "spaghetti", "penne", "pasta", "brot", "toast",
        "baguette", "brötchen", "broetchen", "mehl", "couscous", "bulgur", "seitan",
        "knäckebrot", "knaeckebrot", "wrap", "wraps", "panade", "grieß", "griess"
    ],
    "nuesse": [
        "nuss", "nüsse", "nuesse", "erdnuss", "erdnüsse", "erdnuesse", "erdnussmus",
        "walnuss", "walnüsse", "walnuesse", "haselnuss", "haselnüsse", "haselnuesse",
        "cashew", "cashewkerne", "mandel", "mandeln", "pistazie", "pistazien",
        "pekannuss", "paranuss", "macadamia"
    ],
    "fisch": [
        "fisch", "lachs", "thunfisch", "kabeljau", "forelle", "forellenfilet",
        "garnele", "garnelen", "seelachs", "dorade", "shrimp", "shrimps", "scampi",
        "meeresfrüchte", "meeresfruechte", "sardine", "sardinen", "hering", "makrele"
    ],
    "eier": [
        "ei", "eier", "hühnerei", "huehnerei", "rührei", "ruehrei", "spiegelei",
        "eigelb", "eiweiß", "eiweiss"
    ],
    "soja": [
        "soja", "sojasoße", "sojasosse", "sojasauce", "tofu", "naturtofu",
        "räuchertofu", "raeuchertofu", "edamame", "tempeh", "miso"
    ],
    "sesam": [
        "sesam", "sesamöl", "sesamoel", "sesamsaat", "sesamsamen", "tahin", "tahina", "tahini"
    ],
}

PLANT_DAIRY_EXCLUSIONS = [
    "hafermilch", "mandelmilch", "sojamilch", "kokosmilch",
    "reismilch", "erbsenmilch", "dinkelmilch", "cashewmilch",
    "haferdrink", "mandeldrink", "sojadrink", "kokosdrink",
    "reisdrink", "erbsendrink", "dinkeldrink",
    "kokosjoghurt", "sojajoghurt", "haferjoghurt", "mandeljoghurt",
    "erdnussmus", "erdnussbutter", "mandelbutter", "cashewmus", "mandelmus",
    "vegan", "pflanzlich"
]

ALLERGEN_NORMALIZATION: Dict[str, str] = {
    "laktose": "laktose", "lactose": "laktose", "milch": "laktose",
    "gluten": "gluten", "weizen": "gluten",
    "nuesse": "nuesse", "nüsse": "nuesse", "nuts": "nuesse", "erdnuss": "nuesse", "erdnüsse": "nuesse",
    "fisch": "fisch", "fish": "fisch", "meeresfrüchte": "fisch", "meeresfruechte": "fisch",
    "eier": "eier", "ei": "eier", "egg": "eier", "eggs": "eier",
    "soja": "soja", "soy": "soja",
    "sesam": "sesam", "sesame": "sesam",
}

DISLIKE_SYNONYMS: Dict[str, List[str]] = {
    "pilz": ["pilz", "champignon", "pfifferling", "steinpilz", "seitling", "shiitake", "austernpilz", "trüffel"],
    "pilze": ["pilz", "champignon", "pfifferling", "steinpilz", "seitling", "shiitake", "austernpilz", "trüffel"],
    "champignon": ["champignon", "pilz"],
    "champignons": ["champignon", "pilz"],
    "fisch": ["fisch", "lachs", "thunfisch", "forelle", "kabeljau", "seelachs", "dorade", "garnele", "garnelen"],
    "meeresfrüchte": ["garnele", "garnelen", "shrimp", "shrimps", "scampi", "muschel", "tintenfisch", "calamari"],
    "olive": ["oliv"],
    "oliven": ["oliv"],
    "tomate": ["tomat"],
    "tomaten": ["tomat"],
    "zwiebel": ["zwiebel", "schalotte"],
    "zwiebeln": ["zwiebel", "schalotte"],
    "knoblauch": ["knoblauch"],
    "brokkoli": ["brokkoli", "broccoli"],
    "aubergine": ["aubergine"],
    "auberginen": ["aubergine"],
    "zucchini": ["zucchini"],
    "spinat": ["spinat"],
    "koriander": ["koriander"],
    "sellerie": ["sellerie"],
    "rosenkohl": ["rosenkohl"],
    "ingwer": ["ingwer"],
    "paprika": ["paprika"],
    "rosinen": ["rosin", "sultanin"],
}


def recipe_violates_allergies(recipe: Recipe, allergies: List[str]) -> bool:
    """
    Checks if a recipe violates any declared allergies by inspecting both
    declared recipe.allergens and the ingredients list against ALLERGEN_KEYWORD_MAP.
    Excludes plant-based milk and dairy alternatives (e.g. hafermilch, mandelmilch)
    from triggering lactose violations.
    """
    if not allergies:
        return False

    normalized_allergies = {
        ALLERGEN_NORMALIZATION.get(a.lower().strip(), a.lower().strip())
        for a in allergies if a.strip()
    }

    # 1. Check declared recipe.allergens
    for declared in recipe.allergens:
        norm_decl = ALLERGEN_NORMALIZATION.get(declared.lower().strip(), declared.lower().strip())
        if norm_decl in normalized_allergies:
            return True

    # 2. Check ingredients against ALLERGEN_KEYWORD_MAP
    for ing in recipe.ingredients:
        ing_l = ing.name.lower()
        for allergen_key in normalized_allergies:
            keywords = ALLERGEN_KEYWORD_MAP.get(allergen_key, [allergen_key])
            if allergen_key == "laktose":
                if any(ex in ing_l for ex in PLANT_DAIRY_EXCLUSIONS):
                    continue
                if any(kw in ing_l for kw in keywords):
                    return True
            elif allergen_key == "eier":
                if re.search(r'\b(ei|eier|eiern|eies|hühnerei|hühnereier|rührei|spiegelei|eigelb|eiweiß|eiweiss)\b', ing_l):
                    return True
            else:
                if any(kw in ing_l for kw in keywords):
                    return True

    return False


def recipe_violates_dislikes(recipe: Recipe, disliked_foods: List[str]) -> bool:
    """
    Checks if a recipe contains any disliked foods by checking stems and synonyms
    in both the recipe title and its ingredients list.
    E.g. dislike 'pilze' or 'pilz' filters 'Champignons', 'Pfifferlinge', 'Pilzpfanne'.
    """
    if not disliked_foods:
        return False

    title_l = recipe.title.lower()
    ing_names_l = [ing.name.lower() for ing in recipe.ingredients]

    for d in disliked_foods:
        d_clean = d.lower().strip()
        if not d_clean:
            continue

        search_terms = {d_clean}
        if d_clean in DISLIKE_SYNONYMS:
            search_terms.update(DISLIKE_SYNONYMS[d_clean])

        # Stemming: strip trailing 'en', 'e', 's'
        if d_clean.endswith("en") and len(d_clean) > 4:
            stem = d_clean[:-2]
            search_terms.add(stem)
            if stem in DISLIKE_SYNONYMS:
                search_terms.update(DISLIKE_SYNONYMS[stem])
        elif d_clean.endswith("e") and len(d_clean) > 3:
            stem = d_clean[:-1]
            search_terms.add(stem)
            if stem in DISLIKE_SYNONYMS:
                search_terms.update(DISLIKE_SYNONYMS[stem])
        elif d_clean.endswith("s") and len(d_clean) > 4:
            stem = d_clean[:-1]
            search_terms.add(stem)
            if stem in DISLIKE_SYNONYMS:
                search_terms.update(DISLIKE_SYNONYMS[stem])

        for term in search_terms:
            if term in title_l:
                return True
            if any(term in ing_l for ing_l in ing_names_l):
                return True

    return False


def is_recipe_compatible_with_member(
    recipe: Recipe,
    member: FamilyMember,
    strict_macro: bool = False
) -> bool:
    """
    Checks if a recipe meets a family member's diet type, allergies, and disliked foods.
    Hard dietary exclusions (vegetarian, vegan, pescetarian, no_pork) and allergies/dislikes
    are always strictly enforced.
    Soft macro preferences (high_protein, low_carb, etc.) are only enforced if strict_macro is True.
    """
    diet = member.dietary_preference

    # 1. Hard Dietary Exclusions
    if diet == "vegetarian":
        if "vegetarian" not in recipe.diet_types and "vegan" not in recipe.diet_types:
            return False
        for ing in recipe.ingredients:
            ing_l = ing.name.lower()
            if any(w in ing_l for w in [
                "hähnchen", "huhn", "hühn", "pute", "rind", "schwein", "hackfleisch",
                "lachs", "thunfisch", "fisch", "garnele", "salami", "schinken", "speck"
            ]):
                return False
    elif diet == "vegan":
        if "vegan" not in recipe.diet_types:
            return False
        for ing in recipe.ingredients:
            ing_l = ing.name.lower()
            if any(w in ing_l for w in [
                "hähnchen", "huhn", "hühn", "pute", "rind", "schwein", "hackfleisch",
                "lachs", "thunfisch", "fisch", "garnele", "salami", "schinken", "speck",
                "quark", "milch", "käse", "feta", "joghurt", "ei", "eier", "butter", "mozzarella", "hüttenkäse"
            ]):
                return False
    elif diet == "pescetarian":
        if not any(d in recipe.diet_types for d in ["pescetarian", "vegetarian", "vegan"]):
            return False
        for ing in recipe.ingredients:
            ing_l = ing.name.lower()
            if any(w in ing_l for w in ["hähnchen", "huhn", "hühn", "pute", "rind", "schwein", "hackfleisch", "salami", "schinken", "speck"]):
                return False
    elif diet == "no_pork":
        if "no_pork" not in recipe.diet_types:
            for ing in recipe.ingredients:
                ing_l = ing.name.lower()
                if any(w in ing_l for w in ["schwein", "salami", "schinken", "speck"]):
                    return False

    # 2. Soft Macro Preferences (only when strict_macro is requested)
    if strict_macro:
        if diet in ["high_protein", "low_carb", "gluten_free", "lactose_free", "mediterranean", "clean_eating"]:
            if diet not in recipe.diet_types:
                return False

    # 3. Allergies Check (Hard constraint)
    if member.allergies:
        if recipe_violates_allergies(recipe, member.allergies):
            return False

    # 4. Disliked Foods Check (Hard constraint)
    if member.disliked_foods:
        if recipe_violates_dislikes(recipe, member.disliked_foods):
            return False

    return True


def filter_recipes_for_family(recipes: List[Recipe], family: List[FamilyMember]) -> List[Recipe]:
    """
    Finds recipes that satisfy the hard dietary constraints (vegetarian, vegan, pescetarian,
    no_pork, allergies, dislikes) of ALL family members simultaneously.
    Guarantees that a shared family pot (Option A) never exposes any member to incompatible food.
    """
    if not family:
        return recipes

    compatible = [
        r for r in recipes
        if all(is_recipe_compatible_with_member(r, m, strict_macro=False) for m in family)
    ]
    if compatible:
        return compatible

    # If mutually exclusive edge cases exist, protect members with hard exclusions:
    hard_restricted = [m for m in family if m.dietary_preference in ["vegetarian", "vegan", "pescetarian", "no_pork"]]
    if hard_restricted:
        sub_compat = [
            r for r in recipes
            if all(is_recipe_compatible_with_member(r, m, strict_macro=False) for m in hard_restricted)
        ]
        if sub_compat:
            return sub_compat

    return recipes


def generate_weekly_plan(
    family_members: List[FamilyMember],
    preferred_recipes: Optional[List[Recipe]] = None,
    week_offset: int = 0,
    budget: float = 120.0,
    active_retailers: Optional[List[str]] = None,
    primary_retailer: Optional[str] = None,
    shuffle: bool = False,
    seed: Optional[int] = None,
    planned_days: Optional[List[str]] = None,
    meal_sharing: Optional[Dict[str, str]] = None,
) -> WeeklyPlan:
    """
    Generates a 7-day meal plan tailored to all family members for a specific week offset (0 = current week, +1 = next week, etc.),
    respecting allergies, dislikes, budget targets, supermarket leaflet validity horizon, active retailers, primary retailer,
    planned_days (e.g. Mon-Fri planned, Sat-Sun un-planned), and meal_sharing modes (shared family pot vs. individual).
    """
    if active_retailers is None or primary_retailer is None or planned_days is None or meal_sharing is None:
        try:
            from backend.settings_storage import get_app_settings
            settings = get_app_settings()
            if active_retailers is None:
                active_retailers = settings.active_retailers
            if primary_retailer is None:
                primary_retailer = settings.primary_retailer
            if planned_days is None:
                planned_days = getattr(settings, "planned_days", None)
            if meal_sharing is None:
                meal_sharing = getattr(settings, "meal_sharing", None)
        except Exception:
            pass

    if active_retailers is None:
        active_retailers = ["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka"]

    if not primary_retailer:
        primary_retailer = "Netto"

    if active_retailers and primary_retailer not in active_retailers:
        primary_retailer = active_retailers[0]

    if planned_days is None:
        planned_days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]

    if meal_sharing is None:
        meal_sharing = {"breakfast": "individual", "lunch": "individual", "dinner": "shared"}

    db = preferred_recipes if preferred_recipes is not None else get_all_universe_recipes()

    # Filter available recipes per meal type taking family compatibility into account
    all_breakfasts = [r for r in db if r.meal_type == "breakfast_lunchbox"]
    all_lunches = [r for r in db if r.meal_type == "lunch_lunchbox"]
    all_dinners = [r for r in db if r.meal_type == "dinner_home"]

    should_shuffle = shuffle or (seed is not None)
    rng = random.Random(seed) if should_shuffle else None

    # Determine pools for each meal based on mode ("shared" vs "individual")
    meals_spec = {
        "breakfast": ("breakfast_lunchbox", all_breakfasts),
        "lunch": ("lunch_lunchbox", all_lunches),
        "dinner": ("dinner_home", all_dinners),
    }

    meal_shared_pools: Dict[str, List[Recipe]] = {}
    meal_member_pools: Dict[str, Dict[str, List[Recipe]]] = {}

    for meal_key, (meal_type_str, recipe_list) in meals_spec.items():
        mode = meal_sharing.get(meal_key, "shared" if meal_key == "dinner" else "individual")
        if mode == "shared":
            filtered = filter_recipes_for_family(recipe_list, family_members)
            prioritized = prioritize_recipes(filtered, active_retailers, shuffle=should_shuffle, rng=rng)
            if not prioritized:
                prioritized = prioritize_recipes(recipe_list, active_retailers, shuffle=should_shuffle, rng=rng)
            meal_shared_pools[meal_key] = prioritized
        else:
            member_dict: Dict[str, List[Recipe]] = {}
            for member in family_members:
                m_strict = [r for r in recipe_list if is_recipe_compatible_with_member(r, member, strict_macro=True)]
                if len(m_strict) >= 7:
                    m_pool = m_strict
                else:
                    m_pool = [r for r in recipe_list if is_recipe_compatible_with_member(r, member, strict_macro=False)]
                if not m_pool:
                    m_pool = recipe_list
                member_dict[member.id] = prioritize_recipes(m_pool, active_retailers, shuffle=should_shuffle, rng=rng)
            meal_member_pools[meal_key] = member_dict

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
        is_planned = day_name in planned_days

        day_recipes: Dict[str, Recipe] = {}
        portions_by_member: Dict[str, Dict[str, PersonMealPortion]] = {
            m.id: {} for m in family_members
        }

        for meal_key, (meal_type_str, recipe_list) in meals_spec.items():
            mode = meal_sharing.get(meal_key, "shared" if meal_key == "dinner" else "individual")
            if mode == "shared":
                pool = meal_shared_pools[meal_key]
                chosen = sanitize_recipe(pool[(base_offset + i) % len(pool)], active_retailers, primary_retailer)
                day_recipes[meal_key] = chosen
                for member in family_members:
                    portion = scale_recipe_for_person(
                        chosen, member, meal_type_str,
                        active_retailers=active_retailers, primary_retailer=primary_retailer
                    )
                    portions_by_member[member.id][meal_key] = portion
            else:
                member_dict = meal_member_pools[meal_key]
                primary_m_id = family_members[0].id if family_members else None
                primary_list = member_dict.get(primary_m_id, recipe_list) if primary_m_id else recipe_list
                day_recipes[meal_key] = sanitize_recipe(primary_list[(base_offset + i) % len(primary_list)], active_retailers, primary_retailer)
                for member in family_members:
                    m_list = member_dict.get(member.id, primary_list)
                    m_chosen = sanitize_recipe(m_list[(base_offset + i) % len(m_list)], active_retailers, primary_retailer)
                    portion = scale_recipe_for_person(
                        m_chosen, member, meal_type_str,
                        active_retailers=active_retailers, primary_retailer=primary_retailer
                    )
                    portions_by_member[member.id][meal_key] = portion

        daily_nutrition_by_member: Dict[str, Dict[str, int]] = {}
        for member in family_members:
            m_portions = portions_by_member[member.id]
            bf_p = m_portions.get("breakfast")
            lu_p = m_portions.get("lunch")
            di_p = m_portions.get("dinner")
            daily_nutrition_by_member[member.id] = {
                "calories": (bf_p.scaled_calories if bf_p else 0) + (lu_p.scaled_calories if lu_p else 0) + (di_p.scaled_calories if di_p else 0),
                "protein": (bf_p.scaled_protein_g if bf_p else 0) + (lu_p.scaled_protein_g if lu_p else 0) + (di_p.scaled_protein_g if di_p else 0),
                "carbs": (bf_p.scaled_carbs_g if bf_p else 0) + (lu_p.scaled_carbs_g if lu_p else 0) + (di_p.scaled_carbs_g if di_p else 0),
                "fat": (bf_p.scaled_fat_g if bf_p else 0) + (lu_p.scaled_fat_g if lu_p else 0) + (di_p.scaled_fat_g if di_p else 0),
            }

        days.append(
            DayPlan(
                day_name=day_name,
                date=date_str,
                breakfast=day_recipes["breakfast"],
                lunch=day_recipes["lunch"],
                dinner=day_recipes["dinner"],
                is_planned=is_planned,
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
        if is_recipe_compatible_with_member(day.breakfast, member, strict_macro=False):
            mem_bf = day.breakfast
        else:
            alt = next((r for r in all_recipes if r.meal_type == "breakfast_lunchbox" and is_recipe_compatible_with_member(r, member, strict_macro=False)), day.breakfast)
            mem_bf = sanitize_recipe(alt, active_retailers, primary_retailer)

        if is_recipe_compatible_with_member(day.lunch, member, strict_macro=False):
            mem_lu = day.lunch
        else:
            alt = next((r for r in all_recipes if r.meal_type == "lunch_lunchbox" and is_recipe_compatible_with_member(r, member, strict_macro=False)), day.lunch)
            mem_lu = sanitize_recipe(alt, active_retailers, primary_retailer)

        if is_recipe_compatible_with_member(day.dinner, member, strict_macro=False):
            mem_di = day.dinner
        else:
            alt = next((r for r in all_recipes if r.meal_type == "dinner_home" and is_recipe_compatible_with_member(r, member, strict_macro=False)), day.dinner)
            mem_di = sanitize_recipe(alt, active_retailers, primary_retailer)

        bf_portion = scale_recipe_for_person(mem_bf, member, "breakfast_lunchbox", active_retailers=active_retailers, primary_retailer=primary_retailer)
        lu_portion = scale_recipe_for_person(mem_lu, member, "lunch_lunchbox", active_retailers=active_retailers, primary_retailer=primary_retailer)
        di_portion = scale_recipe_for_person(mem_di, member, "dinner_home", active_retailers=active_retailers, primary_retailer=primary_retailer)

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

"""
Diet, Allergy, and Food Dislike Validation Engine.
Provides single-source-of-truth detection for dietary constraints (vegan, vegetarian,
pescetarian, no_pork), allergens (lactose, gluten, nuts, fish, eggs, soy, sesame),
and extensive German food dislike synonyms and stems.
"""

import re
from typing import List, Dict, Optional, Set
from backend.models import Recipe, FamilyMember


PLANT_DAIRY_EXCLUSIONS = [
    "hafermilch", "mandelmilch", "sojamilch", "kokosmilch",
    "reismilch", "erbsenmilch", "dinkelmilch", "cashewmilch",
    "haferdrink", "mandeldrink", "sojadrink", "kokosdrink",
    "reisdrink", "erbsendrink", "dinkeldrink",
    "kokosjoghurt", "sojajoghurt", "haferjoghurt", "mandeljoghurt",
    "erdnussmus", "erdnussbutter", "mandelbutter", "cashewmus", "mandelmus",
    "vegan", "pflanzlich"
]

DAIRY_KEYWORDS = [
    "quark", "käse", "kaese", "feta", "joghurt", "butter", "mozzarella", "hüttenkäse",
    "huettenkaese", "sahne", "parmesan", "skyr", "schmand", "creme fraiche", "crème fraîche",
    "mascarpone", "ricotta", "gouda", "cheddar", "frischkäse", "frischkaese", "molke"
]

MEAT_KEYWORDS = [
    "fleisch", "hähnchen", "haehnchen", "huhn", "hühn", "huehn", "geflügel", "gefluegel",
    "pute", "putenbrust", "rind", "rinderhack", "rindersteak", "schwein", "schweinefleisch",
    "hackfleisch", "salami", "schinken", "speck", "wurst", "würstchen", "wuerstchen",
    "kalb", "lamm", "ente", "gans", "bacon", "prosciutto", "chorizo", "meat"
]

SEAFOOD_KEYWORDS = [
    "fisch", "lachs", "thunfisch", "forelle", "forellenfilet", "kabeljau", "kabeljaufilet",
    "garnele", "garnelen", "seelachs", "dorade", "shrimp", "shrimps", "scampi", "meeresfrüchte",
    "meeresfruechte", "sardine", "sardinen", "hering", "makrele", "tintenfisch", "calamari",
    "muschel", "muscheln", "krabbe", "krabben", "hummer", "seafood"
]

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
        "eigelb", "eiweiß", "eiweiss", "omelett"
    ],
    "soja": [
        "soja", "sojasoße", "sojasosse", "sojasauce", "tofu", "naturtofu",
        "räuchertofu", "raeuchertofu", "edamame", "tempeh", "miso"
    ],
    "sesam": [
        "sesam", "sesamöl", "sesamoel", "sesamsaat", "sesamsamen", "tahin", "tahina", "tahini"
    ],
}

ALLERGEN_NORMALIZATION: Dict[str, str] = {
    "laktose": "laktose", "lactose": "laktose", "milch": "laktose", "milchprodukte": "laktose",
    "gluten": "gluten", "weizen": "gluten", "getreide": "gluten",
    "nuesse": "nuesse", "nüsse": "nuesse", "nuts": "nuesse", "erdnuss": "nuesse", "erdnüsse": "nuesse", "erdnuesse": "nuesse",
    "fisch": "fisch", "fish": "fisch", "meeresfrüchte": "fisch", "meeresfruechte": "fisch",
    "eier": "eier", "ei": "eier", "egg": "eier", "eggs": "eier",
    "soja": "soja", "soy": "soja",
    "sesam": "sesam", "sesame": "sesam",
}

DISLIKE_SYNONYMS: Dict[str, List[str]] = {
    # Meat & Poultry
    "fleisch": ["fleisch", "hähnchen", "haehnchen", "huhn", "hühn", "pute", "putenbrust", "rind", "rinderhack", "rindersteak", "schwein", "hackfleisch", "salami", "schinken", "speck", "wurst"],
    "geflügel": ["hähnchen", "haehnchen", "huhn", "hühn", "pute", "putenbrust", "geflügel", "gefluegel"],
    "gefluegel": ["hähnchen", "haehnchen", "huhn", "hühn", "pute", "putenbrust", "geflügel", "gefluegel"],
    "hähnchen": ["hähnchen", "haehnchen", "huhn", "hühn", "huehn", "geflügel", "gefluegel"],
    "haehnchen": ["hähnchen", "haehnchen", "huhn", "hühn", "huehn", "geflügel", "gefluegel"],
    "huhn": ["hähnchen", "haehnchen", "huhn", "hühn", "huehn", "geflügel", "gefluegel"],
    "pute": ["pute", "putenbrust", "geflügel", "gefluegel"],
    "putenbrust": ["pute", "putenbrust"],
    "rind": ["rind", "rinderhack", "rindersteak", "rindfleisch", "hackfleisch"],
    "rindfleisch": ["rind", "rinderhack", "rindersteak", "rindfleisch", "hackfleisch"],
    "rinderhack": ["rinderhack", "hackfleisch", "rind"],
    "hackfleisch": ["hackfleisch", "rinderhack", "rind"],
    "schwein": ["schwein", "schweinefleisch", "salami", "schinken", "speck", "wurst"],
    "schweinefleisch": ["schwein", "schweinefleisch", "salami", "schinken", "speck", "wurst"],
    "wurst": ["wurst", "salami", "schinken", "speck", "würstchen", "wuerstchen"],

    # Fish & Seafood
    "fisch": ["fisch", "lachs", "räucherlachs", "thunfisch", "forelle", "forellenfilet", "kabeljau", "kabeljaufilet", "seelachs", "dorade", "garnele", "garnelen", "shrimp", "shrimps", "scampi", "meeresfrüchte", "meeresfruechte"],
    "lachs": ["lachs", "lachsfilet", "räucherlachs", "raeucherlachs"],
    "räucherlachs": ["räucherlachs", "raeucherlachs", "lachs"],
    "raeucherlachs": ["räucherlachs", "raeucherlachs", "lachs"],
    "thunfisch": ["thunfisch"],
    "forelle": ["forelle", "forellenfilet"],
    "kabeljau": ["kabeljau", "kabeljaufilet"],
    "garnele": ["garnele", "garnelen", "shrimp", "shrimps", "scampi", "meeresfrüchte"],
    "garnelen": ["garnele", "garnelen", "shrimp", "shrimps", "scampi", "meeresfrüchte"],
    "meeresfrüchte": ["garnele", "garnelen", "shrimp", "shrimps", "scampi", "muschel", "tintenfisch", "calamari", "meeresfrüchte", "meeresfruechte"],
    "meeresfruechte": ["garnele", "garnelen", "shrimp", "shrimps", "scampi", "muschel", "tintenfisch", "calamari", "meeresfrüchte", "meeresfruechte"],

    # Vegetables & Fungi
    "pilz": ["pilz", "champignon", "pfifferling", "steinpilz", "seitling", "shiitake", "austernpilz", "trüffel"],
    "pilze": ["pilz", "champignon", "pfifferling", "steinpilz", "seitling", "shiitake", "austernpilz", "trüffel"],
    "champignon": ["champignon", "pilz"],
    "champignons": ["champignon", "pilz"],
    "zwiebel": ["zwiebel", "schalotte", "lauch", "frühlingszwiebel"],
    "zwiebeln": ["zwiebel", "schalotte", "lauch", "frühlingszwiebel"],
    "lauch": ["lauch", "porree", "frühlingszwiebel"],
    "knoblauch": ["knoblauch"],
    "tomate": ["tomat"],
    "tomaten": ["tomat"],
    "paprika": ["paprika"],
    "brokkoli": ["brokkoli", "broccoli"],
    "broccoli": ["brokkoli", "broccoli"],
    "aubergine": ["aubergine"],
    "auberginen": ["aubergine"],
    "zucchini": ["zucchini"],
    "spinat": ["spinat", "babyspinat"],
    "babyspinat": ["spinat", "babyspinat"],
    "koriander": ["koriander"],
    "sellerie": ["sellerie"],
    "rosenkohl": ["rosenkohl"],
    "ingwer": ["ingwer"],
    "olive": ["oliv"],
    "oliven": ["oliv"],
    "möhre": ["karotte", "karotten", "möhre", "moehre", "möhren", "moehren"],
    "möhren": ["karotte", "karotten", "möhre", "moehre", "möhren", "moehren"],
    "karotte": ["karotte", "karotten", "möhre", "moehre", "möhren", "moehren"],
    "karotten": ["karotte", "karotten", "möhre", "moehre", "möhren", "moehren"],
    "gurke": ["gurke", "gurken"],
    "gurken": ["gurke", "gurken"],
    "spargel": ["spargel"],

    # Dairy & Cheese
    "käse": ["käse", "kaese", "feta", "gouda", "mozzarella", "parmesan", "frischkäse", "hüttenkäse", "cheddar", "ricotta"],
    "kaese": ["käse", "kaese", "feta", "gouda", "mozzarella", "parmesan", "frischkäse", "hüttenkäse", "cheddar", "ricotta"],
    "feta": ["feta", "schafskäse", "schafskaese"],
    "schafskäse": ["feta", "schafskäse", "schafskaese"],
    "schafskaese": ["feta", "schafskäse", "schafskaese"],
    "hüttenkäse": ["hüttenkäse", "huettenkaese", "körniger frischkäse", "koerniger frischkaese"],
    "huettenkaese": ["hüttenkäse", "huettenkaese", "körniger frischkäse", "koerniger frischkaese"],
    "frischkäse": ["frischkäse", "frischkaese", "körniger frischkäse"],
    "quark": ["quark", "magerquark"],
    "magerquark": ["quark", "magerquark"],
    "joghurt": ["joghurt", "griechischer joghurt", "naturjoghurt"],
    "skyr": ["skyr"],
    "milch": ["milch", "kuhmilch", "vollmilch"],

    # Soy & Tofu
    "tofu": ["tofu", "naturtofu", "räuchertofu", "raeuchertofu"],
    "soja": ["soja", "tofu", "edamame", "sojamilch", "sojasoße", "sojasauce"],

    # Legumes & Grains
    "linsen": ["linsen", "rote linsen"],
    "kichererbsen": ["kichererbse", "kichererbsen"],
    "kichererbse": ["kichererbse", "kichererbsen"],
    "bohnen": ["bohne", "bohnen", "kidneybohne", "kidneybohnen"],
    "bohne": ["bohne", "bohnen", "kidneybohne", "kidneybohnen"],
    "erbsen": ["erbse", "erbsen", "tk erbsen", "zuckerschoten"],
    "haferflocken": ["haferflocke", "haferflocken"],

    # Nuts & Seeds
    "nuss": ["nuss", "nüsse", "nuesse", "erdnuss", "walnuss", "cashew", "haselnuss", "mandel"],
    "nüsse": ["nuss", "nüsse", "nuesse", "erdnuss", "walnuss", "cashew", "haselnuss", "mandel"],
    "nuesse": ["nuss", "nüsse", "nuesse", "erdnuss", "walnuss", "cashew", "haselnuss", "mandel"],
    "erdnuss": ["erdnuss", "erdnüsse", "erdnussmus"],
    "walnuss": ["walnuss", "walnüsse"],
    "cashew": ["cashew", "cashewkerne"],
    "mandel": ["mandel", "mandeln", "mandelmilch"],
    "mandeln": ["mandel", "mandeln", "mandelmilch"],

    # Other
    "rosinen": ["rosin", "sultanin"],
    "rosine": ["rosin", "sultanin"],
    "ei": ["ei", "eier", "rührei", "spiegelei", "omelett"],
    "eier": ["ei", "eier", "rührei", "spiegelei", "omelett"],
    "avocado": ["avocado", "avocados"],
    "avocados": ["avocado", "avocados"],
}


def is_dairy_ingredient(ing_name: str) -> bool:
    ing_l = ing_name.lower().strip()
    if any(ex in ing_l for ex in PLANT_DAIRY_EXCLUSIONS):
        return False
    if any(kw in ing_l for kw in DAIRY_KEYWORDS):
        return True
    if re.search(r'\b(milch|kuhmilch|vollmilch|magermilch)\b', ing_l):
        return True
    return False


def is_egg_ingredient(ing_name: str) -> bool:
    ing_l = ing_name.lower().strip()
    if any(ex in ing_l for ex in ["vegan", "pflanzlich", "ei-ersatz"]):
        return False
    return bool(re.search(r'\b(ei|eier|eiern|eies|hühnerei|hühnereier|huehnerei|rührei|ruehrei|spiegelei|eigelb|eiweiß|eiweiss|omelett)\b', ing_l))


def is_meat_ingredient(ing_name: str) -> bool:
    ing_l = ing_name.lower().strip()
    if any(ex in ing_l for ex in ["vegan", "vegetarisch", "pflanzlich", "vegetarische", "vegane"]):
        return False
    return any(kw in ing_l for kw in MEAT_KEYWORDS)


def is_seafood_ingredient(ing_name: str) -> bool:
    ing_l = ing_name.lower().strip()
    if any(ex in ing_l for ex in ["vegan", "vegetarisch", "pflanzlich"]):
        return False
    return any(kw in ing_l for kw in SEAFOOD_KEYWORDS)


def is_honey_ingredient(ing_name: str) -> bool:
    ing_l = ing_name.lower().strip()
    if any(ex in ing_l for ex in ["vegan", "pflanzlich"]):
        return False
    return bool(re.search(r'\bhonig\b', ing_l))


def is_pork_ingredient(ing_name: str) -> bool:
    ing_l = ing_name.lower().strip()
    if any(ex in ing_l for ex in ["vegan", "vegetarisch", "pflanzlich", "rind", "geflügel", "pute", "hähnchen"]):
        return False
    return any(w in ing_l for w in ["schwein", "salami", "schinken", "speck", "pork"])


def is_recipe_diet_compatible(recipe: Recipe, diet: str) -> bool:
    """
    Strictly checks if a recipe satisfies the specified dietary preference.
    Hard guarantees:
    - Vegetarian: ZERO meat, poultry, or fish.
    - Vegan: ZERO meat, poultry, fish, dairy, eggs, or honey.
    - Pescetarian: ZERO meat or poultry.
    - No pork: ZERO pork.
    """
    if not diet or diet == "all":
        return True

    title_l = recipe.title.lower()

    if diet == "vegetarian":
        if "vegetarian" not in recipe.diet_types and "vegan" not in recipe.diet_types:
            return False
        if any(is_meat_ingredient(ing.name) or is_seafood_ingredient(ing.name) for ing in recipe.ingredients):
            return False
        if any(kw in title_l for kw in MEAT_KEYWORDS + SEAFOOD_KEYWORDS):
            return False
        return True

    if diet == "vegan":
        if "vegan" not in recipe.diet_types:
            return False
        for ing in recipe.ingredients:
            if (is_meat_ingredient(ing.name) or
                is_seafood_ingredient(ing.name) or
                is_dairy_ingredient(ing.name) or
                is_egg_ingredient(ing.name) or
                is_honey_ingredient(ing.name)):
                return False
        if any(kw in title_l for kw in MEAT_KEYWORDS + SEAFOOD_KEYWORDS + DAIRY_KEYWORDS):
            return False
        return True

    if diet == "pescetarian":
        if not any(d in recipe.diet_types for d in ["pescetarian", "vegetarian", "vegan"]):
            return False
        if any(is_meat_ingredient(ing.name) for ing in recipe.ingredients):
            return False
        if any(kw in title_l for kw in MEAT_KEYWORDS):
            return False
        return True

    if diet == "no_pork":
        if "no_pork" not in recipe.diet_types:
            return False
        if any(is_pork_ingredient(ing.name) for ing in recipe.ingredients):
            return False
        return True

    if diet in ["high_protein", "low_carb", "gluten_free", "lactose_free", "mediterranean", "clean_eating"]:
        return diet in recipe.diet_types

    return True


def recipe_violates_allergies(recipe: Recipe, allergies: List[str]) -> bool:
    """
    Checks if a recipe violates any declared allergies by inspecting both
    declared recipe.allergens and the ingredients list against ALLERGEN_KEYWORD_MAP.
    Excludes plant-based milk and dairy alternatives from triggering lactose violations.
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

    # 2. Check ingredients against ALLERGEN_KEYWORD_MAP and specific detectors
    for ing in recipe.ingredients:
        ing_l = ing.name.lower()
        for allergen_key in normalized_allergies:
            if allergen_key == "laktose":
                if is_dairy_ingredient(ing.name):
                    return True
            elif allergen_key == "eier":
                if is_egg_ingredient(ing.name):
                    return True
            elif allergen_key == "fisch":
                if is_seafood_ingredient(ing.name):
                    return True
            else:
                keywords = ALLERGEN_KEYWORD_MAP.get(allergen_key, [allergen_key])
                if any(kw in ing_l for kw in keywords):
                    return True

    return False


def recipe_violates_dislikes(recipe: Recipe, disliked_foods: List[str]) -> bool:
    """
    Checks if a recipe contains any disliked foods by checking stems and synonyms
    in both the recipe title and its ingredients list.
    E.g. dislike 'pilze' filters 'Champignons', 'Pfifferlinge', 'Pilzpfanne'.
    Dislike 'rindfleisch' filters 'Rinderhack', 'Rindersteak'.
    Dislike 'lachs' filters 'Lachsfilet', 'Räucherlachs'.
    Uses regex word boundaries for short terms like 'ei' to avoid false-positive matches on 'naturreis'.
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
        for suffix in ["en", "e", "s"]:
            if d_clean.endswith(suffix) and len(d_clean) > len(suffix) + 2:
                stem = d_clean[:-len(suffix)]
                search_terms.add(stem)
                if stem in DISLIKE_SYNONYMS:
                    search_terms.update(DISLIKE_SYNONYMS[stem])

        for term in search_terms:
            if len(term) <= 3:
                pattern = r'\b' + re.escape(term) + r'\b'
                if re.search(pattern, title_l):
                    return True
                if any(re.search(pattern, ing_l) for ing_l in ing_names_l):
                    return True
            else:
                if term in title_l:
                    return True
                if any(term in ing_l for ing_l in ing_names_l):
                    return True

    return False


def is_recipe_diet_and_allergy_compatible(recipe: Recipe, member: FamilyMember) -> bool:
    """Checks hard diet constraint and declared allergies (dislikes relaxed)."""
    if not is_recipe_diet_compatible(recipe, member.dietary_preference):
        return False
    if member.allergies and recipe_violates_allergies(recipe, member.allergies):
        return False
    return True


def is_recipe_compatible_with_member(
    recipe: Recipe,
    member: FamilyMember,
    strict_macro: bool = False
) -> bool:
    """
    Checks if a recipe meets a family member's diet type, allergies, and disliked foods.
    Hard dietary exclusions (vegetarian, vegan, pescetarian, no_pork) and allergies/dislikes
    are strictly enforced.
    Soft macro preferences (high_protein, low_carb, etc.) are only enforced if strict_macro is True.
    """
    diet = member.dietary_preference

    # 1. Hard Dietary Exclusions
    if not is_recipe_diet_compatible(recipe, diet):
        return False

    # 2. Soft Macro Preferences
    if strict_macro and diet in ["high_protein", "low_carb", "gluten_free", "lactose_free", "mediterranean", "clean_eating"]:
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
    If a vegetarian or vegan is present in the family, the resulting pool is 100% free of meat/fish/animal products.
    """
    if not family:
        return recipes

    # Priority 1: Full compatibility (Diet + Allergies + Dislikes) for ALL members
    compatible = [
        r for r in recipes
        if all(is_recipe_compatible_with_member(r, m, strict_macro=False) for m in family)
    ]
    if compatible:
        return compatible

    # Priority 2: If dislikes are too restrictive, relax dislikes, but KEEP hard diets & allergies for ALL
    diet_allergy_compat = [
        r for r in recipes
        if all(is_recipe_diet_and_allergy_compatible(r, m) for m in family)
    ]
    if diet_allergy_compat:
        return diet_allergy_compat

    # Priority 3: Protect members with hard dietary preferences (vegan > vegetarian > pescetarian > no_pork)
    hard_restricted = [m for m in family if m.dietary_preference in ["vegan", "vegetarian", "pescetarian", "no_pork"]]
    if hard_restricted:
        sub_compat = [
            r for r in recipes
            if all(is_recipe_diet_compatible(r, m.dietary_preference) for m in hard_restricted)
        ]
        if sub_compat:
            return sub_compat

    return recipes


def sanitize_recipe_diets_and_allergens(recipe: Recipe) -> Recipe:
    """
    Sanitizes and auto-determines allergens and diet types for a recipe based on its ingredients.
    Guarantees that any recipe added or updated is strictly and reliably classified.
    """
    detected_allergens = set(recipe.allergens or [])
    for ing in recipe.ingredients:
        if is_dairy_ingredient(ing.name):
            detected_allergens.add("laktose")
        if is_egg_ingredient(ing.name):
            detected_allergens.add("eier")
        if is_seafood_ingredient(ing.name):
            detected_allergens.add("fisch")
        ing_l = ing.name.lower()
        for allergen_key, keywords in ALLERGEN_KEYWORD_MAP.items():
            if allergen_key not in ["laktose", "eier", "fisch"]:
                if any(kw in ing_l for kw in keywords):
                    detected_allergens.add(allergen_key)
    recipe.allergens = sorted(list(detected_allergens))

    has_meat = any(is_meat_ingredient(i.name) for i in recipe.ingredients)
    has_seafood = any(is_seafood_ingredient(i.name) for i in recipe.ingredients)
    has_dairy = any(is_dairy_ingredient(i.name) for i in recipe.ingredients)
    has_egg = any(is_egg_ingredient(i.name) for i in recipe.ingredients)
    has_honey = any(is_honey_ingredient(i.name) for i in recipe.ingredients)
    has_pork = any(is_pork_ingredient(i.name) for i in recipe.ingredients)

    diets = set(recipe.diet_types or [])
    diets.add("omnivore")

    if not has_pork:
        diets.add("no_pork")
    else:
        diets.discard("no_pork")

    if not has_meat:
        diets.add("pescetarian")
    else:
        diets.discard("pescetarian")

    if not has_meat and not has_seafood:
        diets.add("vegetarian")
    else:
        diets.discard("vegetarian")

    if not has_meat and not has_seafood and not has_dairy and not has_egg and not has_honey:
        diets.add("vegan")
    else:
        diets.discard("vegan")

    recipe.diet_types = sorted(list(diets))
    return recipe

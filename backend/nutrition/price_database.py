"""
Realistische Preisdatenbank für deutsche Supermärkte (Netto, NP, Lidl, Aldi, Rewe, Kaufland, Edeka).
Preise basieren auf Durchschnittswerten 2024/2025 für Deutschland.
"""

from typing import Dict, Optional, Tuple

# Jeder Eintrag: name_key -> (preis_pro_packung, packungsgröße, einheit, preis_pro_kg_oder_l, kategorie)
PRODUCT_PRICES: Dict[str, Dict] = {
    # ==========================================
    # OBST & GEMÜSE
    # ==========================================
    "Haferflocken": {"pack_price": 0.99, "pack_size": 500, "unit": "g", "price_per_kg": 1.98, "category": "Trockensortiment"},
    "Dinkelflocken": {"pack_price": 1.79, "pack_size": 500, "unit": "g", "price_per_kg": 3.58, "category": "Trockensortiment"},
    "Chiasamen": {"pack_price": 2.49, "pack_size": 250, "unit": "g", "price_per_kg": 9.96, "category": "Trockensortiment"},
    "Leinsamen": {"pack_price": 0.99, "pack_size": 500, "unit": "g", "price_per_kg": 1.98, "category": "Trockensortiment"},
    "Heidelbeeren": {"pack_price": 2.49, "pack_size": 300, "unit": "g", "price_per_kg": 8.30, "category": "Obst & Gemüse"},
    "Himbeeren": {"pack_price": 2.29, "pack_size": 125, "unit": "g", "price_per_kg": 18.32, "category": "Obst & Gemüse"},
    "Erdbeeren": {"pack_price": 2.49, "pack_size": 500, "unit": "g", "price_per_kg": 4.98, "category": "Obst & Gemüse"},
    "Äpfel": {"pack_price": 1.99, "pack_size": 1000, "unit": "g", "price_per_kg": 1.99, "category": "Obst & Gemüse"},
    "Bananen": {"pack_price": 1.29, "pack_size": 1000, "unit": "g", "price_per_kg": 1.29, "category": "Obst & Gemüse"},
    "Avocado": {"pack_price": 0.99, "pack_size": 200, "unit": "g", "price_per_kg": 4.95, "category": "Obst & Gemüse"},
    "Kirschtomaten": {"pack_price": 1.49, "pack_size": 250, "unit": "g", "price_per_kg": 5.96, "category": "Obst & Gemüse"},
    "Tomaten": {"pack_price": 1.79, "pack_size": 500, "unit": "g", "price_per_kg": 3.58, "category": "Obst & Gemüse"},
    "Gurke": {"pack_price": 0.69, "pack_size": 400, "unit": "g", "price_per_kg": 1.73, "category": "Obst & Gemüse"},
    "Paprika rot": {"pack_price": 0.79, "pack_size": 200, "unit": "g", "price_per_kg": 3.95, "category": "Obst & Gemüse"},
    "Paprika bunt": {"pack_price": 1.99, "pack_size": 500, "unit": "g", "price_per_kg": 3.98, "category": "Obst & Gemüse"},
    "Brokkoli": {"pack_price": 1.29, "pack_size": 500, "unit": "g", "price_per_kg": 2.58, "category": "Obst & Gemüse"},
    "Blattspinat": {"pack_price": 1.49, "pack_size": 200, "unit": "g", "price_per_kg": 7.45, "category": "Obst & Gemüse"},
    "Babyspinat": {"pack_price": 1.69, "pack_size": 125, "unit": "g", "price_per_kg": 13.52, "category": "Obst & Gemüse"},
    "Zucchini": {"pack_price": 0.79, "pack_size": 350, "unit": "g", "price_per_kg": 2.26, "category": "Obst & Gemüse"},
    "Süßkartoffeln": {"pack_price": 1.99, "pack_size": 750, "unit": "g", "price_per_kg": 2.65, "category": "Obst & Gemüse"},
    "Kartoffeln": {"pack_price": 1.99, "pack_size": 2000, "unit": "g", "price_per_kg": 1.00, "category": "Obst & Gemüse"},
    "Champignons": {"pack_price": 1.29, "pack_size": 250, "unit": "g", "price_per_kg": 5.16, "category": "Obst & Gemüse"},
    "Zwiebeln": {"pack_price": 0.99, "pack_size": 1000, "unit": "g", "price_per_kg": 0.99, "category": "Obst & Gemüse"},
    "Knoblauch": {"pack_price": 0.59, "pack_size": 60, "unit": "g", "price_per_kg": 9.83, "category": "Obst & Gemüse"},
    "Karotten": {"pack_price": 0.99, "pack_size": 1000, "unit": "g", "price_per_kg": 0.99, "category": "Obst & Gemüse"},
    "Aubergine": {"pack_price": 1.29, "pack_size": 300, "unit": "g", "price_per_kg": 4.30, "category": "Obst & Gemüse"},
    "Lauch": {"pack_price": 0.79, "pack_size": 200, "unit": "g", "price_per_kg": 3.95, "category": "Obst & Gemüse"},
    "Rucola": {"pack_price": 0.99, "pack_size": 100, "unit": "g", "price_per_kg": 9.90, "category": "Obst & Gemüse"},
    "Feldsalat": {"pack_price": 1.29, "pack_size": 100, "unit": "g", "price_per_kg": 12.90, "category": "Obst & Gemüse"},
    "Frühlingszwiebeln": {"pack_price": 0.59, "pack_size": 100, "unit": "g", "price_per_kg": 5.90, "category": "Obst & Gemüse"},
    "Zitrone": {"pack_price": 0.35, "pack_size": 80, "unit": "g", "price_per_kg": 4.38, "category": "Obst & Gemüse"},
    "Limette": {"pack_price": 0.39, "pack_size": 60, "unit": "g", "price_per_kg": 6.50, "category": "Obst & Gemüse"},
    "Ingwer": {"pack_price": 0.99, "pack_size": 100, "unit": "g", "price_per_kg": 9.90, "category": "Obst & Gemüse"},
    "Grüner Spargel": {"pack_price": 2.99, "pack_size": 500, "unit": "g", "price_per_kg": 5.98, "category": "Obst & Gemüse"},
    "Zuckerschoten": {"pack_price": 1.99, "pack_size": 200, "unit": "g", "price_per_kg": 9.95, "category": "Obst & Gemüse"},
    "Edamame": {"pack_price": 2.49, "pack_size": 300, "unit": "g", "price_per_kg": 8.30, "category": "Obst & Gemüse"},
    "TK Beerenmischung": {"pack_price": 2.49, "pack_size": 500, "unit": "g", "price_per_kg": 4.98, "category": "Tiefkühl"},
    "TK Blattspinat": {"pack_price": 0.99, "pack_size": 450, "unit": "g", "price_per_kg": 2.20, "category": "Tiefkühl"},
    "TK Erbsen": {"pack_price": 1.29, "pack_size": 500, "unit": "g", "price_per_kg": 2.58, "category": "Tiefkühl"},

    # ==========================================
    # PROTEINQUELLEN
    # ==========================================
    "Lachsfilet": {"pack_price": 4.99, "pack_size": 300, "unit": "g", "price_per_kg": 16.63, "category": "Fisch"},
    "Kabeljaufilet": {"pack_price": 3.99, "pack_size": 300, "unit": "g", "price_per_kg": 13.30, "category": "Fisch"},
    "Forellenfilet": {"pack_price": 3.49, "pack_size": 250, "unit": "g", "price_per_kg": 13.96, "category": "Fisch"},
    "Thunfisch Dose": {"pack_price": 1.29, "pack_size": 150, "unit": "g", "price_per_kg": 8.60, "category": "Konserven"},
    "Räucherlachs": {"pack_price": 2.99, "pack_size": 100, "unit": "g", "price_per_kg": 29.90, "category": "Fisch"},
    "Garnelen": {"pack_price": 3.99, "pack_size": 200, "unit": "g", "price_per_kg": 19.95, "category": "Fisch"},
    "Hähnchenbrust": {"pack_price": 3.49, "pack_size": 400, "unit": "g", "price_per_kg": 8.73, "category": "Fleisch"},
    "Putenbrustfilet": {"pack_price": 3.69, "pack_size": 400, "unit": "g", "price_per_kg": 9.23, "category": "Fleisch"},
    "Putenbrust Aufschnitt": {"pack_price": 1.49, "pack_size": 150, "unit": "g", "price_per_kg": 9.93, "category": "Fleisch"},
    "Rinderhack": {"pack_price": 3.49, "pack_size": 400, "unit": "g", "price_per_kg": 8.73, "category": "Fleisch"},
    "Rindersteak": {"pack_price": 5.99, "pack_size": 300, "unit": "g", "price_per_kg": 19.97, "category": "Fleisch"},
    "Eier Bio": {"pack_price": 2.49, "pack_size": 10, "unit": "Stück", "price_per_unit": 0.25, "category": "Kühlregal"},
    "Magerquark": {"pack_price": 0.65, "pack_size": 500, "unit": "g", "price_per_kg": 1.30, "category": "Kühlregal"},
    "Skyr Natur": {"pack_price": 0.99, "pack_size": 450, "unit": "g", "price_per_kg": 2.20, "category": "Kühlregal"},
    "Griechischer Joghurt": {"pack_price": 1.29, "pack_size": 400, "unit": "g", "price_per_kg": 3.23, "category": "Kühlregal"},
    "Naturjoghurt": {"pack_price": 0.69, "pack_size": 500, "unit": "g", "price_per_kg": 1.38, "category": "Kühlregal"},
    "Frischkäse": {"pack_price": 0.89, "pack_size": 200, "unit": "g", "price_per_kg": 4.45, "category": "Kühlregal"},
    "Körniger Frischkäse": {"pack_price": 0.99, "pack_size": 200, "unit": "g", "price_per_kg": 4.95, "category": "Kühlregal"},
    "Feta": {"pack_price": 1.29, "pack_size": 200, "unit": "g", "price_per_kg": 6.45, "category": "Kühlregal"},
    "Mozzarella": {"pack_price": 0.79, "pack_size": 125, "unit": "g", "price_per_kg": 6.32, "category": "Kühlregal"},
    "Gouda": {"pack_price": 1.29, "pack_size": 200, "unit": "g", "price_per_kg": 6.45, "category": "Kühlregal"},
    "Parmesan": {"pack_price": 1.99, "pack_size": 100, "unit": "g", "price_per_kg": 19.90, "category": "Kühlregal"},
    "Butter": {"pack_price": 1.79, "pack_size": 250, "unit": "g", "price_per_kg": 7.16, "category": "Kühlregal"},
    "Milch": {"pack_price": 1.09, "pack_size": 1000, "unit": "ml", "price_per_l": 1.09, "category": "Kühlregal"},
    "Sahne": {"pack_price": 0.69, "pack_size": 200, "unit": "ml", "price_per_l": 3.45, "category": "Kühlregal"},
    "Naturtofu": {"pack_price": 1.49, "pack_size": 400, "unit": "g", "price_per_kg": 3.73, "category": "Kühlregal"},
    "Räuchertofu": {"pack_price": 1.79, "pack_size": 200, "unit": "g", "price_per_kg": 8.95, "category": "Kühlregal"},

    # ==========================================
    # TROCKENSORTIMENT & VOLLKORN
    # ==========================================
    "Quinoa": {"pack_price": 2.39, "pack_size": 400, "unit": "g", "price_per_kg": 5.98, "category": "Trockensortiment"},
    "Naturreis": {"pack_price": 1.69, "pack_size": 500, "unit": "g", "price_per_kg": 3.38, "category": "Trockensortiment"},
    "Basmati Reis": {"pack_price": 1.99, "pack_size": 500, "unit": "g", "price_per_kg": 3.98, "category": "Trockensortiment"},
    "Vollkornnudeln": {"pack_price": 0.99, "pack_size": 500, "unit": "g", "price_per_kg": 1.98, "category": "Trockensortiment"},
    "Spaghetti": {"pack_price": 0.79, "pack_size": 500, "unit": "g", "price_per_kg": 1.58, "category": "Trockensortiment"},
    "Penne": {"pack_price": 0.79, "pack_size": 500, "unit": "g", "price_per_kg": 1.58, "category": "Trockensortiment"},
    "Couscous": {"pack_price": 1.29, "pack_size": 500, "unit": "g", "price_per_kg": 2.58, "category": "Trockensortiment"},
    "Bulgur": {"pack_price": 1.49, "pack_size": 500, "unit": "g", "price_per_kg": 2.98, "category": "Trockensortiment"},
    "Rote Linsen": {"pack_price": 1.79, "pack_size": 500, "unit": "g", "price_per_kg": 3.58, "category": "Trockensortiment"},
    "Kichererbsen Dose": {"pack_price": 0.99, "pack_size": 400, "unit": "g", "price_per_kg": 2.48, "category": "Konserven"},
    "Kidneybohnen Dose": {"pack_price": 0.89, "pack_size": 400, "unit": "g", "price_per_kg": 2.23, "category": "Konserven"},
    "Dosentomaten": {"pack_price": 0.49, "pack_size": 400, "unit": "g", "price_per_kg": 1.23, "category": "Konserven"},
    "Tomatenmark": {"pack_price": 0.59, "pack_size": 200, "unit": "g", "price_per_kg": 2.95, "category": "Konserven"},
    "Kokosmilch": {"pack_price": 1.29, "pack_size": 400, "unit": "ml", "price_per_l": 3.23, "category": "Konserven"},
    "Vollkornbrot": {"pack_price": 1.49, "pack_size": 500, "unit": "g", "price_per_kg": 2.98, "category": "Brot & Backwaren"},
    "Vollkorn-Wraps": {"pack_price": 1.79, "pack_size": 6, "unit": "Stück", "price_per_unit": 0.30, "category": "Brot & Backwaren"},
    "Knäckebrot": {"pack_price": 1.19, "pack_size": 250, "unit": "g", "price_per_kg": 4.76, "category": "Brot & Backwaren"},

    # ==========================================
    # NÜSSE & GESUNDE FETTE
    # ==========================================
    "Walnüsse": {"pack_price": 2.49, "pack_size": 200, "unit": "g", "price_per_kg": 12.45, "category": "Nüsse & Kerne"},
    "Mandeln": {"pack_price": 2.29, "pack_size": 200, "unit": "g", "price_per_kg": 11.45, "category": "Nüsse & Kerne"},
    "Kürbiskerne": {"pack_price": 1.99, "pack_size": 200, "unit": "g", "price_per_kg": 9.95, "category": "Nüsse & Kerne"},
    "Sonnenblumenkerne": {"pack_price": 0.99, "pack_size": 200, "unit": "g", "price_per_kg": 4.95, "category": "Nüsse & Kerne"},
    "Erdnussmus": {"pack_price": 2.49, "pack_size": 250, "unit": "g", "price_per_kg": 9.96, "category": "Nüsse & Kerne"},
    "Tahini": {"pack_price": 2.99, "pack_size": 250, "unit": "g", "price_per_kg": 11.96, "category": "Nüsse & Kerne"},
    "Cashewkerne": {"pack_price": 2.99, "pack_size": 200, "unit": "g", "price_per_kg": 14.95, "category": "Nüsse & Kerne"},
    "Olivenöl": {"pack_price": 4.99, "pack_size": 500, "unit": "ml", "price_per_l": 9.98, "category": "Öle & Essig"},
    "Kokosöl": {"pack_price": 2.99, "pack_size": 300, "unit": "ml", "price_per_l": 9.97, "category": "Öle & Essig"},
    "Leinöl": {"pack_price": 2.49, "pack_size": 250, "unit": "ml", "price_per_l": 9.96, "category": "Öle & Essig"},
    "Rapsöl": {"pack_price": 1.79, "pack_size": 750, "unit": "ml", "price_per_l": 2.39, "category": "Öle & Essig"},
    "Essig Balsamico": {"pack_price": 1.99, "pack_size": 500, "unit": "ml", "price_per_l": 3.98, "category": "Öle & Essig"},

    # ==========================================
    # GEWÜRZE & BASICS
    # ==========================================
    "Salz": {"pack_price": 0.29, "pack_size": 500, "unit": "g", "price_per_kg": 0.58, "category": "Gewürze & Basics"},
    "Pfeffer": {"pack_price": 1.29, "pack_size": 50, "unit": "g", "price_per_kg": 25.80, "category": "Gewürze & Basics"},
    "Paprikapulver": {"pack_price": 0.99, "pack_size": 50, "unit": "g", "price_per_kg": 19.80, "category": "Gewürze & Basics"},
    "Kurkuma": {"pack_price": 0.99, "pack_size": 50, "unit": "g", "price_per_kg": 19.80, "category": "Gewürze & Basics"},
    "Kreuzkümmel": {"pack_price": 1.29, "pack_size": 40, "unit": "g", "price_per_kg": 32.25, "category": "Gewürze & Basics"},
    "Zimt": {"pack_price": 0.89, "pack_size": 50, "unit": "g", "price_per_kg": 17.80, "category": "Gewürze & Basics"},
    "Oregano getrocknet": {"pack_price": 0.79, "pack_size": 20, "unit": "g", "price_per_kg": 39.50, "category": "Gewürze & Basics"},
    "Basilikum getrocknet": {"pack_price": 0.79, "pack_size": 20, "unit": "g", "price_per_kg": 39.50, "category": "Gewürze & Basics"},
    "Currypulver": {"pack_price": 0.99, "pack_size": 50, "unit": "g", "price_per_kg": 19.80, "category": "Gewürze & Basics"},
    "Sojasoße": {"pack_price": 1.49, "pack_size": 250, "unit": "ml", "price_per_l": 5.96, "category": "Gewürze & Basics"},
    "Senf": {"pack_price": 0.79, "pack_size": 200, "unit": "ml", "price_per_l": 3.95, "category": "Gewürze & Basics"},
    "Honig": {"pack_price": 2.49, "pack_size": 500, "unit": "g", "price_per_kg": 4.98, "category": "Gewürze & Basics"},
    "Ahornsirup": {"pack_price": 3.99, "pack_size": 250, "unit": "ml", "price_per_l": 15.96, "category": "Gewürze & Basics"},
    "Mandelmilch": {"pack_price": 1.49, "pack_size": 1000, "unit": "ml", "price_per_l": 1.49, "category": "Getränke"},
    "Hafermilch": {"pack_price": 1.29, "pack_size": 1000, "unit": "ml", "price_per_l": 1.29, "category": "Getränke"},
    "Mehl": {"pack_price": 0.59, "pack_size": 1000, "unit": "g", "price_per_kg": 0.59, "category": "Trockensortiment"},
    "Vollkornmehl": {"pack_price": 0.89, "pack_size": 1000, "unit": "g", "price_per_kg": 0.89, "category": "Trockensortiment"},
    "Backpulver": {"pack_price": 0.35, "pack_size": 75, "unit": "g", "price_per_kg": 4.67, "category": "Gewürze & Basics"},
    "Vanilleextrakt": {"pack_price": 1.99, "pack_size": 20, "unit": "ml", "price_per_l": 99.50, "category": "Gewürze & Basics"},
    "Petersilie frisch": {"pack_price": 0.69, "pack_size": 30, "unit": "g", "price_per_kg": 23.00, "category": "Kräuter"},
    "Basilikum frisch": {"pack_price": 1.29, "pack_size": 50, "unit": "g", "price_per_kg": 25.80, "category": "Kräuter"},
    "Schnittlauch": {"pack_price": 0.69, "pack_size": 30, "unit": "g", "price_per_kg": 23.00, "category": "Kräuter"},
    "Koriander frisch": {"pack_price": 0.99, "pack_size": 30, "unit": "g", "price_per_kg": 33.00, "category": "Kräuter"},
    "Zucker": {"pack_price": 0.89, "pack_size": 1000, "unit": "g", "price_per_kg": 0.89, "category": "Gewürze & Basics"},
}


def get_product_price(ingredient_name: str) -> Optional[Dict]:
    """
    Looks up price info for a given ingredient name using fuzzy matching.
    Returns dict with pack_price, pack_size, unit, price_per_kg, category.
    """
    name_lower = ingredient_name.lower().strip()

    # Exact match first
    for key, data in PRODUCT_PRICES.items():
        if key.lower() == name_lower:
            return {**data, "matched_product": key}

    # Partial match: ingredient contains product name or vice versa
    for key, data in PRODUCT_PRICES.items():
        if key.lower() in name_lower or name_lower in key.lower():
            return {**data, "matched_product": key}

    # Keyword matching for common patterns
    keyword_map = {
        "lachs": "Lachsfilet",
        "hähnchen": "Hähnchenbrust",
        "pute": "Putenbrustfilet",
        "hack": "Rinderhack",
        "steak": "Rindersteak",
        "kabeljau": "Kabeljaufilet",
        "forelle": "Forellenfilet",
        "garnele": "Garnelen",
        "quark": "Magerquark",
        "skyr": "Skyr Natur",
        "joghurt": "Naturjoghurt",
        "tofu": "Naturtofu",
        "spinat": "Blattspinat",
        "nudel": "Vollkornnudeln",
        "spaghet": "Spaghetti",
        "reis": "Naturreis",
        "linse": "Rote Linsen",
        "kichererbse": "Kichererbsen Dose",
        "paprika": "Paprika rot",
        "tomaten": "Tomaten",
        "kartoffel": "Kartoffeln",
        "süßkartoffel": "Süßkartoffeln",
        "pilz": "Champignons",
        "champignon": "Champignons",
        "zwiebel": "Zwiebeln",
        "knoblauch": "Knoblauch",
        "apfel": "Äpfel",
        "banan": "Bananen",
        "beere": "Heidelbeeren",
        "brokkoli": "Brokkoli",
        "zucchini": "Zucchini",
        "gurke": "Gurke",
        "avocado": "Avocado",
        "walnuss": "Walnüsse",
        "mandel": "Mandeln",
        "kürbiskern": "Kürbiskerne",
        "erdnuss": "Erdnussmus",
        "olivenöl": "Olivenöl",
        "butter": "Butter",
        "sahne": "Sahne",
        "milch": "Milch",
        "feta": "Feta",
        "mozzarella": "Mozzarella",
        "parmesan": "Parmesan",
        "frischkäse": "Frischkäse",
        "wrap": "Vollkorn-Wraps",
        "brot": "Vollkornbrot",
        "honig": "Honig",
        "senf": "Senf",
        "soja": "Sojasoße",
        "mehl": "Mehl",
        "ei": "Eier Bio",
        "couscous": "Couscous",
        "quinoa": "Quinoa",
        "bulgur": "Bulgur",
    }

    for keyword, product in keyword_map.items():
        if keyword in name_lower:
            data = PRODUCT_PRICES.get(product)
            if data:
                return {**data, "matched_product": product}

    # Fallback: generic estimate
    return {
        "pack_price": 1.99,
        "pack_size": 500,
        "unit": "g",
        "price_per_kg": 3.98,
        "category": "Sonstiges",
        "matched_product": ingredient_name,
    }


def estimate_ingredient_cost(ingredient_name: str, amount: float, unit: str) -> float:
    """
    Estimates the cost of a specific amount of an ingredient.
    """
    price_info = get_product_price(ingredient_name)
    if not price_info:
        return 0.50  # absolute fallback

    pack_price = price_info["pack_price"]
    pack_size = price_info["pack_size"]

    if unit in ["Stück"]:
        # For items sold per piece
        price_per_unit = price_info.get("price_per_unit", pack_price / max(1, pack_size))
        return round(amount * price_per_unit, 2)

    # For weight/volume based items
    fraction = amount / max(1, pack_size)
    return round(fraction * pack_price, 2)


def get_realistic_pack_size(ingredient_name: str) -> Tuple[float, str]:
    """
    Returns the realistic pack size for a given ingredient.
    """
    price_info = get_product_price(ingredient_name)
    if price_info:
        return (price_info["pack_size"], price_info["unit"])
    return (500.0, "g")

"""
Realistische Preisdatenbank für deutsche Supermärkte (Netto, NP, Lidl, Aldi, Rewe, Kaufland, Edeka).
Preise basieren auf offiziellen Erhebungen und Durchschnittswerten 2026 für Deutschland (Discounter-Eigenmarken).
"""

from typing import Dict, Optional, Tuple

# Jeder Eintrag: name_key -> (pack_price, pack_size, unit, price_per_kg_oder_l, category)
PRODUCT_PRICES: Dict[str, Dict] = {
    # ==========================================
    # OBST & GEMÜSE
    # ==========================================
    "Äpfel": {"pack_price": 2.19, "pack_size": 1000, "unit": "g", "price_per_kg": 2.19, "category": "Obst & Gemüse"},
    "Aubergine": {"pack_price": 1.19, "pack_size": 300, "unit": "g", "price_per_kg": 3.97, "category": "Obst & Gemüse"},
    "Avocado": {"pack_price": 1.19, "pack_size": 200, "unit": "g", "price_per_kg": 5.95, "category": "Obst & Gemüse"},
    "Babyspinat": {"pack_price": 1.69, "pack_size": 125, "unit": "g", "price_per_kg": 13.52, "category": "Obst & Gemüse"},
    "Bananen": {"pack_price": 1.39, "pack_size": 1000, "unit": "g", "price_per_kg": 1.39, "category": "Obst & Gemüse"},
    "Birnen": {"pack_price": 2.29, "pack_size": 1000, "unit": "g", "price_per_kg": 2.29, "category": "Obst & Gemüse"},
    "Blattspinat": {"pack_price": 1.49, "pack_size": 200, "unit": "g", "price_per_kg": 7.45, "category": "Obst & Gemüse"},
    "Brokkoli": {"pack_price": 1.49, "pack_size": 500, "unit": "g", "price_per_kg": 2.98, "category": "Obst & Gemüse"},
    "Champignons": {"pack_price": 1.49, "pack_size": 250, "unit": "g", "price_per_kg": 5.96, "category": "Obst & Gemüse"},
    "Edamame": {"pack_price": 2.49, "pack_size": 300, "unit": "g", "price_per_kg": 8.30, "category": "Obst & Gemüse"},
    "Erdbeeren": {"pack_price": 2.49, "pack_size": 500, "unit": "g", "price_per_kg": 4.98, "category": "Obst & Gemüse"},
    "Feldsalat": {"pack_price": 1.29, "pack_size": 100, "unit": "g", "price_per_kg": 12.90, "category": "Obst & Gemüse"},
    "Frühlingszwiebeln": {"pack_price": 0.59, "pack_size": 100, "unit": "g", "price_per_kg": 5.90, "category": "Obst & Gemüse"},
    "Grüner Spargel": {"pack_price": 3.29, "pack_size": 500, "unit": "g", "price_per_kg": 6.58, "category": "Obst & Gemüse"},
    "Gurke": {"pack_price": 0.69, "pack_size": 400, "unit": "g", "price_per_kg": 1.73, "category": "Obst & Gemüse"},
    "Heidelbeeren": {"pack_price": 2.69, "pack_size": 300, "unit": "g", "price_per_kg": 8.97, "category": "Obst & Gemüse"},
    "Himbeeren": {"pack_price": 2.29, "pack_size": 125, "unit": "g", "price_per_kg": 18.32, "category": "Obst & Gemüse"},
    "Ingwer": {"pack_price": 0.89, "pack_size": 100, "unit": "g", "price_per_kg": 8.90, "category": "Obst & Gemüse"},
    "Karotten": {"pack_price": 1.19, "pack_size": 1000, "unit": "g", "price_per_kg": 1.19, "category": "Obst & Gemüse"},
    "Kartoffeln": {"pack_price": 2.29, "pack_size": 2000, "unit": "g", "price_per_kg": 1.15, "category": "Obst & Gemüse"},
    "Kirschtomaten": {"pack_price": 1.49, "pack_size": 250, "unit": "g", "price_per_kg": 5.96, "category": "Obst & Gemüse"},
    "Knoblauch": {"pack_price": 0.69, "pack_size": 60, "unit": "g", "price_per_kg": 11.50, "category": "Obst & Gemüse"},
    "Lauch": {"pack_price": 0.79, "pack_size": 200, "unit": "g", "price_per_kg": 3.95, "category": "Obst & Gemüse"},
    "Limette": {"pack_price": 0.45, "pack_size": 60, "unit": "g", "price_per_kg": 7.50, "category": "Obst & Gemüse"},
    "Paprika bunt": {"pack_price": 2.19, "pack_size": 500, "unit": "g", "price_per_kg": 4.38, "category": "Obst & Gemüse"},
    "Paprika rot": {"pack_price": 0.89, "pack_size": 200, "unit": "g", "price_per_kg": 4.45, "category": "Obst & Gemüse"},
    "Pflaumen": {"pack_price": 1.99, "pack_size": 500, "unit": "g", "price_per_kg": 3.98, "category": "Obst & Gemüse"},
    "Rucola": {"pack_price": 0.99, "pack_size": 100, "unit": "g", "price_per_kg": 9.90, "category": "Obst & Gemüse"},
    "Süßkartoffeln": {"pack_price": 2.19, "pack_size": 750, "unit": "g", "price_per_kg": 2.92, "category": "Obst & Gemüse"},
    "TK Beerenmischung": {"pack_price": 2.69, "pack_size": 500, "unit": "g", "price_per_kg": 5.38, "category": "Tiefkühl"},
    "TK Blattspinat": {"pack_price": 1.19, "pack_size": 450, "unit": "g", "price_per_kg": 2.64, "category": "Tiefkühl"},
    "TK Erbsen": {"pack_price": 1.49, "pack_size": 500, "unit": "g", "price_per_kg": 2.98, "category": "Tiefkühl"},
    "Tomaten": {"pack_price": 1.79, "pack_size": 500, "unit": "g", "price_per_kg": 3.58, "category": "Obst & Gemüse"},
    "Zitrone": {"pack_price": 0.39, "pack_size": 80, "unit": "g", "price_per_kg": 4.88, "category": "Obst & Gemüse"},
    "Zucchini": {"pack_price": 0.89, "pack_size": 350, "unit": "g", "price_per_kg": 2.54, "category": "Obst & Gemüse"},
    "Zuckerschoten": {"pack_price": 1.99, "pack_size": 200, "unit": "g", "price_per_kg": 9.95, "category": "Obst & Gemüse"},
    "Zwiebeln": {"pack_price": 1.19, "pack_size": 1000, "unit": "g", "price_per_kg": 1.19, "category": "Obst & Gemüse"},

    # ==========================================
    # PROTEINQUELLEN
    # ==========================================
    "Bio-Hähnchenbrust": {"pack_price": 5.99, "pack_size": 300, "unit": "g", "price_per_kg": 19.97, "category": "Fleisch"},
    "Bio-Naturtofu": {"pack_price": 1.79, "pack_size": 400, "unit": "g", "price_per_kg": 4.48, "category": "Kühlregal"},
    "Butter": {"pack_price": 2.09, "pack_size": 250, "unit": "g", "price_per_kg": 8.36, "category": "Kühlregal"},
    "Eier Bio": {"pack_price": 2.89, "pack_size": 10, "unit": "Stück", "price_per_unit": 0.29, "category": "Kühlregal"},
    "Feta": {"pack_price": 2.19, "pack_size": 200, "unit": "g", "price_per_kg": 10.95, "category": "Kühlregal"},
    "Forellenfilet": {"pack_price": 3.89, "pack_size": 250, "unit": "g", "price_per_kg": 15.56, "category": "Fisch"},
    "Frischkäse": {"pack_price": 0.99, "pack_size": 200, "unit": "g", "price_per_kg": 4.95, "category": "Kühlregal"},
    "Garnelen": {"pack_price": 4.49, "pack_size": 200, "unit": "g", "price_per_kg": 22.45, "category": "Fisch"},
    "Gouda": {"pack_price": 1.69, "pack_size": 200, "unit": "g", "price_per_kg": 8.45, "category": "Kühlregal"},
    "Griechischer Joghurt": {"pack_price": 1.49, "pack_size": 400, "unit": "g", "price_per_kg": 3.73, "category": "Kühlregal"},
    "Hähnchenbrust": {"pack_price": 4.19, "pack_size": 400, "unit": "g", "price_per_kg": 10.48, "category": "Fleisch"},
    "Kabeljaufilet": {"pack_price": 4.79, "pack_size": 300, "unit": "g", "price_per_kg": 15.97, "category": "Fisch"},
    "Körniger Frischkäse": {"pack_price": 1.09, "pack_size": 200, "unit": "g", "price_per_kg": 5.45, "category": "Kühlregal"},
    "Lachsfilet": {"pack_price": 6.49, "pack_size": 300, "unit": "g", "price_per_kg": 21.63, "category": "Fisch"},
    "Magerquark": {"pack_price": 0.99, "pack_size": 500, "unit": "g", "price_per_kg": 1.98, "category": "Kühlregal"},
    "Milch": {"pack_price": 1.09, "pack_size": 1000, "unit": "ml", "price_per_l": 1.09, "category": "Kühlregal"},
    "Mozzarella": {"pack_price": 0.89, "pack_size": 125, "unit": "g", "price_per_kg": 7.12, "category": "Kühlregal"},
    "Naturjoghurt": {"pack_price": 0.85, "pack_size": 500, "unit": "g", "price_per_kg": 1.70, "category": "Kühlregal"},
    "Naturtofu": {"pack_price": 1.79, "pack_size": 400, "unit": "g", "price_per_kg": 4.48, "category": "Kühlregal"},
    "Parmesan": {"pack_price": 2.49, "pack_size": 100, "unit": "g", "price_per_kg": 24.90, "category": "Kühlregal"},
    "Putenbrust Aufschnitt": {"pack_price": 1.69, "pack_size": 150, "unit": "g", "price_per_kg": 11.27, "category": "Fleisch"},
    "Putenbrustfilet": {"pack_price": 4.39, "pack_size": 400, "unit": "g", "price_per_kg": 10.98, "category": "Fleisch"},
    "Räucherlachs": {"pack_price": 3.29, "pack_size": 100, "unit": "g", "price_per_kg": 32.90, "category": "Fisch"},
    "Räuchertofu": {"pack_price": 1.89, "pack_size": 200, "unit": "g", "price_per_kg": 9.45, "category": "Kühlregal"},
    "Rinderhack": {"pack_price": 3.99, "pack_size": 400, "unit": "g", "price_per_kg": 9.98, "category": "Fleisch"},
    "Rindersteak": {"pack_price": 6.99, "pack_size": 300, "unit": "g", "price_per_kg": 23.30, "category": "Fleisch"},
    "Sahne": {"pack_price": 0.89, "pack_size": 200, "unit": "ml", "price_per_l": 4.45, "category": "Kühlregal"},
    "Skyr Natur": {"pack_price": 1.29, "pack_size": 450, "unit": "g", "price_per_kg": 2.87, "category": "Kühlregal"},
    "Thunfisch Dose": {"pack_price": 1.39, "pack_size": 150, "unit": "g", "price_per_kg": 9.27, "category": "Konserven"},

    # ==========================================
    # TROCKENSORTIMENT & VOLLKORN
    # ==========================================
    "Basmati Reis": {"pack_price": 1.89, "pack_size": 500, "unit": "g", "price_per_kg": 3.78, "category": "Trockensortiment"},
    "Bulgur": {"pack_price": 1.49, "pack_size": 500, "unit": "g", "price_per_kg": 2.98, "category": "Trockensortiment"},
    "Chiasamen": {"pack_price": 2.29, "pack_size": 250, "unit": "g", "price_per_kg": 9.16, "category": "Trockensortiment"},
    "Couscous": {"pack_price": 1.39, "pack_size": 500, "unit": "g", "price_per_kg": 2.78, "category": "Trockensortiment"},
    "Dinkelbrot": {"pack_price": 1.89, "pack_size": 500, "unit": "g", "price_per_kg": 3.78, "category": "Brot & Backwaren"},
    "Dinkelflocken": {"pack_price": 1.69, "pack_size": 500, "unit": "g", "price_per_kg": 3.38, "category": "Trockensortiment"},
    "Dinkelmehl": {"pack_price": 1.39, "pack_size": 1000, "unit": "g", "price_per_kg": 1.39, "category": "Trockensortiment"},
    "Dosentomaten": {"pack_price": 0.65, "pack_size": 400, "unit": "g", "price_per_kg": 1.63, "category": "Konserven"},
    "Haferflocken": {"pack_price": 0.89, "pack_size": 500, "unit": "g", "price_per_kg": 1.78, "category": "Trockensortiment"},
    "Kichererbsen Dose": {"pack_price": 0.89, "pack_size": 400, "unit": "g", "price_per_kg": 2.23, "category": "Konserven"},
    "Kidneybohnen Dose": {"pack_price": 0.79, "pack_size": 400, "unit": "g", "price_per_kg": 1.98, "category": "Konserven"},
    "Knäckebrot": {"pack_price": 1.19, "pack_size": 250, "unit": "g", "price_per_kg": 4.76, "category": "Brot & Backwaren"},
    "Kokosmilch": {"pack_price": 1.39, "pack_size": 400, "unit": "ml", "price_per_l": 3.48, "category": "Konserven"},
    "Leinsamen": {"pack_price": 1.19, "pack_size": 500, "unit": "g", "price_per_kg": 2.38, "category": "Trockensortiment"},
    "Mehl": {"pack_price": 0.65, "pack_size": 1000, "unit": "g", "price_per_kg": 0.65, "category": "Trockensortiment"},
    "Naturreis": {"pack_price": 1.69, "pack_size": 500, "unit": "g", "price_per_kg": 3.38, "category": "Trockensortiment"},
    "Penne": {"pack_price": 0.79, "pack_size": 500, "unit": "g", "price_per_kg": 1.58, "category": "Trockensortiment"},
    "Quinoa": {"pack_price": 2.49, "pack_size": 400, "unit": "g", "price_per_kg": 6.23, "category": "Trockensortiment"},
    "Rote Linsen": {"pack_price": 1.89, "pack_size": 500, "unit": "g", "price_per_kg": 3.78, "category": "Trockensortiment"},
    "Spaghetti": {"pack_price": 0.79, "pack_size": 500, "unit": "g", "price_per_kg": 1.58, "category": "Trockensortiment"},
    "Tomatenmark": {"pack_price": 0.79, "pack_size": 200, "unit": "g", "price_per_kg": 3.95, "category": "Konserven"},
    "Vollkorn-Penne": {"pack_price": 0.99, "pack_size": 500, "unit": "g", "price_per_kg": 1.98, "category": "Trockensortiment"},
    "Vollkorn-Wraps": {"pack_price": 1.89, "pack_size": 6, "unit": "Stück", "price_per_unit": 0.32, "category": "Brot & Backwaren"},
    "Vollkornbrot": {"pack_price": 1.59, "pack_size": 500, "unit": "g", "price_per_kg": 3.18, "category": "Brot & Backwaren"},
    "Vollkornmehl": {"pack_price": 0.99, "pack_size": 1000, "unit": "g", "price_per_kg": 0.99, "category": "Trockensortiment"},
    "Vollkornnudeln": {"pack_price": 0.99, "pack_size": 500, "unit": "g", "price_per_kg": 1.98, "category": "Trockensortiment"},
    "Zarte Haferflocken": {"pack_price": 0.89, "pack_size": 500, "unit": "g", "price_per_kg": 1.78, "category": "Trockensortiment"},

    # ==========================================
    # NÜSSE & GESUNDE FETTE
    # ==========================================
    "Cashewkerne": {"pack_price": 2.99, "pack_size": 200, "unit": "g", "price_per_kg": 14.95, "category": "Nüsse & Kerne"},
    "Erdnussmus": {"pack_price": 2.69, "pack_size": 250, "unit": "g", "price_per_kg": 10.76, "category": "Nüsse & Kerne"},
    "Essig Balsamico": {"pack_price": 1.99, "pack_size": 500, "unit": "ml", "price_per_l": 3.98, "category": "Öle & Essig"},
    "Haselnüsse": {"pack_price": 2.59, "pack_size": 200, "unit": "g", "price_per_kg": 12.95, "category": "Nüsse & Kerne"},
    "Kokosöl": {"pack_price": 2.99, "pack_size": 300, "unit": "ml", "price_per_l": 9.97, "category": "Öle & Essig"},
    "Kürbiskerne": {"pack_price": 1.99, "pack_size": 200, "unit": "g", "price_per_kg": 9.95, "category": "Nüsse & Kerne"},
    "Leinöl": {"pack_price": 2.29, "pack_size": 250, "unit": "ml", "price_per_l": 9.16, "category": "Öle & Essig"},
    "Mandeln": {"pack_price": 2.49, "pack_size": 200, "unit": "g", "price_per_kg": 12.45, "category": "Nüsse & Kerne"},
    "Olivenöl": {"pack_price": 5.99, "pack_size": 500, "unit": "ml", "price_per_l": 11.98, "category": "Öle & Essig"},
    "Rapsöl": {"pack_price": 1.69, "pack_size": 750, "unit": "ml", "price_per_l": 2.25, "category": "Öle & Essig"},
    "Sesam": {"pack_price": 1.29, "pack_size": 150, "unit": "g", "price_per_kg": 8.60, "category": "Nüsse & Kerne"},
    "Sonnenblumenkerne": {"pack_price": 0.99, "pack_size": 200, "unit": "g", "price_per_kg": 4.95, "category": "Nüsse & Kerne"},
    "Tahini": {"pack_price": 3.19, "pack_size": 250, "unit": "g", "price_per_kg": 12.76, "category": "Nüsse & Kerne"},
    "Walnüsse": {"pack_price": 2.69, "pack_size": 200, "unit": "g", "price_per_kg": 13.45, "category": "Nüsse & Kerne"},

    # ==========================================
    # GEWÜRZE, GETRÄNKE & BASICS
    # ==========================================
    "Ahornsirup": {"pack_price": 3.99, "pack_size": 250, "unit": "ml", "price_per_l": 15.96, "category": "Gewürze & Basics"},
    "Backpulver": {"pack_price": 0.39, "pack_size": 75, "unit": "g", "price_per_kg": 5.20, "category": "Gewürze & Basics"},
    "Basilikum frisch": {"pack_price": 1.29, "pack_size": 50, "unit": "g", "price_per_kg": 25.80, "category": "Kräuter"},
    "Basilikum getrocknet": {"pack_price": 0.79, "pack_size": 20, "unit": "g", "price_per_kg": 39.50, "category": "Gewürze & Basics"},
    "Currypulver": {"pack_price": 0.99, "pack_size": 50, "unit": "g", "price_per_kg": 19.80, "category": "Gewürze & Basics"},
    "Hafermilch": {"pack_price": 0.99, "pack_size": 1000, "unit": "ml", "price_per_l": 0.99, "category": "Getränke"},
    "Honig": {"pack_price": 2.69, "pack_size": 500, "unit": "g", "price_per_kg": 5.38, "category": "Gewürze & Basics"},
    "Koriander frisch": {"pack_price": 0.99, "pack_size": 30, "unit": "g", "price_per_kg": 33.00, "category": "Kräuter"},
    "Kreuzkümmel": {"pack_price": 1.29, "pack_size": 40, "unit": "g", "price_per_kg": 32.25, "category": "Gewürze & Basics"},
    "Kurkuma": {"pack_price": 1.09, "pack_size": 50, "unit": "g", "price_per_kg": 21.80, "category": "Gewürze & Basics"},
    "Mandelmilch": {"pack_price": 1.49, "pack_size": 1000, "unit": "ml", "price_per_l": 1.49, "category": "Getränke"},
    "Oregano getrocknet": {"pack_price": 0.79, "pack_size": 20, "unit": "g", "price_per_kg": 39.50, "category": "Gewürze & Basics"},
    "Paprikapulver": {"pack_price": 0.99, "pack_size": 50, "unit": "g", "price_per_kg": 19.80, "category": "Gewürze & Basics"},
    "Petersilie frisch": {"pack_price": 0.69, "pack_size": 30, "unit": "g", "price_per_kg": 23.00, "category": "Kräuter"},
    "Pfeffer": {"pack_price": 1.39, "pack_size": 50, "unit": "g", "price_per_kg": 27.80, "category": "Gewürze & Basics"},
    "Salz": {"pack_price": 0.29, "pack_size": 500, "unit": "g", "price_per_kg": 0.58, "category": "Gewürze & Basics"},
    "Schnittlauch": {"pack_price": 0.69, "pack_size": 30, "unit": "g", "price_per_kg": 23.00, "category": "Kräuter"},
    "Senf": {"pack_price": 0.79, "pack_size": 200, "unit": "ml", "price_per_l": 3.95, "category": "Gewürze & Basics"},
    "Sojamilch": {"pack_price": 1.19, "pack_size": 1000, "unit": "ml", "price_per_l": 1.19, "category": "Getränke"},
    "Sojasoße": {"pack_price": 1.49, "pack_size": 250, "unit": "ml", "price_per_l": 5.96, "category": "Gewürze & Basics"},
    "Vanilleextrakt": {"pack_price": 1.99, "pack_size": 20, "unit": "ml", "price_per_l": 99.50, "category": "Gewürze & Basics"},
    "Zimt": {"pack_price": 0.99, "pack_size": 50, "unit": "g", "price_per_kg": 19.80, "category": "Gewürze & Basics"},
    "Zucker": {"pack_price": 0.89, "pack_size": 1000, "unit": "g", "price_per_kg": 0.89, "category": "Gewürze & Basics"},
}


def get_product_price(ingredient_name: str) -> Optional[Dict]:
    """
    Looks up price info for a given ingredient name using exact, partial, and keyword matching.
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
        "haselnuss": "Haselnüsse",
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
        "birne": "Birnen",
        "pflaume": "Pflaumen",
        "sesam": "Sesam",
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
    Estimates the cost of a specific amount of an ingredient based on 2026 prices.
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
    Returns the realistic pack size for a given ingredient in 2026.
    """
    price_info = get_product_price(ingredient_name)
    if price_info:
        return (price_info["pack_size"], price_info["unit"])
    return (500.0, "g")

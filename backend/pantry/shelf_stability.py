"""
Pantry Shelf Stability Checker.
Distinguishes durable dry goods (suitable for pantry storage) from fresh/perishable goods
(meat, fish, fresh vegetables, fresh fruit, fresh dairy) that must NOT be stored in the pantry.
"""

from typing import Optional

# Keywords for durable, shelf-stable dry goods that can safely stay in the pantry,
# even when the packaging has been opened.
DURABLE_DRY_KEYWORDS = [
    # Grains & Cereals
    "haferflocken", "dinkelflocken", "quinoa", "reis", "naturreis", "basmati",
    "jasminreis", "nudel", "nudeln", "vollkornnudeln", "spaghetti", "penne", "fusilli",
    "rigatoni", "farfalle", "tagliatelle", "linguine", "lasagne", "couscous", "bulgur",
    "mehl", "vollkornmehl", "weizenmehl", "dinkelmehl", "grieß", "polenta", "hirse",
    
    # Nuts, Seeds & Kernels
    "walnuss", "walnüsse", "mandel", "mandeln", "kürbiskern", "kürbiskerne",
    "sonnenblumenkern", "sonnenblumenkerne", "chiasamen", "leinsamen", "cashew",
    "cashewkerne", "erdnuss", "erdnüsse", "haselnuss", "haselnüsse", "sesam",
    "pinienkerne", "erdnussmus", "mandelmus", "tahini", "kerne", "samen",
    
    # Shelf-stable Legumes & Canned Staples
    "linsen", "rote linsen", "braune linsen", "berglinsen", "belugalinsen",
    "kichererbsen", "kidneybohnen", "bohnen", "weiße bohnen",
    "dosentomaten", "gehackte tomaten", "passierte tomaten", "tomatenmark", "kokosmilch",
    "thunfisch dose",
    
    # Oils & Vinegars
    "olivenöl", "rapsöl", "leinöl", "kokosöl", "speiseöl", "sonnenblumenöl",
    "essig", "balsamico", "apfelessig", "weißweinessig", "sojasauce", "sojasoße",
    
    # Spices & Seasonings & Baking Staples
    "salz", "meersalz", "pfeffer", "paprikapulver", "zimt", "kurkuma", "kreuzkümmel",
    "oregano", "basilikum getrocknet", "curry", "currypulver", "muskat", "vanille",
    "trockenhefe", "backpulver", "kakao", "honig", "ahornsirup", "senf",
    
    # Dry Crispbread / Crackers
    "knäckebrot", "zwieback", "reiswaffeln", "reiswaffel",
]

# Keywords that indicate fresh, perishable items that spoil quickly
# and must NEVER be transferred to the pantry / Lager as leftover stock.
PERISHABLE_KEYWORDS = [
    # Meat & Poultry
    "hähnchen", "hahnchen", "pute", "puten", "rind", "rinder", "hack", "hackfleisch",
    "steak", "fleisch", "schwein", "schweine", "wurst", "schinken", "bacon", "speck",
    "gulasch", "schnitzel", "bratwurst", "wiener",
    
    # Fish & Seafood
    "lachs", "lachsfilet", "kabeljau", "kabeljaufilet", "forelle", "forellenfilet",
    "thunfisch", "fisch", "seelachs", "dorade", "zander", "garnele", "garnelen",
    "scampi", "meeresfrüchte", "krabben",
    
    # Fresh Produce (Vegetables)
    "brokkoli", "broccoli", "zucchini", "paprika", "gurke", "salatgurke", "tomate",
    "tomaten", "kirschtomate", "kirschtomaten", "strauchtomaten", "spinat", "blattspinat",
    "babyspinat", "salat", "feldsalat", "rucola", "kopfsalat", "eisbergsalat", "römersalat",
    "champignon", "champignons", "pilze", "zwiebel", "zwiebeln", "frühlingszwiebel",
    "frühlingszwiebeln", "knoblauch", "karotte", "karotten", "möhre", "möhren", "aubergine",
    "auberginen", "lauch", "porree", "spargel", "zuckerschote", "zuckerschoten", "edamame",
    "ingwer", "kohl", "blumenkohl", "weißkohl", "rotkohl", "chinakohl", "kohlrabi", "sellerie",
    "radieschen", "fenchel", "süßkartoffel", "süßkartoffeln", "kartoffel", "kartoffeln",
    "avocado", "avocados",
    
    # Fresh Fruit & Berries
    "heidelbeere", "heidelbeeren", "blaubeere", "blaubeeren", "himbeere", "himbeeren",
    "erdbeere", "erdbeeren", "brombeere", "brombeeren", "beere", "beeren",
    "apfel", "äpfel", "banane", "bananen", "zitrone", "zitronen", "limette", "limetten",
    "orange", "orangen", "mandarine", "mandarinen", "birne", "birnen", "trauben", "weintrauben",
    "kiwi", "mango", "ananas", "melone", "wassermelone", "pfirsich", "nektarine", "pflaume",
    
    # Fresh Dairy & Refrigerated
    "skyr", "quark", "magerquark", "speisequark", "frischkäse", "hüttenkäse", "körnerkäse",
    "joghurt", "feta", "hirtenkäse", "mozzarella", "burrata", "gouda", "edamer", "emmentaler",
    "cheddar", "parmesan", "reibekäse", "käse", "butter", "margarine", "milch", "frischmilch",
    "sahne", "schlagsahne", "schmand", "creme fraiche", "crème fraîche", "saure sahne",
    "eier", "hühnerei", "bio-ei", "tofu", "naturtofu", "räuchertofu",
    
    # Perishable Bakery / Fresh Bread
    "vollkornbrot", "toast", "frischbrot", "brötchen",
    
    # Frozen (freezer, not pantry)
    "tk ", "tiefkühl",
]


def is_shelf_stable_dry_good(name: str, category: Optional[str] = None) -> bool:
    """
    Returns True ONLY for durable dry goods and staples that keep for a long time,
    even when opened (e.g. Nudeln, Reis, Quinoa, Haferflocken, Kerne, Nüsse, Linsen, Gewürze, Öle).
    
    Returns False for all fresh / perishable goods (Fleisch, Fisch, frisches Gemüse,
    frisches Obst, Kühlregal, Eier, TK-Ware).
    """
    lower = name.lower().strip()

    # Exception for durable canned staples (even though they contain "tomate" or "thunfisch")
    if any(c in lower for c in ["tomatenmark", "dosentomate", "gehackte tomate", "passierte tomate", "kokosmilch", "thunfisch dose"]):
        return True

    # Exact word check for eggs
    if lower == "ei" or lower == "eier" or lower.startswith("ei ") or lower.endswith(" ei") or " eier" in lower:
        return False

    # Check durable dry goods first if specifically matched
    for kw in DURABLE_DRY_KEYWORDS:
        if kw in lower:
            return True

    # Perishable check
    for kw in PERISHABLE_KEYWORDS:
        if kw in lower:
            return False

    # Category check if provided
    if category:
        cat_lower = category.lower()
        if any(bad in cat_lower for bad in ["fleisch", "fisch", "obst", "gemüse", "kühlregal", "tiefkühl", "frische", "molkerei"]):
            return False
        if any(good in cat_lower for good in ["trocken", "nüsse", "gewürz", "öl", "basic", "vorrat"]):
            return True

    return False

"""
Health Filter Engine ensuring only genuinely healthy food products are used.
"""

from typing import Tuple, Optional
from backend.models import ProductOffer
from backend.nutrition.ingredient_analyzer import analyze_ingredient_locally, fetch_open_food_facts_analysis


UNHEALTHY_KEYWORDS = [
    "cola", "limonade", "softdrink", "energy drink", "bier", "wein", "vodka", "schnaps", "likör",
    "chips", "flips", "nachos", "popcorn", "salzstangen", "snack",
    "schokolade", "pralinen", "bonbons", "fruchtgummi", "gummibärchen", "kekse", "cookies", "waffeln",
    "nutella", "nougatcreme", "marshmallows",
    "fertigpizza", "tiefkühlpizza", "currywurst", "hotdog", "dosenravioli", "fertiggericht",
    "frittieröl", "palmfett", "kondensmilch mit zucker", "schokoriegel", "croissant", "donut",
    "wiener würstchen", "bockwurst", "mettenden", "salami"
]

HEALTHY_KEYWORDS = [
    # Obst & Gemüse
    "brokkoli", "spinat", "blumenkohl", "paprika", "zucchini", "tomate", "gurke", "karotte", "möhre",
    "avocado", "apfel", "banane", "heidelbeere", "erdbeere", "himbeere", "beeren", "orange", "zitrone",
    "champignon", "pilze", "salat", "rucola", "feldsalat", "ingwer", "knoblauch", "zwiebel",
    # Proteine
    "hähnchenbrust", "hähnchen", "putenbrust", "pute", "rinderhack", "rinderfilet", "lachs", "wildlachs",
    "forelle", "kabeljau", "thunfisch", "garnelen", "eier", "bio-eier", "tofu", "tempeh", "magerquark",
    "skyr", "hüttenkäse", "körniger frischkäse", "feta",
    # Hülsenfrüchte & Vollkorn
    "kichererbsen", "linsen", "rote linsen", "belugalinsen", "kidneybohnen", "schwarze bohnen",
    "haferflocken", "vollkornbrot", "pumpernickel", "dinkel", "vollkornnudeln", "naturreis",
    "vollkornreis", "quinoa", "couscous", "buchweizen",
    # Gesunde Fette & Nüsse
    "olivenöl", "leinöl", "walnuss", "mandeln", "cashew", "chiasamen", "leinsamen", "kürbiskerne", "sonnenblumenkerne"
]


def evaluate_product_health(title: str, brand: Optional[str] = None, category: Optional[str] = None) -> Tuple[bool, int, str]:
    """
    Evaluates whether a product is healthy enough for clean meal planning.
    Returns: (is_healthy, health_score, category)
    """
    clean_text = f"{title} {brand or ''} {category or ''}".lower()

    # 1. Immediate rejection for junk/unhealthy products
    for bad in UNHEALTHY_KEYWORDS:
        if bad in clean_text:
            return False, 3, "Ungesund/Ausschluss"

    # 2. Check if product matches clean eating foods
    for good in HEALTHY_KEYWORDS:
        if good in clean_text:
            # Determine primary category
            if any(k in clean_text for k in ["brokkoli", "spinat", "blumenkohl", "paprika", "zucchini", "tomate", "gurke", "karotte", "möhre", "apfel", "banane", "heidelbeere", "beeren", "salat", "rucola", "feldsalat", "champignon"]):
                cat = "Obst & Gemüse"
            elif any(k in clean_text for k in ["hähnchen", "pute", "rinder", "lachs", "fisch", "thunfisch", "eier", "tofu", "skyr", "magerquark", "hüttenkäse", "feta"]):
                cat = "Proteinquellen"
            elif any(k in clean_text for k in ["haferflocken", "vollkorn", "quinoa", "linsen", "kichererbsen", "bohnen", "reis"]):
                cat = "Vollkorn & Hülsenfrüchte"
            elif any(k in clean_text for k in ["walnuss", "mandel", "chia", "lein", "avocado", "olivenöl"]):
                cat = "Gesunde Fette & Nüsse"
            else:
                cat = "Frische Lebensmittel"

            return True, 9, cat

    # Default fallback: reject products of unknown nutritional quality
    return False, 4, "Sonstiges"


async def enrich_offer_with_health_data(offer: ProductOffer) -> ProductOffer:
    """
    Attaches deep manufacturer ingredient analysis to the offer.
    """
    # 1. Evaluate basic health qualification
    is_healthy, score, cat = evaluate_product_health(offer.title, offer.brand, offer.category)
    offer.is_healthy = is_healthy
    offer.health_score = score
    offer.category = cat

    # 2. Add in-depth ingredient analysis
    analysis = await fetch_open_food_facts_analysis(offer.title)
    if not analysis:
        analysis = analyze_ingredient_locally(offer.title)

    offer.analysis = analysis
    offer.health_score = analysis.health_score
    if analysis.verdict == "Ungesund/Gemieden":
        offer.is_healthy = False

    return offer

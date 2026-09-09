"""
Marktguru REST API Client for Netto Marken-Discount & NP Discount.
"""

import httpx
from typing import List, Optional
from backend.models import ProductOffer
from backend.scrapers.curated_offers import CURATED_OFFERS_DATA
from backend.nutrition.health_filter import enrich_offer_with_health_data, evaluate_product_health
from backend.nutrition.ingredient_analyzer import analyze_ingredient_locally


MARKTGURU_API_URL = "https://api.marktguru.de/api/v1/offers/search"
HEADERS = {
    "x-clientkey": "WU/RH+PMGDi+gkZer3WbMelt6zcYHSTytNB7VpTia90=",
    "x-apikey": "8Kk+pmbf7TgJ9nVj2cXeA7P5zBGv8iuutVVMRfOfvNE=",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
}

NETTO_RETAILER_ID = 126735


async def fetch_live_offers_for_retailer(
    query: str,
    zip_code: str = "30159",
    limit: int = 15
) -> List[ProductOffer]:
    """
    Queries Marktguru for live offers matching a specific search term and postal code.
    """
    params = {
        "as": "web",
        "limit": limit,
        "offset": 0,
        "q": query,
        "zipCode": zip_code,
    }

    offers: List[ProductOffer] = []

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(MARKTGURU_API_URL, params=params, headers=HEADERS)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])

                for item in results:
                    prod = item.get("product", {})
                    advertisers = item.get("advertisers", [])
                    adv_name = advertisers[0].get("name", "") if advertisers else ""

                    # Detect retailer brand
                    adv_lower = adv_name.lower()
                    if "netto" in adv_lower:
                        retailer = "Netto"
                    elif "np" in adv_lower:
                        retailer = "NP"
                    elif "lidl" in adv_lower:
                        retailer = "Lidl"
                    elif "aldi" in adv_lower and ("süd" in adv_lower or "sued" in adv_lower):
                        retailer = "Aldi Süd"
                    elif "aldi" in adv_lower:
                        retailer = "Aldi Nord"
                    elif "rewe" in adv_lower:
                        retailer = "Rewe"
                    elif "kaufland" in adv_lower:
                        retailer = "Kaufland"
                    elif "edeka" in adv_lower:
                        retailer = "Edeka"
                    else:
                        continue  # Skip unrelated retailers

                    title = prod.get("name") or "Produkt"
                    price = float(item.get("price") or 0.0)
                    old_price = float(item.get("oldPrice")) if item.get("oldPrice") else None

                    savings = None
                    if old_price and old_price > price:
                        savings = int(round(((old_price - price) / old_price) * 100))

                    unit_name = item.get("unit", {}).get("name") or "Stück"
                    vol = item.get("volume")
                    amount_str = f"{vol} {unit_name}" if vol else unit_name

                    valid_dates = item.get("validityDates", [])
                    v_from = valid_dates[0].get("from", "")[:10] if valid_dates else None
                    v_to = valid_dates[0].get("to", "")[:10] if valid_dates else None

                    is_h, score, cat = evaluate_product_health(title, None, None)

                    offers.append(
                        ProductOffer(
                            id=f"mg-{item.get('id')}",
                            retailer=retailer,
                            title=title,
                            brand=item.get("brand", {}).get("name"),
                            original_price=old_price,
                            discount_price=price,
                            savings_percent=savings,
                            unit=unit_name,
                            amount=amount_str,
                            category=cat,
                            is_healthy=is_h,
                            health_score=score,
                            valid_from=v_from,
                            valid_to=v_to,
                            image_url="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
                        )
                    )
    except Exception:
        # Fallback to curated offers if network/api is unavailable
        pass

    return offers


async def get_all_supermarket_offers(
    zip_code: str = "30159",
    only_healthy: bool = True
) -> List[ProductOffer]:
    """
    Aggregates offers from Netto and NP, enriches with public ingredient analysis,
    and returns healthy clean food offers.
    """
    combined_offers: List[ProductOffer] = []

    # 1. Load curated authentic dataset
    for raw in CURATED_OFFERS_DATA:
        offer = ProductOffer(**raw)
        # Attach detailed ingredient analysis
        offer.analysis = analyze_ingredient_locally(offer.title)
        combined_offers.append(offer)

    # 2. Try fetching additional live offers for core healthy staples
    live_queries = ["bio", "gemuese", "haferflocken", "lachs", "quark"]
    for q in live_queries[:2]:  # fetch first 2 queries to keep response swift
        live_results = await fetch_live_offers_for_retailer(q, zip_code=zip_code, limit=5)
        for lo in live_results:
            lo.analysis = analyze_ingredient_locally(lo.title)
            # Avoid duplicates by title
            if not any(lo.title.lower() in existing.title.lower() for existing in combined_offers):
                combined_offers.append(lo)

    # 3. Filter for health requirement if requested
    if only_healthy:
        combined_offers = [o for o in combined_offers if o.is_healthy and o.health_score >= 6]

    return combined_offers

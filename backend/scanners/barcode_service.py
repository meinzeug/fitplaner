"""
Barcode (EAN-13 / EAN-8) Lookup Service via Open Food Facts.
"""

import httpx
from typing import Optional, Dict, Any


DEMO_BARCODES: Dict[str, Dict[str, Any]] = {
    "4014400900010": {
        "name": "Kölln Echte Haferflocken Zart",
        "brand": "Kölln",
        "quantity": 500.0,
        "unit": "g",
        "category": "Vollkorn & Hülsenfrüchte",
        "nutri_score": "A",
        "mhd_estimate_days": 180,
    },
    "4311501683226": {
        "name": "BioBio Natur Skyr",
        "brand": "Netto BioBio",
        "quantity": 500.0,
        "unit": "g",
        "category": "Proteinquellen",
        "nutri_score": "A",
        "mhd_estimate_days": 18,
    },
    "4311501742916": {
        "name": "Gut Ponholz Hähnchenbrustfilet",
        "brand": "Netto",
        "quantity": 400.0,
        "unit": "g",
        "category": "Proteinquellen",
        "nutri_score": "A",
        "mhd_estimate_days": 4,
    },
    "4311501482010": {
        "name": "Deutscher Brokkoli",
        "brand": "Gartenkrone",
        "quantity": 500.0,
        "unit": "g",
        "category": "Obst & Gemüse",
        "nutri_score": "A",
        "mhd_estimate_days": 7,
    },
}


async def lookup_barcode(barcode: str) -> Optional[Dict[str, Any]]:
    """
    Looks up a product by EAN barcode via Open Food Facts or local demo database.
    """
    clean_code = barcode.strip()

    # 1. Check local quick cache/demo
    if clean_code in DEMO_BARCODES:
        demo = dict(DEMO_BARCODES[clean_code])
        demo["barcode"] = clean_code
        demo["source"] = "Catalog"
        return demo

    # 2. Query Open Food Facts public API
    url = f"https://world.openfoodfacts.org/api/v0/product/{clean_code}.json"
    headers = {"User-Agent": "NettoNPPlaner/1.0"}

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == 1:
                    prod = data.get("product", {})
                    name = prod.get("product_name_de") or prod.get("product_name") or f"Produkt {clean_code}"
                    brand = prod.get("brands")
                    qty_str = prod.get("quantity", "")

                    # Extract number and unit
                    qty = 500.0
                    unit = "g"
                    if "g" in qty_str.lower():
                        import re
                        m = re.search(r"(\d+)", qty_str)
                        if m:
                            qty = float(m.group(1))
                            unit = "g"
                    elif "ml" in qty_str.lower() or "l" in qty_str.lower():
                        unit = "ml"
                        qty = 500.0

                    return {
                        "barcode": clean_code,
                        "name": name,
                        "brand": brand,
                        "quantity": qty,
                        "unit": unit,
                        "category": "Lebensmittel",
                        "nutri_score": (prod.get("nutriscore_grade") or "A").upper(),
                        "source": "Open Food Facts",
                        "mhd_estimate_days": 30,
                    }
    except Exception:
        pass

    # Generic fallback for unlisted barcodes
    return {
        "barcode": clean_code,
        "name": f"Artikel #{clean_code[-4:]}",
        "brand": "Unbekannt",
        "quantity": 500.0,
        "unit": "g",
        "category": "Vorratskammer",
        "nutri_score": "B",
        "source": "Manuelle Erfassung",
        "mhd_estimate_days": 14,
    }

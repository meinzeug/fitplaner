"""
Receipt Scanner and Parser for Netto Marken-Discount & NP Discount receipts.
"""

import re
from datetime import datetime
from typing import List
from backend.models import ReceiptScanResult, ReceiptItem


def parse_supermarket_receipt(raw_text: str) -> ReceiptScanResult:
    """
    Parses digital receipts or OCR text from Netto, NP, or general German supermarket receipts.
    """
    lines = raw_text.strip().split("\n")
    store_name = "Supermarkt"
    date_str = datetime.now().strftime("%d.%m.%Y")
    items: List[ReceiptItem] = []
    total_amount = 0.0

    lower_full = raw_text.lower()
    if "netto" in lower_full:
        store_name = "Netto Marken-Discount"
    elif "np" in lower_full or "niedrig-preis" in lower_full or "edeka" in lower_full:
        store_name = "NP Discount"

    # Search for date in text: DD.MM.YYYY or DD.MM.YY
    date_match = re.search(r"\b(\d{2}\.\d{2}\.\d{2,4})\b", raw_text)
    if date_match:
        date_str = date_match.group(1)

    # Regex for receipt item line:
    # Example 1: "BIO HAFERFLOCKEN 0,79 B"
    # Example 2: "BROKKOLI 500G 1.19"
    # Example 3: "1x SKYR NATUR  1,19"
    item_pattern = re.compile(
        r"^(?:(\d+)\s*[xX]\s*)?([A-Za-zÄÖÜäöüß0-9\s\.\,\-\/]+?)\s+(\d+[\,\.]\d{2})\s*(?:[A-Z])?$",
        re.MULTILINE
    )

    ignore_words = [
        "summe", "total", "bar", "kartenzahlung", "geg", "rückgeld", "eur", "mwst",
        "netto", "rabatt", "aktionsrabatt", "kassierer", "pfand", "bon", "datum",
        "uhrzeit", "filiale", "vielen dank", "kartenzahlung"
    ]

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue

        # Check for sum line
        if any(w in line_clean.lower() for w in ["summe", "gesamt", "total"]):
            sum_m = re.search(r"(\d+[\,\.]\d{2})", line_clean)
            if sum_m:
                total_amount = float(sum_m.group(1).replace(",", "."))
            continue

        match = item_pattern.match(line_clean)
        if match:
            qty_raw, name_raw, price_raw = match.groups()
            name = name_raw.strip()

            # Skip header / footer keywords
            if any(w in name.lower() for w in ignore_words) or len(name) < 3:
                continue

            price = float(price_raw.replace(",", "."))
            qty = float(qty_raw) if qty_raw else 1.0

            # Determine category
            name_low = name.lower()
            if any(w in name_low for w in ["brokkoli", "paprika", "gurke", "apfel", "beeren", "tomate", "gemüse", "obst", "avocado", "kartoffel"]):
                cat = "Obst & Gemüse"
            elif any(w in name_low for w in ["hähnchen", "pute", "lachs", "fisch", "skyr", "quark", "frischkäse", "ei", "fleisch", "feta"]):
                cat = "Proteinquellen"
            elif any(w in name_low for w in ["hafer", "flocken", "reis", "nudeln", "quinoa", "linsen", "kichererbsen", "brot", "knäcke"]):
                cat = "Vollkorn & Hülsenfrüchte"
            elif any(w in name_low for w in ["walnuss", "mandel", "nuss", "chia", "öl", "olivenöl"]):
                cat = "Gesunde Fette & Nüsse"
            else:
                cat = "Vorratskammer"

            items.append(
                ReceiptItem(
                    name=name.title(),
                    price=price,
                    quantity=qty,
                    unit="Stück",
                    matched_pantry_category=cat,
                )
            )

    if total_amount == 0.0 and items:
        total_amount = round(sum(i.price for i in items), 2)

    return ReceiptScanResult(
        store_name=store_name,
        date=date_str,
        items=items,
        total_amount=total_amount,
        raw_text=raw_text,
    )

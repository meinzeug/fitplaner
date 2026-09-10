"""
Shopping List Aggregator with Multi-Supermarket Store Separation,
Realistic Pack-Size & Price Logic, Pantry Stock Deduction, and In-Store Walkway Sort.
Supports Netto, NP, Lidl, Aldi, Rewe, Kaufland, and Edeka.
"""

import math
import hashlib
from typing import Dict, Tuple, List, Optional
from backend.models import WeeklyPlan, ShoppingList, ShoppingItem, CustomShoppingItem
from backend.pantry.inventory_manager import find_pantry_item_by_name
from backend.nutrition.price_database import get_product_price, get_realistic_pack_size


def generate_product_barcode(product_name: str, retailer: str = "Netto") -> str:
    """Generates a mathematically valid EAN-13 barcode deterministically."""
    store_prefixes = {
        "Netto": "430",
        "NP": "431",
        "Lidl": "405",
        "Aldi Nord": "401",
        "Aldi Süd": "402",
        "Aldi": "401",
        "Rewe": "426",
        "Kaufland": "433",
        "Edeka": "400",
        "Vorratskammer": "420",
    }
    prefix = store_prefixes.get(retailer, "430")
    digest = hashlib.md5(f"{retailer}:{product_name.lower()}".encode("utf-8")).hexdigest()
    numeric_suffix = "".join(str(int(c, 16) % 10) for c in digest)[:9]
    base12 = f"{prefix}{numeric_suffix}"
    total = sum(int(ch) * (1 if i % 2 == 0 else 3) for i, ch in enumerate(base12))
    check = (10 - (total % 10)) % 10
    return f"{base12}{check}"


def resolve_product_details(name: str, retailer: str, pack_size: Optional[float] = None, unit: str = "g") -> Tuple[str, str, str]:
    """Resolves authentic German private label brand, exact article name, and EAN-13 barcode."""
    n = name.lower()
    ret = retailer or "Netto"

    # Store brand selector for authentic products
    if "netto" in ret.lower():
        bio_b, dairy_b, meat_b, basic_b, fish_b = "BioBio", "Gutes Land", "Gut Ponholz", "Beste Ernte", "Sea Gold"
    elif "np" in ret.lower() or "edeka" in ret.lower():
        bio_b, dairy_b, meat_b, basic_b, fish_b = "EDEKA Bio", "GUT&GÜNSTIG", "GUT&GÜNSTIG", "GUT&GÜNSTIG", "EDEKA"
    elif "lidl" in ret.lower():
        bio_b, dairy_b, meat_b, basic_b, fish_b = "Bio Organic", "Milbona", "Metzgermeister", "Freshona", "Ocean Sea"
    elif "aldi" in ret.lower():
        bio_b, dairy_b, meat_b, basic_b, fish_b = "Gut Bio", "Milsani", "Meine Metzgerei", "King's Crown", "Almare Seafood"
    elif "rewe" in ret.lower():
        bio_b, dairy_b, meat_b, basic_b, fish_b = "REWE Bio", "ja!", "Wilhelm Brandenburg", "REWE Beste Wahl", "ja!"
    elif "kaufland" in ret.lower():
        bio_b, dairy_b, meat_b, basic_b, fish_b = "K-Bio", "K-Classic", "K-Purland", "K-Classic", "K-Classic"
    else:
        bio_b, dairy_b, meat_b, basic_b, fish_b = "Bio-Marke", "Haushaltsmarke", "Fleischerei", "Basis", "Fangfrisch"

    pack_str = f" ({int(pack_size) if pack_size and float(pack_size).is_integer() else pack_size}{unit})" if pack_size else ""

    if any(k in n for k in ["lachs", "thunfisch", "forelle", "fisch", "kabeljau", "garnele"]):
        brand = fish_b
        exact = f"{brand} Frisches {name}{pack_str}"
    elif any(k in n for k in ["hähnchen", "pute", "hack", "rind", "steak", "fleisch"]):
        brand = meat_b
        exact = f"{brand} Frische/s {name}{pack_str}"
    elif any(k in n for k in ["quark", "skyr", "joghurt", "milch", "käse", "feta", "frischkäse", "butter", "mozzarella", "gouda", "sahne"]):
        brand = dairy_b
        exact = f"{brand} {name}{pack_str}"
    elif any(k in n for k in ["haferflocken", "leinsamen", "chiasamen", "quinoa", "reis", "linsen", "couscous", "bulgur", "tofu"]):
        brand = bio_b
        exact = f"{brand} Bio-{name}{pack_str}"
    elif any(k in n for k in ["apfel", "äpfel", "banane", "beere", "spinat", "brokkoli", "gurke", "tomate", "avocado", "paprika", "zucchini", "karotte", "kartoffel"]):
        brand = bio_b
        exact = f"{brand} Frische/r {name} (Klasse I)"
    elif "ei" in n:
        brand = bio_b
        exact = f"{brand} Frische Bio-Eier Freilandhaltung 10er"
    else:
        brand = basic_b
        exact = f"{brand} {name}{pack_str}"

    barcode = generate_product_barcode(name, ret)
    return exact, brand, barcode


_custom_shopping_items: List[CustomShoppingItem] = []


def get_custom_shopping_items() -> List[CustomShoppingItem]:
    return _custom_shopping_items


def add_custom_shopping_item(item: CustomShoppingItem) -> CustomShoppingItem:
    _custom_shopping_items.append(item)
    return item


def delete_custom_shopping_item(item_id: str) -> bool:
    global _custom_shopping_items
    initial_len = len(_custom_shopping_items)
    _custom_shopping_items = [i for i in _custom_shopping_items if i.id != item_id]
    return len(_custom_shopping_items) < initial_len


def get_substitutes_for_item(name: str) -> List[str]:
    """Returns smart in-store substitute options if an item is sold out."""
    lower_name = name.lower()
    if "brokkoli" in lower_name:
        return ["Zucchini frisch", "TK Kaisergemüse", "Blumenkohl"]
    elif "lachs" in lower_name:
        return ["Forellenfilet", "Kabeljaufilet", "Hähnchenbrust"]
    elif "hähnchen" in lower_name or "pute" in lower_name:
        return ["Putenbrustfilet", "Bio-Tofu natur", "Rinderhack mager"]
    elif "skyr" in lower_name or "quark" in lower_name:
        return ["Magerquark", "Griechischer Joghurt 0%", "Körniger Frischkäse"]
    elif "avocado" in lower_name:
        return ["Walnüsse", "Natives Olivenöl", "Sonnenblumenkerne"]
    elif "beere" in lower_name:
        return ["TK Beerenmischung", "Bio-Äpfel", "Bananen"]
    elif "quinoa" in lower_name:
        return ["Naturreis", "Bulgur", "Couscous"]
    elif "spinat" in lower_name:
        return ["Feldsalat", "Rucola", "TK Blattspinat"]
    elif "tomate" in lower_name:
        return ["Rote Paprika", "Dosentomaten stückig", "Gurke"]
    return ["Gleiche Produktgruppe im Regal prüfen", "Günstige Discounter-Eigenmarke wählen"]


def generate_shopping_list_from_plan(
    plan: WeeklyPlan,
    custom_items: Optional[List[CustomShoppingItem]] = None
) -> ShoppingList:
    """
    Sums up all required ingredients for all family members across the whole week.
    Separates items into Netto, NP, Lidl, Aldi, Rewe, Kaufland, Edeka, and Pantry.
    Uses realistic German supermarket prices, pack-size logic, and pantry stock deduction.
    """
    aggregated: Dict[Tuple[str, str], Dict[str, Any]] = {}

    for day in plan.days:
        for member_id, meal_portions in day.portions.items():
            for meal_key in ["breakfast", "lunch", "dinner"]:
                portion = meal_portions.get(meal_key)
                if not portion:
                    continue

                for ing in portion.scaled_ingredients:
                    raw_ret = ing.matched_retailer or "Vorratskammer"
                    ret_lower = raw_ret.lower()
                    if "netto" in ret_lower:
                        store = "Netto"
                    elif "np" in ret_lower:
                        store = "NP"
                    elif "lidl" in ret_lower:
                        store = "Lidl"
                    elif "aldi" in ret_lower:
                        store = "Aldi Nord" if "nord" in ret_lower else "Aldi Süd"
                    elif "rewe" in ret_lower:
                        store = "Rewe"
                    elif "kaufland" in ret_lower:
                        store = "Kaufland"
                    elif "edeka" in ret_lower:
                        store = "Edeka"
                    else:
                        store = "Vorratskammer"

                    cat = "Frische Lebensmittel"
                    lower_name = ing.name.lower()
                    if any(w in lower_name for w in ["apfel", "äpfel", "heidelbeere", "beere", "himbeere", "erdbeere", "gurke", "paprika", "brokkoli", "süßkartoffel", "spinat", "avocado", "tomate", "zucchini", "karotte", "kartoffel", "zwiebel", "knoblauch", "zitrone", "ingwer"]):
                        cat = "Obst & Gemüse"
                    elif any(w in lower_name for w in ["lachs", "hähnchen", "pute", "rind", "steak", "ei", "quark", "skyr", "frischkäse", "feta", "thunfisch", "hack", "kabeljau", "forelle", "garnele", "mozzarella", "gouda", "tofu", "butter", "sahne"]):
                        cat = "Kühlregal / Proteine"
                    elif any(w in lower_name for w in ["haferflocken", "dinkel", "quinoa", "knäckebrot", "brot", "wrap", "linsen", "kichererbsen", "bohnen", "reis", "nudeln", "spaghetti", "penne", "couscous", "bulgur", "mehl"]):
                        cat = "Trockensortiment & Vollkorn"
                    elif any(w in lower_name for w in ["walnuss", "mandel", "kürbiskern", "sonnenblumenkern", "chiasamen", "leinsamen", "erdnuss", "tahini", "cashew", "olivenöl", "rapsöl", "leinöl"]):
                        cat = "Nüsse, Kerne & Öle"
                    else:
                        cat = "Gewürze & Basics"

                    clean_name = ing.name.strip()
                    key = (clean_name, ing.unit)
                    if key not in aggregated:
                        aggregated[key] = {"qty": 0.0, "stores": {}, "cat": cat}
                    aggregated[key]["qty"] += ing.amount
                    aggregated[key]["stores"][store] = aggregated[key]["stores"].get(store, 0.0) + ing.amount

    items_netto: List[ShoppingItem] = []
    items_np: List[ShoppingItem] = []
    items_lidl: List[ShoppingItem] = []
    items_aldi: List[ShoppingItem] = []
    items_rewe: List[ShoppingItem] = []
    items_kaufland: List[ShoppingItem] = []
    items_edeka: List[ShoppingItem] = []
    items_pantry: List[ShoppingItem] = []

    total_cost = 0.0
    total_savings = 0.0
    stock_savings = 0.0

    for (name, unit), entry in aggregated.items():
        qty = entry["qty"]
        cat = entry["cat"]

        non_pantry_stores = {s: a for s, a in entry["stores"].items() if s != "Vorratskammer"}
        if non_pantry_stores:
            store = max(non_pantry_stores.items(), key=lambda x: x[1])[0]
        else:
            store = "Vorratskammer"

        if unit in ["g", "ml"]:
            needed_qty = round(qty / 5) * 5
            if needed_qty == 0:
                needed_qty = 5
        elif unit == "Stück":
            needed_qty = round(qty)
            if needed_qty == 0:
                needed_qty = 1
        else:
            needed_qty = round(qty, 1)

        # Realistic price and pack size lookup
        price_info = get_product_price(name)
        pack_size, pack_unit = get_realistic_pack_size(name)
        base_pack_price = price_info.get("pack_price", 1.99) if price_info else 1.99

        # Check existing pantry stock
        pantry_match = find_pantry_item_by_name(name)
        in_stock_qty = pantry_match.current_quantity if pantry_match else 0.0

        if in_stock_qty >= needed_qty:
            is_covered = True
            net_need = 0.0
            packs_to_buy = 0
            estimated_price = 0.0
            savings = round((needed_qty / max(1.0, pack_size)) * base_pack_price, 2)
            leftover = round(in_stock_qty - needed_qty, 1)
            stock_savings += savings
            unit_price = base_pack_price
        else:
            is_covered = False
            if store == "Vorratskammer":
                store = "Netto"
            net_need = max(0.0, needed_qty - in_stock_qty)
            packs_to_buy = max(1, math.ceil(net_need / max(1.0, pack_size)))
            leftover = round((packs_to_buy * pack_size) - net_need, 1)

            is_sale = store in ["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka"]
            if is_sale:
                # Realistic ~18% discount on average for weekly leaflet deals
                unit_price = round(base_pack_price * 0.82, 2)
                estimated_price = round(packs_to_buy * unit_price, 2)
                savings = round(packs_to_buy * (base_pack_price - unit_price), 2)
            else:
                unit_price = base_pack_price
                estimated_price = round(packs_to_buy * unit_price, 2)
                savings = 0.0

            total_cost += estimated_price
            total_savings += savings

        # Supermarket Aisle Walkway Mapping
        lower_name = name.lower()
        if any(w in lower_name for w in ["apfel", "äpfel", "heidelbeere", "beere", "himbeere", "erdbeere", "gurke", "paprika", "brokkoli", "süßkartoffel", "spinat", "avocado", "tomate", "zucchini", "karotte", "kartoffel", "zwiebel", "knoblauch", "zitrone", "ingwer"]):
            aisle = "1. Obst- & Gemüse-Insel"
        elif any(w in lower_name for w in ["lachs", "thunfisch", "hähnchen", "pute", "hack", "rind", "steak", "kabeljau", "forelle", "garnele"]):
            aisle = "3. Fleisch & Frischer Fisch"
        elif any(w in lower_name for w in ["ei", "quark", "skyr", "frischkäse", "feta", "käse", "milch", "mozzarella", "gouda", "tofu", "butter", "sahne"]):
            aisle = "2. Kühlregal & Molkerei"
        elif any(w in lower_name for w in ["haferflocken", "dinkel", "quinoa", "knäckebrot", "brot", "wrap", "linsen", "kichererbsen", "bohnen", "reis", "nudeln", "spaghetti", "penne", "couscous", "bulgur", "mehl", "chiasamen", "walnuss", "mandel"]):
            aisle = "4. Trockensortiment & Vorräte"
        else:
            aisle = "5. Basics & Gewürze"

        substitutes = get_substitutes_for_item(name)
        exact_name, brand, barcode = resolve_product_details(name, store, pack_size, unit)

        item = ShoppingItem(
            name=name,
            total_quantity=needed_qty,
            unit=unit,
            category=cat,
            retailer=store,  # type: ignore
            is_on_sale=(store != "Vorratskammer"),
            unit_price=unit_price,
            total_price=estimated_price,
            savings=savings,
            is_checked=False,
            in_stock_quantity=in_stock_qty,
            net_need_quantity=net_need,
            pack_size=pack_size,
            packs_to_buy=packs_to_buy,
            leftover_after_purchase=leftover,
            is_covered_by_stock=is_covered,
            aisle=aisle,
            substitutes=substitutes,
            exact_product_name=exact_name,
            brand=brand,
            barcode=barcode,
        )

        if is_covered:
            items_pantry.append(item)
        elif store == "Netto":
            items_netto.append(item)
        elif store == "NP":
            items_np.append(item)
        elif store == "Lidl":
            items_lidl.append(item)
        elif "Aldi" in store:
            items_aldi.append(item)
        elif store == "Rewe":
            items_rewe.append(item)
        elif store == "Kaufland":
            items_kaufland.append(item)
        elif store == "Edeka":
            items_edeka.append(item)
        else:
            items_netto.append(item)

    for lst in [items_netto, items_np, items_lidl, items_aldi, items_rewe, items_kaufland, items_edeka, items_pantry]:
        lst.sort(key=lambda x: (x.is_covered_by_stock, x.aisle, x.name))

    items_by_ret: Dict[str, List[ShoppingItem]] = {
        "Netto": items_netto,
        "NP": items_np,
        "Lidl": items_lidl,
        "Aldi": items_aldi,
        "Rewe": items_rewe,
        "Kaufland": items_kaufland,
        "Edeka": items_edeka,
        "Vorratskammer": items_pantry,
    }

    custom = custom_items if custom_items is not None else _custom_shopping_items
    for c in custom:
        if not c.barcode or not c.exact_product_name:
            c_exact, c_brand, c_bc = resolve_product_details(c.name, c.retailer, c.quantity, c.unit)
            if not c.exact_product_name:
                c.exact_product_name = c_exact
            if not c.brand:
                c.brand = c_brand
            if not c.barcode:
                c.barcode = c_bc

    final_price = round(total_cost, 2)
    budget = plan.budget or 120.0
    budget_diff = round(budget - final_price, 2)
    if final_price > budget:
        budget_status = "exceeded"
    elif final_price >= budget * 0.85:
        budget_status = "warning"
    else:
        budget_status = "ok"

    return ShoppingList(
        items_netto=items_netto,
        items_np=items_np,
        items_lidl=items_lidl,
        items_aldi=items_aldi,
        items_rewe=items_rewe,
        items_kaufland=items_kaufland,
        items_edeka=items_edeka,
        items_pantry=items_pantry,
        items_by_retailer=items_by_ret,
        custom_items=custom,
        total_price=final_price,
        total_savings=round(total_savings, 2),
        covered_by_stock_savings=round(stock_savings, 2),
        week_offset=plan.week_offset,
        week_label=plan.week_label,
        budget=budget,
        budget_status=budget_status,  # type: ignore
        budget_difference=budget_diff,
    )


def format_whatsapp_export(shopping_list: ShoppingList) -> str:
    """
    Generates a cleanly formatted text message for WhatsApp/Messenger with multi-supermarket items.
    """
    lines = [
        f"🛒 *MEINE EINKAUFSLISTE ({shopping_list.week_label or 'FitPlaner'})*",
        f"💰 Geschätzter Einkaufspreis: {shopping_list.total_price:.2f} €",
        f"💵 Wöchentliches Budget: {shopping_list.budget:.2f} € (Rest: {shopping_list.budget_difference:+.2f} €)",
        f"🏷️ Ersparnis durch Discounter-Aktionen: ~{shopping_list.total_savings:.2f} €",
    ]

    if shopping_list.covered_by_stock_savings > 0:
        lines.append(f"📦 Durch Vorratslager gespart: ~{shopping_list.covered_by_stock_savings:.2f} €")

    store_sections = [
        ("🟡 *NETTO MARKEN-DISCOUNT:*", shopping_list.items_netto),
        ("🔴 *NP DISCOUNT:*", shopping_list.items_np),
        ("🔵 *LIDL:*", shopping_list.items_lidl),
        ("🔷 *ALDI:*", shopping_list.items_aldi),
        ("🔴 *REWE:*", shopping_list.items_rewe),
        ("🔴 *KAUFLAND:*", shopping_list.items_kaufland),
        ("🟡 *EDEKA:*", shopping_list.items_edeka),
        ("⚪ *BASICS / VORRATSKAMMER:*", shopping_list.items_pantry),
    ]

    for header, items in store_sections:
        if items:
            lines.extend(["", header])
            for item in items:
                if item.is_covered_by_stock:
                    lines.append(f"  ✅ [VORRAT VORHANDEN] {item.name}: {item.in_stock_quantity} {item.unit}")
                else:
                    lines.append(f"  ▫️ {item.name}: {item.packs_to_buy}x Packung ({item.net_need_quantity} {item.unit} benötigt) ~{item.total_price:.2f} €")

    if shopping_list.custom_items:
        lines.extend(["", "📝 *MANUELLE ZUSATZARTIKEL:*"])
        for c in shopping_list.custom_items:
            lines.append(f"  ▫️ {c.name}: {c.quantity} {c.unit} ({c.retailer})")

    lines.append("\n_Erstellt mit FitPlaner (Netto, NP, Lidl, Aldi, Rewe & Co.)_ ✨")
    return "\n".join(lines)

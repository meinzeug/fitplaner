"""
Shopping List Aggregator with Store Separation, Pack-Size Logic, and Pantry Stock Deduction.
"""

import math
from typing import Dict, Tuple, List, Optional
from backend.models import WeeklyPlan, ShoppingList, ShoppingItem, CustomShoppingItem
from backend.pantry.inventory_manager import get_all_pantry_items, get_pack_size, find_pantry_item_by_name


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
        return ["Forellenfilet", "Kabeljau / Seelachs", "Hähnchenbrust"]
    elif "hähnchen" in lower_name or "pute" in lower_name:
        return ["Putenbrust", "Bio-Tofu natur", "Rinderhack mager"]
    elif "skyr" in lower_name or "quark" in lower_name:
        return ["Magerquark", "Griechischer Joghurt 0%", "Körniger Frischkäse"]
    elif "avocado" in lower_name:
        return ["Walnüsse", "Natives Olivenöl", "Bio-Hummus"]
    elif "beere" in lower_name:
        return ["TK Beerenmischung", "Bio-Äpfel", "Bananen"]
    elif "quinoa" in lower_name:
        return ["Vollkornreis", "Bulgur", "Hirse"]
    elif "spinat" in lower_name:
        return ["Mangold", "Feldsalat", "Rucola", "TK Blattspinat"]
    elif "tomate" in lower_name:
        return ["Rote Paprika", "Dosentomaten stückig", "Gurke"]
    return ["Gleiche Produktgruppe im Regal prüfen", "Netto / NP Eigenmarke wählen"]


def generate_shopping_list_from_plan(
    plan: WeeklyPlan,
    custom_items: Optional[List[CustomShoppingItem]] = None
) -> ShoppingList:
    """
    Sums up all required ingredients for all family members across the whole week.
    Accounts for existing pantry stock, pack sizes, and leftovers.
    """
    # Key: (ingredient_name, unit, retailer) -> quantity
    aggregated: Dict[Tuple[str, str, str, str], float] = {}

    for day in plan.days:
        for member_id, meal_portions in day.portions.items():
            for meal_key in ["breakfast", "lunch", "dinner"]:
                portion = meal_portions.get(meal_key)
                if not portion:
                    continue

                for ing in portion.scaled_ingredients:
                    retailer = ing.matched_retailer or "Vorratskammer"
                    if "Netto" in retailer:
                        store = "Netto"
                    elif "NP" in retailer:
                        store = "NP"
                    else:
                        store = "Vorratskammer"

                    cat = "Frische Lebensmittel"
                    lower_name = ing.name.lower()
                    if any(w in lower_name for w in ["apfel", "heidelbeere", "beere", "gurke", "paprika", "brokkoli", "süßkartoffel", "spinat", "avocado", "tomate"]):
                        cat = "Obst & Gemüse"
                    elif any(w in lower_name for w in ["lachs", "hähnchen", "ei", "quark", "skyr", "frischkäse", "feta", "thunfisch"]):
                        cat = "Kühlregal / Proteine"
                    elif any(w in lower_name for w in ["haferflocken", "quinoa", "knäckebrot", "brot", "wrap", "linsen", "kichererbsen", "reis", "nudeln"]):
                        cat = "Trockensortiment & Vollkorn"
                    else:
                        cat = "Gewürze & Basics"

                    key = (ing.name, ing.unit, store, cat)
                    aggregated[key] = aggregated.get(key, 0.0) + ing.amount

    items_netto = []
    items_np = []
    items_pantry = []

    total_cost = 0.0
    total_savings = 0.0
    stock_savings = 0.0

    for (name, unit, store, cat), qty in aggregated.items():
        if unit in ["g", "ml"]:
            needed_qty = round(qty / 10) * 10
            if needed_qty == 0:
                needed_qty = 10
        elif unit == "Stück":
            needed_qty = round(qty)
            if needed_qty == 0:
                needed_qty = 1
        else:
            needed_qty = round(qty, 1)

        # Check existing pantry stock
        pantry_match = find_pantry_item_by_name(name)
        in_stock_qty = pantry_match.current_quantity if pantry_match else 0.0

        pack_size, _ = get_pack_size(name, unit)

        if in_stock_qty >= needed_qty:
            # Completely covered by pantry!
            is_covered = True
            net_need = 0.0
            packs_to_buy = 0
            estimated_price = 0.0
            savings = round((needed_qty / max(1.0, pack_size)) * 1.99, 2)
            leftover = round(in_stock_qty - needed_qty, 1)
            stock_savings += savings
        else:
            is_covered = False
            net_need = max(0.0, needed_qty - in_stock_qty)
            packs_to_buy = max(1, math.ceil(net_need / max(1.0, pack_size)))
            leftover = round((packs_to_buy * pack_size) - net_need, 1)

            is_sale = store in ["Netto", "NP"]
            if is_sale:
                unit_price = 1.49
                estimated_price = round(packs_to_buy * 1.69, 2)
                savings = round(estimated_price * 0.30, 2)
            else:
                unit_price = 0.99
                estimated_price = round(packs_to_buy * 1.19, 2)
                savings = 0.0

            total_cost += estimated_price
            total_savings += savings

        # Supermarket Aisle Walkway Mapping (Netto / NP)
        lower_name = name.lower()
        if any(w in lower_name for w in ["apfel", "heidelbeere", "beere", "gurke", "paprika", "brokkoli", "süßkartoffel", "spinat", "avocado", "tomate"]):
            aisle = "1. Obst- & Gemüse-Insel"
        elif any(w in lower_name for w in ["lachs", "thunfisch", "hähnchen", "pute", "hackfleisch"]):
            aisle = "3. Fleisch & Frischer Fisch"
        elif any(w in lower_name for w in ["ei", "quark", "skyr", "frischkäse", "feta", "käse", "milch", "mandelmilch"]):
            aisle = "2. Kühlregal & Molkerei"
        elif any(w in lower_name for w in ["haferflocken", "quinoa", "knäckebrot", "brot", "wrap", "linsen", "kichererbsen", "reis", "nudeln", "penne", "chiasamen", "walnuss"]):
            aisle = "4. Trockensortiment & Vorräte"
        else:
            aisle = "5. Basics & Gewürze"

        # Smart In-Store Substitutes (if sold out)
        substitutes = get_substitutes_for_item(name)

        item = ShoppingItem(
            name=name,
            total_quantity=needed_qty,
            unit=unit,
            category=cat,
            retailer=store,  # type: ignore
            is_on_sale=(store in ["Netto", "NP"]),
            unit_price=1.49 if store in ["Netto", "NP"] else 0.99,
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
        )

        if store == "Netto":
            items_netto.append(item)
        elif store == "NP":
            items_np.append(item)
        else:
            items_pantry.append(item)

    items_netto.sort(key=lambda x: (x.is_covered_by_stock, x.aisle, x.name))
    items_np.sort(key=lambda x: (x.is_covered_by_stock, x.aisle, x.name))
    items_pantry.sort(key=lambda x: (x.is_covered_by_stock, x.aisle, x.name))

    custom = custom_items if custom_items is not None else _custom_shopping_items
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
        items_pantry=items_pantry,
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
    Generates a cleanly formatted text message for WhatsApp/Messenger with pantry & custom items.
    """
    lines = [
        f"🛒 *MEINE EINKAUFSLISTE ({shopping_list.week_label or 'FitPlaner'})*",
        f"💰 Geschätzter Einkaufspreis: {shopping_list.total_price:.2f} €",
        f"💵 Wöchentliches Budget: {shopping_list.budget:.2f} € (Rest: {shopping_list.budget_difference:+.2f} €)",
        f"🏷️ Ersparnis durch Netto/NP Rabatte: ~{shopping_list.total_savings:.2f} €",
    ]

    if shopping_list.covered_by_stock_savings > 0:
        lines.append(f"📦 Durch Vorratslager gespart: ~{shopping_list.covered_by_stock_savings:.2f} €")

    lines.extend(["", "🟡 *NETTO MARKEN-DISCOUNT:*"])
    for item in shopping_list.items_netto:
        if item.is_covered_by_stock:
            lines.append(f"  ✅ [VORRAT VORHANDEN] {item.name}: {item.in_stock_quantity} {item.unit}")
        else:
            lines.append(f"  ▫️ {item.name}: {item.packs_to_buy}x Packung ({item.net_need_quantity} {item.unit} benötigt) ~{item.total_price:.2f} €")

    lines.extend(["", "🔴 *NP DISCOUNT:*"])
    for item in shopping_list.items_np:
        if item.is_covered_by_stock:
            lines.append(f"  ✅ [VORRAT VORHANDEN] {item.name}: {item.in_stock_quantity} {item.unit}")
        else:
            lines.append(f"  ▫️ {item.name}: {item.packs_to_buy}x Packung ({item.net_need_quantity} {item.unit} benötigt) ~{item.total_price:.2f} €")

    lines.extend(["", "⚪ *BASICS / VORRATSKAMMER:*"])
    for item in shopping_list.items_pantry:
        if item.is_covered_by_stock:
            lines.append(f"  ✅ [VORRAT VORHANDEN] {item.name}")
        else:
            lines.append(f"  ▫️ {item.name}: {item.packs_to_buy}x ({item.net_need_quantity} {item.unit})")

    if shopping_list.custom_items:
        lines.extend(["", "📝 *MANUELLE ZUSATZARTIKEL:*"])
        for c in shopping_list.custom_items:
            lines.append(f"  ▫️ {c.name}: {c.quantity} {c.unit} ({c.retailer})")

    lines.append("\n_Erstellt mit FitPlaner (Netto & NP)_ ✨")
    return "\n".join(lines)

"""
FastAPI Main Application for FitPlaner (Netto & NP Smart Nutrition & Family Manager).
Includes Pantry Management, MHD, Barcode, Receipt Scanner, Time-of-day Assistant & Leaflets.
"""

import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.models import (
    FamilyMember, ProductOffer, WeeklyPlan, ShoppingList,
    Recipe, IngredientAnalysis, PantryItem, CustomShoppingItem,
    ReceiptScanResult, LeafletBrochure, BudgetInfo, UpdateBudgetRequest,
    DailyHubResponse, UpdateDailyStatusRequest, ScaledIngredient,
    ScheduleTimeSettings, TimelineTask, DailyTimelineResponse,
    UpdateScheduleSettingsRequest, ToggleTaskRequest, PrepTomorrowSummary
)
from backend.nutrition.calculator import enrich_family_member
from backend.nutrition.ingredient_analyzer import (
    fetch_open_food_facts_analysis, analyze_ingredient_locally
)
from backend.nutrition.recipe_database import RECIPES_DATABASE
from backend.schedule.timeline_engine import (
    generate_daily_timeline, get_schedule_settings,
    update_schedule_settings, toggle_timeline_task, reset_timeline_tasks
)
from backend.scrapers.marktguru_client import get_all_supermarket_offers
from backend.scrapers.leaflets import get_all_leaflets
from backend.scanners.barcode_service import lookup_barcode
from backend.scanners.receipt_scanner import parse_supermarket_receipt
from backend.pantry.inventory_manager import (
    get_all_pantry_items, add_or_update_pantry_item, delete_pantry_item,
    deduct_consumption, book_shopping_cart_to_pantry
)
from backend.planner.generator import generate_weekly_plan, swap_meal_in_plan
from backend.planner.shopping_list import (
    generate_shopping_list_from_plan, format_whatsapp_export,
    get_custom_shopping_items, add_custom_shopping_item, delete_custom_shopping_item,
    get_substitutes_for_item
)
from backend.installer import (
    get_installer_info, register_device, remove_device,
    PairDeviceRequest, InstallerInfoResponse, PairedDevice, get_apk_path,
    get_lan_ip
)
from backend.network_discovery import (
    start_discovery_service, send_udp_broadcast_ping,
    scan_subnet_fast, register_http_ping, DiscoveredDevice
)


app = FastAPI(
    title="FitPlaner Netto & NP API",
    description="Intelligenter Ernährungsplaner, Familien-Manager, Lagerverwaltung & Kassenbon-Scanner",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initial default profiles
DEFAULT_MEMBERS_DATA = [
    {
        "id": "mem-1",
        "name": "Dennis",
        "gender": "male",
        "age": 32,
        "height_cm": 184,
        "weight_kg": 85,
        "activity_level": "moderate",
        "goal": "gain_muscle",
        "dietary_preference": "high_protein",
        "allergies": [],
    },
    {
        "id": "mem-2",
        "name": "Sarah",
        "gender": "female",
        "age": 30,
        "height_cm": 168,
        "weight_kg": 64,
        "activity_level": "moderate",
        "goal": "lose_weight",
        "dietary_preference": "all",
        "allergies": [],
    },
]

family_profiles: List[FamilyMember] = [enrich_family_member(m) for m in DEFAULT_MEMBERS_DATA]
weekly_plans_store: Dict[int, WeeklyPlan] = {}
weekly_budgets_store: Dict[int, float] = {}
daily_hub_state: Dict[str, Any] = {
    "work_end_time": "17:00",
    "fresh_pick_bought": False,
    "lunchbox_packed": False,
    "dinner_cooked": False,
}


def get_or_create_weekly_plan(week_offset: int = 0) -> WeeklyPlan:
    global weekly_plans_store, weekly_budgets_store, family_profiles
    if not family_profiles:
        for m in DEFAULT_MEMBERS_DATA:
            family_profiles.append(enrich_family_member(m))
    if week_offset not in weekly_budgets_store:
        weekly_budgets_store[week_offset] = 120.0
    budget = weekly_budgets_store[week_offset]
    if week_offset not in weekly_plans_store:
        weekly_plans_store[week_offset] = generate_weekly_plan(
            family_members=family_profiles,
            week_offset=week_offset,
            budget=budget
        )
    return weekly_plans_store[week_offset]


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "FitPlaner-Netto-NP"}


# -----------------------------------------------------------
# FAMILIEN-PROFIL ROUTEN
# -----------------------------------------------------------

@app.get("/api/profiles", response_model=List[FamilyMember])
@app.get("/api/family", response_model=List[FamilyMember])
def get_family_members():
    return family_profiles


class MemberInput(BaseModel):
    id: Optional[str] = None
    name: str
    gender: str
    age: int
    height_cm: float
    weight_kg: float
    activity_level: str
    goal: str
    dietary_preference: str = "all"
    allergies: List[str] = []


@app.post("/api/profiles", response_model=FamilyMember)
def save_family_member(input_data: MemberInput):
    member_dict = input_data.model_dump()
    if not member_dict.get("id"):
        member_dict["id"] = f"mem-{len(family_profiles) + 1}"

    enriched = enrich_family_member(member_dict)
    for i, m in enumerate(family_profiles):
        if m.id == enriched.id:
            family_profiles[i] = enriched
            return enriched

    family_profiles.append(enriched)
    return enriched


@app.delete("/api/profiles/{member_id}")
def delete_family_member(member_id: str):
    global family_profiles
    family_profiles = [m for m in family_profiles if m.id != member_id]
    return {"success": True, "deleted_id": member_id}


# -----------------------------------------------------------
# LAGERVERWALTUNG & MHD ROUTEN
# -----------------------------------------------------------

@app.get("/api/pantry", response_model=List[PantryItem])
def get_pantry():
    return get_all_pantry_items()


@app.post("/api/pantry", response_model=PantryItem)
def save_pantry_item(item: PantryItem):
    if not item.id:
        import uuid
        item.id = f"pan-{uuid.uuid4().hex[:6]}"
    return add_or_update_pantry_item(item)


@app.delete("/api/pantry/{item_id}")
def remove_pantry_item(item_id: str):
    success = delete_pantry_item(item_id)
    return {"success": success, "id": item_id}


class BookCartRequest(BaseModel):
    items: List[Dict[str, Any]]


@app.post("/api/pantry/book-cart")
def book_cart_items(req: BookCartRequest):
    """
    Transfers purchased supermarket items with pack sizes into the pantry stock.
    """
    booked = book_shopping_cart_to_pantry(req.items)
    return {"success": True, "booked_count": len(booked), "items": booked}


class CookMealRequest(BaseModel):
    day_index: int
    meal_type: str  # breakfast, lunch, dinner
    week_offset: int = 0


@app.post("/api/pantry/cook-meal")
def cook_and_deduct_meal(req: CookMealRequest):
    """
    Marks a planned meal as cooked and automatically deducts family ingredient consumption from the pantry.
    """
    plan = get_or_create_weekly_plan(req.week_offset)
    if req.day_index < 0 or req.day_index >= len(plan.days):
        raise HTTPException(status_code=400, detail="Ungültiger Tag oder Wochenplan nicht vorhanden.")

    day = plan.days[req.day_index]

    # Mark as cooked
    if req.meal_type == "breakfast":
        day.is_breakfast_cooked = True
    elif req.meal_type == "lunch":
        day.is_lunch_cooked = True
    elif req.meal_type == "dinner":
        day.is_dinner_cooked = True

    # Aggregate scaled ingredients across all members for this meal
    total_ingredients_consumed = []
    for member_id, meals in day.portions.items():
        portion = meals.get(req.meal_type)
        if portion:
            total_ingredients_consumed.extend(portion.scaled_ingredients)

    # Deduct from pantry
    audit_log = deduct_consumption(total_ingredients_consumed)

    return {
        "success": True,
        "day": day.day_name,
        "meal_type": req.meal_type,
        "deduction_log": audit_log,
        "updated_plan": plan,
    }


# -----------------------------------------------------------
# BARCODE & KASSENBON SCANNER ROUTEN
# -----------------------------------------------------------

class BarcodeRequest(BaseModel):
    barcode: str


@app.post("/api/scanners/barcode")
async def scan_barcode_endpoint(req: BarcodeRequest):
    result = await lookup_barcode(req.barcode)
    if not result:
        raise HTTPException(status_code=404, detail="Barcode nicht gefunden.")
    return result


class ReceiptScanRequest(BaseModel):
    receipt_text: str


@app.post("/api/scanners/receipt", response_model=ReceiptScanResult)
def scan_receipt_endpoint(req: ReceiptScanRequest):
    return parse_supermarket_receipt(req.receipt_text)


# -----------------------------------------------------------
# PROSPEKTE (LEAFLETS) ROUTEN
# -----------------------------------------------------------

@app.get("/api/leaflets", response_model=List[LeafletBrochure])
def get_brochures():
    return get_all_leaflets()


# -----------------------------------------------------------
# SMART TIME-OF-DAY ASSISTANT ("WAS STEHT JETZT AN?")
# -----------------------------------------------------------

@app.get("/api/time-of-day")
def get_time_of_day_recommendation():
    now = datetime.now()
    hour = now.hour
    day_idx = now.weekday()  # 0=Monday, 6=Sunday
    if day_idx >= 7:
        day_idx = 0

    if 5 <= hour < 11:
        time_slot = "breakfast"
        greeting = "Guten Morgen!"
        heading = "Dein Brotdosen-Frühstück für heute"
        subtext = "Schnell vorbereitet oder aus dem Kühlschrank gegriffen – perfekt für unterwegs."
        icon = "coffee"
    elif 11 <= hour < 16:
        time_slot = "lunch"
        greeting = "Guten Appetit!"
        heading = "Dein Brotdosen-Mittagessen to-go"
        subtext = "Frisch, sättigend und reich an sauberen Proteinen für dein Nachmittagstief."
        icon = "lunchbox"
    elif 16 <= hour < 22:
        time_slot = "dinner"
        greeting = "Schönen Feierabend!"
        heading = "Heute Abend frisch kochen für die Familie"
        subtext = "Gesundes Abendessen in unter 25 Minuten – Zutaten aus deinem Vorratslager bereitgestellt."
        icon = "pot"
    else:
        time_slot = "night_prep"
        greeting = "Gute Nacht!"
        heading = "Meal-Prep für den morgigen Tag"
        subtext = "Check kurz dein Vorratslager und lass die Overnight Oats im Kühlschrank quellen."
        icon = "moon"

    plan = get_or_create_weekly_plan(0)
    current_day = plan.days[min(6, day_idx)]
    suggested_recipe = (
        current_day.breakfast if time_slot == "breakfast" or time_slot == "night_prep" else
        current_day.lunch if time_slot == "lunch" else
        current_day.dinner
    )

    return {
        "time_slot": time_slot,
        "greeting": greeting,
        "heading": heading,
        "subtext": subtext,
        "icon": icon,
        "current_day_name": current_day.day_name,
        "day_index": day_idx,
        "suggested_recipe": suggested_recipe,
    }


# -----------------------------------------------------------
# MANUELLE ZUSATZARTIKEL ROUTEN
# -----------------------------------------------------------

@app.get("/api/custom-shopping-items", response_model=List[CustomShoppingItem])
def get_custom_items():
    return get_custom_shopping_items()


@app.post("/api/custom-shopping-items", response_model=CustomShoppingItem)
def create_custom_item(item: CustomShoppingItem):
    if not item.id:
        import uuid
        item.id = f"custom-{uuid.uuid4().hex[:6]}"
    return add_custom_shopping_item(item)


@app.delete("/api/custom-shopping-items/{item_id}")
def delete_custom_item(item_id: str):
    success = delete_custom_shopping_item(item_id)
    return {"success": success, "id": item_id}


# -----------------------------------------------------------
# ANGEBOTE, REZEPTE & WOCHENPLAN ROUTEN
# -----------------------------------------------------------

@app.get("/api/offers", response_model=List[ProductOffer])
async def get_offers(
    zip_code: str = Query("30159", description="PLZ"),
    only_healthy: bool = Query(True, description="Nur gesunde Lebensmittel filtern"),
    search: Optional[str] = Query(None, description="Suchbegriff")
):
    offers = await get_all_supermarket_offers(zip_code=zip_code, only_healthy=only_healthy)
    if search:
        s = search.lower()
        offers = [o for o in offers if s in o.title.lower() or s in (o.brand or "").lower()]
    return offers


class IngredientQuery(BaseModel):
    product_name: str
    known_ingredients: Optional[str] = None


@app.post("/api/analyze-ingredient", response_model=IngredientAnalysis)
async def analyze_product(query: IngredientQuery):
    analysis = await fetch_open_food_facts_analysis(query.product_name)
    if not analysis:
        analysis = analyze_ingredient_locally(query.product_name, query.known_ingredients)
    return analysis


@app.get("/api/recipes", response_model=List[Recipe])
def get_recipes(meal_type: Optional[str] = None):
    if meal_type:
        return [r for r in RECIPES_DATABASE if r.meal_type == meal_type]
    return RECIPES_DATABASE


@app.post("/api/plan/generate", response_model=WeeklyPlan)
def create_weekly_plan(week_offset: int = Query(0, description="Week offset from current week")):
    if not family_profiles:
        raise HTTPException(status_code=400, detail="Mindestens ein Familienmitglied muss angelegt sein.")
    budget = weekly_budgets_store.get(week_offset, 120.0)
    plan = generate_weekly_plan(family_members=family_profiles, week_offset=week_offset, budget=budget)
    weekly_plans_store[week_offset] = plan
    return plan


@app.get("/api/plan/current", response_model=WeeklyPlan)
@app.get("/api/plan", response_model=WeeklyPlan)
def get_current_plan(week_offset: int = Query(0, description="Week offset from current week")):
    return get_or_create_weekly_plan(week_offset)


class SwapMealRequest(BaseModel):
    day_index: int
    meal_type: str
    new_recipe_id: str
    week_offset: int = 0


@app.post("/api/plan/swap", response_model=WeeklyPlan)
def swap_meal(req: SwapMealRequest):
    plan = get_or_create_weekly_plan(req.week_offset)
    updated = swap_meal_in_plan(
        plan=plan,
        day_index=req.day_index,
        meal_type=req.meal_type,
        new_recipe_id=req.new_recipe_id,
        family_members=family_profiles,
    )
    weekly_plans_store[req.week_offset] = updated
    return updated


@app.get("/api/shopping-list", response_model=ShoppingList)
def get_shopping_list(week_offset: int = Query(0, description="Week offset from current week")):
    plan = get_or_create_weekly_plan(week_offset)
    return generate_shopping_list_from_plan(plan, get_custom_shopping_items())


@app.get("/api/shopping-list/export-whatsapp")
def export_whatsapp(week_offset: int = Query(0, description="Week offset from current week")):
    plan = get_or_create_weekly_plan(week_offset)
    shopping_list = generate_shopping_list_from_plan(plan, get_custom_shopping_items())
    text = format_whatsapp_export(shopping_list)
    return {"text": text}


# -----------------------------------------------------------
# BUDGETPLANUNG ROUTEN
# -----------------------------------------------------------

@app.get("/api/budget", response_model=BudgetInfo)
def get_budget_info(week_offset: int = Query(0, description="Week offset from current week")):
    plan = get_or_create_weekly_plan(week_offset)
    shopping_list = generate_shopping_list_from_plan(plan, get_custom_shopping_items())
    budget = weekly_budgets_store.get(week_offset, 120.0)
    total_cost = shopping_list.total_price
    diff = round(budget - total_cost, 2)
    percent = round((total_cost / max(1.0, budget)) * 100, 1)

    if total_cost > budget:
        status = "exceeded"
    elif total_cost >= budget * 0.85:
        status = "warning"
    else:
        status = "ok"

    saving_tips = []
    if status == "exceeded":
        saving_tips.append("Tausche teurere Fleischgerichte gegen cremiges Rote-Linsen-Curry oder Kichererbsen-Bowls (-14 €).")
        saving_tips.append("Nutze Haferflocken und Vorräte aus deiner Vorratskammer, um Zusatzkäufe zu sparen.")
        saving_tips.append("Achte gezielt auf die aktuellen Netto- und NP-Gemüseangebote (Brokkoli, Snack-Gurken).")
    elif status == "warning":
        saving_tips.append("Fast am Limit: Greife bei Proteinquellen bevorzugt zu Magerquark oder Skyr aus den Angeboten.")
    else:
        saving_tips.append("Super! Dein Wochenplan liegt voll im Budget und nutzt maximale Rabatte.")

    return BudgetInfo(
        week_offset=week_offset,
        week_label=plan.week_label,
        budget=budget,
        total_cost=total_cost,
        difference=diff,
        percentage_used=percent,
        status=status,
        savings=shopping_list.total_savings + shopping_list.covered_by_stock_savings,
        saving_tips=saving_tips,
    )


@app.post("/api/budget", response_model=BudgetInfo)
def update_budget(req: UpdateBudgetRequest):
    weekly_budgets_store[req.week_offset] = req.budget
    plan = get_or_create_weekly_plan(req.week_offset)
    plan.budget = req.budget
    diff = round(req.budget - plan.total_estimated_cost, 2)
    plan.budget_difference = diff
    if plan.total_estimated_cost > req.budget:
        plan.budget_status = "exceeded"
    elif plan.total_estimated_cost >= req.budget * 0.85:
        plan.budget_status = "warning"
    else:
        plan.budget_status = "ok"
    weekly_plans_store[req.week_offset] = plan
    return get_budget_info(req.week_offset)


# -----------------------------------------------------------
# TAGES-AUTOPILOT (DAILY MISSION HUB) & ERSATZPRODUKTE
# -----------------------------------------------------------

@app.get("/api/daily-hub", response_model=DailyHubResponse)
def get_daily_hub():
    global daily_hub_state, family_profiles
    plan = get_or_create_weekly_plan(0)

    german_days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    now = datetime.now()
    weekday = now.weekday()
    current_day_name = german_days[weekday]
    current_date = now.strftime("%d.%m.%Y")

    hour = now.hour
    if 5 <= hour < 11:
        time_slot = "morning"
    elif 11 <= hour < 16:
        time_slot = "afternoon"
    elif 16 <= hour < 22:
        time_slot = "evening"
    else:
        time_slot = "night"

    day_idx = min(weekday, len(plan.days) - 1)
    day_plan = plan.days[day_idx] if plan.days else None

    work_end = daily_hub_state.get("work_end_time", "17:00")
    if weekday == 6:
        store_open = False
        status_text = "Sonntags geschlossen"
    else:
        store_open = True
        status_text = f"🟢 Geöffnet bis 20:00 Uhr (Feierabend: {work_end} Uhr)"

    # Identify fresh sensitive pick from dinner
    fresh_pick_item = None
    if day_plan and day_plan.dinner:
        for ing in day_plan.dinner.ingredients:
            ing_lower = ing.name.lower()
            total_qty = round(ing.base_amount * max(1, len(family_profiles)), 1)
            if any(k in ing_lower for k in ["lachs", "thunfisch", "garnelen", "forelle", "fisch"]):
                fresh_pick_item = {
                    "name": f"Frisches {ing.name}",
                    "amount": f"{total_qty} {ing.unit}",
                    "retailer": "Netto Marken-Discount",
                    "price": 3.99,
                    "reason": "Frisch nach Feierabend mitnehmen: Garantiert saftig & spart Platz im Kühlschrank!",
                    "tip": "Liegt in der Kühltheke direkt neben dem Eingang."
                }
                break
            elif any(k in ing_lower for k in ["hähnchen", "pute", "hackfleisch", "rinderhack"]):
                fresh_pick_item = {
                    "name": f"Frisches {ing.name}",
                    "amount": f"{total_qty} {ing.unit}",
                    "retailer": "Netto Marken-Discount",
                    "price": 3.49,
                    "reason": "Frisch nach Feierabend mitnehmen: Maximale Frische für das Abendessen!",
                    "tip": "Im Fleischregal, achte auf die Auszeichnung 'Haltungsform 3/4'."
                }
                break
            elif any(k in ing_lower for k in ["spinat", "avocado", "beeren", "brokkoli", "paprika"]):
                fresh_pick_item = {
                    "name": f"Frische/r {ing.name}",
                    "amount": f"{total_qty} {ing.unit}",
                    "retailer": "Netto Marken-Discount",
                    "price": 1.49,
                    "reason": "Frisch nach Feierabend mitnehmen: Knackig & reich an Vitaminen!",
                    "tip": "Gleich am Eingang auf der Obst- & Gemüse-Insel."
                }
                break

    if not fresh_pick_item and day_plan and day_plan.dinner and day_plan.dinner.ingredients:
        first_ing = day_plan.dinner.ingredients[0]
        total_qty = round(first_ing.base_amount * max(1, len(family_profiles)), 1)
        fresh_pick_item = {
            "name": first_ing.name,
            "amount": f"{total_qty} {first_ing.unit}",
            "retailer": "Netto Marken-Discount",
            "price": 1.99,
            "reason": "Frisch nach Feierabend mitnehmen.",
            "tip": "Direkt auf dem Heimweg im Markt einpacken."
        }

    # Lunchbox to-go previews
    lunchbox_breakfast = None
    if day_plan and day_plan.breakfast:
        lunchbox_breakfast = {
            "title": day_plan.breakfast.title,
            "calories": day_plan.breakfast.base_calories,
            "protein": day_plan.breakfast.base_protein_g,
            "prep_time": day_plan.breakfast.prep_time_minutes,
            "lunchbox_ready": day_plan.breakfast.lunchbox_ready,
            "tip": "Morgens in 3 Min. angerührt oder direkt mitnehmen."
        }

    lunchbox_lunch = None
    if day_plan and day_plan.lunch:
        lunchbox_lunch = {
            "title": day_plan.lunch.title,
            "calories": day_plan.lunch.base_calories,
            "protein": day_plan.lunch.base_protein_g,
            "prep_time": day_plan.lunch.prep_time_minutes,
            "lunchbox_ready": day_plan.lunch.lunchbox_ready,
            "tip": "Perfekt für die Mittagspause to-go – kalt genießbar oder kurz erwärmen."
        }

    # Fairer Tellertrick (Haushaltsmaße am Herd)
    dinner_portions: Dict[str, str] = {}
    if day_plan and day_plan.dinner:
        main_word = day_plan.dinner.title.split()[0]
        for m in family_profiles:
            target_cals = getattr(m, "target_calories", 2000) or 2000
            if m.goal == "gain_muscle" or target_cals >= 2400:
                dinner_portions[m.name] = f"🥄 3 volle Kellen {main_word} + 1 gehäufte Handvoll Beilage / Salat"
            elif m.goal == "lose_weight" or target_cals <= 1850:
                dinner_portions[m.name] = f"🥄 1,5 Kellen {main_word} + 2 lockere Hände Gemüse / Salat"
            else:
                dinner_portions[m.name] = f"🥄 2 Kellen {main_word} + 1 Handvoll Beilage & Gemüse"

    return DailyHubResponse(
        current_day_name=current_day_name,
        current_date=current_date,
        day_index=day_idx,
        time_slot=time_slot,
        work_end_time=work_end,
        store_name="Netto Marken-Discount",
        store_closing_time="20:00",
        store_status_text=status_text,
        is_store_open=store_open,
        fresh_pick_item=fresh_pick_item,
        is_fresh_pick_bought=daily_hub_state.get("fresh_pick_bought", False),
        lunchbox_breakfast=lunchbox_breakfast,
        lunchbox_lunch=lunchbox_lunch,
        is_lunchbox_packed=daily_hub_state.get("lunchbox_packed", False),
        dinner_recipe=day_plan.dinner if day_plan else None,
        dinner_plate_portions=dinner_portions,
        is_dinner_cooked=daily_hub_state.get("dinner_cooked", False),
        dishes_badge="🍳 1 Pfanne / Topf (Zero-Stress)",
        cook_time_badge=f"⏱️ {day_plan.dinner.cook_time_minutes if day_plan and day_plan.dinner else 15} Min."
    )


@app.post("/api/daily-hub/action", response_model=DailyHubResponse)
def update_daily_action(req: UpdateDailyStatusRequest):
    global daily_hub_state, family_profiles
    if req.action == "toggle_fresh_pick":
        daily_hub_state["fresh_pick_bought"] = not daily_hub_state.get("fresh_pick_bought", False)
    elif req.action == "toggle_lunchbox":
        daily_hub_state["lunchbox_packed"] = not daily_hub_state.get("lunchbox_packed", False)
    elif req.action == "set_work_time":
        if req.value:
            daily_hub_state["work_end_time"] = req.value.strip()
    elif req.action == "cook_dinner":
        daily_hub_state["dinner_cooked"] = True
        plan = get_or_create_weekly_plan(0)
        day_idx = min(datetime.now().weekday(), len(plan.days) - 1)
        day_plan = plan.days[day_idx] if plan.days else None
        if day_plan and day_plan.dinner:
            scaled_ings = [
                ScaledIngredient(
                    name=ing.name,
                    amount=round(ing.base_amount * max(1, len(family_profiles)), 1),
                    unit=ing.unit
                )
                for ing in day_plan.dinner.ingredients
            ]
            deduct_consumption(scaled_ings)
    elif req.action == "reset_day":
        daily_hub_state["fresh_pick_bought"] = False
        daily_hub_state["lunchbox_packed"] = False
        daily_hub_state["dinner_cooked"] = False
        reset_timeline_tasks()

    return get_daily_hub()


# -----------------------------------------------------------
# TERMIN- & ZEITPLANER (MINUTENGENAUE TAGES-REGIE)
# -----------------------------------------------------------

@app.get("/api/schedule/timeline", response_model=DailyTimelineResponse)
def get_schedule_timeline():
    plan = get_or_create_weekly_plan(0)
    today_idx = min(datetime.now().weekday(), len(plan.days) - 1) if plan.days else 0
    today_plan = plan.days[today_idx] if plan.days else None

    # Tomorrow plan
    if plan.days and today_idx + 1 < len(plan.days):
        tomorrow_plan = plan.days[today_idx + 1]
    else:
        next_week_plan = get_or_create_weekly_plan(1)
        tomorrow_plan = next_week_plan.days[0] if next_week_plan.days else None

    return generate_daily_timeline(
        today_plan=today_plan,
        tomorrow_plan=tomorrow_plan,
        family_members=family_profiles,
        settings=get_schedule_settings(),
        current_dt=datetime.now()
    )


@app.post("/api/schedule/settings", response_model=ScheduleTimeSettings)
def update_schedule_settings_endpoint(req: UpdateScheduleSettingsRequest):
    return update_schedule_settings(req.model_dump(exclude_unset=True))


@app.post("/api/schedule/task/{task_id}/toggle", response_model=DailyTimelineResponse)
def toggle_task_endpoint(task_id: str, req: Optional[ToggleTaskRequest] = None):
    is_completed = req.is_completed if req else None
    toggle_timeline_task(task_id, is_completed)
    if task_id in ["task-lunchbox-grab", "task-prep-tomorrow"]:
        daily_hub_state["lunchbox_packed"] = True
    elif task_id in ["task-store-visit", "task-store-alert"]:
        daily_hub_state["fresh_pick_bought"] = True
    elif task_id in ["task-dinner-cook", "task-dinner-eat"]:
        daily_hub_state["dinner_cooked"] = True
    return get_schedule_timeline()


@app.post("/api/schedule/prep-tomorrow/complete", response_model=DailyTimelineResponse)
def complete_prep_tomorrow():
    toggle_timeline_task("task-prep-tomorrow", True)
    daily_hub_state["lunchbox_packed"] = True
    return get_schedule_timeline()


@app.get("/api/substitutes", response_model=List[str])
def get_substitutes(ingredient: str = Query(..., description="Name der Zutat")):
    return get_substitutes_for_item(ingredient)


# -----------------------------------------------------------
# INSTALLER & SMARTPHONE WLAN-PAIRING ROUTEN
# -----------------------------------------------------------

@app.get("/FitPlaner.apk")
@app.get("/api/installer/download")
def download_apk():
    apk_file = get_apk_path()
    if not os.path.isfile(apk_file):
        raise HTTPException(
            status_code=404,
            detail="APK-Datei wird aktuell noch kompiliert oder ist nicht vorhanden."
        )
    return FileResponse(
        apk_file,
        media_type="application/vnd.android.package-archive",
        filename="FitPlaner.apk"
    )


@app.get("/api/installer/info", response_model=InstallerInfoResponse)
def get_installer_status():
    return get_installer_info(port=8090)


@app.post("/api/installer/pair", response_model=PairedDevice)
def pair_phone(req: PairDeviceRequest):
    return register_device(req, client_ip="WLAN-Gerät")


@app.delete("/api/installer/devices/{device_id}")
def unpair_phone(device_id: str):
    success = remove_device(device_id)
    return {"success": success, "device_id": device_id}


class HouseholdSyncPayload(BaseModel):
    device_id: str
    pantry_items: Optional[List[PantryItem]] = None
    shopping_items_checked: Optional[Dict[str, bool]] = None


@app.post("/api/installer/sync")
def sync_household_device(payload: HouseholdSyncPayload):
    if payload.pantry_items:
        for it in payload.pantry_items:
            add_or_update_pantry_item(it)
    return {
        "status": "synced",
        "synced_at": datetime.now().strftime("%d.%m.%Y, %H:%M:%S"),
        "pantry_count": len(get_all_pantry_items()),
    }


# -----------------------------------------------------------
# AUTO-DISCOVERY & WLAN-PING (GERÄTE AUTOMATISCH ERKENNEN)
# -----------------------------------------------------------

@app.post("/api/discovery/broadcast")
def trigger_broadcast_ping():
    success = send_udp_broadcast_ping(server_port=8090)
    return {"broadcast_sent": success}


@app.get("/api/discovery/scan", response_model=List[DiscoveredDevice])
def scan_network_devices():
    return scan_subnet_fast()


class ClientPingRequest(BaseModel):
    device_id: str
    device_name: str
    device_model: str = "Android"


@app.post("/api/discovery/ping", response_model=DiscoveredDevice)
def client_heartbeat_ping(req: ClientPingRequest):
    return register_http_ping(
        ip=get_lan_ip(),
        device_id=req.device_id,
        device_name=req.device_name,
        device_model=req.device_model
    )


# Start background UDP beacon and listener on app import
try:
    start_discovery_service(server_port=8090)
except Exception as e:
    print(f"[Discovery] Could not start UDP listener: {e}")


# -----------------------------------------------------------
# STATISCHE DATEIEN (FRONTEND SERVING)
# -----------------------------------------------------------

frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

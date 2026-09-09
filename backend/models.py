"""
Data models for Netto & NP Smart Nutrition & Family Planner.
"""

from typing import List, Dict, Optional, Literal, Any
from pydantic import BaseModel, Field


class AdditiveInfo(BaseModel):
    code: str  # e.g. E250
    name: str  # e.g. Natriumnitrit
    risk_level: Literal["green", "yellow", "red"]
    description: str


class IngredientAnalysis(BaseModel):
    ingredients_text: str = ""
    nova_group: int = 1  # 1 = Unprocessed, 2 = Culinary, 3 = Processed, 4 = Ultra-processed
    nutri_score: str = "A"  # A, B, C, D, E
    additives: List[AdditiveInfo] = Field(default_factory=list)
    hidden_sugars: List[str] = Field(default_factory=list)
    health_score: int = 9  # 1 to 10
    verdict: Literal["Sehr gesund", "Gesund", "Akzeptabel", "Ungesund/Gemieden"] = "Sehr gesund"
    verdict_explanation: str = ""


class ProductOffer(BaseModel):
    id: str
    retailer: Literal["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka", "Sonstiges"]
    title: str
    brand: Optional[str] = None
    original_price: Optional[float] = None
    discount_price: float
    savings_percent: Optional[int] = None
    unit: str = "Stück"
    amount: Optional[str] = None
    category: str = "Obst & Gemüse"
    is_healthy: bool = True
    health_score: int = 9
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    image_url: Optional[str] = None
    analysis: Optional[IngredientAnalysis] = None


class FamilyMember(BaseModel):
    id: str
    name: str
    gender: Literal["male", "female"]
    age: int
    height_cm: float
    weight_kg: float
    activity_level: Literal["sedentary", "light", "moderate", "active", "very_active"]
    goal: Literal["lose_weight", "maintain", "gain_muscle"]
    dietary_preference: Literal["all", "no_pork", "pescetarian", "vegetarian", "vegan", "low_carb", "high_protein"] = "all"
    allergies: List[str] = Field(default_factory=list)  # e.g. ["laktose", "gluten", "nuesse", "fisch", "eier", "soja"]
    disliked_foods: List[str] = Field(default_factory=list)  # e.g. ["brokkoli", "champignons", "zucchini", "tomate", "lachs", "rind"]
    # Calculated properties
    bmr: float = 0.0
    tdee: float = 0.0
    target_calories: int = 2000
    target_protein_g: int = 140
    target_carbs_g: int = 220
    target_fat_g: int = 65


class RecipeIngredient(BaseModel):
    name: str
    base_amount: float
    unit: str
    category: str = "Basics"  # Gemüse, Protein, Getreide, etc.
    matched_offer_id: Optional[str] = None
    matched_offer_retailer: Optional[str] = None
    matched_offer_price: Optional[float] = None


class ScaledIngredient(BaseModel):
    name: str
    amount: float
    unit: str
    matched_retailer: Optional[str] = None


class DetailedInstruction(BaseModel):
    prep_steps: List[str] = Field(default_factory=list)
    cooking_steps: List[str] = Field(default_factory=list)
    lunchbox_tips: List[str] = Field(default_factory=list)


class Recipe(BaseModel):
    id: str
    title: str
    meal_type: Literal["breakfast_lunchbox", "lunch_lunchbox", "dinner_home"]
    prep_time_minutes: int
    cook_time_minutes: int = 15
    difficulty: Literal["Einfach", "Mittel", "Anspruchsvoll"] = "Einfach"
    lunchbox_ready: bool = True
    base_calories: int
    base_protein_g: int
    base_carbs_g: int
    base_fat_g: int
    ingredients: List[RecipeIngredient]
    instructions: List[str]
    detailed_instructions: Optional[DetailedInstruction] = None
    allergens: List[str] = Field(default_factory=list)  # e.g. ["laktose", "gluten", "nuesse", "fisch", "eier"]
    diet_types: List[str] = Field(default_factory=lambda: ["omnivore"])  # e.g. ["omnivore", "pescetarian", "vegetarian", "vegan"]
    tags: List[str] = Field(default_factory=list)
    image_url: Optional[str] = None


class PersonMealPortion(BaseModel):
    member_id: str
    member_name: str
    meal_type: Literal["breakfast_lunchbox", "lunch_lunchbox", "dinner_home"]
    recipe_title: str
    scale_factor: float
    scaled_calories: int
    scaled_protein_g: int
    scaled_carbs_g: int
    scaled_fat_g: int
    scaled_ingredients: List[ScaledIngredient]


class DayPlan(BaseModel):
    day_name: str  # Montag, Dienstag, ...
    date: str
    breakfast: Recipe
    lunch: Recipe
    dinner: Recipe
    is_breakfast_cooked: bool = False
    is_lunch_cooked: bool = False
    is_dinner_cooked: bool = False
    # Key is member_id
    portions: Dict[str, Dict[str, PersonMealPortion]]  # member_id -> {"breakfast": ..., "lunch": ..., "dinner": ...}
    daily_nutrition_by_member: Dict[str, Dict[str, int]]  # member_id -> {"calories": ..., "protein": ..., "carbs": ..., "fat": ...}


class WeeklyPlan(BaseModel):
    id: str
    week_label: str
    week_offset: int = 0
    iso_week: str = ""
    start_date: str = ""
    end_date: str = ""
    created_at: str
    days: List[DayPlan]
    total_estimated_cost: float
    total_savings: float
    budget: float = 120.0
    budget_status: Literal["ok", "warning", "exceeded"] = "ok"
    budget_difference: float = 0.0
    leaflet_availability_status: Literal["active", "preview", "not_yet_published", "archived"] = "active"
    leaflet_availability_note: str = ""
    active_retailers: List[str] = Field(default_factory=lambda: ["Netto", "NP", "Lidl", "Aldi Nord", "Rewe", "Kaufland", "Edeka"])


class BudgetInfo(BaseModel):
    week_offset: int
    week_label: str
    budget: float
    total_cost: float
    difference: float
    percentage_used: float
    status: Literal["ok", "warning", "exceeded"]
    savings: float
    saving_tips: List[str] = Field(default_factory=list)


class UpdateBudgetRequest(BaseModel):
    week_offset: int = 0
    budget: float


# -------------------------------------------------------------
# LAGERVERWALTUNG & MHD MODELLE
# -------------------------------------------------------------

class PantryItem(BaseModel):
    id: str
    name: str
    current_quantity: float
    unit: str  # g, ml, Stück
    category: str = "Vorratskammer"
    mhd_date: Optional[str] = None  # YYYY-MM-DD
    shelf_life_status: Literal["fresh", "expiring_soon", "expired"] = "fresh"
    days_left: Optional[int] = None
    standard_pack_size: Optional[float] = None
    source: str = "Manuell"  # "Kauf", "Restmenge", "Barcode", "Kassenbon"
    ean_barcode: Optional[str] = None
    added_date: str = ""


class CustomShoppingItem(BaseModel):
    id: str
    name: str
    quantity: float
    unit: str = "Stück"
    category: str = "Sonstiges"
    retailer: Literal["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka", "Vorratskammer", "Sonstiges"] = "Netto"
    notes: Optional[str] = None
    is_checked: bool = False
    exact_product_name: Optional[str] = None
    brand: Optional[str] = None
    barcode: Optional[str] = None


class ShoppingItem(BaseModel):
    name: str
    total_quantity: float
    unit: str
    category: str
    retailer: Literal["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka", "Vorratskammer", "Sonstiges"]
    is_on_sale: bool = False
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    savings: Optional[float] = None
    is_checked: bool = False
    # Pantry integration
    in_stock_quantity: float = 0.0
    net_need_quantity: float = 0.0
    pack_size: Optional[float] = None
    packs_to_buy: int = 1
    leftover_after_purchase: float = 0.0
    is_covered_by_stock: bool = False
    aisle: str = "Trockensortiment & Vorräte"
    substitutes: List[str] = Field(default_factory=list)
    exact_product_name: Optional[str] = None
    brand: Optional[str] = None
    barcode: Optional[str] = None


class ShoppingList(BaseModel):
    items_netto: List[ShoppingItem] = Field(default_factory=list)
    items_np: List[ShoppingItem] = Field(default_factory=list)
    items_lidl: List[ShoppingItem] = Field(default_factory=list)
    items_aldi: List[ShoppingItem] = Field(default_factory=list)
    items_rewe: List[ShoppingItem] = Field(default_factory=list)
    items_kaufland: List[ShoppingItem] = Field(default_factory=list)
    items_edeka: List[ShoppingItem] = Field(default_factory=list)
    items_pantry: List[ShoppingItem] = Field(default_factory=list)
    items_by_retailer: Dict[str, List[ShoppingItem]] = Field(default_factory=dict)
    custom_items: List[CustomShoppingItem] = Field(default_factory=list)
    total_price: float = 0.0
    total_savings: float = 0.0
    covered_by_stock_savings: float = 0.0
    week_offset: int = 0
    week_label: str = ""
    budget: float = 120.0
    budget_status: Literal["ok", "warning", "exceeded"] = "ok"
    budget_difference: float = 0.0


class DailyHubResponse(BaseModel):
    current_day_name: str
    current_date: str
    day_index: int
    time_slot: str  # morning, afternoon, evening, night
    work_end_time: str = "17:00"
    store_name: str = "Netto Marken-Discount"
    store_closing_time: str = "20:00"
    store_status_text: str = "Geöffnet bis 20:00 Uhr"
    is_store_open: bool = True
    fresh_pick_item: Optional[Dict[str, Any]] = None
    is_fresh_pick_bought: bool = False
    lunchbox_breakfast: Optional[Dict[str, Any]] = None
    lunchbox_lunch: Optional[Dict[str, Any]] = None
    is_lunchbox_packed: bool = False
    breakfast_recipe: Optional[Recipe] = None
    lunch_recipe: Optional[Recipe] = None
    dinner_recipe: Optional[Recipe] = None
    tomorrow_breakfast_recipe: Optional[Recipe] = None
    tomorrow_lunch_recipe: Optional[Recipe] = None
    breakfast_plate_portions: Dict[str, str] = Field(default_factory=dict)
    lunch_plate_portions: Dict[str, str] = Field(default_factory=dict)
    dinner_plate_portions: Dict[str, str] = Field(default_factory=dict)
    is_dinner_cooked: bool = False
    dishes_badge: str = "🍳 1 Pfanne / Topf"
    cook_time_badge: str = "⏱️ 20 Min."
    prep_tomorrow_summary: Optional[Dict[str, Any]] = None


class UpdateDailyStatusRequest(BaseModel):
    action: str  # "toggle_fresh_pick", "toggle_lunchbox", "cook_dinner", "set_work_time"
    value: Optional[str] = None


# -------------------------------------------------------------
# KASSENBON & PROSPEKTE MODELLE
# -------------------------------------------------------------

class ReceiptItem(BaseModel):
    name: str
    price: float
    quantity: float = 1.0
    unit: str = "Stück"
    matched_pantry_category: str = "Vorratskammer"


class ReceiptScanResult(BaseModel):
    store_name: str  # Netto or NP
    date: Optional[str] = None
    items: List[ReceiptItem] = Field(default_factory=list)
    total_amount: float = 0.0
    raw_text: str = ""


class LeafletHotspot(BaseModel):
    title: str
    price: float
    savings: Optional[int] = None
    category: str = "Obst & Gemüse"
    x_percent: float = 50.0
    y_percent: float = 50.0


class LeafletPage(BaseModel):
    page_number: int
    image_url: str
    title: str
    deals: List[LeafletHotspot] = Field(default_factory=list)


class LeafletBrochure(BaseModel):
    id: str
    retailer: Literal["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka", "Sonstiges"]
    title: str
    valid_from: str
    valid_to: str
    online_url: str
    pages: List[LeafletPage] = Field(default_factory=list)


# -------------------------------------------------------------
# TERMIN- & ZEITPLANER MODELLE (MINUTENGENAUE TAGES-REGIE)
# -------------------------------------------------------------

class ScheduleTimeSettings(BaseModel):
    wake_up_time: str = "06:30"
    work_start_time: str = "08:00"
    lunch_time: str = "12:30"
    work_end_time: str = "17:00"
    dinner_time: str = "18:30"
    evening_prep_time: str = "20:00"
    bed_time: str = "22:30"


class TimelineTask(BaseModel):
    id: str
    time_str: str
    title: str
    category: Literal["prep", "meal", "fresh_pick", "snack", "water", "defrost"]
    duration_minutes: int
    description: str
    assigned_members: List[str] = Field(default_factory=list)
    is_completed: bool = False
    is_current: bool = False
    urgency: Literal["upcoming", "now", "done", "missed"] = "upcoming"
    action_type: Optional[str] = None
    recipe_preview: Optional[Dict[str, Any]] = None
    tip: Optional[str] = None
    recipe_id: Optional[str] = None
    meal_type: Optional[Literal["breakfast", "lunch", "dinner"]] = None
    day_index: int = 0
    action_url: Optional[str] = None
    instructions: List[str] = Field(default_factory=list)
    ingredients: List[str] = Field(default_factory=list)
    plate_portions: Dict[str, str] = Field(default_factory=dict)


class PrepTomorrowSummary(BaseModel):
    breakfast_title: str
    breakfast_prep_min: int
    breakfast_recipe_id: Optional[str] = None
    breakfast_instructions: List[str] = Field(default_factory=list)
    breakfast_ingredients: List[str] = Field(default_factory=list)
    lunch_title: str
    lunch_prep_min: int
    lunch_recipe_id: Optional[str] = None
    lunch_instructions: List[str] = Field(default_factory=list)
    lunch_ingredients: List[str] = Field(default_factory=list)
    overnight_tasks: List[str] = Field(default_factory=list)
    estimated_total_prep_min: int = 12
    is_prep_finished: bool = False


class DailyTimelineResponse(BaseModel):
    date: str
    day_name: str
    current_time: str
    settings: ScheduleTimeSettings
    current_focus_task: Optional[TimelineTask] = None
    next_task: Optional[TimelineTask] = None
    timeline: List[TimelineTask] = Field(default_factory=list)
    progress_percent: int = 0
    prep_tomorrow: Optional[PrepTomorrowSummary] = None


class UpdateScheduleSettingsRequest(BaseModel):
    wake_up_time: Optional[str] = None
    work_start_time: Optional[str] = None
    lunch_time: Optional[str] = None
    work_end_time: Optional[str] = None
    dinner_time: Optional[str] = None
    evening_prep_time: Optional[str] = None
    bed_time: Optional[str] = None


class ToggleTaskRequest(BaseModel):
    task_id: Optional[str] = None
    is_completed: Optional[bool] = None



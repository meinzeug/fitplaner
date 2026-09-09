export type Retailer =
  | 'Netto'
  | 'NP'
  | 'Lidl'
  | 'Aldi Nord'
  | 'Aldi Süd'
  | 'Rewe'
  | 'Kaufland'
  | 'Edeka'
  | 'Vorratskammer'
  | 'Sonstiges';

export interface AdditiveInfo {
  code: string;
  name: string;
  risk_level: 'green' | 'yellow' | 'red';
  description: string;
}

export interface IngredientAnalysis {
  ingredients_text: string;
  nova_group: number;
  nutri_score: string;
  additives: AdditiveInfo[];
  hidden_sugars: string[];
  health_score: number;
  verdict: 'Sehr gesund' | 'Gesund' | 'Akzeptabel' | 'Ungesund/Gemieden';
  verdict_explanation: string;
}

export interface ProductOffer {
  id: string;
  retailer: Retailer;
  title: string;
  brand?: string;
  original_price?: number;
  discount_price: number;
  savings_percent?: number;
  unit: string;
  amount?: string;
  category: string;
  is_healthy: boolean;
  health_score: number;
  valid_from?: string;
  valid_to?: string;
  image_url?: string;
  analysis?: IngredientAnalysis;
}

export interface FamilyMember {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_weight' | 'maintain' | 'gain_muscle';
  dietary_preference: 'all' | 'no_pork' | 'pescetarian' | 'vegetarian' | 'vegan' | 'low_carb' | 'high_protein';
  allergies: string[];
  disliked_foods: string[];
  bmr: number;
  tdee: number;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
}

export interface RecipeIngredient {
  name: string;
  base_amount: number;
  unit: string;
  category: string;
  matched_offer_id?: string;
  matched_offer_retailer?: string;
  matched_offer_price?: number;
}

export interface DetailedInstruction {
  prep_steps: string[];
  cooking_steps: string[];
  lunchbox_tips: string[];
}

export interface Recipe {
  id: string;
  title: string;
  meal_type: 'breakfast_lunchbox' | 'lunch_lunchbox' | 'dinner_home';
  prep_time_minutes: number;
  cook_time_minutes: number;
  difficulty: 'Einfach' | 'Mittel' | 'Anspruchsvoll';
  lunchbox_ready: boolean;
  base_calories: number;
  base_protein_g: number;
  base_carbs_g: number;
  base_fat_g: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  detailed_instructions?: DetailedInstruction;
  allergens: string[];
  diet_types: string[];
  tags: string[];
  image_url?: string;
}

export interface ScaledIngredient {
  name: string;
  amount: number;
  unit: string;
  matched_retailer?: string;
}

export interface PersonMealPortion {
  member_id: string;
  member_name: string;
  meal_type: 'breakfast_lunchbox' | 'lunch_lunchbox' | 'dinner_home';
  recipe_title: string;
  scale_factor: number;
  scaled_calories: number;
  scaled_protein_g: number;
  scaled_carbs_g: number;
  scaled_fat_g: number;
  scaled_ingredients: ScaledIngredient[];
}

export interface DayPlan {
  day_name: string;
  date: string;
  breakfast: Recipe;
  lunch: Recipe;
  dinner: Recipe;
  is_breakfast_cooked?: boolean;
  is_lunch_cooked?: boolean;
  is_dinner_cooked?: boolean;
  portions: Record<string, {
    breakfast: PersonMealPortion;
    lunch: PersonMealPortion;
    dinner: PersonMealPortion;
  }>;
  daily_nutrition_by_member: Record<string, {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

export interface WeeklyPlan {
  id: string;
  week_label: string;
  week_offset?: number;
  iso_week?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  days: DayPlan[];
  total_estimated_cost: number;
  total_savings: number;
  budget?: number;
  budget_status?: 'ok' | 'warning' | 'exceeded';
  budget_difference?: number;
  leaflet_availability_status?: 'active' | 'preview' | 'not_yet_published' | 'archived';
  leaflet_availability_note?: string;
  active_retailers?: string[];
}

export interface BudgetInfo {
  week_offset: number;
  week_label: string;
  budget: number;
  total_cost: number;
  difference: number;
  percentage_used: number;
  status: 'ok' | 'warning' | 'exceeded';
  savings: number;
  saving_tips: string[];
}

export interface PantryItem {
  id: string;
  name: string;
  current_quantity: number;
  unit: string;
  category: string;
  mhd_date?: string;
  shelf_life_status: 'fresh' | 'expiring_soon' | 'expired';
  days_left?: number;
  standard_pack_size?: number;
  source: string;
  ean_barcode?: string;
  added_date: string;
}

export interface CustomShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  retailer: Retailer;
  notes?: string;
  is_checked: boolean;
  exact_product_name?: string;
  brand?: string;
  barcode?: string;
}

export interface ShoppingItem {
  name: string;
  total_quantity: number;
  unit: string;
  category: string;
  retailer: Retailer;
  is_on_sale: boolean;
  unit_price?: number;
  total_price?: number;
  savings?: number;
  is_checked: boolean;
  in_stock_quantity: number;
  net_need_quantity: number;
  pack_size?: number;
  packs_to_buy: number;
  leftover_after_purchase: number;
  is_covered_by_stock: boolean;
  aisle?: string;
  substitutes?: string[];
  exact_product_name?: string;
  brand?: string;
  barcode?: string;
}

export interface FreshPickItem {
  name: string;
  amount: string;
  retailer: string;
  price: number;
  reason: string;
  tip?: string;
}

export interface LunchboxPreview {
  title: string;
  calories: number;
  protein: number;
  prep_time: number;
  lunchbox_ready: boolean;
  tip: string;
}

export interface DailyHubResponse {
  current_day_name: string;
  current_date: string;
  day_index: number;
  time_slot: 'morning' | 'afternoon' | 'evening' | 'night';
  work_end_time: string;
  store_name: string;
  store_closing_time: string;
  store_status_text: string;
  is_store_open: boolean;
  fresh_pick_item?: FreshPickItem | null;
  is_fresh_pick_bought: boolean;
  lunchbox_breakfast?: LunchboxPreview | null;
  lunchbox_lunch?: LunchboxPreview | null;
  is_lunchbox_packed: boolean;
  dinner_recipe?: Recipe | null;
  dinner_plate_portions: Record<string, string>;
  is_dinner_cooked: boolean;
  dishes_badge: string;
  cook_time_badge: string;
}

export interface ShoppingList {
  items_netto: ShoppingItem[];
  items_np: ShoppingItem[];
  items_lidl?: ShoppingItem[];
  items_aldi?: ShoppingItem[];
  items_rewe?: ShoppingItem[];
  items_kaufland?: ShoppingItem[];
  items_edeka?: ShoppingItem[];
  items_pantry: ShoppingItem[];
  items_by_retailer?: Record<string, ShoppingItem[]>;
  custom_items: CustomShoppingItem[];
  total_price: number;
  total_savings: number;
  covered_by_stock_savings: number;
  week_offset?: number;
  week_label?: string;
  budget?: number;
  budget_status?: 'ok' | 'warning' | 'exceeded';
  budget_difference?: number;
}

export interface LeafletHotspot {
  title: string;
  price: number;
  savings?: number;
  category: string;
  x_percent: number;
  y_percent: number;
}

export interface LeafletPage {
  page_number: number;
  image_url: string;
  title: string;
  deals: LeafletHotspot[];
}

export interface LeafletBrochure {
  id: string;
  retailer: Retailer | string;
  title: string;
  valid_from: string;
  valid_to: string;
  online_url: string;
  pages: LeafletPage[];
}

export interface ScheduleTimeSettings {
  wake_up_time: string;
  work_start_time: string;
  lunch_time: string;
  work_end_time: string;
  dinner_time: string;
  evening_prep_time: string;
  bed_time: string;
}

export interface TimelineTask {
  id: string;
  time_str: string;
  title: string;
  category: 'prep' | 'meal' | 'fresh_pick' | 'snack' | 'water' | 'defrost';
  duration_minutes: number;
  description: string;
  assigned_members: string[];
  is_completed: boolean;
  is_current: boolean;
  urgency: 'upcoming' | 'now' | 'done' | 'missed';
  action_type?: string;
  recipe_preview?: {
    title: string;
    prep_time?: number;
    cook_time?: number;
  };
  tip?: string;
}

export interface PrepTomorrowSummary {
  breakfast_title: string;
  breakfast_prep_min: number;
  lunch_title: string;
  lunch_prep_min: number;
  overnight_tasks: string[];
  estimated_total_prep_min: number;
  is_prep_finished: boolean;
}

export interface DailyTimelineResponse {
  date: string;
  day_name: string;
  current_time: string;
  settings: ScheduleTimeSettings;
  current_focus_task?: TimelineTask | null;
  next_task?: TimelineTask | null;
  timeline: TimelineTask[];
  progress_percent: number;
  prep_tomorrow?: PrepTomorrowSummary | null;
}

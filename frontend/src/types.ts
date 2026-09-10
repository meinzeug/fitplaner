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
  role_title?: string;
  age_group?: 'mini' | 'kid' | 'teen' | 'junior' | 'adult' | 'senior';
  chore_points?: number;
  badges?: string[];
  water_intake_ml?: number;
  daily_water_target_ml?: number;
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
  recipe_id?: string;
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
  is_pantry_eligible?: boolean;
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
  id?: string;
  title: string;
  calories: number;
  protein: number;
  prep_time: number;
  lunchbox_ready: boolean;
  tip: string;
  quick_instructions?: string;
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
  breakfast_recipe?: Recipe | null;
  lunch_recipe?: Recipe | null;
  dinner_recipe?: Recipe | null;
  tomorrow_breakfast_recipe?: Recipe | null;
  tomorrow_lunch_recipe?: Recipe | null;
  breakfast_plate_portions: Record<string, string>;
  lunch_plate_portions: Record<string, string>;
  dinner_plate_portions: Record<string, string>;
  is_dinner_cooked: boolean;
  dishes_badge: string;
  cook_time_badge: string;
  prep_tomorrow_summary?: {
    breakfast_prep?: string;
    lunchbox_prep?: string;
    defrost_needed?: string;
    est_minutes: number;
  } | null;
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
    id?: string;
    title: string;
    prep_time?: number;
    cook_time?: number;
    calories?: number;
    protein?: number;
    image_url?: string;
    breakfast_title?: string;
    breakfast_id?: string;
    lunch_title?: string;
    lunch_id?: string;
  };
  tip?: string;
  recipe_id?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  day_index?: number;
  action_url?: string;
  instructions?: string[];
  ingredients?: string[];
  plate_portions?: Record<string, string>;
}

export interface PrepTomorrowSummary {
  breakfast_title: string;
  breakfast_prep_min: number;
  breakfast_recipe_id?: string;
  breakfast_instructions?: string[];
  breakfast_ingredients?: string[];
  lunch_title: string;
  lunch_prep_min: number;
  lunch_recipe_id?: string;
  lunch_instructions?: string[];
  lunch_ingredients?: string[];
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

export interface FamilyChore {
  id: string;
  title: string;
  description: string;
  assigned_member_id?: string;
  assigned_member_name?: string;
  age_group: 'mini' | 'kid' | 'teen' | 'junior' | 'adult' | 'all';
  min_age: number;
  difficulty: 'easy' | 'medium' | 'chef';
  points: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'prep' | 'general';
  station_id?: string;
  day_index: number;
  is_completed: boolean;
  completed_by_name?: string;
  icon: string;
}

export interface MemberVitalityDetail {
  member_id: string;
  member_name: string;
  age: number;
  age_group: string;
  role_title: string;
  score: number;
  status: string;
  calories_target: number;
  protein_target_g: number;
  fiber_target_g: number;
  water_intake_ml: number;
  water_target_ml: number;
  water_percent: number;
  key_focus_nutrient: string;
  actionable_tip: string;
  badges: string[];
}

export interface FamilyVitalityScore {
  overall_score: number;
  status_label: string;
  status_color: string;
  plants_count: number;
  plants_target: number;
  plants_percent: number;
  plants_list: string[];
  missing_plant_types: string[];
  fiber_score: number;
  omega3_score: number;
  sugar_radar_score: number;
  hydration_score: number;
  family_points_total: number;
  family_star_goal: number;
  family_star_percent: number;
  members: MemberVitalityDetail[];
  vitality_tips: string[];
}

export interface MeshSyncPacket {
  device_id: string;
  device_name: string;
  timestamp: string;
  sequence_id: number;
  checked_shopping_items: string[];
  completed_chores: string[];
  member_points: Record<string, number>;
  member_water: Record<string, number>;
  lunchbox_packed?: boolean;
  fresh_pick_bought?: boolean;
  dinner_cooked?: boolean;
}

export interface MeshStatusResponse {
  mode: 'lan_mesh' | 'bluetooth_ready' | 'offline_autonomous' | 'internet_connected';
  is_lan_available: boolean;
  is_bluetooth_ready: boolean;
  is_internet_available: boolean;
  active_peers_count: number;
  last_sync_time: string;
  offline_queue_length: number;
  local_ip: string;
  bluetooth_service_uuid: string;
}

export interface PairedDevice {
  id: string;
  name: string;
  model: string;
  ip_address: string;
  connected_at: string;
  last_sync: string;
  is_online: boolean;
  assigned_member_id?: string;
}

export interface InstallerInfoResponse {
  lan_ip: string;
  port: number;
  apk_available: boolean;
  apk_download_url: string;
  apk_file_size_mb?: number;
  pairing_url: string;
  qr_code_svg: string;
  qr_code_pairing_svg: string;
  paired_devices: PairedDevice[];
}

export interface AppSettings {
  active_retailers: string[];
  primary_retailer: string;
  default_weekly_budget: number;
  prefer_healthy_offers: boolean;
  microbiome_plant_target: number;
  sync_auto_discovery: boolean;
  device_role: 'host' | 'client';
}




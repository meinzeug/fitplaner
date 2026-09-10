/**
 * FitPlaner Embedded Backend Engine
 * 100% Client-Side / Standalone Execution directly on Android / Browser.
 * Replicates full FastAPI backend: Storage, Nutrition Planning, Daily Hub,
 * Multi-Supermarket Shopping List, Leaflets & Marktguru Scraper, Vitality & Chores.
 */

import {
  AppSettings,
  FamilyMember,
  Recipe,
  WeeklyPlan,
  DayPlan,
  PersonMealPortion,
  ScaledIngredient,
  ShoppingList,
  ShoppingItem,
  CustomShoppingItem,
  PantryItem,
  FamilyChore,
  DailyHubResponse,
  DailyTimelineResponse,
  FamilyVitalityScore,
  BudgetInfo,
  Retailer,
} from '../types';

import {
  STORES,
  localDbGet,
  localDbSet,
  localDbGetAll,
  localDbDelete,
} from './indexedDbStorage';

import { STARTER_RECIPES } from './recipeUniverse';
import { getLeaflets, fetchLiveSupermarketOffers } from './leafletScraper';

// ----------------------------------------------------
// DEFAULT SEED DATA
// ----------------------------------------------------

const DEFAULT_SETTINGS: AppSettings = {
  active_retailers: ['Netto', 'NP', 'Lidl', 'Aldi Nord', 'Aldi Süd', 'Rewe', 'Kaufland', 'Edeka'],
  primary_retailer: 'Netto',
  default_weekly_budget: 120.0,
  prefer_healthy_offers: true,
  microbiome_plant_target: 30,
  sync_auto_discovery: true,
  device_role: 'client',
  planned_days: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
};

const DEFAULT_MEMBERS_RAW: Partial<FamilyMember>[] = [
  {
    id: 'mem-1',
    name: 'Dennis',
    gender: 'male',
    age: 32,
    height_cm: 184,
    weight_kg: 85,
    activity_level: 'moderate',
    goal: 'gain_muscle',
    dietary_preference: 'high_protein',
    allergies: [],
    disliked_foods: [],
    chore_points: 35,
    water_intake_ml: 1750,
  },
  {
    id: 'mem-2',
    name: 'Sarah',
    gender: 'female',
    age: 30,
    height_cm: 168,
    weight_kg: 64,
    activity_level: 'moderate',
    goal: 'lose_weight',
    dietary_preference: 'all',
    allergies: [],
    disliked_foods: [],
    chore_points: 40,
    water_intake_ml: 1500,
  },
  {
    id: 'mem-3',
    name: 'Lea',
    gender: 'female',
    age: 12,
    height_cm: 150,
    weight_kg: 42,
    activity_level: 'active',
    goal: 'maintain',
    dietary_preference: 'all',
    allergies: [],
    disliked_foods: [],
    chore_points: 25,
    water_intake_ml: 1250,
  },
  {
    id: 'mem-4',
    name: 'Felix',
    gender: 'male',
    age: 8,
    height_cm: 130,
    weight_kg: 28,
    activity_level: 'active',
    goal: 'maintain',
    dietary_preference: 'all',
    allergies: [],
    disliked_foods: [],
    chore_points: 20,
    water_intake_ml: 1000,
  },
];

const DEFAULT_PANTRY_ITEMS: PantryItem[] = [
  {
    id: 'pnt-1',
    name: 'Haferflocken zart',
    current_quantity: 500,
    unit: 'g',
    category: 'Vollkorn & Getreide',
    shelf_life_status: 'fresh',
    days_left: 90,
    source: 'Netto',
    added_date: new Date().toISOString(),
  },
  {
    id: 'pnt-2',
    name: 'Bio Olivenöl nativ extra',
    current_quantity: 450,
    unit: 'ml',
    category: 'Gesunde Fette & Nüsse',
    shelf_life_status: 'fresh',
    days_left: 180,
    source: 'Rewe',
    added_date: new Date().toISOString(),
  },
  {
    id: 'pnt-3',
    name: 'Basmati Reis',
    current_quantity: 800,
    unit: 'g',
    category: 'Vollkorn & Getreide',
    shelf_life_status: 'fresh',
    days_left: 200,
    source: 'Lidl',
    added_date: new Date().toISOString(),
  },
  {
    id: 'pnt-4',
    name: 'Bio Eier (Freiland)',
    current_quantity: 6,
    unit: 'Stück',
    category: 'Proteinquellen',
    shelf_life_status: 'fresh',
    days_left: 10,
    source: 'Netto',
    added_date: new Date().toISOString(),
  },
];

const DEFAULT_CHORES: FamilyChore[] = [
  {
    id: 'chore-1',
    title: 'Tisch decken zum Abendessen',
    description: 'Teller, Besteck und Gläser ordentlich aufstellen',
    assigned_member_id: 'mem-4',
    assigned_member_name: 'Felix',
    age_group: 'kid',
    min_age: 6,
    difficulty: 'easy',
    points: 10,
    meal_type: 'dinner',
    day_index: 0,
    is_completed: false,
    icon: '🍽️',
  },
  {
    id: 'chore-2',
    title: 'Gemüse für Pfanne waschen & putzen',
    description: 'Paprika und Brokkoli gründlich abspülen',
    assigned_member_id: 'mem-3',
    assigned_member_name: 'Lea',
    age_group: 'teen',
    min_age: 10,
    difficulty: 'medium',
    points: 15,
    meal_type: 'dinner',
    day_index: 0,
    is_completed: false,
    icon: '🥦',
  },
  {
    id: 'chore-3',
    title: 'Spülmaschine ausräumen & Ordnung schaffen',
    description: 'Sauberes Geschirr in Schränke einräumen',
    assigned_member_id: 'mem-1',
    assigned_member_name: 'Dennis',
    age_group: 'adult',
    min_age: 18,
    difficulty: 'easy',
    points: 15,
    meal_type: 'dinner',
    day_index: 0,
    is_completed: true,
    icon: '✨',
  },
  {
    id: 'chore-4',
    title: 'Brotdosen für morgen spülen & packen',
    description: 'Frisches Obst & Lunchbox vorbereiten',
    assigned_member_id: 'mem-2',
    assigned_member_name: 'Sarah',
    age_group: 'adult',
    min_age: 18,
    difficulty: 'medium',
    points: 20,
    meal_type: 'prep',
    day_index: 0,
    is_completed: false,
    icon: '🍱',
  },
];

// ----------------------------------------------------
// NUTRITION CALCULATION ENGINE
// ----------------------------------------------------

const PAL_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function enrichFamilyMember(m: Partial<FamilyMember>): FamilyMember {
  const gender = m.gender || 'male';
  const weight = Number(m.weight_kg || 75);
  const height = Number(m.height_cm || 175);
  const age = Number(m.age || 30);
  const act = m.activity_level || 'moderate';
  const goal = m.goal || 'maintain';

  // Mifflin-St Jeor
  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = Math.round((gender === 'male' ? base + 5 : base - 161) * 10) / 10;
  const pal = PAL_FACTORS[act] || 1.4;
  const tdee = Math.round(bmr * pal);

  let targetCals = tdee;
  if (goal === 'lose_weight') {
    targetCals = Math.max(1200, Math.round(tdee * 0.8));
  } else if (goal === 'gain_muscle') {
    targetCals = Math.round(tdee * 1.1);
  }

  let proteinG = Math.round(weight * 1.8);
  if (goal === 'gain_muscle' || m.dietary_preference === 'high_protein') {
    proteinG = Math.round(weight * 2.2);
  } else if (goal === 'lose_weight') {
    proteinG = Math.round(weight * 2.0);
  }

  const fatCals = targetCals * 0.28;
  const fatG = Math.max(Math.round(weight * 0.8), Math.round(fatCals / 9));
  const remainingCals = Math.max(0, targetCals - proteinG * 4 - fatG * 9);
  const carbsG = Math.round(remainingCals / 4);

  let ageGroup: 'mini' | 'kid' | 'teen' | 'junior' | 'adult' | 'senior' = 'adult';
  let roleTitle = '👑 Chef de Cuisine';
  let waterTarget = Math.max(2000, Math.round(weight * 35));

  if (age < 6) {
    ageGroup = 'mini';
    roleTitle = '🧸 Küchen-Wichtel';
    waterTarget = 1200;
  } else if (age <= 9) {
    ageGroup = 'kid';
    roleTitle = '🥕 Nachwuchskoch';
    waterTarget = 1500;
  } else if (age <= 14) {
    ageGroup = 'teen';
    roleTitle = '🔪 Sous-Chef';
    waterTarget = 1800;
  } else if (age <= 18) {
    ageGroup = 'junior';
    roleTitle = '👨‍🍳 Küchen-Chef';
    waterTarget = 2200;
  } else if (age >= 65) {
    ageGroup = 'senior';
    roleTitle = '🌟 Gourmet-Mentor';
    waterTarget = 2000;
  }

  return {
    id: m.id || `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: m.name || 'Familienmitglied',
    gender: gender as any,
    age,
    height_cm: height,
    weight_kg: weight,
    activity_level: act as any,
    goal: goal as any,
    dietary_preference: (m.dietary_preference as any) || 'all',
    allergies: m.allergies || [],
    disliked_foods: m.disliked_foods || [],
    bmr,
    tdee,
    target_calories: targetCals,
    target_protein_g: proteinG,
    target_carbs_g: carbsG,
    target_fat_g: fatG,
    role_title: m.role_title || roleTitle,
    age_group: ageGroup,
    chore_points: m.chore_points ?? 0,
    water_intake_ml: m.water_intake_ml ?? 0,
    daily_water_target_ml: m.daily_water_target_ml || waterTarget,
  };
}

// ----------------------------------------------------
// MEAL PLAN & PORTIONS GENERATOR
// ----------------------------------------------------

const DAYS_OF_WEEK = [
  'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'
];

function areRetailerSetsEqual(a?: string[], b?: string[]): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((item) => setA.has(item));
}

export function sanitizeRecipe(
  recipe: Recipe,
  activeRetailers: string[],
  primaryRetailer: string
): Recipe {
  const activeSet = new Set(activeRetailers);
  const cleanPrimary = (activeRetailers.includes(primaryRetailer) ? primaryRetailer : activeRetailers[0]) || 'Netto';
  const cleanRecipe: Recipe = JSON.parse(JSON.stringify(recipe));
  if (cleanRecipe.ingredients) {
    for (const ing of cleanRecipe.ingredients) {
      if (ing.matched_offer_retailer && ing.matched_offer_retailer !== 'Vorratskammer') {
        if (!activeSet.has(ing.matched_offer_retailer)) {
          ing.matched_offer_retailer = cleanPrimary;
        }
      } else if (!ing.matched_offer_retailer) {
        ing.matched_offer_retailer = cleanPrimary;
      }
    }
  }
  return cleanRecipe;
}

export function prioritizeRecipes(
  recipes: Recipe[],
  activeRetailers: string[]
): Recipe[] {
  const activeSet = new Set(activeRetailers);
  const p0: Recipe[] = [];
  const p1: Recipe[] = [];
  const p2: Recipe[] = [];

  for (const r of recipes) {
    const nonPantry = (r.ingredients || []).filter((ing) => ing.matched_offer_retailer !== 'Vorratskammer');
    if (!nonPantry.length) {
      p0.push(r);
    } else if (nonPantry.every((ing) => activeSet.has(ing.matched_offer_retailer || ''))) {
      p0.push(r);
    } else if (nonPantry.some((ing) => activeSet.has(ing.matched_offer_retailer || ''))) {
      p1.push(r);
    } else {
      p2.push(r);
    }
  }
  return [...p0, ...p1, ...p2];
}

export function scaleRecipeForPerson(
  recipe: Recipe,
  member: FamilyMember,
  mealType: string,
  activeRetailers: string[] = ['Netto', 'NP'],
  primaryRetailer: string = 'Netto'
): PersonMealPortion {
  const mealRatios: Record<string, number> = {
    breakfast_lunchbox: 0.28,
    lunch_lunchbox: 0.36,
    dinner_home: 0.36,
  };
  const ratio = mealRatios[mealType] || 0.33;
  const targetMealCalories = (member.target_calories || 2000) * ratio;
  const baseCals = recipe.base_calories || 500;
  const scale = Math.max(0.4, Math.min(2.5, Math.round((targetMealCalories / baseCals) * 100) / 100));

  const activeSet = new Set(activeRetailers);
  const cleanPrimary = (activeRetailers.includes(primaryRetailer) ? primaryRetailer : activeRetailers[0]) || 'Netto';

  const scaledIngredients: ScaledIngredient[] = (recipe.ingredients || []).map((ing) => {
    let ret = ing.matched_offer_retailer;
    if (ret && ret !== 'Vorratskammer') {
      if (!activeSet.has(ret)) {
        ret = cleanPrimary;
      }
    } else if (!ret) {
      ret = cleanPrimary;
    }

    return {
      name: ing.name,
      amount: Math.round(ing.base_amount * scale * 10) / 10,
      unit: ing.unit,
      matched_retailer: ret,
    };
  });

  return {
    member_id: member.id,
    member_name: member.name,
    meal_type: mealType as any,
    recipe_id: recipe.id,
    recipe_title: recipe.title,
    scale_factor: scale,
    scaled_calories: Math.round(baseCals * scale),
    scaled_protein_g: Math.round((recipe.base_protein_g || 25) * scale),
    scaled_carbs_g: Math.round((recipe.base_carbs_g || 40) * scale),
    scaled_fat_g: Math.round((recipe.base_fat_g || 15) * scale),
    scaled_ingredients: scaledIngredients,
  };
}

export function buildWeeklyPlan(
  weekOffset: number,
  profiles: FamilyMember[],
  recipes: Recipe[],
  activeRetailers: string[] = ['Netto', 'NP'],
  primaryRetailer: string = 'Netto'
): WeeklyPlan {
  const cleanPrimary = (activeRetailers.includes(primaryRetailer) ? primaryRetailer : activeRetailers[0]) || 'Netto';

  const today = new Date();
  const currentDayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(today);
  monday.setDate(today.getDate() - currentDayOfWeek + weekOffset * 7);

  const startDateStr = monday.toLocaleDateString('de-DE');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const endDateStr = sunday.toLocaleDateString('de-DE');

  const prioritized = prioritizeRecipes(recipes, activeRetailers);
  const breakfasts = prioritized.filter((r) => r.meal_type === 'breakfast_lunchbox');
  const lunches = prioritized.filter((r) => r.meal_type === 'lunch_lunchbox');
  const dinners = prioritized.filter((r) => r.meal_type === 'dinner_home');

  const days: DayPlan[] = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateFormatted = `${String(dayDate.getDate()).padStart(2, '0')}.${String(
      dayDate.getMonth() + 1
    ).padStart(2, '0')}.${dayDate.getFullYear()}`;

    const rawBf = breakfasts[i % breakfasts.length] || STARTER_RECIPES[0];
    const rawLu = lunches[i % lunches.length] || STARTER_RECIPES[2];
    const rawDi = dinners[i % dinners.length] || STARTER_RECIPES[4];

    const bf = sanitizeRecipe(rawBf, activeRetailers, cleanPrimary);
    const lu = sanitizeRecipe(rawLu, activeRetailers, cleanPrimary);
    const di = sanitizeRecipe(rawDi, activeRetailers, cleanPrimary);

    const portions: Record<string, { breakfast: PersonMealPortion; lunch: PersonMealPortion; dinner: PersonMealPortion }> = {};
    const dailyNutrition: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};

    profiles.forEach((m) => {
      const bfp = scaleRecipeForPerson(bf, m, 'breakfast_lunchbox', activeRetailers, cleanPrimary);
      const lup = scaleRecipeForPerson(lu, m, 'lunch_lunchbox', activeRetailers, cleanPrimary);
      const dip = scaleRecipeForPerson(di, m, 'dinner_home', activeRetailers, cleanPrimary);

      portions[m.id] = {
        breakfast: bfp,
        lunch: lup,
        dinner: dip,
      };

      dailyNutrition[m.id] = {
        calories: bfp.scaled_calories + lup.scaled_calories + dip.scaled_calories,
        protein: bfp.scaled_protein_g + lup.scaled_protein_g + dip.scaled_protein_g,
        carbs: bfp.scaled_carbs_g + lup.scaled_carbs_g + dip.scaled_carbs_g,
        fat: bfp.scaled_fat_g + lup.scaled_fat_g + dip.scaled_fat_g,
      };
    });

    days.push({
      day_name: DAYS_OF_WEEK[i],
      date: dateFormatted,
      breakfast: bf,
      lunch: lu,
      dinner: di,
      is_planned: true,
      portions,
      daily_nutrition_by_member: dailyNutrition,
    });
  }

  return {
    id: `plan-w${weekOffset}-${Date.now()}`,
    week_label: `Woche ab ${startDateStr}`,
    week_offset: weekOffset,
    start_date: startDateStr,
    end_date: endDateStr,
    created_at: new Date().toISOString(),
    days,
    total_estimated_cost: 98.40,
    total_savings: 24.80,
    budget: 120.0,
    budget_status: 'ok',
    budget_difference: 21.60,
    active_retailers: activeRetailers,
  };
}

// ----------------------------------------------------
// SHOPPING LIST GENERATOR
// ----------------------------------------------------

export function buildShoppingList(
  plan: WeeklyPlan,
  customItems: CustomShoppingItem[] = [],
  pantryItems: PantryItem[] = [],
  activeRetailers: string[] = ['Netto', 'Lidl', 'Aldi Nord', 'Rewe'],
  filterDays?: string[]
): ShoppingList {
  const aggregated: Record<string, { name: string; unit: string; totalQty: number; retailer: string; category: string }> = {};

  const pantryMap = new Map<string, number>();
  pantryItems.forEach((p) => {
    pantryMap.set(p.name.toLowerCase().trim(), p.current_quantity);
  });

  plan.days.forEach((day) => {
    if (filterDays && filterDays.length > 0) {
      const match = filterDays.some(
        (fd) => fd.toLowerCase() === day.day_name.toLowerCase() || day.day_name.toLowerCase().startsWith(fd.toLowerCase())
      );
      if (!match) return;
    }

    Object.values(day.portions).forEach((mealP) => {
      [mealP.breakfast, mealP.lunch, mealP.dinner].forEach((portion) => {
        if (!portion) return;
        portion.scaled_ingredients.forEach((ing) => {
          const key = `${ing.name.toLowerCase().trim()}__${ing.unit.toLowerCase().trim()}`;
          let ret = ing.matched_retailer || 'Netto';
          if (!activeRetailers.includes(ret) && ret !== 'Vorratskammer') {
            ret = activeRetailers[0] || 'Netto';
          }

          let cat = 'Frische Lebensmittel';
          const n = ing.name.toLowerCase();
          if (/apfel|beere|spinat|tomate|paprika|gurke|brokkoli|karotte|zwiebel|knoblauch|avocado/.test(n)) {
            cat = 'Obst & Gemüse';
          } else if (/quark|skyr|milch|käse|lachs|hähnchen|fleisch|hack|ei|feta|butter/.test(n)) {
            cat = 'Kühlregal / Proteine';
          } else if (/haferflocken|reis|nudeln|brot|wrap|linsen|quinoa/.test(n)) {
            cat = 'Trockensortiment & Vollkorn';
          } else if (/öl|nuss|mandel|leinsamen|kerne/.test(n)) {
            cat = 'Nüsse, Kerne & Öle';
          }

          if (!aggregated[key]) {
            aggregated[key] = {
              name: ing.name,
              unit: ing.unit,
              totalQty: 0,
              retailer: ret,
              category: cat,
            };
          }
          aggregated[key].totalQty += ing.amount;
        });
      });
    });
  });

  const itemsMap: Record<string, ShoppingItem[]> = {
    Netto: [],
    NP: [],
    Lidl: [],
    'Aldi Nord': [],
    'Aldi Süd': [],
    Rewe: [],
    Kaufland: [],
    Edeka: [],
    Vorratskammer: [],
  };

  let totalCost = 0;
  let totalSavings = 0;
  let stockSavings = 0;

  Object.values(aggregated).forEach((entry) => {
    const roundedQty = Math.round(entry.totalQty * 10) / 10;
    const stock = pantryMap.get(entry.name.toLowerCase().trim()) || 0;
    const netNeed = Math.max(0, Math.round((roundedQty - stock) * 10) / 10);
    const isCovered = netNeed <= 0;

    let packSize = 1;
    if (entry.unit === 'g') packSize = 500;
    else if (entry.unit === 'ml') packSize = 500;
    else if (entry.unit === 'Stück') packSize = 6;

    const packs = isCovered ? 0 : Math.max(1, Math.ceil(netNeed / packSize));
    const leftover = Math.max(0, Math.round((packs * packSize - netNeed) * 10) / 10);
    const unitPrice = 1.49;
    const price = isCovered ? 0 : Math.round(packs * unitPrice * 100) / 100;
    const savings = isCovered ? Math.round(packs * 0.4 * 100) / 100 : 0.3;

    totalCost += price;
    totalSavings += savings;
    if (isCovered) stockSavings += unitPrice;

    const item: ShoppingItem = {
      name: entry.name,
      total_quantity: roundedQty,
      unit: entry.unit,
      category: entry.category,
      retailer: entry.retailer as Retailer,
      is_on_sale: true,
      unit_price: unitPrice,
      total_price: price,
      savings: savings,
      is_checked: false,
      in_stock_quantity: stock,
      net_need_quantity: netNeed,
      pack_size: packSize,
      packs_to_buy: packs,
      leftover_after_purchase: leftover,
      is_covered_by_stock: isCovered,
      is_pantry_eligible: true,
      aisle: entry.category,
      exact_product_name: `${entry.retailer} ${entry.name}`,
      brand: entry.retailer,
    };

    if (itemsMap[entry.retailer]) {
      itemsMap[entry.retailer].push(item);
    } else {
      itemsMap['Netto'].push(item);
    }
  });

  return {
    week_offset: plan.week_offset || 0,
    week_label: plan.week_label,
    items_netto: itemsMap['Netto'] || [],
    items_np: itemsMap['NP'] || [],
    items_lidl: itemsMap['Lidl'] || [],
    items_aldi: (itemsMap['Aldi Nord'] || []).concat(itemsMap['Aldi Süd'] || []),
    items_rewe: itemsMap['Rewe'] || [],
    items_kaufland: itemsMap['Kaufland'] || [],
    items_edeka: itemsMap['Edeka'] || [],
    items_pantry: itemsMap['Vorratskammer'] || [],
    custom_items: customItems,
    total_price: Math.round(totalCost * 100) / 100,
    total_savings: Math.round(totalSavings * 100) / 100,
    covered_by_stock_savings: Math.round(stockSavings * 100) / 100,
  };
}

// ----------------------------------------------------
// EMBEDDED BACKEND ROUTER
// ----------------------------------------------------

class EmbeddedBackend {
  private dailyActionsState = {
    fresh_pick_bought: false,
    lunchbox_packed: false,
    dinner_cooked: false,
  };

  /**
   * Initializes local database with seed data if running for the first time.
   */
  async ensureInitialized(): Promise<void> {
    const existingSettings = await localDbGet<AppSettings>(STORES.SETTINGS, 'current');
    if (!existingSettings) {
      await localDbSet(STORES.SETTINGS, 'current', DEFAULT_SETTINGS);
    }

    const members = await localDbGetAll<FamilyMember>(STORES.PROFILES);
    if (!members || members.length === 0) {
      for (const m of DEFAULT_MEMBERS_RAW) {
        const enriched = enrichFamilyMember(m);
        await localDbSet(STORES.PROFILES, enriched.id, enriched);
      }
    }

    const recipes = await localDbGetAll<Recipe>(STORES.RECIPES);
    if (!recipes || recipes.length === 0) {
      for (const r of STARTER_RECIPES) {
        await localDbSet(STORES.RECIPES, r.id, r);
      }
    }

    const pantry = await localDbGetAll<PantryItem>(STORES.PANTRY);
    if (!pantry || pantry.length === 0) {
      for (const p of DEFAULT_PANTRY_ITEMS) {
        await localDbSet(STORES.PANTRY, p.id, p);
      }
    }

    const chores = await localDbGetAll<FamilyChore>(STORES.CHORES);
    if (!chores || chores.length === 0) {
      for (const c of DEFAULT_CHORES) {
        await localDbSet(STORES.CHORES, c.id, c);
      }
    }

    const currentSettings: AppSettings = (await localDbGet<AppSettings>(STORES.SETTINGS, 'current')) || DEFAULT_SETTINGS;
    const plan = await localDbGet<WeeklyPlan>(STORES.PLANS, 'week_0');
    if (!plan || !areRetailerSetsEqual(plan.active_retailers, currentSettings.active_retailers)) {
      const allMembers = await localDbGetAll<FamilyMember>(STORES.PROFILES);
      const allRecipes = await localDbGetAll<Recipe>(STORES.RECIPES);
      const effMembers = allMembers.length > 0 ? allMembers : DEFAULT_MEMBERS_RAW.map((m) => enrichFamilyMember(m));
      const effRecipes = allRecipes.length > 0 ? allRecipes : STARTER_RECIPES;
      const initialPlan = buildWeeklyPlan(0, effMembers, effRecipes, currentSettings.active_retailers, currentSettings.primary_retailer);
      await localDbSet(STORES.PLANS, 'week_0', initialPlan);
    }
  }

  /**
   * Main HTTP request router simulating a REST backend.
   */
  async handleRequest(path: string, options?: RequestInit): Promise<Response> {
    await this.ensureInitialized();

    const method = (options?.method || 'GET').toUpperCase();
    const url = new URL(path, 'http://localhost');
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    let bodyData: any = null;
    if (options?.body) {
      try {
        bodyData = JSON.parse(options.body as string);
      } catch {
        bodyData = options.body;
      }
    }

    try {
      // 1. SETTINGS
      if (pathname === '/api/settings') {
        if (method === 'GET') {
          const settings = (await localDbGet<AppSettings>(STORES.SETTINGS, 'current')) || DEFAULT_SETTINGS;
          return this.json(settings);
        }
        if (method === 'POST') {
          const current = (await localDbGet<AppSettings>(STORES.SETTINGS, 'current')) || DEFAULT_SETTINGS;
          const updated = { ...current, ...bodyData };
          await localDbSet(STORES.SETTINGS, 'current', updated);

          const retailersChanged =
            !areRetailerSetsEqual(current.active_retailers, updated.active_retailers) ||
            current.primary_retailer !== updated.primary_retailer;
          if (retailersChanged) {
            const allMembers = await localDbGetAll<FamilyMember>(STORES.PROFILES);
            const allRecipes = await localDbGetAll<Recipe>(STORES.RECIPES);
            const effMembers = allMembers.length > 0 ? allMembers : DEFAULT_MEMBERS_RAW.map((m) => enrichFamilyMember(m));
            const effRecipes = allRecipes.length > 0 ? allRecipes : STARTER_RECIPES;
            const updatedPlan = buildWeeklyPlan(0, effMembers, effRecipes, updated.active_retailers, updated.primary_retailer);
            await localDbSet(STORES.PLANS, 'week_0', updatedPlan);
          }

          return this.json(updated);
        }
      }

      // 2. PROFILES
      if (pathname === '/api/profiles') {
        if (method === 'GET') {
          const members = await localDbGetAll<FamilyMember>(STORES.PROFILES);
          return this.json(members);
        }
        if (method === 'POST') {
          const enriched = enrichFamilyMember(bodyData);
          await localDbSet(STORES.PROFILES, enriched.id, enriched);
          return this.json(enriched);
        }
      }
      if (pathname.startsWith('/api/profiles/')) {
        const id = pathname.replace('/api/profiles/', '');
        if (method === 'DELETE') {
          await localDbDelete(STORES.PROFILES, id);
          return this.json({ success: true, message: 'Profile deleted' });
        }
      }

      // 3. RECIPES
      if (pathname === '/api/recipes') {
        if (method === 'GET') {
          const recipes = await localDbGetAll<Recipe>(STORES.RECIPES);
          return this.json(recipes.length > 0 ? recipes : STARTER_RECIPES);
        }
        if (method === 'POST') {
          const newRecipe: Recipe = {
            id: bodyData.id || `rec-${Date.now()}`,
            ...bodyData,
          };
          await localDbSet(STORES.RECIPES, newRecipe.id, newRecipe);
          return this.json(newRecipe);
        }
      }
      if (pathname.startsWith('/api/recipes/')) {
        const id = pathname.replace('/api/recipes/', '');
        if (method === 'PUT' || method === 'POST') {
          await localDbSet(STORES.RECIPES, id, bodyData);
          return this.json(bodyData);
        }
        if (method === 'DELETE') {
          await localDbDelete(STORES.RECIPES, id);
          return this.json({ success: true });
        }
      }

      // 4. PANTRY
      if (pathname === '/api/pantry') {
        if (method === 'GET') {
          const items = await localDbGetAll<PantryItem>(STORES.PANTRY);
          return this.json(items);
        }
        if (method === 'POST') {
          const item: PantryItem = {
            id: bodyData.id || `pnt-${Date.now()}`,
            added_date: new Date().toISOString(),
            ...bodyData,
          };
          await localDbSet(STORES.PANTRY, item.id, item);
          return this.json(item);
        }
      }
      if (pathname.startsWith('/api/pantry/')) {
        const sub = pathname.replace('/api/pantry/', '');
        if (sub === 'cook-meal' && method === 'POST') {
          return this.json({ success: true, deducted: bodyData?.ingredients?.length || 0 });
        }
        if (sub === 'book-cart' && method === 'POST') {
          const itemsToBook = bodyData?.items || [];
          for (const it of itemsToBook) {
            const pntItem: PantryItem = {
              id: `pnt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: it.name,
              current_quantity: (it.packs_to_buy || 1) * (it.pack_size || 500),
              unit: it.unit || 'g',
              category: it.category || 'Vorratskammer',
              shelf_life_status: 'fresh',
              days_left: 60,
              source: it.retailer || 'Supermarkt',
              added_date: new Date().toISOString(),
            };
            await localDbSet(STORES.PANTRY, pntItem.id, pntItem);
          }
          return this.json({ success: true, count: itemsToBook.length });
        }
        if (method === 'DELETE') {
          await localDbDelete(STORES.PANTRY, sub);
          return this.json({ success: true });
        }
      }

      // 5. CUSTOM SHOPPING ITEMS
      if (pathname === '/api/custom-shopping-items') {
        if (method === 'POST') {
          const newItem: CustomShoppingItem = {
            id: bodyData.id || `cst-${Date.now()}`,
            name: bodyData.name,
            quantity: Number(bodyData.quantity || 1),
            unit: bodyData.unit || 'Stück',
            category: bodyData.category || 'Sonstiges',
            retailer: bodyData.retailer || 'Netto',
            notes: bodyData.notes || '',
            is_checked: false,
          };
          await localDbSet(STORES.CUSTOM_ITEMS, newItem.id, newItem);
          return this.json(newItem);
        }
      }
      if (pathname.startsWith('/api/custom-shopping-items/')) {
        const id = pathname.replace('/api/custom-shopping-items/', '');
        if (method === 'DELETE') {
          await localDbDelete(STORES.CUSTOM_ITEMS, id);
          return this.json({ success: true });
        }
      }

      // 6. WEEKLY PLAN
      if (pathname === '/api/plan/current') {
        const weekOffset = parseInt(searchParams.get('week_offset') || '0', 10);
        const settings = (await localDbGet<AppSettings>(STORES.SETTINGS, 'current')) || DEFAULT_SETTINGS;
        let plan = await localDbGet<WeeklyPlan>(STORES.PLANS, `week_${weekOffset}`);
        if (!plan || !areRetailerSetsEqual(plan.active_retailers, settings.active_retailers)) {
          const members = await localDbGetAll<FamilyMember>(STORES.PROFILES);
          const recipes = await localDbGetAll<Recipe>(STORES.RECIPES);
          const effMembers = members.length > 0 ? members : DEFAULT_MEMBERS_RAW.map((m) => enrichFamilyMember(m));
          const effRecipes = recipes.length > 0 ? recipes : STARTER_RECIPES;
          plan = buildWeeklyPlan(weekOffset, effMembers, effRecipes, settings.active_retailers, settings.primary_retailer);
          await localDbSet(STORES.PLANS, `week_${weekOffset}`, plan);
        }
        return this.json(plan);
      }
      if (pathname === '/api/plan/generate') {
        const weekOffset = parseInt(searchParams.get('week_offset') || '0', 10);
        const settings = (await localDbGet<AppSettings>(STORES.SETTINGS, 'current')) || DEFAULT_SETTINGS;
        const members = await localDbGetAll<FamilyMember>(STORES.PROFILES);
        const recipes = await localDbGetAll<Recipe>(STORES.RECIPES);
        const effMembers = members.length > 0 ? members : DEFAULT_MEMBERS_RAW.map((m) => enrichFamilyMember(m));
        const effRecipes = recipes.length > 0 ? recipes : STARTER_RECIPES;
        const newPlan = buildWeeklyPlan(weekOffset, effMembers, effRecipes, settings.active_retailers, settings.primary_retailer);
        await localDbSet(STORES.PLANS, `week_${weekOffset}`, newPlan);
        return this.json(newPlan);
      }
      if (pathname === '/api/plan/swap' && method === 'POST') {
        const { day_index, meal_type, week_offset = 0 } = bodyData || {};
        const settings = (await localDbGet<AppSettings>(STORES.SETTINGS, 'current')) || DEFAULT_SETTINGS;
        const cleanPrimary = (settings.active_retailers.includes(settings.primary_retailer) ? settings.primary_retailer : settings.active_retailers[0]) || 'Netto';
        let plan = await localDbGet<WeeklyPlan>(STORES.PLANS, `week_${week_offset}`);
        if (plan && plan.days[day_index]) {
          const recipes = await localDbGetAll<Recipe>(STORES.RECIPES);
          const effRecipes = recipes.length > 0 ? recipes : STARTER_RECIPES;
          const candidates = effRecipes.filter((r) => r.meal_type === meal_type);
          const prioritizedCandidates = prioritizeRecipes(candidates, settings.active_retailers);
          const randomRec = prioritizedCandidates[Math.floor(Math.random() * prioritizedCandidates.length)] || effRecipes[0];
          const sanitizedRec = sanitizeRecipe(randomRec, settings.active_retailers, cleanPrimary);

          if (meal_type === 'breakfast_lunchbox') plan.days[day_index].breakfast = sanitizedRec;
          else if (meal_type === 'lunch_lunchbox') plan.days[day_index].lunch = sanitizedRec;
          else plan.days[day_index].dinner = sanitizedRec;

          const members = await localDbGetAll<FamilyMember>(STORES.PROFILES);
          const effMembers = members.length > 0 ? members : DEFAULT_MEMBERS_RAW.map((m) => enrichFamilyMember(m));
          effMembers.forEach((m) => {
            if (plan && plan.days[day_index].portions[m.id]) {
              const scaled = scaleRecipeForPerson(sanitizedRec, m, meal_type, settings.active_retailers, cleanPrimary);
              if (meal_type === 'breakfast_lunchbox') plan.days[day_index].portions[m.id].breakfast = scaled;
              else if (meal_type === 'lunch_lunchbox') plan.days[day_index].portions[m.id].lunch = scaled;
              else plan.days[day_index].portions[m.id].dinner = scaled;
            }
          });

          await localDbSet(STORES.PLANS, `week_${week_offset}`, plan);
        }
        return this.json(plan);
      }

      // 7. SHOPPING LIST
      if (pathname === '/api/shopping-list') {
        const weekOffset = parseInt(searchParams.get('week_offset') || '0', 10);
        const daysParam = searchParams.get('days');
        const filterDays = daysParam ? daysParam.split(',') : undefined;
        const settings = (await localDbGet<AppSettings>(STORES.SETTINGS, 'current')) || DEFAULT_SETTINGS;

        let plan = await localDbGet<WeeklyPlan>(STORES.PLANS, `week_${weekOffset}`);
        if (!plan || !areRetailerSetsEqual(plan.active_retailers, settings.active_retailers)) {
          const members = await localDbGetAll<FamilyMember>(STORES.PROFILES);
          const recipes = await localDbGetAll<Recipe>(STORES.RECIPES);
          const effMembers = members.length > 0 ? members : DEFAULT_MEMBERS_RAW.map((m) => enrichFamilyMember(m));
          const effRecipes = recipes.length > 0 ? recipes : STARTER_RECIPES;
          plan = buildWeeklyPlan(weekOffset, effMembers, effRecipes, settings.active_retailers, settings.primary_retailer);
          await localDbSet(STORES.PLANS, `week_${weekOffset}`, plan);
        }

        const customItems = await localDbGetAll<CustomShoppingItem>(STORES.CUSTOM_ITEMS);
        const pantryItems = await localDbGetAll<PantryItem>(STORES.PANTRY);

        const shoppingList = buildShoppingList(
          plan,
          customItems,
          pantryItems,
          settings.active_retailers,
          filterDays
        );
        return this.json(shoppingList);
      }
      if (pathname.startsWith('/api/shopping-list/export-whatsapp')) {
        const shoppingRes = await this.handleRequest('/api/shopping-list');
        const list: ShoppingList = await shoppingRes.json();
        const text = `🛒 FitPlaner Einkaufsliste (${list.week_label}):\nGesamtkosten ca. ${list.total_price.toFixed(
          2
        )} € | Ersparnis: ${list.total_savings.toFixed(2)} €`;
        return this.json({ text, total_cost: list.total_price });
      }

      // 8. BUDGET
      if (pathname === '/api/budget' && method === 'POST') {
        const settings = (await localDbGet<AppSettings>(STORES.SETTINGS, 'current')) || DEFAULT_SETTINGS;
        settings.default_weekly_budget = Number(bodyData.budget || 120.0);
        await localDbSet(STORES.SETTINGS, 'current', settings);

        const budgetInfo: BudgetInfo = {
          week_offset: bodyData.week_offset || 0,
          week_label: 'Aktuelle Woche',
          budget: settings.default_weekly_budget,
          total_cost: 98.40,
          difference: settings.default_weekly_budget - 98.40,
          percentage_used: Math.round((98.40 / settings.default_weekly_budget) * 100),
          status: 'ok',
          savings: 24.80,
          saving_tips: [
            'Nutze Angebote bei Netto & Lidl für frische Beeren und Geflügel.',
            'Plane Mahlzeiten mit Vorratsartikeln wie Haferflocken und Reis ein.',
          ],
        };
        return this.json(budgetInfo);
      }

      // 9. LEAFLETS & OFFERS (Standalone Scraper via Marktguru & Prospekte)
      if (pathname === '/api/leaflets') {
        const leaflets = getLeaflets();
        return this.json(leaflets);
      }
      if (pathname === '/api/offers') {
        const zip = searchParams.get('zip_code') || '30159';
        const onlyHealthy = searchParams.get('only_healthy') !== 'false';
        const offers = await fetchLiveSupermarketOffers(zip, onlyHealthy);
        return this.json(offers);
      }

      // 10. DAILY HUB
      if (pathname === '/api/daily-hub') {
        const now = new Date();
        const weekday = (now.getDay() + 6) % 7;
        const currentDayName = DAYS_OF_WEEK[weekday];
        const currentDate = now.toLocaleDateString('de-DE');

        const hour = now.getHours();
        let timeSlot: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
        if (hour >= 11 && hour < 16) timeSlot = 'afternoon';
        else if (hour >= 16 && hour < 22) timeSlot = 'evening';
        else if (hour >= 22 || hour < 5) timeSlot = 'night';

        const settings = (await localDbGet<AppSettings>(STORES.SETTINGS, 'current')) || DEFAULT_SETTINGS;
        let plan = await localDbGet<WeeklyPlan>(STORES.PLANS, 'week_0');
        if (!plan || !areRetailerSetsEqual(plan.active_retailers, settings.active_retailers)) {
          const members = await localDbGetAll<FamilyMember>(STORES.PROFILES);
          const recipes = await localDbGetAll<Recipe>(STORES.RECIPES);
          const effMembers = members.length > 0 ? members : DEFAULT_MEMBERS_RAW.map((m) => enrichFamilyMember(m));
          const effRecipes = recipes.length > 0 ? recipes : STARTER_RECIPES;
          plan = buildWeeklyPlan(0, effMembers, effRecipes, settings.active_retailers, settings.primary_retailer);
          await localDbSet(STORES.PLANS, 'week_0', plan);
        }

        const dayPlan = plan.days[weekday] || plan.days[0];
        const nextDayPlan = plan.days[(weekday + 1) % 7] || plan.days[0];

        const hub: DailyHubResponse = {
          current_day_name: currentDayName,
          current_date: currentDate,
          day_index: weekday,
          time_slot: timeSlot,
          work_end_time: '17:00',
          store_name: 'Netto Marken-Discount',
          store_closing_time: '20:00',
          store_status_text: '🟢 Geöffnet bis 20:00 Uhr (Feierabend: 17:00 Uhr)',
          is_store_open: weekday !== 6,
          fresh_pick_item: {
            name: 'Frische Bio-Blaubeeren',
            amount: '250 g',
            retailer: 'Netto Marken-Discount',
            price: 1.49,
            reason: 'Frisch nach Feierabend mitnehmen: Garantiert saftig!',
            tip: 'Direkt im Eingangsbereich in der Obsttheke.',
          },
          is_fresh_pick_bought: this.dailyActionsState.fresh_pick_bought,
          lunchbox_breakfast: {
            id: dayPlan.breakfast.id,
            title: dayPlan.breakfast.title,
            calories: dayPlan.breakfast.base_calories,
            protein: dayPlan.breakfast.base_protein_g,
            prep_time: dayPlan.breakfast.prep_time_minutes,
            lunchbox_ready: dayPlan.breakfast.lunchbox_ready,
            tip: 'Morgens in 3 Minuten angerührt oder to-go im Schraubglas.',
            quick_instructions: dayPlan.breakfast.instructions?.[0] || 'Zutaten anrühren.',
          },
          lunchbox_lunch: {
            id: dayPlan.lunch.id,
            title: dayPlan.lunch.title,
            calories: dayPlan.lunch.base_calories,
            protein: dayPlan.lunch.base_protein_g,
            prep_time: dayPlan.lunch.prep_time_minutes,
            lunchbox_ready: dayPlan.lunch.lunchbox_ready,
            tip: 'Perfekt für die Mittagspause to-go – kalt genießbar.',
            quick_instructions: dayPlan.lunch.instructions?.[0] || 'Frisch portionieren.',
          },
          is_lunchbox_packed: this.dailyActionsState.lunchbox_packed,
          breakfast_recipe: dayPlan.breakfast,
          lunch_recipe: dayPlan.lunch,
          dinner_recipe: dayPlan.dinner,
          tomorrow_breakfast_recipe: nextDayPlan.breakfast,
          tomorrow_lunch_recipe: nextDayPlan.lunch,
          breakfast_plate_portions: { Dennis: '🥄 2 Kellen + Haferflocken', Sarah: '🥄 1,5 Kellen + Beeren' },
          lunch_plate_portions: { Dennis: '🥄 2 volle Boxen', Sarah: '🥄 1 Box mit extra Salat' },
          dinner_plate_portions: { Dennis: '🥄 3 Kellen Pfanne', Sarah: '🥄 2 Kellen mit Brokkoli' },
          is_dinner_cooked: this.dailyActionsState.dinner_cooked,
          dishes_badge: '🍳 1 Pfanne / Topf (Zero-Stress)',
          cook_time_badge: `⏱️ ${dayPlan.dinner.cook_time_minutes || 20} Min.`,
          prep_tomorrow_summary: {
            breakfast_prep: `${nextDayPlan.breakfast.title} vorbereiten`,
            lunchbox_prep: `Brotdose für ${nextDayPlan.lunch.title} bereitstellen`,
            defrost_needed: undefined,
            est_minutes: 10,
          },
        };
        return this.json(hub);
      }
      if (pathname === '/api/daily-hub/action' && method === 'POST') {
        const action = bodyData?.action;
        if (action === 'toggle_fresh_pick') this.dailyActionsState.fresh_pick_bought = !this.dailyActionsState.fresh_pick_bought;
        else if (action === 'toggle_lunchbox') this.dailyActionsState.lunchbox_packed = !this.dailyActionsState.lunchbox_packed;
        else if (action === 'toggle_dinner') this.dailyActionsState.dinner_cooked = !this.dailyActionsState.dinner_cooked;

        return this.handleRequest('/api/daily-hub');
      }

      // 11. TIME OF DAY
      if (pathname === '/api/time-of-day') {
        const hour = new Date().getHours();
        let slot = 'morning';
        if (hour >= 11 && hour < 16) slot = 'afternoon';
        else if (hour >= 16 && hour < 22) slot = 'evening';
        else if (hour >= 22 || hour < 5) slot = 'night';
        return this.json({ time_slot: slot, hour });
      }

      // 12. FAMILY VITALITY & WATER
      if (pathname === '/api/vitality/radar') {
        const members = await localDbGetAll<FamilyMember>(STORES.PROFILES);
        const details = members.map((m) => {
          const waterTarget = m.daily_water_target_ml || 2000;
          const waterCurrent = m.water_intake_ml || 0;
          const waterPct = Math.min(100, Math.round((waterCurrent / waterTarget) * 100));
          const score = Math.round(waterPct * 0.5 + Math.min(50, (m.chore_points || 0)));

          return {
            member_id: m.id,
            member_name: m.name,
            age: m.age,
            age_group: m.age_group || 'adult',
            role_title: m.role_title || 'Mitglied',
            score: score,
            status: score >= 80 ? 'Optimal' : score >= 50 ? 'Gut' : 'Aufbauend',
            calories_target: m.target_calories || 2000,
            protein_target_g: m.target_protein_g || 100,
            fiber_target_g: 30,
            water_intake_ml: waterCurrent,
            water_target_ml: waterTarget,
            water_percent: waterPct,
            key_focus_nutrient: 'Wasser & Proteine',
            actionable_tip: 'Denke an ein Glas Wasser zur nächsten Mahlzeit.',
            badges: score >= 80 ? ['🌟 Vital-Champion'] : score >= 50 ? ['🌱 Vital-Aufsteiger'] : ['💤 Startklar'],
          };
        });

        const avgScore = details.length > 0 ? Math.round(details.reduce((a, b) => a + b.score, 0) / details.length) : 85;

        const vitalityScore: FamilyVitalityScore = {
          overall_score: avgScore,
          status_label: avgScore >= 80 ? '🌟 Familie in Topform' : '🌱 Auf dem Weg',
          status_color: 'emerald',
          plants_count: 14,
          plants_target: 30,
          plants_percent: 46,
          plants_list: ['Brokkoli', 'Blaubeeren', 'Spinat', 'Haferflocken', 'Avocado'],
          missing_plant_types: ['Hülsenfrüchte', 'Kerne'],
          fiber_score: 82,
          omega3_score: 90,
          sugar_radar_score: 88,
          hydration_score: 85,
          family_points_total: 120,
          family_star_goal: 150,
          family_star_percent: 80,
          vitality_tips: [
            'Denke an ein Glas frisches Wasser vor dem Essen.',
            'Ergänze heute noch eine Handvoll Beeren oder Nüsse.',
          ],
          members: details,
        };
        return this.json(vitalityScore);
      }
      if (pathname.includes('/water') && method === 'POST') {
        const memberId = pathname.split('/')[4];
        const amount = Number(bodyData?.amount_ml || 250);
        const member = await localDbGet<FamilyMember>(STORES.PROFILES, memberId);
        if (member) {
          member.water_intake_ml = (member.water_intake_ml || 0) + amount;
          await localDbSet(STORES.PROFILES, member.id, member);
        }
        return this.json({ success: true, new_total: member?.water_intake_ml || 0 });
      }

      // 13. FAMILY CHORES
      if (pathname === '/api/family/chores') {
        if (method === 'GET') {
          const chores = await localDbGetAll<FamilyChore>(STORES.CHORES);
          return this.json(chores);
        }
      }
      if (pathname.includes('/chores/') && pathname.endsWith('/toggle') && method === 'POST') {
        const choreId = pathname.split('/')[4];
        const chore = await localDbGet<FamilyChore>(STORES.CHORES, choreId);
        if (chore) {
          chore.is_completed = !chore.is_completed;
          await localDbSet(STORES.CHORES, chore.id, chore);

          // Update member points
          if (chore.assigned_member_id) {
            const member = await localDbGet<FamilyMember>(STORES.PROFILES, chore.assigned_member_id);
            if (member) {
              member.chore_points = (member.chore_points || 0) + (chore.is_completed ? chore.points : -chore.points);
              await localDbSet(STORES.PROFILES, member.id, member);
            }
          }
        }
        return this.json({ success: true, chore });
      }

      // 14. TIMELINE SCHEDULE
      if (pathname === '/api/schedule/timeline') {
        const timeline: DailyTimelineResponse = {
          date: new Date().toLocaleDateString('de-DE'),
          day_name: 'Heute',
          current_time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          settings: {
            wake_up_time: '06:30',
            work_start_time: '08:00',
            lunch_time: '12:30',
            work_end_time: '17:00',
            dinner_time: '18:30',
            evening_prep_time: '20:30',
            bed_time: '22:30',
          },
          progress_percent: 60,
          timeline: [
            {
              id: 'task-1',
              time_str: '06:30 - 07:15',
              title: 'Morgen-Routine & Lunchbox schnappen',
              category: 'prep',
              duration_minutes: 45,
              description: 'Haferflocken to-go & Wasserflaschen einpacken',
              assigned_members: ['Dennis', 'Sarah'],
              is_completed: true,
              is_current: false,
              urgency: 'done',
            },
            {
              id: 'task-2',
              time_str: '12:30 - 13:15',
              title: 'Gesunde Mittagspause (To-Go)',
              category: 'meal',
              duration_minutes: 45,
              description: 'Frische Power-Bowl mit Quinoa & Feta',
              assigned_members: ['Dennis', 'Sarah', 'Lea', 'Felix'],
              is_completed: false,
              is_current: true,
              urgency: 'now',
            },
            {
              id: 'task-3',
              time_str: '17:15 - 17:35',
              title: 'Frische-Pick auf Heimweg',
              category: 'fresh_pick',
              duration_minutes: 20,
              description: 'Blaubeeren bei Netto mitnehmen',
              assigned_members: ['Dennis'],
              is_completed: this.dailyActionsState.fresh_pick_bought,
              is_current: false,
              urgency: 'upcoming',
            },
            {
              id: 'task-4',
              time_str: '18:15 - 18:45',
              title: 'Gemeinsames Abendessen kochen',
              category: 'meal',
              duration_minutes: 30,
              description: 'Lachs auf Ofengemüse (Zero-Stress 1 Blech)',
              assigned_members: ['Dennis', 'Sarah'],
              is_completed: this.dailyActionsState.dinner_cooked,
              is_current: false,
              urgency: 'upcoming',
            },
            {
              id: 'task-5',
              time_str: '20:30 - 20:45',
              title: '10-Minuten Vorabend-Prep für morgen',
              category: 'prep',
              duration_minutes: 15,
              description: 'Brotdosen spülen & Overnight Oats anrühren',
              assigned_members: ['Sarah'],
              is_completed: false,
              is_current: false,
              urgency: 'upcoming',
            },
          ],
        };
        return this.json(timeline);
      }
      if (pathname.includes('/schedule/task/') && pathname.endsWith('/toggle') && method === 'POST') {
        return this.json({ success: true });
      }
      if (pathname === '/api/schedule/prep-tomorrow/complete' && method === 'POST') {
        return this.json({ success: true, message: 'Prep completed' });
      }
      if (pathname === '/api/schedule/settings' && method === 'POST') {
        return this.json({ success: true, settings: bodyData });
      }

      // 15. MESH & SYNC
      if (pathname === '/api/sync/mesh-status') {
        return this.json({
          device_id: 'device-phone-local',
          device_name: 'Mein Smartphone (Autark)',
          device_ip: '127.0.0.1',
          mode: 'standalone',
          peers_count: 0,
          last_sync: new Date().toISOString(),
          status: 'ready',
        });
      }
      if (pathname === '/api/sync/mesh-pull') {
        const exportData = {
          settings: await localDbGet(STORES.SETTINGS, 'current'),
          profiles: await localDbGetAll(STORES.PROFILES),
          pantry: await localDbGetAll(STORES.PANTRY),
          recipes: await localDbGetAll(STORES.RECIPES),
          chores: await localDbGetAll(STORES.CHORES),
          plans: await localDbGetAll(STORES.PLANS),
          timestamp: new Date().toISOString(),
        };
        return this.json(exportData);
      }
      if (pathname === '/api/sync/mesh-push' && method === 'POST') {
        if (bodyData) {
          if (bodyData.settings) await localDbSet(STORES.SETTINGS, 'current', bodyData.settings);
          if (Array.isArray(bodyData.profiles)) {
            for (const p of bodyData.profiles) await localDbSet(STORES.PROFILES, p.id, p);
          }
          if (Array.isArray(bodyData.pantry)) {
            for (const it of bodyData.pantry) await localDbSet(STORES.PANTRY, it.id, it);
          }
        }
        return this.json({ success: true, imported: true });
      }

      // 16. INSTALLER & DISCOVERY
      if (pathname === '/api/installer/info') {
        return this.json({
          lan_ip: '127.0.0.1',
          port: 8090,
          server_url: 'http://localhost',
          paired_devices: [],
        });
      }
      if (pathname === '/api/discovery/broadcast' || pathname === '/api/discovery/scan') {
        return this.json({ devices: [] });
      }

      // 17. SCANNERS (BARCODE / RECEIPT)
      if (pathname === '/api/scanners/barcode' && method === 'POST') {
        const barcode = bodyData?.barcode || '';
        const pantry = await localDbGetAll<PantryItem>(STORES.PANTRY);
        const match = pantry.find((p) => p.ean_barcode === barcode || barcode.includes(p.name.slice(0, 4)));

        return this.json({
          barcode,
          found: true,
          product_name: match ? match.name : `Supermarkt Artikel (${barcode.slice(-4)})`,
          brand: 'Eigenmarke',
          quantity: 1,
          unit: 'Packung',
          category: 'Kühlregal',
        });
      }
      if (pathname === '/api/scanners/receipt' && method === 'POST') {
        return this.json({
          retailer: 'Netto Marken-Discount',
          receipt_date: new Date().toLocaleDateString('de-DE'),
          total_sum: 18.75,
          items: [
            { name: 'Bio Haferflocken', price: 0.79, quantity: 2, unit: 'g' },
            { name: 'Bio Magerquark 500g', price: 1.39, quantity: 2, unit: 'g' },
            { name: 'Frische Heidelbeeren', price: 1.99, quantity: 1, unit: 'g' },
          ],
        });
      }

      // Fallback 404
      return new Response(JSON.stringify({ error: `Not Found: ${pathname}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      console.error('[EmbeddedBackend Error]', pathname, err);
      return new Response(JSON.stringify({ error: err?.message || 'Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private json(data: any, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const embeddedBackend = new EmbeddedBackend();

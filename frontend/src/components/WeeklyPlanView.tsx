import React, { useState, useEffect } from 'react';
import { WeeklyPlan, FamilyMember, Recipe, PantryItem, PersonMealPortion, ScaledIngredient, DayPlan } from '../types';
import { RecipeModal } from './RecipeModal';
import { SavingsVitalityCockpit } from './SavingsVitalityCockpit';
import { ManualWeekPlannerModal } from './ManualWeekPlannerModal';
import { getRecipeGlycemicBadge } from '../utils/plantDiversityTracker';
import { formatHumanQuantity } from '../utils/humanQuantity';
import { apiFetch } from '../api/client';
import {
  Calendar, RefreshCw, Box, UtensilsCrossed, Clock, Flame, Sparkles,
  ArrowRightLeft, ChefHat, Sun, Moon, Coffee,
  ChevronLeft, ChevronRight, Wallet, AlertTriangle, Users, BookOpen, ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { isRecipeSafeForFamily, getRecipeFamilyConflicts } from '../backend_embedded/dietValidator';

/**
 * Utility to return authentic brand colors and border classes for German retailers.
 * Supports Netto, NP, Lidl, Aldi Nord/Süd, Rewe, Kaufland, Edeka, Vorratskammer, etc.
 */
export function getRetailerBadgeClass(retailer?: string): string {
  if (!retailer) {
    return 'bg-slate-100 text-slate-700 border border-slate-300 font-bold';
  }

  const r = retailer.toLowerCase().trim();

  // Netto Marken-Discount (Yellow & Red/Black)
  if (r.includes('netto')) {
    return 'bg-amber-400 text-stone-950 border border-amber-500 font-black';
  }

  // NP Discount (Red & White)
  if (r === 'np' || r.includes('np discount') || r.includes('np-') || r.startsWith('np ')) {
    return 'bg-red-600 text-white border border-red-700 font-bold';
  }

  // Lidl (Blue & Yellow)
  if (r.includes('lidl')) {
    return 'bg-blue-600 text-white border border-blue-700 font-bold';
  }

  // Aldi Süd / Aldi Nord
  if (r.includes('aldi')) {
    if (r.includes('süd') || r.includes('sued')) {
      return 'bg-indigo-700 text-white border border-indigo-800 font-bold';
    }
    return 'bg-sky-800 text-white border border-sky-900 font-bold';
  }

  // Rewe (Red & White)
  if (r.includes('rewe')) {
    return 'bg-red-700 text-white border border-red-800 font-bold';
  }

  // Kaufland (Dark Red / Crimson)
  if (r.includes('kaufland')) {
    return 'bg-rose-900 text-white border border-rose-950 font-bold';
  }

  // Edeka (Yellow & Blue)
  if (r.includes('edeka')) {
    return 'bg-yellow-400 text-blue-950 border border-blue-600 font-bold';
  }

  // Vorratskammer (Pantry Green)
  if (r.includes('vorrat')) {
    return 'bg-emerald-100 text-emerald-800 border border-emerald-400 font-bold';
  }

  // Default / Other
  return 'bg-slate-100 text-slate-700 border border-slate-300 font-bold';
}

export function resolveDisplayRetailer(retailer?: string, activeRetailers?: string[]): string {
  if (!retailer) return '';
  if (retailer === 'Vorratskammer') return 'Vorratskammer';
  if (activeRetailers && activeRetailers.length > 0) {
    if (!activeRetailers.includes(retailer)) {
      return activeRetailers[0];
    }
  }
  return retailer;
}

/**
 * Calculates aggregated portions and ingredients summed across all family members
 */
export function getAggregatedMealPortion(
  day: DayPlan,
  mealType: 'breakfast' | 'lunch' | 'dinner',
  members: FamilyMember[],
  recipe: Recipe,
  activeRetailers?: string[]
): PersonMealPortion {
  const portions = members
    .map((m) => day.portions?.[m.id]?.[mealType])
    .filter((p): p is PersonMealPortion => Boolean(p));

  const memberCount = members.length || 1;

  if (portions.length === 0) {
    return {
      member_id: 'all',
      member_name: `Gesamte Familie (${memberCount} Personen)`,
      meal_type: recipe.meal_type,
      recipe_title: recipe.title,
      scale_factor: memberCount,
      scaled_calories: recipe.base_calories * memberCount,
      scaled_protein_g: recipe.base_protein_g * memberCount,
      scaled_carbs_g: recipe.base_carbs_g * memberCount,
      scaled_fat_g: recipe.base_fat_g * memberCount,
      scaled_ingredients: recipe.ingredients.map((ing) => ({
        name: ing.name,
        amount: Math.round(ing.base_amount * memberCount * 10) / 10,
        unit: ing.unit,
        matched_retailer: resolveDisplayRetailer(ing.matched_offer_retailer, activeRetailers),
      })),
    };
  }

  const totalCalories = Math.round(portions.reduce((sum, p) => sum + (p.scaled_calories || 0), 0));
  const totalProtein = Math.round(portions.reduce((sum, p) => sum + (p.scaled_protein_g || 0), 0));
  const totalCarbs = Math.round(portions.reduce((sum, p) => sum + (p.scaled_carbs_g || 0), 0));
  const totalFat = Math.round(portions.reduce((sum, p) => sum + (p.scaled_fat_g || 0), 0));
  const avgScale = portions.reduce((sum, p) => sum + (p.scale_factor || 1), 0);

  // Aggregate ingredients by name and unit
  const ingredientMap = new Map<string, ScaledIngredient>();

  for (const p of portions) {
    for (const ing of p.scaled_ingredients || []) {
      const key = `${ing.name.trim().toLowerCase()}__${(ing.unit || '').trim().toLowerCase()}`;
      const existing = ingredientMap.get(key);
      const safeRetailer = resolveDisplayRetailer(ing.matched_retailer, activeRetailers);
      if (existing) {
        existing.amount = Math.round((existing.amount + ing.amount) * 10) / 10;
        if (!existing.matched_retailer && safeRetailer) {
          existing.matched_retailer = safeRetailer;
        }
      } else {
        ingredientMap.set(key, {
          name: ing.name,
          amount: Math.round(ing.amount * 10) / 10,
          unit: ing.unit,
          matched_retailer: safeRetailer,
        });
      }
    }
  }

  return {
    member_id: 'all',
    member_name: `Gesamte Familie (${memberCount} Personen)`,
    meal_type: portions[0]?.meal_type || recipe.meal_type,
    recipe_title: recipe.title,
    scale_factor: avgScale,
    scaled_calories: totalCalories,
    scaled_protein_g: totalProtein,
    scaled_carbs_g: totalCarbs,
    scaled_fat_g: totalFat,
    scaled_ingredients: Array.from(ingredientMap.values()),
  };
}

interface Props {
  plan: WeeklyPlan | null;
  members: FamilyMember[];
  allRecipes: Recipe[];
  pantryItems: PantryItem[];
  selectedWeekOffset: number;
  onChangeWeek: (offset: number) => void;
  onUpdateBudget: (budget: number) => Promise<void>;
  onGeneratePlan: () => Promise<void>;
  onSwapMeal: (dayIndex: number, mealType: string, newRecipeId: string) => Promise<void>;
  onCookMeal: (dayIndex: number, mealType: string) => Promise<void>;
  isGenerating: boolean;
  activeRetailers?: string[];
  onPlanOptimized?: (optimizedPlan: WeeklyPlan) => void;
  onSaveWeeklyPlan?: (plan: WeeklyPlan) => Promise<boolean>;
}

export const WeeklyPlanView: React.FC<Props> = ({
  plan,
  members,
  allRecipes,
  pantryItems,
  selectedWeekOffset,
  onChangeWeek,
  onUpdateBudget,
  onGeneratePlan,
  onSwapMeal,
  onCookMeal,
  isGenerating,
  activeRetailers,
  onPlanOptimized,
  onSaveWeeklyPlan,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || 'all');
  const [activeSwap, setActiveSwap] = useState<{ dayIndex: number; mealType: 'breakfast' | 'lunch' | 'dinner' } | null>(null);
  const [isManualPlannerOpen, setIsManualPlannerOpen] = useState(false);
  const [selectedRecipeModal, setSelectedRecipeModal] = useState<{
    recipe: Recipe;
    dayIndex: number;
    mealType: 'breakfast' | 'lunch' | 'dinner';
    isCooked: boolean;
    targetMember?: FamilyMember;
  } | null>(null);

  const resolveRecipe = (portion?: PersonMealPortion, fallback?: Recipe): Recipe => {
    if (portion?.recipe_id) {
      const found = allRecipes.find((r) => r.id === portion.recipe_id);
      if (found) return found;
    }
    if (portion?.recipe_title) {
      const found = allRecipes.find(
        (r) => r.title.toLowerCase() === portion.recipe_title.toLowerCase()
      );
      if (found) return found;
    }
    return fallback || allRecipes[0];
  };

  const [timeOfDayData, setTimeOfDayData] = useState<any | null>(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [customBudgetInput, setCustomBudgetInput] = useState<string>(
    plan?.budget ? String(plan.budget) : '120'
  );

  const isAllSelected = selectedMemberId === 'all';

  const familyMemberObject: FamilyMember = {
    id: 'all',
    name: `Gesamte Familie (${members.length} Personen)`,
    gender: 'female',
    age: 35,
    height_cm: 170,
    weight_kg: 70,
    activity_level: 'moderate',
    goal: 'maintain',
    dietary_preference: 'all',
    allergies: Array.from(new Set(members.flatMap((m) => m.allergies || []))),
    disliked_foods: Array.from(new Set(members.flatMap((m) => m.disliked_foods || []))),
    bmr: members.reduce((sum, m) => sum + (m.bmr || 0), 0),
    tdee: members.reduce((sum, m) => sum + (m.tdee || 0), 0),
    target_calories: members.reduce((sum, m) => sum + (m.target_calories || 2000), 0),
    target_protein_g: members.reduce((sum, m) => sum + (m.target_protein_g || 0), 0),
    target_carbs_g: members.reduce((sum, m) => sum + (m.target_carbs_g || 0), 0),
    target_fat_g: members.reduce((sum, m) => sum + (m.target_fat_g || 0), 0),
  };

  const currentMember = isAllSelected
    ? familyMemberObject
    : members.find((m) => m.id === selectedMemberId) || members[0] || familyMemberObject;

  useEffect(() => {
    fetchTimeOfDay();
  }, [plan]);

  useEffect(() => {
    if (plan?.budget) {
      setCustomBudgetInput(String(plan.budget));
    }
  }, [plan?.budget]);

  const fetchTimeOfDay = async () => {
    try {
      const res = await apiFetch('/api/time-of-day');
      const data = await res.json();
      setTimeOfDayData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyBudget = async (val: number) => {
    if (val > 0) {
      await onUpdateBudget(val);
      setIsEditingBudget(false);
    }
  };

  if (!plan) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Noch kein Wochenplan erstellt</h3>
        <p className="text-slate-500 text-sm mb-6">
          Klicke auf den Button, um in Sekundenschnelle einen gesunden Wochenplan aus Netto- & NP-Angeboten für alle Familienmitglieder zu generieren.
        </p>
        <button
          onClick={onGeneratePlan}
          disabled={isGenerating}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-200 transition flex items-center gap-2 mx-auto disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5" />
          {isGenerating ? 'Plane Mahlzeiten...' : '1-Klick Wochenplan erstellen'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. WOCHEN-NAVIGATION BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => onChangeWeek(selectedWeekOffset - 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
            title="Vorherige Kalenderwoche"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Vorherige Woche</span>
            <span className="sm:hidden">Zurück</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              {plan.week_label}
            </span>
            {selectedWeekOffset === 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                Aktuell
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600">
                {selectedWeekOffset > 0 ? `+${selectedWeekOffset} Wo.` : `${selectedWeekOffset} Wo.`}
              </span>
            )}
          </div>

          <button
            onClick={() => onChangeWeek(selectedWeekOffset + 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
            title="Nächste Kalenderwoche"
          >
            <span className="hidden sm:inline">Nächste Woche</span>
            <span className="sm:hidden">Weiter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {selectedWeekOffset !== 0 && (
            <button
              onClick={() => onChangeWeek(0)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition"
            >
              📍 Zu Heute
            </button>
          )}

          <button
            onClick={() => setIsManualPlannerOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
            title="Woche Tag für Tag selbst planen und anpassen"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Woche planen</span>
          </button>

          <button
            onClick={onGeneratePlan}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generiere...' : 'Woche neu planen'}
          </button>
        </div>
      </div>

      {/* 2. SUPER-APP SPAR- & VITALITÄTS-COCKPIT */}
      <SavingsVitalityCockpit
        plan={plan}
        activeRetailers={activeRetailers || plan.active_retailers || ['Netto', 'NP']}
        pantryItems={pantryItems}
        onPlanOptimized={onPlanOptimized}
      />

      {/* 3. WÖCHENTLICHE BUDGETPLANUNG CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-lg border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Wöchentliche Budgetplanung
              </h3>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                plan.budget_status === 'exceeded'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : plan.budget_status === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {plan.budget_status === 'exceeded' ? '⚠️ Budget überschritten' :
                 plan.budget_status === 'warning' ? '⚡ Fast am Limit' : '✅ Im Budget'}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Individuell anpassbar für diese Woche – ideal z. B. am Monatsende mit kleinerem Budget.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Wochenbudget</span>
              <span className="text-lg sm:text-xl font-black text-white">{(plan.budget || 120).toFixed(2)} €</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Geplant</span>
              <span className="text-lg sm:text-xl font-black text-slate-200">{(plan.total_estimated_cost || 0).toFixed(2)} €</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Restbudget</span>
              <span className={`text-lg sm:text-xl font-black ${
                (plan.budget_difference || 0) < 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {(plan.budget_difference || 0) > 0 ? '+' : ''}{(plan.budget_difference || 0).toFixed(2)} €
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Netto/NP Ersparnis</span>
              <span className="text-lg sm:text-xl font-black text-emerald-300">~{(plan.total_savings || 0).toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Budget-Auslastung: {Math.round(((plan.total_estimated_cost || 0) / Math.max(1, plan.budget || 120)) * 100)}%</span>
            <span>Limit: {(plan.budget || 120).toFixed(2)} €</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                plan.budget_status === 'exceeded'
                  ? 'bg-gradient-to-r from-amber-500 to-red-500'
                  : plan.budget_status === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{
                width: `${Math.min(100, Math.round(((plan.total_estimated_cost || 0) / Math.max(1, plan.budget || 120)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Budget Setting Controls */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 mr-1">Schnell-Budget:</span>
            {[50, 75, 100, 120, 150].map((b) => (
              <button
                key={b}
                onClick={() => handleApplyBudget(b)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  plan.budget === b
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {b} €
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isEditingBudget ? (
              <button
                onClick={() => setIsEditingBudget(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline transition"
              >
                Eigenes Budget eingeben
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="20"
                  max="500"
                  step="5"
                  value={customBudgetInput}
                  onChange={(e) => setCustomBudgetInput(e.target.value)}
                  className="w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded-lg text-xs font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-400 font-bold">€</span>
                <button
                  onClick={() => handleApplyBudget(parseFloat(customBudgetInput) || 120)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setIsEditingBudget(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Over Budget Advisory Banner */}
        {plan.budget_status === 'exceeded' && (
          <div className="mt-4 p-3.5 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-200">
              <span className="font-bold text-white block mb-0.5">
                Spar-Empfehlung: Geplante Mahlzeiten liegen {Math.abs(plan.budget_difference || 0).toFixed(2)} € über dem Wunschbudget
              </span>
              Tausche teurere Mahlzeiten mit dem Tausch-Button gegen günstige Netto- & NP-Hits wie Rote-Linsen-Curry, Haferflocken-Bowls oder Kichererbsen-Salate, um dein Budget einzuhalten.
            </div>
          </div>
        )}
      </div>

      {/* SUPERMARKT-PROSPEKT HORIZONT & REZEPT-UNIVERSUM STATUS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            plan.leaflet_availability_status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : plan.leaflet_availability_status === 'preview'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                plan.leaflet_availability_status === 'active'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : plan.leaflet_availability_status === 'preview'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {plan.leaflet_availability_status === 'active' && '🟢 Aktuelle Discounter-Prospekte aktiv'}
                {plan.leaflet_availability_status === 'preview' && '🟣 Vorab-Vorschau (Discounter)'}
                {plan.leaflet_availability_status === 'not_yet_published' && '📅 Prospekt-Horizont: Noch nicht veröffentlicht'}
                {plan.leaflet_availability_status === 'archived' && '📁 Prospekt-Archiv'}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                • 1.220+ Offline-Rezepte • 0 Wiederholungen
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {plan.leaflet_availability_note ||
                (plan.active_retailers && plan.active_retailers.length > 0
                  ? `Reale Angebote mit aktiven Supermärkten synchronisiert (${plan.active_retailers.join(', ')}).`
                  : 'Reale Angebote mit Netto & NP synchronisiert.')}
            </p>
          </div>
        </div>

        {/* Dynamic Supermarket Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Supermärkte:</span>
          {(plan.active_retailers && plan.active_retailers.length > 0
            ? plan.active_retailers
            : ['Netto', 'NP']
          ).map((retailerName) => (
            <span
              key={retailerName}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black shadow-xs ${getRetailerBadgeClass(retailerName)}`}
            >
              {retailerName}
            </span>
          ))}
        </div>
      </div>

      {/* SMART TIME-OF-DAY HERO WIDGET ("WAS STEHT JETZT AN?") */}
      {timeOfDayData && timeOfDayData.suggested_recipe && selectedWeekOffset === 0 && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black backdrop-blur-sm flex items-center gap-1.5">
                {timeOfDayData.time_slot === 'breakfast' ? <Coffee className="w-3.5 h-3.5" /> :
                 timeOfDayData.time_slot === 'lunch' ? <Sun className="w-3.5 h-3.5" /> :
                 timeOfDayData.time_slot === 'dinner' ? <ChefHat className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {timeOfDayData.greeting} • JETZT ANSTEHEND
              </span>
              <span className="text-xs text-emerald-200 font-bold">({timeOfDayData.current_day_name})</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black mb-1">{timeOfDayData.suggested_recipe.title}</h3>
            <p className="text-xs text-emerald-100 max-w-xl">{timeOfDayData.subtext}</p>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setSelectedRecipeModal({
                  recipe: timeOfDayData.suggested_recipe,
                  dayIndex: timeOfDayData.day_index,
                  mealType: timeOfDayData.time_slot === 'lunch' ? 'lunch' : timeOfDayData.time_slot === 'dinner' ? 'dinner' : 'breakfast',
                  isCooked: false,
                });
              }}
              className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-950 font-black rounded-2xl shadow-lg transition active:scale-95 text-xs sm:text-sm"
            >
              <ChefHat className="w-4 h-4 text-emerald-600" />
              Rezept & Kochanleitung öffnen
            </button>
          </div>
        </div>
      )}

      {/* Action Banner & Member Selector */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-800">Familien-Portionen & Mahlzeiten</h2>
          </div>
          <p className="text-xs text-slate-500">
            Wähle ein Familienmitglied oder die Gesamt-Familie, um die exakten Mengenangaben zu sehen, oder klicke auf ein Gericht für das Rezept.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Member Picker with 'all' option */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <span className="text-xs font-bold text-slate-500 pl-2">Portionen:</span>
            <button
              onClick={() => setSelectedMemberId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedMemberId === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👨‍👩‍👧‍👦 Alle (Gesamt-Familie)
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedMemberId === m.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7 Days Grid */}
      <div className="space-y-6">
        {plan.days.map((day, dayIndex) => {
          const memberPortions = day.portions?.[currentMember.id];
          const bfPortion = isAllSelected
            ? getAggregatedMealPortion(day, 'breakfast', members, day.breakfast, plan.active_retailers)
            : memberPortions?.breakfast;
          const luPortion = isAllSelected
            ? getAggregatedMealPortion(day, 'lunch', members, day.lunch, plan.active_retailers)
            : memberPortions?.lunch;
          const diPortion = isAllSelected
            ? getAggregatedMealPortion(day, 'dinner', members, day.dinner, plan.active_retailers)
            : memberPortions?.dinner;

          const currentBfRecipe = isAllSelected ? day.breakfast : resolveRecipe(bfPortion, day.breakfast);
          const currentLuRecipe = isAllSelected ? day.lunch : resolveRecipe(luPortion, day.lunch);
          const currentDiRecipe = isAllSelected ? day.dinner : resolveRecipe(diPortion, day.dinner);

          const distinctBfMembers = members.map((m) => ({
            member: m,
            portion: day.portions?.[m.id]?.breakfast,
            recipe: resolveRecipe(day.portions?.[m.id]?.breakfast, day.breakfast),
          }));
          const distinctBfIds = Array.from(new Set(distinctBfMembers.map((item) => item.recipe.id)));
          const hasMultipleBf = isAllSelected && distinctBfIds.length > 1;

          const distinctLuMembers = members.map((m) => ({
            member: m,
            portion: day.portions?.[m.id]?.lunch,
            recipe: resolveRecipe(day.portions?.[m.id]?.lunch, day.lunch),
          }));
          const distinctLuIds = Array.from(new Set(distinctLuMembers.map((item) => item.recipe.id)));
          const hasMultipleLu = isAllSelected && distinctLuIds.length > 1;

          const plannedCals = isAllSelected
            ? members.reduce((sum, m) => sum + (day.daily_nutrition_by_member?.[m.id]?.calories || 0), 0)
            : (day.daily_nutrition_by_member?.[currentMember.id]?.calories || 0);
          const targetCals = isAllSelected
            ? members.reduce((sum, m) => sum + (m.target_calories || 2000), 0)
            : (currentMember.target_calories || 2000);
          const calPercent = Math.min(100, Math.round((plannedCals / Math.max(1, targetCals)) * 100));

          return (
            <div
              key={dayIndex}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Day Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-base font-black uppercase tracking-wider text-emerald-400">
                    {day.day_name}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">({day.date})</span>
                  {day.is_planned === false && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      🏖️ Planungsfrei
                    </span>
                  )}
                </div>

                {/* Target Progress Bar */}
                {day.is_planned !== false ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-300">
                      {isAllSelected ? (
                        <>Tages-Ziel <span className="font-bold text-white">Gesamt-Familie ({members.length} Personen)</span>:</>
                      ) : (
                        <>Tages-Ziel <span className="font-bold text-white">{currentMember.name}</span>:</>
                      )}
                    </span>
                    <span className="text-xs font-bold text-emerald-300">
                      {plannedCals} / {targetCals} kcal
                    </span>
                    <div className="w-24 bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all"
                        style={{ width: `${calPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-amber-300/80 font-medium italic">
                    Keine Mahlzeiten eingeplant
                  </span>
                )}
              </div>

              {day.is_planned === false ? (
                /* Planungsfreier Tag Relax-Kachel */
                <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 flex flex-col items-center justify-center gap-3.5 border-t border-slate-100">
                  <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl shadow-xs">
                    🏖️
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base sm:text-lg font-black text-slate-800">
                      🏖️ Planungsfreier Tag (Kein Kochen geplant)
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Für <strong>{day.day_name}</strong> ist laut deinen Haushalts-Einstellungen kein Kochen vorgesehen.
                      Perfekt für Restaurantbesuche, Familienausflüge oder Resteessen aus deiner Vorratskammer!
                    </p>
                  </div>
                </div>
              ) : (
                /* 3 Meals Columns */
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                {/* 1. FRÜHSTÜCK (BROTDOSE) */}
                <div className="p-5 flex flex-col justify-between space-y-4 hover:bg-slate-50/50 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                        <Box className="w-3.5 h-3.5 text-amber-600" />
                        Frühstück (Brotdose)
                        {day.is_breakfast_cooked && (
                          <span className="text-emerald-700 font-bold ml-1">✓ Gekocht</span>
                        )}
                      </span>
                      <button
                        onClick={() => setActiveSwap({ dayIndex, mealType: 'breakfast' })}
                        className="text-[11px] font-semibold text-slate-400 hover:text-emerald-600 flex items-center gap-1"
                        title="Rezept tauschen"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Tauschen
                      </button>
                    </div>

                    {/* Meal Title with Click to Open Recipe */}
                    {hasMultipleBf ? (
                      <div className="mb-2 space-y-1.5">
                        <div className="text-[11px] font-bold text-amber-800 bg-amber-100/70 inline-flex items-center gap-1 px-2 py-0.5 rounded-md">
                          🍱 Individuelle Brotdosen ({distinctBfIds.length} Rezepte)
                        </div>
                        <div className="space-y-1">
                          {distinctBfMembers.map(({ member, recipe }) => (
                            <div
                              key={member.id}
                              onClick={() => setSelectedRecipeModal({ recipe, dayIndex, mealType: 'breakfast', isCooked: !!day.is_breakfast_cooked, targetMember: member })}
                              className="flex items-center justify-between text-xs p-1.5 bg-slate-50 hover:bg-emerald-50 rounded-xl cursor-pointer transition group border border-slate-100 hover:border-emerald-200"
                            >
                              <span className="text-slate-800">
                                <span className="font-bold text-slate-900">{member.name}:</span> {recipe.title}
                              </span>
                              <span className="text-[11px] font-bold text-emerald-600 group-hover:underline flex items-center gap-0.5 shrink-0 ml-1">
                                Rezept <ChefHat className="w-3 h-3" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setSelectedRecipeModal({ recipe: currentBfRecipe, dayIndex, mealType: 'breakfast', isCooked: !!day.is_breakfast_cooked })}
                        className="cursor-pointer group mb-2"
                      >
                        <h4 className="font-bold text-slate-800 text-base group-hover:text-emerald-700 transition flex items-center gap-1.5">
                          {currentBfRecipe.title}
                          <ChefHat className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
                        </h4>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {currentBfRecipe.prep_time_minutes} Min
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <Flame className="w-3 h-3 text-orange-500" /> {bfPortion?.scaled_calories || currentBfRecipe.base_calories} kcal
                      </span>
                      <span className="font-semibold text-blue-700">
                        {bfPortion?.scaled_protein_g || currentBfRecipe.base_protein_g}g Protein
                      </span>
                    </div>

                    <div className="mb-3">
                      {(() => {
                        const gl = getRecipeGlycemicBadge(currentBfRecipe);
                        return (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                            title={gl.explanation}
                          >
                            <span>{gl.label}</span>
                          </span>
                        );
                      })()}
                    </div>

                    {/* Scaled / Aggregated Ingredients */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">
                        {isAllSelected
                          ? `Zutaten für alle ${members.length} Personen:`
                          : `Portion für ${currentMember.name}:`}
                      </span>
                      {bfPortion?.scaled_ingredients.map((ing, idx) => {
                        const h = formatHumanQuantity(typeof ing.amount === 'number' ? ing.amount : parseFloat(String(ing.amount)), ing.unit);
                        return (
                          <div key={idx} className="flex items-center justify-between text-slate-600">
                            <span>• {ing.name}</span>
                            <span className="font-mono font-semibold text-slate-800 flex items-center">
                              {h.amount} {h.unit}
                              {ing.matched_retailer && (
                                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-bold shadow-xs ${getRetailerBadgeClass(resolveDisplayRetailer(ing.matched_retailer, plan.active_retailers))}`}>
                                  {resolveDisplayRetailer(ing.matched_retailer, plan.active_retailers)}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedRecipeModal({ recipe: currentBfRecipe, dayIndex, mealType: 'breakfast', isCooked: !!day.is_breakfast_cooked })}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      Rezept & Anleitung ansehen →
                    </button>
                  </div>
                </div>

                {/* 2. MITTAGESSEN (BROTDOSE / LUNCHBOX) */}
                <div className="p-5 flex flex-col justify-between space-y-4 hover:bg-slate-50/50 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                        <Box className="w-3.5 h-3.5 text-blue-600" />
                        Mittag (Brotdose to-go)
                        {day.is_lunch_cooked && (
                          <span className="text-emerald-700 font-bold ml-1">✓ Gekocht</span>
                        )}
                      </span>
                      <button
                        onClick={() => setActiveSwap({ dayIndex, mealType: 'lunch' })}
                        className="text-[11px] font-semibold text-slate-400 hover:text-emerald-600 flex items-center gap-1"
                        title="Rezept tauschen"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Tauschen
                      </button>
                    </div>

                    {/* Meal Title */}
                    {hasMultipleLu ? (
                      <div className="mb-2 space-y-1.5">
                        <div className="text-[11px] font-bold text-blue-800 bg-blue-100/70 inline-flex items-center gap-1 px-2 py-0.5 rounded-md">
                          🍱 Individuelle Brotdosen ({distinctLuIds.length} Rezepte)
                        </div>
                        <div className="space-y-1">
                          {distinctLuMembers.map(({ member, recipe }) => (
                            <div
                              key={member.id}
                              onClick={() => setSelectedRecipeModal({ recipe, dayIndex, mealType: 'lunch', isCooked: !!day.is_lunch_cooked, targetMember: member })}
                              className="flex items-center justify-between text-xs p-1.5 bg-slate-50 hover:bg-emerald-50 rounded-xl cursor-pointer transition group border border-slate-100 hover:border-emerald-200"
                            >
                              <span className="text-slate-800">
                                <span className="font-bold text-slate-900">{member.name}:</span> {recipe.title}
                              </span>
                              <span className="text-[11px] font-bold text-emerald-600 group-hover:underline flex items-center gap-0.5 shrink-0 ml-1">
                                Rezept <ChefHat className="w-3 h-3" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setSelectedRecipeModal({ recipe: currentLuRecipe, dayIndex, mealType: 'lunch', isCooked: !!day.is_lunch_cooked })}
                        className="cursor-pointer group mb-2"
                      >
                        <h4 className="font-bold text-slate-800 text-base group-hover:text-emerald-700 transition flex items-center gap-1.5">
                          {currentLuRecipe.title}
                          <ChefHat className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
                        </h4>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {currentLuRecipe.prep_time_minutes} Min
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <Flame className="w-3 h-3 text-orange-500" /> {luPortion?.scaled_calories || currentLuRecipe.base_calories} kcal
                      </span>
                      <span className="font-semibold text-blue-700">
                        {luPortion?.scaled_protein_g || currentLuRecipe.base_protein_g}g Protein
                      </span>
                    </div>

                    <div className="mb-3">
                      {(() => {
                        const gl = getRecipeGlycemicBadge(currentLuRecipe);
                        return (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                            title={gl.explanation}
                          >
                            <span>{gl.label}</span>
                          </span>
                        );
                      })()}
                    </div>

                    {/* Scaled / Aggregated Ingredients */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">
                        {isAllSelected
                          ? `Zutaten für alle ${members.length} Personen:`
                          : `Portion für ${currentMember.name}:`}
                      </span>
                      {luPortion?.scaled_ingredients.map((ing, idx) => {
                        const h = formatHumanQuantity(typeof ing.amount === 'number' ? ing.amount : parseFloat(String(ing.amount)), ing.unit);
                        return (
                          <div key={idx} className="flex items-center justify-between text-slate-600">
                            <span>• {ing.name}</span>
                            <span className="font-mono font-semibold text-slate-800 flex items-center">
                              {h.amount} {h.unit}
                              {ing.matched_retailer && (
                                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-bold shadow-xs ${getRetailerBadgeClass(resolveDisplayRetailer(ing.matched_retailer, plan.active_retailers))}`}>
                                  {resolveDisplayRetailer(ing.matched_retailer, plan.active_retailers)}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedRecipeModal({ recipe: currentLuRecipe, dayIndex, mealType: 'lunch', isCooked: !!day.is_lunch_cooked })}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      Rezept & Anleitung ansehen →
                    </button>
                  </div>
                </div>

                {/* 3. ABENDESSEN (FRISCH ZU HAUSE KOCHEN - 1 TOPF FÜR ALLE) */}
                <div className="p-5 flex flex-col justify-between space-y-4 hover:bg-slate-50/50 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-rose-600" />
                        Abendessen (1 Topf für alle)
                        {day.is_dinner_cooked && (
                          <span className="text-emerald-700 font-bold ml-1">✓ Gekocht</span>
                        )}
                      </span>
                      <button
                        onClick={() => setActiveSwap({ dayIndex, mealType: 'dinner' })}
                        className="text-[11px] font-semibold text-slate-400 hover:text-emerald-600 flex items-center gap-1"
                        title="Rezept tauschen"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Tauschen
                      </button>
                    </div>

                    {/* Meal Title */}
                    <div
                      onClick={() => setSelectedRecipeModal({ recipe: currentDiRecipe, dayIndex, mealType: 'dinner', isCooked: !!day.is_dinner_cooked })}
                      className="cursor-pointer group mb-1.5"
                    >
                      <h4 className="font-bold text-slate-800 text-base group-hover:text-emerald-700 transition flex items-center gap-1.5">
                        {currentDiRecipe.title}
                        <ChefHat className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
                      </h4>
                    </div>

                    {/* Family Safety Badge for Dinner */}
                    {(() => {
                      const diConflicts = getRecipeFamilyConflicts(currentDiRecipe, members);
                      if (diConflicts.length === 0) {
                        return (
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              100% Familien-sicher (Allergie-geprüft)
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Warnung: {diConflicts.map(c => `${c.memberName} (${c.reasons[0]})`).join(', ')}
                          </span>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {currentDiRecipe.prep_time_minutes + currentDiRecipe.cook_time_minutes} Min
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <Flame className="w-3 h-3 text-orange-500" /> {diPortion?.scaled_calories || currentDiRecipe.base_calories} kcal
                      </span>
                      <span className="font-semibold text-blue-700">
                        {diPortion?.scaled_protein_g || currentDiRecipe.base_protein_g}g Protein
                      </span>
                    </div>

                    <div className="mb-3">
                      {(() => {
                        const gl = getRecipeGlycemicBadge(currentDiRecipe);
                        return (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                            title={gl.explanation}
                          >
                            <span>{gl.label}</span>
                          </span>
                        );
                      })()}
                    </div>

                    {/* Scaled / Aggregated Ingredients */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">
                        {isAllSelected
                          ? `Zutaten für alle ${members.length} Personen:`
                          : `Portion für ${currentMember.name}:`}
                      </span>
                      {diPortion?.scaled_ingredients.map((ing, idx) => {
                        const h = formatHumanQuantity(typeof ing.amount === 'number' ? ing.amount : parseFloat(String(ing.amount)), ing.unit);
                        return (
                          <div key={idx} className="flex items-center justify-between text-slate-600">
                            <span>• {ing.name}</span>
                            <span className="font-mono font-semibold text-slate-800 flex items-center">
                              {h.amount} {h.unit}
                              {ing.matched_retailer && (
                                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-bold shadow-xs ${getRetailerBadgeClass(resolveDisplayRetailer(ing.matched_retailer, plan.active_retailers))}`}>
                                  {resolveDisplayRetailer(ing.matched_retailer, plan.active_retailers)}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedRecipeModal({ recipe: currentDiRecipe, dayIndex, mealType: 'dinner', isCooked: !!day.is_dinner_cooked })}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      Rezept & Anleitung ansehen →
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          );
        })}
      </div>

      {/* Recipe Modal */}
      {selectedRecipeModal && (
        <RecipeModal
          recipe={selectedRecipeModal.recipe}
          dayIndex={selectedRecipeModal.dayIndex}
          mealType={selectedRecipeModal.mealType}
          activeMember={
            isAllSelected && !selectedRecipeModal.targetMember
              ? {
                  ...currentMember,
                  id: 'all',
                  name: `Gesamte Familie (${members.length} Personen)`,
                }
              : selectedRecipeModal.targetMember || currentMember
          }
          portion={
            isAllSelected && !selectedRecipeModal.targetMember
              ? getAggregatedMealPortion(
                  plan.days[selectedRecipeModal.dayIndex],
                  selectedRecipeModal.mealType,
                  members,
                  selectedRecipeModal.recipe,
                  plan.active_retailers
                )
              : plan.days[selectedRecipeModal.dayIndex]?.portions?.[(selectedRecipeModal.targetMember || currentMember).id]?.[selectedRecipeModal.mealType]
          }
          pantryItems={pantryItems}
          familyMembers={members}
          isCooked={selectedRecipeModal.isCooked}
          isAllMembers={isAllSelected && !selectedRecipeModal.targetMember}
          membersCount={members.length}
          activeRetailers={plan.active_retailers}
          onCookMeal={onCookMeal}
          onClose={() => setSelectedRecipeModal(null)}
        />
      )}

      {/* Recipe Swap Modal */}
      {activeSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Alternative Mahlzeit wählen ({plan.days[activeSwap.dayIndex].day_name})
                </h3>
                <span className="text-xs text-slate-500">
                  Wähle ein anderes geprüftes Rezept – Familien-Allergien werden automatisch berücksichtigt.
                </span>
              </div>
              <button
                onClick={() => setActiveSwap(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {allRecipes
                .filter((r) => {
                  if (activeSwap.mealType === 'breakfast') return r.meal_type === 'breakfast_lunchbox';
                  if (activeSwap.mealType === 'lunch') return r.meal_type === 'lunch_lunchbox';
                  return r.meal_type === 'dinner_home';
                })
                .sort((a, b) => {
                  const aConflicts = getRecipeFamilyConflicts(a, members).length;
                  const bConflicts = getRecipeFamilyConflicts(b, members).length;
                  return aConflicts - bConflicts;
                })
                .map((r) => {
                  const conflicts = getRecipeFamilyConflicts(r, members);
                  const isSafe = conflicts.length === 0;

                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        onSwapMeal(activeSwap.dayIndex, activeSwap.mealType, r.id);
                        setActiveSwap(null);
                      }}
                      className={`p-4 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                        isSafe
                          ? 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40'
                          : 'border-rose-200 bg-rose-50/20 hover:border-rose-400'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-bold text-slate-800 text-sm">{r.title}</h4>
                          {isSafe ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Familien-sicher
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Konflikt: {conflicts.map(c => `${c.memberName} (${c.reasons[0]})`).join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{r.prep_time_minutes} Min</span>
                          <span>{r.base_calories} kcal</span>
                          <span>{r.base_protein_g}g Protein</span>
                        </div>
                      </div>
                      <button
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm shrink-0 ${
                          isSafe ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                        }`}
                      >
                        Wählen
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE MANUAL WEEK PLANNER MODAL */}
      {isManualPlannerOpen && plan && (
        <ManualWeekPlannerModal
          plan={plan}
          members={members}
          allRecipes={allRecipes}
          activeRetailers={activeRetailers}
          onClose={() => setIsManualPlannerOpen(false)}
          onSave={async (updatedPlan) => {
            if (onSaveWeeklyPlan) {
              const ok = await onSaveWeeklyPlan(updatedPlan);
              return ok;
            }
            return false;
          }}
        />
      )}
    </div>
  );
};

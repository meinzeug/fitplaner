import React, { useState, useEffect } from 'react';
import { WeeklyPlan, FamilyMember, Recipe, PantryItem, PersonMealPortion, DayPlan } from '../types';
import { RecipeModal } from './RecipeModal';
import { SavingsVitalityCockpit } from './SavingsVitalityCockpit';
import { ManualWeekPlannerModal } from './ManualWeekPlannerModal';
import { getRecipeGlycemicBadge } from '../utils/plantDiversityTracker';
import { formatHumanQuantity } from '../utils/humanQuantity';
import {
  Calendar, RefreshCw, Box, Clock, Flame, Sparkles,
  ArrowRightLeft, ChefHat, ChevronLeft, ChevronRight, Wallet,
  ShoppingBag, ChevronDown, ChevronUp, Utensils, ShieldCheck,
  CalendarDays, AlertTriangle
} from 'lucide-react';
import { getRecipeFamilyConflicts } from '../backend_embedded/dietValidator';

/**
 * Utility to return authentic brand colors and border classes for German retailers.
 */
export function getRetailerBadgeClass(retailer?: string): string {
  if (!retailer) {
    return 'bg-slate-100 text-slate-700 border border-slate-300 font-bold';
  }

  const r = retailer.toLowerCase().trim();

  if (r.includes('netto')) {
    return 'bg-amber-400 text-stone-950 border border-amber-500 font-black';
  }
  if (r === 'np' || r.includes('np discount') || r.includes('np-') || r.startsWith('np ')) {
    return 'bg-red-600 text-white border border-red-700 font-bold';
  }
  if (r.includes('lidl')) {
    return 'bg-blue-600 text-white border border-blue-700 font-bold';
  }
  if (r.includes('aldi')) {
    if (r.includes('süd') || r.includes('sued')) {
      return 'bg-indigo-700 text-white border border-indigo-800 font-bold';
    }
    return 'bg-sky-800 text-white border border-sky-900 font-bold';
  }
  if (r.includes('rewe')) {
    return 'bg-red-700 text-white border border-red-800 font-bold';
  }
  if (r.includes('kaufland')) {
    return 'bg-rose-900 text-white border border-rose-950 font-bold';
  }
  if (r.includes('edeka')) {
    return 'bg-yellow-400 text-blue-950 border border-blue-600 font-bold';
  }
  if (r.includes('vorrat')) {
    return 'bg-emerald-100 text-emerald-800 border border-emerald-400 font-bold';
  }

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

  const totalCalories = portions.reduce((sum, p) => sum + (p.scaled_calories || 0), 0);
  const totalProtein = portions.reduce((sum, p) => sum + (p.scaled_protein_g || 0), 0);
  const totalCarbs = portions.reduce((sum, p) => sum + (p.scaled_carbs_g || 0), 0);
  const totalFat = portions.reduce((sum, p) => sum + (p.scaled_fat_g || 0), 0);
  const avgScale = portions.reduce((sum, p) => sum + (p.scale_factor || 1), 0);

  const ingredientMap = new Map<string, { name: string; amount: number; unit: string; matched_retailer?: string }>();

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
  onSwapMeal: (dayIndex: number, mealType: string, newRecipeId: string) => Promise<boolean | void>;
  onCookMeal: (dayIndex: number, mealType: string) => Promise<void>;
  isGenerating: boolean;
  activeRetailers?: string[];
  onPlanOptimized?: (optimizedPlan: WeeklyPlan) => void;
  onSaveWeeklyPlan?: (plan: WeeklyPlan) => Promise<boolean>;
  onNavigateTab?: (tab: any) => void;
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
  onNavigateTab,
}) => {
  // Determine current day of week (0 = Monday, 6 = Sunday)
  const currentWeekdayIndex = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const [activeDayIndex, setActiveDayIndex] = useState<number | 'all'>(
    selectedWeekOffset === 0 ? currentWeekdayIndex : 0
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || 'all');
  const [activeSwap, setActiveSwap] = useState<{ dayIndex: number; mealType: 'breakfast' | 'lunch' | 'dinner' } | null>(null);
  const [isManualPlannerOpen, setIsManualPlannerOpen] = useState(false);
  const [showDetailedCockpit, setShowDetailedCockpit] = useState(false);
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [customBudgetInput, setCustomBudgetInput] = useState<string>(
    plan?.budget ? String(plan.budget) : '120'
  );
  const [expandedIngredients, setExpandedIngredients] = useState<Record<string, boolean>>({});

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
    if (plan?.budget) {
      setCustomBudgetInput(String(plan.budget));
    }
  }, [plan?.budget]);

  const handleApplyBudget = async (val: number) => {
    if (val > 0) {
      await onUpdateBudget(val);
      setShowBudgetEditor(false);
    }
  };

  const toggleIngredients = (key: string) => {
    setExpandedIngredients((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!plan) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs max-w-xl mx-auto">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Noch kein Wochenplan erstellt</h3>
        <p className="text-slate-500 text-xs sm:text-sm mb-6">
          Klicke auf den Button, um in Sekundenschnelle einen gesunden Wochenplan aus Netto- & NP-Angeboten für alle Familienmitglieder zu generieren.
        </p>
        <button
          onClick={onGeneratePlan}
          disabled={isGenerating}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg hover:shadow-emerald-200 transition flex items-center gap-2 mx-auto disabled:opacity-50 text-xs sm:text-sm"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          {isGenerating ? 'Plane Mahlzeiten...' : '1-Klick Wochenplan erstellen'}
        </button>
      </div>
    );
  }

  const budgetUsed = plan.total_estimated_cost || 0;
  const budgetLimit = plan.budget || 120;
  const budgetPercent = Math.min(100, Math.round((budgetUsed / Math.max(1, budgetLimit)) * 100));

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* 1. UNIFIED PAGE HEADER & ACTIONS */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200/90 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Week Navigation */}
        <div className="flex items-center justify-between lg:justify-start gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Wochenplan
                </h2>
                {selectedWeekOffset === 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Aktuell
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">
                    {selectedWeekOffset > 0 ? `+${selectedWeekOffset} Wo.` : `${selectedWeekOffset} Wo.`}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-semibold">
                {plan.week_label} • Netto & NP Angebote
              </p>
            </div>
          </div>

          {/* Week offset stepper */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border-2 border-slate-200 ml-auto lg:ml-4">
            <button
              onClick={() => onChangeWeek(selectedWeekOffset - 1)}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition active:scale-95"
              title="Vorherige Kalenderwoche"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2 min-w-[75px] text-center">
              {selectedWeekOffset === 0 ? 'Diese Woche' : selectedWeekOffset > 0 ? `+${selectedWeekOffset} Wo.` : `${selectedWeekOffset} Wo.`}
            </span>
            <button
              onClick={() => onChangeWeek(selectedWeekOffset + 1)}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition active:scale-95"
              title="Nächste Kalenderwoche"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {selectedWeekOffset !== 0 && (
              <button
                onClick={() => onChangeWeek(0)}
                className="px-2 py-1 ml-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-black transition"
              >
                Heute
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('einkauf')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold transition active:scale-95 shadow-2xs"
              title="Einkaufsliste mit aktuellen Zutaten öffnen"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Einkaufsliste</span>
            </button>
          )}

          <button
            onClick={() => setIsManualPlannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-sm transition active:scale-95"
            title="Woche Tag für Tag selbst planen und anpassen"
          >
            <CalendarDays className="w-3.5 h-3.5 text-amber-300" />
            <span>Woche planen</span>
          </button>

          <button
            onClick={onGeneratePlan}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
            title="KI-Wochenplan neu auswürfeln"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">{isGenerating ? 'Generiere...' : 'Neu planen'}</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT INTEGRATED BUDGET & STATS STRIP */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Wochenbudget & Spar-Check
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              plan.budget_status === 'exceeded'
                ? 'bg-red-100 text-red-700 border border-red-200'
                : plan.budget_status === 'warning'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {plan.budget_status === 'exceeded' ? '⚠️ Über Budget' :
               plan.budget_status === 'warning' ? '⚡ Fast am Limit' : '✅ Im Budget'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBudgetEditor(!showBudgetEditor)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-1"
            >
              <span>Budget anpassen ({budgetLimit.toFixed(0)} €)</span>
              {showBudgetEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => setShowDetailedCockpit(!showDetailedCockpit)}
              className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1"
            >
              <span>{showDetailedCockpit ? 'Cockpit einklappen' : 'Details anzeigen'}</span>
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-slate-50 p-2.5 rounded-2xl border-2 border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Budget</span>
            <span className="text-sm sm:text-base font-black text-slate-900">{budgetLimit.toFixed(2)} €</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-2xl border-2 border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Geplant</span>
            <span className="text-sm sm:text-base font-black text-slate-900">{budgetUsed.toFixed(2)} €</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-2xl border-2 border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Rest</span>
            <span className={`text-sm sm:text-base font-black ${
              (plan.budget_difference || 0) < 0 ? 'text-red-600' : 'text-emerald-600'
            }`}>
              {(plan.budget_difference || 0) > 0 ? '+' : ''}{(plan.budget_difference || 0).toFixed(2)} €
            </span>
          </div>
          <div className="bg-emerald-50/80 p-2.5 rounded-2xl border-2 border-emerald-300/80 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Ersparnis</span>
            <span className="text-sm sm:text-base font-black text-emerald-900">~{(plan.total_savings || 0).toFixed(2)} €</span>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Auslastung: {budgetPercent}%</span>
            <span>Limit: {budgetLimit.toFixed(2)} €</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                plan.budget_status === 'exceeded'
                  ? 'bg-red-500'
                  : plan.budget_status === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>

        {/* Collapsible Budget Editor */}
        {showBudgetEditor && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 mr-1">Voreinstellung:</span>
              {[50, 75, 100, 120, 150].map((b) => (
                <button
                  key={b}
                  onClick={() => handleApplyBudget(b)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                    plan.budget === b
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {b} €
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="20"
                max="500"
                step="5"
                value={customBudgetInput}
                onChange={(e) => setCustomBudgetInput(e.target.value)}
                className="w-20 px-2.5 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-500 font-bold">€</span>
              <button
                onClick={() => handleApplyBudget(parseFloat(customBudgetInput) || 120)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
              >
                Speichern
              </button>
            </div>
          </div>
        )}

        {/* Optional Collapsible Savings Cockpit */}
        {showDetailedCockpit && (
          <div className="pt-3 border-t border-slate-100 animate-fadeIn">
            <SavingsVitalityCockpit
              plan={plan}
              activeRetailers={activeRetailers || plan.active_retailers || ['Netto', 'NP']}
              pantryItems={pantryItems}
              onPlanOptimized={onPlanOptimized}
            />
          </div>
        )}
      </div>

      {/* 3. HORIZONTAL DAY-SELECTOR TABS (NO ENDLESS SCROLLING) */}
      <div className="bg-white rounded-3xl p-2 sm:p-2.5 border-2 border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {plan.days.map((day, idx) => {
            const isToday = selectedWeekOffset === 0 && idx === currentWeekdayIndex;
            const isSelected = activeDayIndex === idx;
            const isUnplanned = day.is_planned === false;

            return (
              <button
                key={idx}
                onClick={() => setActiveDayIndex(idx)}
                className={`flex-1 min-w-[74px] sm:min-w-[90px] py-2 px-2 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900'
                    : isToday
                    ? 'bg-emerald-50 text-emerald-950 border-2 border-emerald-300 hover:bg-emerald-100 font-black'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-2 border-slate-200 font-bold'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black uppercase">
                    {day.day_name.slice(0, 2)}
                  </span>
                  {isToday && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-2xs" title="Heute" />
                  )}
                  {isUnplanned && (
                    <span className="text-[10px]">🏖️</span>
                  )}
                </div>
                <span className={`text-[10px] font-bold truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {day.date.split('.')[0]}.{day.date.split('.')[1]}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setActiveDayIndex('all')}
            className={`min-w-[85px] sm:min-w-[105px] py-2 px-3 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
              activeDayIndex === 'all'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600'
                : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-2 border-slate-200 font-bold'
            }`}
          >
            <span className="text-xs font-black uppercase">7 Tage</span>
            <span className={`text-[10px] font-bold ${activeDayIndex === 'all' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Übersicht
            </span>
          </button>
        </div>
      </div>

      {/* 4. FAMILY MEMBER PORTION SELECTOR */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black text-slate-500 uppercase mr-1">Portionen:</span>
          <button
            onClick={() => setSelectedMemberId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs ${
              selectedMemberId === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-800 border-2 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>👨‍👩‍👧‍👦 Alle ({members.length})</span>
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMemberId(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap shadow-2xs ${
                selectedMemberId === m.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-800 border-2 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* 5. MEALS DISPLAY (Filtered to Selected Day or Compact 7-Day Grid) */}
      <div className="space-y-4">
        {plan.days
          .filter((_, idx) => activeDayIndex === 'all' || activeDayIndex === idx)
          .map((day, originalIdx) => {
            const dayIndex = activeDayIndex === 'all' ? originalIdx : activeDayIndex;
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
                className="bg-slate-100/60 p-3 sm:p-4 rounded-3xl border-2 border-slate-200/90 shadow-sm space-y-3"
              >
                {/* Day Header Bar */}
                <div className="bg-slate-900 text-white px-4 sm:px-5 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-400">
                      {day.day_name}
                    </span>
                    <span className="text-xs text-slate-300 font-bold">({day.date})</span>
                    {day.is_planned === false && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        🏖️ Planungsfrei
                      </span>
                    )}
                  </div>

                  {day.is_planned !== false ? (
                    <div className="flex items-center gap-2.5 text-xs text-slate-200 font-medium">
                      <span className="font-bold">{plannedCals} / {targetCals} kcal</span>
                      <div className="w-20 sm:w-24 bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all"
                          style={{ width: `${calPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                {day.is_planned === false ? (
                  <div className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-amber-200 space-y-2">
                    <div className="text-3xl">🏖️</div>
                    <h4 className="text-sm sm:text-base font-black text-slate-800">
                      Planungsfreier Tag (Kein Kochen nötig)
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Gönn dir eine Pause, besuche ein Restaurant oder nutze Reste aus der Vorratskammer!
                    </p>
                  </div>
                ) : (
                  /* 3 MEALS: FRÜHSTÜCK, MITTAGESSEN, ABENDESSEN - DISTINCT CARDS */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* MEAL 1: FRÜHSTÜCK */}
                    <MealCard
                      mealType="breakfast"
                      mealLabel="Frühstück (Brotdose)"
                      icon={<Box className="w-4 h-4 text-amber-700" />}
                      recipe={currentBfRecipe}
                      portion={bfPortion}
                      isCooked={!!day.is_breakfast_cooked}
                      dayIndex={dayIndex}
                      members={members}
                      activeRetailers={plan.active_retailers}
                      isExpanded={!!expandedIngredients[`${dayIndex}_breakfast`]}
                      onToggleIngredients={() => toggleIngredients(`${dayIndex}_breakfast`)}
                      onOpenRecipe={() => setSelectedRecipeModal({ recipe: currentBfRecipe, dayIndex, mealType: 'breakfast', isCooked: !!day.is_breakfast_cooked })}
                      onSwap={() => setActiveSwap({ dayIndex, mealType: 'breakfast' })}
                      onCook={() => onCookMeal(dayIndex, 'breakfast')}
                    />

                    {/* MEAL 2: MITTAGESSEN */}
                    <MealCard
                      mealType="lunch"
                      mealLabel="Mittag (Brotdose To-Go)"
                      icon={<Box className="w-4 h-4 text-sky-700" />}
                      recipe={currentLuRecipe}
                      portion={luPortion}
                      isCooked={!!day.is_lunch_cooked}
                      dayIndex={dayIndex}
                      members={members}
                      activeRetailers={plan.active_retailers}
                      isExpanded={!!expandedIngredients[`${dayIndex}_lunch`]}
                      onToggleIngredients={() => toggleIngredients(`${dayIndex}_lunch`)}
                      onOpenRecipe={() => setSelectedRecipeModal({ recipe: currentLuRecipe, dayIndex, mealType: 'lunch', isCooked: !!day.is_lunch_cooked })}
                      onSwap={() => setActiveSwap({ dayIndex, mealType: 'lunch' })}
                      onCook={() => onCookMeal(dayIndex, 'lunch')}
                    />

                    {/* MEAL 3: ABENDESSEN */}
                    <MealCard
                      mealType="dinner"
                      mealLabel="Abendessen (Warm daheim)"
                      icon={<Utensils className="w-4 h-4 text-indigo-700" />}
                      recipe={currentDiRecipe}
                      portion={diPortion}
                      isCooked={!!day.is_dinner_cooked}
                      dayIndex={dayIndex}
                      members={members}
                      activeRetailers={plan.active_retailers}
                      isExpanded={!!expandedIngredients[`${dayIndex}_dinner`]}
                      onToggleIngredients={() => toggleIngredients(`${dayIndex}_dinner`)}
                      onOpenRecipe={() => setSelectedRecipeModal({ recipe: currentDiRecipe, dayIndex, mealType: 'dinner', isCooked: !!day.is_dinner_cooked })}
                      onSwap={() => setActiveSwap({ dayIndex, mealType: 'dinner' })}
                      onCook={() => onCookMeal(dayIndex, 'dinner')}
                    />
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* 6. MODALS */}
      {/* Recipe Modal */}
      {selectedRecipeModal && (
        <RecipeModal
          recipe={selectedRecipeModal.recipe}
          dayIndex={selectedRecipeModal.dayIndex}
          mealType={selectedRecipeModal.mealType}
          activeMember={selectedRecipeModal.targetMember || currentMember}
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
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Alternative Mahlzeit ({plan.days[activeSwap.dayIndex].day_name})
                </h3>
                <span className="text-xs text-slate-500">
                  Familien-Allergien werden automatisch geprüft.
                </span>
              </div>
              <button
                onClick={() => setActiveSwap(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
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
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                        isSafe
                          ? 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40'
                          : 'border-rose-200 bg-rose-50/20 hover:border-rose-400'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{r.title}</h4>
                          {isSafe ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Sicher
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Konflikt
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-[11px] text-slate-500">
                          <span>{r.prep_time_minutes} Min</span>
                          <span>{r.base_calories} kcal</span>
                          <span>{r.base_protein_g}g Protein</span>
                        </div>
                      </div>
                      <button
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs shrink-0 ${
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

      {/* Manual Week Planner Modal */}
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

interface MealCardProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  mealLabel: string;
  icon: React.ReactNode;
  badgeColor?: string;
  recipe: Recipe;
  portion?: PersonMealPortion;
  isCooked: boolean;
  dayIndex: number;
  members: FamilyMember[];
  activeRetailers?: string[];
  isExpanded: boolean;
  onToggleIngredients: () => void;
  onOpenRecipe: () => void;
  onSwap: () => void;
  onCook: () => void;
}

const MealCard: React.FC<MealCardProps> = ({
  mealType,
  mealLabel,
  icon,
  recipe,
  portion,
  isCooked,
  activeRetailers,
  isExpanded,
  onToggleIngredients,
  onOpenRecipe,
  onSwap,
  onCook,
}) => {
  const glycemic = getRecipeGlycemicBadge(recipe);
  const totalIngredients = portion?.scaled_ingredients.length || recipe.ingredients.length;

  // Distinct slot styles for maximum visual clarity on mobile
  const slotConfig = {
    breakfast: {
      cardBorder: 'border-2 border-amber-200/90 hover:border-amber-400 border-t-4 border-t-amber-500',
      bgGrad: 'bg-gradient-to-b from-amber-50/40 via-white to-white',
      badge: 'bg-amber-100 text-amber-950 border border-amber-300',
    },
    lunch: {
      cardBorder: 'border-2 border-sky-200/90 hover:border-sky-400 border-t-4 border-t-sky-500',
      bgGrad: 'bg-gradient-to-b from-sky-50/40 via-white to-white',
      badge: 'bg-sky-100 text-sky-950 border border-sky-300',
    },
    dinner: {
      cardBorder: 'border-2 border-indigo-200/90 hover:border-indigo-400 border-t-4 border-t-indigo-500',
      bgGrad: 'bg-gradient-to-b from-indigo-50/40 via-white to-white',
      badge: 'bg-indigo-100 text-indigo-950 border border-indigo-300',
    },
  }[mealType] || {
    cardBorder: 'border-2 border-slate-200 hover:border-slate-300 border-t-4 border-t-slate-500',
    bgGrad: 'bg-white',
    badge: 'bg-slate-100 text-slate-900 border border-slate-300',
  };

  return (
    <div className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3.5 shadow-sm hover:shadow-md transition duration-150 relative ${slotConfig.cardBorder} ${slotConfig.bgGrad}`}>
      <div className="space-y-3">
        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between gap-1.5">
          <span className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs ${slotConfig.badge}`}>
            {icon}
            <span>{mealLabel}</span>
            {isCooked && (
              <span className="text-emerald-700 font-black ml-1 bg-white/80 px-1 rounded">✓ Gekocht</span>
            )}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onSwap}
              className="p-1.5 rounded-xl text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition active:scale-95"
              title="Mahlzeit tauschen"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
            {!isCooked && (
              <button
                onClick={onCook}
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-2xs transition active:scale-95"
                title="Als gekocht markieren"
              >
                🍳 Kochen
              </button>
            )}
          </div>
        </div>

        {/* Meal Title */}
        <div
          onClick={onOpenRecipe}
          className="cursor-pointer group"
        >
          <h4 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-emerald-700 transition flex items-center gap-1.5 leading-snug line-clamp-2">
            <span>{recipe.title}</span>
            <ChefHat className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition shrink-0" />
          </h4>
        </div>

        {/* Metrics Row: Time, Calories, Protein, Glycemic with High-Contrast Badges */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <span className="flex items-center gap-1 bg-white border border-slate-200/90 text-slate-800 font-bold px-2 py-0.5 rounded-lg shadow-2xs">
            <Clock className="w-3 h-3 text-slate-500" /> {recipe.prep_time_minutes}m
          </span>
          <span className="flex items-center gap-1 font-black bg-orange-50 text-orange-950 border border-orange-200 px-2 py-0.5 rounded-lg shadow-2xs">
            <Flame className="w-3 h-3 text-orange-600 fill-orange-500" /> {portion?.scaled_calories || recipe.base_calories} kcal
          </span>
          <span className="font-black bg-blue-50 text-blue-950 border border-blue-200 px-2 py-0.5 rounded-lg shadow-2xs">
            {portion?.scaled_protein_g || recipe.base_protein_g}g Protein
          </span>
          <span
            className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 shadow-2xs"
            title={glycemic.explanation}
          >
            {glycemic.label}
          </span>
        </div>

        {/* Accordion: Collapsible Ingredients List */}
        <div className="pt-0.5">
          <button
            onClick={onToggleIngredients}
            className="w-full flex items-center justify-between text-xs font-black text-slate-700 hover:text-slate-900 py-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition"
          >
            <span className="flex items-center gap-1">
              <span>{isExpanded ? 'Zutaten ausblenden' : `Zutaten anzeigen (${totalIngredients})`}</span>
            </span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {isExpanded && (
            <div className="mt-2 bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-xs space-y-1.5 text-xs animate-fadeIn">
              {(portion?.scaled_ingredients || recipe.ingredients).map((ing, idx) => {
                const amount = 'amount' in ing ? ing.amount : (ing as any).base_amount;
                const h = formatHumanQuantity(typeof amount === 'number' ? amount : parseFloat(String(amount)), ing.unit);
                const retailer = 'matched_retailer' in ing ? ing.matched_retailer : (ing as any).matched_offer_retailer;

                return (
                  <div key={idx} className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 last:border-0">
                    <span className="truncate pr-2 font-medium text-slate-800">• {ing.name}</span>
                    <span className="font-mono font-bold text-slate-900 flex items-center shrink-0">
                      {h.amount} {h.unit}
                      {retailer && (
                        <span className={`ml-1.5 text-[9px] px-1.5 py-0.2 rounded font-black ${getRetailerBadgeClass(resolveDisplayRetailer(retailer, activeRetailers))}`}>
                          {resolveDisplayRetailer(retailer, activeRetailers)}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer with Tangible Button */}
      <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between">
        <button
          onClick={onOpenRecipe}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200/90 shadow-2xs transition active:scale-95"
        >
          <span>Rezept ansehen</span>
          <span className="text-emerald-700 font-black">→</span>
        </button>
      </div>
    </div>
  );
};

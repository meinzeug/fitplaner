import React, { useState, useMemo } from 'react';
import { WeeklyPlan, DayPlan, Recipe, FamilyMember, PersonMealPortion } from '../types';
import { getRecipeFamilyConflicts, isRecipeSafeForFamily, isRecipeSafeForMember } from '../backend_embedded/dietValidator';
import { scaleRecipeForPerson, sanitizeRecipe } from '../backend_embedded/embeddedBackend';
import { getRetailerBadgeClass } from './WeeklyPlanView';
import {
  CalendarDays, X, Check, RefreshCw, Copy, Sparkles, ShieldCheck, AlertTriangle,
  Search, Clock, Flame, Dumbbell, Leaf, Tag, CheckCircle2,
  Utensils, Coffee, Sun, Moon, ChefHat, Star, RotateCcw
} from 'lucide-react';

interface Props {
  plan: WeeklyPlan;
  members: FamilyMember[];
  allRecipes: Recipe[];
  activeRetailers?: string[];
  onClose: () => void;
  onSave: (updatedPlan: WeeklyPlan) => Promise<boolean>;
}

export const ManualWeekPlannerModal: React.FC<Props> = ({
  plan,
  members,
  allRecipes,
  activeRetailers = ['Netto', 'NP'],
  onClose,
  onSave,
}) => {
  // Working copy of the plan so changes can be cancelled or confirmed
  const [draftPlan, setDraftPlan] = useState<WeeklyPlan>(() => JSON.parse(JSON.stringify(plan)));
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [activePickerSlot, setActivePickerSlot] = useState<{
    dayIndex: number;
    mealType: 'breakfast' | 'lunch' | 'dinner';
  } | null>(null);

  // Recipe Picker state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyFamilySafe, setOnlyFamilySafe] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const primaryRetailer = activeRetailers[0] || 'Netto';

  const currentDay: DayPlan = draftPlan.days[selectedDayIndex] || draftPlan.days[0];

  // Helper to recalculate portions and macros for a single day
  const updateDayInDraft = (dayIndex: number, newBf: Recipe, newLu: Recipe, newDi: Recipe) => {
    setDraftPlan((prev) => {
      const cleanBf = sanitizeRecipe(newBf, activeRetailers, primaryRetailer);
      const cleanLu = sanitizeRecipe(newLu, activeRetailers, primaryRetailer);
      const cleanDi = sanitizeRecipe(newDi, activeRetailers, primaryRetailer);

      const portions: Record<string, { breakfast: PersonMealPortion; lunch: PersonMealPortion; dinner: PersonMealPortion }> = {};
      const dailyNutrition: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};

      members.forEach((m) => {
        let memberBf = cleanBf;
        if (!isRecipeSafeForMember(cleanBf, m)) {
          const safe = allRecipes.find((r) => r.meal_type === 'breakfast_lunchbox' && isRecipeSafeForMember(r, m));
          if (safe) memberBf = sanitizeRecipe(safe, activeRetailers, primaryRetailer);
        }
        let memberLu = cleanLu;
        if (!isRecipeSafeForMember(cleanLu, m)) {
          const safe = allRecipes.find((r) => r.meal_type === 'lunch_lunchbox' && isRecipeSafeForMember(r, m));
          if (safe) memberLu = sanitizeRecipe(safe, activeRetailers, primaryRetailer);
        }

        const bfp = scaleRecipeForPerson(memberBf, m, 'breakfast_lunchbox', activeRetailers, primaryRetailer);
        const lup = scaleRecipeForPerson(memberLu, m, 'lunch_lunchbox', activeRetailers, primaryRetailer);
        const dip = scaleRecipeForPerson(cleanDi, m, 'dinner_home', activeRetailers, primaryRetailer);

        portions[m.id] = { breakfast: bfp, lunch: lup, dinner: dip };
        dailyNutrition[m.id] = {
          calories: bfp.scaled_calories + lup.scaled_calories + dip.scaled_calories,
          protein: bfp.scaled_protein_g + lup.scaled_protein_g + dip.scaled_protein_g,
          carbs: bfp.scaled_carbs_g + lup.scaled_carbs_g + dip.scaled_carbs_g,
          fat: bfp.scaled_fat_g + lup.scaled_fat_g + dip.scaled_fat_g,
        };
      });

      const updatedDays = [...prev.days];
      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        breakfast: cleanBf,
        lunch: cleanLu,
        dinner: cleanDi,
        portions,
        daily_nutrition_by_member: dailyNutrition,
      };

      // Recalculate estimated costs
      const newTotalCost = updatedDays.reduce((sum, d) => {
        const dMeals = [d.breakfast, d.lunch, d.dinner];
        const cost = dMeals.reduce((mSum, r) => mSum + (r.ingredients?.length || 4) * 0.85, 0) * (members.length || 1) * 0.75;
        return sum + cost;
      }, 0);

      const budget = prev.budget || 120.0;
      const budgetDiff = Math.round((budget - newTotalCost) * 100) / 100;
      const budgetStatus: 'ok' | 'warning' | 'exceeded' =
        newTotalCost > budget ? 'exceeded' : newTotalCost >= budget * 0.85 ? 'warning' : 'ok';

      return {
        ...prev,
        days: updatedDays,
        total_estimated_cost: Math.round(newTotalCost * 100) / 100,
        total_savings: Math.round(newTotalCost * 0.22 * 100) / 100,
        budget_difference: budgetDiff,
        budget_status: budgetStatus,
      };
    });
  };

  // 1-Click Roll single meal slot
  const handleRollSingleMeal = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const filterType =
      mealType === 'breakfast' ? 'breakfast_lunchbox' : mealType === 'lunch' ? 'lunch_lunchbox' : 'dinner_home';

    let candidates = allRecipes.filter((r) => r.meal_type === filterType);
    if (mealType === 'dinner') {
      const safe = candidates.filter((r) => isRecipeSafeForFamily(r, members));
      if (safe.length > 0) candidates = safe;
    }

    const currentMealId = currentDay[mealType]?.id;
    const pool = candidates.filter((r) => r.id !== currentMealId);
    const chosen = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : candidates[0];
    if (!chosen) return;

    if (mealType === 'breakfast') updateDayInDraft(selectedDayIndex, chosen, currentDay.lunch, currentDay.dinner);
    else if (mealType === 'lunch') updateDayInDraft(selectedDayIndex, currentDay.breakfast, chosen, currentDay.dinner);
    else updateDayInDraft(selectedDayIndex, currentDay.breakfast, currentDay.lunch, chosen);
  };

  // Day action: Re-roll all 3 meals for this day
  const handleRollEntireDay = () => {
    const bfPool = allRecipes.filter((r) => r.meal_type === 'breakfast_lunchbox');
    const luPool = allRecipes.filter((r) => r.meal_type === 'lunch_lunchbox');
    let diPool = allRecipes.filter((r) => r.meal_type === 'dinner_home');
    const safeDi = diPool.filter((r) => isRecipeSafeForFamily(r, members));
    if (safeDi.length > 0) diPool = safeDi;

    const newBf = bfPool[Math.floor(Math.random() * bfPool.length)] || currentDay.breakfast;
    const newLu = luPool[Math.floor(Math.random() * luPool.length)] || currentDay.lunch;
    const newDi = diPool[Math.floor(Math.random() * diPool.length)] || currentDay.dinner;

    updateDayInDraft(selectedDayIndex, newBf, newLu, newDi);
  };

  // Day action: Copy previous day
  const handleCopyPreviousDay = () => {
    if (selectedDayIndex <= 0) return;
    const prevDay = draftPlan.days[selectedDayIndex - 1];
    if (!prevDay) return;
    updateDayInDraft(selectedDayIndex, prevDay.breakfast, prevDay.lunch, prevDay.dinner);
  };

  // Preset Applicator
  const applyPreset = (presetKey: 'balanced' | 'high_protein' | 'fast' | 'veggie' | 'savings') => {
    let bfCandidates = allRecipes.filter((r) => r.meal_type === 'breakfast_lunchbox');
    let luCandidates = allRecipes.filter((r) => r.meal_type === 'lunch_lunchbox');
    let diCandidates = allRecipes.filter((r) => r.meal_type === 'dinner_home');

    // Strict dinner safety
    const safeDi = diCandidates.filter((r) => isRecipeSafeForFamily(r, members));
    if (safeDi.length > 0) diCandidates = safeDi;

    if (presetKey === 'high_protein') {
      bfCandidates = [...bfCandidates].sort((a, b) => b.base_protein_g - a.base_protein_g);
      luCandidates = [...luCandidates].sort((a, b) => b.base_protein_g - a.base_protein_g);
      diCandidates = [...diCandidates].sort((a, b) => b.base_protein_g - a.base_protein_g);
    } else if (presetKey === 'fast') {
      bfCandidates = [...bfCandidates].sort((a, b) => a.prep_time_minutes - b.prep_time_minutes);
      luCandidates = [...luCandidates].sort((a, b) => a.prep_time_minutes - b.prep_time_minutes);
      diCandidates = [...diCandidates].sort((a, b) => a.prep_time_minutes - b.prep_time_minutes);
    } else if (presetKey === 'veggie') {
      const isVeg = (r: Recipe) =>
        r.diet_types?.some((d) => d.toLowerCase().includes('veg')) ||
        r.tags?.some((t) => t.toLowerCase().includes('veggie') || t.toLowerCase().includes('vegetarisch'));
      const vegBf = bfCandidates.filter(isVeg);
      const vegLu = luCandidates.filter(isVeg);
      const vegDi = diCandidates.filter(isVeg);
      if (vegBf.length >= 3) bfCandidates = vegBf;
      if (vegLu.length >= 3) luCandidates = vegLu;
      if (vegDi.length >= 3) diCandidates = vegDi;
    } else if (presetKey === 'savings') {
      const hasOffer = (r: Recipe) =>
        (r.ingredients || []).some((ing) => activeRetailers.includes(ing.matched_offer_retailer || ''));
      const offBf = bfCandidates.filter(hasOffer);
      const offLu = luCandidates.filter(hasOffer);
      const offDi = diCandidates.filter(hasOffer);
      if (offBf.length >= 3) bfCandidates = offBf;
      if (offLu.length >= 3) luCandidates = offLu;
      if (offDi.length >= 3) diCandidates = offDi;
    }

    // Apply across all 7 days with nice rotation
    draftPlan.days.forEach((_, idx) => {
      const bf = bfCandidates[idx % bfCandidates.length] || allRecipes[0];
      const lu = luCandidates[idx % luCandidates.length] || allRecipes[1];
      const di = diCandidates[idx % diCandidates.length] || allRecipes[2];
      updateDayInDraft(idx, bf, lu, di);
    });
  };

  // Recipe Picker filtering
  const pickerCandidates = useMemo(() => {
    if (!activePickerSlot) return [];
    const filterType =
      activePickerSlot.mealType === 'breakfast'
        ? 'breakfast_lunchbox'
        : activePickerSlot.mealType === 'lunch'
        ? 'lunch_lunchbox'
        : 'dinner_home';

    return allRecipes
      .filter((r) => r.meal_type === filterType)
      .filter((r) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          r.title.toLowerCase().includes(q) ||
          r.ingredients?.some((ing) => ing.name.toLowerCase().includes(q)) ||
          r.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
      .filter((r) => {
        if (!onlyFamilySafe) return true;
        return isRecipeSafeForFamily(r, members);
      })
      .filter((r) => {
        if (selectedCategory === 'all') return true;
        if (selectedCategory === 'quick') return r.prep_time_minutes <= 20;
        if (selectedCategory === 'protein') return r.base_protein_g >= 25;
        if (selectedCategory === 'veggie')
          return (
            r.diet_types?.some((d) => d.toLowerCase().includes('veg')) ||
            r.tags?.some((t) => t.toLowerCase().includes('veggie'))
          );
        if (selectedCategory === 'offers')
          return (r.ingredients || []).some((ing) => activeRetailers.includes(ing.matched_offer_retailer || ''));
        return true;
      })
      .sort((a, b) => {
        const aSafe = isRecipeSafeForFamily(a, members) ? 1 : 0;
        const bSafe = isRecipeSafeForFamily(b, members) ? 1 : 0;
        return bSafe - aSafe;
      });
  }, [allRecipes, activePickerSlot, searchQuery, onlyFamilySafe, selectedCategory, members, activeRetailers]);

  // Handle selecting a recipe from the picker
  const handleSelectRecipe = (recipe: Recipe) => {
    if (!activePickerSlot) return;
    const { dayIndex, mealType } = activePickerSlot;
    const targetDay = draftPlan.days[dayIndex];
    if (!targetDay) return;

    if (mealType === 'breakfast') updateDayInDraft(dayIndex, recipe, targetDay.lunch, targetDay.dinner);
    else if (mealType === 'lunch') updateDayInDraft(dayIndex, targetDay.breakfast, recipe, targetDay.dinner);
    else updateDayInDraft(dayIndex, targetDay.breakfast, targetDay.lunch, recipe);

    setActivePickerSlot(null);
  };

  // Handle Save
  const handleSavePlan = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const ok = await onSave(draftPlan);
      if (ok) {
        setSaveFeedback('Wochenplan erfolgreich gespeichert!');
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setSaveFeedback('Fehler beim Speichern. Bitte erneut versuchen.');
      }
    } catch (e) {
      console.error(e);
      setSaveFeedback('Ein Fehler ist aufgetreten.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate day macros
  const dayPortions = Object.values(currentDay.portions || {});
  const totalDayCalories = dayPortions.reduce(
    (acc, p) => acc + (p.breakfast?.scaled_calories || 0) + (p.lunch?.scaled_calories || 0) + (p.dinner?.scaled_calories || 0),
    0
  );
  const totalDayProtein = dayPortions.reduce(
    (acc, p) => acc + (p.breakfast?.scaled_protein_g || 0) + (p.lunch?.scaled_protein_g || 0) + (p.dinner?.scaled_protein_g || 0),
    0
  );
  const totalDayCarbs = dayPortions.reduce(
    (acc, p) => acc + (p.breakfast?.scaled_carbs_g || 0) + (p.lunch?.scaled_carbs_g || 0) + (p.dinner?.scaled_carbs_g || 0),
    0
  );
  const totalDayFat = dayPortions.reduce(
    (acc, p) => acc + (p.breakfast?.scaled_fat_g || 0) + (p.lunch?.scaled_fat_g || 0) + (p.dinner?.scaled_fat_g || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="bg-white text-slate-900 w-full max-w-4xl h-[92vh] max-h-[900px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Wochen-Speiseplaner</h2>
                <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Interaktiv
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {draftPlan.week_label || `${draftPlan.start_date || 'Mo'} – ${draftPlan.end_date || 'So'}`} • Mahlzeiten flexibel anpassen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SMART THEME PRESETS BAR */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 shrink-0">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Smart-Presets:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => applyPreset('balanced')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1"
                title="Ausgewogener Mix aus allen Kategorien"
              >
                <span>⚡ Ausgewogen</span>
              </button>
              <button
                onClick={() => applyPreset('high_protein')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1"
                title="Fokus auf maximale Proteine"
              >
                <span>💪 High-Protein</span>
              </button>
              <button
                onClick={() => applyPreset('fast')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1"
                title="Unter 20 Minuten Zubereitung"
              >
                <span>⏱️ Express &lt;20m</span>
              </button>
              <button
                onClick={() => applyPreset('veggie')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-green-50 text-slate-700 hover:text-green-700 border border-slate-200 text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1"
                title="Pflanzliche Vielfalt & Ballaststoffe"
              >
                <span>🥦 Vollwert-Veggie</span>
              </button>
              <button
                onClick={() => applyPreset('savings')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1"
                title="Priorisiere aktuelle Supermarkt-Angebote"
              >
                <span>🏷️ Spar-Hit</span>
              </button>
            </div>
          </div>
        </div>

        {/* 7-DAY NAVIGATION TABS */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 shrink-0">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {draftPlan.days.map((day, idx) => {
              const isSelected = idx === selectedDayIndex;
              const safeDinner = isRecipeSafeForFamily(day.dinner, members);

              return (
                <button
                  key={day.day_name}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl border transition text-center ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-black uppercase tracking-tight">
                    {day.day_name.slice(0, 2)}
                  </span>
                  <span className={`text-[10px] font-medium leading-none mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {day.date.slice(0, 5)}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        safeDinner ? (isSelected ? 'bg-white' : 'bg-emerald-500') : 'bg-rose-500 animate-pulse'
                      }`}
                      title={safeDinner ? 'Familien-sicher' : 'Allergen-Konflikt!'}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE DAY BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Day Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                {currentDay.day_name}, {currentDay.date}
              </h3>
              <p className="text-xs text-slate-500">
                Mahlzeiten für Frühstück, Mittagessen und Abendessen individuell festlegen
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedDayIndex > 0 && (
                <button
                  onClick={handleCopyPreviousDay}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
                  title="Gleiche Mahlzeiten wie gestern übernehmen"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Vortag kopieren</span>
                </button>
              )}
              <button
                onClick={handleRollEntireDay}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition active:scale-95"
                title="Zufällig 3 ausgewogene Mahlzeiten für diesen Tag wählen"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tag neu auswürfeln</span>
              </button>
            </div>
          </div>

          {/* 3 MEAL CARDS (Breakfast, Lunch, Dinner) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. FRÜHSTÜCK */}
            <MealCard
              slotTitle="Frühstück"
              slotIcon={<Coffee className="w-4 h-4 text-amber-500" />}
              recipe={currentDay.breakfast}
              members={members}
              activeRetailers={activeRetailers}
              onChangeClick={() =>
                setActivePickerSlot({ dayIndex: selectedDayIndex, mealType: 'breakfast' })
              }
              onRollClick={() => handleRollSingleMeal('breakfast')}
            />

            {/* 2. MITTAGESSEN / LUNCHBOX */}
            <MealCard
              slotTitle="Mittagessen"
              slotIcon={<Sun className="w-4 h-4 text-orange-500" />}
              recipe={currentDay.lunch}
              members={members}
              activeRetailers={activeRetailers}
              onChangeClick={() =>
                setActivePickerSlot({ dayIndex: selectedDayIndex, mealType: 'lunch' })
              }
              onRollClick={() => handleRollSingleMeal('lunch')}
            />

            {/* 3. ABENDESSEN */}
            <MealCard
              slotTitle="Familien-Abendessen"
              slotIcon={<Moon className="w-4 h-4 text-indigo-500" />}
              recipe={currentDay.dinner}
              members={members}
              activeRetailers={activeRetailers}
              isDinner
              onChangeClick={() =>
                setActivePickerSlot({ dayIndex: selectedDayIndex, mealType: 'dinner' })
              }
              onRollClick={() => handleRollSingleMeal('dinner')}
            />
          </div>

          {/* DAY NUTRITION & MACROS COCKPIT */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                Nährwerte für {currentDay.day_name} (Gesamte Familie)
              </span>
              <span className="text-xs font-bold text-slate-500">
                {members.length} {members.length === 1 ? 'Person' : 'Personen'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> Kalorien
                </div>
                <div className="text-base font-black text-slate-900 mt-0.5">{totalDayCalories} kcal</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Dumbbell className="w-3.5 h-3.5 text-indigo-500" /> Protein
                </div>
                <div className="text-base font-black text-slate-900 mt-0.5">{totalDayProtein} g</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Leaf className="w-3.5 h-3.5 text-emerald-500" /> Kohlenhydrate
                </div>
                <div className="text-base font-black text-slate-900 mt-0.5">{totalDayCarbs} g</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Tag className="w-3.5 h-3.5 text-sky-500" /> Fett
                </div>
                <div className="text-base font-black text-slate-900 mt-0.5">{totalDayFat} g</div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 border-t border-slate-800">
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Wochenbudget</span>
              <span className="font-bold text-white">{(draftPlan.budget || 120).toFixed(2)} €</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Geschätzt</span>
              <span className="font-black text-emerald-400">{(draftPlan.total_estimated_cost || 0).toFixed(2)} €</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Ersparnis</span>
              <span className="font-bold text-emerald-300">~{(draftPlan.total_savings || 0).toFixed(2)} €</span>
            </div>
            {saveFeedback && (
              <span className="text-xs font-bold text-emerald-400 animate-pulse">
                {saveFeedback}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition active:scale-95"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSavePlan}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Speichere...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Wochenplan übernehmen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RECIPE PICKER SUBMODAL / DRAWER */}
        {activePickerSlot && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white text-slate-900 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">
                      Rezept auswählen: {activePickerSlot.mealType === 'breakfast' ? 'Frühstück' : activePickerSlot.mealType === 'lunch' ? 'Mittagessen' : 'Abendessen'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {draftPlan.days[activePickerSlot.dayIndex]?.day_name} • Klicke auf ein Rezept zum Übernehmen
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePickerSlot(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search and Filters */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rezept oder Zutat suchen..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                    {[
                      { id: 'all', label: 'Alle' },
                      { id: 'quick', label: '⏱️ Express (<20m)' },
                      { id: 'protein', label: '💪 High Protein' },
                      { id: 'veggie', label: '🥦 Veggie' },
                      { id: 'offers', label: '🏷️ Angebote' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                          selectedCategory === cat.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={onlyFamilySafe}
                      onChange={(e) => setOnlyFamilySafe(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nur familien-sicher</span>
                  </label>
                </div>
              </div>

              {/* Recipe List */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
                {pickerCandidates.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Utensils className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-bold">Keine Rezepte für diese Filter gefunden.</p>
                  </div>
                ) : (
                  pickerCandidates.map((r) => {
                    const conflicts = getRecipeFamilyConflicts(r, members);
                    const isSafe = conflicts.length === 0;

                    return (
                      <div
                        key={r.id}
                        onClick={() => handleSelectRecipe(r)}
                        className={`p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                          isSafe
                            ? 'bg-white hover:border-emerald-500 hover:bg-emerald-50/40 border-slate-200'
                            : 'bg-rose-50/30 hover:border-rose-400 border-rose-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{r.title}</h4>
                            {isSafe ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Familien-sicher
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                {conflicts.map((c) => `${c.memberName} (${c.reasons[0]})`).join(', ')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {r.prep_time_minutes} Min
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-500" /> {r.base_calories} kcal
                            </span>
                            <span className="flex items-center gap-1">
                              <Dumbbell className="w-3 h-3 text-indigo-500" /> {r.base_protein_g}g Protein
                            </span>
                          </div>
                        </div>
                        <button
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs shrink-0 ${
                            isSafe ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-800 text-white'
                          }`}
                        >
                          Wählen
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MealCardProps {
  slotTitle: string;
  slotIcon: React.ReactNode;
  recipe: Recipe;
  members: FamilyMember[];
  activeRetailers: string[];
  isDinner?: boolean;
  onChangeClick: () => void;
  onRollClick: () => void;
}

const MealCard: React.FC<MealCardProps> = ({
  slotTitle,
  slotIcon,
  recipe,
  members,
  activeRetailers,
  isDinner,
  onChangeClick,
  onRollClick,
}) => {
  const conflicts = getRecipeFamilyConflicts(recipe, members);
  const isSafe = conflicts.length === 0;

  // Identify retailer
  const retailer = recipe.ingredients?.[0]?.matched_offer_retailer || activeRetailers[0] || 'Netto';
  const badgeClass = getRetailerBadgeClass(retailer);

  return (
    <div className={`flex flex-col justify-between p-3.5 rounded-2xl border transition bg-white shadow-xs ${
      isSafe ? 'border-slate-200' : 'border-rose-300 bg-rose-50/20'
    }`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            {slotIcon}
            {slotTitle}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md ${badgeClass}`}>
            {retailer}
          </span>
        </div>

        <h4 className="font-black text-slate-900 text-sm line-clamp-2 min-h-[2.5rem] mb-1.5">
          {recipe.title}
        </h4>

        {/* Safety Badge */}
        <div className="mb-2.5">
          {isSafe ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {isDinner ? '100% Familien-sicher' : 'Verträglich'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
              <span className="truncate max-w-[170px]">
                {conflicts.map((c) => `${c.memberName}: ${c.reasons[0]}`).join(', ')}
              </span>
            </span>
          )}
        </div>

        {/* Nutrition Pills */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mb-3 flex-wrap">
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3 text-slate-400" /> {recipe.prep_time_minutes}m
          </span>
          <span>•</span>
          <span className="flex items-center gap-0.5">
            <Flame className="w-3 h-3 text-amber-500" /> {recipe.base_calories} kcal
          </span>
          <span>•</span>
          <span className="flex items-center gap-0.5">
            <Dumbbell className="w-3 h-3 text-indigo-500" /> {recipe.base_protein_g}g P
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
        <button
          onClick={onChangeClick}
          className="col-span-2 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1"
        >
          <span>Ändern</span>
        </button>
        <button
          onClick={onRollClick}
          className="col-span-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 flex items-center justify-center"
          title="Zufälliges alternatives Rezept wählen"
        >
          <span>🎲</span>
        </button>
      </div>
    </div>
  );
};

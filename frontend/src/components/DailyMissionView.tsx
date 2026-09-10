import React, { useState, useEffect } from 'react';
import { DailyHubResponse, FamilyMember, Recipe, FamilyChore } from '../types';
import { apiFetch } from '../api/client';
import { formatHumanQuantity, friendlyLabel } from '../utils/humanQuantity';
import {
  Clock,
  CheckCircle2,
  Circle,
  Briefcase,
  Store,
  Utensils,
  Sparkles,
  ChevronRight,
  Edit3,
  Check,
  Calendar,
  ShoppingBag,
  ChefHat,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Moon,
  Snowflake,
  Heart,
  Star,
  Droplets,
  Plus,
  RefreshCw,
  Activity,
  Smile
} from 'lucide-react';

interface Props {
  dailyHub: DailyHubResponse | null;
  onUpdateAction: (action: string, value?: string) => Promise<void>;
  onNavigateTab: (tab: 'heute' | 'woche' | 'einkauf' | 'vitalitaet' | 'aemtli') => void;
  onOpenRecipe: (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', recipeOrId?: any) => void;
  onStartCooking?: (recipe: Recipe) => void;
  onOpenBarcodeScanner?: () => void;
  familyMembers?: FamilyMember[];
  onAddWater?: (memberId: string, amountMl: number) => Promise<void>;
}

export const DailyMissionView: React.FC<Props> = ({
  dailyHub,
  onUpdateAction,
  onNavigateTab,
  onOpenRecipe,
  onStartCooking,
  onOpenBarcodeScanner,
  familyMembers = [],
  onAddWater,
}) => {
  const [editingWorkTime, setEditingWorkTime] = useState(false);
  const [workTimeInput, setWorkTimeInput] = useState(dailyHub?.work_end_time || '17:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showOtherMeals, setShowOtherMeals] = useState(false);

  // Real-time Chores
  const [chores, setChores] = useState<FamilyChore[]>([]);
  const [animatingChoreId, setAnimatingChoreId] = useState<string | null>(null);

  const fetchChores = async () => {
    try {
      const res = await apiFetch('/api/family/chores');
      if (res.ok) {
        const data = await res.json();
        setChores(data);
      }
    } catch (e) {
      console.error('Failed to load chores:', e);
    }
  };

  useEffect(() => {
    fetchChores();
  }, []);

  const handleToggleChore = async (choreId: string, currentStatus: boolean) => {
    setAnimatingChoreId(choreId);
    try {
      const res = await apiFetch(`/api/family/chores/${choreId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !currentStatus }),
      });
      if (res.ok) {
        const result = await res.json();
        setChores((prev) => prev.map((c) => (c.id === choreId ? result.chore : c)));
      }
    } catch (e) {
      console.error('Error toggling chore:', e);
    } finally {
      setTimeout(() => setAnimatingChoreId(null), 600);
    }
  };

  if (!dailyHub) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
          <span>Lade deinen Tag...</span>
        </div>
      </div>
    );
  }

  const handleSaveWorkTime = async () => {
    setIsSubmitting(true);
    await onUpdateAction('set_work_time', workTimeInput);
    setEditingWorkTime(false);
    setIsSubmitting(false);
  };

  const getGreeting = () => {
    switch (dailyHub.time_slot) {
      case 'morning':
        return 'Guten Morgen!';
      case 'afternoon':
        return 'Guten Tag!';
      case 'evening':
        return 'Schönen Feierabend!';
      default:
        return 'Hallo!';
    }
  };

  // Water calculation
  const totalWater = familyMembers.reduce((acc, m) => acc + (m.water_intake_ml || 0), 0);
  const totalWaterTarget = familyMembers.reduce((acc, m) => acc + (m.daily_water_target_ml || 2000), 0) || 1;
  const hydrationPct = Math.min(100, Math.round((totalWater / totalWaterTarget) * 100));

  const completedChoresCount = chores.filter((c) => c.is_completed).length;
  const totalChoresCount = chores.length;

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-fadeIn pb-24">
      {/* 1. FREUNDLICHE BEGRÜSSUNG & PULSE */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{dailyHub.current_day_name}, {dailyHub.current_date}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {getGreeting()} Dein Tag auf einen Blick
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              Alles vorbereitet: Kochen mit 1 Klick, Trinken tracken & entspannter Feierabend.
            </p>
          </div>

          {/* 2 Simple Pulse Pills */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Water Pill */}
            <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3.5 py-2 border border-white/20 flex items-center gap-2.5">
              <Droplets className="w-4 h-4 text-cyan-300" />
              <div>
                <span className="text-[10px] text-emerald-200 uppercase font-bold block">Wasser</span>
                <span className="text-xs font-black text-white">{hydrationPct}% ({totalWater} ml)</span>
              </div>
            </div>

            {/* Chores Pill */}
            <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3.5 py-2 border border-white/20 flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
              <div>
                <span className="text-[10px] text-amber-200 uppercase font-bold block">Aufgaben</span>
                <span className="text-xs font-black text-white">{completedChoresCount}/{totalChoresCount || 4} erledigt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KACHEL 1: HAUPTGERICHT HEUTE (MIT 1-KLICK KOCHEN) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800 font-black text-xs flex items-center gap-1.5">
              <Utensils className="w-4 h-4" />
              <span>Heute auf dem Tisch</span>
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {dailyHub.cook_time_badge || '25 Min.'} • {dailyHub.dishes_badge || '1 Topf/Pfanne'}
            </span>
          </div>

          {dailyHub.is_dinner_cooked && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Gekocht ✅</span>
            </span>
          )}
        </div>

        {/* Dinner Card Content */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="w-full sm:w-32 h-28 rounded-2xl overflow-hidden bg-slate-200 shrink-0 shadow-sm relative">
            <img
              src={dailyHub.dinner_recipe?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
              alt={dailyHub.dinner_recipe?.title || 'Abendessen'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {dailyHub.dinner_recipe?.title || 'Kein Abendessen geplant'}
            </h2>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                {friendlyLabel('100% Familien-sicher')}
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                {friendlyLabel('Moderate Glykämische Last')}
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowIngredients(!showIngredients)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
              >
                <span>Zutaten {showIngredients ? 'ausblenden ▲' : 'ansehen ▼'}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenRecipe(dailyHub.day_index, 'dinner', dailyHub.dinner_recipe?.id)}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Details & Nährwerte →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Ingredients with Human Rounding */}
        {showIngredients && dailyHub.dinner_recipe && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 animate-fadeIn text-xs">
            <span className="font-bold text-slate-800 block">Zutaten für das Gericht:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dailyHub.dinner_recipe.ingredients.map((ing, idx) => {
                const h = formatHumanQuantity(ing.base_amount, ing.unit);
                return (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-200/60 text-slate-700">
                    <span>• {ing.name}</span>
                    <span className="font-mono font-bold text-slate-900">{h.amount} {h.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Primary Action Button: 👨‍🍳 Kochen starten */}
        <div className="pt-2">
          {dailyHub.dinner_recipe ? (
            <button
              type="button"
              onClick={() => onStartCooking ? onStartCooking(dailyHub.dinner_recipe!) : onOpenRecipe(dailyHub.day_index, 'dinner', dailyHub.dinner_recipe?.id)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ChefHat className="w-5 h-5 text-amber-300" />
              <span>👨‍🍳 Jetzt kochen starten (Schritt-für-Schritt Assist)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateTab('woche')}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Zum Speiseplan der Woche</span>
            </button>
          )}
        </div>

        {/* Toggle other meals (Breakfast / Lunch) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowOtherMeals(!showOtherMeals)}
            className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 transition"
          >
            <span>Frühstück & Mittagspause {showOtherMeals ? 'ausblenden ▲' : 'anzeigen ▼'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('woche')}
            className="text-emerald-700 hover:underline font-bold"
          >
            Ganzer Wochenplan →
          </button>
        </div>

        {showOtherMeals && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-fadeIn text-xs">
            {/* Breakfast */}
            {dailyHub.lunchbox_breakfast && (
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/60 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">🥪 Frühstück</span>
                <h4 className="font-bold text-slate-900">{dailyHub.lunchbox_breakfast.title}</h4>
                <p className="text-[11px] text-slate-500">⏱️ {dailyHub.lunchbox_breakfast.prep_time} Min. • 🔥 {dailyHub.lunchbox_breakfast.calories} kcal</p>
                <button
                  type="button"
                  onClick={() => onOpenRecipe(dailyHub.day_index, 'breakfast', dailyHub.breakfast_recipe?.id || dailyHub.lunchbox_breakfast?.id)}
                  className="text-amber-900 font-bold hover:underline block pt-1"
                >
                  Rezept anzeigen →
                </button>
              </div>
            )}

            {/* Lunch */}
            {dailyHub.lunchbox_lunch && (
              <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-200/60 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-teal-800 block">🍱 Mittagessen (Brotdose)</span>
                <h4 className="font-bold text-slate-900">{dailyHub.lunchbox_lunch.title}</h4>
                <p className="text-[11px] text-slate-500">⏱️ {dailyHub.lunchbox_lunch.prep_time} Min. • 🔥 {dailyHub.lunchbox_lunch.calories} kcal</p>
                <button
                  type="button"
                  onClick={() => onOpenRecipe(dailyHub.day_index, 'lunch', dailyHub.lunch_recipe?.id || dailyHub.lunchbox_lunch?.id)}
                  className="text-teal-900 font-bold hover:underline block pt-1"
                >
                  Rezept anzeigen →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. KACHEL 2: EINKAUF FÜR HEUTE */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="p-2 rounded-xl bg-teal-100 text-teal-900 font-black text-xs flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4" />
            <span>Einkauf für heute</span>
          </span>

          {dailyHub.is_fresh_pick_bought ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Erledigt
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-medium">
              Auf dem Heimweg
            </span>
          )}
        </div>

        {dailyHub.fresh_pick_item ? (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                  {dailyHub.fresh_pick_item.retailer}
                </span>
                <span className="text-xs font-black text-slate-900">
                  {dailyHub.fresh_pick_item.name}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Menge: {dailyHub.fresh_pick_item.amount} • {dailyHub.fresh_pick_item.reason}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onUpdateAction('toggle_fresh_pick')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  dailyHub.is_fresh_pick_bought
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                }`}
              >
                {dailyHub.is_fresh_pick_bought ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Besorgt ✅</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" />
                    <span>Als gekauft markieren</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('einkauf')}
                className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                title="Zur Einkaufsliste"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Alles im Haus! Du musst heute nichts einkaufen.</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('einkauf')}
              className="text-xs font-bold text-emerald-700 hover:underline shrink-0"
            >
              Liste ansehen →
            </button>
          </div>
        )}
      </div>

      {/* 4. KACHEL 3: TRINKEN & FAMILIE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wasser Tracker */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-600" />
              <span>Familien-Trinkmengen</span>
            </span>
            <span className="text-xs font-mono text-cyan-700 font-bold">{hydrationPct}% geschafft</span>
          </div>

          <div className="space-y-2.5">
            {familyMembers.slice(0, 3).map((member) => {
              const current = member.water_intake_ml || 0;
              const target = member.daily_water_target_ml || 2000;
              const pct = Math.min(100, Math.round((current / target) * 100));

              return (
                <div key={member.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>{member.name}</span>
                      <span className="text-[11px] font-mono text-slate-500">{current} / {target} ml</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddWater && onAddWater(member.id, 250)}
                    className="px-2.5 py-1.5 rounded-xl bg-cyan-100 hover:bg-cyan-200 text-cyan-900 font-black text-xs active:scale-95 transition shrink-0"
                    title="+250 ml Wasser hinzufügen"
                  >
                    +250 ml
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Familien-Ämtli & Aufgaben */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Heutige Aufgaben (Ämtli)</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('aemtli')}
              className="text-xs text-amber-700 font-bold hover:underline"
            >
              Alle Aufgaben →
            </button>
          </div>

          <div className="space-y-2">
            {chores.slice(0, 3).map((chore) => {
              const isAnim = animatingChoreId === chore.id;
              return (
                <div
                  key={chore.id}
                  onClick={() => handleToggleChore(chore.id, chore.is_completed)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none ${
                    chore.is_completed
                      ? 'bg-slate-50 border-slate-200/60 opacity-60 line-through text-slate-400'
                      : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
                  } ${isAnim ? 'scale-102 bg-amber-50' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">
                      {chore.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {chore.title}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {chore.assigned_member_name}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-amber-600 shrink-0">
                    +{chore.points} ⭐
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. KACHEL 4: DER 12-MINUTEN VORABEND-TRICK FÜR MORGEN */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
              12-Minuten Vorabend-Trick
            </span>
          </div>
          <span className="text-xs text-slate-400">Für einen stressfreien Morgen</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Defrost check */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Snowflake className="w-3.5 h-3.5" />
              <span>Tiefkühl-Check</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              {dailyHub.prep_tomorrow_summary?.defrost_needed || 'Kein Auftauen nötig. Alles frisch oder im Vorrat!'}
            </p>
          </div>

          {/* Lunchbox prep */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Utensils className="w-3.5 h-3.5" />
                <span>Brotdose für morgen</span>
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5">
                {dailyHub.prep_tomorrow_summary?.lunchbox_prep || 'Brotdosen am Vorabend bereitstellen.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onUpdateAction('toggle_lunchbox')}
              className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                dailyHub.is_lunchbox_packed
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {dailyHub.is_lunchbox_packed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bereitgestellt ✅</span>
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5" />
                  <span>Jetzt bereitstellen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

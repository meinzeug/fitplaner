import React, { useState, useEffect } from 'react';
import { DailyHubResponse, FamilyMember, PantryItem, Recipe, FamilyChore } from '../types';
import { apiFetch } from '../api/client';
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
  Flame,
  Calendar,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Download,
  ChefHat,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Moon,
  Snowflake,
  PackageCheck,
  ArrowRight,
  Heart,
  Star,
  Droplets,
  Camera,
  Plus,
  Zap,
  Award,
  AlertCircle,
  RefreshCw,
  Activity
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

import { TimelineScheduleView } from './TimelineScheduleView';

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
  const [viewMode, setViewMode] = useState<'flow' | 'timeline' | 'autopilot'>('flow');
  const [editingWorkTime, setEditingWorkTime] = useState(false);
  const [workTimeInput, setWorkTimeInput] = useState(dailyHub?.work_end_time || '17:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedBreakfast, setExpandedBreakfast] = useState(false);
  const [expandedLunch, setExpandedLunch] = useState(false);
  const [expandedDinner, setExpandedDinner] = useState(false);
  
  // Real-time Chores & Routines state
  const [chores, setChores] = useState<FamilyChore[]>([]);
  const [animatingChoreId, setAnimatingChoreId] = useState<string | null>(null);
  const [recurringCount, setRecurringCount] = useState<number>(0);

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

  const fetchRecurringCount = async () => {
    try {
      const res = await apiFetch('/api/recurring');
      if (res.ok) {
        const data = await res.json();
        setRecurringCount(Array.isArray(data) ? data.length : 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchChores();
    fetchRecurringCount();
  }, []);

  const handleToggleChore = async (choreId: string, currentStatus: boolean) => {
    setAnimatingChoreId(choreId);
    try {
      const res = await apiFetch(`/api/family/chores/${choreId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !currentStatus })
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
          <span>Tages-Autopilot wird geladen...</span>
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
        return 'Guten Abend!';
    }
  };

  // Calculate Family Pulse Metrics
  const totalWater = familyMembers.reduce((acc, m) => acc + (m.water_intake_ml || 0), 0);
  const totalWaterTarget = familyMembers.reduce((acc, m) => acc + (m.daily_water_target_ml || 2000), 0) || 1;
  const hydrationPct = Math.min(100, Math.round((totalWater / totalWaterTarget) * 100));

  const completedChoresCount = chores.filter((c) => c.is_completed).length;
  const totalChoresCount = chores.length;
  const familyPoints = familyMembers.reduce((acc, m) => acc + (m.chore_points || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-16">
      {/* Top 2026 Navigation Mode Switcher */}
      <div className="bg-slate-100/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
        <button
          onClick={() => setViewMode('flow')}
          className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 ${
            viewMode === 'flow'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>🌟 2026 Life Flow OS</span>
          <span className="hidden sm:inline text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
            Bento
          </span>
        </button>

        <button
          onClick={() => setViewMode('timeline')}
          className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 ${
            viewMode === 'timeline'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>⏱️ Tages-Regie (Timeline)</span>
        </button>

        <button
          onClick={() => setViewMode('autopilot')}
          className={`hidden md:flex py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold transition items-center justify-center space-x-1.5 ${
            viewMode === 'autopilot'
              ? 'bg-slate-800 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span>📋 3-Stationen Kompakt</span>
        </button>
      </div>

      {viewMode === 'timeline' ? (
        <TimelineScheduleView
          onOpenRecipe={onOpenRecipe}
          onNavigateTab={onNavigateTab}
        />
      ) : viewMode === 'autopilot' ? (
        <>
          {/* Hero Welcome Bar */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-600/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Tages-Autopilot • {dailyHub.current_day_name}, {dailyHub.current_date}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {getGreeting()} Dein Tag auf einen Blick
                </h1>
                <p className="text-emerald-50 text-sm mt-1 max-w-lg">
                  Kein langes Planen nötig: Morgens Brotdose packen, nach Feierabend frischen Fisch/Zutaten mitnehmen, abends kochen ohne Waage.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigateTab('vitalitaet')}
                  className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-300" />
                  <span>Vitalität (30-Pflanzen)</span>
                </button>
                <button
                  onClick={() => onNavigateTab('aemtli')}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md transition flex items-center space-x-1.5"
                >
                  <Star className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                  <span>Küchen-Ämtli</span>
                </button>
                <button
                  onClick={() => onNavigateTab('woche')}
                  className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-xs font-semibold transition flex items-center space-x-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Wochenplan</span>
                </button>
                <button
                  onClick={() => onNavigateTab('einkauf')}
                  className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-xs font-semibold transition flex items-center space-x-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Einkauf</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3 Haupt-Stationen des Tages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: Brotdose to-go (Morgens) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                1. Morgens
              </span>
              <span className="text-xs text-slate-400 font-medium">To-Go & Büro</span>
            </div>

            <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center space-x-2">
              <span>🥪 Brotdose to-go</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Frühstück & Mittagspause vorbereitet für maximale Energie ohne Kantinen-Preise.
            </p>

            <div className="space-y-3 mb-5">
              {dailyHub.lunchbox_breakfast && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-slate-400">Frühstück</span>
                    <span className="text-xs text-slate-500 flex items-center space-x-1.5 font-medium">
                      <span>⏱️ {dailyHub.lunchbox_breakfast.prep_time} Min.</span>
                      <span>•</span>
                      <span>🔥 {dailyHub.lunchbox_breakfast.calories} kcal</span>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {dailyHub.lunchbox_breakfast.title}
                  </div>

                  {/* Actions for Breakfast */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      onClick={() => onOpenRecipe(dailyHub.day_index, 'breakfast', dailyHub.breakfast_recipe?.id || dailyHub.lunchbox_breakfast?.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center gap-1 transition"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Rezept & Zubereitung</span>
                    </button>

                    {(dailyHub.breakfast_recipe?.instructions?.length || dailyHub.lunchbox_breakfast.quick_instructions) && (
                      <button
                        onClick={() => setExpandedBreakfast(!expandedBreakfast)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 transition"
                      >
                        <BookOpen className="w-3 h-3 text-slate-500" />
                        <span>{expandedBreakfast ? 'Schritte ▲' : 'Schritte ▼'}</span>
                      </button>
                    )}
                  </div>

                  {/* Breakfast Accordion Steps */}
                  {expandedBreakfast && (
                    <div className="bg-white p-3 rounded-xl border border-amber-200/80 text-xs space-y-2 animate-fadeIn mt-2">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        <span>Zubereitungsschritte:</span>
                      </div>
                      {dailyHub.breakfast_recipe?.instructions && dailyHub.breakfast_recipe.instructions.length > 0 ? (
                        <ol className="space-y-1.5 pl-4 list-decimal text-slate-600 text-[11px] leading-relaxed">
                          {dailyHub.breakfast_recipe.instructions.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {dailyHub.lunchbox_breakfast.quick_instructions || 'Zutaten verrühren, kalt stellen oder direkt to-go einpacken.'}
                        </p>
                      )}
                      {dailyHub.breakfast_plate_portions && Object.keys(dailyHub.breakfast_plate_portions).length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tellertrick-Portionen:</span>
                          <div className="space-y-1">
                            {Object.entries(dailyHub.breakfast_plate_portions).map(([name, portion]) => (
                              <div key={name} className="text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 flex justify-between">
                                <span className="font-semibold text-slate-700">{name}</span>
                                <span className="text-slate-500">{portion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {dailyHub.lunchbox_lunch && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-slate-400">Mittagessen to-go</span>
                    <span className="text-xs text-slate-500 flex items-center space-x-1.5 font-medium">
                      <span>💪 {dailyHub.lunchbox_lunch.protein}g Protein</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">Kalt genießbar</span>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {dailyHub.lunchbox_lunch.title}
                  </div>

                  {/* Actions for Lunch */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      onClick={() => onOpenRecipe(dailyHub.day_index, 'lunch', dailyHub.lunch_recipe?.id || dailyHub.lunchbox_lunch?.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center gap-1 transition"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Rezept & Zubereitung</span>
                    </button>

                    {(dailyHub.lunch_recipe?.instructions?.length || dailyHub.lunchbox_lunch.quick_instructions) && (
                      <button
                        onClick={() => setExpandedLunch(!expandedLunch)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 transition"
                      >
                        <BookOpen className="w-3 h-3 text-slate-500" />
                        <span>{expandedLunch ? 'Schritte ▲' : 'Schritte ▼'}</span>
                      </button>
                    )}
                  </div>

                  {/* Lunch Accordion Steps */}
                  {expandedLunch && (
                    <div className="bg-white p-3 rounded-xl border border-amber-200/80 text-xs space-y-2 animate-fadeIn mt-2">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        <span>Zubereitungsschritte:</span>
                      </div>
                      {dailyHub.lunch_recipe?.instructions && dailyHub.lunch_recipe.instructions.length > 0 ? (
                        <ol className="space-y-1.5 pl-4 list-decimal text-slate-600 text-[11px] leading-relaxed">
                          {dailyHub.lunch_recipe.instructions.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {dailyHub.lunchbox_lunch.quick_instructions || 'Frisch portionieren, Dressing separat verpacken, Deckel fest verschließen.'}
                        </p>
                      )}
                      {dailyHub.lunch_plate_portions && Object.keys(dailyHub.lunch_plate_portions).length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tellertrick-Portionen:</span>
                          <div className="space-y-1">
                            {Object.entries(dailyHub.lunch_plate_portions).map(([name, portion]) => (
                              <div key={name} className="text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 flex justify-between">
                                <span className="font-semibold text-slate-700">{name}</span>
                                <span className="text-slate-500">{portion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onUpdateAction('toggle_lunchbox')}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition flex items-center justify-center space-x-2 shadow-sm ${
              dailyHub.is_lunchbox_packed
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {dailyHub.is_lunchbox_packed ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Brotdose eingepackt ✅</span>
              </>
            ) : (
              <>
                <Circle className="w-5 h-5 text-slate-400" />
                <span>Brotdose einpacken</span>
              </>
            )}
          </button>
        </div>

        {/* CARD 2: Feierabend & Frische-Einkauf (Just-in-Time) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                2. Nach Feierabend
              </span>
              <div className="flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Bis 20:00 Uhr</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <span>🚗 Frische-Pick</span>
              </h2>
              {/* Feierabend-Uhrzeit editieren */}
              <div className="flex items-center space-x-1">
                {editingWorkTime ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="time"
                      value={workTimeInput}
                      onChange={(e) => setWorkTimeInput(e.target.value)}
                      className="text-xs px-1.5 py-1 border rounded-lg bg-slate-50 font-bold"
                    />
                    <button
                      onClick={handleSaveWorkTime}
                      disabled={isSubmitting}
                      className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingWorkTime(true)}
                    className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg flex items-center space-x-1"
                  >
                    <Briefcase className="w-3 h-3 text-slate-500" />
                    <span>Feierabend: {dailyHub.work_end_time}</span>
                    <Edit3 className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Just-in-Time Mitnahme spart Platz im Kühlschrank und garantiert maximale Frische.
            </p>

            {dailyHub.fresh_pick_item ? (
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 mb-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                  <span className="flex items-center space-x-1">
                    <Store className="w-3.5 h-3.5 text-red-600" />
                    <span>{dailyHub.fresh_pick_item.retailer}</span>
                  </span>
                  <span className="text-emerald-700 font-extrabold">~{dailyHub.fresh_pick_item.price.toFixed(2)} €</span>
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  {dailyHub.fresh_pick_item.name}
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-0.5">
                  Menge: {dailyHub.fresh_pick_item.amount}
                </div>
                <p className="text-xs text-amber-800 mt-2 bg-white/70 p-2 rounded-xl">
                  💡 {dailyHub.fresh_pick_item.reason}
                </p>
                {dailyHub.fresh_pick_item.tip && (
                  <div className="text-[11px] text-slate-500 mt-1.5 italic">
                    📍 {dailyHub.fresh_pick_item.tip}
                  </div>
                )}
                <div className="pt-2">
                  <button
                    onClick={() => onNavigateTab('einkauf')}
                    className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>🛒 Auf Einkaufsliste anzeigen</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 text-center text-xs text-slate-500 mb-5">
                Heute alles im Haus oder keine Frische-Artikel nötig!
              </div>
            )}
          </div>

          <button
            onClick={() => onUpdateAction('toggle_fresh_pick')}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition flex items-center justify-center space-x-2 shadow-sm ${
              dailyHub.is_fresh_pick_bought
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {dailyHub.is_fresh_pick_bought ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Frisch besorgt ✅</span>
              </>
            ) : (
              <>
                <Circle className="w-5 h-5 text-emerald-200" />
                <span>Auf Heimweg mitnehmen</span>
              </>
            )}
          </button>
        </div>

        {/* CARD 3: Feierabend-Dinner & Fairer Tellertrick */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                3. Abends zuhause
              </span>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
                <span>{dailyHub.dishes_badge}</span>
                <span>•</span>
                <span>{dailyHub.cook_time_badge}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <span>🍽️ Abendessen</span>
              </h2>
              {dailyHub.dinner_recipe && (
                <button
                  onClick={() => onOpenRecipe(dailyHub.day_index, 'dinner', dailyHub.dinner_recipe?.id)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1"
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Rezept öffnen</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {dailyHub.dinner_recipe ? (
              <div className="mb-4">
                <div
                  className="relative rounded-2xl overflow-hidden h-28 mb-3 bg-slate-900 group cursor-pointer"
                  onClick={() => onOpenRecipe(dailyHub.day_index, 'dinner', dailyHub.dinner_recipe?.id)}
                >
                  <img
                    src={dailyHub.dinner_recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
                    alt={dailyHub.dinner_recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3 justify-between">
                    <div className="text-white text-sm font-bold leading-snug line-clamp-2 pr-2">
                      {dailyHub.dinner_recipe.title}
                    </div>
                    <span className="text-[10px] bg-emerald-500/90 text-slate-950 px-2 py-0.5 rounded-md font-extrabold shrink-0">
                      Öffnen ↗
                    </span>
                  </div>
                </div>

                {/* Inline Quick Steps Toggle */}
                {dailyHub.dinner_recipe.instructions && dailyHub.dinner_recipe.instructions.length > 0 && (
                  <div className="mb-2">
                    <button
                      onClick={() => setExpandedDinner(!expandedDinner)}
                      className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Schritt-für-Schritt Schnellansicht</span>
                      </span>
                      <span>{expandedDinner ? '▲' : '▼'}</span>
                    </button>

                    {expandedDinner && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1.5 text-xs space-y-1.5 animate-fadeIn">
                        <ol className="space-y-1.5 pl-4 list-decimal text-slate-700 text-[11px] leading-relaxed">
                          {dailyHub.dinner_recipe.instructions.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Der faire Tellertrick */}
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center space-x-1">
                      <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Der faire Tellertrick</span>
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Kein Wiegen</span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(dailyHub.dinner_plate_portions).map(([name, portion]) => (
                      <div key={name} className="text-xs flex flex-col bg-white p-2 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-800">{name}:</span>
                        <span className="text-slate-600 text-[11px] mt-0.5">{portion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 mb-4">
                Kein Abendessen im Wochenplan hinterlegt.
              </div>
            )}
          </div>

          <button
            onClick={() => onUpdateAction('cook_dinner')}
            disabled={dailyHub.is_dinner_cooked}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition flex items-center justify-center space-x-2 shadow-sm ${
              dailyHub.is_dinner_cooked
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            {dailyHub.is_dinner_cooked ? (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Gekocht & Lager verbucht ✅</span>
              </>
            ) : (
              <>
                <Utensils className="w-5 h-5" />
                <span>Gekocht & Vorräte abbuchen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 🌙 CARD 4: Der 12-Minuten-Vorabend-Trick für MORGEN */}
      {dailyHub.prep_tomorrow_summary && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 border border-indigo-900/50 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-indigo-800/40 pb-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Station 4 • Vorabend ~21:00 Uhr</span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                <span>🌙 Der 12-Minuten-Vorabend-Trick für MORGEN</span>
              </h3>
              <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
                12 Minuten jetzt sparen dir morgen früh 30 Minuten Hektik und Frust. Direkt alles bereitstellen!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold bg-indigo-900/60 border border-indigo-700/50 text-indigo-200 px-3 py-1.5 rounded-xl">
                ⏱️ ca. {dailyHub.prep_tomorrow_summary.est_minutes || 12} Min.
              </span>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Defrost Box */}
            {dailyHub.prep_tomorrow_summary.defrost_needed ? (
              <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black text-cyan-300 uppercase tracking-wide mb-1.5">
                    <Snowflake className="w-4 h-4 text-cyan-400" />
                    <span>Tiefkühl-Check</span>
                  </div>
                  <p className="text-xs text-indigo-100 font-semibold leading-relaxed">
                    {dailyHub.prep_tomorrow_summary.defrost_needed}
                  </p>
                </div>
                <div className="text-[11px] text-indigo-300/80 mt-3 pt-2 border-t border-indigo-800/50">
                  🧊 In den Kühlschrank zum schonenden Auftauen über Nacht
                </div>
              </div>
            ) : (
              <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-2xl p-4 flex items-center gap-3">
                <PackageCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs text-indigo-200">
                  <span className="font-bold block text-white">Kein Auftauen nötig</span>
                  <span>Alle morgigen Zutaten sind frisch oder im Vorrat!</span>
                </div>
              </div>
            )}

            {/* Tomorrow Breakfast Box */}
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-black text-amber-300 uppercase tracking-wide mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-400" />
                    <span>Frühstück morgen</span>
                  </span>
                </div>
                <p className="text-xs text-indigo-100 font-semibold leading-relaxed">
                  {dailyHub.prep_tomorrow_summary.breakfast_prep || dailyHub.tomorrow_breakfast_recipe?.title || 'Haferflocken & Zutaten bereitstellen'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-indigo-800/50 flex items-center justify-between">
                <span className="text-[11px] text-indigo-300/80">3 Min. ansetzen</span>
                {dailyHub.tomorrow_breakfast_recipe && (
                  <button
                    onClick={() => onOpenRecipe((dailyHub.day_index + 1) % 7, 'breakfast', dailyHub.tomorrow_breakfast_recipe?.id)}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-1 transition"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Rezept</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tomorrow Lunch Box */}
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-black text-emerald-300 uppercase tracking-wide mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span>Mittagessen morgen</span>
                  </span>
                </div>
                <p className="text-xs text-indigo-100 font-semibold leading-relaxed">
                  {dailyHub.prep_tomorrow_summary.lunchbox_prep || dailyHub.tomorrow_lunch_recipe?.title || 'Brotdose und Snack bereitstellen'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-indigo-800/50 flex items-center justify-between">
                <span className="text-[11px] text-indigo-300/80">5 Min. to-go Dose</span>
                {dailyHub.tomorrow_lunch_recipe && (
                  <button
                    onClick={() => onOpenRecipe((dailyHub.day_index + 1) % 7, 'lunch', dailyHub.tomorrow_lunch_recipe?.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold flex items-center gap-1 transition"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Rezept</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zero-Effort Quick Info Banner */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium">
            <strong>Kein Stress-Modus aktiv:</strong> Deine Vorräte und Kalorien werden im Hintergrund vollautomatisch verwaltet.
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="/FitPlaner.apk"
            download="FitPlaner.apk"
            className="text-slate-500 hover:text-emerald-700 font-semibold inline-flex items-center space-x-1 hover:underline transition"
            title="Direkter Download: FitPlaner.apk (4,2 MB)"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Android APK (.apk)</span>
          </a>
          <span className="text-slate-300">•</span>
          <button
            onClick={() => onUpdateAction('reset_day')}
            className="text-slate-400 hover:text-slate-600 font-semibold underline text-[11px]"
          >
            Tages-Status zurücksetzen
          </button>
        </div>
      </div>
        </>
      ) : (
        /* 🌟 2026 LIFE FLOW OS (BENTO GRID) */
        <>
          {/* 🌟 2026 LIFE FLOW HERO BANNER */}
          <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 rounded-3xl p-5 sm:p-7 text-white shadow-2xl border border-emerald-800/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase text-emerald-300 border border-white/10 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Life Flow OS • {dailyHub.current_day_name}, {dailyHub.current_date}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  {getGreeting()} Dein ganzheitlicher Tag
                </h1>
                <p className="text-emerald-200/80 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                  Perfektes Zusammenspiel von Schule, Büro, frischem Einkauf, interaktivem Kochen und Familien-Harmonie.
                </p>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigateTab('woche')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-bold transition flex items-center space-x-1.5 border border-white/10 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Woche</span>
                </button>
                <button
                  onClick={() => onNavigateTab('einkauf')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-bold transition flex items-center space-x-1.5 border border-white/10 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                  <span>Einkauf</span>
                </button>
                <button
                  onClick={() => onNavigateTab('vitalitaet')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-bold transition flex items-center space-x-1.5 border border-white/10 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-300" />
                  <span>Gesundheit</span>
                </button>
                <button
                  onClick={() => onNavigateTab('aemtli')}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Ämtli ({familyPoints} ⭐)</span>
                </button>
              </div>
            </div>

            {/* 4 Live Family Pulse Indicators */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-emerald-900/60">
              {/* Pulse 1: Hydration */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
                  <Droplets className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block truncate">
                    Wasser
                  </span>
                  <div className="text-sm font-black text-white flex items-center gap-1">
                    <span>{hydrationPct}%</span>
                    <span className="text-[10px] text-emerald-300 font-semibold truncate">
                      ({totalWater} ml)
                    </span>
                  </div>
                </div>
              </div>

              {/* Pulse 2: Chores */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block truncate">
                    Harmonie
                  </span>
                  <div className="text-sm font-black text-white flex items-center gap-1">
                    <span>{completedChoresCount}/{totalChoresCount || 4}</span>
                    <span className="text-[10px] text-amber-300 font-bold">Ämtli</span>
                  </div>
                </div>
              </div>

              {/* Pulse 3: Lunchbox */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
                <div className={`p-2 rounded-xl border shrink-0 ${
                  dailyHub.is_lunchbox_packed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                }`}>
                  <Utensils className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block truncate">
                    Brotdose
                  </span>
                  <div className="text-sm font-black text-white truncate">
                    {dailyHub.is_lunchbox_packed ? 'Gepackt ✅' : 'Noch offen'}
                  </div>
                </div>
              </div>

              {/* Pulse 4: 30-Plants */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block truncate">
                    Darmgesundheit
                  </span>
                  <div className="text-sm font-black text-white">
                    <span>21 / 30</span>
                    <span className="text-[10px] text-emerald-300 ml-1">Pflanzen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 🌟 2026 BENTO GRID LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* BENTO 1 (Span 2 on lg): 🍱 Schule & Büro Lunchbox-Radar */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-xl flex items-center gap-1.5">
                      <span>🍱 Schule & Büro Lunchbox-Radar</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">To-Go für die Familie</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    💰 spart ~150 €/M.
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Energie für Schulkinder im Unterricht & mentale Frische für Eltern im Büro statt teurer Kantine.
                </p>

                {/* Family Members Status Chips */}
                {familyMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {familyMembers.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        <span>{m.role_title || m.name}:</span>
                        <span className="text-emerald-700">{m.name}</span>
                        {dailyHub.is_lunchbox_packed && <Check className="w-3 h-3 text-emerald-600 ml-0.5" />}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meal Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {/* Breakfast To-Go */}
                  {dailyHub.lunchbox_breakfast && (
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                          Frühstück to-go
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ⏱️ {dailyHub.lunchbox_breakfast.prep_time}m • 🔥 {dailyHub.lunchbox_breakfast.calories} kcal
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 line-clamp-1">
                        {dailyHub.lunchbox_breakfast.title}
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => onOpenRecipe(dailyHub.day_index, 'breakfast', dailyHub.breakfast_recipe?.id || dailyHub.lunchbox_breakfast?.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 flex items-center gap-1 transition cursor-pointer"
                        >
                          <ChefHat className="w-3 h-3" />
                          <span>Rezept</span>
                        </button>

                        <button
                          onClick={() => setExpandedBreakfast(!expandedBreakfast)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                        >
                          {expandedBreakfast ? '▲ Verbergen' : '▼ Schritte'}
                        </button>
                      </div>

                      {expandedBreakfast && (
                        <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1.5 animate-fadeIn">
                          <ol className="list-decimal pl-4 space-y-1 text-slate-600 text-[11px]">
                            {dailyHub.breakfast_recipe?.instructions?.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            )) || <li>Zutaten portionsgerecht in die Brotdose packen.</li>}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lunch To-Go */}
                  {dailyHub.lunchbox_lunch && (
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                          Mittagspause to-go
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          💪 {dailyHub.lunchbox_lunch.protein}g Protein • Kalt
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 line-clamp-1">
                        {dailyHub.lunchbox_lunch.title}
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => onOpenRecipe(dailyHub.day_index, 'lunch', dailyHub.lunch_recipe?.id || dailyHub.lunchbox_lunch?.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-950 flex items-center gap-1 transition cursor-pointer"
                        >
                          <ChefHat className="w-3 h-3" />
                          <span>Rezept</span>
                        </button>

                        <button
                          onClick={() => setExpandedLunch(!expandedLunch)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                        >
                          {expandedLunch ? '▲ Verbergen' : '▼ Schritte'}
                        </button>
                      </div>

                      {expandedLunch && (
                        <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1.5 animate-fadeIn">
                          <ol className="list-decimal pl-4 space-y-1 text-slate-600 text-[11px]">
                            {dailyHub.lunch_recipe?.instructions?.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            )) || <li>Dose verschließen und Snack für Nachmittag beilegen.</li>}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onUpdateAction('toggle_lunchbox')}
                className={`w-full py-3 px-4 rounded-2xl font-black text-sm transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer ${
                  dailyHub.is_lunchbox_packed
                    ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {dailyHub.is_lunchbox_packed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Brotdosen für alle eingepackt ✅</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-5 h-5 text-slate-400" />
                    <span>Brotdosen jetzt einpacken (1-Klick)</span>
                  </>
                )}
              </button>
            </div>

            {/* BENTO 2 (Span 1): 💧 Familien-Hydration (Wasser-Tracker) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-800 bg-cyan-100 px-3 py-1 rounded-xl flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Wasser-Tracker</span>
                  </span>
                  <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-lg">
                    {hydrationPct}% Ziel
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Trinkmengen der Familienmitglieder im Blick behalten. 1-Klick für +250ml!
                </p>

                {/* Member Water Cards */}
                <div className="space-y-3 mb-4">
                  {familyMembers.slice(0, 4).map((m) => {
                    const intake = m.water_intake_ml || 0;
                    const target = m.daily_water_target_ml || 2000;
                    const pct = Math.min(100, Math.round((intake / target) * 100));

                    return (
                      <div key={m.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-800 truncate">
                            {m.name}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {intake} / {target} ml ({pct}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-cyan-500' : 'bg-amber-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Quick 1-Tap Add Water Button */}
                        <div className="flex justify-end pt-0.5">
                          <button
                            onClick={() => onAddWater && onAddWater(m.id, 250)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-900 text-[11px] font-black flex items-center gap-1 transition active:scale-95 shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3 text-cyan-700" />
                            <span>+250 ml</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-cyan-50/70 p-3 rounded-2xl border border-cyan-200/60 text-[11px] text-cyan-900 flex items-center gap-2">
                <span>💡</span>
                <span>Ausreichend Wasser steigert Konzentration & Gehirnleistung um bis zu 20%!</span>
              </div>
            </div>

            {/* BENTO 3 (Span 2 on lg): 👨‍🍳 Kochen im Fokus (Aktuelle Mahlzeit) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-xl flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5 text-rose-600" />
                      <span>Kochen im Fokus • Heute Abend</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {dailyHub.dishes_badge} • {dailyHub.cook_time_badge}
                    </span>
                  </div>

                  {dailyHub.is_dinner_cooked && (
                    <span className="text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg">
                      Gekocht ✅
                    </span>
                  )}
                </div>

                {dailyHub.dinner_recipe ? (
                  <div className="space-y-4 mb-4">
                    <div
                      className="relative rounded-2xl overflow-hidden h-36 bg-slate-900 group cursor-pointer"
                      onClick={() => onStartCooking ? onStartCooking(dailyHub.dinner_recipe!) : onOpenRecipe(dailyHub.day_index, 'dinner', dailyHub.dinner_recipe?.id)}
                    >
                      <img
                        src={dailyHub.dinner_recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
                        alt={dailyHub.dinner_recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex items-end p-4 justify-between">
                        <div className="pr-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30 inline-block mb-1">
                            Abendessen
                          </span>
                          <h3 className="text-white text-base sm:text-lg font-black leading-tight line-clamp-1">
                            {dailyHub.dinner_recipe.title}
                          </h3>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 flex items-center gap-1 shadow-lg transition">
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>Kochen ↗</span>
                        </div>
                      </div>
                    </div>

                    {/* Tellertrick Preview */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Der faire Tellertrick (Kein Gramm-Abwiegen)</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Für jedes Familienmitglied
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(dailyHub.dinner_plate_portions).map(([name, portion]) => (
                          <div key={name} className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs">
                            <span className="font-extrabold text-slate-900 block">{name}:</span>
                            <span className="text-slate-600 text-[11px] mt-0.5">{portion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl mb-4">
                    Kein Rezept hinterlegt. Wähle eines im Wochenplan aus!
                  </div>
                )}
              </div>

              {/* Action CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dailyHub.dinner_recipe && (
                  <button
                    onClick={() => onStartCooking ? onStartCooking(dailyHub.dinner_recipe!) : onOpenRecipe(dailyHub.day_index, 'dinner', dailyHub.dinner_recipe?.id)}
                    className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm transition flex items-center justify-center space-x-2 shadow-md shadow-amber-500/20 active:scale-98 cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4 text-white" />
                    <span>👨‍🍳 Interaktiver Kochmodus</span>
                  </button>
                )}

                <button
                  onClick={() => onUpdateAction('cook_dinner')}
                  disabled={dailyHub.is_dinner_cooked}
                  className={`py-3 px-4 rounded-2xl font-bold text-sm transition flex items-center justify-center space-x-2 shadow-sm ${
                    dailyHub.is_dinner_cooked
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                      : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                  }`}
                >
                  {dailyHub.is_dinner_cooked ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Gekocht & Lager verbucht ✅</span>
                    </>
                  ) : (
                    <>
                      <Utensils className="w-4 h-4" />
                      <span>Gekocht & Vorräte abbuchen</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* BENTO 4 (Span 1): 🛒 Frische-Radar & Haushalts-Routinen */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-xl flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-teal-600" />
                    <span>Frische & Routinen</span>
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Feierabend</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Just-in-Time Mitnahme spart Platz im Kühlschrank & garantiert maximale Frische.
                </p>

                {/* Fresh Pick Item */}
                {dailyHub.fresh_pick_item ? (
                  <div className="bg-teal-50/60 border border-teal-200/70 rounded-2xl p-4 mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                      <span className="flex items-center space-x-1">
                        <Store className="w-3.5 h-3.5 text-teal-700" />
                        <span>{dailyHub.fresh_pick_item.retailer}</span>
                      </span>
                      <span className="text-emerald-700 font-black">
                        ~{dailyHub.fresh_pick_item.price.toFixed(2)} €
                      </span>
                    </div>

                    <div className="text-sm font-extrabold text-slate-900">
                      {dailyHub.fresh_pick_item.name}
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      Menge: {dailyHub.fresh_pick_item.amount}
                    </div>

                    <p className="text-[11px] text-teal-900 bg-white/80 p-2 rounded-xl">
                      💡 {dailyHub.fresh_pick_item.reason}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-4 text-center text-xs text-slate-500 mb-4">
                    Heute alles im Haus oder keine Frische-Artikel nötig!
                  </div>
                )}

                {/* Recurring Routines Hint */}
                {recurringCount > 0 && (
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 mb-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-bold text-amber-950">
                        {recurringCount} Haushalts-Routinen (dm, Rossmann) aktiv
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onNavigateTab('einkauf')}
                    className="py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-extrabold text-xs flex items-center justify-center gap-1 border border-teal-200 transition active:scale-95 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-teal-700" />
                    <span>Einkaufsliste</span>
                  </button>

                  <button
                    onClick={onOpenBarcodeScanner}
                    className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-black text-xs flex items-center justify-center gap-1 border border-amber-300 transition active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-600" />
                    <span>Barcode Scan</span>
                  </button>
                </div>

                <button
                  onClick={() => onUpdateAction('toggle_fresh_pick')}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer ${
                    dailyHub.is_fresh_pick_bought
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {dailyHub.is_fresh_pick_bought ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Frisch besorgt ✅</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-emerald-200" />
                      <span>Auf Heimweg mitnehmen</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* BENTO 5 (Span 1 on lg): ✨ Familien-Harmonie & Küchen-Ämtli */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-xl flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                    <span>Küchen-Ämtli & Aufgaben</span>
                  </span>
                  <span className="text-xs font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    {familyPoints} ⭐ Punkte
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Gemeinsam anpacken: Kinder & Partner übernehmen Verantwortung für ein harmonisches Zuhause.
                </p>

                {/* Chores List */}
                <div className="space-y-2 mb-4">
                  {chores.slice(0, 4).map((chore) => (
                    <div
                      key={chore.id}
                      onClick={() => handleToggleChore(chore.id, chore.is_completed)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        chore.is_completed
                          ? 'bg-emerald-50/60 border-emerald-200 text-slate-500 line-through'
                          : 'bg-slate-50 hover:bg-amber-50/60 border-slate-200/80 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                          chore.is_completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {chore.is_completed && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate leading-tight">
                            {chore.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {chore.assigned_member_name || 'Freiwillig'} • +{chore.points} ⭐
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-amber-600 shrink-0">
                        +{chore.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('aemtli')}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs flex items-center justify-center gap-1.5 border border-amber-200 transition cursor-pointer"
              >
                <span>Alle Aufgaben & Sternepott öffnen</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* BENTO 6 (Span full): 🌙 Der 12-Minuten Vorabend-Trick für MORGEN */}
            {dailyHub.prep_tomorrow_summary && (
              <div className="lg:col-span-3 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-indigo-900/50 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-indigo-800/40 pb-4">
                  <div>
                    <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Vorabend ~21:00 Uhr • 12-Minuten-Trick</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                      🌙 12 Minuten Vorabend-Check: Morgen früh 0% Stress
                    </h3>
                    <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
                      Kurz vor dem Schlafengehen alles bereitstellen: Auftauen, Haferflocken ansetzen, Dosen bereitlegen.
                    </p>
                  </div>

                  <span className="text-xs font-bold bg-indigo-900/60 border border-indigo-700/50 text-indigo-200 px-3 py-1.5 rounded-xl shrink-0 self-start md:self-auto">
                    ⏱️ ca. {dailyHub.prep_tomorrow_summary.est_minutes || 12} Min.
                  </span>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Defrost Box */}
                  <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300 uppercase tracking-wide mb-1">
                        <Snowflake className="w-4 h-4 text-cyan-400" />
                        <span>Tiefkühl-Check</span>
                      </div>
                      <p className="text-xs text-indigo-100 font-semibold leading-relaxed">
                        {dailyHub.prep_tomorrow_summary.defrost_needed || 'Kein Auftauen nötig. Alles frisch oder im Vorrat!'}
                      </p>
                    </div>
                    <span className="text-[10px] text-indigo-300/70 mt-2 block">
                      🧊 Schonend im Kühlschrank auftauen
                    </span>
                  </div>

                  {/* Tomorrow Breakfast Box */}
                  <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wide mb-1">
                        <Utensils className="w-4 h-4 text-amber-400" />
                        <span>Frühstück morgen</span>
                      </div>
                      <p className="text-xs text-indigo-100 font-semibold leading-relaxed">
                        {dailyHub.prep_tomorrow_summary.breakfast_prep || dailyHub.tomorrow_breakfast_recipe?.title || 'Haferflocken & Toppings bereitstellen'}
                      </p>
                    </div>
                    {dailyHub.tomorrow_breakfast_recipe && (
                      <button
                        onClick={() => onOpenRecipe((dailyHub.day_index + 1) % 7, 'breakfast', dailyHub.tomorrow_breakfast_recipe?.id)}
                        className="mt-2 py-1 px-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black self-start transition cursor-pointer"
                      >
                        Rezept öffnen ↗
                      </button>
                    )}
                  </div>

                  {/* Tomorrow Lunch Box */}
                  <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300 uppercase tracking-wide mb-1">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        <span>Mittagessen to-go morgen</span>
                      </div>
                      <p className="text-xs text-indigo-100 font-semibold leading-relaxed">
                        {dailyHub.prep_tomorrow_summary.lunchbox_prep || dailyHub.tomorrow_lunch_recipe?.title || 'Brotdose bereitlegen'}
                      </p>
                    </div>
                    {dailyHub.tomorrow_lunch_recipe && (
                      <button
                        onClick={() => onOpenRecipe((dailyHub.day_index + 1) % 7, 'lunch', dailyHub.tomorrow_lunch_recipe?.id)}
                        className="mt-2 py-1 px-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black self-start transition cursor-pointer"
                      >
                        Rezept öffnen ↗
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

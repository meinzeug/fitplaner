import React, { useState } from 'react';
import { DailyHubResponse, FamilyMember, PantryItem, Recipe } from '../types';
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
} from 'lucide-react';

interface Props {
  dailyHub: DailyHubResponse | null;
  onUpdateAction: (action: string, value?: string) => Promise<void>;
  onNavigateTab: (tab: 'heute' | 'woche' | 'einkauf') => void;
  onOpenRecipe: (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', recipeOrId?: any) => void;
}

import { TimelineScheduleView } from './TimelineScheduleView';

export const DailyMissionView: React.FC<Props> = ({
  dailyHub,
  onUpdateAction,
  onNavigateTab,
  onOpenRecipe,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'autopilot'>('timeline');
  const [editingWorkTime, setEditingWorkTime] = useState(false);
  const [workTimeInput, setWorkTimeInput] = useState(dailyHub?.work_end_time || '17:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedBreakfast, setExpandedBreakfast] = useState(false);
  const [expandedLunch, setExpandedLunch] = useState(false);
  const [expandedDinner, setExpandedDinner] = useState(false);

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Mode Switcher: Minutengenaue Tages-Regie vs. 3-Stationen Kompakt */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
        <button
          onClick={() => setViewMode('timeline')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 ${
            viewMode === 'timeline'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>⏱️ Minutengenaue Tages-Regie (Zeitplaner)</span>
          <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
            LIVE
          </span>
        </button>

        <button
          onClick={() => setViewMode('autopilot')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 ${
            viewMode === 'autopilot'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>🌟 3-Stationen Autopilot (Kompakt)</span>
        </button>
      </div>

      {viewMode === 'timeline' ? (
        <TimelineScheduleView
          onOpenRecipe={onOpenRecipe}
          onNavigateTab={onNavigateTab}
        />
      ) : (
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

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => onNavigateTab('woche')}
                  className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-sm font-semibold transition flex items-center space-x-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Wochenplan</span>
                </button>
                <button
                  onClick={() => onNavigateTab('einkauf')}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-bold shadow-md transition flex items-center space-x-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Supermarkt-Gänge</span>
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
                    <div className="text-white text-sm font-bold truncate">
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
      )}
    </div>
  );
};

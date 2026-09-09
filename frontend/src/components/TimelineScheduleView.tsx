import React, { useState, useEffect } from 'react';
import {
  DailyTimelineResponse,
  TimelineTask,
  ScheduleTimeSettings,
  Recipe
} from '../types';
import {
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Utensils,
  Droplets,
  Apple,
  ShoppingBag,
  Snowflake,
  ShieldCheck,
  ChevronRight,
  Settings,
  Bell,
  Check,
  ArrowRight,
  Flame,
  Sun,
  Moon,
  Calendar,
  AlertCircle,
  Smartphone,
  ChefHat,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Props {
  onOpenRecipe?: (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', recipeOrId?: any) => void;
  onNavigateTab?: (tab: 'heute' | 'woche' | 'einkauf' | 'vitalitaet' | 'aemtli') => void;
}

export const TimelineScheduleView: React.FC<Props> = ({
  onOpenRecipe,
  onNavigateTab
}) => {
  const [data, setData] = useState<DailyTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [showPortionsMap, setShowPortionsMap] = useState<Record<string, boolean>>({});
  const [settingsForm, setSettingsForm] = useState<ScheduleTimeSettings>({
    wake_up_time: '06:30',
    work_start_time: '08:00',
    lunch_time: '12:30',
    work_end_time: '17:00',
    dinner_time: '18:30',
    evening_prep_time: '20:00',
    bed_time: '22:30'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchTimeline = async () => {
    try {
      const res = await fetch('/api/schedule/timeline');
      if (res.ok) {
        const json: DailyTimelineResponse = await res.json();
        setData(json);
        setSettingsForm(json.settings);
      }
    } catch (e) {
      console.error('Failed to load timeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/schedule/task/${taskId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !isCompleted })
      });
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
      }
    } catch (e) {
      console.error('Failed to toggle task:', e);
    }
  };

  const handleCompletePrepTomorrow = async () => {
    try {
      const res = await fetch('/api/schedule/prep-tomorrow/complete', {
        method: 'POST'
      });
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
      }
    } catch (e) {
      console.error('Failed to complete prep tomorrow:', e);
    }
  };

  const toggleTaskAccordion = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleTaskPortions = (taskId: string) => {
    setShowPortionsMap((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/schedule/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        setShowSettingsModal(false);
        await fetchTimeline();
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prep':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'meal':
        return <Utensils className="w-4 h-4 text-emerald-600" />;
      case 'fresh_pick':
        return <ShoppingBag className="w-4 h-4 text-teal-600" />;
      case 'snack':
        return <Apple className="w-4 h-4 text-rose-500" />;
      case 'water':
        return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'defrost':
        return <Snowflake className="w-4 h-4 text-cyan-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'prep':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'meal':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'fresh_pick':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'snack':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'water':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'defrost':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
          <span>Lade minutengenaue Tages-Regie...</span>
        </div>
      </div>
    );
  }

  const filteredTasks = data.timeline.filter((task) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'prep') return task.category === 'prep';
    if (filterCategory === 'meal') return task.category === 'meal';
    if (filterCategory === 'snack') return task.category === 'snack' || task.category === 'water';
    if (filterCategory === 'fresh_pick') return task.category === 'fresh_pick';
    return true;
  });

  const focusTask = data.current_focus_task;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Top Banner & Progress Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Minutengenaue Tages-Regie • {data.day_name}, {data.date}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Dein Ernährungs-Zeitplaner
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
                Jede Minute genau wissen, was zu tun ist: Alle Mahlzeiten sind direkt mit Rezept & Zubereitung verlinkt, Einkaufs-Stationen springen zur Einkaufsliste.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition flex items-center space-x-1.5 border border-white/10"
              >
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zeiten anpassen</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-3 w-full sm:max-w-md">
              <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data.progress_percent}%` }}
                />
              </div>
              <span className="text-xs font-extrabold text-emerald-400 shrink-0">
                {data.progress_percent}% erledigt
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Aktuelle Zeit: <strong className="text-white font-mono">{data.current_time} Uhr</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 HERO LIVE-FOKUSKARTE ("Was ist JETZT zu tun?") */}
      {focusTask && (
        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 border-2 border-emerald-400/80 rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-800">
                Jetzt anstehende Mission ({focusTask.time_str} Uhr)
              </span>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-white/80 px-2.5 py-1 rounded-full border border-slate-200">
              ⏱️ ca. {focusTask.duration_minutes} Min.
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
                {getCategoryIcon(focusTask.category)}
                <span>{focusTask.title}</span>
              </h2>
              <p className="text-sm text-slate-700 max-w-2xl leading-relaxed">
                {focusTask.description}
              </p>

              {/* Action Buttons for Focus Task */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(focusTask.category === 'meal' || focusTask.recipe_id || focusTask.meal_type) && (
                  <button
                    onClick={() => onOpenRecipe?.(focusTask.day_index || 0, focusTask.meal_type || 'dinner', focusTask.recipe_id)}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>🍳 Rezept & Zubereitung öffnen</span>
                  </button>
                )}

                {focusTask.instructions && focusTask.instructions.length > 0 && (
                  <button
                    onClick={() => toggleTaskAccordion(focusTask.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>{expandedTasks[focusTask.id] ? 'Schritte ausblenden ▲' : '📖 Schritt-für-Schritt Schnellansicht ▼'}</span>
                  </button>
                )}

                {(focusTask.category === 'fresh_pick' || focusTask.action_url === 'einkauf') && (
                  <button
                    onClick={() => onNavigateTab?.('einkauf')}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-md transition active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>🛒 Auf Einkaufsliste anzeigen</span>
                  </button>
                )}

                {focusTask.plate_portions && Object.keys(focusTask.plate_portions).length > 0 && (
                  <button
                    onClick={() => toggleTaskPortions(focusTask.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5 transition"
                  >
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>🍽️ Tellertrick-Kellenmaße</span>
                  </button>
                )}
              </div>

              {/* Expandable Accordion: Instructions & Ingredients */}
              {expandedTasks[focusTask.id] && (
                <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs space-y-3 animate-fadeIn">
                  {focusTask.instructions && focusTask.instructions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Zubereitungsschritte</span>
                      </h4>
                      <ol className="space-y-1.5 text-xs text-slate-700 pl-4 list-decimal">
                        {focusTask.instructions.map((inst, idx) => (
                          <li key={idx} className="leading-relaxed">{inst}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {focusTask.ingredients && focusTask.ingredients.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                        Zutaten (Skaliert für Familie):
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {focusTask.ingredients.map((ing, idx) => (
                          <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Expandable Tellertrick Portions */}
              {showPortionsMap[focusTask.id] && focusTask.plate_portions && (
                <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-1.5 animate-fadeIn">
                  <span className="text-xs font-bold text-amber-900 block uppercase">Kellen-Portionierung am Herd (ohne Wiegen):</span>
                  {Object.entries(focusTask.plate_portions).map(([name, portion]) => (
                    <div key={name} className="text-xs bg-white p-2 rounded-xl border border-amber-100 flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{name}:</span>
                      <span className="text-slate-700 text-[11px] font-medium">{portion}</span>
                    </div>
                  ))}
                </div>
              )}

              {focusTask.tip && (
                <div className="text-xs text-emerald-800 bg-emerald-100/60 p-2.5 rounded-xl inline-flex items-center space-x-1.5 font-medium">
                  <span>💡</span>
                  <span>{focusTask.tip}</span>
                </div>
              )}

              {/* Family members tag */}
              {focusTask.assigned_members.length > 0 && (
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Für:</span>
                  {focusTask.assigned_members.map((m) => (
                    <span
                      key={m}
                      className="text-xs bg-white font-semibold text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                    >
                      👤 {m}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleToggleTask(focusTask.id, focusTask.is_completed)}
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center space-x-2 active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Jetzt erledigen ✅</span>
              </button>
            </div>
          </div>

          {/* Next preview */}
          {data.next_task && (
            <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-slate-600">Als Nächstes um {data.next_task.time_str} Uhr:</span>
                <span className="truncate max-w-md font-medium text-slate-800">{data.next_task.title}</span>
              </div>
              <span className="text-emerald-700 font-bold shrink-0">In Kürze</span>
            </div>
          )}
        </div>
      )}

      {/* 🥪 SPEZIAL-BOX: VORABEND-BROTDOSE FÜR MORGEN */}
      {data.prep_tomorrow && (
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Mission Morgen früh • Der 12-Minuten-Vorabend-Trick</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                🥪 Brotdose für MORGEN vorbereiten (heute 20:00 Uhr)
              </h2>
              <p className="text-amber-100 text-xs sm:text-sm max-w-xl">
                Bereite heute Abend in nur 12 Minuten die Dosen für morgen vor. Morgen früh greifst du sie einfach nur aus dem Kühlschrank – 0 Minuten Hektik!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                <div className="bg-black/20 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-amber-200">Morgiges Frühstück</div>
                    <div className="text-sm font-bold text-white truncate">{data.prep_tomorrow.breakfast_title}</div>
                    <div className="text-[11px] text-amber-200 mt-0.5">⏱️ {data.prep_tomorrow.breakfast_prep_min} Min. anrühren & über Nacht quellen</div>
                  </div>
                  {data.prep_tomorrow.breakfast_recipe_id && (
                    <button
                      onClick={() => onOpenRecipe?.(1, 'breakfast', data.prep_tomorrow?.breakfast_recipe_id)}
                      className="mt-2.5 py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Rezept & Zubereitung ansehen</span>
                    </button>
                  )}
                </div>

                <div className="bg-black/20 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-amber-200">Morgige Brotdose (Mittag to-go)</div>
                    <div className="text-sm font-bold text-white truncate">{data.prep_tomorrow.lunch_title}</div>
                    <div className="text-[11px] text-amber-200 mt-0.5">🍱 Box füllen & ab in den Kühlschrank</div>
                  </div>
                  {data.prep_tomorrow.lunch_recipe_id && (
                    <button
                      onClick={() => onOpenRecipe?.(1, 'lunch', data.prep_tomorrow?.lunch_recipe_id)}
                      className="mt-2.5 py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Rezept & Zubereitung ansehen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <button
                onClick={handleCompletePrepTomorrow}
                disabled={data.prep_tomorrow.is_prep_finished}
                className={`w-full md:w-auto px-5 py-4 rounded-2xl font-extrabold text-sm transition flex items-center justify-center space-x-2 shadow-lg ${
                  data.prep_tomorrow.is_prep_finished
                    ? 'bg-white text-emerald-800 cursor-default'
                    : 'bg-white text-slate-950 hover:bg-amber-50 active:scale-95'
                }`}
              >
                {data.prep_tomorrow.is_prep_finished ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Brotdose für morgen fertig im Kühlschrank ✅</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <span>Brotdose für morgen jetzt vorbereitet ✅</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER BUTTONS */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] pr-2">Filter:</span>
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterCategory === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Alle Stationen ({data.timeline.length})
        </button>
        <button
          onClick={() => setFilterCategory('prep')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
            filterCategory === 'prep'
              ? 'bg-amber-500 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vorbereitung & Brotdose</span>
        </button>
        <button
          onClick={() => setFilterCategory('meal')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
            filterCategory === 'meal'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Mahlzeiten</span>
        </button>
        <button
          onClick={() => setFilterCategory('snack')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
            filterCategory === 'snack'
              ? 'bg-rose-500 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Apple className="w-3.5 h-3.5" />
          <span>Snacks & Wasser</span>
        </button>
        <button
          onClick={() => setFilterCategory('fresh_pick')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
            filterCategory === 'fresh_pick'
              ? 'bg-teal-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Supermarkt Frische-Pick</span>
        </button>
      </div>

      {/* CHRONOLOGISCHE TAGES-TIMELINE */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>Chronologische Tages-Timeline (06:30 – 22:30 Uhr)</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Tiefenvernetzt mit Rezepten, Zubereitung & Einkaufsliste
          </span>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {filteredTasks.map((task) => {
            const isExpanded = !!expandedTasks[task.id];
            const isPortionsOpen = !!showPortionsMap[task.id];

            return (
              <div
                key={task.id}
                className={`relative flex items-start justify-between gap-4 p-4 rounded-2xl border transition ${
                  task.is_completed
                    ? 'bg-slate-50/80 border-slate-200 opacity-60'
                    : task.is_current
                    ? 'bg-emerald-50/60 border-emerald-300 shadow-sm ring-2 ring-emerald-400/20'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs'
                }`}
              >
                {/* Timeline Marker Icon */}
                <div
                  className={`absolute -left-9 sm:-left-11 top-4 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                    task.is_completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : task.is_current
                      ? 'bg-emerald-600 border-emerald-600 text-white animate-pulse'
                      : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  {task.is_completed ? <Check className="w-3.5 h-3.5" /> : getCategoryIcon(task.category)}
                </div>

                {/* Task Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {task.time_str} Uhr
                    </span>

                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCategoryBadge(
                        task.category
                      )}`}
                    >
                      {task.category}
                    </span>

                    {task.is_current && (
                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md animate-pulse">
                        🔴 JETZT AKTIV
                      </span>
                    )}

                    <span className="text-xs text-slate-400">
                      • ⏱️ {task.duration_minutes} Min.
                    </span>
                  </div>

                  <h3
                    className={`text-sm sm:text-base font-bold ${
                      task.is_completed ? 'line-through text-slate-500' : 'text-slate-800'
                    }`}
                  >
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {task.description}
                  </p>

                  {/* Interaktive Aktions-Chips direkt auf jeder Karte */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {(task.category === 'meal' || task.recipe_id || task.meal_type) && (
                      <button
                        onClick={() => onOpenRecipe?.(task.day_index || 0, task.meal_type || 'dinner', task.recipe_id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs transition active:scale-95"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>🍳 Rezept & Zubereitung</span>
                      </button>
                    )}

                    {task.instructions && task.instructions.length > 0 && (
                      <button
                        onClick={() => toggleTaskAccordion(task.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isExpanded ? 'Schritte schließen ▲' : '📖 Zubereitungsschritte ▼'}</span>
                      </button>
                    )}

                    {(task.category === 'fresh_pick' || task.action_url === 'einkauf') && (
                      <button
                        onClick={() => onNavigateTab?.('einkauf')}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1 shadow-2xs transition active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>🛒 Zur Einkaufsliste</span>
                      </button>
                    )}

                    {task.plate_portions && Object.keys(task.plate_portions).length > 0 && (
                      <button
                        onClick={() => toggleTaskPortions(task.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 transition"
                      >
                        <Utensils className="w-3.5 h-3.5 text-amber-600" />
                        <span>🍽️ Tellertrick</span>
                      </button>
                    )}

                    {task.id === 'task-prep-tomorrow' && (
                      <>
                        {data.prep_tomorrow?.breakfast_recipe_id && (
                          <button
                            onClick={() => onOpenRecipe?.((task.day_index || 0), 'breakfast', data.prep_tomorrow?.breakfast_recipe_id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 transition"
                          >
                            <span>🥣 Morgen-Frühstück</span>
                          </button>
                        )}
                        {data.prep_tomorrow?.lunch_recipe_id && (
                          <button
                            onClick={() => onOpenRecipe?.((task.day_index || 0), 'lunch', data.prep_tomorrow?.lunch_recipe_id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 transition"
                          >
                            <span>🍱 Morgen-Mittagsbox</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Expandierbare Zubereitungsschritte */}
                  {isExpanded && task.instructions && task.instructions.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs space-y-2 mt-2 animate-fadeIn">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Schritt-für-Schritt Zubereitung:</span>
                      </div>
                      <ol className="space-y-1 text-slate-700 pl-4 list-decimal">
                        {task.instructions.map((inst, i) => (
                          <li key={i} className="leading-relaxed">{inst}</li>
                        ))}
                      </ol>

                      {task.ingredients && task.ingredients.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="font-bold text-slate-700 block mb-1">Zutaten:</span>
                          <div className="flex flex-wrap gap-1">
                            {task.ingredients.map((ing, i) => (
                              <span key={i} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expandierbare Tellertrick Kellenmaße */}
                  {isPortionsOpen && task.plate_portions && (
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-1.5 mt-2 animate-fadeIn">
                      <span className="text-xs font-bold text-amber-900 block">🥄 Kellen-Portionierung am Herd:</span>
                      {Object.entries(task.plate_portions).map(([name, portion]) => (
                        <div key={name} className="text-xs bg-white p-2 rounded-lg border border-amber-100 flex items-center justify-between">
                          <span className="font-bold text-slate-800">{name}:</span>
                          <span className="text-slate-600 text-[11px]">{portion}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {task.tip && !task.is_completed && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl mt-1.5 font-medium">
                      💡 {task.tip}
                    </p>
                  )}

                  {/* Assigned members */}
                  {task.assigned_members.length > 0 && (
                    <div className="flex items-center space-x-1 pt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Für:</span>
                      {task.assigned_members.map((m) => (
                        <span
                          key={m}
                          className="text-[11px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Checkbox Button */}
                <div className="shrink-0 flex items-center">
                  <button
                    onClick={() => handleToggleTask(task.id, task.is_completed)}
                    className={`p-2 rounded-xl transition ${
                      task.is_completed
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                    }`}
                    title={task.is_completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
                  >
                    {task.is_completed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dezent verlinkter APK Download */}
      <div className="text-center py-2 text-xs text-slate-400 flex items-center justify-center space-x-2">
        <span>Auch unterwegs im Supermarkt nutzen:</span>
        <a
          href="/FitPlaner.apk"
          download="FitPlaner.apk"
          className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center space-x-1 hover:underline transition"
          title="FitPlaner.apk herunterladen (4,2 MB)"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>FitPlaner Android APK (.apk, 4,2 MB)</span>
        </a>
      </div>

      {/* ZEITEN ANPASSEN MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <span>Persönliche Tageszeiten anpassen</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ☀️ Weck- & Aufstehzeit
                </label>
                <input
                  type="time"
                  value={settingsForm.wake_up_time}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, wake_up_time: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-bold bg-slate-50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    💼 Arbeitsbeginn
                  </label>
                  <input
                    type="time"
                    value={settingsForm.work_start_time}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, work_start_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    🍱 Mittagspause
                  </label>
                  <input
                    type="time"
                    value={settingsForm.lunch_time}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, lunch_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    🚗 Feierabend
                  </label>
                  <input
                    type="time"
                    value={settingsForm.work_end_time}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, work_end_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    🍽️ Abendessen
                  </label>
                  <input
                    type="time"
                    value={settingsForm.dinner_time}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, dinner_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    🥪 Brotdose vorbereiten
                  </label>
                  <input
                    type="time"
                    value={settingsForm.evening_prep_time}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, evening_prep_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    🌙 Bettruhe
                  </label>
                  <input
                    type="time"
                    value={settingsForm.bed_time}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, bed_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm"
                >
                  {isSavingSettings ? 'Speichern...' : 'Zeiten übernehmen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

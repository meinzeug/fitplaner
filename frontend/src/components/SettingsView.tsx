import React, { useState } from 'react';
import { AppSettings } from '../types';
import {
  Settings, Store, Check, Wallet, Heart, Radio,
  Smartphone, Sparkles, CheckCircle2, RotateCcw,
  Sliders, ShieldCheck, HelpCircle, Calendar, UtensilsCrossed, Server
} from 'lucide-react';
import { getServerUrl, isCapacitorNative } from '../api/client';

interface Props {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void>;
  onClose?: () => void;
  onOpenServerModal?: () => void;
}

interface SupermarketInfo {
  id: string;
  name: string;
  subtitle: string;
  badgeBg: string;
  badgeText: string;
  borderCol: string;
  isDiscounter: boolean;
}

const ALL_SUPERMARKETS: SupermarketInfo[] = [
  {
    id: 'Netto',
    name: 'Netto Marken-Discount',
    subtitle: 'BioBio Eigenmarken & wöchentliche Frische-Deals',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    borderCol: 'border-amber-400',
    isDiscounter: true,
  },
  {
    id: 'NP',
    name: 'NP Discount',
    subtitle: 'GUT&GÜNSTIG Produkte & regionale Sparpreise',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-900',
    borderCol: 'border-red-400',
    isDiscounter: true,
  },
  {
    id: 'Lidl',
    name: 'Lidl',
    subtitle: 'Milbona & Bio Organic Frischetheke',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    borderCol: 'border-blue-400',
    isDiscounter: true,
  },
  {
    id: 'Aldi Nord',
    name: 'Aldi Nord',
    subtitle: 'Gut Bio & Milsani Discount-Klassiker',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900',
    borderCol: 'border-sky-400',
    isDiscounter: true,
  },
  {
    id: 'Aldi Süd',
    name: 'Aldi Süd',
    subtitle: 'Frische Obsttheke & Gut Bio Sortiment',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    borderCol: 'border-indigo-400',
    isDiscounter: true,
  },
  {
    id: 'Rewe',
    name: 'Rewe',
    subtitle: 'REWE Bio, ja! Produkte & Vollsortiment',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    borderCol: 'border-rose-400',
    isDiscounter: false,
  },
  {
    id: 'Kaufland',
    name: 'Kaufland',
    subtitle: 'K-Classic & Riesen-Auswahl für Großeinkäufe',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-800',
    borderCol: 'border-red-300',
    isDiscounter: false,
  },
  {
    id: 'Edeka',
    name: 'Edeka',
    subtitle: 'EDEKA Bio & GUT&GÜNSTIG Frischetheke',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-900',
    borderCol: 'border-yellow-400',
    isDiscounter: false,
  },
];

export const SettingsView: React.FC<Props> = ({
  settings,
  onSaveSettings,
  onClose,
  onOpenServerModal,
}) => {
  const defaultDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const defaultMealSharing = {
    breakfast: 'individual' as const,
    lunch: 'individual' as const,
    dinner: 'shared' as const,
  };

  const [formData, setFormData] = useState<AppSettings>({
    ...settings,
    planned_days: settings.planned_days && settings.planned_days.length > 0 ? settings.planned_days : defaultDays,
    meal_sharing: settings.meal_sharing || defaultMealSharing,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const ALL_DAYS = [
    { id: 'Montag', short: 'Mo' },
    { id: 'Dienstag', short: 'Di' },
    { id: 'Mittwoch', short: 'Mi' },
    { id: 'Donnerstag', short: 'Do' },
    { id: 'Freitag', short: 'Fr' },
    { id: 'Samstag', short: 'Sa' },
    { id: 'Sonntag', short: 'So' },
  ];

  const toggleDay = (dayId: string) => {
    setFormData((prev) => {
      const current = prev.planned_days || defaultDays;
      const exists = current.includes(dayId);
      let next: string[];
      if (exists) {
        if (current.length <= 1) return prev;
        next = current.filter((d) => d !== dayId);
      } else {
        next = ALL_DAYS.filter((d) => current.includes(d.id) || d.id === dayId).map((d) => d.id);
      }
      return { ...prev, planned_days: next };
    });
  };

  const handleSelectAllDays = () => {
    setFormData((prev) => ({
      ...prev,
      planned_days: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
    }));
  };

  const handleSelectWorkdays = () => {
    setFormData((prev) => ({
      ...prev,
      planned_days: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'],
    }));
  };

  const handleSelectWeekend = () => {
    setFormData((prev) => ({
      ...prev,
      planned_days: ['Samstag', 'Sonntag'],
    }));
  };

  const setMealSharingMode = (meal: 'breakfast' | 'lunch' | 'dinner', mode: 'shared' | 'individual') => {
    setFormData((prev) => ({
      ...prev,
      meal_sharing: {
        ...(prev.meal_sharing || defaultMealSharing),
        [meal]: mode,
      },
    }));
  };

  const toggleRetailer = (retailerId: string) => {
    setFormData((prev) => {
      const exists = prev.active_retailers.includes(retailerId);
      let nextList: string[];
      if (exists) {
        // Must keep at least 1 active retailer
        if (prev.active_retailers.length <= 1) return prev;
        nextList = prev.active_retailers.filter((r) => r !== retailerId);
      } else {
        nextList = [...prev.active_retailers, retailerId];
      }

      // If primary was unselected, switch primary to first remaining active
      let nextPrimary = prev.primary_retailer;
      if (!nextList.includes(nextPrimary)) {
        nextPrimary = nextList[0] || 'Netto';
      }

      return {
        ...prev,
        active_retailers: nextList,
        primary_retailer: nextPrimary,
      };
    });
  };

  const handleSelectAll = () => {
    setFormData((prev) => ({
      ...prev,
      active_retailers: ALL_SUPERMARKETS.map((s) => s.id),
    }));
  };

  const handleSelectOnlyDiscounter = () => {
    const discounters = ALL_SUPERMARKETS.filter((s) => s.isDiscounter).map((s) => s.id);
    setFormData((prev) => ({
      ...prev,
      active_retailers: discounters,
      primary_retailer: discounters.includes(prev.primary_retailer) ? prev.primary_retailer : 'Netto',
    }));
  };

  const handleSelectNettoNP = () => {
    setFormData((prev) => ({
      ...prev,
      active_retailers: ['Netto', 'NP'],
      primary_retailer: 'Netto',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Fehler beim Speichern der Einstellungen.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">App- & Haushalts-Einstellungen</h2>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Supermärkte, Budget & Geräte-Verhalten
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Passe an, in welchen Supermärkten deine Familie einkauft. Nicht ausgewählte Ketten werden
            bei Wochenplänen, Rezepten und Einkaufslisten automatisch ignoriert.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition"
          >
            Zurück zur Übersicht
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold text-sm block">Einstellungen erfolgreich gespeichert!</span>
            <span className="text-xs text-emerald-700">Wochenplan und Einkaufsliste wurden sofort aktualisiert.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 0: Server & Heimnetzwerk-Verbindung */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Server-Verbindung & WLAN
                  {isCapacitorNative() && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Android APK</span>
                  )}
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5 break-all">
                  {getServerUrl() || 'http://localhost:8090'}
                </p>
              </div>
            </div>
            {onOpenServerModal && (
              <button
                type="button"
                onClick={onOpenServerModal}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition shadow-sm shrink-0 flex items-center gap-1.5"
              >
                <span>Ändern</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Der FitPlaner Server läuft auf deinem PC im lokalen Netzwerk. Hier kannst du die Ziel-IP anpassen oder die Verbindung testen.
          </p>
        </div>

        {/* SECTION 1: Supermärkte & Händler */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600" />
                Auswahl deiner Supermärkte
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Wähle die Ketten ab, die du nicht besuchst. Deine Einkaufsliste wird ausschließlich auf die aktiven Läden aufgeteilt.
              </p>
            </div>

            {/* Schnell-Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
              >
                Alle (8)
              </button>
              <button
                type="button"
                onClick={handleSelectOnlyDiscounter}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
              >
                Nur Discounter
              </button>
              <button
                type="button"
                onClick={handleSelectNettoNP}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
              >
                Netto & NP
              </button>
            </div>
          </div>

          {/* Grid of Supermarket Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ALL_SUPERMARKETS.map((sm) => {
              const isChecked = formData.active_retailers.includes(sm.id);
              const isPrimary = formData.primary_retailer === sm.id;

              return (
                <div
                  key={sm.id}
                  onClick={() => toggleRetailer(sm.id)}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer select-none relative flex flex-col justify-between ${
                    isChecked
                      ? 'bg-slate-50/80 border-emerald-500 shadow-xs'
                      : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                          isChecked
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'border-2 border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{sm.name}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${sm.badgeBg} ${sm.badgeText}`}>
                            {sm.isDiscounter ? 'Discounter' : 'Supermarkt'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{sm.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Primary Supermarket Badge / Selector */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    {isChecked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData((prev) => ({ ...prev, primary_retailer: sm.id }));
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
                          isPrimary
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isPrimary ? '⭐ Haupt-Supermarkt' : 'Als Hauptgeschäft festlegen'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Nicht eingeplant</span>
                    )}

                    {isPrimary && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Standard für Einkäufe
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong>Tipp zum Haupt-Supermarkt:</strong> Zutaten, die in keinem speziellen Prospekt-Angebot sind,
              werden automatisch deinem Haupt-Supermarkt (aktuell: <strong>{formData.primary_retailer}</strong>)
              zugeordnet. So musst du nicht für Kleinigkeiten in mehrere Läden rennen.
            </p>
          </div>
        </div>

        {/* SEKTION 1: 📅 Wöchentliche Planungstage */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                📅 Wöchentliche Planungstage
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bestimme, an welchen Wochentagen für deine Familie gekocht und geplant werden soll.
                Nicht ausgewählte Tage werden als planungsfreie Tage markiert.
              </p>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAllDays}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
              >
                Ganze Woche (Mo–So)
              </button>
              <button
                type="button"
                onClick={handleSelectWorkdays}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
              >
                Werktage (Mo–Fr)
              </button>
              <button
                type="button"
                onClick={handleSelectWeekend}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
              >
                Wochenende (Sa–So)
              </button>
            </div>
          </div>

          {/* 7 Day Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {ALL_DAYS.map((d) => {
              const isSelected = (formData.planned_days || defaultDays).includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDay(d.id)}
                  className={`p-3.5 rounded-2xl border-2 font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer select-none ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-black">{d.short}</span>
                  <span className="text-[11px] font-semibold">{d.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold mt-1 ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isSelected ? '✓ Aktiv' : 'Frei'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Aktuell ausgewählt: <strong>{(formData.planned_days || defaultDays).length} von 7 Tagen</strong>.
              Tage ohne Planung werden im Wochenplan als entspannte Kachel <em>🏖️ Planungsfreier Tag</em> angezeigt und in der Einkaufsliste ausgespart.
            </p>
          </div>
        </div>

        {/* SEKTION 2: 🥘 Mahlzeiten-Teilung im Haushalt */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
              🥘 Mahlzeiten-Teilung im Haushalt
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lege für jede Mahlzeit fest, ob alle Familienmitglieder dasselbe Rezept essen oder jeder individuelle Brotdosen/Gerichte erhält.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Frühstück */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥣</span>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">Frühstück</h4>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Morgens & Brotdose 1</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setMealSharingMode('breakfast', 'shared')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      (formData.meal_sharing?.breakfast || defaultMealSharing.breakfast) === 'shared'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🥣 Gemeinsam (1 Gericht)</span>
                    {(formData.meal_sharing?.breakfast || defaultMealSharing.breakfast) === 'shared' && <span>✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMealSharingMode('breakfast', 'individual')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      (formData.meal_sharing?.breakfast || defaultMealSharing.breakfast) === 'individual'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🍱 Individuell (Eigene Boxen)</span>
                    {(formData.meal_sharing?.breakfast || defaultMealSharing.breakfast) === 'individual' && <span>✓</span>}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200/60">
                {(formData.meal_sharing?.breakfast || defaultMealSharing.breakfast) === 'shared'
                  ? 'Alle bekommen morgens das gleiche Frühstück (z. B. gemeinsames Rührei oder Porridge).'
                  : 'Jeder erhält ein auf seine Kalorien- & Diätziele abgestimmtes eigenes Frühstück.'}
              </p>
            </div>

            {/* Mittagessen */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥗</span>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">Mittagessen</h4>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Mittag & Lunchbox to-go</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setMealSharingMode('lunch', 'shared')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      (formData.meal_sharing?.lunch || defaultMealSharing.lunch) === 'shared'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🥣 Gemeinsam (1 Gericht)</span>
                    {(formData.meal_sharing?.lunch || defaultMealSharing.lunch) === 'shared' && <span>✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMealSharingMode('lunch', 'individual')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      (formData.meal_sharing?.lunch || defaultMealSharing.lunch) === 'individual'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🍱 Individuell (Eigene Boxen)</span>
                    {(formData.meal_sharing?.lunch || defaultMealSharing.lunch) === 'individual' && <span>✓</span>}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200/60">
                {(formData.meal_sharing?.lunch || defaultMealSharing.lunch) === 'shared'
                  ? 'Ein einheitliches Lunchbox-Rezept für Schule & Arbeit für die ganze Familie.'
                  : 'Getrennte Brotdosen nach persönlichen Vorlieben (z. B. High Protein für Sportler, Gemüsesticks für Kids).'}
              </p>
            </div>

            {/* Abendessen */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍲</span>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">Abendessen</h4>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Abends frisch warm</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setMealSharingMode('dinner', 'shared')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      (formData.meal_sharing?.dinner || defaultMealSharing.dinner) === 'shared'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🥣 Gemeinsam (1 Gericht)</span>
                    {(formData.meal_sharing?.dinner || defaultMealSharing.dinner) === 'shared' && <span>✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMealSharingMode('dinner', 'individual')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      (formData.meal_sharing?.dinner || defaultMealSharing.dinner) === 'individual'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🍱 Individuell (Getrennte Teller)</span>
                    {(formData.meal_sharing?.dinner || defaultMealSharing.dinner) === 'individual' && <span>✓</span>}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200/60">
                {(formData.meal_sharing?.dinner || defaultMealSharing.dinner) === 'shared'
                  ? 'Klassischer Familientisch: 1 großer Topf frisch gekocht, Portionsmengen automatisch skaliert.'
                  : 'Individuelle Zubereitung oder getrennte Gerichte für unterschiedliche Ernährungsgewohnheiten.'}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION: Haushalts-Budget & Gesundheit */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Haushalts-Budget & Ernährungs-Ziele
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Budget */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Wöchentliches Haushaltsbudget (für alle Mahlzeiten)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="50"
                    max="500"
                    step="5"
                    value={formData.default_weekly_budget}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_weekly_budget: parseFloat(e.target.value) || 120,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-base text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-4 top-2.5 text-slate-400 font-bold">€ / Woche</span>
                </div>
              </div>

              {/* Quick Budget Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[100, 120, 150, 180, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, default_weekly_budget: val })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      formData.default_weekly_budget === val
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {val} €
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Die Einkaufsliste warnt dich automatisch, wenn du dieses Limit überschreitest.
              </p>
            </div>

            {/* Microbiome Plant Target */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  30-Pflanzen-Mikrobiom-Ziel
                </label>
                <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {formData.microbiome_plant_target} Pflanzen / Woche
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="40"
                step="1"
                value={formData.microbiome_plant_target}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    microbiome_plant_target: parseInt(e.target.value) || 30,
                  })
                }
                className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Wissenschaftlicher Standard (American Gut Project): 30 verschiedene Pflanzen pro Woche stärken das Mikrobiom maximal.
              </p>
            </div>
          </div>

          {/* Toggle: Prefer Healthy Offers */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Nur gesunde Lebensmittel & Bio-Angebote priorisieren
              </span>
              <span className="text-[11px] text-slate-400 block">
                Filtert Süßigkeiten, Softdrinks und ungesunde Fertiggerichte aus den Supermarkt-Angeboten heraus.
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  prefer_healthy_offers: !formData.prefer_healthy_offers,
                })
              }
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                formData.prefer_healthy_offers ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition" />
            </button>
          </div>
        </div>

        {/* SECTION 3: Geräte-Rolle & P2P-Mesh Sync */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
            <Radio className="w-5 h-5 text-emerald-600" />
            Geräte-Rolle & Lokale Netzwerk-Synchronisation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setFormData({ ...formData, device_role: 'host' })}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition select-none ${
                formData.device_role === 'host'
                  ? 'bg-emerald-50/60 border-emerald-500 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-sm text-slate-900">Familien-Host (Hauptgerät)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Dieses Gerät ist der Master (z.B. Eltern-Handy). Verwaltet den Wochenplan, die Einkaufsliste und verteilt Aufgaben an die Kinder.
              </p>
            </div>

            <div
              onClick={() => setFormData({ ...formData, device_role: 'client' })}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition select-none ${
                formData.device_role === 'client'
                  ? 'bg-emerald-50/60 border-emerald-500 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">Mitglieds-Client (Kinder-Handy)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Lokal auf dem Handy des Kindes. Zeigt eigene Aufgaben (Küchen-Ämtli), Trink-Zähler und gleicht sich automatisch per WLAN/Bluetooth ab.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Automatische P2P-Erkennung im WLAN (UDP-Discovery)
              </span>
              <span className="text-[11px] text-slate-400 block">
                Handys der Familie erkennen sich automatisch im Heimnetzwerk ohne Cloud oder Login.
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  sync_auto_discovery: !formData.sync_auto_discovery,
                })
              }
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                formData.sync_auto_discovery ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Abbrechen
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition disabled:opacity-50"
          >
            {isSaving ? 'Speichert...' : '✅ Einstellungen speichern'}
          </button>
        </div>
      </form>
    </div>
  );
};

function Info(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

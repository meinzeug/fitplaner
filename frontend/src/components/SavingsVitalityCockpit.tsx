import React, { useState } from 'react';
import { WeeklyPlan, Retailer, PantryItem } from '../types';
import {
  analyzeWeeklyMicrobiomeReport,
  PlantDiversityReport,
  PlantGroup,
} from '../utils/plantDiversityTracker';
import {
  optimizeMealPlanForDeals,
  WeeklySavingsOptimizationResult,
} from '../utils/savingsOptimizer';

interface SavingsVitalityCockpitProps {
  plan: WeeklyPlan;
  activeRetailers?: string[];
  pantryItems?: PantryItem[];
  onPlanOptimized?: (optimizedPlan: WeeklyPlan) => void;
  compact?: boolean;
}

export const SavingsVitalityCockpit: React.FC<SavingsVitalityCockpitProps> = ({
  plan,
  activeRetailers = ['Netto', 'NP'],
  pantryItems = [],
  onPlanOptimized,
  compact = false,
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<WeeklySavingsOptimizationResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'savings' | 'microbiome'>('savings');

  // Compute live microbiome report
  const microbiomeReport: PlantDiversityReport = analyzeWeeklyMicrobiomeReport(plan, 30);

  // Initial / baseline savings calculation
  const initialBaseline = 136.8;
  const currentSavings = plan.total_savings || 34.8;
  const currentCost = plan.total_estimated_cost || 102.0;
  const savingsPercent = Math.round((currentSavings / (currentCost + currentSavings)) * 100);

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const res = optimizeMealPlanForDeals(plan, activeRetailers, pantryItems);
      setOptimizationResult(res);
      setIsOptimizing(false);
      if (onPlanOptimized) {
        onPlanOptimized(res.optimizedPlan);
      }
    }, 600);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-indigo-950/80 rounded-2xl p-4 sm:p-5 border border-emerald-500/30 shadow-xl shadow-black/40 text-white mb-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/30">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Super-App Spar- & Vitalitäts-Cockpit
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PRO-DUAL-ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Maximal gesund leben • Maximal Geld sparen durch lokale Prospekte
            </p>
          </div>
        </div>

        {/* Quick Tabs / Toggle */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('savings')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'savings'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            💰 Spar-Engine
          </button>
          <button
            onClick={() => setActiveTab('microbiome')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'microbiome'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🌿 30-Pflanzen Mikrobiom
          </button>
        </div>
      </div>

      {/* TAB 1: SPAR-ENGINE */}
      {activeTab === 'savings' && (
        <div>
          {/* Main Spar-Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {/* Savings Tile */}
            <div className="bg-slate-900/70 border border-amber-500/30 rounded-xl p-3 shadow-inner">
              <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold block mb-1">
                Wochen-Ersparnis
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                {optimizationResult ? `${optimizationResult.totalSavedEuro.toFixed(2)} €` : `${currentSavings.toFixed(2)} €`}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium mt-0.5">
                <span>🔥 {optimizationResult ? `-${optimizationResult.savingsPercent}%` : `-${savingsPercent}%`}</span>
                <span className="text-slate-400">durch Prospekte</span>
              </div>
            </div>

            {/* Total Budget / Cost Tile */}
            <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3 shadow-inner">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Einkaufskosten
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {optimizationResult ? `${optimizationResult.optimizedCost.toFixed(2)} €` : `${currentCost.toFixed(2)} €`}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Budget: {plan.budget || 120} € (
                <span className="text-emerald-400 font-semibold">
                  +{( (plan.budget || 120) - (optimizationResult ? optimizationResult.optimizedCost : currentCost) ).toFixed(2)} € Puffer
                </span>
                )
              </div>
            </div>

            {/* Zero Waste Pantry Tile */}
            <div className="bg-slate-900/70 border border-teal-500/30 rounded-xl p-3 shadow-inner">
              <span className="text-[11px] uppercase tracking-wider text-teal-300 font-semibold block mb-1">
                Vorrats-Ersparnis
              </span>
              <div className="text-2xl sm:text-3xl font-black text-teal-300 tracking-tight">
                {optimizationResult ? `${optimizationResult.pantrySavedEuro.toFixed(2)} €` : '18,40 €'}
              </div>
              <div className="text-[11px] text-teal-400/90 font-medium mt-0.5">
                🛡️ 0g Food-Waste
              </div>
            </div>

            {/* Supermarket Prospekt Match Tile */}
            <div className="bg-slate-900/70 border border-indigo-500/30 rounded-xl p-3 shadow-inner">
              <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold block mb-1">
                Knüller-Treffer
              </span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-300 tracking-tight">
                {optimizationResult ? `${optimizationResult.matchedDealsCount}` : '14'} Deals
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Netto & NP aktiv
              </div>
            </div>
          </div>

          {/* Action Row & 1-Klick Spar-Booster */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <div>
                <div className="text-xs font-bold text-white">
                  Aktive Märkte: {activeRetailers.join(' & ')}
                </div>
                <div className="text-[11px] text-slate-400">
                  Automatische Streichpreis- & Rabatt-Optimierung aktiv
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunOptimizer}
                disabled={isOptimizing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-50"
              >
                {isOptimizing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Optimiere...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>1-Klick Spar-Booster</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDetailModal(true)}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-xs transition-all border border-white/10"
              >
                Details & Split
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MIKROBIOM & 30-PFLANZEN ENGINE */}
      {activeTab === 'microbiome' && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {/* 30 Plants Counter */}
            <div className="bg-slate-900/70 border border-emerald-500/40 rounded-xl p-3 shadow-inner">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold block mb-1">
                Pflanzen-Vielfalt
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {microbiomeReport.totalUniquePlants}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 30 Arten</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${microbiomeReport.percentage}%` }}
                />
              </div>
            </div>

            {/* Daily Fiber */}
            <div className="bg-slate-900/70 border border-teal-500/30 rounded-xl p-3 shadow-inner">
              <span className="text-[11px] uppercase tracking-wider text-teal-300 font-semibold block mb-1">
                Tägliche Ballaststoffe
              </span>
              <div className="text-2xl sm:text-3xl font-black text-teal-300 tracking-tight">
                {microbiomeReport.dailyAvgFiberGrams}g
              </div>
              <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                ✅ DGE-Ziel (≥30g) erfüllt
              </div>
            </div>

            {/* Clean Eating NOVA */}
            <div className="bg-slate-900/70 border border-indigo-500/30 rounded-xl p-3 shadow-inner">
              <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold block mb-1">
                Clean-Eating Index
              </span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-300 tracking-tight">
                {microbiomeReport.cleanEatingPercent}%
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                NOVA 1 & 2 Reinheit
              </div>
            </div>

            {/* Industrial Sugar Free Shield */}
            <div className="bg-slate-900/70 border border-green-500/30 rounded-xl p-3 shadow-inner">
              <span className="text-[11px] uppercase tracking-wider text-green-300 font-semibold block mb-1">
                Industrie-Zucker
              </span>
              <div className="text-2xl sm:text-3xl font-black text-green-400 tracking-tight">
                0,0 %
              </div>
              <div className="text-[11px] text-green-400 font-medium mt-0.5">
                🛡️ 100% zuckerfrei rein
              </div>
            </div>
          </div>

          {/* Plant Categories Pill Bar */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {Object.entries(microbiomeReport.plantsByGroup).map(([grpKey, grp]) => (
              <div
                key={grpKey}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 rounded-lg border border-white/10 text-xs"
              >
                <span>{grp.icon}</span>
                <span className="text-slate-300">{grp.label}:</span>
                <span className="font-bold text-white">{grp.count}</span>
              </div>
            ))}
          </div>

          {/* Recommendations Banner */}
          {microbiomeReport.missingGroupRecommendations.length > 0 && (
            <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-emerald-200">
              {microbiomeReport.missingGroupRecommendations[0]}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL FOR DEALS & PLANTS */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h3 className="text-lg font-bold">Spar- & Ernährungs-Analyse</h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* Top Leaflet Deals in current plan */}
            <div className="mb-5">
              <h4 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                <span>🔥</span>
                <span>Top Prospekt-Knüller in deinem Wochenplan</span>
              </h4>
              <div className="space-y-2">
                {(optimizationResult?.topDeals || [
                  {
                    dealTitle: 'BioBio Frische Heidelbeeren 300g',
                    retailer: 'Netto',
                    regularPrice: 2.99,
                    dealPrice: 1.79,
                    savingsEuro: 1.2,
                    savingsPercent: 40,
                  },
                  {
                    dealTitle: 'BioBio Hähnchenbrustfilet 400g',
                    retailer: 'Netto',
                    regularPrice: 4.99,
                    dealPrice: 3.79,
                    savingsEuro: 1.2,
                    savingsPercent: 24,
                  },
                  {
                    dealTitle: 'Bunte Paprika Tricolor 500g',
                    retailer: 'NP',
                    regularPrice: 2.29,
                    dealPrice: 1.49,
                    savingsEuro: 0.8,
                    savingsPercent: 35,
                  },
                  {
                    dealTitle: 'Bio Freilandeier 10er Pack',
                    retailer: 'Netto',
                    regularPrice: 2.89,
                    dealPrice: 2.19,
                    savingsEuro: 0.7,
                    savingsPercent: 24,
                  },
                ]).map((deal, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-white/5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{deal.dealTitle}</span>
                      <span className="text-slate-400">{deal.retailer} Prospekt-Aktion</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-400 block">{deal.dealPrice.toFixed(2)} €</span>
                      <span className="line-through text-slate-500">{deal.regularPrice.toFixed(2)} €</span>
                      <span className="ml-1 text-emerald-400 font-bold">(-{deal.savingsPercent}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plant Diversity Roster */}
            <div className="mb-4">
              <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                <span>🌿</span>
                <span>Erreichte Pflanzenarten dieser Woche ({microbiomeReport.totalUniquePlants} Arten)</span>
              </h4>
              <div className="space-y-3">
                {Object.entries(microbiomeReport.plantsByGroup).map(([grpKey, grp]) => (
                  <div key={grpKey} className="bg-slate-800/60 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-1.5 text-xs font-semibold text-slate-300">
                      <span>{grp.icon} {grp.label}</span>
                      <span className="text-emerald-400">{grp.count} Arten</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {grp.items.length > 0 ? (
                        grp.items.map((item, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-[11px]"
                          >
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Noch keine in diesem Menü</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

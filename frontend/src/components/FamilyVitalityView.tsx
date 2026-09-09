import React, { useState, useEffect } from 'react';
import { FamilyVitalityScore, MemberVitalityDetail } from '../types';
import {
  Heart,
  Sparkles,
  Droplets,
  Award,
  ShieldCheck,
  TrendingUp,
  Leaf,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Zap,
  Star,
  Users
} from 'lucide-react';

interface Props {
  onUpdateWater?: (memberId: string, deltaMl: number) => Promise<void>;
  onNavigateTab?: (tab: 'heute' | 'woche' | 'einkauf' | 'vitalitaet' | 'aemtli') => void;
}

export const FamilyVitalityView: React.FC<Props> = ({ onUpdateWater, onNavigateTab }) => {
  const [vitality, setVitality] = useState<FamilyVitalityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingWaterMemberId, setUpdatingWaterMemberId] = useState<string | null>(null);

  const fetchVitality = async () => {
    try {
      const res = await fetch('/api/vitality/radar');
      if (res.ok) {
        const data = await res.json();
        setVitality(data);
      }
    } catch (err) {
      console.error('Failed to load vitality radar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitality();
  }, []);

  const handleWaterClick = async (memberId: string, delta: number) => {
    setUpdatingWaterMemberId(memberId);
    try {
      if (onUpdateWater) {
        await onUpdateWater(memberId, delta);
      } else {
        await fetch(`/api/family/members/${memberId}/water`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delta_ml: delta })
        });
      }
      await fetchVitality();
    } catch (err) {
      console.error('Water update error:', err);
    } finally {
      setUpdatingWaterMemberId(null);
    }
  };

  if (loading || !vitality) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
          <span>Familiengesundheits-Radar wird geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-16">
      {/* 🌟 HERO: Familiengesundheits-Score & Mikrobiom-Zentrale */}
      <div className="bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black tracking-wide uppercase text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Super App • Maximale Familiengesundheit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Familien-Vitalitäts-Radar: {vitality.overall_score}/100 Punkte
            </h1>
            <p className="text-emerald-100 text-sm leading-relaxed">
              {vitality.status_label}. Evidenzbasierte Nährstoffdichte, natürlicher Zellschutz und altersangepasste Mikronährstoffe für alle Familienmitglieder.
            </p>

            {/* Quick Badges Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="bg-emerald-600/80 border border-emerald-400/40 text-white text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>0% Industrie-Zuckerzusatz</span>
              </span>
              <span className="bg-teal-600/80 border border-teal-400/40 text-white text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                <span>30g+ Ballaststoff-Garantie</span>
              </span>
              <span className="bg-indigo-600/80 border border-indigo-400/40 text-white text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-300" />
                <span>Omega-3 Herz- & Hirnschutz</span>
              </span>
            </div>
          </div>

          {/* Radial Score Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex flex-col items-center justify-center shrink-0 w-full sm:w-44 text-center">
            <div className="relative w-24 h-24 flex items-center justify-center mb-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-400"
                  strokeDasharray={`${vitality.overall_score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-white">{vitality.overall_score}</span>
                <span className="text-[10px] block text-emerald-200 uppercase font-bold">Score</span>
              </div>
            </div>
            <div className="text-xs font-extrabold text-white">Familien-Status</div>
            <div className="text-[11px] text-emerald-200">Spitzenbereich ⭐</div>
          </div>
        </div>
      </div>

      {/* 🌱 CARD: Die 30-Pflanzen-Wochen-Challenge (Mikrobiom-Boost) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg mb-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Darmflora & Mikrobiom-Goldstandard</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Die 30-Pflanzen-Wochen-Challenge
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
              Forschungen des American Gut Project beweisen: Wer wöchentlich mindestens 30 verschiedene Pflanzen (Gemüse, Obst, Vollkorn, Saaten, Kräuter) isst, stärkt die Immunabwehr maximal.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-emerald-800 font-bold">Erreicht</div>
              <div className="text-xl font-black text-emerald-700">
                {vitality.plants_count} <span className="text-xs text-emerald-600 font-semibold">/ 30 Pflanzen</span>
              </div>
            </div>
            <span className="text-2xl">🌿</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-1.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${vitality.plants_percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>{vitality.plants_percent}% der wöchentlichen Vielfalt im Menü</span>
            <span>Ziel: 30 verschiedene Pflanzensorten</span>
          </div>
        </div>

        {/* Plant Badges Cloud */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">
            In eurem aktuellen Wochenplan enthalten ({vitality.plants_count} Sorten):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-100">
            {vitality.plants_list.map((plant, idx) => (
              <span
                key={idx}
                className="bg-white border border-emerald-200 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1"
              >
                <span className="text-emerald-600">✓</span>
                <span>{plant}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Missing Booster Plants Recommendations */}
        {vitality.missing_plant_types.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950">
              <span className="font-extrabold block">Booster-Tipp für die letzten Punkte:</span>
              <span>
                Ergänzt diese Woche noch z. B.{' '}
                <strong>{vitality.missing_plant_types.join(' oder ')}</strong> als Snack oder Topping im Müsli!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 👨‍👩‍👧‍👦 FAMILIEN-MITGLIEDER VITALITÄTS-KARTEN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Altersgerechte Nährstoff- & Vitalitäts-Profile</span>
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            {vitality.members.length} Familienmitglieder
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {vitality.members.map((member) => (
            <div
              key={member.member_id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header: Name, Age, Role Title */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{member.member_name}</h3>
                      <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                        {member.age} Jahre
                      </span>
                    </div>
                    <span className="inline-block text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg mt-1">
                      {member.role_title}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      {member.score}/100
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 uppercase font-bold">
                      {member.status}
                    </span>
                  </div>
                </div>

                {/* Key Nutrient Focus based on age */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-3">
                  <div className="text-[11px] uppercase font-bold text-slate-400 mb-1">
                    Alters-Fokus Nährstoff
                  </div>
                  <div className="text-xs font-extrabold text-slate-800">
                    {member.key_focus_nutrient}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    💡 {member.actionable_tip}
                  </p>
                </div>

                {/* Macro Split & Fiber Targets */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Kalorien</span>
                    <span className="text-xs font-extrabold text-slate-800">{member.calories_target} kcal</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Protein</span>
                    <span className="text-xs font-extrabold text-slate-800">{member.protein_target_g}g</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Ballaststoffe</span>
                    <span className="text-xs font-extrabold text-emerald-700">{member.fiber_target_g}g+</span>
                  </div>
                </div>

                {/* Badges */}
                {member.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {member.badges.map((b, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-lg font-bold"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 💧 WATER TRACKER (Interaktives Glas-System) */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50/80 p-3.5 rounded-2xl border border-cyan-200/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-cyan-900 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                    <span>Wasser-Tracker ({member.water_intake_ml} / {member.water_target_ml} ml)</span>
                  </span>
                  <span className="text-xs font-bold text-cyan-700">
                    {member.water_percent}%
                  </span>
                </div>

                {/* Water Progress Bar */}
                <div className="w-full bg-cyan-100 h-2.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${member.water_percent}%` }}
                  />
                </div>

                {/* Water Action Buttons */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleWaterClick(member.member_id, -250)}
                    disabled={updatingWaterMemberId === member.member_id || member.water_intake_ml <= 0}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200 transition disabled:opacity-40"
                    title="- 250ml (1 Glas)"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleWaterClick(member.member_id, 250)}
                    disabled={updatingWaterMemberId === member.member_id}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <span>💧 + 1 Glas Wasser (250 ml)</span>
                  </button>

                  <button
                    onClick={() => handleWaterClick(member.member_id, 500)}
                    disabled={updatingWaterMemberId === member.member_id}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200 transition"
                    title="+ 500ml (Flasche)"
                  >
                    +500ml
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

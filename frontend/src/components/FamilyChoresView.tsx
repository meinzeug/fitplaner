import React, { useState, useEffect } from 'react';
import { FamilyChore, FamilyMember } from '../types';
import { apiFetch } from '../api/client';
import {
  CheckCircle2,
  Circle,
  Star,
  Sparkles,
  Users,
  Award,
  Calendar,
  ChefHat,
  Trophy,
  Filter,
  Check,
  Zap,
  ArrowRight
} from 'lucide-react';

interface Props {
  members: FamilyMember[];
  onNavigateTab?: (tab: 'heute' | 'woche' | 'einkauf' | 'vitalitaet' | 'aemtli') => void;
}

export const FamilyChoresView: React.FC<Props> = ({ members, onNavigateTab }) => {
  const [chores, setChores] = useState<FamilyChore[]>([]);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [animatingChoreId, setAnimatingChoreId] = useState<string | null>(null);

  const fetchChores = async () => {
    try {
      const res = await apiFetch('/api/family/chores');
      if (res.ok) {
        const data = await res.json();
        setChores(data);
      }
    } catch (err) {
      console.error('Failed to load chores:', err);
    } finally {
      setLoading(false);
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
        body: JSON.stringify({ is_completed: !currentStatus })
      });
      if (res.ok) {
        const result = await res.json();
        setChores((prev) =>
          prev.map((c) => (c.id === choreId ? result.chore : c))
        );
      }
    } catch (err) {
      console.error('Error toggling chore:', err);
    } finally {
      setTimeout(() => setAnimatingChoreId(null), 600);
    }
  };

  const totalPoints = members.reduce((acc, m) => acc + (m.chore_points || 0), 0);
  const starGoal = 50;
  const starPercent = Math.min(100, Math.round((totalPoints / starGoal) * 100));

  const filteredChores = selectedMemberFilter === 'all'
    ? chores
    : chores.filter((c) => c.assigned_member_id === selectedMemberFilter);

  const completedCount = chores.filter((c) => c.is_completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-4 h-4 bg-amber-500 rounded-full animate-ping" />
          <span>Familien-Küchen-Ämtli werden geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-16">
      {/* 🌟 HERO: Gemeinsamer Sternepott & Familien-Motivation */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-64 h-64 bg-amber-300/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black tracking-wide uppercase text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Familien-Teamwork • Altersgerechte Küchen-Ämtli</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gemeinsam kochen, lernen & Sterne sammeln!
            </h1>
            <p className="text-amber-100 text-sm leading-relaxed">
              Jedes Familienmitglied übernimmt heute eine altersgerechte Aufgabe – vom Tomatenwaschen für die Kleinsten bis zum Pfannenschwenken für Jugendliche. Entlastet die Eltern und macht Lust auf frische Ernährung!
            </p>

            {/* Star Pott Progress */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5 text-amber-100">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Wochen-Ziel: {totalPoints} / {starGoal} Vital-Sterne gesammelt</span>
                </span>
                <span className="text-amber-200 font-extrabold">{starPercent}% erreicht</span>
              </div>
              <div className="w-full bg-white/20 h-3.5 rounded-full overflow-hidden p-0.5 backdrop-blur-sm">
                <div
                  className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${starPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-amber-200 mt-1 block">
                🎁 Belohnung bei 50 Sternen: Großer gemeinsamer Wochenend-Ausflug!
              </span>
            </div>
          </div>

          {/* Quick Stats Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex flex-col items-center justify-center shrink-0 w-full sm:w-44 text-center">
            <Trophy className="w-8 h-8 text-amber-300 mb-1" />
            <div className="text-2xl font-black text-white">{completedCount}/{chores.length}</div>
            <div className="text-xs font-extrabold text-amber-200 uppercase">Ämtli erledigt</div>
            <div className="text-[11px] text-white/80 mt-1">Heute im Haus</div>
          </div>
        </div>
      </div>

      {/* 👥 FILTER NACH FAMILIENMITGLIED */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSelectedMemberFilter('all')}
          className={`py-2 px-3.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
            selectedMemberFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Alle Aufgaben ({chores.length})</span>
        </button>

        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMemberFilter(m.id)}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedMemberFilter === m.id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <span>{m.name} ({m.age} J.)</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-extrabold">
              {m.chore_points || 0} ⭐
            </span>
          </button>
        ))}
      </div>

      {/* 📋 CHORE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChores.map((chore) => {
          const isAnimating = animatingChoreId === chore.id;
          return (
            <div
              key={chore.id}
              className={`rounded-3xl p-5 border transition flex flex-col justify-between space-y-4 ${
                chore.is_completed
                  ? 'bg-emerald-50/70 border-emerald-300/80 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:shadow-md'
              } ${isAnimating ? 'scale-[1.02] ring-2 ring-amber-400' : ''}`}
            >
              <div>
                {/* Header row: Category, Member & Points */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{chore.icon}</span>
                    <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl">
                      {chore.assigned_member_name}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      ab {chore.min_age} Jahren
                    </span>
                  </div>

                  <span className="text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300/70 px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0">
                    <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                    <span>+{chore.points} ⭐</span>
                  </span>
                </div>

                <h3 className={`text-base font-extrabold ${chore.is_completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  {chore.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {chore.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleToggleChore(chore.id, chore.is_completed)}
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-extrabold transition flex items-center justify-center space-x-2 shadow-xs ${
                  chore.is_completed
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-98'
                }`}
              >
                {chore.is_completed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Erledigt von {chore.completed_by_name || chore.assigned_member_name} (+{chore.points} Sterne) ✅</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 text-slate-400" />
                    <span>Als erledigt abhaken (+{chore.points} Sterne sichern)</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Check, ChefHat, Play, Pause, RotateCcw, Volume2, Sparkles,
  Users, Clock, Flame, ChevronLeft, ChevronRight, CheckCircle2,
  Utensils, AlertCircle, Award, ArrowRight
} from 'lucide-react';
import { Recipe, FamilyMember, PantryItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  familyMembers: FamilyMember[];
  pantryItems?: PantryItem[];
  onFinishCooking: (recipe: Recipe, participatingMemberIds: string[]) => Promise<void>;
}

export const CookingModeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  recipe,
  familyMembers,
  pantryItems = [],
  onFinishCooking,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  
  // Kitchen Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInitial, setTimerInitial] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  const [isFinishing, setIsFinishing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isOpen && familyMembers.length > 0) {
      setSelectedMemberIds(familyMembers.map((m) => m.id));
      setCurrentStep(0);
      setCheckedIngredients({});
      setTimerRunning(false);
      setTimerSeconds(0);
    }
  }, [isOpen, familyMembers]);

  // Timer Tick
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerRunning(false);
            playTimerAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerSeconds]);

  const playTimerAlarm = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, ctx.currentTime + i * 0.3);
          gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.2);
          osc.start(ctx.currentTime + i * 0.3);
          osc.stop(ctx.currentTime + i * 0.3 + 0.25);
        }
      }
    } catch {}
  };

  const startTimerWithDuration = (minutes: number) => {
    const secs = minutes * 60;
    setTimerInitial(secs);
    setTimerSeconds(secs);
    setTimerRunning(true);
  };

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(timerInitial);
  };

  if (!isOpen || !recipe) return null;

  const totalSteps = recipe.instructions?.length || 1;
  const currentInstruction = recipe.instructions?.[currentStep] || 'Mahlzeit anrichten und servieren!';

  // Detect time mentioned in instruction (e.g. '10 Minuten' or '5 Min')
  const detectedMinutesMatch = currentInstruction.match(/(\d+)\s*(?:minuten|min)/i);
  const detectedMinutes = detectedMinutesMatch ? parseInt(detectedMinutesMatch[1], 10) : null;

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setIsFinishing(true);
    try {
      await onFinishCooking(recipe, selectedMemberIds);
      setShowCelebration(true);
      playTimerAlarm();
      setTimeout(() => {
        setShowCelebration(false);
        setIsFinishing(false);
        onClose();
      }, 2200);
    } catch (e) {
      setIsFinishing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-2 sm:p-4 animate-fadeIn select-none">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh] text-white">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                Interaktiver Koch-Modus
              </span>
              <h2 className="font-black text-base sm:text-lg leading-tight line-clamp-1">
                {recipe.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Kitchen Timer Widget */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-mono font-black text-sm text-white">
                {formatTime(timerSeconds)}
              </span>
              {timerSeconds > 0 && (
                <button
                  type="button"
                  onClick={toggleTimer}
                  className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
                >
                  {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Celebration Overlay */}
        {showCelebration && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mb-4 animate-bounce">
              <Award className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              Guten Appetit! 🌟
            </h3>
            <p className="text-sm text-emerald-400 font-bold max-w-sm mb-4">
              Mahlzeit zubereitet • Vorratslager aktualisiert • +50 Harmonie-Punkte für die Familie gutgeschrieben!
            </p>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Family Member Portion Bar */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-4 h-4 text-emerald-400" />
                Wer isst heute mit? (Portionsanpassung)
              </span>
              <span className="text-emerald-400 font-mono">
                {selectedMemberIds.length} von {familyMembers.length} Personen
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {familyMembers.map((m) => {
                const isSelected = selectedMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>SCHRITT {currentStep + 1} VON {totalSteps}</span>
              <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% ABGESCHLOSSEN</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Active Step Hero Card */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-black text-lg shrink-0">
                {currentStep + 1}
              </span>
              <div className="flex-1 space-y-3">
                <p className="text-base sm:text-xl font-bold leading-relaxed text-white">
                  {currentInstruction}
                </p>

                {/* Smart Detected Timer Button */}
                {detectedMinutes && (
                  <button
                    type="button"
                    onClick={() => startTimerWithDuration(detectedMinutes)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black hover:bg-amber-500/30 active:scale-95 transition shadow-sm"
                  >
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>⏱️ {detectedMinutes} Min Timer starten</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Ingredients Checklist for current recipe */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                Zutaten für {selectedMemberIds.length} Portionen
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {Object.values(checkedIngredients).filter(Boolean).length} / {recipe.ingredients?.length || 0} bereit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.ingredients?.map((ing, idx) => {
                const isChecked = !!checkedIngredients[idx];
                const scaledAmount = Math.round((ing.base_amount || 100) * (selectedMemberIds.length / 2) * 10) / 10;
                return (
                  <div
                    key={idx}
                    onClick={() =>
                      setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }))
                    }
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-slate-900/40 border-slate-800 text-slate-500 line-through'
                        : 'bg-slate-900 border-slate-700/80 text-white hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-400 shrink-0">
                      {scaledAmount} {ing.unit}
                    </span>
                    <span className="text-xs font-semibold truncate">
                      {ing.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Bottom Navigation Controls */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Zurück</span>
          </button>

          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg active:scale-95 transition flex items-center gap-1.5"
            >
              <span>Nächster Schritt</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isFinishing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-900/40 active:scale-95 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Mahlzeit fertig zubereitet!</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

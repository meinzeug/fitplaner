import React, { useState } from 'react';
import {
  setAppMode,
  setServerUrl,
  checkServerConnection,
  AppMode,
} from '../api/client';
import { discoverFitPlanerServer, DiscoveredServer } from '../api/discovery';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedMode, setSelectedMode] = useState<AppMode>('standalone');
  const [manualIp, setManualIp] = useState('192.168.178.57');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [discovered, setDiscovered] = useState<DiscoveredServer | null>(null);

  // Profile / Quick Setup state
  const [householdName, setHouseholdName] = useState('Familie Schmidt');
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([
    'Netto',
    'NP',
    'Lidl',
    'Aldi Nord',
    'Rewe',
  ]);
  const [weeklyBudget, setWeeklyBudget] = useState('120');
  const [zipCode, setZipCode] = useState('30159');

  if (!isOpen) return null;

  const handleStartDiscovery = async () => {
    setIsScanning(true);
    setScanStatus('Starte automatischen WLAN-Scan...');
    setDiscovered(null);

    try {
      const result = await discoverFitPlanerServer(
        manualIp ? `http://${manualIp}:8090` : undefined,
        (msg) => setScanStatus(msg)
      );

      if (result) {
        setDiscovered(result);
        setManualIp(result.ip);
        setScanStatus(`✅ Gefunden: ${result.ip} (${result.responseTimeMs}ms)`);
      } else {
        setScanStatus('❌ Kein PC-Server gefunden. Bitte IP prüfen oder eigenständigen Smartphone-Modus wählen.');
      }
    } catch {
      setScanStatus('Scan fehlgeschlagen.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFinish = async () => {
    setAppMode(selectedMode);
    if (selectedMode === 'server') {
      const finalUrl = `http://${manualIp.trim()}:8090`;
      setServerUrl(finalUrl);
    }

    // Save quick settings
    localStorage.setItem('fitplaner_onboarded', 'true');
    localStorage.setItem('fitplaner_quick_zip', zipCode);
    localStorage.setItem('fitplaner_quick_budget', weeklyBudget);

    onComplete();
  };

  const toggleRetailer = (name: string) => {
    if (selectedRetailers.includes(name)) {
      if (selectedRetailers.length > 1) {
        setSelectedRetailers(selectedRetailers.filter((r) => r !== name));
      }
    } else {
      setSelectedRetailers([...selectedRetailers, name]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🥗</span>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              FitPlaner Einrichtung
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-6 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    : s < step
                    ? 'w-2 bg-emerald-700'
                    : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center text-center space-y-5 py-4">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-4xl shadow-inner">
              ✨
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">
                Willkommen bei FitPlaner!
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                Dein intelligenter Ernährungs- & Familienplaner mit Multi-Supermarkt Einkaufsliste für Netto, NP, Lidl, Aldi, Rewe & Co.
              </p>
            </div>

            <div className="w-full bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2.5">
                <span className="text-base">⚡</span>
                <span>Portionen millimetergenau skaliert für jedes Familienmitglied</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="text-base">📰</span>
                <span>Echte digitale Supermarkt-Prospekte & Live-Angebote</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="text-base">📱</span>
                <span>Funktioniert komplett autark auf dem Smartphone oder mit PC-Server</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Jetzt einrichten →
            </button>
          </div>
        )}

        {/* STEP 2: MODE SELECTION */}
        {step === 2 && (
          <div className="flex-1 flex flex-col space-y-4">
            <div className="text-left">
              <h2 className="text-xl font-bold text-white">Wie möchtest du FitPlaner nutzen?</h2>
              <p className="text-xs text-slate-400 mt-1">
                Wähle zwischen autarkem Smartphone-Betrieb oder Heim-Server Verbindung.
              </p>
            </div>

            {/* Option A: Standalone */}
            <div
              onClick={() => setSelectedMode('standalone')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedMode === 'standalone'
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
                    📱
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
                      <span>Eigenständig auf diesem Smartphone</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                        100% Autark
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kein PC oder Server im Haushalt nötig. Alle Pläne, Vorräte und Prospekte laufen direkt auf dem Smartphone.
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                    selectedMode === 'standalone'
                      ? 'border-emerald-400 bg-emerald-400 text-slate-950 font-bold'
                      : 'border-slate-600'
                  }`}
                >
                  {selectedMode === 'standalone' && '✓'}
                </div>
              </div>
            </div>

            {/* Option B: PC Server */}
            <div
              onClick={() => setSelectedMode('server')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedMode === 'server'
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xl">
                    🏠
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Mit Heim-Server (PC) verbinden</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Synchronisiert mit dem FitPlaner Server auf deinem Linux-/Windows-PC im heimischen WLAN.
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                    selectedMode === 'server'
                      ? 'border-emerald-400 bg-emerald-400 text-slate-950 font-bold'
                      : 'border-slate-600'
                  }`}
                >
                  {selectedMode === 'server' && '✓'}
                </div>
              </div>

              {selectedMode === 'server' && (
                <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartDiscovery();
                    }}
                    disabled={isScanning}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-500/30 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
                  >
                    <span className={isScanning ? 'animate-spin' : ''}>📡</span>
                    <span>{isScanning ? 'Scanne WLAN-Subnetz...' : 'WLAN automatisch nach PC-Server scannen'}</span>
                  </button>

                  {scanStatus && (
                    <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-700/50">
                      {scanStatus}
                    </p>
                  )}

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Server IP:</span>
                    <input
                      type="text"
                      value={manualIp}
                      onChange={(e) => setManualIp(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="192.168.178.57"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                    <span className="text-xs text-slate-500">:8090</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 mt-4 pt-2">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
              >
                Zurück
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Weiter zu Schritt 3 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: QUICK CONFIGURATION */}
        {step === 3 && (
          <div className="flex-1 flex flex-col space-y-4 text-left">
            <div>
              <h2 className="text-xl font-bold text-white">Haushalt & Supermärkte</h2>
              <p className="text-xs text-slate-400 mt-1">
                Passe FitPlaner schnell an deinen Einkauf & Budget an.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Name des Haushalts</label>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1.5">
                  Deine Supermärkte (für Prospekte & Angebote)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Netto', 'NP', 'Lidl', 'Aldi Nord', 'Aldi Süd', 'Rewe', 'Kaufland', 'Edeka'].map(
                    (ret) => {
                      const active = selectedRetailers.includes(ret);
                      return (
                        <button
                          key={ret}
                          type="button"
                          onClick={() => toggleRetailer(ret)}
                          className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                            active
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}
                          {ret}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Wochenbudget (€)</label>
                  <input
                    type="number"
                    value={weeklyBudget}
                    onChange={(e) => setWeeklyBudget(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Postleitzahl (PLZ)</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="30159"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-4 pt-2">
              <button
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
              >
                Zurück
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Zusammenfassung →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: READY */}
        {step === 4 && (
          <div className="flex-1 flex flex-col items-center text-center space-y-4 py-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl">
              🎉
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">Alles eingerichtet!</h2>
              <p className="text-xs text-slate-400">FitPlaner ist jetzt startklar für deinen Haushalt.</p>
            </div>

            <div className="w-full bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Betriebsmodus:</span>
                <span className="font-semibold text-emerald-400">
                  {selectedMode === 'standalone' ? '📱 Eigenständig (Smartphone)' : '🏠 PC-Server'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Haushalt:</span>
                <span className="font-semibold text-white">{householdName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Wochenbudget:</span>
                <span className="font-semibold text-emerald-400">{weeklyBudget} €</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Supermärkte:</span>
                <span className="font-semibold text-white truncate max-w-[180px]">
                  {selectedRetailers.join(', ')}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              🚀 FitPlaner starten
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

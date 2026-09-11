import React, { useState, useEffect } from 'react';
import {
  Server,
  Wifi,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ArrowRight,
  Smartphone,
  Search,
  CloudLightning,
  Monitor,
  Check,
  Radio,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getServerUrl,
  setServerUrl,
  checkServerConnection,
  getAppMode,
  setAppMode,
  isCapacitorNative,
  AppMode,
} from '../api/client';
import {
  performBidirectionalSync,
  getSyncStatus,
  subscribeSyncStatus,
  SyncStatusInfo,
} from '../api/syncManager';
import { discoverFitPlanerServer, DiscoveredServer } from '../api/discovery';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const ServerConnectionModal: React.FC<Props> = ({ isOpen, onClose, onConnected }) => {
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>(getSyncStatus());
  const [urlInput, setUrlInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);

  // Auto-Discovery Radar state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [discoveredServer, setDiscoveredServer] = useState<DiscoveredServer | null>(null);

  // Manual Sync trigger state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ ok: boolean; message: string; summary?: any } | null>(null);

  // Advanced settings toggle
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setUrlInput(getServerUrl() || 'http://192.168.178.57:8090');
    setTestResult(null);
    setDiscoveredServer(null);
    setScanStatus('');
    setSyncFeedback(null);

    const unsubscribe = subscribeSyncStatus((info) => {
      setSyncInfo(info);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await performBidirectionalSync(urlInput);
      setSyncFeedback(res);
      if (res.ok && onConnected) {
        onConnected();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestAndSave = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await checkServerConnection(urlInput);
    setIsTesting(false);
    setTestResult(res);

    if (res.ok) {
      setServerUrl(urlInput);
      setAppMode('server');
      await performBidirectionalSync(urlInput);
      if (onConnected) onConnected();
      setTimeout(() => {
        onClose();
      }, 900);
    }
  };

  const handleStartAutoDiscovery = async () => {
    setIsScanning(true);
    setDiscoveredServer(null);
    setScanStatus('Scanne WLAN-Subnetz nach FitPlaner Server...');

    try {
      const server = await discoverFitPlanerServer(urlInput, (status) => setScanStatus(status));
      if (server) {
        setDiscoveredServer(server);
        setUrlInput(server.url);
        setScanStatus(`✅ Gefunden: ${server.ip} (${server.responseTimeMs}ms)`);
      } else {
        setScanStatus('❌ Kein PC-Server im Subnetz gefunden. Läuft fitplaner auf dem PC?');
      }
    } catch {
      setScanStatus('Scan abgebrochen oder fehlgeschlagen.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleForceAutarkMode = () => {
    setAppMode('standalone');
    setSyncInfo((prev) => ({
      ...prev,
      state: 'autark',
      isAutark: true,
      message: 'Manueller Autark-Modus aktiviert',
    }));
    if (onConnected) onConnected();
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Noch nicht synchronisiert';
    const now = new Date();
    const diffSec = Math.round((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 10) return 'Gerade eben';
    if (diffSec < 60) return `Vor ${diffSec} Sekunden`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin === 1) return 'Vor 1 Minute';
    return `Vor ${diffMin} Minuten (${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="p-5 border-b-2 border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25">
              <CloudLightning className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Sync- & Verbindungs-Manager</h3>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                  P2P Mesh
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">Gleichberechtigter Abgleich: PC ⟷ Smartphone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* P2P Concept Diagram Card */}
          <div className="bg-slate-50 border-2 border-slate-200/90 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3 text-center">
              {/* PC Node */}
              <div className="flex-1 flex flex-col items-center p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <Monitor className="w-6 h-6 text-slate-700 mb-1" />
                <span className="text-xs font-black text-slate-800">PC / Desktop</span>
                <span className="text-[10px] text-slate-500 font-medium">Planung zu Hause</span>
              </div>

              {/* Sync Arrow Bridge */}
              <div className="flex flex-col items-center px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  syncInfo.state === 'synced'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : syncInfo.state === 'syncing'
                    ? 'bg-amber-100 text-amber-700 border border-amber-300 animate-spin'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  <RefreshCw className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 mt-1">
                  {syncInfo.state === 'synced' ? 'Synchron' : syncInfo.state === 'syncing' ? 'Sync...' : 'P2P Sync'}
                </span>
              </div>

              {/* Smartphone Node */}
              <div className="flex-1 flex flex-col items-center p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <Smartphone className="w-6 h-6 text-emerald-600 mb-1" />
                <span className="text-xs font-black text-slate-800">Smartphone</span>
                <span className="text-[10px] text-slate-500 font-medium">Unterwegs & Markt</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 mt-3 text-center font-medium leading-relaxed">
              PC und Smartphone sind gleichberechtigt. Alle Rezepte, Wochenpläne, Vorräte und abgehakten Einkäufe
              bleiben immer synchron.
            </p>
          </div>

          {/* Current Live State Banner */}
          <div
            className={`p-4 rounded-2xl border-2 transition-all ${
              syncInfo.state === 'synced'
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : syncInfo.state === 'syncing'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-blue-50/80 border-blue-300 text-blue-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {syncInfo.state === 'synced' ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : syncInfo.state === 'syncing' ? (
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 animate-spin">
                  <RefreshCw className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {syncInfo.state === 'synced'
                      ? '🟢 Verbunden & Synchron'
                      : syncInfo.state === 'syncing'
                      ? '🟡 Daten werden abgeglichen...'
                      : '📱 Autarker Modus aktiv (Unterwegs)'}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                    {syncInfo.state === 'synced' ? 'WLAN aktiv' : 'Offline bereit'}
                  </span>
                </div>

                <p className="text-xs font-semibold mt-1 leading-relaxed">
                  {syncInfo.state === 'synced'
                    ? `Heim-WLAN aktiv. Verbunden mit ${syncInfo.serverUrl || 'PC-Server'}. Letzter Abgleich: ${formatLastSync(syncInfo.lastSyncTime)}.`
                    : syncInfo.state === 'syncing'
                    ? 'Ermittle geänderte Daten und führe bidirektionalen Mesh-Abgleich aus...'
                    : 'Außerhalb des Heim-WLANs oder PC ausgeschaltet. Alle Eingaben, Pläne und Einkäufe werden autark auf dem Smartphone gesichert und beim nächsten WLAN-Kontakt automatisch abgeglichen.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Manual Sync Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronisiere jetzt...' : 'Jetzt manuell synchronisieren'}</span>
            </button>

            {syncFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  syncFeedback.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {syncFeedback.ok ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="flex-1">{syncFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Advanced / Connection Settings Collapsible */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings((v) => !v)}
              className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:bg-slate-100/80 transition"
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-600" />
                <span>Server- & Netzwerk-Einstellungen</span>
              </div>
              {showAdvancedSettings ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showAdvancedSettings && (
              <div className="p-4 pt-2 space-y-3.5 border-t border-slate-200 bg-white">
                {/* Auto-Discovery Button */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PC-Server im WLAN suchen</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      Ping Radar
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Findet den PC auch dann, wenn der Router (z.B. FRITZ!Box) dem PC eine neue IP vergeben hat.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartAutoDiscovery}
                    disabled={isScanning}
                    className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Search className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Scanne Subnetz...' : 'WLAN automatisch absuchen'}</span>
                  </button>

                  {scanStatus && (
                    <p className="text-[11px] font-medium text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      {scanStatus}
                    </p>
                  )}
                </div>

                {/* PC Host URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    PC-Server IP & Port
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="http://192.168.178.57:8090"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Server className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Fast Presets */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUrlInput('http://192.168.178.57:8090')}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition"
                  >
                    Dennis PC (192.168.178.57)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlInput('http://10.0.2.2:8090')}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition"
                  >
                    Emulator
                  </button>
                  <button
                    type="button"
                    onClick={handleForceAutarkMode}
                    className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[10px] font-bold text-blue-700 border border-blue-200 transition"
                  >
                    Autark erzwingen
                  </button>
                </div>

                {/* Connection Test Result */}
                {testResult && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      testResult.ok
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="flex-1">
                      {testResult.ok ? 'Erfolgreich verbunden! Gespeichert.' : `Fehler: ${testResult.message}`}
                    </span>
                  </div>
                )}

                {/* Save & Connect Button */}
                <button
                  type="button"
                  onClick={handleTestAndSave}
                  disabled={isTesting || !urlInput.trim()}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verbindung prüfen...</span>
                    </>
                  ) : (
                    <>
                      <span>Prüfen & Speichern</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t-2 border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Automatische Umschaltung aktiv</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

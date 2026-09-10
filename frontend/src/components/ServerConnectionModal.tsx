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
} from 'lucide-react';
import {
  getServerUrl,
  setServerUrl,
  checkServerConnection,
  getAppMode,
  setAppMode,
  syncDataWithServer,
  AppMode,
} from '../api/client';
import { discoverFitPlanerServer, DiscoveredServer } from '../api/discovery';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const ServerConnectionModal: React.FC<Props> = ({ isOpen, onClose, onConnected }) => {
  const [currentMode, setCurrentMode] = useState<AppMode>('server');
  const [urlInput, setUrlInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);

  // Auto-Discovery Radar state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [discoveredServer, setDiscoveredServer] = useState<DiscoveredServer | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentMode(getAppMode());
      setUrlInput(getServerUrl() || 'http://192.168.178.57:8090');
      setTestResult(null);
      setDiscoveredServer(null);
      setScanStatus('');
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitchMode = (mode: AppMode) => {
    setCurrentMode(mode);
    setAppMode(mode);
    if (onConnected) onConnected();
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
      if (onConnected) onConnected();
      setTimeout(() => onClose(), 800);
    }
  };

  const handleStartAutoDiscovery = async () => {
    setIsScanning(true);
    setDiscoveredServer(null);
    setScanStatus('Starte Ping-Suchverfahren im lokalen WLAN...');

    try {
      const server = await discoverFitPlanerServer(urlInput, (status) => setScanStatus(status));
      if (server) {
        setDiscoveredServer(server);
        setUrlInput(server.url);
        setScanStatus(`✅ Gefunden: ${server.ip} (${server.responseTimeMs}ms)`);
      } else {
        setScanStatus('❌ Kein aktiver FitPlaner Server gefunden. Läuft fitplaner auf dem PC?');
      }
    } catch {
      setScanStatus('Scan fehlgeschlagen.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSyncWithServer = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const res = await syncDataWithServer();
    setIsSyncing(false);
    setSyncResult(res);
    if (res.ok && onConnected) {
      onConnected();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Verbindungs-Manager</h3>
              <p className="text-xs text-slate-500 font-medium">Betriebsmodus & Server-Wahl</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Segment */}
        <div className="px-5 pt-4 pb-2">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleSwitchMode('server')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                currentMode === 'server'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>🏠 PC-Server</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('standalone')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                currentMode === 'standalone'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 Smartphone Autark</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {currentMode === 'standalone' ? (
            /* STANDALONE MODE EXPLANATION */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-xs text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>100% Autarker Smartphone-Betrieb</span>
                </div>
                <p className="leading-relaxed">
                  Die App läuft komplett unabhängig ohne PC-Server. Sämtliche Ernährungspläne, Vorratsdaten,
                  Einkaufslisten und digitale Supermarkt-Prospekte werden direkt im Telefonspeicher gesichert.
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CloudLightning className="w-4 h-4 text-amber-500" />
                  <span>Mit PC-Server abgleichen</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Falls du später Daten mit dem FitPlaner auf deinem Computer synchronisieren möchtest:
                </p>

                <button
                  type="button"
                  onClick={handleSyncWithServer}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Synchronisiere...' : 'Jetzt mit PC-Server abgleichen'}</span>
                </button>

                {syncResult && (
                  <p
                    className={`text-xs p-2.5 rounded-xl border ${
                      syncResult.ok
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {syncResult.message}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* PC SERVER MODE SETTINGS */
            <div className="space-y-4">
              {/* Radar Auto-Discovery Button */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-emerald-600" />
                    <span>DHCP / IP Auto-Discovery</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    WLAN Ping
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  PC-IP hat sich geändert? FitPlaner sucht das gesamte Subnetz nach dem Server ab.
                </p>
                <button
                  type="button"
                  onClick={handleStartAutoDiscovery}
                  disabled={isScanning}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <Search className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanne Subnetz...' : 'Server im WLAN automatisch suchen'}</span>
                </button>

                {scanStatus && (
                  <p className="text-[11px] font-medium text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                    {scanStatus}
                  </p>
                )}
              </div>

              {/* Manual Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Server-Adresse (PC IP + Port)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="http://192.168.178.57:8090"
                    className="w-full pl-3.5 pr-10 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                  <Server className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUrlInput('http://192.168.178.57:8090')}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 text-center transition"
                >
                  Dennis PC (192.168.178.57)
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInput('http://10.0.2.2:8090')}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 text-center transition"
                >
                  Emulator (10.0.2.2)
                </button>
              </div>

              {/* Test Status Banner */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
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
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-2">
          {currentMode === 'server' ? (
            <button
              type="button"
              onClick={handleTestAndSave}
              disabled={isTesting || !urlInput.trim()}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verbindung wird geprüft...</span>
                </>
              ) : (
                <>
                  <span>Verbinden & Speichern</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <span>Autarken Modus beibehalten</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

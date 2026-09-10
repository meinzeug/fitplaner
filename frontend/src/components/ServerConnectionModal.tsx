import React, { useState, useEffect } from 'react';
import { Server, Wifi, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight, Laptop, Smartphone } from 'lucide-react';
import { getServerUrl, setServerUrl, checkServerConnection, isCapacitorNative } from '../api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const ServerConnectionModal: React.FC<Props> = ({ isOpen, onClose, onConnected }) => {
  const [urlInput, setUrlInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getServerUrl() || 'http://192.168.178.57:8090');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await checkServerConnection(urlInput);
    setIsTesting(false);
    setTestResult(res);

    if (res.ok) {
      setServerUrl(urlInput);
      if (onConnected) {
        onConnected();
      }
      setTimeout(() => {
        onClose();
      }, 900);
    }
  };

  const handleSetDefaultLan = () => {
    setUrlInput('http://192.168.178.57:8090');
    setTestResult(null);
  };

  const handleSetLocalhost = () => {
    setUrlInput('http://10.0.2.2:8090');
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Server-Verbindung</h3>
              <p className="text-xs text-slate-500 font-medium">FitPlaner PC im Heimnetzwerk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span>Gleiches WLAN erforderlich</span>
            </div>
            <p>
              Stelle sicher, dass dein Smartphone im selben WLAN wie der FitPlaner Linux-PC angemeldet ist.
            </p>
          </div>

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

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSetDefaultLan}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 text-center transition"
            >
              PC (192.168.178.57)
            </button>
            <button
              type="button"
              onClick={handleSetLocalhost}
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
                {testResult.ok ? 'Erfolgreich verbunden! Speichern...' : `Fehler: ${testResult.message}`}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-2">
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
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { MeshStatusResponse, MeshSyncPacket, InstallerInfoResponse, PairedDevice } from '../types';
import {
  Wifi,
  Bluetooth,
  Globe,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Radio,
  Download,
  Share2,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalMeshSyncModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [meshStatus, setMeshStatus] = useState<MeshStatusResponse | null>(null);
  const [installerInfo, setInstallerInfo] = useState<InstallerInfoResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [bluetoothStatus, setBluetoothStatus] = useState<'idle' | 'scanning' | 'connected' | 'unsupported'>('idle');

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/sync/mesh-status');
      if (res.ok) {
        const data = await res.json();
        setMeshStatus(data);
      }
      const instRes = await fetch('/api/installer/info');
      if (instRes.ok) {
        const instData = await instRes.json();
        setInstallerInfo(instData);
      }
    } catch (err) {
      console.error('Failed to fetch mesh status:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setSyncFeedback(null);
    }
  }, [isOpen]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      // 1. Pull snapshot
      const pullRes = await fetch('/api/sync/mesh-pull');
      if (pullRes.ok) {
        const packet: MeshSyncPacket = await pullRes.json();
        // 2. Push merged snapshot
        const pushRes = await fetch('/api/sync/mesh-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packet)
        });
        if (pushRes.ok) {
          const result = await pushRes.json();
          setSyncFeedback(`✅ Erfolgreich synchronisiert! (${result.sync_time})`);
          await fetchStatus();
        }
      }
    } catch (err) {
      setSyncFeedback('Fehler bei der Synchronisation.');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBluetoothPairing = async () => {
    // Check Web Bluetooth API support
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      setBluetoothStatus('scanning');
      try {
        // @ts-ignore
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service']
        });
        setBluetoothStatus('connected');
        setSyncFeedback(`🔵 Bluetooth-Gerät "${device.name || 'Familien-Handy'}" gekoppelt!`);
      } catch (err: any) {
        console.warn('Bluetooth pairing cancelled or failed:', err);
        setBluetoothStatus('idle');
      }
    } else {
      setBluetoothStatus('unsupported');
      setSyncFeedback('Bluetooth LE ist auf diesem Browser aktiv über die Android APK verfügbar.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col justify-between">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xl">
              <Radio className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1 text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-1">
                <span>Halb-Autarke P2P-Technologie</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                WLAN & Bluetooth Peer-Sync
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Autarkie Erklärung */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Autarkie im Haushalt (Keine Cloud, Keine Konten)</span>
            </div>
            <p>
              Alle Einkaufslisten, Küchen-Ämtli, Brotdosen-Häkchen und Vital-Punkte synchronisieren sich direkt zwischen den Smartphones eurer Familie im <strong>lokalen WLAN</strong> oder über <strong>Bluetooth LE</strong>.
            </p>
            <p className="text-[11px] text-slate-500">
              🌐 <em>Internet wird nur für das Laden wöchentlicher Supermarkt-Prospekte & Rabatte benötigt.</em>
            </p>
          </div>

          {/* 3 Status Cards (WLAN, Bluetooth, Prospekt-Internet) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* WLAN */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-emerald-800 font-extrabold text-xs mb-1">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Heim-WLAN</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="text-sm font-black text-slate-900">
                  {meshStatus?.local_ip || '192.168.x.x'}
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-2">
                LAN-Mesh aktiv
              </span>
            </div>

            {/* Bluetooth LE */}
            <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-blue-800 font-extrabold text-xs mb-1">
                  <span className="flex items-center gap-1">
                    <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bluetooth LE</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div className="text-sm font-black text-slate-900">
                  Direkt-Mesh
                </div>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold mt-2">
                Nahbereich (&lt; 10m)
              </span>
            </div>

            {/* Prospekt-Internet */}
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-amber-900 font-extrabold text-xs mb-1">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-amber-600" />
                    <span>Prospekte</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-sm font-black text-slate-900">
                  {meshStatus?.is_internet_available ? 'Online-Radar' : 'Offline-Modus'}
                </div>
              </div>
              <span className="text-[10px] text-amber-800 font-semibold mt-2">
                Prospekte aktuell
              </span>
            </div>
          </div>

          {/* Sync Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>🔄 Jetzt WLAN-Mesh synchronisieren</span>
            </button>

            <button
              onClick={handleBluetoothPairing}
              disabled={bluetoothStatus === 'scanning'}
              className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Bluetooth className="w-4 h-4 text-blue-400" />
              <span>
                {bluetoothStatus === 'scanning' ? 'Suche Bluetooth...' : '🔵 Bluetooth-Peer verbinden'}
              </span>
            </button>
          </div>

          {/* Feedback message */}
          {syncFeedback && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Gekoppelte Familien-Smartphones */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Verbundene Familien-Geräte im Haus:
            </span>
            <div className="space-y-2">
              {installerInfo?.paired_devices && installerInfo.paired_devices.length > 0 ? (
                installerInfo.paired_devices.map((dev: PairedDevice) => (
                  <div
                    key={dev.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-slate-800 block">{dev.name}</span>
                        <span className="text-slate-400 text-[11px]">{dev.model} • {dev.ip_address}</span>
                      </div>
                    </div>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg font-bold">
                      Synchronisiert
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-500">
                  Bisher 1 Hauptgerät aktiv. Weitere Handys können via QR-Code oder APK beitreten!
                </div>
              )}
            </div>
          </div>

          {/* QR-Code Pairing Option */}
          {installerInfo?.qr_code_svg && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
              <div
                className="w-24 h-24 bg-white p-2 rounded-xl shadow-xs shrink-0"
                dangerouslySetInnerHTML={{ __html: installerInfo.qr_code_svg }}
              />
              <div className="text-xs space-y-1">
                <span className="font-extrabold text-slate-900 block">
                  Neues Familien-Handy im WLAN anlernen:
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Scanne diesen QR-Code mit der Kamera eines anderen Smartphones im selben WLAN, um die FitPlaner APK herunterzuladen oder die Geräte sofort autark zu koppeln.
                </p>
                <div className="pt-1">
                  <a
                    href="/FitPlaner.apk"
                    download="FitPlaner.apk"
                    className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>FitPlaner.apk direkt herunterladen</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};

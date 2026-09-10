import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import {
  Smartphone, QrCode, Wifi, Download, CheckCircle2, ShieldCheck,
  RefreshCw, Trash2, X, ExternalLink, Laptop, ArrowRight, Share2, Plus,
  Radio, Compass, Check
} from 'lucide-react';

interface PairedDevice {
  id: string;
  name: string;
  model: string;
  ip_address: string;
  connected_at: string;
  last_sync: string;
  is_online: boolean;
  assigned_member_id?: string;
}

interface DiscoveredDevice {
  ip_address: string;
  mac_address?: string;
  device_name: string;
  device_type: string;
  last_seen: string;
  is_paired: boolean;
  signal_strength: string;
  discovery_method: string;
}

interface InstallerInfo {
  lan_ip: string;
  port: number;
  apk_available: boolean;
  apk_download_url: string;
  apk_file_size_mb?: number;
  pairing_url: string;
  qr_code_svg: string;
  qr_code_pairing_svg: string;
  paired_devices: PairedDevice[];
}

interface Props {
  onClose: () => void;
}

export const DeviceInstallerModal: React.FC<Props> = ({ onClose }) => {
  const [info, setInfo] = useState<InstallerInfo | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'download' | 'radar' | 'devices'>('download');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceModel, setNewDeviceModel] = useState('Samsung / Pixel');

  const fetchInstallerInfo = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/installer/info');
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanNetwork = async () => {
    setIsScanning(true);
    try {
      // 1. Send UDP broadcast ping
      await apiFetch('/api/discovery/broadcast', { method: 'POST' });
      // 2. Query discovered devices
      const res = await apiFetch('/api/discovery/scan');
      if (res.ok) {
        const data = await res.json();
        setDiscoveredDevices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchInstallerInfo();
    handleScanNetwork();
  }, []);

  const handleCopyUrl = async () => {
    if (info?.apk_download_url) {
      await navigator.clipboard.writeText(info.apk_download_url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePairDiscovered = async (dev: DiscoveredDevice) => {
    try {
      await apiFetch('/api/installer/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: `dev-${dev.ip_address.replace(/\./g, '-')}`,
          device_name: dev.device_name,
          device_model: dev.device_type,
        }),
      });
      await fetchInstallerInfo();
      await handleScanNetwork();
      setActiveSubTab('devices');
    } catch (e) {
      console.error(e);
    }
  };

  const handlePairSimulatedDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    try {
      await apiFetch('/api/installer/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: `dev-${Date.now()}`,
          device_name: newDeviceName.trim(),
          device_model: newDeviceModel,
        }),
      });
      setNewDeviceName('');
      await fetchInstallerInfo();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveDevice = async (id: string) => {
    try {
      await apiFetch(`/api/installer/devices/${id}`, { method: 'DELETE' });
      await fetchInstallerInfo();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-white">
                Web-Installer & WLAN-Kopplung
              </h2>
              <span className="text-xs text-slate-400 block">
                Automatische Geräte-Erkennung durch WLAN-Pings & APK-Download
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center border-b border-slate-100 bg-slate-50 px-6 py-2 shrink-0 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('download')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'download'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>1. APK QR-Code</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('radar');
              handleScanNetwork();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'radar'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>2. WLAN-Ping Radar</span>
            {discoveredDevices.length > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">
                {discoveredDevices.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('devices')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'devices'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wifi className="w-4 h-4 text-emerald-600" />
            <span>3. Verbundene Handys ({info?.paired_devices.length || 0})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
              <span>Lade Netzwerk- & APK-Daten...</span>
            </div>
          ) : activeSubTab === 'download' ? (
            /* TAB 1: APK DOWNLOAD */
            <div className="space-y-6">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center shrink-0">
                  {info?.qr_code_svg ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: info.qr_code_svg }}
                      className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    />
                  ) : (
                    <QrCode className="w-20 h-20 text-slate-300" />
                  )}
                </div>

                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>WLAN-Server: {info?.lan_ip}:8090</span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900">
                    Handy-Kamera draufhalten & APK installieren
                  </h3>

                  <p className="text-xs text-slate-600">
                    Kamera-App am Smartphone öffnen und auf den QR-Code richten. Die APK lädt direkt im heimischen WLAN herunter.
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    <a
                      href="/FitPlaner.apk"
                      download="FitPlaner.apk"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>APK herunterladen {info?.apk_file_size_mb ? `(${info.apk_file_size_mb} MB)` : ''}</span>
                    </a>

                    <button
                      onClick={handleCopyUrl}
                      className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{copiedLink ? 'Kopiert! ✅' : 'Link kopieren'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3-Schritte Anleitung */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>3-Schritte Installations-Anleitung für Android:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[11px] mb-1">
                      1
                    </span>
                    <strong className="block text-slate-800">QR-Code scannen</strong>
                    <p className="text-slate-500 text-[11px]">
                      Kamera-App öffnen und auf den Code halten.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[11px] mb-1">
                      2
                    </span>
                    <strong className="block text-slate-800">APK herunterladen</strong>
                    <p className="text-slate-500 text-[11px]">
                      Auf „Herunterladen“ tippen und Datei öffnen.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[11px] mb-1">
                      3
                    </span>
                    <strong className="block text-slate-800">Installieren</strong>
                    <p className="text-slate-500 text-[11px]">
                      „Aus dieser Quelle zulassen“ bestätigen – fertig!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeSubTab === 'radar' ? (
            /* TAB 2: WLAN PING RADAR */
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1.5 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold border border-emerald-500/30">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>UDP Broadcast & Subnet-Ping aktiv</span>
                    </div>
                    <h3 className="text-lg font-black text-white">
                      Automatische Geräte-Erkennung im WLAN
                    </h3>
                    <p className="text-xs text-slate-300 max-w-md">
                      Durch allgemeine UDP-Pings und ARP-Scans erkennen sich PC und Smartphones im heimischen Netzwerk vollautomatisch ohne manuelle Konfiguration.
                    </p>
                  </div>

                  <button
                    onClick={handleScanNetwork}
                    disabled={isScanning}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Pinge Netzwerk...' : 'Netzwerk anpingen'}</span>
                  </button>
                </div>
              </div>

              {/* Discovered Devices List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Erkannte Geräte im WLAN ({discoveredDevices.length})
                </h4>

                <div className="space-y-2.5">
                  {discoveredDevices.map((dev, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between hover:border-emerald-300 transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">{dev.device_name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              {dev.signal_strength}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                            <span>IP: {dev.ip_address}</span>
                            <span>•</span>
                            <span className="text-slate-500 font-semibold">{dev.discovery_method}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePairDiscovered(dev)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Koppeln</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 3: PAIRED DEVICES */
            <div className="space-y-6">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Verbundene Haushalts-Smartphones
                </h3>
                <p className="text-xs text-slate-500">
                  Gekoppelte Handys gleichen Vorräte, Mahlzeiten und Einkaufslisten automatisch ab, sobald sie sich im WLAN befinden.
                </p>
              </div>

              <div className="space-y-2.5">
                {info?.paired_devices && info.paired_devices.length > 0 ? (
                  info.paired_devices.map((dev) => (
                    <div
                      key={dev.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-800">{dev.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              WLAN Verbunden
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {dev.model} • IP: {dev.ip_address} • Letzter Sync: {dev.last_sync}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveDevice(dev.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Smartphone trennen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Noch keine Smartphones gekoppelt. Nutze das WLAN-Ping Radar, um Geräte automatisch zu verbinden!
                  </div>
                )}
              </div>

              {/* Manuell Gerät hinzufügen */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Weiteres Smartphone manuell eintragen:
                </h4>
                <form onSubmit={handlePairSimulatedDevice} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Name (z. B. Sarah's Pixel 8)..."
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Hinzufügen</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

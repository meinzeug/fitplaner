import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PublicMemberInfo, PairingInfoResponse } from '../types';
import {
  fetchPairingInfoApi,
  adminResetMemberPasswordApi,
  getHouseholdPasskey,
} from '../api/client';
import {
  Shield,
  KeyRound,
  QrCode,
  Smartphone,
  Copy,
  Check,
  X,
  Lock,
  UserCheck,
  RefreshCw,
  Server,
  AlertTriangle,
} from 'lucide-react';

interface HouseholdSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HouseholdSecurityModal: React.FC<HouseholdSecurityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { household, publicMembers, refreshPublicMembers } = useAuth();
  const [pairingInfo, setPairingInfo] = useState<PairingInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Selected member for PIN/Password reset
  const [selectedMember, setSelectedMember] = useState<PublicMemberInfo | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'adult' | 'kid'>('adult');
  const [isResetting, setIsResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPairingData();
    }
  }, [isOpen]);

  const loadPairingData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPairingInfoApi();
      setPairingInfo(data);
    } catch (err) {
      console.warn('Could not load pairing info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentPasskey =
    pairingInfo?.household_passkey || household?.household_passkey || getHouseholdPasskey() || 'FP-FITP-2026';

  const copyPasskey = () => {
    navigator.clipboard.writeText(currentPasskey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleOpenReset = (member: PublicMemberInfo) => {
    setSelectedMember(member);
    setNewPassword('');
    setNewPin('');
    setNewRole(member.role);
    setStatusMessage(null);
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsResetting(true);
    setStatusMessage(null);
    try {
      await adminResetMemberPasswordApi({
        member_id: selectedMember.id,
        new_password: newPassword.trim() || undefined,
        new_pin: newPin.trim() || undefined,
        new_role: newRole,
      });
      setStatusMessage(`✅ Zugangsdaten für ${selectedMember.name} erfolgreich aktualisiert.`);
      await refreshPublicMembers();
      setTimeout(() => setSelectedMember(null), 1500);
    } catch (err: any) {
      setStatusMessage(`❌ Fehler: ${err?.message || 'Konnte nicht gespeichert werden'}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Haushalts-Sicherheit & Geräte-Kopplung</h2>
              <p className="text-xs text-slate-400">
                Administrator-Bereich • {household?.name || 'Familiennetzwerk'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Household Security Key & Pairing QR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left: Passkey details */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Haushalts-Passkey</span>
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono font-black text-lg text-emerald-400 tracking-wider">
                  {currentPasskey}
                </div>
                <button
                  type="button"
                  onClick={copyPasskey}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center space-x-1.5 border border-slate-700"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? 'Kopiert' : 'Kopieren'}</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 leading-relaxed space-y-2">
              <div className="flex items-start space-x-2 text-emerald-400 font-semibold">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <span>WLAN-Schutz aktiv:</span>
              </div>
              <p>
                Nur Geräte mit diesem Passkey können auf den Server und die Familiendaten zugreifen. Gäste im WLAN werden automatisch mit HTTP 401 Unauthorized abgewiesen.
              </p>
            </div>
          </div>

          {/* Right: QR Code */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            {pairingInfo?.pairing_qr && !pairingInfo.pairing_qr.includes('placeholder') ? (
              <div className="p-3 bg-white rounded-2xl shadow-xl mb-3">
                <img
                  src={pairingInfo.pairing_qr}
                  alt="Haushalts-Kopplungs-QR-Code"
                  className="w-36 h-36 object-contain"
                />
              </div>
            ) : (
              <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col items-center justify-center mb-3 p-3 text-center shadow-inner">
                <QrCode className="w-12 h-12 text-emerald-400 mb-1.5" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Passkey</span>
                <span className="text-xs font-mono font-black text-emerald-300 tracking-wider">{currentPasskey}</span>
              </div>
            )}
            <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mit FitPlaner Smartphone APK scannen</span>
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Koppelt neue Handys automatisch in Sekundenschnelle
            </span>
          </div>
        </div>

        {/* Section 2: Member Access & Password/PIN Resets */}
        <div className="border-t border-slate-800 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Familienmitglieder-Zugänge</h3>
              <p className="text-xs text-slate-400">Rollen, Passwörter und Kinder-PINs verwalten</p>
            </div>
            <button
              onClick={refreshPublicMembers}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {publicMembers.map((member) => (
              <div
                key={member.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-200">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-sm text-white">{member.name}</span>
                      {member.is_admin && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {member.role === 'kid' ? '🧒 4-stelliger PIN' : '🧑 Passwort'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenReset(member)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                >
                  Ändern
                </button>
              </div>
            ))}
          </div>

          {/* Reset Modal / Form inside */}
          {selectedMember && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 animate-fade-in mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>Zugang für {selectedMember.name} bearbeiten</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Abbrechen
                </button>
              </div>

              {statusMessage && (
                <div className="mb-3 text-xs font-semibold p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                  {statusMessage}
                </div>
              )}

              <form onSubmit={submitReset} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Rolle</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    >
                      <option value="adult">🧑 Erwachsener (Vollzugriff)</option>
                      <option value="kid">🧒 Kind (Eingeschränkt / PIN)</option>
                      <option value="admin">👑 Administrator</option>
                    </select>
                  </div>

                  {newRole === 'kid' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Neuer Kinder-PIN (4 Ziffern)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="z.B. 1234"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Neues Passwort</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Neues Passwort eingeben"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {isResetting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Änderungen speichern</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Section 3: Paired Devices */}
        {pairingInfo?.paired_devices && pairingInfo.paired_devices.length > 0 && (
          <div className="border-t border-slate-800 pt-6 mt-4">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center space-x-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Verbundene Familien-Geräte ({pairingInfo.paired_devices.length})</span>
            </h3>
            <div className="space-y-2">
              {pairingInfo.paired_devices.map((device, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="font-bold text-white block">{device.device_name || 'Gerät'}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ID: {device.device_id.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium text-[11px] border border-emerald-500/20">
                    Autorisiert
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

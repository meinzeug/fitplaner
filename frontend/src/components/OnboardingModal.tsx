import React, { useState } from 'react';
import {
  setAppMode,
  setServerUrl,
  checkServerConnection,
  AppMode,
  getHouseholdPasskey,
} from '../api/client';
import { discoverFitPlanerServer, DiscoveredServer } from '../api/discovery';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Shield,
  KeyRound,
  QrCode,
  Smartphone,
  PlusCircle,
  Link,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { createHousehold, joinHousehold, login } = useAuth();

  // Mode: null (choice), 'create' (Option A), 'join' (Option B)
  const [onboardingPath, setOnboardingPath] = useState<'create' | 'join' | null>(null);
  const [step, setStep] = useState<number>(1);

  // Path A: Neue Familie gründen
  const [familyName, setFamilyName] = useState('Familie Schmidt');
  const [adminName, setAdminName] = useState('Dennis');
  const [adminUsername, setAdminUsername] = useState('dennis');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [createdPasskey, setCreatedPasskey] = useState<string | null>(null);
  const [createdQr, setCreatedQr] = useState<string | null>(null);
  const [copiedPasskey, setCopiedPasskey] = useState(false);

  // Demographics for Admin
  const [age, setAge] = useState('32');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = useState('184');
  const [weightKg, setWeightKg] = useState('85');
  const [goal, setGoal] = useState<'maintain' | 'lose_weight' | 'gain_muscle'>('maintain');
  const [dietaryPref, setDietaryPref] = useState('all');

  // Path B: Bestehender Familie beitreten
  const [serverIp, setServerIp] = useState('192.168.178.57');
  const [joinPasskey, setJoinPasskey] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [joinMembers, setJoinMembers] = useState<any[]>([]);
  const [selectedJoinMember, setSelectedJoinMember] = useState<any | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinPin, setJoinPin] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Option A Submit: Neue Familie anlegen
  const handleCreateHouseholdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const deviceId =
        typeof window !== 'undefined'
          ? localStorage.getItem('fitplaner_node_device_id') || `node_${Date.now()}`
          : 'pc-node-1';
      const deviceName =
        typeof window !== 'undefined' && window.innerWidth >= 1024
          ? 'PC (Admin-Zentrale)'
          : 'Smartphone (Admin)';

      const res = await createHousehold({
        family_name: familyName,
        admin_name: adminName,
        username: adminUsername,
        password: adminPassword,
        pin: adminPin.trim() || undefined,
        device_id: deviceId,
        device_name: deviceName,
        demographics: {
          gender,
          age: parseInt(age, 10) || 32,
          height_cm: parseFloat(heightCm) || 184,
          weight_kg: parseFloat(weightKg) || 85,
          goal,
          dietary_preference: dietaryPref,
        },
      });

      setCreatedPasskey(res.household_passkey || res.household?.household_passkey);
      setCreatedQr(res.pairing_qr);
      setStep(2); // Show confirmation with Passkey & QR
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Erstellen der Familie');
    } finally {
      setIsLoading(false);
    }
  };

  // Option B Server Scan
  const handleAutoDiscover = async () => {
    setIsScanning(true);
    setScanMessage('Suche PC-Server im WLAN...');
    try {
      const discovered = await discoverFitPlanerServer(
        serverIp ? `http://${serverIp}:8090` : undefined,
        (msg) => setScanMessage(msg)
      );
      if (discovered) {
        setServerIp(discovered.ip);
        setScanMessage(`✅ Server gefunden: ${discovered.ip}`);
      } else {
        setScanMessage('❌ Kein PC-Server gefunden. Bitte IP manuell prüfen.');
      }
    } catch {
      setScanMessage('Scan fehlgeschlagen');
    } finally {
      setIsScanning(false);
    }
  };

  // Option B Join Check
  const handleValidateJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const finalUrl = `http://${serverIp.trim()}:8090`;
      setServerUrl(finalUrl);
      setAppMode('server');

      const deviceId =
        typeof window !== 'undefined'
          ? localStorage.getItem('fitplaner_node_device_id') || `phone_${Date.now()}`
          : 'phone-node-1';
      const deviceName =
        typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'Laptop / PC' : 'Smartphone';

      const res = await joinHousehold({
        household_passkey: joinPasskey.trim().toUpperCase(),
        username: 'pending_login',
        device_id: deviceId,
        device_name: deviceName,
      });

      if (res.members && res.members.length > 0) {
        setJoinMembers(res.members);
        setStep(2); // Go to member select & login
      } else {
        setError('Haushalt verbunden, aber keine Profile gefunden.');
      }
    } catch (err: any) {
      setError(err?.message || 'Haushalt-Passkey ungültig oder Host nicht erreichbar.');
    } finally {
      setIsLoading(false);
    }
  };

  // Option B Login Submit
  const handleJoinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJoinMember) return;
    setIsLoading(true);
    setError(null);
    try {
      await login(selectedJoinMember.username, joinPassword || undefined, joinPin || undefined);
      handleFinish();
    } catch (err: any) {
      setError(err?.message || 'Falsches Passwort oder ungültige PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('fitplaner_onboarded', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🥗</span>
            <div>
              <h2 className="font-black text-lg text-white">FitPlaner Einrichtung</h2>
              <p className="text-xs text-slate-400">Rollen- & Haushalts-Sicherheitssystem</p>
            </div>
          </div>
          {onboardingPath && (
            <button
              onClick={() => {
                setOnboardingPath(null);
                setStep(1);
                setError(null);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Zurück</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-semibold flex items-center space-x-2">
            <Shield className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 0: Choice (Option A or Option B) */}
        {!onboardingPath && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-1.5">Willkommen bei FitPlaner</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Wähle aus, wie dieses Gerät eingerichtet werden soll. Alle Familienmitglieder erhalten einen eigenen, geschützten Login.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Neue Familie gründen */}
              <button
                type="button"
                onClick={() => {
                  setOnboardingPath('create');
                  setStep(1);
                }}
                className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-400 transition-all text-left flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-base mb-1">Neue Familie gründen</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Erstelle einen neuen Haushalt. Du wirst der Administrator mit vollen Rechten für Mitglieder, Passwörter und Budgets.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-emerald-400 space-x-1">
                  <span>Familie erstellen</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option B: Bestehender Familie beitreten */}
              <button
                type="button"
                onClick={() => {
                  setOnboardingPath('join');
                  setStep(1);
                }}
                className="p-5 rounded-2xl border border-teal-500/30 bg-teal-950/10 hover:bg-teal-950/30 hover:border-teal-400 transition-all text-left flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 transition-transform">
                    <Link className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-base mb-1">Familie beitreten</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Verbinde dieses Gerät mit einer bereits vorhandenen Familie im WLAN. Erfordert den Haushalts-Passkey oder QR-Code.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-teal-400 space-x-1">
                  <span>Gerät koppeln</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PATH A: NEUE FAMILIE GRÜNDEN */}
        {onboardingPath === 'create' && step === 1 && (
          <form onSubmit={handleCreateHouseholdSubmit} className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Familie & Administrator einrichten</h3>
              <p className="text-xs text-slate-400">Erstelle den Hauptzugang für deine Familie</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Name der Familie</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="z.B. Familie Schmidt"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Dein Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="z.B. Dennis"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Benutzername (Login)</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="z.B. dennis"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm lowercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Administrator-Passwort</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Quick Demographics */}
            <div className="border-t border-slate-800 pt-3">
              <label className="block text-xs font-bold text-slate-300 mb-2">Deine Basis-Ernährungsdaten</label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Alter</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Größe (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Gewicht (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Ziel</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                  >
                    <option value="maintain">Halten</option>
                    <option value="lose_weight">Abnehmen</option>
                    <option value="gain_muscle">Muskeln</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !adminPassword}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Haushalt anlegen & Passkey generieren</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* PATH A STEP 2: PASSKEY & QR CONFIRMATION */}
        {onboardingPath === 'create' && step === 2 && (
          <div className="space-y-5 animate-fade-in text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-1">Familie erfolgreich gegründet!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Hier ist dein Haushalts-Sicherheitsschlüssel. Verwende ihn, um die FitPlaner APK auf den Smartphones deiner Familienmitglieder sicher im WLAN zu koppeln.
              </p>
            </div>

            {/* Passkey card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between max-w-sm mx-auto">
              <div className="font-mono text-xl font-black text-emerald-400 tracking-wider">
                {createdPasskey || 'FP-FITP-2026'}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (createdPasskey) navigator.clipboard.writeText(createdPasskey);
                  setCopiedPasskey(true);
                  setTimeout(() => setCopiedPasskey(false), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center space-x-1.5 transition-colors"
              >
                {copiedPasskey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPasskey ? 'Kopiert' : 'Kopieren'}</span>
              </button>
            </div>

            {/* QR Code */}
            {createdQr && (
              <div className="p-4 bg-white rounded-2xl shadow-xl inline-block mx-auto">
                <img src={createdQr} alt="Pairing QR Code" className="w-40 h-40 object-contain" />
              </div>
            )}

            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Gastgeräte im WLAN ohne diesen Schlüssel haben keinen Zugriff.
            </p>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg transition-all text-sm mt-4"
            >
              Haushalt betreten & loslegen
            </button>
          </div>
        )}

        {/* PATH B: BESTEHENDER FAMILIE BEITRETEN */}
        {onboardingPath === 'join' && step === 1 && (
          <form onSubmit={handleValidateJoin} className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Familien-Host im WLAN verbinden</h3>
              <p className="text-xs text-slate-400">
                Gib den Haushalts-Passkey ein oder scanne den QR-Code vom Admin-Gerät
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Haushalts-Sicherheitsschlüssel (Passkey)</span>
              </label>
              <input
                type="text"
                value={joinPasskey}
                onChange={(e) => setJoinPasskey(e.target.value.toUpperCase())}
                placeholder="FP-XXXX-XXXX"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold text-base tracking-wider focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">PC-Server IP im WLAN</label>
                <button
                  type="button"
                  onClick={handleAutoDiscover}
                  disabled={isScanning}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>WLAN scannen</span>
                </button>
              </div>
              <input
                type="text"
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
                placeholder="192.168.178.57"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                required
              />
              {scanMessage && <p className="text-[11px] text-slate-400 mt-1">{scanMessage}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !joinPasskey}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Verbindung prüfen & Profile abrufen</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* PATH B STEP 2: MEMBER SELECT & LOGIN */}
        {onboardingPath === 'join' && step === 2 && (
          <form onSubmit={handleJoinLogin} className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Wer bist du?</h3>
              <p className="text-xs text-slate-400">Wähle dein Profil und gib dein Passwort oder PIN ein</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {joinMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedJoinMember(member)}
                  className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center space-y-1.5 ${
                    selectedJoinMember?.id === member.id
                      ? 'border-emerald-500 bg-emerald-950/30'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-200">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-bold text-xs text-white">{member.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {member.role === 'admin' ? '👑 Admin' : member.role === 'kid' ? '🧒 Kind' : '🧑 Erwachsener'}
                  </span>
                </button>
              ))}
            </div>

            {selectedJoinMember && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                {selectedJoinMember.role === 'kid' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">4-stelliger Kinder-PIN</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={joinPin}
                      onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="z.B. 1234"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Passwort</label>
                    <input
                      type="password"
                      value={joinPassword}
                      onChange={(e) => setJoinPassword(e.target.value)}
                      placeholder="Passwort eingeben"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !selectedJoinMember}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Anmelden & Daten synchronisieren</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

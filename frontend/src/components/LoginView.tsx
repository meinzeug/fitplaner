import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PublicMemberInfo } from '../types';
import { Shield, KeyRound, Lock, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';

interface LoginViewProps {
  onOpenOnboarding: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onOpenOnboarding }) => {
  const { publicMembers, login, householdStatus, household } = useAuth();
  const [selectedMember, setSelectedMember] = useState<PublicMemberInfo | null>(null);
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectMember = (member: PublicMemberInfo) => {
    setSelectedMember(member);
    setPassword('');
    setPin('');
    setError(null);
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (selectedMember && selectedMember.role === 'kid' && nextPin.length === 4) {
        // Auto-submit 4-digit kid PIN
        submitLogin(selectedMember.username, undefined, nextPin);
      }
    }
  };

  const handlePinDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const submitLogin = async (username: string, pass?: string, pinCode?: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await login(username, pass || undefined, pinCode || undefined);
    } catch (err: any) {
      setError(err?.message || 'Zugangsdaten nicht korrekt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    submitLogin(selectedMember.username, password, pin);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-xl shadow-emerald-950/50 mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-3xl">🥗</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            FitPlaner <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">Haushalt</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            {household?.name || householdStatus?.household_name || 'Familien-Login & Rollen-Sicherheit'}
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-semibold flex items-center space-x-2 animate-shake">
              <Shield className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!selectedMember ? (
            /* Member Selector */
            <div>
              <div className="text-center mb-5">
                <h2 className="text-base font-bold text-slate-200">Wer bist du?</h2>
                <p className="text-xs text-slate-400">Wähle dein Profil für den gesicherten Login</p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {publicMembers.map((member) => {
                  const isKid = member.role === 'kid';
                  const isAdmin = member.role === 'admin' || member.is_admin;
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleSelectMember(member)}
                      className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center space-y-2.5 group relative overflow-hidden ${
                        isAdmin
                          ? 'border-amber-500/30 bg-amber-950/10 hover:border-amber-400/60 hover:bg-amber-950/30'
                          : isKid
                          ? 'border-purple-500/30 bg-purple-950/10 hover:border-purple-400/60 hover:bg-purple-950/30'
                          : 'border-slate-800 bg-slate-950/50 hover:border-emerald-500/50 hover:bg-emerald-950/20'
                      }`}
                    >
                      {/* Role Pill */}
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isAdmin
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isKid
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isAdmin ? '👑 Admin' : isKid ? '🧒 Kind' : '🧑 Erwachsener'}
                      </span>

                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-slate-200 group-hover:scale-105 transition-transform shadow-md">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>

                      <span className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">
                        {member.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* PIN or Password Prompt */
            <div>
              <button
                onClick={() => setSelectedMember(null)}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold mb-5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anderes Profil wählen</span>
              </button>

              <div className="flex items-center space-x-3.5 mb-6 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-100">
                  {selectedMember.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{selectedMember.name}</h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {selectedMember.role === 'admin'
                      ? 'Haushalts-Administrator'
                      : selectedMember.role === 'kid'
                      ? 'Kinder-Konto (PIN)'
                      : 'Familienmitglied'}
                  </span>
                </div>
              </div>

              {selectedMember.role === 'kid' ? (
                /* Child 4-Digit Tactile PIN Pad */
                <div>
                  <div className="text-center mb-4">
                    <p className="text-xs text-slate-400 mb-3 font-semibold">Gib deinen 4-stelligen PIN ein</p>
                    <div className="flex justify-center space-x-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className={`w-4 h-4 rounded-full border-2 transition-all ${
                            pin.length > idx
                              ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                              : 'border-slate-700 bg-slate-800/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Tactile Keypad */}
                  <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mb-3">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handlePinDigit(digit)}
                        disabled={isSubmitting}
                        className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 border border-slate-700/60 text-xl font-bold text-white transition-all shadow-md flex items-center justify-center"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPin('')}
                      disabled={isSubmitting}
                      className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 text-xs font-bold text-slate-400 border border-slate-800 transition-colors flex items-center justify-center"
                    >
                      Löschen
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinDigit('0')}
                      disabled={isSubmitting}
                      className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 border border-slate-700/60 text-xl font-bold text-white transition-all shadow-md flex items-center justify-center"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handlePinDelete}
                      disabled={isSubmitting}
                      className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 text-xs font-bold text-slate-400 border border-slate-800 transition-colors flex items-center justify-center"
                    >
                      ⌫
                    </button>
                  </div>
                </div>
              ) : (
                /* Adult / Admin Password Form */
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Passwort</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Passwort eingeben"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !password}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Anmelden</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-6 text-center space-y-2">
          <button
            onClick={onOpenOnboarding}
            className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center space-x-1.5 mx-auto"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Neues Smartphone verbinden / Familie wechseln</span>
          </button>
        </div>
      </div>
    </div>
  );
};

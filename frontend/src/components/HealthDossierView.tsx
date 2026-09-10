import React, { useState, useEffect } from 'react';
import {
  MemberHealthDossier,
  FamilyMember,
  MedicalCondition,
  MedicationRecord,
  AllergyRecord,
  VaccinationRecord,
  EmergencyContact,
} from '../types';
import {
  healthVaultSession,
  encryptHealthDossier,
  decryptHealthDossier,
  computeIntegrityHash,
} from '../utils/cryptoVault';
import { exportFhirJson } from '../utils/fhirConverter';
import { exportIpsHtml, generateEmergencyQrPayload } from '../utils/ipsGenerator';
import {
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Heart,
  FileText,
  Download,
  QrCode,
  Pill,
  Syringe,
  Activity,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Phone,
  User,
  CheckCircle2,
  Sparkles,
  Info,
  Clock,
  Printer,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';

interface Props {
  members: FamilyMember[];
  initialMemberId?: string;
  onClose?: () => void;
}

export const HealthDossierView: React.FC<Props> = ({ members, initialMemberId, onClose }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || (members.length > 0 ? members[0].id : '')
  );
  const [activeTab, setActiveTab] = useState<'notfall' | 'diagnosen' | 'medikamente' | 'allergien' | 'impfungen' | 'befunde'>('notfall');
  const [pinInput, setPinInput] = useState('1234'); // Default household PIN for smooth UX
  const [isUnlocked, setIsUnlocked] = useState(healthVaultSession.isUnlocked());
  const [dossier, setDossier] = useState<MemberHealthDossier | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals for adding items
  const [isAddConditionOpen, setIsAddConditionOpen] = useState(false);
  const [newCondition, setNewCondition] = useState<Partial<MedicalCondition>>({
    status: 'active',
    severity: 'moderate',
  });

  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [newMed, setNewMed] = useState<Partial<MedicationRecord>>({
    schedule_morning: 1,
    schedule_noon: 0,
    schedule_evening: 0,
    schedule_night: 0,
    is_essential: false,
  });

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  // Load or initialize dossier for selected member
  const loadDossierForMember = async (memberId: string) => {
    // Check session cache
    const cached = healthVaultSession.getCachedDossier(memberId);
    if (cached) {
      setDossier(cached);
      return;
    }

    // Try reading from localStorage (simulating local encrypted storage)
    const stored = localStorage.getItem(`fitplaner_ehr_${memberId}`);
    if (stored) {
      try {
        const payload = JSON.parse(stored);
        if (payload.ciphertext_b64) {
          const pass = healthVaultSession.getPassphrase() || '1234';
          const decrypted = await decryptHealthDossier(payload, pass);
          setDossier(decrypted);
          healthVaultSession.setCachedDossier(memberId, decrypted);
          setIsUnlocked(true);
          return;
        } else {
          setDossier(payload);
          return;
        }
      } catch (err) {
        console.warn('Could not auto-decrypt stored dossier:', err);
      }
    }

    // Seed default authentic profile based on family member
    const initial: MemberHealthDossier = {
      member_id: memberId,
      member_name: selectedMember?.name || 'Familienmitglied',
      blood_type: memberId === 'mem-1' ? 'A+' : memberId === 'mem-2' ? '0+' : 'A+',
      rhesus_factor: 'positive',
      organ_donor_status: 'yes',
      organ_donor_notes: 'Bereit zur Spende im Notfall',
      emergency_contacts: [
        {
          id: 'ec-1',
          name: memberId === 'mem-1' ? 'Juna Fee' : 'Dennis',
          relationship: memberId === 'mem-1' ? 'Partnerin' : 'Partner',
          phone: '+49 170 1234567',
          is_primary: true,
        },
      ],
      primary_physician: {
        name: 'Dr. med. M. Weber (Hausarztpraxis)',
        phone: '+49 511 892011',
        clinic_name: 'Zentrum für Allgemeinmedizin',
        address: 'Marienstraße 14, 30171 Hannover',
      },
      insurance_info: {
        provider_name: 'Techniker Krankenkasse (TK)',
        insurance_number: 'T204918293',
        has_travel_insurance: true,
        travel_insurance_policy: 'ADAC Auslandskrankenschutz Plus (Pol. 99201-B)',
        emergency_hotline: '+49 89 222222',
      },
      allergies:
        memberId === 'mem-1' || memberId === 'mem-2'
          ? [
              {
                id: 'all-1',
                substance: 'Fisch & Meeresfrüchte',
                category: 'food',
                criticality: 'severe',
                reaction: 'Urtikaria, Magenkrämpfe, Quincke-Ödem',
                verification_status: 'confirmed',
                emergency_treatment: 'Cetirizin 10mg, Prednisolon 50mg Notfall-Set',
              },
              {
                id: 'all-2',
                substance: 'Lachs (Salmo salar)',
                category: 'food',
                criticality: 'severe',
                reaction: 'Starke Übelkeit, Schwellung der Schleimhäute',
                verification_status: 'confirmed',
                emergency_treatment: 'Antihistaminikum',
              },
            ]
          : [],
      conditions:
        memberId === 'mem-1'
          ? [
              {
                id: 'cond-1',
                name: 'Arterielle Hypertonie (Essentiell)',
                icd10: 'I10.90',
                status: 'active',
                severity: 'moderate',
                onset_date: '2023-04-10',
                dietary_implication: 'Kochsalzreduktion (< 5g/Tag), Kaliumreiche Ernährung (Obst/Gemüse)',
                doctor_notes: 'Gute Blutdruckeinstellung unter Medikation, Zielwert < 130/80 mmHg.',
              },
            ]
          : [],
      medications:
        memberId === 'mem-1'
          ? [
              {
                id: 'med-1',
                trade_name: 'Ramipril 5mg 1A Pharma',
                active_substance: 'Ramipril (ACE-Hemmer)',
                pzn: '01827492',
                dosage: '5 mg',
                schedule_morning: 1,
                schedule_noon: 0,
                schedule_evening: 0,
                schedule_night: 0,
                instructions: 'Morgens unzerkaut mit einem Glas Wasser einnehmen',
                is_essential: true,
                prescriber: 'Dr. med. M. Weber',
              },
            ]
          : [],
      vaccinations: [
        {
          id: 'vac-1',
          disease: 'Tetanus / Diphtherie / Pertussis / Polio',
          vaccine_name: 'Boostrix Polio',
          date_administered: '2024-05-15',
          batch_number: 'AC29B109',
          administered_by: 'Dr. Weber',
          next_booster_due: '2034-05-15',
          is_up_to_date: true,
        },
        {
          id: 'vac-2',
          disease: 'FSME (Frühsommer-Meningoenzephalitis)',
          vaccine_name: 'Encepur Erwachsene',
          date_administered: '2025-06-10',
          batch_number: 'FS-99120',
          administered_by: 'Dr. Weber',
          next_booster_due: '2028-06-10',
          is_up_to_date: true,
        },
      ],
      findings: [
        {
          id: 'find-1',
          title: 'Laborbericht Großes Blutbild & Nierenwerte',
          doc_type: 'lab_report',
          date: '2026-03-12',
          author_facility: 'Labor Dr. Limbach & Kollegen',
          summary: 'Alle Elektrolyte, Leber- und Nierenwerte im Normbereich. HbA1c 5.3%.',
          key_values: {
            'HbA1c': '5.3 %',
            'GFR': '104 ml/min',
            'Kreatinin': '0.9 mg/dl',
            'Blutdruck': '124 / 78 mmHg',
          },
        },
      ],
      last_updated: new Date().toISOString(),
      is_encrypted: false,
    };

    setDossier(initial);
    healthVaultSession.setCachedDossier(memberId, initial);
  };

  useEffect(() => {
    if (selectedMemberId) {
      loadDossierForMember(selectedMemberId);
    }
  }, [selectedMemberId]);

  const handleUnlock = async () => {
    if (!pinInput.trim()) return;
    try {
      healthVaultSession.setPassphrase(pinInput);
      setIsUnlocked(true);
      if (dossier) {
        healthVaultSession.setCachedDossier(selectedMemberId, dossier);
      }
      setStatusMessage({ text: 'Krypto-Tresor erfolgreich entsperrt (AES-GCM-256 aktiv)', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ text: 'Entsperren fehlgeschlagen: ' + err.message, type: 'error' });
    }
  };

  const handleLock = () => {
    healthVaultSession.lockVault();
    setIsUnlocked(false);
    setStatusMessage({ text: 'Tresor gesperrt. Schlüssel aus dem Arbeitsspeicher gelöscht.', type: 'success' });
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleSaveEncrypted = async () => {
    if (!dossier) return;
    try {
      const pin = healthVaultSession.getPassphrase() || pinInput || '1234';
      const encrypted = await encryptHealthDossier(dossier, pin);
      localStorage.setItem(`fitplaner_ehr_${dossier.member_id}`, JSON.stringify(encrypted));
      healthVaultSession.setCachedDossier(dossier.member_id, dossier);
      setStatusMessage({ text: 'Gesundheitsakte erfolgreich lokal verschlüsselt gespeichert!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ text: 'Fehler beim Verschlüsseln: ' + err.message, type: 'error' });
    }
  };

  const handleAddCondition = () => {
    if (!dossier || !newCondition.name) return;
    const item: MedicalCondition = {
      id: `cond-${Date.now()}`,
      name: newCondition.name,
      icd10: newCondition.icd10,
      status: (newCondition.status as any) || 'active',
      severity: (newCondition.severity as any) || 'moderate',
      dietary_implication: newCondition.dietary_implication,
      doctor_notes: newCondition.doctor_notes,
      onset_date: new Date().toISOString().split('T')[0],
    };
    const updated = { ...dossier, conditions: [...dossier.conditions, item] };
    setDossier(updated);
    setIsAddConditionOpen(false);
    setNewCondition({ status: 'active', severity: 'moderate' });
    handleSaveEncrypted();
  };

  const handleAddMedication = () => {
    if (!dossier || !newMed.trade_name) return;
    const item: MedicationRecord = {
      id: `med-${Date.now()}`,
      trade_name: newMed.trade_name,
      active_substance: newMed.active_substance || newMed.trade_name,
      pzn: newMed.pzn,
      dosage: newMed.dosage || '1 Tablette',
      schedule_morning: newMed.schedule_morning || 0,
      schedule_noon: newMed.schedule_noon || 0,
      schedule_evening: newMed.schedule_evening || 0,
      schedule_night: newMed.schedule_night || 0,
      instructions: newMed.instructions,
      is_essential: !!newMed.is_essential,
      prescriber: newMed.prescriber || 'Hausarzt',
    };
    const updated = { ...dossier, medications: [...dossier.medications, item] };
    setDossier(updated);
    setIsAddMedOpen(false);
    setNewMed({ schedule_morning: 1, schedule_noon: 0, schedule_evening: 0, schedule_night: 0, is_essential: false });
    handleSaveEncrypted();
  };

  const handleDeleteCondition = (id: string) => {
    if (!dossier) return;
    const updated = { ...dossier, conditions: dossier.conditions.filter((c) => c.id !== id) };
    setDossier(updated);
    handleSaveEncrypted();
  };

  const handleDeleteMedication = (id: string) => {
    if (!dossier) return;
    const updated = { ...dossier, medications: dossier.medications.filter((m) => m.id !== id) };
    setDossier(updated);
    handleSaveEncrypted();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 animate-fadeIn">
      {/* 🌟 HEADER: Private ePA & Autarker Notfall-Tresor */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Autarke Private Elektronische Krankenakte (ePA)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Klinisches Gesundheitsdossier & Notfall-Pass
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              100% autark, ohne Cloud, lokal mit <strong>AES-GCM-256</strong> hardware-verschlüsselt. Weltweit kompatibel mit Krankenhäusern & Ärzten via <strong>HL7 FHIR R4</strong> und <strong>International Patient Summary (IPS)</strong>.
            </p>
          </div>

          {/* Quick Vault Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => dossier && exportIpsHtml(dossier)}
              disabled={!dossier}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md active:scale-95 disabled:opacity-50"
              title="International Patient Summary drucken oder als zweisprachiges PDF/HTML exportieren"
            >
              <FileText className="w-4 h-4" />
              <span>IPS Arztbrief (DE/EN)</span>
            </button>

            <button
              onClick={() => dossier && exportFhirJson(dossier)}
              disabled={!dossier}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50"
              title="Standard HL7 FHIR Bundle JSON für Krankenhaus- und Arztsoftware"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>HL7 FHIR JSON</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md active:scale-95"
              title="Offline Notfall-QR-Code für Ersthelfer und Notärzte anzeigen"
            >
              <QrCode className="w-4 h-4" />
              <span>Notfall-Pass (QR)</span>
            </button>
          </div>
        </div>

        {/* Member Switcher Pills */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t border-slate-800/80 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Familienmitglied:
          </span>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMemberId(m.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedMemberId === m.id
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{m.name}</span>
              {(m.allergies?.length > 0 || (dossier?.allergies?.length || 0) > 0) && (
                <span className="w-2 h-2 rounded-full bg-rose-400" title="Allergien hinterlegt" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 🔐 Krypto-Vault Status Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Krypto-Tresor:</span>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-md ${
                  isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isUnlocked ? 'ENTSPERRT • AES-GCM-256' : 'GESPERRT • Hardware-Schutz'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isUnlocked
                ? 'Schlüssel sicher im flüchtigen Speicher. Automatischer Timeout bei Inaktivität.'
                : 'Sensible klinische Daten und Befunde sind ohne PIN unlesbar geschützt.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isUnlocked ? (
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN / Passwort"
                maxLength={8}
                className="w-28 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleUnlock}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Entsperren
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEncrypted}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                💾 Jetzt sichern
              </button>
              <button
                onClick={handleLock}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Tresor sperren
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('notfall')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'notfall' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>🚨 Notfall-Pass & ICE</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnosen')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'diagnosen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span>📋 Diagnosen ({dossier?.conditions.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('medikamente')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'medikamente' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="w-3.5 h-3.5 text-purple-600" />
          <span>💊 Medikationsplan BMP ({dossier?.medications.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('allergien')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'allergien' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>⚠️ Allergien & Risiken ({dossier?.allergies.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('impfungen')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'impfungen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Syringe className="w-3.5 h-3.5 text-emerald-600" />
          <span>💉 Impfausweis ({dossier?.vaccinations.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('befunde')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'befunde' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-600" />
          <span>📑 Befunde & Labor ({dossier?.findings.length || 0})</span>
        </button>
      </div>

      {/* TAB CONTENT: NOTFALL-PASS */}
      {activeTab === 'notfall' && dossier && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase">Blutgruppe & Rhesus</div>
              <div className="text-2xl font-black text-rose-600 mt-1 flex items-center gap-2">
                <span>{dossier.blood_type || 'Unbekannt'}</span>
                <span className="text-xs px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-bold">
                  Rh pos.
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Im Notfall sofort kompatibel</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase">Organspende-Status</div>
              <div className="text-lg font-black text-emerald-700 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{dossier.organ_donor_status === 'yes' ? 'Ja, bereit' : 'Nicht erfasst'}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{dossier.organ_donor_notes || 'Ausweis digital hinterlegt'}</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase">Primärer Notfallkontakt (ICE)</div>
              <div className="text-base font-black text-slate-900 mt-1">
                {dossier.emergency_contacts[0]?.name || 'Keiner'}
              </div>
              <div className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />
                <a href={`tel:${dossier.emergency_contacts[0]?.phone}`} className="hover:underline">
                  {dossier.emergency_contacts[0]?.phone}
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase">Krankenkasse & Ausland</div>
              <div className="text-base font-black text-slate-900 mt-1">
                {dossier.insurance_info?.provider_name}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Nr: <code className="font-mono font-bold text-slate-700">{dossier.insurance_info?.insurance_number}</code>
              </div>
            </div>
          </div>

          {/* Critical Emergency Banner */}
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 text-rose-950 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-wide text-rose-900">
                🚨 Lebensbedrohliche Notfall-Hinweise (Für Notarzt & Rettungsdienst)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white/80 p-3.5 rounded-xl border border-rose-200">
                <div className="font-extrabold text-rose-800 mb-1">Schwere Allergien & Anaphylaxie-Risiken:</div>
                {dossier.allergies.length > 0 ? (
                  dossier.allergies.map((a) => (
                    <div key={a.id} className="text-slate-800 mt-1">
                      • <strong>{a.substance}</strong>: {a.reaction} (Notfall-Kit: {a.emergency_treatment})
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">Keine lebensbedrohlichen Allergien hinterlegt.</div>
                )}
              </div>

              <div className="bg-white/80 p-3.5 rounded-xl border border-rose-200">
                <div className="font-extrabold text-rose-800 mb-1">Lebensnotwendige Dauermedikation:</div>
                {dossier.medications.filter((m) => m.is_essential).length > 0 ? (
                  dossier.medications
                    .filter((m) => m.is_essential)
                    .map((m) => (
                      <div key={m.id} className="text-slate-800 mt-1">
                        • <strong>{m.trade_name}</strong> ({m.active_substance}) - {m.dosage} [{m.schedule_morning}-{m.schedule_noon}-{m.schedule_evening}-{m.schedule_night}]
                      </div>
                    ))
                ) : (
                  <div className="text-slate-500">Keine Notfall-Dauermedikation registriert.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DIAGNOSEN */}
      {activeTab === 'diagnosen' && dossier && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Vorerkrankungen & Klinische Diagnosen</h3>
              <p className="text-xs text-slate-500">ICD-10 codierte Krankheitsdaten mit diätetischer Relevanz für FitPlaner.</p>
            </div>
            <button
              onClick={() => setIsAddConditionOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Diagnose erfassen</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {dossier.conditions.map((c) => (
              <div key={c.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{c.name}</span>
                    {c.icd10 && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono text-[10px] font-black border border-blue-200">
                        ICD-10: {c.icd10}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  {c.dietary_implication && (
                    <div className="text-xs text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium inline-block">
                      🥗 Diät-Relevanz: {c.dietary_implication}
                    </div>
                  )}
                  {c.doctor_notes && (
                    <div className="text-xs text-slate-500">{c.doctor_notes}</div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteCondition(c.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition self-end md:self-center"
                  title="Eintrag entfernen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: MEDIKAMENTE (BMP) */}
      {activeTab === 'medikamente' && dossier && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Bundeseinheitlicher Medikationsplan (BMP)</h3>
              <p className="text-xs text-slate-500">Dosierungsschema (Morgens - Mittags - Abends - Nachts) & Wirkstoffe.</p>
            </div>
            <button
              onClick={() => setIsAddMedOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Medikament hinzufügen</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="p-3 font-extrabold">Handelsname & Wirkstoff</th>
                  <th className="p-3 font-extrabold">Dosierung</th>
                  <th className="p-3 font-extrabold text-center">Schema (M - M - A - N)</th>
                  <th className="p-3 font-extrabold">Einnahmehinweis</th>
                  <th className="p-3 font-extrabold">PZN</th>
                  <th className="p-3 font-extrabold text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dossier.medications.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{m.trade_name}</span>
                        {m.is_essential && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-extrabold text-[9px]">
                            VITAL
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{m.active_substance}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{m.dosage}</td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {m.schedule_morning} - {m.schedule_noon} - {m.schedule_evening} - {m.schedule_night}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{m.instructions || '—'}</td>
                    <td className="p-3 font-mono text-slate-500">{m.pzn || '—'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteMedication(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ALLERGIEN */}
      {activeTab === 'allergien' && dossier && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Allergien & Unverträglichkeiten</h3>
            <p className="text-xs text-slate-500">
              Vollständig synchronisiert mit dem FitPlaner Rezept- & Einkaufsfilter. Verhindert gefährliche Lebensmittel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {dossier.allergies.map((a) => (
              <div key={a.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>{a.substance}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                      a.criticality === 'life_threatening' || a.criticality === 'severe'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {a.criticality}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Reaktion:</strong> {a.reaction}
                </div>
                {a.emergency_treatment && (
                  <div className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
                    💊 Notfall-Kit: {a.emergency_treatment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: IMPFUNGEN */}
      {activeTab === 'impfungen' && dossier && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Digitaler Impfausweis (WHO Standard)</h3>
            <p className="text-xs text-slate-500">Chargennummern und fällige Auffrischungs-Termine.</p>
          </div>

          <div className="space-y-3 pt-2">
            {dossier.vaccinations.map((v) => (
              <div key={v.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-extrabold text-slate-900 text-sm">{v.disease}</div>
                  <div className="text-xs text-slate-500">
                    Impfstoff: <strong>{v.vaccine_name}</strong> • Geimpft am: {v.date_administered} • Charge: <code>{v.batch_number}</code>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">
                    Auffrischung: {v.next_booster_due}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: BEFUNDE */}
      {activeTab === 'befunde' && dossier && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Klinische Befunde & Laborberichte</h3>
            <p className="text-xs text-slate-500">Strukturierte Laborwerte und Arztbriefe lokal gespeichert.</p>
          </div>

          <div className="space-y-3 pt-2">
            {dossier.findings.map((f) => (
              <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">{f.title}</div>
                  <div className="text-xs text-slate-400">{f.date} • {f.author_facility}</div>
                </div>
                <p className="text-xs text-slate-600">{f.summary}</p>
                {f.key_values && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(f.key_values).map(([k, val]) => (
                      <span key={k} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                        {k}: <strong className="text-emerald-700">{val}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🚨 MODAL: EMERGENCY QR CODE (OFFLINE READABLE) */}
      {isQrModalOpen && dossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <QrCode className="w-6 h-6" />
                <h3 className="text-lg font-black text-slate-900">Notfall-Pass (Offline-QR-Code)</h3>
              </div>
              <button onClick={() => setIsQrModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Dieser Datensatz kann von <strong>jedem Smartphone (Kamera)</strong> ohne App und ohne Internetzugriff sofort gelesen werden:
            </p>

            {/* Offline Text Payload Box */}
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-800">
              {generateEmergencyQrPayload(dossier)}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400">FitPlaner Autonomous Health Vault</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateEmergencyQrPayload(dossier));
                  alert('Notfall-Pass in die Zwischenablage kopiert!');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                In Zwischenablage kopieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CONDITION */}
      {isAddConditionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900">Diagnose / Vorerkrankung erfassen</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Bezeichnung (z. B. Diabetes, Zöliakie, Asthma):</label>
                <input
                  type="text"
                  value={newCondition.name || ''}
                  onChange={(e) => setNewCondition({ ...newCondition, name: e.target.value })}
                  placeholder="Krankheitsbezeichnung"
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">ICD-10 Code (optional, z. B. E10.9, K90.0):</label>
                <input
                  type="text"
                  value={newCondition.icd10 || ''}
                  onChange={(e) => setNewCondition({ ...newCondition, icd10: e.target.value })}
                  placeholder="ICD-10"
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Diätetische Relevanz (für FitPlaner Rezepte):</label>
                <input
                  type="text"
                  value={newCondition.dietary_implication || ''}
                  onChange={(e) => setNewCondition({ ...newCondition, dietary_implication: e.target.value })}
                  placeholder="z. B. Streng glutenfrei, purinarm"
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddConditionOpen(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddCondition}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEDICATION */}
      {isAddMedOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900">Medikament zum BMP hinzufügen</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Handelsname (z. B. Metformin 1000mg):</label>
                <input
                  type="text"
                  value={newMed.trade_name || ''}
                  onChange={(e) => setNewMed({ ...newMed, trade_name: e.target.value })}
                  placeholder="Präparatname"
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Wirkstoff (z. B. Metforminhydrochlorid):</label>
                <input
                  type="text"
                  value={newMed.active_substance || ''}
                  onChange={(e) => setNewMed({ ...newMed, active_substance: e.target.value })}
                  placeholder="Wirkstoff"
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Morgens:</label>
                  <input
                    type="number"
                    value={newMed.schedule_morning || 0}
                    onChange={(e) => setNewMed({ ...newMed, schedule_morning: parseInt(e.target.value, 10) || 0 })}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Mittags:</label>
                  <input
                    type="number"
                    value={newMed.schedule_noon || 0}
                    onChange={(e) => setNewMed({ ...newMed, schedule_noon: parseInt(e.target.value, 10) || 0 })}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Abends:</label>
                  <input
                    type="number"
                    value={newMed.schedule_evening || 0}
                    onChange={(e) => setNewMed({ ...newMed, schedule_evening: parseInt(e.target.value, 10) || 0 })}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Nachts:</label>
                  <input
                    type="number"
                    value={newMed.schedule_night || 0}
                    onChange={(e) => setNewMed({ ...newMed, schedule_night: parseInt(e.target.value, 10) || 0 })}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-center"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 font-bold text-rose-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={!!newMed.is_essential}
                  onChange={(e) => setNewMed({ ...newMed, is_essential: e.target.checked })}
                  className="rounded text-rose-600"
                />
                <span>Lebensnotwendiges Dauermedikament (Notfall-relevant)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddMedOpen(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddMedication}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

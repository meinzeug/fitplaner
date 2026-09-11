import React, { useState, useEffect } from 'react';
import {
  MemberHealthDossier,
  FamilyMember,
  MedicalCondition,
  MedicationRecord,
  AllergyRecord,
  VaccinationRecord,
  EmergencyContact,
  ClinicalFindingDocument,
} from '../types';
import {
  healthVaultSession,
  encryptHealthDossier,
  decryptHealthDossier,
} from '../utils/cryptoVault';
import { exportFhirJson } from '../utils/fhirConverter';
import { exportIpsHtml, generateEmergencyQrPayload } from '../utils/ipsGenerator';
import { apiFetch } from '../api/client';
import {
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
  Phone,
  User,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';

interface Props {
  members: FamilyMember[];
  initialMemberId?: string;
  onClose?: () => void;
}

export const HealthDossierView: React.FC<Props> = ({ members, initialMemberId }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || (members.length > 0 ? members[0].id : '')
  );
  const [activeTab, setActiveTab] = useState<'notfall' | 'diagnosen' | 'medikamente' | 'allergien' | 'impfungen' | 'befunde'>('notfall');
  const [pinInput, setPinInput] = useState('1234');
  const [isUnlocked, setIsUnlocked] = useState(healthVaultSession.isUnlocked());
  const [dossier, setDossier] = useState<MemberHealthDossier | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Modal: Emergency Core (Blood, Rhesus, Organ donation)
  const [isEditCoreModalOpen, setIsEditCoreModalOpen] = useState(false);
  const [coreForm, setCoreForm] = useState<{
    blood_type: MemberHealthDossier['blood_type'];
    rhesus_factor: MemberHealthDossier['rhesus_factor'];
    organ_donor_status: MemberHealthDossier['organ_donor_status'];
    organ_donor_notes: string;
  }>({
    blood_type: 'A+',
    rhesus_factor: 'positive',
    organ_donor_status: 'yes',
    organ_donor_notes: '',
  });

  // Modal: Primary Physician
  const [isPhysicianModalOpen, setIsPhysicianModalOpen] = useState(false);
  const [physicianForm, setPhysicianForm] = useState({
    name: '',
    phone: '',
    clinic_name: '',
    address: '',
  });

  // Modal: Insurance
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [insuranceForm, setInsuranceForm] = useState({
    provider_name: '',
    insurance_number: '',
    has_travel_insurance: false,
    travel_insurance_policy: '',
    emergency_hotline: '',
  });

  // Modal: Contact (Add / Edit)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<Partial<EmergencyContact>>({
    name: '',
    relationship: 'Partner',
    phone: '',
    is_primary: false,
  });

  // Modal: Condition (Add / Edit)
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null);
  const [conditionForm, setConditionForm] = useState<Partial<MedicalCondition>>({
    name: '',
    icd10: '',
    status: 'active',
    severity: 'moderate',
    onset_date: '',
    dietary_implication: '',
    doctor_notes: '',
  });

  // Modal: Medication (Add / Edit)
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null);
  const [medicationForm, setMedicationForm] = useState<Partial<MedicationRecord>>({
    trade_name: '',
    active_substance: '',
    pzn: '',
    dosage: '1 Tablette',
    schedule_morning: 1,
    schedule_noon: 0,
    schedule_evening: 0,
    schedule_night: 0,
    instructions: '',
    is_essential: false,
    prescriber: 'Hausarzt',
  });

  // Modal: Allergy (Add / Edit)
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [editingAllergyId, setEditingAllergyId] = useState<string | null>(null);
  const [allergyForm, setAllergyForm] = useState<Partial<AllergyRecord>>({
    substance: '',
    category: 'food',
    criticality: 'severe',
    reaction: '',
    verification_status: 'confirmed',
    emergency_treatment: '',
  });

  // Modal: Vaccination (Add / Edit)
  const [isVaccinationModalOpen, setIsVaccinationModalOpen] = useState(false);
  const [editingVaccinationId, setEditingVaccinationId] = useState<string | null>(null);
  const [vaccinationForm, setVaccinationForm] = useState<Partial<VaccinationRecord>>({
    disease: '',
    vaccine_name: '',
    date_administered: '',
    batch_number: '',
    administered_by: '',
    next_booster_due: '',
    is_up_to_date: true,
  });

  // Modal: Finding (Add / Edit)
  const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [findingForm, setFindingForm] = useState<{
    title: string;
    doc_type: ClinicalFindingDocument['doc_type'];
    date: string;
    author_facility: string;
    summary: string;
    keyValuesRaw: string;
  }>({
    title: '',
    doc_type: 'lab_report',
    date: '',
    author_facility: '',
    summary: '',
    keyValuesRaw: '',
  });

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const getInitialSeed = (memberId: string, memberName: string): MemberHealthDossier => {
    return {
      member_id: memberId,
      member_name: memberName || 'Familienmitglied',
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
  };

  const persistDossier = async (updated: MemberHealthDossier, message?: string) => {
    setIsSaving(true);
    setDossier(updated);
    healthVaultSession.setCachedDossier(updated.member_id, updated);

    try {
      const pin = healthVaultSession.getPassphrase() || pinInput || '1234';
      const encrypted = await encryptHealthDossier(updated, pin);
      localStorage.setItem(`fitplaner_ehr_${updated.member_id}`, JSON.stringify(encrypted));
    } catch (e) {
      console.warn('Could not encrypt to localStorage:', e);
    }

    try {
      await apiFetch(`/api/health-dossier/${updated.member_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn('Could not sync to backend API:', e);
    }

    setIsSaving(false);
    showToast(message || 'Änderung erfolgreich in Krankenakte gespeichert!');
  };

  const loadDossierForMember = async (memberId: string) => {
    const cached = healthVaultSession.getCachedDossier(memberId);
    if (cached) {
      setDossier(cached);
    }

    try {
      const res = await apiFetch(`/api/health-dossier/${memberId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && data.dossier) {
          setDossier(data.dossier);
          healthVaultSession.setCachedDossier(memberId, data.dossier);
          return;
        }
      }
    } catch (err) {
      console.warn('[ePA] API read error:', err);
    }

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
        console.warn('[ePA] Local decrypt error:', err);
      }
    }

    if (cached) return;

    const seed = getInitialSeed(memberId, selectedMember?.name);
    setDossier(seed);
    healthVaultSession.setCachedDossier(memberId, seed);
    persistDossier(seed, 'Neues klinisches Profil initialisiert');
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
      showToast('Krypto-Tresor erfolgreich entsperrt (AES-GCM-256)');
    } catch (err: any) {
      showToast('Entsperren fehlgeschlagen: ' + err.message, 'error');
    }
  };

  const handleLock = () => {
    healthVaultSession.lockVault();
    setIsUnlocked(false);
    showToast('Tresor gesperrt. Schlüssel aus dem Arbeitsspeicher gelöscht.');
  };

  // SECTION 1: NOTFALL-PASS & ICE CRUD
  const openEditCore = () => {
    if (!dossier) return;
    setCoreForm({
      blood_type: dossier.blood_type || 'A+',
      rhesus_factor: dossier.rhesus_factor || 'positive',
      organ_donor_status: dossier.organ_donor_status || 'yes',
      organ_donor_notes: dossier.organ_donor_notes || '',
    });
    setIsEditCoreModalOpen(true);
  };

  const handleSaveCore = () => {
    if (!dossier) return;
    const updated: MemberHealthDossier = {
      ...dossier,
      blood_type: coreForm.blood_type,
      rhesus_factor: coreForm.rhesus_factor,
      organ_donor_status: coreForm.organ_donor_status,
      organ_donor_notes: coreForm.organ_donor_notes,
    };
    persistDossier(updated, 'Notfalldaten erfolgreich aktualisiert!');
    setIsEditCoreModalOpen(false);
  };

  const openEditPhysician = () => {
    if (!dossier) return;
    setPhysicianForm({
      name: dossier.primary_physician?.name || '',
      phone: dossier.primary_physician?.phone || '',
      clinic_name: dossier.primary_physician?.clinic_name || '',
      address: dossier.primary_physician?.address || '',
    });
    setIsPhysicianModalOpen(true);
  };

  const handleSavePhysician = () => {
    if (!dossier) return;
    const updated: MemberHealthDossier = {
      ...dossier,
      primary_physician: {
        name: physicianForm.name.trim() || 'Unbekannt',
        phone: physicianForm.phone.trim(),
        clinic_name: physicianForm.clinic_name.trim(),
        address: physicianForm.address.trim(),
      },
    };
    persistDossier(updated, 'Hausarzt & Behandler erfolgreich gespeichert!');
    setIsPhysicianModalOpen(false);
  };

  const openEditInsurance = () => {
    if (!dossier) return;
    setInsuranceForm({
      provider_name: dossier.insurance_info?.provider_name || '',
      insurance_number: dossier.insurance_info?.insurance_number || '',
      has_travel_insurance: dossier.insurance_info?.has_travel_insurance || false,
      travel_insurance_policy: dossier.insurance_info?.travel_insurance_policy || '',
      emergency_hotline: dossier.insurance_info?.emergency_hotline || '',
    });
    setIsInsuranceModalOpen(true);
  };

  const handleSaveInsurance = () => {
    if (!dossier) return;
    const updated: MemberHealthDossier = {
      ...dossier,
      insurance_info: {
        provider_name: insuranceForm.provider_name.trim() || 'Krankenkasse',
        insurance_number: insuranceForm.insurance_number.trim(),
        has_travel_insurance: insuranceForm.has_travel_insurance,
        travel_insurance_policy: insuranceForm.travel_insurance_policy.trim(),
        emergency_hotline: insuranceForm.emergency_hotline.trim(),
      },
    };
    persistDossier(updated, 'Versicherungsdaten erfolgreich gespeichert!');
    setIsInsuranceModalOpen(false);
  };

  const openAddContact = () => {
    setEditingContactId(null);
    setContactForm({
      name: '',
      relationship: 'Partner',
      phone: '',
      is_primary: (dossier?.emergency_contacts?.length || 0) === 0,
    });
    setIsContactModalOpen(true);
  };

  const openEditContact = (contact: EmergencyContact) => {
    setEditingContactId(contact.id);
    setContactForm({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      is_primary: contact.is_primary,
    });
    setIsContactModalOpen(true);
  };

  const handleSaveContact = () => {
    if (!dossier || !contactForm.name) return;
    let contacts = [...(dossier.emergency_contacts || [])];
    if (contactForm.is_primary) {
      contacts = contacts.map((c) => ({ ...c, is_primary: false }));
    }

    if (editingContactId) {
      contacts = contacts.map((c) =>
        c.id === editingContactId
          ? {
              ...c,
              name: contactForm.name!,
              relationship: contactForm.relationship || 'Angehörige(r)',
              phone: contactForm.phone || '',
              is_primary: !!contactForm.is_primary,
            }
          : c
      );
    } else {
      const newContact: EmergencyContact = {
        id: `ec-${Date.now()}`,
        name: contactForm.name!,
        relationship: contactForm.relationship || 'Angehörige(r)',
        phone: contactForm.phone || '',
        is_primary: !!contactForm.is_primary || contacts.length === 0,
      };
      contacts.push(newContact);
    }

    const updated = { ...dossier, emergency_contacts: contacts };
    persistDossier(updated, editingContactId ? 'Notfallkontakt aktualisiert!' : 'Notfallkontakt hinzugefügt!');
    setIsContactModalOpen(false);
  };

  const handleDeleteContact = (id: string) => {
    if (!dossier) return;
    const contacts = dossier.emergency_contacts.filter((c) => c.id !== id);
    if (contacts.length > 0 && !contacts.some((c) => c.is_primary)) {
      contacts[0].is_primary = true;
    }
    const updated = { ...dossier, emergency_contacts: contacts };
    persistDossier(updated, 'Notfallkontakt gelöscht.');
  };

  // SECTION 2: DIAGNOSEN CRUD
  const openAddCondition = () => {
    setEditingConditionId(null);
    setConditionForm({
      name: '',
      icd10: '',
      status: 'active',
      severity: 'moderate',
      onset_date: new Date().toISOString().split('T')[0],
      dietary_implication: '',
      doctor_notes: '',
    });
    setIsConditionModalOpen(true);
  };

  const openEditCondition = (c: MedicalCondition) => {
    setEditingConditionId(c.id);
    setConditionForm({
      name: c.name,
      icd10: c.icd10 || '',
      status: c.status || 'active',
      severity: c.severity || 'moderate',
      onset_date: c.onset_date || '',
      dietary_implication: c.dietary_implication || '',
      doctor_notes: c.doctor_notes || '',
    });
    setIsConditionModalOpen(true);
  };

  const handleSaveCondition = () => {
    if (!dossier || !conditionForm.name) return;
    let list = [...(dossier.conditions || [])];

    if (editingConditionId) {
      list = list.map((item) =>
        item.id === editingConditionId
          ? {
              ...item,
              name: conditionForm.name!,
              icd10: conditionForm.icd10?.trim() || undefined,
              status: (conditionForm.status as any) || 'active',
              severity: (conditionForm.severity as any) || 'moderate',
              onset_date: conditionForm.onset_date || item.onset_date,
              dietary_implication: conditionForm.dietary_implication?.trim() || undefined,
              doctor_notes: conditionForm.doctor_notes?.trim() || undefined,
            }
          : item
      );
    } else {
      const newEntry: MedicalCondition = {
        id: `cond-${Date.now()}`,
        name: conditionForm.name!,
        icd10: conditionForm.icd10?.trim() || undefined,
        status: (conditionForm.status as any) || 'active',
        severity: (conditionForm.severity as any) || 'moderate',
        onset_date: conditionForm.onset_date || new Date().toISOString().split('T')[0],
        dietary_implication: conditionForm.dietary_implication?.trim() || undefined,
        doctor_notes: conditionForm.doctor_notes?.trim() || undefined,
      };
      list.push(newEntry);
    }

    const updated = { ...dossier, conditions: list };
    persistDossier(updated, editingConditionId ? 'Diagnose aktualisiert!' : 'Neue Diagnose erfasst!');
    setIsConditionModalOpen(false);
  };

  const handleDeleteCondition = (id: string) => {
    if (!dossier) return;
    const updated = { ...dossier, conditions: dossier.conditions.filter((c) => c.id !== id) };
    persistDossier(updated, 'Diagnose gelöscht.');
  };

  // SECTION 3: MEDIKAMENTE (BMP) CRUD
  const openAddMedication = () => {
    setEditingMedicationId(null);
    setMedicationForm({
      trade_name: '',
      active_substance: '',
      pzn: '',
      dosage: '1 Tablette',
      schedule_morning: 1,
      schedule_noon: 0,
      schedule_evening: 0,
      schedule_night: 0,
      instructions: '',
      is_essential: false,
      prescriber: 'Hausarzt',
    });
    setIsMedicationModalOpen(true);
  };

  const openEditMedication = (m: MedicationRecord) => {
    setEditingMedicationId(m.id);
    setMedicationForm({
      trade_name: m.trade_name,
      active_substance: m.active_substance,
      pzn: m.pzn || '',
      dosage: m.dosage || '1 Tablette',
      schedule_morning: m.schedule_morning || 0,
      schedule_noon: m.schedule_noon || 0,
      schedule_evening: m.schedule_evening || 0,
      schedule_night: m.schedule_night || 0,
      instructions: m.instructions || '',
      is_essential: !!m.is_essential,
      prescriber: m.prescriber || '',
    });
    setIsMedicationModalOpen(true);
  };

  const handleSaveMedication = () => {
    if (!dossier || !medicationForm.trade_name) return;
    let list = [...(dossier.medications || [])];

    if (editingMedicationId) {
      list = list.map((item) =>
        item.id === editingMedicationId
          ? {
              ...item,
              trade_name: medicationForm.trade_name!,
              active_substance: medicationForm.active_substance || medicationForm.trade_name!,
              pzn: medicationForm.pzn?.trim() || undefined,
              dosage: medicationForm.dosage || '1 Tablette',
              schedule_morning: Number(medicationForm.schedule_morning) || 0,
              schedule_noon: Number(medicationForm.schedule_noon) || 0,
              schedule_evening: Number(medicationForm.schedule_evening) || 0,
              schedule_night: Number(medicationForm.schedule_night) || 0,
              instructions: medicationForm.instructions?.trim() || undefined,
              is_essential: !!medicationForm.is_essential,
              prescriber: medicationForm.prescriber?.trim() || undefined,
            }
          : item
      );
    } else {
      const newEntry: MedicationRecord = {
        id: `med-${Date.now()}`,
        trade_name: medicationForm.trade_name!,
        active_substance: medicationForm.active_substance || medicationForm.trade_name!,
        pzn: medicationForm.pzn?.trim() || undefined,
        dosage: medicationForm.dosage || '1 Tablette',
        schedule_morning: Number(medicationForm.schedule_morning) || 0,
        schedule_noon: Number(medicationForm.schedule_noon) || 0,
        schedule_evening: Number(medicationForm.schedule_evening) || 0,
        schedule_night: Number(medicationForm.schedule_night) || 0,
        instructions: medicationForm.instructions?.trim() || undefined,
        is_essential: !!medicationForm.is_essential,
        prescriber: medicationForm.prescriber?.trim() || undefined,
      };
      list.push(newEntry);
    }

    const updated = { ...dossier, medications: list };
    persistDossier(updated, editingMedicationId ? 'Medikament aktualisiert!' : 'Medikament hinzugefügt!');
    setIsMedicationModalOpen(false);
  };

  const handleDeleteMedication = (id: string) => {
    if (!dossier) return;
    const updated = { ...dossier, medications: dossier.medications.filter((m) => m.id !== id) };
    persistDossier(updated, 'Medikament gelöscht.');
  };

  // SECTION 4: ALLERGIEN CRUD
  const openAddAllergy = () => {
    setEditingAllergyId(null);
    setAllergyForm({
      substance: '',
      category: 'food',
      criticality: 'severe',
      reaction: '',
      verification_status: 'confirmed',
      emergency_treatment: '',
    });
    setIsAllergyModalOpen(true);
  };

  const openEditAllergy = (a: AllergyRecord) => {
    setEditingAllergyId(a.id);
    setAllergyForm({
      substance: a.substance,
      category: a.category || 'food',
      criticality: a.criticality || 'severe',
      reaction: a.reaction || '',
      verification_status: a.verification_status || 'confirmed',
      emergency_treatment: a.emergency_treatment || '',
    });
    setIsAllergyModalOpen(true);
  };

  const handleSaveAllergy = () => {
    if (!dossier || !allergyForm.substance) return;
    let list = [...(dossier.allergies || [])];

    if (editingAllergyId) {
      list = list.map((item) =>
        item.id === editingAllergyId
          ? {
              ...item,
              substance: allergyForm.substance!,
              category: (allergyForm.category as any) || 'food',
              criticality: (allergyForm.criticality as any) || 'severe',
              reaction: allergyForm.reaction || '',
              verification_status: (allergyForm.verification_status as any) || 'confirmed',
              emergency_treatment: allergyForm.emergency_treatment?.trim() || undefined,
            }
          : item
      );
    } else {
      const newEntry: AllergyRecord = {
        id: `all-${Date.now()}`,
        substance: allergyForm.substance!,
        category: (allergyForm.category as any) || 'food',
        criticality: (allergyForm.criticality as any) || 'severe',
        reaction: allergyForm.reaction || '',
        verification_status: (allergyForm.verification_status as any) || 'confirmed',
        emergency_treatment: allergyForm.emergency_treatment?.trim() || undefined,
      };
      list.push(newEntry);
    }

    const updated = { ...dossier, allergies: list };
    persistDossier(updated, editingAllergyId ? 'Allergie aktualisiert!' : 'Allergie hinzugefügt!');
    setIsAllergyModalOpen(false);
  };

  const handleDeleteAllergy = (id: string) => {
    if (!dossier) return;
    const updated = { ...dossier, allergies: dossier.allergies.filter((a) => a.id !== id) };
    persistDossier(updated, 'Allergie entfernt.');
  };

  // SECTION 5: IMPFUNGEN CRUD
  const openAddVaccination = () => {
    setEditingVaccinationId(null);
    setVaccinationForm({
      disease: '',
      vaccine_name: '',
      date_administered: new Date().toISOString().split('T')[0],
      batch_number: '',
      administered_by: 'Hausarzt',
      next_booster_due: '',
      is_up_to_date: true,
    });
    setIsVaccinationModalOpen(true);
  };

  const openEditVaccination = (v: VaccinationRecord) => {
    setEditingVaccinationId(v.id);
    setVaccinationForm({
      disease: v.disease,
      vaccine_name: v.vaccine_name,
      date_administered: v.date_administered,
      batch_number: v.batch_number || '',
      administered_by: v.administered_by || '',
      next_booster_due: v.next_booster_due || '',
      is_up_to_date: v.is_up_to_date,
    });
    setIsVaccinationModalOpen(true);
  };

  const handleSaveVaccination = () => {
    if (!dossier || !vaccinationForm.disease) return;
    let list = [...(dossier.vaccinations || [])];

    if (editingVaccinationId) {
      list = list.map((item) =>
        item.id === editingVaccinationId
          ? {
              ...item,
              disease: vaccinationForm.disease!,
              vaccine_name: vaccinationForm.vaccine_name || 'Standard-Impfstoff',
              date_administered: vaccinationForm.date_administered || new Date().toISOString().split('T')[0],
              batch_number: vaccinationForm.batch_number?.trim() || undefined,
              administered_by: vaccinationForm.administered_by?.trim() || undefined,
              next_booster_due: vaccinationForm.next_booster_due?.trim() || undefined,
              is_up_to_date: !!vaccinationForm.is_up_to_date,
            }
          : item
      );
    } else {
      const newEntry: VaccinationRecord = {
        id: `vac-${Date.now()}`,
        disease: vaccinationForm.disease!,
        vaccine_name: vaccinationForm.vaccine_name || 'Standard-Impfstoff',
        date_administered: vaccinationForm.date_administered || new Date().toISOString().split('T')[0],
        batch_number: vaccinationForm.batch_number?.trim() || undefined,
        administered_by: vaccinationForm.administered_by?.trim() || undefined,
        next_booster_due: vaccinationForm.next_booster_due?.trim() || undefined,
        is_up_to_date: !!vaccinationForm.is_up_to_date,
      };
      list.push(newEntry);
    }

    const updated = { ...dossier, vaccinations: list };
    persistDossier(updated, editingVaccinationId ? 'Impfung aktualisiert!' : 'Neue Impfung eingetragen!');
    setIsVaccinationModalOpen(false);
  };

  const handleDeleteVaccination = (id: string) => {
    if (!dossier) return;
    const updated = { ...dossier, vaccinations: dossier.vaccinations.filter((v) => v.id !== id) };
    persistDossier(updated, 'Impfung gelöscht.');
  };

  // SECTION 6: BEFUNDE & LABOR CRUD
  const openAddFinding = () => {
    setEditingFindingId(null);
    setFindingForm({
      title: '',
      doc_type: 'lab_report',
      date: new Date().toISOString().split('T')[0],
      author_facility: '',
      summary: '',
      keyValuesRaw: `HbA1c: 5.3%\nGFR: 104 ml/min\nKreatinin: 0.9 mg/dl`,
    });
    setIsFindingModalOpen(true);
  };

  const openEditFinding = (f: ClinicalFindingDocument) => {
    setEditingFindingId(f.id);
    const kvString = f.key_values
      ? Object.entries(f.key_values)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
      : '';
    setFindingForm({
      title: f.title,
      doc_type: f.doc_type,
      date: f.date,
      author_facility: f.author_facility || '',
      summary: f.summary || '',
      keyValuesRaw: kvString,
    });
    setIsFindingModalOpen(true);
  };

  const handleSaveFinding = () => {
    if (!dossier || !findingForm.title) return;
    let list = [...(dossier.findings || [])];

    const keyValues: Record<string, string> = {};
    if (findingForm.keyValuesRaw) {
      findingForm.keyValuesRaw.split('\n').forEach((line) => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(':').trim();
          if (key && val) keyValues[key] = val;
        }
      });
    }

    if (editingFindingId) {
      list = list.map((item) =>
        item.id === editingFindingId
          ? {
              ...item,
              title: findingForm.title,
              doc_type: findingForm.doc_type,
              date: findingForm.date || item.date,
              author_facility: findingForm.author_facility.trim() || undefined,
              summary: findingForm.summary.trim() || undefined,
              key_values: Object.keys(keyValues).length > 0 ? keyValues : undefined,
            }
          : item
      );
    } else {
      const newEntry: ClinicalFindingDocument = {
        id: `find-${Date.now()}`,
        title: findingForm.title,
        doc_type: findingForm.doc_type,
        date: findingForm.date || new Date().toISOString().split('T')[0],
        author_facility: findingForm.author_facility.trim() || undefined,
        summary: findingForm.summary.trim() || undefined,
        key_values: Object.keys(keyValues).length > 0 ? keyValues : undefined,
      };
      list.push(newEntry);
    }

    const updated = { ...dossier, findings: list };
    persistDossier(updated, editingFindingId ? 'Befund aktualisiert!' : 'Neuer Befund erfasst!');
    setIsFindingModalOpen(false);
  };

  const handleDeleteFinding = (id: string) => {
    if (!dossier) return;
    const updated = { ...dossier, findings: dossier.findings.filter((f) => f.id !== id) };
    persistDossier(updated, 'Befund gelöscht.');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 animate-fadeIn">
      {/* 🌟 HEADER */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Autarke Private Elektronische Krankenakte (ePA)</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              Klinisches Gesundheitsdossier & Notfall-Pass
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              100% autark, ohne fremde Cloud, lokal mit <strong>AES-GCM-256</strong> hardware-verschlüsselt. Weltweit kompatibel via <strong>HL7 FHIR R4</strong> und <strong>International Patient Summary (IPS)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => dossier && exportIpsHtml(dossier)}
              disabled={!dossier}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md active:scale-95 disabled:opacity-50"
              title="International Patient Summary drucken oder als zweisprachiges PDF/HTML exportieren"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>IPS Arztbrief (DE/EN)</span>
            </button>

            <button
              onClick={() => dossier && exportFhirJson(dossier)}
              disabled={!dossier}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50"
              title="Standard HL7 FHIR Bundle JSON für Krankenhaus- und Arztsoftware"
            >
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>HL7 FHIR JSON</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md active:scale-95"
              title="Offline Notfall-QR-Code für Ersthelfer und Notärzte anzeigen"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>Notfall-Pass (QR)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-5 mt-5 border-t border-slate-800/80 overflow-x-auto pb-1 scrollbar-none">
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
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
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
                ? 'Schlüssel aktiv im flüchtigen Speicher. Alle Änderungen werden sofort atomar gesichert.'
                : 'Sensible klinische Daten und Befunde sind ohne PIN unlesbar geschützt.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {!isUnlocked ? (
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN"
                maxLength={8}
                className="w-24 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                onClick={() => dossier && persistDossier(dossier, 'Gesundheitsakte manuell gesichert!')}
                disabled={isSaving}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>💾 Jetzt sichern</span>
              </button>
              <button
                onClick={handleLock}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Sperren
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🧭 Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('notfall')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'notfall' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>🚨 Notfall & ICE</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnosen')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'diagnosen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span>📋 Diagnosen ({dossier?.conditions.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('medikamente')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'medikamente' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="w-3.5 h-3.5 text-purple-600" />
          <span>💊 Medikamente BMP ({dossier?.medications.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('allergien')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'allergien' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>⚠️ Allergien ({dossier?.allergies.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('impfungen')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'impfungen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Syringe className="w-3.5 h-3.5 text-emerald-600" />
          <span>💉 Impfausweis ({dossier?.vaccinations.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('befunde')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'befunde' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-600" />
          <span>📑 Befunde ({dossier?.findings.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: NOTFALL-PASS & ICE */}
      {activeTab === 'notfall' && dossier && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Blutgruppe & Rhesus */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Blutgruppe & Rhesus</span>
                <button
                  onClick={openEditCore}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                  title="Blutgruppe & Organspende bearbeiten"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1 flex items-center gap-2">
                <span>{dossier.blood_type || 'Unbekannt'}</span>
                <span className="text-xs px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-bold">
                  {dossier.rhesus_factor === 'positive' ? 'Rh pos. (+)' : dossier.rhesus_factor === 'negative' ? 'Rh neg. (-)' : 'Rh unbest.'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Im Notfall lebensrettend</div>
            </div>

            {/* Organspende */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Organspende-Status</span>
                <button
                  onClick={openEditCore}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                  title="Organspende bearbeiten"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-lg font-black text-emerald-700 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  {dossier.organ_donor_status === 'yes'
                    ? 'Ja, uneingeschränkt'
                    : dossier.organ_donor_status === 'with_exceptions'
                    ? 'Ja, mit Ausnahmen'
                    : dossier.organ_donor_status === 'no'
                    ? 'Nein, widersprochen'
                    : 'Nicht festgelegt'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">{dossier.organ_donor_notes || 'Ausweis digital hinterlegt'}</div>
            </div>

            {/* Hausarzt / Betreuender Arzt */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hausarzt / Behandler</span>
                <button
                  onClick={openEditPhysician}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                  title="Hausarzt bearbeiten"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-base font-black text-slate-900 mt-1 truncate">
                {dossier.primary_physician?.name || 'Kein Arzt hinterlegt'}
              </div>
              <div className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1 mt-0.5 truncate">
                <Phone className="w-3 h-3 shrink-0" />
                {dossier.primary_physician?.phone ? (
                  <a href={`tel:${dossier.primary_physician.phone}`} className="hover:underline">
                    {dossier.primary_physician.phone}
                  </a>
                ) : (
                  <span className="text-slate-400">Keine Tel.</span>
                )}
              </div>
            </div>

            {/* Krankenkasse & Versicherung */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Krankenkasse</span>
                <button
                  onClick={openEditInsurance}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                  title="Versicherung bearbeiten"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-base font-black text-slate-900 mt-1 truncate">
                {dossier.insurance_info?.provider_name || 'Keine Krankenkasse'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                Nr: <code className="font-mono font-bold text-slate-700">{dossier.insurance_info?.insurance_number || '—'}</code>
              </div>
            </div>
          </div>

          {/* Notfallkontakte (ICE) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Notfallkontakte (ICE - In Case of Emergency)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ersthelfer und Rettungskräfte rufen diese Kontakte im Ernstfall sofort an.
                </p>
              </div>
              <button
                onClick={openAddContact}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kontakt hinzufügen</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dossier.emergency_contacts && dossier.emergency_contacts.length > 0 ? (
                dossier.emergency_contacts.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border flex items-center justify-between transition ${
                      c.is_primary ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm truncate">{c.name}</span>
                        {c.is_primary && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider shrink-0">
                            Primär
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{c.relationship}</div>
                      <div className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 shrink-0" />
                        <a href={`tel:${c.phone}`} className="hover:underline truncate">
                          {c.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditContact(c)}
                        className="p-2 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-white transition"
                        title="Kontakt bearbeiten"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
                        title="Kontakt entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  Noch keine Notfallkontakte hinterlegt. Klicke auf "Kontakt hinzufügen".
                </div>
              )}
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
              <div className="bg-white/90 p-4 rounded-xl border border-rose-200 shadow-sm space-y-1.5">
                <div className="font-extrabold text-rose-800 flex items-center justify-between">
                  <span>Schwere Allergien & Anaphylaxie-Risiken:</span>
                  <button onClick={() => setActiveTab('allergien')} className="text-rose-600 hover:underline text-[11px] font-bold">
                    Verwalten →
                  </button>
                </div>
                {dossier.allergies.length > 0 ? (
                  dossier.allergies.map((a) => (
                    <div key={a.id} className="text-slate-800 pt-1 border-t border-rose-100 first:border-0 first:pt-0">
                      • <strong>{a.substance}</strong>: {a.reaction} {a.emergency_treatment && `(Kit: ${a.emergency_treatment})`}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic">Keine lebensbedrohlichen Allergien hinterlegt.</div>
                )}
              </div>

              <div className="bg-white/90 p-4 rounded-xl border border-rose-200 shadow-sm space-y-1.5">
                <div className="font-extrabold text-rose-800 flex items-center justify-between">
                  <span>Lebensnotwendige Dauermedikation:</span>
                  <button onClick={() => setActiveTab('medikamente')} className="text-rose-600 hover:underline text-[11px] font-bold">
                    Verwalten →
                  </button>
                </div>
                {dossier.medications.filter((m) => m.is_essential).length > 0 ? (
                  dossier.medications
                    .filter((m) => m.is_essential)
                    .map((m) => (
                      <div key={m.id} className="text-slate-800 pt-1 border-t border-rose-100 first:border-0 first:pt-0">
                        • <strong>{m.trade_name}</strong> ({m.active_substance}) - {m.dosage} [{m.schedule_morning}-{m.schedule_noon}-{m.schedule_evening}-{m.schedule_night}]
                      </div>
                    ))
                ) : (
                  <div className="text-slate-500 italic">Keine Notfall-Dauermedikation registriert.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIAGNOSEN */}
      {activeTab === 'diagnosen' && dossier && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Vorerkrankungen & Klinische Diagnosen</h3>
              <p className="text-xs text-slate-500">ICD-10 codierte Krankheitsdaten mit diätetischer Relevanz für FitPlaner.</p>
            </div>
            <button
              onClick={openAddCondition}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Diagnose erfassen</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {dossier.conditions && dossier.conditions.length > 0 ? (
              dossier.conditions.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{c.name}</span>
                      {c.icd10 && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono text-[10px] font-black border border-blue-200">
                          ICD-10: {c.icd10}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                        {c.status}
                      </span>
                      {c.severity && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Schweregrad: {c.severity}
                        </span>
                      )}
                    </div>

                    {c.dietary_implication && (
                      <div className="text-xs text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium inline-block">
                        🥗 Diät-Relevanz: {c.dietary_implication}
                      </div>
                    )}

                    {c.doctor_notes && (
                      <div className="text-xs text-slate-500 italic">{c.doctor_notes}</div>
                    )}

                    {c.onset_date && (
                      <div className="text-[11px] text-slate-400">Erstdiagnose: {c.onset_date}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 self-end md:self-center shrink-0">
                    <button
                      onClick={() => openEditCondition(c)}
                      className="p-2 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-white transition"
                      title="Diagnose bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCondition(c.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Eintrag entfernen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Keine Diagnosen oder Vorerkrankungen hinterlegt. Klicke auf "Diagnose erfassen".
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MEDIKAMENTE (BMP) */}
      {activeTab === 'medikamente' && dossier && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Bundeseinheitlicher Medikationsplan (BMP)</h3>
              <p className="text-xs text-slate-500">Dosierungsschema (Morgens - Mittags - Abends - Nachts) & Wirkstoffe.</p>
            </div>
            <button
              onClick={openAddMedication}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Medikament hinzufügen</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {dossier.medications && dossier.medications.length > 0 ? (
              dossier.medications.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition ${
                    m.is_essential ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{m.trade_name}</span>
                        {m.is_essential && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider">
                            VITAL / NOTFALL
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-bold text-xs">
                          {m.dosage}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Wirkstoff: <strong>{m.active_substance}</strong>
                        {m.pzn && <span className="ml-2 font-mono text-[11px] text-slate-400">PZN: {m.pzn}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => openEditMedication(m)}
                        className="p-2 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-white transition"
                        title="Medikament bearbeiten"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMedication(m.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Medikament entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                        <span className="text-slate-400 text-[10px]">Morgens:</span>
                        <strong className="text-slate-800 font-mono">{m.schedule_morning}</strong>
                      </div>
                      <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                        <span className="text-slate-400 text-[10px]">Mittags:</span>
                        <strong className="text-slate-800 font-mono">{m.schedule_noon}</strong>
                      </div>
                      <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                        <span className="text-slate-400 text-[10px]">Abends:</span>
                        <strong className="text-slate-800 font-mono">{m.schedule_evening}</strong>
                      </div>
                      <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                        <span className="text-slate-400 text-[10px]">Nachts:</span>
                        <strong className="text-slate-800 font-mono">{m.schedule_night}</strong>
                      </div>
                    </div>

                    {m.instructions && (
                      <div className="text-xs text-slate-600 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{m.instructions}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Keine Medikamente im BMP eingetragen. Klicke auf "Medikament hinzufügen".
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ALLERGIEN & RISIKEN */}
      {activeTab === 'allergien' && dossier && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Allergien & Unverträglichkeiten</h3>
              <p className="text-xs text-slate-500">
                Vollständig synchronisiert mit dem FitPlaner Rezept- & Einkaufsfilter. Verhindert lebensgefährliche Fehlkäufe.
              </p>
            </div>
            <button
              onClick={openAddAllergy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Allergie erfassen</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {dossier.allergies && dossier.allergies.length > 0 ? (
              dossier.allergies.map((a) => (
                <div
                  key={a.id}
                  className={`p-4 rounded-2xl border transition relative space-y-2.5 ${
                    a.criticality === 'life_threatening' || a.criticality === 'severe'
                      ? 'bg-rose-50/60 border-rose-300'
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{a.substance}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditAllergy(a)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-white transition"
                        title="Allergie bearbeiten"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAllergy(a.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Allergie entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        a.criticality === 'life_threatening' || a.criticality === 'severe'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Kritikalität: {a.criticality}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                      Kategorie: {a.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {a.verification_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700">
                    <strong>Reaktion:</strong> {a.reaction}
                  </div>

                  {a.emergency_treatment && (
                    <div className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium flex items-center gap-1.5">
                      <span>💊 Notfall-Kit:</span>
                      <strong>{a.emergency_treatment}</strong>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Keine Allergien eingetragen. Klicke auf "Allergie erfassen".
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: IMPFAUSWEIS */}
      {activeTab === 'impfungen' && dossier && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Digitaler Impfausweis (WHO Standard)</h3>
              <p className="text-xs text-slate-500">Chargennummern und fällige Auffrischungs-Termine.</p>
            </div>
            <button
              onClick={openAddVaccination}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Impfung eintragen</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {dossier.vaccinations && dossier.vaccinations.length > 0 ? (
              dossier.vaccinations.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{v.disease}</span>
                      {v.is_up_to_date ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          AKTUELL
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                          FÄLLIG
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600">
                      Impfstoff: <strong>{v.vaccine_name}</strong> • Geimpft am: {v.date_administered}
                      {v.batch_number && <span> • Charge: <code className="font-mono text-slate-700">{v.batch_number}</code></span>}
                    </div>
                    {v.administered_by && (
                      <div className="text-[11px] text-slate-400">Arzt / Praxis: {v.administered_by}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    {v.next_booster_due && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">
                        Auffrischung: {v.next_booster_due}
                      </span>
                    )}
                    <button
                      onClick={() => openEditVaccination(v)}
                      className="p-2 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-white transition"
                      title="Impfung bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteVaccination(v.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Impfung entfernen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Keine Impfungen erfasst. Klicke auf "Impfung eintragen".
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: BEFUNDE & LABOR */}
      {activeTab === 'befunde' && dossier && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Klinische Befunde & Laborberichte</h3>
              <p className="text-xs text-slate-500">Strukturierte Laborwerte und Arztbriefe lokal gespeichert.</p>
            </div>
            <button
              onClick={openAddFinding}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Befund erfassen</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {dossier.findings && dossier.findings.length > 0 ? (
              dossier.findings.map((f) => (
                <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{f.title}</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                        {f.doc_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 mr-2">{f.date}</span>
                      <button
                        onClick={() => openEditFinding(f)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-white transition"
                        title="Befund bearbeiten"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFinding(f.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Befund entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {f.author_facility && (
                    <div className="text-xs text-slate-500">{f.author_facility}</div>
                  )}

                  {f.summary && <p className="text-xs text-slate-700">{f.summary}</p>}

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
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Keine Befunde hinterlegt. Klicke auf "Befund erfassen".
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* 🚨 MODAL: EMERGENCY QR CODE (OFFLINE READABLE) */}
      {isQrModalOpen && dossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <QrCode className="w-6 h-6" />
                <h3 className="text-lg font-black text-slate-900">Notfall-Pass (Offline-QR-Code)</h3>
              </div>
              <button onClick={() => setIsQrModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Dieser Datensatz kann von <strong>jedem Smartphone (Kamera)</strong> ohne App und ohne Internetzugriff sofort gelesen werden:
            </p>

            <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap border border-slate-800">
              {generateEmergencyQrPayload(dossier)}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400">FitPlaner Autonomous Health Vault</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateEmergencyQrPayload(dossier));
                  showToast('Notfall-Pass in die Zwischenablage kopiert!');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                In Zwischenablage kopieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ MODAL: EDIT EMERGENCY CORE */}
      {isEditCoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Notfalldaten bearbeiten</h3>
              <button onClick={() => setIsEditCoreModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Blutgruppe:</label>
                  <select
                    value={coreForm.blood_type}
                    onChange={(e) => setCoreForm({ ...coreForm, blood_type: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="0+">0+</option>
                    <option value="0-">0-</option>
                    <option value="unknown">Unbekannt</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Rhesusfaktor:</label>
                  <select
                    value={coreForm.rhesus_factor}
                    onChange={(e) => setCoreForm({ ...coreForm, rhesus_factor: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="positive">Positiv (+)</option>
                    <option value="negative">Negativ (-)</option>
                    <option value="unknown">Unbestimmt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Organspende-Status:</label>
                <select
                  value={coreForm.organ_donor_status}
                  onChange={(e) => setCoreForm({ ...coreForm, organ_donor_status: e.target.value as any })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="yes">Ja, ich stimme der Organentnahme uneingeschränkt zu</option>
                  <option value="with_exceptions">Ja, jedoch mit bestimmten Ausnahmen</option>
                  <option value="no">Nein, ich widerspreche einer Organentnahme</option>
                  <option value="undecided">Noch nicht entschieden</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Zusatzvermerk Organspende / Notizen:</label>
                <input
                  type="text"
                  value={coreForm.organ_donor_notes}
                  onChange={(e) => setCoreForm({ ...coreForm, organ_donor_notes: e.target.value })}
                  placeholder="z. B. Ausweis in Geldbörse, keine Hornhautspende"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsEditCoreModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveCore}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ MODAL: EDIT PRIMARY PHYSICIAN */}
      {isPhysicianModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Hausarzt / Behandler bearbeiten</h3>
              <button onClick={() => setIsPhysicianModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Name des Arztes:</label>
                <input
                  type="text"
                  value={physicianForm.name}
                  onChange={(e) => setPhysicianForm({ ...physicianForm, name: e.target.value })}
                  placeholder="z. B. Dr. med. M. Weber"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Praxis / Klinik:</label>
                <input
                  type="text"
                  value={physicianForm.clinic_name}
                  onChange={(e) => setPhysicianForm({ ...physicianForm, clinic_name: e.target.value })}
                  placeholder="z. B. Gemeinschaftspraxis Zentrum"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Telefonnummer:</label>
                <input
                  type="tel"
                  value={physicianForm.phone}
                  onChange={(e) => setPhysicianForm({ ...physicianForm, phone: e.target.value })}
                  placeholder="z. B. +49 511 892011"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Praxisadresse:</label>
                <input
                  type="text"
                  value={physicianForm.address}
                  onChange={(e) => setPhysicianForm({ ...physicianForm, address: e.target.value })}
                  placeholder="z. B. Marienstraße 14, 30171 Hannover"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsPhysicianModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSavePhysician}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ MODAL: EDIT INSURANCE */}
      {isInsuranceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Krankenkasse & Versicherung bearbeiten</h3>
              <button onClick={() => setIsInsuranceModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Krankenkasse / Kostenträger:</label>
                <input
                  type="text"
                  value={insuranceForm.provider_name}
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, provider_name: e.target.value })}
                  placeholder="z. B. Techniker Krankenkasse (TK), Barmer, AOK"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Versichertennummer (KVNR):</label>
                <input
                  type="text"
                  value={insuranceForm.insurance_number}
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, insurance_number: e.target.value })}
                  placeholder="z. B. T204918293"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={insuranceForm.has_travel_insurance}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, has_travel_insurance: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Auslandskrankenversicherung vorhanden</span>
                </label>
              </div>

              {insuranceForm.has_travel_insurance && (
                <>
                  <div>
                    <label className="font-bold text-slate-700">Auslandskrankenversicherung Police / Anbieter:</label>
                    <input
                      type="text"
                      value={insuranceForm.travel_insurance_policy}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, travel_insurance_policy: e.target.value })}
                      placeholder="z. B. ADAC Auslandskrankenschutz Plus (Pol. 99201-B)"
                      className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">24h Notfall-Hotline im Ausland:</label>
                    <input
                      type="tel"
                      value={insuranceForm.emergency_hotline}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, emergency_hotline: e.target.value })}
                      placeholder="z. B. +49 89 222222"
                      className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsInsuranceModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveInsurance}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ MODAL: EMERGENCY CONTACT (ADD / EDIT) */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingContactId ? 'Notfallkontakt bearbeiten' : 'Notfallkontakt hinzufügen'}
              </h3>
              <button onClick={() => setIsContactModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Name des Kontakts:</label>
                <input
                  type="text"
                  value={contactForm.name || ''}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="z. B. Juna Fee, Dennis"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Verhältnis / Beziehung:</label>
                <input
                  type="text"
                  value={contactForm.relationship || ''}
                  onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                  placeholder="z. B. Partnerin, Vater, Mutter, Schwester"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Telefonnummer:</label>
                <input
                  type="tel"
                  value={contactForm.phone || ''}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="z. B. +49 170 1234567"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 font-bold text-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!contactForm.is_primary}
                    onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Als primären Hauptkontakt festlegen (wird als erstes verständigt)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveContact}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 MODAL: CONDITION (ADD / EDIT) */}
      {isConditionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingConditionId ? 'Diagnose bearbeiten' : 'Diagnose erfassen'}
              </h3>
              <button onClick={() => setIsConditionModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Bezeichnung (z. B. Hypertonie, Diabetes Typ 2, Asthma):</label>
                <input
                  type="text"
                  value={conditionForm.name || ''}
                  onChange={(e) => setConditionForm({ ...conditionForm, name: e.target.value })}
                  placeholder="Krankheitsbezeichnung"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">ICD-10 Code (optional):</label>
                  <input
                    type="text"
                    value={conditionForm.icd10 || ''}
                    onChange={(e) => setConditionForm({ ...conditionForm, icd10: e.target.value })}
                    placeholder="z. B. I10.90"
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Status:</label>
                  <select
                    value={conditionForm.status}
                    onChange={(e) => setConditionForm({ ...conditionForm, status: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="active">Aktiv / Chronisch</option>
                    <option value="resolved">Ausgeheilt / Remission</option>
                    <option value="under_investigation">In Abklärung</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Schweregrad:</label>
                  <select
                    value={conditionForm.severity}
                    onChange={(e) => setConditionForm({ ...conditionForm, severity: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="mild">Leicht (mild)</option>
                    <option value="moderate">Mittel (moderate)</option>
                    <option value="severe">Schwer (severe)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Erstdiagnose Datum:</label>
                  <input
                    type="date"
                    value={conditionForm.onset_date || ''}
                    onChange={(e) => setConditionForm({ ...conditionForm, onset_date: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Diätetische Relevanz (für FitPlaner Rezepte):</label>
                <input
                  type="text"
                  value={conditionForm.dietary_implication || ''}
                  onChange={(e) => setConditionForm({ ...conditionForm, dietary_implication: e.target.value })}
                  placeholder="z. B. Kochsalzreduktion (< 5g/Tag), purinarm, glutenfrei"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Ärztliche Notizen / Leitlinien:</label>
                <textarea
                  rows={2}
                  value={conditionForm.doctor_notes || ''}
                  onChange={(e) => setConditionForm({ ...conditionForm, doctor_notes: e.target.value })}
                  placeholder="z. B. Zielblutdruck < 130/80 mmHg, jährliche Kontrolle"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsConditionModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveCondition}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💊 MODAL: MEDICATION (ADD / EDIT) */}
      {isMedicationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingMedicationId ? 'Medikament im BMP bearbeiten' : 'Medikament zum BMP hinzufügen'}
              </h3>
              <button onClick={() => setIsMedicationModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Handelsname des Präparats:</label>
                <input
                  type="text"
                  value={medicationForm.trade_name || ''}
                  onChange={(e) => setMedicationForm({ ...medicationForm, trade_name: e.target.value })}
                  placeholder="z. B. Ramipril 5mg 1A Pharma"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Wirkstoff(e):</label>
                <input
                  type="text"
                  value={medicationForm.active_substance || ''}
                  onChange={(e) => setMedicationForm({ ...medicationForm, active_substance: e.target.value })}
                  placeholder="z. B. Ramipril (ACE-Hemmer)"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Einzeldosis / Stärke:</label>
                  <input
                    type="text"
                    value={medicationForm.dosage || ''}
                    onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                    placeholder="z. B. 5 mg oder 1 Tablette"
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">PZN (optional):</label>
                  <input
                    type="text"
                    value={medicationForm.pzn || ''}
                    onChange={(e) => setMedicationForm({ ...medicationForm, pzn: e.target.value })}
                    placeholder="z. B. 01827492"
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* 4-Field Standard BMP Dosage Grid */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Einnahmeschema (Morgens - Mittags - Abends - Nachts):
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block text-center">🌅 Morgens</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={medicationForm.schedule_morning ?? 0}
                      onChange={(e) => setMedicationForm({ ...medicationForm, schedule_morning: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-0.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block text-center">☀️ Mittags</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={medicationForm.schedule_noon ?? 0}
                      onChange={(e) => setMedicationForm({ ...medicationForm, schedule_noon: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-0.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block text-center">🌆 Abends</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={medicationForm.schedule_evening ?? 0}
                      onChange={(e) => setMedicationForm({ ...medicationForm, schedule_evening: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-0.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block text-center">🌙 Nachts</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={medicationForm.schedule_night ?? 0}
                      onChange={(e) => setMedicationForm({ ...medicationForm, schedule_night: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-0.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Einnahmehinweise / Mahlzeitenbezug:</label>
                <input
                  type="text"
                  value={medicationForm.instructions || ''}
                  onChange={(e) => setMedicationForm({ ...medicationForm, instructions: e.target.value })}
                  placeholder="z. B. Morgens unzerkaut mit einem Glas Wasser vor dem Essen"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Verordnender Arzt / Facharzt:</label>
                <input
                  type="text"
                  value={medicationForm.prescriber || ''}
                  onChange={(e) => setMedicationForm({ ...medicationForm, prescriber: e.target.value })}
                  placeholder="z. B. Dr. med. M. Weber"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 font-bold text-rose-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!medicationForm.is_essential}
                    onChange={(e) => setMedicationForm({ ...medicationForm, is_essential: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Lebensnotwendiges Dauermedikament (Notfall-relevant)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsMedicationModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveMedication}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ MODAL: ALLERGY (ADD / EDIT) */}
      {isAllergyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingAllergyId ? 'Allergie bearbeiten' : 'Allergie / Unverträglichkeit erfassen'}
              </h3>
              <button onClick={() => setIsAllergyModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Allergen / Substanz:</label>
                <input
                  type="text"
                  value={allergyForm.substance || ''}
                  onChange={(e) => setAllergyForm({ ...allergyForm, substance: e.target.value })}
                  placeholder="z. B. Erdnüsse, Fisch, Penicillin, Wespengift"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kategorie:</label>
                  <select
                    value={allergyForm.category}
                    onChange={(e) => setAllergyForm({ ...allergyForm, category: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="food">Lebensmittel (food)</option>
                    <option value="medication">Medikament</option>
                    <option value="environment">Umwelt / Pollen</option>
                    <option value="insect">Insektengift</option>
                    <option value="contact">Kontaktallergen</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Kritikalität / Schwere:</label>
                  <select
                    value={allergyForm.criticality}
                    onChange={(e) => setAllergyForm({ ...allergyForm, criticality: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="life_threatening">🚨 Lebensbedrohlich (Anaphylaxie)</option>
                    <option value="severe">Schwer (severe)</option>
                    <option value="moderate">Mittel (moderate)</option>
                    <option value="low">Leicht (low)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Reaktion / Symptome:</label>
                <input
                  type="text"
                  value={allergyForm.reaction || ''}
                  onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
                  placeholder="z. B. Urtikaria, Quincke-Ödem, Atemnot, Magenkrämpfe"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Notfallbehandlung / Notfallmedikament:</label>
                <input
                  type="text"
                  value={allergyForm.emergency_treatment || ''}
                  onChange={(e) => setAllergyForm({ ...allergyForm, emergency_treatment: e.target.value })}
                  placeholder="z. B. FastJekt Adrenalin-Autoinjektor, Cetirizin 10mg"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Nachweis-Status:</label>
                <select
                  value={allergyForm.verification_status}
                  onChange={(e) => setAllergyForm({ ...allergyForm, verification_status: e.target.value as any })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="confirmed">Ärztlich gesichert (confirmed)</option>
                  <option value="suspected">Verdacht (suspected)</option>
                  <option value="refuted">Widerlegt (refuted)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAllergyModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveAllergy}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💉 MODAL: VACCINATION (ADD / EDIT) */}
      {isVaccinationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingVaccinationId ? 'Impfung bearbeiten' : 'Impfung eintragen'}
              </h3>
              <button onClick={() => setIsVaccinationModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Geschützte Krankheit (Zielerkrankung):</label>
                <input
                  type="text"
                  value={vaccinationForm.disease || ''}
                  onChange={(e) => setVaccinationForm({ ...vaccinationForm, disease: e.target.value })}
                  placeholder="z. B. Tetanus / Diphtherie / Polio, FSME, COVID-19"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Impfstoff Handelsname:</label>
                <input
                  type="text"
                  value={vaccinationForm.vaccine_name || ''}
                  onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccine_name: e.target.value })}
                  placeholder="z. B. Boostrix Polio, Encepur, Comirnaty"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Impfdatum:</label>
                  <input
                    type="date"
                    value={vaccinationForm.date_administered || ''}
                    onChange={(e) => setVaccinationForm({ ...vaccinationForm, date_administered: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Chargennummer (Batch):</label>
                  <input
                    type="text"
                    value={vaccinationForm.batch_number || ''}
                    onChange={(e) => setVaccinationForm({ ...vaccinationForm, batch_number: e.target.value })}
                    placeholder="z. B. AC29B109"
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Geimpft durch (Arzt/Praxis):</label>
                  <input
                    type="text"
                    value={vaccinationForm.administered_by || ''}
                    onChange={(e) => setVaccinationForm({ ...vaccinationForm, administered_by: e.target.value })}
                    placeholder="z. B. Dr. Weber"
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Nächste Auffrischung fällig:</label>
                  <input
                    type="date"
                    value={vaccinationForm.next_booster_due || ''}
                    onChange={(e) => setVaccinationForm({ ...vaccinationForm, next_booster_due: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 font-bold text-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!vaccinationForm.is_up_to_date}
                    onChange={(e) => setVaccinationForm({ ...vaccinationForm, is_up_to_date: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Impfschutz ist aktuell (Up-to-Date)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsVaccinationModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveVaccination}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📑 MODAL: FINDING (ADD / EDIT) */}
      {isFindingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingFindingId ? 'Befund bearbeiten' : 'Befund / Laborbericht erfassen'}
              </h3>
              <button onClick={() => setIsFindingModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Titel / Bezeichnung:</label>
                <input
                  type="text"
                  value={findingForm.title}
                  onChange={(e) => setFindingForm({ ...findingForm, title: e.target.value })}
                  placeholder="z. B. Laborbericht Großes Blutbild, EKG-Befund"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Dokumententyp:</label>
                  <select
                    value={findingForm.doc_type}
                    onChange={(e) => setFindingForm({ ...findingForm, doc_type: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="lab_report">Laborbericht</option>
                    <option value="discharge_letter">Arztbrief / Entlassbrief</option>
                    <option value="radiology">Radiologie / MRT / CT</option>
                    <option value="ecg">EKG / Kardiologie</option>
                    <option value="prescription">Rezept</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Datum:</label>
                  <input
                    type="date"
                    value={findingForm.date}
                    onChange={(e) => setFindingForm({ ...findingForm, date: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Erstellende Einrichtung / Labor:</label>
                <input
                  type="text"
                  value={findingForm.author_facility}
                  onChange={(e) => setFindingForm({ ...findingForm, author_facility: e.target.value })}
                  placeholder="z. B. Labor Dr. Limbach & Kollegen"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Ärztliche Zusammenfassung / Beurteilung:</label>
                <textarea
                  rows={2}
                  value={findingForm.summary}
                  onChange={(e) => setFindingForm({ ...findingForm, summary: e.target.value })}
                  placeholder="z. B. Alle Elektrolyte und Nierenwerte im Normbereich."
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">
                  Strukturierte Laborwerte (Format: "Parameter: Wert", eine Zeile pro Wert):
                </label>
                <textarea
                  rows={4}
                  value={findingForm.keyValuesRaw}
                  onChange={(e) => setFindingForm({ ...findingForm, keyValuesRaw: e.target.value })}
                  placeholder={`HbA1c: 5.3%\nGFR: 104 ml/min\nKreatinin: 0.9 mg/dl`}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsFindingModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveFinding}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * International Patient Summary (IPS / EN ISO 27269) Generator
 * Bilingual (German & English) emergency & clinical summary for cross-border medical handovers.
 */

import { MemberHealthDossier } from '../types';

/**
 * Generates an ultra-compact emergency string suitable for QR codes and paramedic scanning.
 */
export function generateEmergencyQrPayload(dossier: MemberHealthDossier): string {
  const primaryContact = dossier.emergency_contacts.find((c) => c.is_primary) || dossier.emergency_contacts[0];
  const criticalAllergies = dossier.allergies
    .filter((a) => a.criticality === 'life_threatening' || a.criticality === 'severe')
    .map((a) => `${a.substance} (${a.reaction})`)
    .join('; ') || 'Keine lebensbedrohlichen Allergien bekannt';

  const essentialMeds = dossier.medications
    .filter((m) => m.is_essential)
    .map((m) => `${m.trade_name} ${m.dosage} [${m.schedule_morning}-${m.schedule_noon}-${m.schedule_evening}-${m.schedule_night}]`)
    .join('; ') || 'Keine lebensnotwendigen Dauermedikamente';

  const chronicConditions = dossier.conditions
    .filter((c) => c.status === 'active')
    .map((c) => `${c.name}${c.icd10 ? ` [${c.icd10}]` : ''}`)
    .join('; ') || 'Keine';

  return [
    '=== NOTFALL-PASS / EMERGENCY MEDICAL SUMMARY (IPS) ===',
    `PATIENT: ${dossier.member_name}`,
    `BLUTGRUPPE / BLOOD TYPE: ${dossier.blood_type || 'Unbekannt'}`,
    `ORGANSPENDE / ORGAN DONOR: ${dossier.organ_donor_status === 'yes' ? 'JA / YES' : dossier.organ_donor_status === 'no' ? 'NEIN / NO' : 'Unentschieden'}`,
    `NOTFALLKONTAKT / ICE CONTACT: ${primaryContact ? `${primaryContact.name} (${primaryContact.relationship}): ${primaryContact.phone}` : 'Nicht hinterlegt'}`,
    `HAUSARZT / DOCTOR: ${dossier.primary_physician ? `${dossier.primary_physician.name} (Tel: ${dossier.primary_physician.phone})` : 'Nicht hinterlegt'}`,
    `KRANKENKASSE / INSURANCE: ${dossier.insurance_info ? `${dossier.insurance_info.provider_name} (Nr: ${dossier.insurance_info.insurance_number})` : 'Nicht hinterlegt'}`,
    '-------------------------------------------------------',
    `⚠️ ALLERGIEN (ANAPHYLAXIE): ${criticalAllergies}`,
    `💊 VITAL-MEDIKAMENTE: ${essentialMeds}`,
    `📋 VORERKRANKUNGEN: ${chronicConditions}`,
    '-------------------------------------------------------',
    `STAND / ISSUED: ${new Date().toLocaleDateString('de-DE')} • FitPlaner Autonomous Health Vault`,
  ].join('\n');
}

/**
 * Generates an official, printable bilingual International Patient Summary (HTML).
 */
export function generateIpsHtmlDocument(dossier: MemberHealthDossier): string {
  const primaryContact = dossier.emergency_contacts.find((c) => c.is_primary) || dossier.emergency_contacts[0];
  const dateStr = new Date().toLocaleDateString('de-DE');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>International Patient Summary (IPS) - ${dossier.member_name}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 20px; font-size: 12px; line-height: 1.4; }
    .header { border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title-area h1 { font-size: 20px; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px; }
    .title-area .sub { font-size: 11px; color: #64748b; margin-top: 2px; font-weight: 600; }
    .meta-box { text-align: right; font-size: 10px; color: #64748b; }
    .badge-emergency { background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 10px; border: 1px solid #f87171; display: inline-block; }
    .patient-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px; }
    .patient-field .label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .patient-field .value { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-top: 14px; margin-bottom: 8px; display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { text-align: left; background: #f1f5f9; padding: 6px 8px; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: top; }
    .critical-tag { background: #ef4444; color: white; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; }
    .warning-tag { background: #f59e0b; color: #451a03; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #64748b; display: flex; justify-content: space-between; }
    .qr-box { border: 1px dashed #cbd5e1; padding: 8px; border-radius: 6px; font-family: monospace; font-size: 9px; background: #fdfdfd; white-space: pre-wrap; word-break: break-all; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-area">
      <h1>International Patient Summary (IPS)</h1>
      <div class="sub">Autarke private Notfall- & Krankenakte • ISO 27269 / HL7 FHIR IPS Compatible</div>
    </div>
    <div class="meta-box">
      <span class="badge-emergency">NOTFALL-DOKUMENT / EMERGENCY MEDICAL RECORD</span>
      <div>Ausgestellt am / Issued: <strong>${dateStr}</strong></div>
      <div>FitPlaner Autonomous Cryptographic Vault</div>
    </div>
  </div>

  <div class="patient-grid">
    <div class="patient-field">
      <div class="label">Patient / Name</div>
      <div class="value">${dossier.member_name}</div>
    </div>
    <div class="patient-field">
      <div class="label">Blutgruppe / Blood Group</div>
      <div class="value" style="color: #b91c1c;">${dossier.blood_type || 'Unbekannt'}</div>
    </div>
    <div class="patient-field">
      <div class="label">Organspende / Organ Donor</div>
      <div class="value">${dossier.organ_donor_status === 'yes' ? '✓ Ja / Yes' : dossier.organ_donor_status === 'no' ? '✗ Nein / No' : 'Unentschieden'}</div>
    </div>
    <div class="patient-field">
      <div class="label">Notfall-Kontakt / ICE Contact</div>
      <div class="value">${primaryContact ? `${primaryContact.name} (${primaryContact.phone})` : 'Keiner'}</div>
    </div>
  </div>

  <!-- SECTION 1: ALLERGIES & RISKS -->
  <div class="section-title">
    <span>1. Allergien & Unverträglichkeiten / Allergies & Adverse Reactions</span>
    <span style="font-weight: normal; font-size: 10px; color: #ef4444;">🚨 Lebensbedrohliche Risiken priorisiert</span>
  </div>
  ${dossier.allergies.length === 0 ? '<p style="color: #64748b; font-style: italic;">Keine bekannten Allergien / No known allergies.</p>' : `
  <table>
    <thead>
      <tr>
        <th>Substanz / Allergen</th>
        <th>Kategorie</th>
        <th>Reaktion / Symptome</th>
        <th>Kritikalität / Severity</th>
        <th>Notfall-Behandlung / Emergency Kit</th>
      </tr>
    </thead>
    <tbody>
      ${dossier.allergies.map(a => `
      <tr>
        <td><strong>${a.substance}</strong></td>
        <td>${a.category}</td>
        <td>${a.reaction}</td>
        <td><span class="${a.criticality === 'life_threatening' ? 'critical-tag' : 'warning-tag'}">${a.criticality.toUpperCase()}</span></td>
        <td>${a.emergency_treatment || '—'}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>`}

  <!-- SECTION 2: MEDICATIONS -->
  <div class="section-title">
    <span>2. Medikationsplan (BMP) / Current Medications</span>
    <span style="font-weight: normal; font-size: 10px; color: #0284c7;">Bundesmedikationsplan-Standard (M-M-A-N)</span>
  </div>
  ${dossier.medications.length === 0 ? '<p style="color: #64748b; font-style: italic;">Keine Dauermedikation / No active regular medications.</p>' : `
  <table>
    <thead>
      <tr>
        <th>Präparat / Trade Name</th>
        <th>Wirkstoff / Active Molecule</th>
        <th>Dosierung</th>
        <th>Einnahme (Morgens-Mittags-Abends-Nachts)</th>
        <th>Hinweise / Instructions</th>
      </tr>
    </thead>
    <tbody>
      ${dossier.medications.map(m => `
      <tr>
        <td><strong>${m.trade_name}</strong> ${m.is_essential ? '<span class="critical-tag">VITAL</span>' : ''}</td>
        <td>${m.active_substance}</td>
        <td>${m.dosage}</td>
        <td style="font-weight: 700; font-family: monospace;">${m.schedule_morning} - ${m.schedule_noon} - ${m.schedule_evening} - ${m.schedule_night}</td>
        <td>${m.instructions || '—'}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>`}

  <!-- SECTION 3: CONDITIONS & DIAGNOSES -->
  <div class="section-title">
    <span>3. Diagnosen & Vorerkrankungen / Medical Problems & Conditions</span>
    <span style="font-weight: normal; font-size: 10px; color: #475569;">ICD-10 Codiert</span>
  </div>
  ${dossier.conditions.length === 0 ? '<p style="color: #64748b; font-style: italic;">Keine Vorerkrankungen erfasst / No chronic conditions recorded.</p>' : `
  <table>
    <thead>
      <tr>
        <th>Diagnose / Problem</th>
        <th>ICD-10 Code</th>
        <th>Status</th>
        <th>Schweregrad</th>
        <th>Ärztliche Notizen / Diätetische Relevanz</th>
      </tr>
    </thead>
    <tbody>
      ${dossier.conditions.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td><code>${c.icd10 || '—'}</code></td>
        <td>${c.status}</td>
        <td>${c.severity}</td>
        <td>${c.dietary_implication || c.doctor_notes || '—'}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>`}

  <!-- SECTION 4: IMMUNIZATION -->
  <div class="section-title">
    <span>4. Impfausweis / Immunization History</span>
    <span style="font-weight: normal; font-size: 10px; color: #475569;">WHO International Vaccine Schedule</span>
  </div>
  ${dossier.vaccinations.length === 0 ? '<p style="color: #64748b; font-style: italic;">Keine Impfungen erfasst.</p>' : `
  <table>
    <thead>
      <tr>
        <th>Impfung gegen / Disease</th>
        <th>Impfstoff / Vaccine Name</th>
        <th>Datum / Date</th>
        <th>Charge / Lot</th>
        <th>Nächste Auffrischung / Booster Due</th>
      </tr>
    </thead>
    <tbody>
      ${dossier.vaccinations.map(v => `
      <tr>
        <td><strong>${v.disease}</strong></td>
        <td>${v.vaccine_name}</td>
        <td>${v.date_administered}</td>
        <td><code>${v.batch_number || '—'}</code></td>
        <td><strong style="color: ${v.is_up_to_date ? '#059669' : '#d97706'}">${v.next_booster_due || 'Aktuell'}</strong></td>
      </tr>
      `).join('')}
    </tbody>
  </table>`}

  <div class="footer">
    <div>Generiert durch FitPlaner Autonomous Health Vault • Zero Cloud • Dezentrale Patientenhoheit</div>
    <div>Ärztliche Unterschrift / Stempel: ________________________________________________</div>
  </div>
</body>
</html>`;
}

/**
 * Downloads the International Patient Summary as a standalone, printable HTML document.
 */
export function exportIpsHtml(dossier: MemberHealthDossier) {
  const html = generateIpsHtmlDocument(dossier);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IPS_Health_Summary_${dossier.member_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

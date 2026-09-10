/**
 * HL7 FHIR (Fast Healthcare Interoperability Resources) R4 Bundle Converter
 * Generates internationally compliant medical exchange JSON for hospitals, clinics & doctors.
 */

import { MemberHealthDossier } from '../types';

export interface FhirResource {
  resourceType: string;
  id: string;
  [key: string]: any;
}

export interface FhirBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'document' | 'collection';
  timestamp: string;
  total: number;
  entry: Array<{
    fullUrl: string;
    resource: FhirResource;
  }>;
}

export function convertDossierToFhirBundle(dossier: MemberHealthDossier): FhirBundle {
  const patientId = `patient-${dossier.member_id}`;
  const now = new Date().toISOString();
  const entries: Array<{ fullUrl: string; resource: FhirResource }> = [];

  // 1. Patient Resource
  const patientResource: FhirResource = {
    resourceType: 'Patient',
    id: patientId,
    active: true,
    name: [
      {
        use: 'official',
        text: dossier.member_name,
        family: dossier.member_name.split(' ').slice(1).join(' ') || dossier.member_name,
        given: [dossier.member_name.split(' ')[0]],
      },
    ],
    extension: [
      {
        url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodType',
        valueString: dossier.blood_type,
      },
      {
        url: 'http://hl7.org/fhir/StructureDefinition/patient-organDonor',
        valueBoolean: dossier.organ_donor_status === 'yes',
      },
    ],
    contact: dossier.emergency_contacts.map((c) => ({
      relationship: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
              code: c.is_primary ? 'EP' : 'C',
              display: c.relationship,
            },
          ],
        },
      ],
      name: { text: c.name },
      telecom: [
        {
          system: 'phone',
          value: c.phone,
          use: 'mobile',
        },
      ],
    })),
  };
  entries.push({ fullUrl: `urn:uuid:${patientId}`, resource: patientResource });

  // 2. AllergyIntolerance Resources
  for (const [idx, a] of dossier.allergies.entries()) {
    const allergyId = `allergy-${dossier.member_id}-${idx + 1}`;
    const allergyResource: FhirResource = {
      resourceType: 'AllergyIntolerance',
      id: allergyId,
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
            code: 'active',
            display: 'Active',
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
            code: a.verification_status || 'confirmed',
          },
        ],
      },
      category: [a.category || 'food'],
      criticality: a.criticality === 'life_threatening' ? 'high' : 'low',
      code: {
        text: a.substance,
      },
      patient: {
        reference: `urn:uuid:${patientId}`,
        display: dossier.member_name,
      },
      reaction: [
        {
          manifestation: [
            {
              text: a.reaction,
            },
          ],
          severity: a.criticality === 'life_threatening' ? 'severe' : 'moderate',
        },
      ],
      note: a.emergency_treatment ? [{ text: `Notfall-Kit: ${a.emergency_treatment}` }] : undefined,
    };
    entries.push({ fullUrl: `urn:uuid:${allergyId}`, resource: allergyResource });
  }

  // 3. Condition Resources (Diagnoses / ICD-10)
  for (const [idx, c] of dossier.conditions.entries()) {
    const condId = `condition-${dossier.member_id}-${idx + 1}`;
    const condResource: FhirResource = {
      resourceType: 'Condition',
      id: condId,
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: c.status || 'active',
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
          },
        ],
      },
      code: {
        coding: c.icd10
          ? [
              {
                system: 'http://hl7.org/fhir/sid/icd-10',
                code: c.icd10,
                display: c.name,
              },
            ]
          : undefined,
        text: c.name,
      },
      severity: {
        text: c.severity,
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
        display: dossier.member_name,
      },
      onsetDateTime: c.onset_date,
      note: c.doctor_notes ? [{ text: c.doctor_notes }] : undefined,
    };
    entries.push({ fullUrl: `urn:uuid:${condId}`, resource: condResource });
  }

  // 4. MedicationStatement Resources (BMP Medikationsplan)
  for (const [idx, m] of dossier.medications.entries()) {
    const medId = `medstatement-${dossier.member_id}-${idx + 1}`;
    const medResource: FhirResource = {
      resourceType: 'MedicationStatement',
      id: medId,
      status: 'active',
      medicationCodeableConcept: {
        coding: m.pzn
          ? [
              {
                system: 'http://fhir.de/CodeSystem/ifa/pzn',
                code: m.pzn,
                display: m.trade_name,
              },
            ]
          : undefined,
        text: `${m.trade_name} (${m.active_substance})`,
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
        display: dossier.member_name,
      },
      dosage: [
        {
          text: `Morgens: ${m.schedule_morning}, Mittags: ${m.schedule_noon}, Abends: ${m.schedule_evening}, Nachts: ${m.schedule_night} (${m.dosage})`,
          patientInstruction: m.instructions,
          timing: {
            repeat: {
              frequency:
                (m.schedule_morning ? 1 : 0) +
                (m.schedule_noon ? 1 : 0) +
                (m.schedule_evening ? 1 : 0) +
                (m.schedule_night ? 1 : 0),
              period: 1,
              periodUnit: 'd',
            },
          },
        },
      ],
      note: m.is_essential ? [{ text: 'LEBENSNOTWENDIGE DAUERMEDIKATION' }] : undefined,
    };
    entries.push({ fullUrl: `urn:uuid:${medId}`, resource: medResource });
  }

  // 5. Immunization Resources (Impfausweis)
  for (const [idx, v] of dossier.vaccinations.entries()) {
    const immId = `immunization-${dossier.member_id}-${idx + 1}`;
    const immResource: FhirResource = {
      resourceType: 'Immunization',
      id: immId,
      status: 'completed',
      vaccineCode: {
        text: `${v.disease} - ${v.vaccine_name}`,
      },
      patient: {
        reference: `urn:uuid:${patientId}`,
        display: dossier.member_name,
      },
      occurrenceDateTime: v.date_administered,
      lotNumber: v.batch_number,
      performer: v.administered_by ? [{ actor: { display: v.administered_by } }] : undefined,
    };
    entries.push({ fullUrl: `urn:uuid:${immId}`, resource: immResource });
  }

  return {
    resourceType: 'Bundle',
    id: `bundle-health-${dossier.member_id}`,
    type: 'document',
    timestamp: now,
    total: entries.length,
    entry: entries,
  };
}

/**
 * Downloads a valid HL7 FHIR Bundle JSON file for hospital or clinic import.
 */
export function exportFhirJson(dossier: MemberHealthDossier) {
  const bundle = convertDossierToFhirBundle(dossier);
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FHIR_EHR_${dossier.member_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

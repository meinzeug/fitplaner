/**
 * humanQuantity.ts
 * Intelligente, alltagstaugliche Rundung von Mengenangaben und
 * Übersetzung von komplexem Jargon in einfache, sympathische Alltagssprache.
 */

export function formatHumanQuantity(quantity: number, unit: string): { amount: string; unit: string } {
  if (!quantity || isNaN(quantity) || quantity <= 0) {
    return { amount: '1', unit: unit || 'Stück' };
  }

  const cleanUnit = (unit || '').trim().toLowerCase();

  // Stück / Eier / Scheiben / Dosen -> ganze Zahlen runden
  if (
    cleanUnit === 'stück' ||
    cleanUnit === 'stk' ||
    cleanUnit === 'stk.' ||
    cleanUnit === 'packung' ||
    cleanUnit === 'pkg' ||
    cleanUnit === 'dose' ||
    cleanUnit === 'dosen' ||
    cleanUnit === 'scheibe' ||
    cleanUnit === 'scheiben' ||
    cleanUnit === 'flasche' ||
    cleanUnit === 'flaschen' ||
    cleanUnit === 'rolle' ||
    cleanUnit === 'rollen' ||
    cleanUnit === 'bund' ||
    cleanUnit === 'zehe' ||
    cleanUnit === 'zehen'
  ) {
    const rounded = Math.round(quantity);
    return {
      amount: String(Math.max(1, rounded)),
      unit: unit || 'Stück',
    };
  }

  // Gramm -> auf 5g oder 10g runden
  if (cleanUnit === 'g' || cleanUnit === 'gramm') {
    if (quantity < 10) {
      return { amount: String(Math.round(quantity)), unit: 'g' };
    }
    if (quantity < 50) {
      return { amount: String(Math.round(quantity / 5) * 5), unit: 'g' };
    }
    if (quantity < 200) {
      return { amount: String(Math.round(quantity / 10) * 10), unit: 'g' };
    }
    return { amount: String(Math.round(quantity / 25) * 25), unit: 'g' };
  }

  // Milliliter -> auf 10ml oder 25ml runden
  if (cleanUnit === 'ml' || cleanUnit === 'milliliter') {
    if (quantity < 20) {
      return { amount: String(Math.round(quantity / 5) * 5), unit: 'ml' };
    }
    return { amount: String(Math.round(quantity / 10) * 10), unit: 'ml' };
  }

  // Kilogramm / Liter -> max 1-2 Dezimalstellen
  if (cleanUnit === 'kg' || cleanUnit === 'kilo' || cleanUnit === 'kilogramm') {
    if (quantity >= 1) {
      return { amount: quantity.toFixed(1).replace('.0', '').replace('.', ','), unit: 'kg' };
    }
    return { amount: String(Math.round(quantity * 1000 / 10) * 10), unit: 'g' };
  }

  if (cleanUnit === 'l' || cleanUnit === 'liter') {
    if (quantity >= 1) {
      return { amount: quantity.toFixed(1).replace('.0', '').replace('.', ','), unit: 'l' };
    }
    return { amount: String(Math.round(quantity * 1000 / 10) * 10), unit: 'ml' };
  }

  // Teelöffel / Esslöffel
  if (cleanUnit === 'tl' || cleanUnit === 'teelöffel' || cleanUnit === 'el' || cleanUnit === 'esslöffel') {
    const rounded = Math.round(quantity * 2) / 2;
    return {
      amount: String(rounded).replace('.', ','),
      unit: unit,
    };
  }

  // Fallback: max 1 Nachkommastelle
  return {
    amount: Number(quantity.toFixed(1)).toString().replace('.', ','),
    unit: unit,
  };
}

export function formatHumanQuantityText(quantity: number, unit: string): string {
  const hq = formatHumanQuantity(quantity, unit);
  return `${hq.amount} ${hq.unit}`;
}

/**
 * Übersetzt ernährungswissenschaftlichen Jargon in verständliche Alltagssprache.
 */
export function friendlyLabel(text: string): string {
  if (!text) return '';
  const lower = text.toLowerCase();

  if (lower.includes('glykämische last')) {
    if (lower.includes('niedrig')) return '🌿 Blutzucker-freundlich';
    if (lower.includes('moderat') || lower.includes('mittel')) return '🔋 Hält lange satt';
    if (lower.includes('hoch') || lower.includes('höher')) return '⚡ Schnelle Energie';
    return '🔋 Ausgewogene Energie';
  }

  if (lower.includes('mikrobiom') || lower.includes('30-pflanzen')) {
    return '🥗 Buntes Gemüse & Pflanzen';
  }

  if (lower.includes('tellertrick')) {
    return '🍽️ Ausgewogene Portion';
  }

  if (lower.includes('allergie-geprüft') || lower.includes('familien-sicher')) {
    return '👶 100% Familien-Liebling';
  }

  if (lower.includes('pro-dual-engine')) {
    return '💰 Bester Spar-Preis';
  }

  return text;
}

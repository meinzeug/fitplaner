/**
 * Utility to return authentic brand colors and border classes for German retailers.
 * Supports Netto, NP, Lidl, Aldi Nord/Süd, Rewe, Kaufland, Edeka, Vorratskammer, etc.
 */
export const getRetailerBadgeClass = (retailer?: string): string => {
  if (!retailer) {
    return 'bg-slate-100 text-slate-700 border border-slate-300 font-bold';
  }

  const r = retailer.toLowerCase().trim();

  // Netto Marken-Discount (Yellow & Red/Black)
  if (r.includes('netto')) {
    return 'bg-amber-400 text-stone-950 border border-amber-500 font-black';
  }

  // NP Discount (Red & White)
  if (r === 'np' || r.includes('np discount') || r.includes('np-') || r.startsWith('np ')) {
    return 'bg-red-600 text-white border border-red-700 font-bold';
  }

  // Lidl (Blue & Yellow)
  if (r.includes('lidl')) {
    return 'bg-blue-600 text-white border border-blue-700 font-bold';
  }

  // Aldi Süd / Aldi Nord
  if (r.includes('aldi')) {
    if (r.includes('süd') || r.includes('sued')) {
      return 'bg-indigo-700 text-white border border-indigo-800 font-bold';
    }
    return 'bg-sky-800 text-white border border-sky-900 font-bold';
  }

  // Rewe (Red & White)
  if (r.includes('rewe')) {
    return 'bg-red-700 text-white border border-red-800 font-bold';
  }

  // Kaufland (Dark Red / Crimson)
  if (r.includes('kaufland')) {
    return 'bg-rose-900 text-white border border-rose-950 font-bold';
  }

  // Edeka (Yellow & Blue)
  if (r.includes('edeka')) {
    return 'bg-yellow-400 text-blue-950 border border-blue-600 font-bold';
  }

  // Vorratskammer (Pantry Green)
  if (r.includes('vorrat')) {
    return 'bg-emerald-100 text-emerald-800 border border-emerald-400 font-bold';
  }

  // Default / Other
  return 'bg-slate-100 text-slate-700 border border-slate-300 font-bold';
};

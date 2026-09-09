import React, { useState } from 'react';
import { ProductOffer } from '../types';
import { Search, Tag, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Filter, Leaf, Info } from 'lucide-react';

interface Props {
  offers: ProductOffer[];
  isLoading: boolean;
  zipCode: string;
  onZipCodeChange: (zip: string) => void;
  onlyHealthy: boolean;
  onToggleHealthy: (healthy: boolean) => void;
  onRefresh: () => void;
}

export const OffersView: React.FC<Props> = ({
  offers,
  isLoading,
  zipCode,
  onZipCodeChange,
  onlyHealthy,
  onToggleHealthy,
  onRefresh,
}) => {
  const [selectedRetailer, setSelectedRetailer] = useState<'All' | 'Netto' | 'NP'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredOffers = offers.filter((offer) => {
    if (selectedRetailer !== 'All' && offer.retailer !== selectedRetailer) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchTitle = offer.title.toLowerCase().includes(s);
      const matchBrand = (offer.brand || '').toLowerCase().includes(s);
      const matchCategory = offer.category.toLowerCase().includes(s);
      if (!matchTitle && !matchBrand && !matchCategory) return false;
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              Netto & NP Aktuelle Prospekt-Angebote
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live analysiert nach Nährwerten, NOVA-Grad (1–4), E-Nummern und Hersteller-Inhaltsstoffen.
            </p>
          </div>

          {/* PLZ & Reload */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">PLZ:</span>
            <input
              type="text"
              value={zipCode}
              maxLength={5}
              onChange={(e) => onZipCodeChange(e.target.value)}
              className="w-20 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-center font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Lädt...' : 'Aktualisieren'}
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Retailer Chips */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedRetailer('All')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedRetailer === 'All' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alle Märkte ({offers.length})
            </button>
            <button
              onClick={() => setSelectedRetailer('Netto')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedRetailer === 'Netto' ? 'bg-amber-400 text-stone-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🟡 Netto Marken-Discount
            </button>
            <button
              onClick={() => setSelectedRetailer('NP')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedRetailer === 'NP' ? 'bg-red-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔴 NP Discount
            </button>
          </div>

          {/* Healthy Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition">
              <input
                type="checkbox"
                checked={onlyHealthy}
                onChange={(e) => onToggleHealthy(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="flex items-center gap-1 text-emerald-900">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                Nur 100% gesund (Kein Junk)
              </span>
            </label>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Lebensmittel suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Offers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffers.map((offer) => {
          const isExpanded = expandedId === offer.id;
          const isNetto = offer.retailer === 'Netto';
          const score = offer.health_score || 9;

          return (
            <div
              key={offer.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Image & Retailer Badge */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={offer.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                    alt={offer.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />

                  {/* Store Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black shadow ${
                      isNetto ? 'bg-amber-400 text-stone-900' : 'bg-red-600 text-white'
                    }`}>
                      {isNetto ? '🟡 NETTO' : '🔴 NP DISCOUNT'}
                    </span>
                  </div>

                  {/* Discount Badge */}
                  {offer.savings_percent && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-600 text-white shadow">
                        -{offer.savings_percent}%
                      </span>
                    </div>
                  )}

                  {/* Category Pill */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-black/60 text-white backdrop-blur-sm">
                      {offer.category}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5">
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-1">{offer.title}</h3>
                  </div>

                  {offer.brand && (
                    <span className="text-xs text-slate-400 font-medium block mb-3">
                      Marke: {offer.brand} • {offer.unit}
                    </span>
                  )}

                  {/* Pricing Bar */}
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl mb-4">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Aktionspreis</span>
                      <span className="text-xl font-black text-emerald-700">
                        {offer.discount_price.toFixed(2)} €
                      </span>
                    </div>

                    {offer.original_price && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block line-through">
                          statt {offer.original_price.toFixed(2)} €
                        </span>
                        <span className="text-xs font-bold text-red-600">
                          Sie sparen {(offer.original_price - offer.discount_price).toFixed(2)} €
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Health Evaluation Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      score >= 8 ? 'bg-emerald-100 text-emerald-800' :
                      score >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      Health-Score: {score}/10
                    </div>

                    {offer.analysis?.nova_group && (
                      <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        offer.analysis.nova_group === 1 ? 'bg-green-50 text-green-700 border border-green-200' :
                        offer.analysis.nova_group === 4 ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        NOVA {offer.analysis.nova_group} {offer.analysis.nova_group === 1 ? '(Naturprodukt)' : ''}
                      </div>
                    )}

                    {offer.analysis?.nutri_score && (
                      <div className="px-2 py-1 rounded-lg text-xs font-black bg-slate-800 text-white">
                        Nutri: {offer.analysis.nutri_score}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible Manufacturer Analysis */}
              <div className="px-5 pb-5 pt-0">
                <button
                  onClick={() => toggleExpand(offer.id)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-emerald-700 py-2 border-t border-slate-100 transition"
                >
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-emerald-600" />
                    Hersteller-Inhaltsstoffe & E-Nummern
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && offer.analysis && (
                  <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2.5 animate-fadeIn">
                    <div>
                      <span className="font-bold text-slate-700 block mb-0.5">Zutatenliste (Hersteller):</span>
                      <p className="text-slate-600 leading-relaxed italic bg-white p-2 rounded-lg border border-slate-200/60">
                        {offer.analysis.ingredients_text || 'Keine deklarationspflichtigen Zusätze.'}
                      </p>
                    </div>

                    {/* Additives / E-Numbers */}
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Zusatzstoff-Check:</span>
                      {offer.analysis.additives.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Frei von künstlichen Zusatzstoffen & E-Nummern
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {offer.analysis.additives.map((add, idx) => (
                            <span
                              key={idx}
                              title={add.description}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                add.risk_level === 'red' ? 'bg-red-100 text-red-800 border border-red-200' :
                                add.risk_level === 'yellow' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {add.code}: {add.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Hidden Sugars */}
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Versteckter Zucker:</span>
                      {offer.analysis.hidden_sugars.length === 0 ? (
                        <span className="text-emerald-700 font-medium">✅ Kein versteckter Industriezucker</span>
                      ) : (
                        <span className="text-red-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Gefunden: {offer.analysis.hidden_sugars.join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Scientific Explanation */}
                    <div className="pt-1.5 border-t border-slate-200 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">Fazit: </span>
                      {offer.analysis.verdict_explanation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

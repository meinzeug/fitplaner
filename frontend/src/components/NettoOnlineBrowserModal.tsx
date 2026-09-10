import React, { useState } from 'react';
import { NettoOnlineProduct } from '../types';
import { crawlNettoCategory, NETTO_PRESET_CATEGORIES } from '../utils/nettoExtractor';
import {
  Search,
  ShoppingCart,
  Check,
  ExternalLink,
  Tag,
  Sparkles,
  AlertCircle,
  X,
  RefreshCw,
  Percent,
  Layers,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onAddShoppingItem: (item: {
    name: string;
    price?: number;
    original_price?: number;
    discount_percent?: number;
    quantity: number;
    unit: string;
    retailer: 'Netto';
    category: string;
    leaflet_title?: string;
  }) => void;
}

export const NettoOnlineBrowserModal: React.FC<Props> = ({ onClose, onAddShoppingItem }) => {
  const [url, setUrl] = useState<string>('https://www.netto-online.de/nuesse-trockenobst/c-N011808');
  const [products, setProducts] = useState<NettoOnlineProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedSkus, setAddedSkus] = useState<Set<string>>(new Set());

  const handleCrawl = async (targetUrl?: string) => {
    const finalUrl = targetUrl || url;
    setIsLoading(true);
    setError(null);

    try {
      const results = await crawlNettoCategory(finalUrl);
      setProducts(results);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Auslesen der Netto-Online Seite.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = (p: NettoOnlineProduct) => {
    onAddShoppingItem({
      name: p.title,
      price: p.price,
      original_price: p.old_price || p.price * 1.25,
      discount_percent: p.discount_percent || 20,
      quantity: 1,
      unit: 'Packung',
      retailer: 'Netto',
      category: p.category || 'Netto Sortiment',
      leaflet_title: 'Netto Online-Angebot',
    });

    setAddedSkus((prev) => new Set(prev).add(p.sku));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Header */}
        <div className="bg-amber-400 p-5 text-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/90 flex items-center justify-center text-amber-800 shadow-sm font-black text-lg">
              🟡
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                Netto-Online Sortiments- & Angebots-Browser (Ohne KI)
              </h2>
              <p className="text-xs text-stone-800 font-medium">
                100% deterministische Web-Extraktion direkt vom Smartphone aus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900/10 hover:bg-stone-900/20 text-stone-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Presets */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.netto-online.de/..."
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <button
              onClick={() => handleCrawl()}
              disabled={isLoading || !url}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition shadow-md disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
              <span>{isLoading ? 'Lese HTML aus...' : 'Live auslesen (0% KI)'}</span>
            </button>
          </div>

          {/* Presets Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="font-bold text-slate-500 shrink-0 mr-1">Abteilungen:</span>
            {NETTO_PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat.url}
                onClick={() => {
                  setUrl(cat.url);
                  handleCrawl(cat.url);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border font-bold transition shrink-0 ${
                  url === cat.url
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="m-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {products.length === 0 && !isLoading && !error && (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Layers className="w-12 h-12 mx-auto text-slate-300" />
              <div className="font-bold text-sm text-slate-600">Noch keine Artikel geladen</div>
              <p className="text-xs max-w-sm mx-auto">
                Klicke auf <strong>"Live auslesen"</strong> oder wähle eine Abteilung (z. B. Nüsse & Trockenobst), um alle Angebote deterministisch aus dem Netto-DOM zu extrahieren.
              </p>
            </div>
          )}

          {products.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-2 border-b border-slate-100">
                <span>{products.length} Produkte erfolgreich extrahiert</span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-extrabold">
                  ✓ 100% Deterministisch (Keine KI-Kosten)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => {
                  const isAdded = addedSkus.has(p.sku);
                  return (
                    <div
                      key={p.sku}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition space-y-3"
                    >
                      <div className="space-y-2">
                        {p.image_url ? (
                          <div className="h-32 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center p-2">
                            <img
                              src={p.image_url}
                              alt={p.title}
                              className="max-h-full max-w-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="h-32 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                            Kein Bild
                          </div>
                        )}

                        <div>
                          {p.brand && (
                            <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                              {p.brand}
                            </span>
                          )}
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-2" title={p.title}>
                            {p.title}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-slate-900">
                              {p.price.toFixed(2).replace('.', ',')} €
                            </span>
                            {p.old_price && (
                              <span className="text-xs line-through text-slate-400 font-medium">
                                {p.old_price.toFixed(2).replace('.', ',')} €
                              </span>
                            )}
                          </div>
                          {p.discount_percent && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-black text-[10px]">
                              -{p.discount_percent}%
                            </span>
                          )}
                        </div>

                        {p.base_price && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            Grundpreis: {p.base_price}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => handleAddProduct(p)}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition shadow-xs ${
                              isAdded
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Auf Liste</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>+ Einkaufsliste</span>
                              </>
                            )}
                          </button>

                          {p.product_url && (
                            <a
                              href={p.product_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                              title="Auf Netto-Online öffnen"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { PantryItem } from '../types';
import { Archive, Plus, Barcode, FileText, Trash2, AlertTriangle, CheckCircle, Clock, Calendar, Sparkles, Search, ChevronRight } from 'lucide-react';

interface Props {
  pantryItems: PantryItem[];
  onSaveItem: (item: PantryItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export const PantryView: React.FC<Props> = ({
  pantryItems,
  onSaveItem,
  onDeleteItem,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // New/Edit Item Form State
  const [formData, setFormData] = useState<Partial<PantryItem>>({
    name: '',
    current_quantity: 500,
    unit: 'g',
    category: 'Vorratskammer',
    mhd_date: '',
    standard_pack_size: 500,
    source: 'Manuell',
  });

  // Barcode State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<any | null>(null);

  // Receipt Scanner State
  const [receiptText, setReceiptText] = useState('');
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptResult, setReceiptResult] = useState<any | null>(null);

  const filteredItems = pantryItems.filter((item) => {
    if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const expiringSoonCount = pantryItems.filter((i) => i.shelf_life_status === 'expiring_soon' || i.shelf_life_status === 'expired').length;

  const handleBarcodeLookup = async () => {
    if (!barcodeInput.trim()) return;
    setBarcodeLoading(true);
    try {
      const res = await fetch('/api/scanners/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcodeInput.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setBarcodeResult(data);
      } else {
        alert('Barcode nicht gefunden.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleAcceptBarcode = async () => {
    if (!barcodeResult) return;
    const newItem: PantryItem = {
      id: `pan-${Date.now()}`,
      name: barcodeResult.name,
      current_quantity: barcodeResult.quantity || 500,
      unit: barcodeResult.unit || 'g',
      category: barcodeResult.category || 'Vorratskammer',
      shelf_life_status: 'fresh',
      source: 'Barcode',
      ean_barcode: barcodeResult.barcode,
      added_date: new Date().toLocaleDateString('de-DE'),
    };
    await onSaveItem(newItem);
    setIsBarcodeModalOpen(false);
    setBarcodeResult(null);
    setBarcodeInput('');
  };

  const handleParseReceipt = async () => {
    if (!receiptText.trim()) return;
    setReceiptLoading(true);
    try {
      const res = await fetch('/api/scanners/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_text: receiptText }),
      });
      if (res.ok) {
        const data = await res.json();
        setReceiptResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleBookReceiptItems = async () => {
    if (!receiptResult || !receiptResult.items) return;
    try {
      await fetch('/api/pantry/book-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: receiptResult.items }),
      });
      onRefresh();
      setIsReceiptModalOpen(false);
      setReceiptResult(null);
      setReceiptText('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdjustQuantity = async (item: PantryItem, delta: number) => {
    const newQty = Math.max(0, Math.round((item.current_quantity + delta) * 10) / 10);
    await onSaveItem({ ...item, current_quantity: newQty });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Archive className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold">Lagerverwaltung & Vorratskammer</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-lg">
            Angebrochene Packungen und Vorräte werden hier automatisch verwaltet. Vorhandene Bestände werden bei deiner Einkaufsliste abgezogen, sodass du nichts doppelt kaufst.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsBarcodeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
          >
            <Barcode className="w-4 h-4" /> Barcode scannen
          </button>
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
          >
            <FileText className="w-4 h-4" /> Kassenbon einlesen
          </button>
          <button
            onClick={() => {
              setFormData({
                name: '',
                current_quantity: 500,
                unit: 'g',
                category: 'Vorratskammer',
                mhd_date: '',
                standard_pack_size: 500,
                source: 'Manuell',
              });
              setIsItemModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Manuell
          </button>
        </div>
      </div>

      {/* Expiry Alert Callout */}
      {expiringSoonCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {expiringSoonCount} Artikel bald fällig oder abgelaufen!
              </h4>
              <p className="text-xs text-amber-700">
                Priorisiere diese Zutaten für deine nächsten Brotdosen oder Abendessen, um Lebensmittelverschwendung zu vermeiden.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Obst & Gemüse', 'Proteinquellen', 'Vollkorn & Hülsenfrüchte', 'Gesunde Fette & Nüsse', 'Vorratskammer'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'All' ? 'Alle Bestände' : cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Vorrat durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-56"
          />
        </div>
      </div>

      {/* Inventory Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isExpiringSoon = item.shelf_life_status === 'expiring_soon';
          const isExpired = item.shelf_life_status === 'expired';

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.name}</h3>
                    <span className="text-[11px] text-slate-400 font-medium block">{item.category}</span>
                  </div>

                  {/* MHD Status Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isExpired
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : isExpiringSoon
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {isExpired
                      ? 'Abgelaufen'
                      : isExpiringSoon
                      ? `MHD: in ${item.days_left} T.`
                      : item.mhd_date
                      ? `MHD: ${item.mhd_date}`
                      : 'Haltbar'}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between my-3">
                  <span className="text-xs text-slate-500 font-medium">Aktueller Bestand:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustQuantity(item, -50)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold flex items-center justify-center hover:bg-slate-100 active:scale-95"
                    >
                      -
                    </button>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {item.current_quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => handleAdjustQuantity(item, 50)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold flex items-center justify-center hover:bg-slate-100 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Quelle: {item.source}</span>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="text-slate-400 hover:text-red-600 transition"
                  title="Aus Lager entfernen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barcode Scanner Modal */}
      {isBarcodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Barcode className="w-5 h-5 text-emerald-600" />
              Barcode (EAN) Scannen & erfassen
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Gib einen Barcode ein oder nutze Demo-Barcodes von Netto/NP (z.B. Haferflocken: 4014400900010, Skyr: 4311501683226, Hähnchen: 4311501742916).
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="EAN Barcode (z.B. 4014400900010)"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleBarcodeLookup}
                disabled={barcodeLoading}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
              >
                {barcodeLoading ? 'Sucht...' : 'Abfragen'}
              </button>
            </div>

            {barcodeResult && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl mb-4 text-xs space-y-1.5">
                <span className="font-bold text-emerald-900 block text-sm">{barcodeResult.name}</span>
                <span className="text-slate-600 block">Marke: {barcodeResult.brand || 'Handelsmarke'}</span>
                <span className="text-slate-600 block font-mono font-bold">
                  Menge: {barcodeResult.quantity} {barcodeResult.unit}
                </span>
                <span className="text-slate-500 block text-[11px]">Quelle: {barcodeResult.source}</span>
                <button
                  onClick={handleAcceptBarcode}
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow"
                >
                  ✅ Direkt ins Lager einbuchen
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setIsBarcodeModalOpen(false);
                setBarcodeResult(null);
              }}
              className="w-full py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Receipt Scanner Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Kassenbon einlesen (Netto / NP)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Kopiere den Text deines digitalen Kassenbelegs (z. B. aus der Netto App / Edeka App) oder füge den Bon-Text ein. Die App erkennt Artikel, Preise und Packungen automatisch!
            </p>

            <textarea
              rows={6}
              placeholder={`Beispiel:\nNETTO MARKEN-DISCOUNT\nBIO HAFERFLOCKEN 0,79 B\nBROKKOLI 500G 1,19 B\nNORW. LACHSFILET 4,29 B\nSUMME EUR 6,27`}
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none mb-3"
            />

            <button
              onClick={handleParseReceipt}
              disabled={receiptLoading || !receiptText.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow mb-4 disabled:opacity-50"
            >
              {receiptLoading ? 'Analysiere Bon...' : 'Kassenbon analysieren'}
            </button>

            {receiptResult && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-4 overflow-y-auto max-h-48 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-1">
                  <span>Markt: {receiptResult.store_name}</span>
                  <span>Gesamt: {receiptResult.total_amount.toFixed(2)} €</span>
                </div>
                {receiptResult.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-slate-600">
                    <span>• {it.name}</span>
                    <span className="font-mono font-bold">{it.price.toFixed(2)} €</span>
                  </div>
                ))}

                <button
                  onClick={handleBookReceiptItems}
                  className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow text-xs"
                >
                  ✅ Alle {receiptResult.items.length} Artikel ins Lager übernehmen
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setIsReceiptModalOpen(false);
                setReceiptResult(null);
              }}
              className="w-full py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 mt-auto"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Add Manual Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Artikel im Lager anlegen</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!formData.name) return;
                await onSaveItem(formData as PantryItem);
                setIsItemModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Produktname</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Haferflocken, Pinienkerne, Olivenöl"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Menge</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.current_quantity || 500}
                    onChange={(e) => setFormData({ ...formData, current_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Einheit</label>
                  <select
                    value={formData.unit || 'g'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="g">Gramm (g)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="Stück">Stück</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kategorie</label>
                <select
                  value={formData.category || 'Vorratskammer'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Obst & Gemüse">Obst & Gemüse</option>
                  <option value="Proteinquellen">Proteinquellen</option>
                  <option value="Vollkorn & Hülsenfrüchte">Vollkorn & Hülsenfrüchte</option>
                  <option value="Gesunde Fette & Nüsse">Gesunde Fette & Nüsse</option>
                  <option value="Vorratskammer">Vorratskammer / Gewürze</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">MHD (Mindesthaltbarkeit, optional)</label>
                <input
                  type="date"
                  value={formData.mhd_date || ''}
                  onChange={(e) => setFormData({ ...formData, mhd_date: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow hover:bg-emerald-700"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

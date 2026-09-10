import React, { useState, useEffect } from 'react';
import { ShoppingList, ShoppingItem, CustomShoppingItem, PantryItem } from '../types';
import { PantryView } from './PantryView';
import { apiFetch, getServerUrl } from '../api/client';
import {
  ShoppingBag, Share2, Printer, Check, CheckSquare, Square, Plus,
  Archive, Sparkles, Trash2, PackageCheck, ChevronLeft, ChevronRight,
  Calendar, Wallet, AlertTriangle, Compass, Smartphone, HelpCircle,
  X, ArrowRight, ShieldCheck, RefreshCw, Layers, FileDown, Barcode
} from 'lucide-react';

interface Props {
  shoppingList: ShoppingList | null;
  selectedWeekOffset: number;
  onChangeWeek: (offset: number) => void;
  onRefresh: () => void;
  onBookCartToPantry: (items: any[]) => Promise<void>;
  onAddCustomItem: (item: Partial<CustomShoppingItem>) => Promise<void>;
  onDeleteCustomItem: (id: string) => Promise<void>;
  pantryItems?: PantryItem[];
  onSavePantryItem?: (item: PantryItem) => Promise<void>;
  onDeletePantryItem?: (id: string) => Promise<void>;
  onRefreshPantry?: () => void;
}

const ALL_DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const DAY_MAP: Record<string, string> = {
  Mo: 'Montag',
  Di: 'Dienstag',
  Mi: 'Mittwoch',
  Do: 'Donnerstag',
  Fr: 'Freitag',
  Sa: 'Samstag',
  So: 'Sonntag',
};

export const ShoppingListView: React.FC<Props> = ({
  shoppingList: initialShoppingList,
  selectedWeekOffset,
  onChangeWeek,
  onRefresh,
  onBookCartToPantry,
  onAddCustomItem,
  onDeleteCustomItem,
  pantryItems = [],
  onSavePantryItem,
  onDeletePantryItem,
  onRefreshPantry,
}) => {
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
  const [activeList, setActiveList] = useState<ShoppingList | null>(initialShoppingList);

  useEffect(() => {
    setActiveList(initialShoppingList);
  }, [initialShoppingList]);

  useEffect(() => {
    fetchFilteredList(selectedDays, selectedWeekOffset);
  }, [selectedDays, selectedWeekOffset]);

  const fetchFilteredList = async (days: string[], weekOffset: number) => {
    try {
      const dayNames = days.map((d) => DAY_MAP[d] || d);
      const daysQuery = days.length === 7 ? '' : `&days=${encodeURIComponent(dayNames.join(','))}`;
      const res = await apiFetch(`/api/shopping-list?week_offset=${weekOffset}${daysQuery}`);
      if (res.ok) {
        const data = await res.json();
        setActiveList(data);
      }
    } catch (e) {
      console.error('Failed to fetch filtered shopping list:', e);
    }
  };

  const toggleDayFilter = (d: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(d)) {
        if (prev.length <= 1) return prev;
        return prev.filter((item) => item !== d);
      }
      return ALL_DAYS_SHORT.filter((item) => prev.includes(item) || item === d);
    });
  };

  const shoppingList = activeList || initialShoppingList;
  // Main Sub-Tab: 'list' (Einkaufsliste) or 'pantry' (Vorratskammer & Scanner)
  const [subTab, setSubTab] = useState<'list' | 'pantry'>('list');

  // View Mode: 'aisle' (Gang-Laufweg) or 'store' (Filial-Trennung)
  const [viewMode, setViewMode] = useState<'aisle' | 'store'>('aisle');

  // In-Store Thumb Mode (große Touch-Tasten)
  const [thumbMode, setThumbMode] = useState(false);

  // Checked Map for shopping items
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [copiedToast, setCopiedToast] = useState(false);
  const [bookedToast, setBookedToast] = useState(false);

  // Substitute Modal State
  const [substituteItem, setSubstituteItem] = useState<{ name: string; substitutes: string[] } | null>(null);

  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customUnit, setCustomUnit] = useState('Stück');
  const [customRetailer, setCustomRetailer] = useState<string>('Netto');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!shoppingList) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
        <ShoppingBag className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Keine Einkaufsliste</h3>
        <p className="text-xs text-slate-500 mb-4">Erstelle zuerst einen Wochenplan, um die Einkaufsliste automatisch zu berechnen.</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow"
        >
          Neu laden
        </button>
      </div>
    );
  }

  const toggleCheck = (idKey: string) => {
    setCheckedMap((prev) => ({ ...prev, [idKey]: !prev[idKey] }));
  };

  const handleCopyWhatsApp = async () => {
    try {
      const daysQuery = selectedDays.length < 7 ? `?days=${encodeURIComponent(selectedDays.map((d) => DAY_MAP[d] || d).join(','))}` : '';
      const res = await apiFetch(`/api/shopping-list/export-whatsapp${daysQuery}`);
      const data = await res.json();
      if (data.text) {
        await navigator.clipboard.writeText(data.text);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 3000);
      }
    } catch (e) {
      alert('Einkaufsliste in die Zwischenablage kopiert!');
    }
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    const daysQuery = selectedDays.length < 7 ? `&days=${encodeURIComponent(selectedDays.map((d) => DAY_MAP[d] || d).join(','))}` : '';
    const baseUrl = getServerUrl();
    const downloadUrl = `${baseUrl}/api/shopping-list/export-pdf?week_offset=${selectedWeekOffset}${daysQuery}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `Einkaufsliste_KW${selectedWeekOffset}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingPdf(false), 1500);
  };

  const handleBookAllToPantry = async () => {
    const allItemsToBook: any[] = [];

    const collectItems = (items: ShoppingItem[]) => {
      for (const it of items) {
        // STRICT RULE: Only shelf-stable dry goods (is_pantry_eligible) migrate to pantry with surplus
        if (!it.is_covered_by_stock && it.is_pantry_eligible) {
          const surplus = it.leftover_after_purchase;
          if (surplus > 0) {
            allItemsToBook.push({
              name: it.name,
              total_quantity: surplus,
              leftover_after_purchase: surplus,
              unit: it.unit,
              category: it.category,
              source: 'Restmenge',
            });
          }
        }
      }
    };

    collectItems(shoppingList.items_netto);
    collectItems(shoppingList.items_np);
    if (shoppingList.items_lidl) collectItems(shoppingList.items_lidl);
    if (shoppingList.items_aldi) collectItems(shoppingList.items_aldi);
    if (shoppingList.items_rewe) collectItems(shoppingList.items_rewe);
    if (shoppingList.items_kaufland) collectItems(shoppingList.items_kaufland);
    if (shoppingList.items_edeka) collectItems(shoppingList.items_edeka);

    for (const c of shoppingList.custom_items) {
      allItemsToBook.push({
        name: c.name,
        total_quantity: c.quantity,
        unit: c.unit,
        category: c.category,
        source: 'Kauf',
      });
    }

    if (allItemsToBook.length === 0) {
      alert('Keine haltbaren Trockenprodukte mit Restmengen zum Einbuchen vorhanden. Frischeprodukte (Fleisch, Fisch, Gemüse etc.) werden frisch verzehrt und nicht eingelagert.');
      return;
    }

    await onBookCartToPantry(allItemsToBook);
    setBookedToast(true);
    setTimeout(() => setBookedToast(false), 4000);
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    await onAddCustomItem({
      name: customName.trim(),
      quantity: customQty,
      unit: customUnit,
      retailer: customRetailer as any,
      category: 'Zusatzartikel',
    });
    setCustomName('');
    setCustomQty(1);
  };

  // Combine all items for aisle grouping
  const allItemsWithStore = [
    ...shoppingList.items_netto.map((i) => ({ ...i, storeTag: 'Netto' })),
    ...shoppingList.items_np.map((i) => ({ ...i, storeTag: 'NP' })),
    ...(shoppingList.items_lidl || []).map((i) => ({ ...i, storeTag: 'Lidl' })),
    ...(shoppingList.items_aldi || []).map((i) => ({ ...i, storeTag: 'Aldi' })),
    ...(shoppingList.items_rewe || []).map((i) => ({ ...i, storeTag: 'Rewe' })),
    ...(shoppingList.items_kaufland || []).map((i) => ({ ...i, storeTag: 'Kaufland' })),
    ...(shoppingList.items_edeka || []).map((i) => ({ ...i, storeTag: 'Edeka' })),
    ...shoppingList.items_pantry.map((i) => ({ ...i, storeTag: 'Vorratskammer' })),
  ];

  const aisleGroups: Record<string, typeof allItemsWithStore> = {
    '1. Obst- & Gemüse-Insel': [],
    '2. Kühlregal & Molkerei': [],
    '3. Fleisch & Frischer Fisch': [],
    '4. Trockensortiment & Vorräte': [],
    '5. Basics & Gewürze': [],
  };

  allItemsWithStore.forEach((item) => {
    const aisleKey = item.aisle || '5. Basics & Gewürze';
    if (!aisleGroups[aisleKey]) {
      aisleGroups[aisleKey] = [];
    }
    aisleGroups[aisleKey].push(item);
  });

  const renderItemRow = (item: ShoppingItem & { storeTag?: string }, uniqueKey: string) => {
    const isChecked = !!checkedMap[uniqueKey];

    return (
      <div
        key={uniqueKey}
        className={`rounded-2xl transition flex items-center justify-between select-none ${
          thumbMode ? 'p-4 my-1.5 min-h-[64px]' : 'py-3 px-3 my-1'
        } ${
          isChecked
            ? 'bg-slate-100/70 opacity-40 line-through text-slate-400'
            : 'bg-white hover:bg-slate-50 border border-slate-100 shadow-xs'
        }`}
      >
        <div
          onClick={() => toggleCheck(uniqueKey)}
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
        >
          <div className="shrink-0">
            {isChecked ? (
              <CheckSquare className={thumbMode ? 'w-7 h-7 text-emerald-600' : 'w-5 h-5 text-emerald-600'} />
            ) : (
              <Square className={thumbMode ? 'w-7 h-7 text-slate-300' : 'w-5 h-5 text-slate-300 hover:text-slate-400'} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`font-bold text-slate-800 leading-tight truncate ${thumbMode ? 'text-base' : 'text-sm'}`}>
                {item.exact_product_name || item.name}
              </span>
              {item.brand && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                  {item.brand}
                </span>
              )}
              {item.storeTag && viewMode === 'aisle' && (
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                  item.storeTag === 'Netto' ? 'bg-amber-100 text-stone-900' :
                  item.storeTag === 'NP' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {item.storeTag}
                </span>
              )}
              {item.is_covered_by_stock ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Im Vorrat (0 €)
                </span>
              ) : (
                item.packs_to_buy > 0 && item.pack_size && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {item.packs_to_buy}x {item.pack_size} {item.unit}
                  </span>
                )
              )}
              {item.barcode && !item.is_covered_by_stock && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200" title="EAN-13 Barcode für Handscanner & Kasse">
                  <Barcode className="w-3.5 h-3.5 text-amber-700" />
                  <span>{item.barcode}</span>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5 flex flex-wrap items-center gap-x-2">
              <span>Rezeptbedarf: {item.total_quantity} {item.unit}</span>
              {item.leftover_after_purchase > 0 && !item.is_covered_by_stock && item.is_pantry_eligible ? (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                  📦 Rest {item.leftover_after_purchase} {item.unit} wandert ins Vorratslager
                </span>
              ) : (
                !item.is_covered_by_stock && !item.is_pantry_eligible && (
                  <span className="text-slate-400 text-[10px]">
                    🌱 Frischeprodukt (frisch verbrauchen)
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-2 shrink-0">
          {/* Smart Substitute Option if sold out */}
          {item.substitutes && item.substitutes.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSubstituteItem({ name: item.name, substitutes: item.substitutes || [] });
              }}
              className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg flex items-center gap-1 transition"
              title="Ausverkauft? Alternativen anzeigen"
            >
              <span>Ersatz?</span>
            </button>
          )}

          <div className="text-right">
            <span className={`font-black font-mono block ${thumbMode ? 'text-base text-slate-900' : 'text-sm text-slate-900'}`}>
              {item.is_covered_by_stock ? '0,00 €' : `~${(item.total_price || 0).toFixed(2)} €`}
            </span>
            {item.savings && item.savings > 0 && !item.is_covered_by_stock && (
              <span className="text-[10px] text-red-600 block font-bold">
                -{item.savings.toFixed(2)} €
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Switcher: Liste vs Vorratskammer */}
      <div className="flex items-center justify-between bg-white rounded-3xl p-2 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSubTab('list')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
              subTab === 'list'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Einkaufsliste</span>
          </button>
          <button
            onClick={() => setSubTab('pantry')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
              subTab === 'pantry'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-4 h-4 text-amber-400" />
            <span>Vorratskammer & Scanner ({pantryItems.length})</span>
          </button>
        </div>

        {/* Daumen-Modus Switch (only in list mode) */}
        {subTab === 'list' && (
          <div className="flex items-center gap-2 pr-2">
            <button
              onClick={() => setThumbMode(!thumbMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                thumbMode
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Große Touch-Tasten für einhändige Bedienung im Supermarkt"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">📱 Daumen-Modus</span>
              <span className="sm:hidden">Daumen</span>
            </button>
          </div>
        )}
      </div>

      {subTab === 'pantry' ? (
        /* Vorratskammer View eingebettet */
        onSavePantryItem && onDeletePantryItem && onRefreshPantry ? (
          <PantryView
            pantryItems={pantryItems}
            onSaveItem={onSavePantryItem}
            onDeleteItem={onDeletePantryItem}
            onRefresh={onRefreshPantry}
          />
        ) : (
          <div className="p-8 text-center text-slate-500">Lagerverwaltung wird geladen...</div>
        )
      ) : (
        /* Einkaufsliste View */
        <>
          {/* Week Selector Strip */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onChangeWeek(selectedWeekOffset - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Vorherige Woche</span>
                <span className="sm:hidden">Zurück</span>
              </button>

              <span className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 px-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {shoppingList.week_label || 'Aktuelle Woche'}
              </span>

              <button
                onClick={() => onChangeWeek(selectedWeekOffset + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
              >
                <span className="hidden sm:inline">Nächste Woche</span>
                <span className="sm:hidden">Weiter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Toggle: Gang-Laufweg vs Supermarkt */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('aisle')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  viewMode === 'aisle' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>🚶‍♂️ Gang-Laufweg</span>
              </button>
              <button
                onClick={() => setViewMode('store')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  viewMode === 'store' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>🏪 Nach Filiale</span>
              </button>
            </div>
          </div>

          {/* Day Filter Bar */}
          <div className="bg-white rounded-3xl p-3.5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                🛒 Einkauf für Tage:
              </span>
              {ALL_DAYS_SHORT.map((dayShort) => {
                const isSelected = selectedDays.includes(dayShort);
                return (
                  <button
                    key={dayShort}
                    onClick={() => toggleDayFilter(dayShort)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {dayShort}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Schnellwahl:</span>
              <button
                onClick={() => setSelectedDays([...ALL_DAYS_SHORT])}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedDays.length === 7
                    ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Alle Tage
              </button>
              <button
                onClick={() => setSelectedDays(['Mo', 'Di', 'Mi'])}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedDays.length === 3 && selectedDays.every((d) => ['Mo', 'Di', 'Mi'].includes(d))
                    ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Mo–Mi
              </button>
              <button
                onClick={() => setSelectedDays(['Do', 'Fr', 'Sa'])}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedDays.length === 3 && selectedDays.every((d) => ['Do', 'Fr', 'Sa'].includes(d))
                    ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Do–Sa
              </button>
            </div>
          </div>

          {/* Header Banner & Savings */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-2xl font-bold">Wochen-Einkaufsliste</h2>
                </div>
                <p className="text-xs text-slate-400 max-w-lg">
                  {viewMode === 'aisle'
                    ? 'Sortiert nach deinem Supermarkt-Laufweg (Obst & Gemüse ➔ Kühlregal ➔ Fleisch/Fisch ➔ Trockenware). Kein Zickzack-Laufen mehr!'
                    : 'Getrennt nach Netto, NP und Vorratskammer.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50"
                  title="Fertige Einkaufsliste als druckbares PDF herunterladen"
                >
                  <FileDown className={`w-4 h-4 ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
                  <span>{isDownloadingPdf ? 'Generiere PDF...' : '📄 PDF herunterladen'}</span>
                </button>

                <button
                  onClick={handleBookAllToPantry}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition active:scale-95"
                  title="Nur haltbare Trockenwaren-Reste (z.B. Nudeln, Reis, Kerne) ins Vorratslager buchen. Frischeprodukte (Fleisch, Fisch, Gemüse) werden frisch verzehrt."
                >
                  <PackageCheck className="w-4 h-4" />
                  Restmengen ins Lager buchen
                </button>

                <button
                  onClick={handleCopyWhatsApp}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </button>

                <button
                  onClick={() => window.print()}
                  className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs transition"
                  title="Drucken"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cost, Budget & Savings Widget */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Tatsächliche Kosten</span>
                <span className="text-xl sm:text-2xl font-black text-white">{shoppingList.total_price.toFixed(2)} €</span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Wochenbudget</span>
                <span className="text-xl sm:text-2xl font-black text-white">{(shoppingList.budget || 120).toFixed(2)} €</span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Budget-Rest</span>
                <span className={`text-xl sm:text-2xl font-black ${
                  (shoppingList.budget_difference || 0) < 0 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {(shoppingList.budget_difference || 0) > 0 ? '+' : ''}{(shoppingList.budget_difference || 0).toFixed(2)} €
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-emerald-400 block uppercase tracking-wider">Ersparnis Rabatte</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">~{shoppingList.total_savings.toFixed(2)} €</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Budget-Auslastung: {Math.round((shoppingList.total_price / Math.max(1, shoppingList.budget || 120)) * 100)}%</span>
                <span>Limit: {(shoppingList.budget || 120).toFixed(2)} €</span>
              </div>
              <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    shoppingList.budget_status === 'exceeded'
                      ? 'bg-red-500'
                      : shoppingList.budget_status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((shoppingList.total_price / Math.max(1, shoppingList.budget || 120)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {shoppingList.budget_status === 'exceeded' && (
              <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  Achtung: Der Einkauf übersteigt das für diese Woche festgelegte Budget um <strong>{Math.abs(shoppingList.budget_difference || 0).toFixed(2)} €</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Add Custom Item Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              Eigenen Artikel auf die Liste setzen (z. B. Backpapier, Hafermilch, Zahnpasta)
            </h3>
            <form onSubmit={handleCreateCustom} className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                type="text"
                placeholder="Artikelname..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 min-w-[200px] px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                min="1"
                value={customQty}
                onChange={(e) => setCustomQty(parseFloat(e.target.value) || 1)}
                className="w-20 px-3 py-2 text-xs rounded-xl border border-slate-200 text-center font-bold"
              />
              <select
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                <option value="Stück">Stück</option>
                <option value="Packung">Packung</option>
                <option value="g">Gramm (g)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="Rolle">Rolle</option>
              </select>
              <select
                value={customRetailer}
                onChange={(e) => setCustomRetailer(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value="Netto">🟡 Netto Marken-Discount</option>
                <option value="NP">🔴 NP Discount</option>
                <option value="Lidl">🔵 Lidl</option>
                <option value="Aldi Nord">🔷 Aldi Nord</option>
                <option value="Aldi Süd">🔷 Aldi Süd</option>
                <option value="Rewe">🔴 Rewe</option>
                <option value="Kaufland">🔴 Kaufland</option>
                <option value="Edeka">🟡 Edeka</option>
                <option value="Sonstiges">⚪ Sonstiges</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
              >
                + Hinzufügen
              </button>
            </form>
          </div>

          {/* List Display: Either Aisle View or Store View */}
          {viewMode === 'aisle' ? (
            /* Gang-Laufweg (Supermarkt-Route) */
            <div className="space-y-6">
              {Object.entries(aisleGroups).map(([aisleName, items]) => {
                if (items.length === 0) return null;
                const doneCount = items.filter((i) => checkedMap[`${i.storeTag}-${i.name}`]).length;

                return (
                  <div key={aisleName} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm tracking-wide">{aisleName}</span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/20 font-semibold backdrop-blur-sm">
                          {items.length} Artikel
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        {doneCount} / {items.length} erledigt
                      </span>
                    </div>

                    <div className="p-3 divide-y divide-slate-100">
                      {items.map((it, idx) => renderItemRow(it, `${it.storeTag}-${it.name}`))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Nach Filiale getrennt (Netto, NP, Vorrat) */
            <div className="space-y-6">
              {/* Netto */}
              {shoppingList.items_netto.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-amber-400 text-stone-900 flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🟡 Netto Marken-Discount</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/15 font-semibold">
                        {shoppingList.items_netto.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_netto.filter((i) => checkedMap[`netto-${i.name}`]).length} / {shoppingList.items_netto.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_netto.map((it) => renderItemRow(it, `netto-${it.name}`))}
                  </div>
                </div>
              )}

              {/* NP */}
              {shoppingList.items_np.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🔴 NP Discount</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/20 font-semibold">
                        {shoppingList.items_np.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_np.filter((i) => checkedMap[`np-${i.name}`]).length} / {shoppingList.items_np.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_np.map((it) => renderItemRow(it, `np-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Lidl */}
              {shoppingList.items_lidl && shoppingList.items_lidl.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🔵 Lidl</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/20 font-semibold">
                        {shoppingList.items_lidl.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_lidl.filter((i) => checkedMap[`lidl-${i.name}`]).length} / {shoppingList.items_lidl.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_lidl.map((it) => renderItemRow(it, `lidl-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Aldi */}
              {shoppingList.items_aldi && shoppingList.items_aldi.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-sky-800 text-white flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🔷 Aldi (Nord & Süd)</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/20 font-semibold">
                        {shoppingList.items_aldi.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_aldi.filter((i) => checkedMap[`aldi-${i.name}`]).length} / {shoppingList.items_aldi.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_aldi.map((it) => renderItemRow(it, `aldi-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Rewe */}
              {shoppingList.items_rewe && shoppingList.items_rewe.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-red-700 text-white flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🔴 Rewe Dein Markt</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/20 font-semibold">
                        {shoppingList.items_rewe.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_rewe.filter((i) => checkedMap[`rewe-${i.name}`]).length} / {shoppingList.items_rewe.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_rewe.map((it) => renderItemRow(it, `rewe-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Kaufland */}
              {shoppingList.items_kaufland && shoppingList.items_kaufland.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-red-800 text-white flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🔴 Kaufland</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/20 font-semibold">
                        {shoppingList.items_kaufland.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_kaufland.filter((i) => checkedMap[`kaufland-${i.name}`]).length} / {shoppingList.items_kaufland.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_kaufland.map((it) => renderItemRow(it, `kaufland-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Edeka */}
              {shoppingList.items_edeka && shoppingList.items_edeka.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-yellow-400 text-blue-950 flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🟡 Edeka</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/15 font-semibold">
                        {shoppingList.items_edeka.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_edeka.filter((i) => checkedMap[`edeka-${i.name}`]).length} / {shoppingList.items_edeka.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_edeka.map((it) => renderItemRow(it, `edeka-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Vorratskammer */}
              {shoppingList.items_pantry.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-3.5 bg-slate-100 text-slate-800 flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold">⚪ Vorratskammer & Basics</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 font-semibold">
                        {shoppingList.items_pantry.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_pantry.filter((i) => checkedMap[`pantry-${i.name}`]).length} / {shoppingList.items_pantry.length}
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_pantry.map((it) => renderItemRow(it, `pantry-${it.name}`))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Items Section */}
          {shoppingList.custom_items && shoppingList.custom_items.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-3.5 bg-slate-800 text-white flex items-center justify-between">
                <h3 className="font-bold text-sm">📝 Eigene Zusatzartikel ({shoppingList.custom_items.length})</h3>
              </div>
              <div className="p-4 divide-y divide-slate-100">
                {shoppingList.custom_items.map((c) => (
                  <div key={c.id} className="py-2.5 px-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">{c.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {c.retailer}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {c.quantity} {c.unit}
                      </span>
                      <button
                        onClick={() => onDeleteCustomItem(c.id)}
                        className="text-slate-400 hover:text-red-600 transition"
                        title="Entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Substitute Modal (Ausverkauft? Schnelle Alternative) */}
      {substituteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                Ausverkauft?
              </span>
              <button
                onClick={() => setSubstituteItem(null)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Ersatz für „{substituteItem.name}“
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Liegt im gleichen Regal oder der gleichen Abteilung:
            </p>

            <div className="space-y-2 mb-5">
              {substituteItem.substitutes.map((alt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {alt}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Gleiche Nährwerte</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSubstituteItem(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-500 animate-bounce text-xs font-bold">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Einkaufsliste für WhatsApp kopiert!</span>
        </div>
      )}

      {bookedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-blue-500 animate-bounce text-xs font-bold max-w-sm">
          <PackageCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Haltbare Restmengen (Trockenware) ins Vorratslager gebucht! Frischeprodukte (Fleisch, Fisch, Gemüse) verbleiben frisch.</span>
        </div>
      )}
    </div>
  );
};

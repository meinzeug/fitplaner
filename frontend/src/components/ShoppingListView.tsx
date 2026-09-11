import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingList, ShoppingItem, CustomShoppingItem, PantryItem, FamilyMember, ShoppingItemOverride, Retailer, RecurringPurchaseRule } from '../types';
import { formatHumanQuantity, formatHumanQuantityText } from '../utils/humanQuantity';
import { PantryView } from './PantryView';
import { ChatGptLiveModal } from './ChatGptLiveModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { calculateMultiStoreSplit, MultiStoreSplitReport } from '../utils/savingsOptimizer';
import { identifyPlantInIngredient } from '../utils/plantDiversityTracker';
import { isShelfStableDryGood } from '../backend_embedded/shelfStability';
import { apiFetch, getServerUrl } from '../api/client';
import {
  ShoppingBag, Share2, Printer, Check, CheckSquare, Square, Plus, Minus,
  Archive, Sparkles, Trash2, PackageCheck, ChevronLeft, ChevronRight,
  Calendar, Wallet, AlertTriangle, Compass, Smartphone, HelpCircle,
  X, ArrowRight, ShieldCheck, RefreshCw, Layers, FileDown, Barcode, Store,
  Flame, TrendingDown, Split, Edit3, Undo2, CheckCircle2, RotateCcw, Sliders,
  Eye, EyeOff, Repeat
} from 'lucide-react';

interface Props {
  shoppingList: ShoppingList | null;
  selectedWeekOffset: number;
  onChangeWeek: (offset: number) => void;
  onRefresh: () => void;
  onBookCartToPantry: (items: any[]) => Promise<void>;
  onAddCustomItem: (item: Partial<CustomShoppingItem>) => Promise<void>;
  onDeleteCustomItem: (id: string) => Promise<void>;
  familyMembers?: FamilyMember[];
  pantryItems?: PantryItem[];
  onSavePantryItem?: (item: PantryItem) => Promise<void>;
  onDeletePantryItem?: (id: string) => Promise<void>;
  onRefreshPantry?: () => void;
  onOpenNettoBrowser?: () => void;
  onOpenPdfScanner?: () => void;
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

const STORE_META: Record<string, { label: string; icon: string; bg: string; text: string; activeBg: string; activeBorder: string }> = {
  Netto: {
    label: 'Netto',
    icon: '🟡',
    bg: 'bg-amber-50 text-amber-900 border-amber-200',
    text: 'text-amber-900',
    activeBg: 'bg-amber-400 text-stone-950 font-black shadow-sm',
    activeBorder: 'border-amber-400',
  },
  NP: {
    label: 'NP',
    icon: '🔴',
    bg: 'bg-red-50 text-red-700 border-red-200',
    text: 'text-red-700',
    activeBg: 'bg-red-600 text-white font-black shadow-sm',
    activeBorder: 'border-red-600',
  },
  Lidl: {
    label: 'Lidl',
    icon: '🔵',
    bg: 'bg-blue-50 text-blue-800 border-blue-200',
    text: 'text-blue-800',
    activeBg: 'bg-blue-600 text-white font-black shadow-sm',
    activeBorder: 'border-blue-600',
  },
  Aldi: {
    label: 'Aldi',
    icon: '🔷',
    bg: 'bg-sky-50 text-sky-900 border-sky-200',
    text: 'text-sky-900',
    activeBg: 'bg-sky-800 text-white font-black shadow-sm',
    activeBorder: 'border-sky-800',
  },
  Rewe: {
    label: 'Rewe',
    icon: '🔴',
    bg: 'bg-rose-50 text-rose-800 border-rose-200',
    text: 'text-rose-800',
    activeBg: 'bg-rose-700 text-white font-black shadow-sm',
    activeBorder: 'border-rose-700',
  },
  Kaufland: {
    label: 'Kaufland',
    icon: '🔴',
    bg: 'bg-red-50 text-red-900 border-red-200',
    text: 'text-red-900',
    activeBg: 'bg-red-800 text-white font-black shadow-sm',
    activeBorder: 'border-red-800',
  },
  Edeka: {
    label: 'Edeka',
    icon: '🟡',
    bg: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    text: 'text-yellow-900',
    activeBg: 'bg-yellow-400 text-stone-950 font-black shadow-sm',
    activeBorder: 'border-yellow-400',
  },
  dm: {
    label: 'dm Drogerie',
    icon: '🟣',
    bg: 'bg-purple-50 text-purple-900 border-purple-200',
    text: 'text-purple-900',
    activeBg: 'bg-purple-600 text-white font-black shadow-sm',
    activeBorder: 'border-purple-600',
  },
  Rossmann: {
    label: 'Rossmann',
    icon: '🔴',
    bg: 'bg-rose-50 text-rose-900 border-rose-200',
    text: 'text-rose-900',
    activeBg: 'bg-rose-600 text-white font-black shadow-sm',
    activeBorder: 'border-rose-600',
  },
  Apotheke: {
    label: 'Apotheke',
    icon: '🟢',
    bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    text: 'text-emerald-900',
    activeBg: 'bg-emerald-600 text-white font-black shadow-sm',
    activeBorder: 'border-emerald-600',
  },
  Tierbedarf: {
    label: 'Tierbedarf',
    icon: '🐾',
    bg: 'bg-amber-50 text-amber-900 border-amber-200',
    text: 'text-amber-900',
    activeBg: 'bg-amber-700 text-white font-black shadow-sm',
    activeBorder: 'border-amber-700',
  },
  Vorratskammer: {
    label: 'Vorrat',
    icon: '📦',
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    text: 'text-slate-700',
    activeBg: 'bg-slate-800 text-white font-black shadow-sm',
    activeBorder: 'border-slate-800',
  },
};

export const ShoppingListView: React.FC<Props> = ({
  shoppingList: initialShoppingList,
  selectedWeekOffset,
  onChangeWeek,
  onRefresh,
  onBookCartToPantry,
  onAddCustomItem,
  onDeleteCustomItem,
  familyMembers = [],
  pantryItems = [],
  onSavePantryItem,
  onDeletePantryItem,
  onRefreshPantry,
  onOpenNettoBrowser,
  onOpenPdfScanner,
}) => {
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
  const [activeList, setActiveList] = useState<ShoppingList | null>(initialShoppingList);
  const [isChatGptModalOpen, setIsChatGptModalOpen] = useState(false);
  const [onlyDealsFilter, setOnlyDealsFilter] = useState(false);

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
  // Main Sub-Tab: 'list' (Einkaufsliste), 'routines' (Haushalts-Routinen & Abos), or 'pantry' (Vorratskammer & Scanner)
  const [subTab, setSubTab] = useState<'list' | 'routines' | 'pantry'>('list');

  // Recurring purchase rules state
  const [recurringRules, setRecurringRules] = useState<RecurringPurchaseRule[]>([]);
  const [isSyncingRoutines, setIsSyncingRoutines] = useState(false);
  const [routineToast, setRoutineToast] = useState<string | null>(null);

  const fetchRecurringRules = async () => {
    try {
      const res = await apiFetch('/api/recurring');
      if (res.ok) {
        const data = await res.json();
        setRecurringRules(data);
      }
    } catch (e) {
      console.warn('Failed to fetch recurring rules', e);
    }
  };

  useEffect(() => {
    fetchRecurringRules();
  }, []);

  const handleSyncRoutinesToList = async () => {
    setIsSyncingRoutines(true);
    try {
      const res = await apiFetch('/api/recurring/sync-to-list', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (onRefresh) onRefresh();
        fetchRecurringRules();
        setRoutineToast(`${data.added_count} Routine-Artikel auf Einkaufsliste gesetzt!`);
        setTimeout(() => setRoutineToast(null), 2500);
      }
    } catch (e) {
      console.warn('Failed to sync routines', e);
    } finally {
      setIsSyncingRoutines(false);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    try {
      await apiFetch(`/api/recurring/${id}`, { method: 'DELETE' });
      setRecurringRules((prev) => prev.filter((r) => r.id !== id));
      setRoutineToast('Routine entfernt');
      setTimeout(() => setRoutineToast(null), 1500);
    } catch (e) {}
  };

  const handleToggleRoutineActive = async (rule: RecurringPurchaseRule) => {
    try {
      const updated = { ...rule, active: !rule.active };
      await apiFetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setRecurringRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch (e) {}
  };

  // View Mode: 'aisle' (Gang-Laufweg) or 'store' (Filial-Trennung)
  const [viewMode, setViewMode] = useState<'aisle' | 'store'>('aisle');

  // Supermarkt / Filialen-Filter ('all' oder spezifischer Markt wie 'Netto', 'NP' etc.)
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');

  // In-Store Thumb Mode (große Touch-Tasten)
  const [thumbMode, setThumbMode] = useState(false);

  // Checked Map for shopping items
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [copiedToast, setCopiedToast] = useState(false);
  const [bookedToast, setBookedToast] = useState(false);

  // Substitute Modal State
  const [substituteItem, setSubstituteItem] = useState<{ name: string; substitutes: string[]; storeTag?: string } | null>(null);

  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customUnit, setCustomUnit] = useState('Stück');
  const [customRetailer, setCustomRetailer] = useState<string>('Netto');
  const [customCategory, setCustomCategory] = useState<string>('Drogerie & Körperpflege');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleAddScannedProduct = async (product: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    retailer: Retailer;
    barcode: string;
    price?: number;
    is_bought?: boolean;
    recurring_rule?: RecurringPurchaseRule;
  }) => {
    await onAddCustomItem({
      name: product.name,
      quantity: product.quantity,
      unit: product.unit,
      category: product.category,
      retailer: product.retailer,
      barcode: product.barcode,
      price: product.price,
      recurring_rule: product.recurring_rule,
    });

    if (product.recurring_rule) {
      fetchRecurringRules();
    }

    if (product.is_bought) {
      setCheckedMap((prev) => ({
        ...prev,
        [`${product.retailer}-${product.name}`]: true,
        [`Custom-${product.name}`]: true,
      }));
    }
  };

  // --- ITEM OVERRIDES & SUPERMARKT LIVE-MODUS ---
  const [itemOverrides, setItemOverrides] = useState<Record<string, ShoppingItemOverride>>(() => {
    try {
      const saved = localStorage.getItem(`fitplaner_overrides_kw_${selectedWeekOffset}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`fitplaner_overrides_kw_${selectedWeekOffset}`, JSON.stringify(itemOverrides));
    } catch (e) {
      console.error('Failed to save itemOverrides:', e);
    }
  }, [itemOverrides, selectedWeekOffset]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`fitplaner_overrides_kw_${selectedWeekOffset}`);
      setItemOverrides(saved ? JSON.parse(saved) : {});
    } catch {
      setItemOverrides({});
    }
  }, [selectedWeekOffset]);

  const [isLiveMode, setIsLiveMode] = useState<boolean>(() => {
    return localStorage.getItem('fitplaner_live_shopping_mode') === 'true';
  });

  const toggleLiveMode = () => {
    setIsLiveMode((prev) => {
      const next = !prev;
      localStorage.setItem('fitplaner_live_shopping_mode', String(next));
      if (next) {
        setThumbMode(true);
        setViewMode('aisle');
      }
      return next;
    });
  };

  const [editItemModal, setEditItemModal] = useState<{
    item: ShoppingItem & { storeTag?: string };
    tempPacks: number;
    tempQuantity: number;
    tempUnit: string;
  } | null>(null);

  const [customSubstituteText, setCustomSubstituteText] = useState('');
  const [showExcludedDrawer, setShowExcludedDrawer] = useState(false);
  const [showFinishShoppingModal, setShowFinishShoppingModal] = useState(false);

  const getItemKey = (item: { name: string; storeTag?: string; retailer?: string }) => {
    return `${item.storeTag || item.retailer || ''}_${item.name.toLowerCase().trim()}`;
  };

  const handleAdjustPacks = (item: ShoppingItem & { storeTag?: string }, delta: number) => {
    const key = getItemKey(item);
    const genericKey = item.name.toLowerCase().trim();
    const currentPacks = item.packs_to_buy || 1;
    const newPacks = currentPacks + delta;

    if (newPacks <= 0) {
      if (window.confirm(`„${item.name}“ von der Einkaufsliste streichen?`)) {
        handleExcludeItem(item);
      }
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);

    setItemOverrides((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        packs_to_buy: newPacks,
        is_excluded: false,
      },
      [genericKey]: {
        ...(prev[genericKey] || {}),
        packs_to_buy: newPacks,
        is_excluded: false,
      },
    }));
  };

  const handleExcludeItem = (item: ShoppingItem & { storeTag?: string }) => {
    const key = getItemKey(item);
    const genericKey = item.name.toLowerCase().trim();
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([40, 30, 40]);
    setItemOverrides((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        is_excluded: true,
      },
      [genericKey]: {
        ...(prev[genericKey] || {}),
        is_excluded: true,
      },
    }));
  };

  const handleRestoreItem = (item: ShoppingItem & { storeTag?: string }) => {
    const key = getItemKey(item);
    const genericKey = item.name.toLowerCase().trim();
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
    setItemOverrides((prev) => {
      const next = { ...prev };
      if (next[key]) next[key] = { ...next[key], is_excluded: false };
      if (next[genericKey]) next[genericKey] = { ...next[genericKey], is_excluded: false };
      return next;
    });
  };

  const handleSaveItemEdit = () => {
    if (!editItemModal) return;
    const { item, tempPacks, tempQuantity } = editItemModal;
    const key = getItemKey(item);
    const genericKey = item.name.toLowerCase().trim();

    setItemOverrides((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        packs_to_buy: Math.max(1, tempPacks),
        custom_quantity: Math.max(1, tempQuantity),
        is_excluded: false,
      },
      [genericKey]: {
        ...(prev[genericKey] || {}),
        packs_to_buy: Math.max(1, tempPacks),
        custom_quantity: Math.max(1, tempQuantity),
        is_excluded: false,
      },
    }));
    setEditItemModal(null);
  };

  const handleApplySubstitute = (item: { name: string; storeTag?: string }, replacementName: string) => {
    const cleanRepl = replacementName.trim();
    if (!cleanRepl) return;
    const key = getItemKey(item);
    const genericKey = item.name.toLowerCase().trim();

    setItemOverrides((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        replacement_name: cleanRepl,
        is_excluded: false,
      },
      [genericKey]: {
        ...(prev[genericKey] || {}),
        replacement_name: cleanRepl,
        is_excluded: false,
      },
    }));
    setSubstituteItem(null);
    setCustomSubstituteText('');
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
  };

  const handleRevertSubstitute = (item: ShoppingItem & { storeTag?: string }) => {
    const key = getItemKey(item);
    const genericKey = item.name.toLowerCase().trim();
    setItemOverrides((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key].replacement_name;
      if (next[genericKey]) delete next[genericKey].replacement_name;
      return next;
    });
  };

  const handleResetAllOverrides = () => {
    if (window.confirm('Alle manuellen Anpassungen (Packungen, Mengen, Streichungen) für diese Woche zurücksetzen?')) {
      setItemOverrides({});
      localStorage.removeItem(`fitplaner_overrides_kw_${selectedWeekOffset}`);
    }
  };

  const applyOverridesToItems = (items: ShoppingItem[], storeTagDefault?: string): ShoppingItem[] => {
    return items.map((orig) => {
      const tag = (orig as any).storeTag || storeTagDefault || orig.retailer || '';
      const key = `${tag}_${orig.name.toLowerCase().trim()}`;
      const genericKey = orig.name.toLowerCase().trim();
      const ov = itemOverrides[key] || itemOverrides[genericKey];
      if (!ov) return orig;

      const updated = { ...orig };
      if (ov.is_excluded !== undefined) {
        updated.is_excluded = ov.is_excluded;
      }
      if (ov.replacement_name) {
        updated.original_name = orig.name;
        updated.name = ov.replacement_name;
        updated.exact_product_name = `${tag || orig.retailer || ''} ${ov.replacement_name}`.trim();
        updated.is_substituted = true;
        updated.is_pantry_eligible = isShelfStableDryGood(ov.replacement_name, orig.category);
      }
      if (ov.custom_quantity !== undefined && ov.custom_quantity > 0) {
        updated.custom_quantity = ov.custom_quantity;
        updated.total_quantity = ov.custom_quantity;
      }
      if (ov.packs_to_buy !== undefined && ov.packs_to_buy >= 0) {
        updated.packs_to_buy = ov.packs_to_buy;
        const unitP = orig.unit_price || 1.49;
        updated.total_price = Math.round(ov.packs_to_buy * unitP * 100) / 100;
        if (orig.is_on_sale && orig.original_price && (orig.packs_to_buy || 1) > 0) {
          const singleOrig = orig.original_price / Math.max(1, orig.packs_to_buy || 1);
          updated.original_price = Math.round(ov.packs_to_buy * singleOrig * 100) / 100;
          updated.savings = Math.max(0, Math.round((updated.original_price - updated.total_price) * 100) / 100);
        } else {
          updated.savings = 0;
        }

        // Recalculate leftover
        if (updated.is_pantry_eligible) {
          const packSize = orig.pack_size || 500;
          const needed = updated.custom_quantity ?? orig.net_need_quantity ?? orig.total_quantity;
          updated.leftover_after_purchase = Math.max(0, Math.round((ov.packs_to_buy * packSize - needed) * 10) / 10);
        } else {
          updated.leftover_after_purchase = 0;
        }
      }
      return updated;
    });
  };

  const effectiveShoppingList = useMemo(() => {
    if (!shoppingList) return null;

    const netto = applyOverridesToItems(shoppingList.items_netto || [], 'Netto');
    const np = applyOverridesToItems(shoppingList.items_np || [], 'NP');
    const lidl = applyOverridesToItems(shoppingList.items_lidl || [], 'Lidl');
    const aldi = applyOverridesToItems(shoppingList.items_aldi || [], 'Aldi');
    const rewe = applyOverridesToItems(shoppingList.items_rewe || [], 'Rewe');
    const kaufland = applyOverridesToItems(shoppingList.items_kaufland || [], 'Kaufland');
    const edeka = applyOverridesToItems(shoppingList.items_edeka || [], 'Edeka');
    const pantry = applyOverridesToItems(shoppingList.items_pantry || [], 'Vorratskammer');

    const allStoreItems = [...netto, ...np, ...lidl, ...aldi, ...rewe, ...kaufland, ...edeka];
    const activeStoreItems = allStoreItems.filter((i) => !i.is_excluded && !i.is_covered_by_stock);

    const totalCost = activeStoreItems.reduce((sum, i) => sum + (i.total_price || 0), 0);
    const totalSavings = activeStoreItems.reduce((sum, i) => sum + (i.savings || 0), 0);
    const budget = shoppingList.budget || 120;
    const budgetDiff = budget - totalCost;

    return {
      ...shoppingList,
      items_netto: netto,
      items_np: np,
      items_lidl: lidl,
      items_aldi: aldi,
      items_rewe: rewe,
      items_kaufland: kaufland,
      items_edeka: edeka,
      items_pantry: pantry,
      total_price: Math.round(totalCost * 100) / 100,
      total_savings: Math.round(totalSavings * 100) / 100,
      budget,
      budget_difference: Math.round(budgetDiff * 100) / 100,
      budget_status: (totalCost > budget ? 'exceeded' : (totalCost >= budget * 0.85 ? 'warning' : 'ok')) as 'ok' | 'warning' | 'exceeded',
    };
  }, [shoppingList, itemOverrides]);

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
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }
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
    if (!effectiveShoppingList) return;
    const allItemsToBook: any[] = [];

    const collectItems = (items: ShoppingItem[]) => {
      for (const it of items) {
        // STRICT RULE: Only non-excluded shelf-stable dry goods (is_pantry_eligible) migrate to pantry with surplus
        if (!it.is_excluded && !it.is_covered_by_stock && it.is_pantry_eligible) {
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

    collectItems(effectiveShoppingList.items_netto);
    collectItems(effectiveShoppingList.items_np);
    if (effectiveShoppingList.items_lidl) collectItems(effectiveShoppingList.items_lidl);
    if (effectiveShoppingList.items_aldi) collectItems(effectiveShoppingList.items_aldi);
    if (effectiveShoppingList.items_rewe) collectItems(effectiveShoppingList.items_rewe);
    if (effectiveShoppingList.items_kaufland) collectItems(effectiveShoppingList.items_kaufland);
    if (effectiveShoppingList.items_edeka) collectItems(effectiveShoppingList.items_edeka);

    for (const c of effectiveShoppingList.custom_items) {
      if (isShelfStableDryGood(c.name, c.category)) {
        allItemsToBook.push({
          name: c.name,
          total_quantity: c.quantity,
          unit: c.unit,
          category: c.category,
          source: 'Kauf',
        });
      }
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

  // Combine all items for aisle grouping from effective shopping list
  const allItemsWithStore = useMemo(() => {
    if (!effectiveShoppingList) return [];
    return [
      ...effectiveShoppingList.items_netto.map((i) => ({ ...i, storeTag: 'Netto' })),
      ...effectiveShoppingList.items_np.map((i) => ({ ...i, storeTag: 'NP' })),
      ...(effectiveShoppingList.items_lidl || []).map((i) => ({ ...i, storeTag: 'Lidl' })),
      ...(effectiveShoppingList.items_aldi || []).map((i) => ({ ...i, storeTag: 'Aldi' })),
      ...(effectiveShoppingList.items_rewe || []).map((i) => ({ ...i, storeTag: 'Rewe' })),
      ...(effectiveShoppingList.items_kaufland || []).map((i) => ({ ...i, storeTag: 'Kaufland' })),
      ...(effectiveShoppingList.items_edeka || []).map((i) => ({ ...i, storeTag: 'Edeka' })),
      ...effectiveShoppingList.items_pantry.map((i) => ({ ...i, storeTag: 'Vorratskammer' })),
    ];
  }, [effectiveShoppingList]);

  // Split into active and excluded
  const excludedItems = useMemo(() => {
    return allItemsWithStore.filter((i) => i.is_excluded);
  }, [allItemsWithStore]);

  const activeItemsWithStore = useMemo(() => {
    return allItemsWithStore.filter((i) => !i.is_excluded);
  }, [allItemsWithStore]);

  // Live Mode Stats
  const checkedItemsCount = useMemo(() => {
    return activeItemsWithStore.filter((i) => checkedMap[`${i.storeTag}-${i.name}`]).length;
  }, [activeItemsWithStore, checkedMap]);

  const totalActiveItemsCount = activeItemsWithStore.length;

  const progressPercent = totalActiveItemsCount > 0
    ? Math.round((checkedItemsCount / totalActiveItemsCount) * 100)
    : 0;

  const checkedCost = useMemo(() => {
    return activeItemsWithStore
      .filter((i) => checkedMap[`${i.storeTag}-${i.name}`] && !i.is_covered_by_stock)
      .reduce((sum, i) => sum + (i.total_price || 0), 0);
  }, [activeItemsWithStore, checkedMap]);

  const remainingCost = useMemo(() => {
    return activeItemsWithStore
      .filter((i) => !checkedMap[`${i.storeTag}-${i.name}`] && !i.is_covered_by_stock)
      .reduce((sum, i) => sum + (i.total_price || 0), 0);
  }, [activeItemsWithStore, checkedMap]);

  // Dynamically compute available stores with item counts
  const availableStores = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of activeItemsWithStore) {
      counts[item.storeTag] = (counts[item.storeTag] || 0) + 1;
    }
    return Object.keys(counts).map((storeKey) => ({
      key: storeKey,
      count: counts[storeKey],
      meta: STORE_META[storeKey] || {
        label: storeKey,
        icon: '🏪',
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        text: 'text-slate-700',
        activeBg: 'bg-emerald-600 text-white font-black shadow-sm',
        activeBorder: 'border-emerald-600',
      },
    }));
  }, [activeItemsWithStore]);

  // Filtered items for aisle view based on selected store and deals filter
  const itemsForAisle = useMemo(() => {
    let items = selectedStoreFilter === 'all'
      ? activeItemsWithStore
      : activeItemsWithStore.filter((i) => i.storeTag === selectedStoreFilter);

    if (onlyDealsFilter) {
      items = items.filter((i) => i.is_on_sale && !i.is_covered_by_stock);
    }
    return items;
  }, [activeItemsWithStore, selectedStoreFilter, onlyDealsFilter]);

  const multiStoreReport: MultiStoreSplitReport | null = useMemo(() => {
    if (!effectiveShoppingList) return null;
    const rawItems: ShoppingItem[] = [
      ...effectiveShoppingList.items_netto,
      ...effectiveShoppingList.items_np,
      ...(effectiveShoppingList.items_lidl || []),
    ];
    return calculateMultiStoreSplit(rawItems, ['Netto', 'NP', 'Lidl']);
  }, [effectiveShoppingList]);

  const aisleGroups: Record<string, typeof allItemsWithStore> = {
    '1. Obst- & Gemüse-Insel': [],
    '2. Kühlregal & Molkerei': [],
    '3. Fleisch & Frischer Fisch': [],
    '4. Trockensortiment & Vorräte': [],
    '6. Drogerie & Körperpflege': [],
    '7. Haushalt & Reinigung': [],
    '8. Gesundheit & Apotheke': [],
    '9. Tierbedarf & Non-Food': [],
    '5. Basics & Gewürze': [],
  };

  itemsForAisle.forEach((item) => {
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
        className={`rounded-2xl transition flex items-center justify-between select-none gap-2 sm:gap-3 ${
          thumbMode || isLiveMode ? 'p-3 sm:p-3.5 my-1.5 min-h-[60px]' : 'p-2.5 sm:p-3 my-1 min-h-[48px]'
        } ${
          isChecked
            ? 'bg-slate-100/70 opacity-40 line-through text-slate-400 border border-transparent'
            : 'bg-white hover:bg-slate-50/80 border border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          <div
            onClick={() => toggleCheck(uniqueKey)}
            className="cursor-pointer shrink-0"
          >
            {isChecked ? (
              <CheckSquare className={thumbMode || isLiveMode ? 'w-6 h-6 text-emerald-600' : 'w-5 h-5 text-emerald-600'} />
            ) : (
              <Square className={thumbMode || isLiveMode ? 'w-6 h-6 text-slate-300' : 'w-5 h-5 text-slate-300 hover:text-slate-400'} />
            )}
          </div>

          <div
            onClick={() => toggleCheck(uniqueKey)}
            className="min-w-0 flex-1 cursor-pointer"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className={`font-black text-slate-900 leading-snug truncate ${thumbMode || isLiveMode ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
                {item.exact_product_name || item.name}
              </span>

              {item.storeTag && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                  item.storeTag === 'Netto' ? 'bg-amber-100 text-stone-900 border border-amber-300' :
                  item.storeTag === 'NP' ? 'bg-red-100 text-red-700 border border-red-300' :
                  item.storeTag === 'Lidl' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                  'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {item.storeTag}
                </span>
              )}

              {item.is_on_sale && !item.is_covered_by_stock && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-2xs">
                  <Flame className="w-2.5 h-2.5 text-yellow-200 fill-yellow-200" />
                  <span>DEAL</span>
                </span>
              )}

              {item.is_covered_by_stock ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Vorrat (0 €)
                </span>
              ) : (
                item.packs_to_buy > 0 && item.pack_size && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {item.packs_to_buy}x {item.pack_size} {item.unit}
                  </span>
                )
              )}

              {item.is_substituted && item.original_name && (
                <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                  🔄 Ersatz
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
              <span>Bedarf: {formatHumanQuantityText(item.total_quantity, item.unit)}</span>
              {item.brand && <span>• {item.brand}</span>}
              {item.leftover_after_purchase > 0 && !item.is_covered_by_stock && item.is_pantry_eligible && (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded text-[10px]">
                  📦 Rest {formatHumanQuantityText(item.leftover_after_purchase, item.unit)} → Vorrat
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Stepper / Edit & Price */}
        <div className="flex items-center gap-2 shrink-0">
          {!item.is_covered_by_stock && (thumbMode || isLiveMode) && (
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdjustPacks(item, -1);
                }}
                className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-black flex items-center justify-center text-xs"
                title="Packung weniger"
              >
                -
              </button>
              <span className="font-mono font-black text-xs px-1 text-slate-800">
                {item.packs_to_buy || 1}x
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdjustPacks(item, 1);
                }}
                className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-black flex items-center justify-center text-xs"
                title="Packung mehr"
              >
                +
              </button>
            </div>
          )}

          {!item.is_covered_by_stock && !thumbMode && !isLiveMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditItemModal({
                  item,
                  tempPacks: item.packs_to_buy || 1,
                  tempQuantity: item.total_quantity || item.pack_size || 0,
                  tempUnit: item.unit || 'g',
                });
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Menge / Einheit / Ersatz bearbeiten"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="text-right min-w-[55px]">
            {item.is_covered_by_stock ? (
              <span className="font-black font-mono block text-emerald-700 text-xs sm:text-sm">
                0,00 €
              </span>
            ) : (
              <>
                <span className={`font-black font-mono block text-xs sm:text-sm ${item.is_on_sale ? 'text-red-600' : 'text-slate-900'}`}>
                  ~{(item.total_price || 0).toFixed(2)} €
                </span>
                {item.savings && item.savings > 0 && (
                  <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-black block text-center mt-0.5">
                    -{item.savings.toFixed(2)} €
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* 1. UNIFIED PAGE HEADER */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Einkaufsliste
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                {totalActiveItemsCount} Artikel
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {shoppingList?.week_label || 'Aktuelle Woche'} • Reale Supermarkt-Deals Netto & NP
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleLiveMode}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition active:scale-95 shadow-xs ${
              isLiveMode
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            🛒 Live-Modus
          </button>

          <button
            onClick={() => setShowFinishShoppingModal(true)}
            disabled={checkedItemsCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition active:scale-95 shadow-xs"
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">In Vorrat buchen</span>
            <span className="sm:hidden">Vorrat ({checkedItemsCount})</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Switcher: Liste vs Routinen vs Vorratskammer */}
      <div className="flex items-center justify-between bg-white rounded-3xl p-2 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSubTab('list')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
              subTab === 'list'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Einkaufsliste</span>
          </button>
          <button
            onClick={() => setSubTab('routines')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
              subTab === 'routines'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Repeat className="w-4 h-4 text-purple-400" />
            <span>Routinen & Abos ({recurringRules.length})</span>
          </button>
          <button
            onClick={() => setSubTab('pantry')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
              subTab === 'pantry'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-4 h-4 text-amber-400" />
            <span>Vorratskammer ({pantryItems.length})</span>
          </button>
        </div>

        {/* Controls: Live-Modus, Daumen-Modus, Reset */}
        {subTab === 'list' && (
          <div className="flex items-center gap-2 pr-2">
            {/* Live Supermarkt Modus Toggle */}
            <button
              onClick={toggleLiveMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                isLiveMode
                  ? 'bg-emerald-600 text-white font-black ring-2 ring-emerald-400'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Supermarkt Live-Modus aktivieren"
            >
              <span className="relative flex h-2 w-2">
                {isLiveMode && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveMode ? 'bg-white' : 'bg-emerald-600'}`}></span>
              </span>
              <span className="hidden sm:inline">🛒 Live-Modus</span>
              <span className="sm:hidden">🛒 Live</span>
            </button>

            {/* Daumen Modus */}
            <button
              onClick={() => setThumbMode(!thumbMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                thumbMode
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Große Touch-Tasten für einhändige Bedienung im Supermarkt"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">📱 Daumen</span>
            </button>

            {/* Reset overrides if any */}
            {Object.keys(itemOverrides).length > 0 && (
              <button
                onClick={handleResetAllOverrides}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 text-xs transition"
                title="Alle manuellen Anpassungen (Mengen, Streichungen) zurücksetzen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {subTab === 'routines' ? (
        /* HAUSHALTS-ROUTINEN & ABOS VIEW */
        <div className="space-y-6 animate-fadeIn">
          {/* Header Hero Card */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-800/40">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                <Repeat className="w-3.5 h-3.5 text-purple-400" />
                <span>Persönliche Haushalts-Routinen & Dauer-Bedarfe</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Wiederkehrende Einkaufs-Zyklen
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Drogerieartikel (dm, Rossmann), Haushalt, Tierbedarf & Grundnahrungsmittel, die du täglich, wöchentlich oder monatlich brauchst.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSyncRoutinesToList}
              disabled={isSyncingRoutines || recurringRules.length === 0}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black shadow-lg active:scale-95 transition flex items-center justify-center gap-2 shrink-0"
            >
              {isSyncingRoutines ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>Fällige Routinen auf Liste packen</span>
            </button>
          </div>

          {/* Toast */}
          {routineToast && (
            <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-black flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{routineToast}</span>
            </div>
          )}

          {/* Routines Grid */}
          {recurringRules.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                <Repeat className="w-7 h-7" />
              </div>
              <h3 className="font-black text-base text-slate-800">
                Noch keine Haushalts-Routinen angelegt
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Scanne mit dem Barcode-Scanner ein Drogerie-, Haushalts- oder Vorratsprodukt und wähle „Wiederkehrender Kauf-Zyklus“, oder nutze die Einkaufsliste!
              </p>
              <button
                type="button"
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition inline-flex items-center gap-2 shadow-sm"
              >
                <Barcode className="w-4 h-4 text-emerald-400" />
                <span>Produkt jetzt scannen</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recurringRules.map((rule) => {
                const freqLabel =
                  rule.frequency === 'daily'
                    ? 'täglich'
                    : rule.frequency === 'weekly'
                    ? 'wöchentlich'
                    : rule.frequency === 'biweekly'
                    ? 'alle 2 Wochen'
                    : 'monatlich';

                const storeMeta = STORE_META[rule.retailer] || { icon: '🏪', label: rule.retailer, bg: 'bg-slate-50 text-slate-700' };

                return (
                  <div
                    key={rule.id}
                    className={`bg-white rounded-2xl border p-4 shadow-xs transition flex flex-col justify-between gap-3 ${
                      rule.active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 opacity-60 bg-slate-50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 border ${storeMeta.bg}`}>
                          <span>{storeMeta.icon}</span>
                          <span>{storeMeta.label}</span>
                        </span>

                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                          <Repeat className="w-3 h-3 text-purple-600" />
                          <span>{rule.count_per_cycle}x {freqLabel}</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-sm text-slate-900 leading-snug">
                          {rule.name}
                        </h4>
                        {rule.brand && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            {rule.brand}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 font-bold mt-1">
                          {rule.quantity} {rule.unit} {rule.price ? `• ~${rule.price.toFixed(2)} €` : ''}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Abteilung: {rule.category}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleRoutineActive(rule)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition border ${
                          rule.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {rule.active ? 'Aktiv' : 'Pausiert'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={async () => {
                            await onAddCustomItem({
                              name: rule.name,
                              quantity: rule.quantity * rule.count_per_cycle,
                              unit: rule.unit,
                              category: rule.category,
                              retailer: rule.retailer,
                              brand: rule.brand,
                              barcode: rule.barcode,
                              price: rule.price ? rule.price * rule.count_per_cycle : undefined,
                              notes: `🔁 Routine: ${rule.count_per_cycle}x ${freqLabel}`,
                              recurring_rule: rule,
                            });
                            setRoutineToast(`„${rule.name}“ auf Einkaufsliste gesetzt!`);
                            setTimeout(() => setRoutineToast(null), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold active:scale-95 transition"
                          title="Jetzt sofort auf die Einkaufsliste setzen"
                        >
                          + Auf Liste
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoutine(rule.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Routine löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : subTab === 'pantry' ? (
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
          {/* Sticky Supermarkt Live-Modus Cockpit (wenn aktiv) */}
          {isLiveMode && (
            <div className="sticky top-2 z-30 bg-slate-950 text-white rounded-2xl p-3 shadow-xl border border-emerald-500/50 mb-3 flex items-center justify-between gap-2 backdrop-blur-md bg-opacity-95 animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white truncate">
                    {checkedItemsCount} von {totalActiveItemsCount} im Wagen ({progressPercent}%)
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono truncate">
                    {checkedCost.toFixed(2)} € bezahlt • noch {remainingCost.toFixed(2)} €
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBarcodeScannerOpen(true)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 active:scale-95 transition"
                  title="Barcode scannen"
                >
                  <Barcode className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowFinishShoppingModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition"
                >
                  Fertig ✅
                </button>

                <button
                  type="button"
                  onClick={toggleLiveMode}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white"
                  title="Live-Modus schließen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Clean Store Filter & Action Bar (Direkt ganz oben!) */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs flex items-center justify-between gap-2">
            {/* Horizontal Store Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedStoreFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition ${
                  selectedStoreFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Alle ({totalActiveItemsCount})
              </button>
              {availableStores.map(({ key, count, meta }) => {
                const isSelected = selectedStoreFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedStoreFilter(key)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1 border ${
                      isSelected
                        ? `${meta.activeBg} ${meta.activeBorder}`
                        : `${meta.bg} hover:opacity-90`
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                    <span className="text-[10px] opacity-80 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions: 📷 Scan & ••• Mehr */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black transition active:scale-95 flex items-center gap-1 shadow-2xs"
                title="Barcode scannen"
              >
                <Barcode className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Scan</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition active:scale-95 border border-slate-200"
                title="Mehr Optionen (PDF, WhatsApp, Budget, Filter)"
              >
                •••
              </button>
            </div>
          </div>

          {/* Clean 1-Line Quick Add */}
          <form onSubmit={handleCreateCustom} className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
            <input
              type="text"
              placeholder="Schnell Artikel hinzufügen (z. B. Bananen, Hafermilch)..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 bg-transparent text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!customName.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold transition shrink-0"
            >
              + Hinzufügen
            </button>
          </form>

          {/* List Display: Either Aisle View or Store View */}
          {viewMode === 'aisle' ? (
            /* Gang-Laufweg (Supermarkt-Route) */
            <div className="space-y-6">
              {itemsForAisle.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm text-slate-500 text-sm">
                  <Store className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <div className="font-bold text-slate-800">Keine Artikel für diesen Filter</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Für {selectedStoreFilter} gibt es an den ausgewählten Tagen keine Positionen.
                  </div>
                  <button
                    onClick={() => setSelectedStoreFilter('all')}
                    className="mt-3 px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    Alle Filialen anzeigen
                  </button>
                </div>
              ) : (
                Object.entries(aisleGroups).map(([aisleName, items]) => {
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
                })
              )}
            </div>
          ) : (
            /* Nach Filiale getrennt (Netto, NP, Vorrat) */
            <div className="space-y-6">
              {/* Netto */}
              {(selectedStoreFilter === 'all' || selectedStoreFilter === 'Netto') && shoppingList.items_netto.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-amber-400 text-stone-900 flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🟡 Netto Marken-Discount</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/15 font-semibold">
                        {shoppingList.items_netto.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_netto.filter((i) => checkedMap[`Netto-${i.name}`]).length} / {shoppingList.items_netto.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_netto.map((it) => renderItemRow({ ...it, storeTag: 'Netto' }, `Netto-${it.name}`))}
                  </div>
                </div>
              )}

              {/* NP */}
              {(selectedStoreFilter === 'all' || selectedStoreFilter === 'NP') && shoppingList.items_np.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🔴 NP Discount</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/20 font-semibold">
                        {shoppingList.items_np.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_np.filter((i) => checkedMap[`NP-${i.name}`]).length} / {shoppingList.items_np.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_np.map((it) => renderItemRow({ ...it, storeTag: 'NP' }, `NP-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Lidl */}
              {(selectedStoreFilter === 'all' || selectedStoreFilter === 'Lidl') && shoppingList.items_lidl && shoppingList.items_lidl.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🔵 Lidl</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/20 font-semibold">
                        {shoppingList.items_lidl.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_lidl.filter((i) => checkedMap[`Lidl-${i.name}`]).length} / {shoppingList.items_lidl.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_lidl.map((it) => renderItemRow({ ...it, storeTag: 'Lidl' }, `Lidl-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Aldi */}
              {(selectedStoreFilter === 'all' || selectedStoreFilter === 'Aldi') && shoppingList.items_aldi && shoppingList.items_aldi.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-sky-800 text-white flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🔷 Aldi (Nord & Süd)</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/20 font-semibold">
                        {shoppingList.items_aldi.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_aldi.filter((i) => checkedMap[`Aldi-${i.name}`]).length} / {shoppingList.items_aldi.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_aldi.map((it) => renderItemRow({ ...it, storeTag: 'Aldi' }, `Aldi-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Rewe */}
              {(selectedStoreFilter === 'all' || selectedStoreFilter === 'Rewe') && shoppingList.items_rewe && shoppingList.items_rewe.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-red-700 text-white flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🔴 Rewe Dein Markt</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/20 font-semibold">
                        {shoppingList.items_rewe.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_rewe.filter((i) => checkedMap[`Rewe-${i.name}`]).length} / {shoppingList.items_rewe.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_rewe.map((it) => renderItemRow({ ...it, storeTag: 'Rewe' }, `Rewe-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Kaufland */}
              {(selectedStoreFilter === 'all' || selectedStoreFilter === 'Kaufland') && shoppingList.items_kaufland && shoppingList.items_kaufland.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-red-800 text-white flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🔴 Kaufland</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/20 font-semibold">
                        {shoppingList.items_kaufland.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_kaufland.filter((i) => checkedMap[`Kaufland-${i.name}`]).length} / {shoppingList.items_kaufland.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_kaufland.map((it) => renderItemRow({ ...it, storeTag: 'Kaufland' }, `Kaufland-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Edeka */}
              {(selectedStoreFilter === 'all' || selectedStoreFilter === 'Edeka') && shoppingList.items_edeka && shoppingList.items_edeka.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-yellow-400 text-blue-950 flex items-center justify-between font-black">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">🟡 Edeka</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/15 font-semibold">
                        {shoppingList.items_edeka.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_edeka.filter((i) => checkedMap[`Edeka-${i.name}`]).length} / {shoppingList.items_edeka.length} erledigt
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_edeka.map((it) => renderItemRow({ ...it, storeTag: 'Edeka' }, `Edeka-${it.name}`))}
                  </div>
                </div>
              )}

              {/* Vorratskammer */}
              {(selectedStoreFilter === 'all' || selectedStoreFilter === 'Vorratskammer') && shoppingList.items_pantry.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-3.5 bg-slate-100 text-slate-800 flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold">⚪ Vorratskammer & Basics</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 font-semibold">
                        {shoppingList.items_pantry.length} Positionen
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      {shoppingList.items_pantry.filter((i) => checkedMap[`Vorratskammer-${i.name}`]).length} / {shoppingList.items_pantry.length}
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {shoppingList.items_pantry.map((it) => renderItemRow({ ...it, storeTag: 'Vorratskammer' }, `Vorratskammer-${it.name}`))}
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

          {/* Gestrichene Artikel (Excluded Items Drawer) */}
          {excludedItems.length > 0 && (
            <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-300 p-4 mb-6">
              <button
                type="button"
                onClick={() => setShowExcludedDrawer(!showExcludedDrawer)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-slate-400" />
                  <span>Gestrichene Artikel ({excludedItems.length})</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {showExcludedDrawer ? '▲ Ausblenden' : '▼ Anzeigen & Wiederherstellen'}
                </span>
              </button>

              {showExcludedDrawer && (
                <div className="divide-y divide-slate-200 mt-3 pt-2">
                  {excludedItems.map((item) => (
                    <div key={`${item.storeTag}-${item.name}`} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-slate-400 line-through text-xs font-bold truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">({item.storeTag || item.retailer})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreItem(item)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 shadow-2xs flex items-center gap-1 active:scale-95 transition shrink-0 ml-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Wiederherstellen</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Quick Edit Modal (Packungen & Gramm ändern) */}
      {editItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Menge anpassen
              </span>
              <button
                onClick={() => setEditItemModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              {editItemModal.item.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Filiale: {editItemModal.item.storeTag || editItemModal.item.retailer || 'Supermarkt'}
            </p>

            <div className="space-y-4 mb-6">
              {/* Packungen Stepper */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anzahl Packungen zu kaufen:
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditItemModal((prev) => prev ? { ...prev, tempPacks: Math.max(1, prev.tempPacks - 1) } : null)}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-black text-lg flex items-center justify-center active:scale-95 border border-slate-200"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-lg text-slate-900 min-w-[40px] text-center">
                    {editItemModal.tempPacks}x
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditItemModal((prev) => prev ? { ...prev, tempPacks: prev.tempPacks + 1 } : null)}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-black text-lg flex items-center justify-center active:scale-95 border border-slate-200"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-500">
                    ({editItemModal.item.pack_size || 500} {editItemModal.tempUnit} / Pck.)
                  </span>
                </div>
              </div>

              {/* Gramm / Gesamtmenge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rezeptbedarf / Grammmenge ({editItemModal.tempUnit}):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={editItemModal.tempQuantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setEditItemModal((prev) => prev ? { ...prev, tempQuantity: val } : null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-600 shrink-0">
                    {editItemModal.tempUnit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ändert den Soll-Bedarf. Bei haltbaren Vorräten wird der Rest nach dem Kauf automatisch für das Vorratslager gebucht.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditItemModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveItemEdit}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Substitute Modal (Ausverkauft? Schnelle Alternative) */}
      {substituteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                Ausverkauft? Ersatz wählen
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
              Wähle eine empfohlene Alternative oder gib ein eigenes Produkt ein:
            </p>

            <div className="space-y-2 mb-5 max-h-60 overflow-y-auto pr-1">
              {substituteItem.substitutes.map((alt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800 hover:border-emerald-300 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{alt}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplySubstitute(substituteItem, alt)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs active:scale-95 transition"
                  >
                    Wählen
                  </button>
                </div>
              ))}
            </div>

            {/* Custom substitute input */}
            <div className="pt-3 border-t border-slate-100 mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Eigenen Ersatz eingeben:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="z.B. Haferdrink statt Sojamilch"
                  value={customSubstituteText}
                  onChange={(e) => setCustomSubstituteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplySubstitute(substituteItem, customSubstituteText);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  disabled={!customSubstituteText.trim()}
                  onClick={() => handleApplySubstitute(substituteItem, customSubstituteText)}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold active:scale-95 transition"
                >
                  Übernehmen
                </button>
              </div>
            </div>

            <button
              onClick={() => setSubstituteItem(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Finish Shopping Modal */}
      {showFinishShoppingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                🎉 Einkauf abschließen
              </span>
              <button
                onClick={() => setShowFinishShoppingModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Supermarkt-Einkauf beenden?
            </h3>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Artikel im Einkaufswagen:</span>
                <span className="text-emerald-700 font-mono font-black">{checkedItemsCount} / {totalActiveItemsCount}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700">
                <span>Gesamtwert im Wagen:</span>
                <span className="font-mono font-black">{checkedCost.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700">
                <span>Geplantes Wochenbudget:</span>
                <span className="font-mono">{((shoppingList?.budget || 120)).toFixed(2)} €</span>
              </div>
            </div>

            {/* Pantry Shelf-Stability Notice */}
            <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-emerald-900">
                <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automatische Vorratsbuchung:</span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                Haltbare Trockenwaren (z.B. Reis, Linsen, Haferflocken, Nudeln) mit Restmengen werden automatisch ins Vorratslager gebucht.
              </p>
              <p className="text-slate-500 text-[10px] italic">
                🌱 Frischeprodukte (Gemüse, Obst, Fleisch, Fisch) verbleiben für sofortigen Frische-Verzehr und belasten das Lager nicht.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFinishShoppingModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Weiter einkaufen
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFinishShoppingModal(false);
                  handleBookAllToPantry();
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-1.5"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Jetzt buchen & abschließen</span>
              </button>
            </div>
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

      {/* ChatGPT Live Shopping Companion Modal */}
      <ChatGptLiveModal
        isOpen={isChatGptModalOpen}
        onClose={() => setIsChatGptModalOpen(false)}
        shoppingList={shoppingList}
        familyMembers={familyMembers}
        selectedStoreFilter={selectedStoreFilter}
        checkedMap={checkedMap}
        onToggleCheck={toggleCheck}
      />

      {/* ••• Mehr Optionen Modal (Clean Bottom Sheet / Drawer) */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Einkaufsliste Optionen & Power-Tools</span>
              </h3>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Live Modus Toggle */}
              <button
                type="button"
                onClick={() => {
                  toggleLiveMode();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>{isLiveMode ? '🛒 Supermarkt Live-Modus beenden' : '🛒 Supermarkt Live-Modus starten'}</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold">{isLiveMode ? 'Aktiv' : 'Große Tasten & Kassenrechner'}</span>
              </button>

              {/* PDF Download */}
              <button
                type="button"
                onClick={() => {
                  handleDownloadPdf();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileDown className="w-4 h-4 text-slate-600" />
                  <span>📄 Als PDF herunterladen / Drucken</span>
                </div>
              </button>

              {/* WhatsApp Export */}
              <button
                type="button"
                onClick={() => {
                  handleCopyWhatsApp();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>💬 Liste per WhatsApp teilen</span>
                </div>
              </button>

              {/* KI Assistent (ChatGPT) */}
              <button
                type="button"
                onClick={() => {
                  setIsChatGptModalOpen(true);
                  setIsMoreMenuOpen(false);
                }}
                className="w-full p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>🤖 KI-Einkaufsbegleiter (ChatGPT Live)</span>
                </div>
              </button>

              {/* Restmengen einbuchen */}
              <button
                type="button"
                onClick={() => {
                  handleBookAllToPantry();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4 text-amber-600" />
                  <span>📦 Haltbare Restmengen ins Lager buchen</span>
                </div>
              </button>

              {/* Split / Budget Details */}
              <button
                type="button"
                onClick={() => {
                  setShowSplitModal(true);
                  setIsMoreMenuOpen(false);
                }}
                className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-indigo-600" />
                  <span>📊 Multi-Store Spar-Split & Budget-Details</span>
                </div>
              </button>

              {/* Week Switcher */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Woche:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeWeek(selectedWeekOffset - 1)}
                    className="px-2.5 py-1 bg-white border rounded-lg font-bold hover:bg-slate-100"
                  >
                    ◀ Zurück
                  </button>
                  <span className="font-bold font-mono px-2 text-slate-800">KW {selectedWeekOffset}</span>
                  <button
                    type="button"
                    onClick={() => onChangeWeek(selectedWeekOffset + 1)}
                    className="px-2.5 py-1 bg-white border rounded-lg font-bold hover:bg-slate-100"
                  >
                    Weiter ▶
                  </button>
                </div>
              </div>

              {/* Days Filter */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block">Tage auswählen:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {ALL_DAYS_SHORT.map((dayShort) => {
                    const isSelected = selectedDays.includes(dayShort);
                    return (
                      <button
                        key={dayShort}
                        type="button"
                        onClick={() => toggleDayFilter(dayShort)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'
                        }`}
                      >
                        {dayShort}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onAddToList={handleAddScannedProduct}
        onAddToPantry={onSavePantryItem ? async (p) => {
          await onSavePantryItem({
            id: `pnt-${Date.now()}`,
            name: p.name,
            current_quantity: p.quantity,
            unit: p.unit,
            category: p.category,
            source: 'Barcode',
            ean_barcode: p.barcode,
            added_date: new Date().toISOString(),
            shelf_life_status: 'fresh',
          });
        } : undefined}
        initialRetailer={(selectedStoreFilter !== 'all' ? selectedStoreFilter as Retailer : 'Netto')}
        isLiveMode={isLiveMode}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  FamilyMember, ProductOffer, WeeklyPlan, ShoppingList, Recipe,
  PantryItem, LeafletBrochure, CustomShoppingItem, DailyHubResponse,
  AppSettings
} from './types';
import { apiFetch, isCapacitorNative, getServerUrl, getAppMode, AppMode } from './api/client';
import { DailyMissionView } from './components/DailyMissionView';
import { WeeklyPlanView } from './components/WeeklyPlanView';
import { ShoppingListView } from './components/ShoppingListView';
import { FamilyProfiles } from './components/FamilyProfiles';
import { LeafletViewer } from './components/LeafletViewer';
import { OffersView } from './components/OffersView';
import { RecipeModal } from './components/RecipeModal';
import { DeviceInstallerModal } from './components/DeviceInstallerModal';
import { FamilyVitalityView } from './components/FamilyVitalityView';
import { FamilyChoresView } from './components/FamilyChoresView';
import { LocalMeshSyncModal } from './components/LocalMeshSyncModal';
import { SettingsView } from './components/SettingsView';
import { RecipeManagerView } from './components/RecipeManagerView';
import { ServerConnectionModal } from './components/ServerConnectionModal';
import { OnboardingModal } from './components/OnboardingModal';
import { NettoOnlineBrowserModal } from './components/NettoOnlineBrowserModal';
import { PdfLeafletScannerModal } from './components/PdfLeafletScannerModal';
import { CookingModeModal } from './components/CookingModeModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import {
  Users, Calendar, ShoppingBag, Tag, Archive, BookOpen,
  HeartPulse, Sparkles, X, Compass, ChevronRight, CheckCircle2, Smartphone, Download,
  Heart, Star, Radio, Settings, Wifi, WifiOff, Server, Camera, ChefHat, Droplets, Utensils, Plus
} from 'lucide-react';

export function App() {
  // Main Navigation Tabs (Super App Architecture)
  const [activeTab, setActiveTab] = useState<'heute' | 'woche' | 'rezepte' | 'einkauf' | 'vitalitaet' | 'aemtli'>('heute');

  // Slide-over / Modal view for secondary tasks (Profiles, Leaflets, Offers, Installer, Settings)
  const [activeModalView, setActiveModalView] = useState<'profiles' | 'leaflets' | 'offers' | 'installer' | 'settings' | null>(null);
  const [isMeshSyncModalOpen, setIsMeshSyncModalOpen] = useState(false);
  const [isNettoBrowserOpen, setIsNettoBrowserOpen] = useState(false);
  const [isPdfScannerOpen, setIsPdfScannerOpen] = useState(false);
  const [targetHealthMemberId, setTargetHealthMemberId] = useState<string | undefined>(undefined);
  const [targetHealthSubTab, setTargetHealthSubTab] = useState<'radar' | 'epa'>('radar');

  // Recipe Modal state
  const [recipeModalData, setRecipeModalData] = useState<{
    dayIndex: number;
    mealType: 'breakfast' | 'lunch' | 'dinner';
    recipe: Recipe;
  } | null>(null);

  // 2026 Interactive Cooking Assist & Global Scanner State
  const [isCookingModalOpen, setIsCookingModalOpen] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [isGlobalScannerOpen, setIsGlobalScannerOpen] = useState(false);

  // Data Stores
  const [dailyHub, setDailyHub] = useState<DailyHubResponse | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [leaflets, setLeaflets] = useState<LeafletBrochure[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [zipCode, setZipCode] = useState('30159');
  const [onlyHealthy, setOnlyHealthy] = useState(true);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);
  const [appMode, setAppModeState] = useState<AppMode>(getAppMode());
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return !localStorage.getItem('fitplaner_onboarded');
  });

  const loadAllData = () => {
    fetchSettings();
    fetchDailyHub();
    fetchProfiles();
    fetchOffers(zipCode, onlyHealthy);
    fetchPlan(selectedWeekOffset);
    fetchShoppingList(selectedWeekOffset);
    fetchRecipes();
    fetchPantry();
    fetchLeaflets();
  };

  useEffect(() => {
    loadAllData();

    const handleServerChanged = () => {
      loadAllData();
      checkServerHealth();
    };
    const handleModeChanged = (e: any) => {
      setAppModeState(e.detail?.mode || getAppMode());
      loadAllData();
      checkServerHealth();
    };

    window.addEventListener('fitplaner_server_changed', handleServerChanged);
    window.addEventListener('fitplaner_mode_changed', handleModeChanged);

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 20000);

    return () => {
      window.removeEventListener('fitplaner_server_changed', handleServerChanged);
      window.removeEventListener('fitplaner_mode_changed', handleModeChanged);
      clearInterval(interval);
    };
  }, []);

  const checkServerHealth = async () => {
    try {
      const res = await apiFetch('/api/settings');
      setIsServerOnline(res.ok);
    } catch {
      setIsServerOnline(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await apiFetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.prefer_healthy_offers !== undefined) {
          setOnlyHealthy(data.prefer_healthy_offers);
        }
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      const res = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setOnlyHealthy(data.prefer_healthy_offers);
        await fetchPlan(selectedWeekOffset);
        await fetchShoppingList(selectedWeekOffset);
        await fetchDailyHub();
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  const fetchDailyHub = async () => {
    try {
      const res = await apiFetch('/api/daily-hub');
      if (res.ok) {
        const data = await res.json();
        setDailyHub(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDailyHubAction = async (action: string, value?: string) => {
    try {
      const res = await apiFetch('/api/daily-hub/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
      if (res.ok) {
        const data = await res.json();
        setDailyHub(data);
        if (action === 'cook_dinner') {
          await fetchPantry();
          await fetchShoppingList(selectedWeekOffset);
          await fetchPlan(selectedWeekOffset);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await apiFetch('/api/profiles');
      const data = await res.json();
      setMembers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOffers = async (zip: string, healthy: boolean) => {
    setIsLoadingOffers(true);
    try {
      const res = await apiFetch(`/api/offers?zip_code=${zip}&only_healthy=${healthy}`);
      const data = await res.json();
      setOffers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  const fetchPlan = async (offset: number = selectedWeekOffset) => {
    try {
      const res = await apiFetch(`/api/plan/current?week_offset=${offset}`);
      const data = await res.json();
      setWeeklyPlan(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchShoppingList = async (offset: number = selectedWeekOffset) => {
    try {
      const res = await apiFetch(`/api/shopping-list?week_offset=${offset}`);
      const data = await res.json();
      setShoppingList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeWeek = async (offset: number) => {
    setSelectedWeekOffset(offset);
    await fetchPlan(offset);
    await fetchShoppingList(offset);
  };

  const handleUpdateBudget = async (newBudget: number) => {
    try {
      const res = await apiFetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_offset: selectedWeekOffset, budget: newBudget }),
      });
      if (res.ok) {
        await fetchPlan(selectedWeekOffset);
        await fetchShoppingList(selectedWeekOffset);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecipes = async () => {
    try {
      const res = await apiFetch('/api/recipes');
      const data = await res.json();
      setAllRecipes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPantry = async () => {
    try {
      const res = await apiFetch('/api/pantry');
      const data = await res.json();
      setPantryItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaflets = async () => {
    try {
      const res = await apiFetch('/api/leaflets');
      const data = await res.json();
      setLeaflets(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Profile Handlers
  const handleSaveMember = async (memberData: Partial<FamilyMember>) => {
    try {
      const res = await apiFetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      if (res.ok) {
        await fetchProfiles();
        await handleGeneratePlan();
        await fetchDailyHub();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      const res = await apiFetch(`/api/profiles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchProfiles();
        await handleGeneratePlan();
        await fetchDailyHub();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Plan Handlers
  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const res = await apiFetch(`/api/plan/generate?week_offset=${selectedWeekOffset}`, { method: 'POST' });
      if (res.ok) {
        const newPlan = await res.json();
        setWeeklyPlan(newPlan);
        await fetchShoppingList(selectedWeekOffset);
        await fetchDailyHub();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSwapMeal = async (dayIndex: number, mealType: string, newRecipeId: string) => {
    try {
      const res = await apiFetch('/api/plan/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_index: dayIndex,
          meal_type: mealType,
          new_recipe_id: newRecipeId,
          week_offset: selectedWeekOffset,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWeeklyPlan(updated);
        await fetchShoppingList(selectedWeekOffset);
        await fetchDailyHub();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCookMeal = async (dayIndex: number, mealType: string) => {
    try {
      const res = await apiFetch('/api/pantry/cook-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_index: dayIndex,
          meal_type: mealType,
          week_offset: selectedWeekOffset,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWeeklyPlan(data.updated_plan);
        await fetchPantry();
        await fetchShoppingList(selectedWeekOffset);
        await fetchDailyHub();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlanOptimized = (optimizedPlan: WeeklyPlan) => {
    setWeeklyPlan(optimizedPlan);
    fetchShoppingList(selectedWeekOffset);
  };

  // Pantry Handlers
  const handleSavePantryItem = async (item: PantryItem) => {
    try {
      const isExisting = pantryItems.some((i) => i.id === item.id);
      const url = isExisting ? `/api/pantry/${item.id}` : '/api/pantry';
      const method = isExisting ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        await fetchPantry();
        await fetchShoppingList(selectedWeekOffset);
        await fetchDailyHub();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePantryItem = async (id: string) => {
    try {
      const res = await apiFetch(`/api/pantry/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPantry();
        await fetchShoppingList(selectedWeekOffset);
        await fetchDailyHub();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookCartToPantry = async (items: any[]) => {
    try {
      const res = await apiFetch('/api/pantry/book-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        await fetchPantry();
        await fetchShoppingList(selectedWeekOffset);
        await fetchDailyHub();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Custom Shopping Items
  const handleAddCustomItem = async (itemData: Partial<CustomShoppingItem>) => {
    try {
      const res = await apiFetch('/api/custom-shopping-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (res.ok) {
        await fetchShoppingList(selectedWeekOffset);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCustomItem = async (id: string) => {
    try {
      const res = await apiFetch(`/api/custom-shopping-items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchShoppingList(selectedWeekOffset);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const expiringCount = pantryItems.filter(
    (i) => i.shelf_life_status === 'expiring_soon' || i.shelf_life_status === 'expired'
  ).length;

  const handleOpenRecipe = (
    dayIdx: number,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    recipeOrId?: Recipe | string
  ) => {
    let targetRecipe: Recipe | null = null;

    if (typeof recipeOrId === 'object' && recipeOrId !== null) {
      targetRecipe = recipeOrId;
    } else if (typeof recipeOrId === 'string' && recipeOrId) {
      targetRecipe = allRecipes.find((r) => r.id === recipeOrId) || null;
    }

    if (!targetRecipe && weeklyPlan && weeklyPlan.days && weeklyPlan.days[dayIdx]) {
      const day = weeklyPlan.days[dayIdx];
      targetRecipe = mealType === 'breakfast' ? day.breakfast : mealType === 'lunch' ? day.lunch : day.dinner;
    }

    if (!targetRecipe && dailyHub) {
      if (mealType === 'breakfast' && dailyHub.breakfast_recipe) targetRecipe = dailyHub.breakfast_recipe;
      else if (mealType === 'lunch' && dailyHub.lunch_recipe) targetRecipe = dailyHub.lunch_recipe;
      else if (mealType === 'dinner' && dailyHub.dinner_recipe) targetRecipe = dailyHub.dinner_recipe;
    }

    if (!targetRecipe && allRecipes.length > 0) {
      targetRecipe = allRecipes[0];
    }

    if (targetRecipe) {
      setRecipeModalData({
        dayIndex: dayIdx,
        mealType: mealType,
        recipe: targetRecipe,
      });
    }
  };

  const handleOpenCooking = (recipe?: Recipe) => {
    let target: Recipe | null = recipe || null;
    if (!target && dailyHub) {
      target = dailyHub.dinner_recipe || dailyHub.lunch_recipe || dailyHub.breakfast_recipe || null;
    }
    if (!target && allRecipes.length > 0) {
      target = allRecipes[0];
    }
    if (target) {
      setCookingRecipe(target);
      setIsCookingModalOpen(true);
    }
  };

  const handleFinishCooking = async (recipe: Recipe, memberIds: string[]) => {
    try {
      await apiFetch('/api/pantry/cook-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_index: dailyHub?.day_index || 0,
          meal_type: 'dinner',
          recipe_id: recipe.id,
          week_offset: selectedWeekOffset,
        }),
      });
      await handleDailyHubAction('cook_dinner');
      await fetchPantry();
      await fetchShoppingList(selectedWeekOffset);
      await fetchPlan(selectedWeekOffset);
      await fetchDailyHub();
      await fetchProfiles();
    } catch (e) {
      console.error('Error finishing cooking:', e);
    }
  };

  const handleAddWater = async (memberId: string, amountMl: number = 250) => {
    try {
      const res = await apiFetch(`/api/family/members/${memberId}/water`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_ml: amountMl }),
      });
      if (res.ok) {
        await fetchProfiles();
        await fetchDailyHub();
      }
    } catch (e) {
      console.error('Error adding water:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar (Material 3 Mobile App Bar & Desktop Nav) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2.5 cursor-pointer min-w-0" onClick={() => setActiveTab('heute')}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
                  <span>FitPlaner</span>
                  <span className="hidden xs:inline text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold">Multi-Markt</span>
                </h1>
                <span className="hidden sm:block text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">
                  Smarter Ernährungsplaner & Familien-Manager
                </span>
              </div>
            </div>

            {/* Desktop Super App Kern-Navigation */}
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70">
              <button
                onClick={() => setActiveTab('heute')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  activeTab === 'heute'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>🌟 Heute</span>
              </button>

              <button
                onClick={() => setActiveTab('woche')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  activeTab === 'woche'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>📅 Woche</span>
              </button>

              <button
                onClick={() => setActiveTab('rezepte')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  activeTab === 'rezepte'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>📖 Rezepte</span>
              </button>

              <button
                onClick={() => setActiveTab('einkauf')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  activeTab === 'einkauf'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>🛒 Einkauf</span>
                {expiringCount > 0 && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
                    {expiringCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('vitalitaet')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  activeTab === 'vitalitaet'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>🌿 Gesundheit</span>
              </button>

              <button
                onClick={() => setActiveTab('aemtli')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  activeTab === 'aemtli'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>🤝 Aufgaben</span>
              </button>
            </nav>

            {/* Quick Actions (Responsive & Non-Overflowing) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Connection Status Pill (Server vs Standalone Mode) */}
              <button
                onClick={() => setIsServerModalOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-black transition ${
                  appMode === 'standalone'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                    : isServerOnline === true
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : isServerOnline === false
                    ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 animate-pulse'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
                title="Betriebsmodus & Server-Verbindung (Klicken zum Umschalten/Konfigurieren)"
              >
                <span className="relative flex h-2 w-2">
                  {(appMode === 'standalone' || isServerOnline === true) && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      appMode === 'standalone' || isServerOnline === true
                        ? 'bg-emerald-500'
                        : isServerOnline === false
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                    }`}
                  />
                </span>
                {appMode === 'standalone' ? (
                  <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <Server className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {appMode === 'standalone'
                    ? 'Autark'
                    : isServerOnline === true
                    ? 'Server OK'
                    : isServerOnline === false
                    ? 'Offline'
                    : 'Server'}
                </span>
              </button>

              {/* P2P-Mesh Button */}
              <button
                onClick={() => setIsMeshSyncModalOpen(true)}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold transition shadow-2xs"
                title="Halb-Autarke P2P-Synchronisation über lokales WLAN & Bluetooth LE"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden lg:inline">P2P-Mesh</span>
              </button>

              {/* Global Barcode Scanner Button */}
              <button
                onClick={() => setIsGlobalScannerOpen(true)}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black transition shadow-2xs"
                title="Barcode scannen (Kamera & Schnell-Erfassung für Lebensmittel, Drogerie & Haushalt)"
              >
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Scan</span>
              </button>

              {/* Desktop Only Actions */}
              <a
                href="/FitPlaner.apk"
                download="FitPlaner.apk"
                className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 text-xs font-semibold transition border border-transparent hover:border-slate-200"
                title="Android APK direkt herunterladen (4,2 MB)"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>APK</span>
              </a>

              <button
                onClick={() => setActiveModalView('installer')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                title="APK auf Smartphone installieren & im WLAN verbinden"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xl:inline">📱 Handy</span>
              </button>

              <button
                onClick={() => setActiveModalView('leaflets')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                title="Netto & NP Blätterkataloge"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prospekte</span>
              </button>

              <button
                onClick={() => setActiveModalView('profiles')}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                title="Familienmitglieder & Kalorienbedarf anpassen"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Familie ({members.length})</span>
              </button>

              <button
                onClick={() => setActiveModalView('settings')}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                title="Supermarkt-Auswahl, Budget & Einstellungen"
              >
                <Settings className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden md:inline">Einstellungen</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
        {activeTab === 'heute' && (
          <DailyMissionView
            dailyHub={dailyHub}
            onUpdateAction={handleDailyHubAction}
            onNavigateTab={setActiveTab}
            onOpenRecipe={handleOpenRecipe}
            onStartCooking={handleOpenCooking}
            onOpenBarcodeScanner={() => setIsGlobalScannerOpen(true)}
            familyMembers={members}
            onAddWater={handleAddWater}
          />
        )}

        {activeTab === 'woche' && (
          <WeeklyPlanView
            plan={weeklyPlan}
            members={members}
            allRecipes={allRecipes}
            pantryItems={pantryItems}
            selectedWeekOffset={selectedWeekOffset}
            onChangeWeek={handleChangeWeek}
            onUpdateBudget={handleUpdateBudget}
            onGeneratePlan={handleGeneratePlan}
            onSwapMeal={handleSwapMeal}
            onCookMeal={handleCookMeal}
            isGenerating={isGeneratingPlan}
            activeRetailers={settings?.active_retailers}
            onPlanOptimized={handlePlanOptimized}
          />
        )}

        {activeTab === 'rezepte' && (
          <RecipeManagerView
            recipes={allRecipes}
            onRefreshRecipes={fetchRecipes}
          />
        )}

        {activeTab === 'einkauf' && (
          <ShoppingListView
            shoppingList={shoppingList}
            selectedWeekOffset={selectedWeekOffset}
            onChangeWeek={handleChangeWeek}
            onRefresh={() => fetchShoppingList(selectedWeekOffset)}
            onBookCartToPantry={handleBookCartToPantry}
            onAddCustomItem={handleAddCustomItem}
            onDeleteCustomItem={handleDeleteCustomItem}
            familyMembers={members}
            pantryItems={pantryItems}
            onSavePantryItem={handleSavePantryItem}
            onDeletePantryItem={handleDeletePantryItem}
            onRefreshPantry={fetchPantry}
            onOpenNettoBrowser={() => setIsNettoBrowserOpen(true)}
            onOpenPdfScanner={() => setIsPdfScannerOpen(true)}
          />
        )}

        {(activeTab === 'vitalitaet' || activeTab === 'aemtli') && (
          <div className="mb-6 flex items-center justify-center">
            <div className="inline-flex p-1 bg-slate-200/80 backdrop-blur-md rounded-2xl border border-slate-300/60 shadow-inner max-w-full overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('vitalitaet')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'vitalitaet'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${activeTab === 'vitalitaet' ? 'text-rose-500 fill-rose-500/20' : 'text-slate-400'}`} />
                <span>Gesundheit & Vitalität</span>
              </button>
              <button
                onClick={() => setActiveTab('aemtli')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'aemtli'
                    ? 'bg-white text-amber-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${activeTab === 'aemtli' ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                <span>Ämtli & Aufgaben</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'vitalitaet' && (
          <FamilyVitalityView
            onNavigateTab={setActiveTab}
            familyMembers={members}
            initialSubTab={targetHealthSubTab}
            targetMemberId={targetHealthMemberId}
          />
        )}

        {activeTab === 'aemtli' && (
          <FamilyChoresView
            members={members}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Dezent verlinkter Footer mit direktem APK-Download */}
        <footer className="mt-12 pt-6 border-t border-slate-200/70 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">FitPlaner</span>
            <span>•</span>
            <span>Netto & NP Familienmanager</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-emerald-600 font-medium">100% offline & werbefrei</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMeshSyncModalOpen(true)}
              className="inline-flex items-center space-x-1.5 text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
              title="Halb-autarker WLAN & Bluetooth P2P-Sync"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>P2P-Mesh Status</span>
            </button>

            <button
              onClick={() => setActiveModalView('settings')}
              className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200/70 transition"
              title="Supermarkt-Auswahl & App-Einstellungen"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Einstellungen</span>
            </button>

            <a
              href="/FitPlaner.apk"
              download="FitPlaner.apk"
              className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-emerald-700 font-semibold bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200/70 transition shadow-2xs"
              title="Direkter Download der Android APK (4,2 MB)"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Android App (.apk, 4,2 MB)</span>
              <Download className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </footer>
      </main>

      {/* Slide-Over Drawer for Secondary Modals */}
      {activeModalView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-fadeIn">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
                {activeModalView === 'profiles' && <span>👨‍👩‍👧‍👦 Familienmitglieder</span>}
                {activeModalView === 'leaflets' && <span>📖 Supermarkt-Prospekte</span>}
                {activeModalView === 'offers' && <span>🏷️ Aktuelle Angebote</span>}
                {activeModalView === 'installer' && <span>📱 Smartphone WLAN-Kopplung</span>}
                {activeModalView === 'settings' && <span>⚙️ App & Supermarkt-Einstellungen</span>}
              </h2>
              <button
                onClick={() => setActiveModalView(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {activeModalView === 'profiles' && (
                <FamilyProfiles
                  members={members}
                  onSaveMember={handleSaveMember}
                  onDeleteMember={handleDeleteMember}
                  onOpenHealthDossier={(memberId) => {
                    setActiveModalView(null);
                    setTargetHealthMemberId(memberId);
                    setTargetHealthSubTab('epa');
                    setActiveTab('vitalitaet');
                  }}
                />
              )}
              {activeModalView === 'leaflets' && (
                <LeafletViewer
                  leaflets={leaflets}
                  onAddCustomItem={async (title, retailer) => {
                    await handleAddCustomItem({
                      name: title,
                      quantity: 1,
                      unit: 'Packung',
                      retailer: retailer,
                      category: 'Aus Prospekt',
                    });
                  }}
                />
              )}
              {activeModalView === 'offers' && (
                <OffersView
                  offers={offers}
                  isLoading={isLoadingOffers}
                  zipCode={zipCode}
                  onZipCodeChange={(zip) => {
                    setZipCode(zip);
                    fetchOffers(zip, onlyHealthy);
                  }}
                  onlyHealthy={onlyHealthy}
                  onToggleHealthy={(val) => {
                    setOnlyHealthy(val);
                    fetchOffers(zipCode, val);
                  }}
                  onRefresh={() => fetchOffers(zipCode, onlyHealthy)}
                  onOpenNettoBrowser={() => {
                    setActiveModalView(null);
                    setIsNettoBrowserOpen(true);
                  }}
                  onOpenPdfScanner={() => {
                    setActiveModalView(null);
                    setIsPdfScannerOpen(true);
                  }}
                />
              )}
              {activeModalView === 'installer' && <DeviceInstallerModal onClose={() => setActiveModalView(null)} />}
              {activeModalView === 'settings' && settings && (
                <SettingsView
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onClose={() => setActiveModalView(null)}
                  onOpenServerModal={() => {
                    setActiveModalView(null);
                    setIsServerModalOpen(true);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Netto-Online Deterministic Web Browser Modal (Ohne KI) */}
      {isNettoBrowserOpen && (
        <NettoOnlineBrowserModal
          onClose={() => setIsNettoBrowserOpen(false)}
          onAddShoppingItem={async (item) => {
            await handleAddCustomItem({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              retailer: item.retailer,
              category: item.category,
            });
          }}
        />
      )}

      {/* Supermarket PDF Leaflet Scanner Modal (Ohne KI) */}
      {isPdfScannerOpen && (
        <PdfLeafletScannerModal
          onClose={() => setIsPdfScannerOpen(false)}
          onAddShoppingItem={async (item) => {
            await handleAddCustomItem({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              retailer: item.retailer,
              category: item.category,
            });
          }}
        />
      )}

      {/* P2P Mesh Sync Modal */}
      <LocalMeshSyncModal
        isOpen={isMeshSyncModalOpen}
        onClose={() => setIsMeshSyncModalOpen(false)}
      />

      {/* Server Connection Modal (Dynamic Host & Port Configuration) */}
      <ServerConnectionModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        onConnected={loadAllData}
      />

      {/* Onboarding Wizard (First-Run Setup: Mode Selection & Quick Config) */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => {
          setIsOnboardingOpen(false);
          setAppModeState(getAppMode());
          loadAllData();
        }}
      />

      {/* Recipe Modal */}
      {recipeModalData && (
        <RecipeModal
          recipe={recipeModalData.recipe}
          dayIndex={recipeModalData.dayIndex}
          mealType={recipeModalData.mealType}
          activeMember={members[0] || ({} as FamilyMember)}
          portion={weeklyPlan?.days?.[recipeModalData.dayIndex]?.portions?.[members[0]?.id]?.[recipeModalData.mealType]}
          pantryItems={pantryItems}
          isCooked={
            recipeModalData.mealType === 'dinner'
              ? dailyHub?.is_dinner_cooked
              : recipeModalData.mealType === 'breakfast'
              ? weeklyPlan?.days?.[recipeModalData.dayIndex]?.is_breakfast_cooked
              : weeklyPlan?.days?.[recipeModalData.dayIndex]?.is_lunch_cooked
          }
          onCookMeal={async (dayIdx, mealType) => {
            await handleCookMeal(dayIdx, mealType);
            if (mealType === 'dinner') {
              await handleDailyHubAction('cook_dinner');
            }
            setRecipeModalData(null);
          }}
          onClose={() => setRecipeModalData(null)}
        />
      )}

      {/* 2026 Interactive Cooking Assist Modal */}
      {isCookingModalOpen && cookingRecipe && (
        <CookingModeModal
          isOpen={isCookingModalOpen}
          onClose={() => setIsCookingModalOpen(false)}
          recipe={cookingRecipe}
          familyMembers={members}
          pantryItems={pantryItems}
          onFinishCooking={handleFinishCooking}
        />
      )}

      {/* Global Barcode Scanner Modal (Camera & Direct Multi-Category Recognition) */}
      {isGlobalScannerOpen && (
        <BarcodeScannerModal
          isOpen={isGlobalScannerOpen}
          onClose={() => setIsGlobalScannerOpen(false)}
          onAddToList={async (item) => {
            await handleAddCustomItem({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              category: item.category,
              retailer: item.retailer,
              recurring_rule: item.recurring_rule,
            });
            if (item.recurring_rule) {
              try {
                await apiFetch('/api/recurring', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(item.recurring_rule),
                });
              } catch (e) {
                console.error('Failed to save recurring rule:', e);
              }
            }
            await fetchShoppingList(selectedWeekOffset);
            setIsGlobalScannerOpen(false);
          }}
        />
      )}

      {/* 🌟 2026 FLOATING DYNAMIC ACTION ISLAND */}
      <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] pointer-events-auto transition-all duration-300">
        <div className="bg-slate-900/90 hover:bg-slate-900 text-white backdrop-blur-xl border border-slate-700/80 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex items-center gap-1.5 sm:gap-2.5 select-none">
          {/* 📷 1-Tap Barcode Scanner */}
          <button
            onClick={() => setIsGlobalScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
            title="Barcode scannen (Kamera & Schnell-Erfassung)"
          >
            <Camera className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden xs:inline">Scan</span>
          </button>

          {/* 👨‍🍳 1-Tap Live Kochen */}
          <button
            onClick={() => handleOpenCooking()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition active:scale-95 cursor-pointer"
            title="Interaktiver Kochmodus für die heutige Mahlzeit"
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Kochen</span>
          </button>

          {/* 💧 1-Tap Quick Wasser (+250ml) */}
          <button
            onClick={() => members[0] && handleAddWater(members[0].id, 250)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 font-bold text-xs border border-cyan-400/30 transition active:scale-95 cursor-pointer"
            title="Schnell 250ml Wasser trinken (+250ml)"
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[11px]">+250ml</span>
          </button>

          {/* 🛒 1-Tap Einkauf */}
          <button
            onClick={() => setActiveTab('einkauf')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs transition active:scale-95 cursor-pointer"
            title="Zur Einkaufsliste springen"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Einkauf</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (Material 3 Dock) */}
      <nav aria-label="Hauptnavigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-1 pt-1.5 pb-[env(safe-area-inset-bottom,8px)] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] flex items-center justify-around select-none">
        <button
          onClick={() => setActiveTab('heute')}
          className="flex-1 flex flex-col items-center py-1 group focus:outline-none"
        >
          <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
            activeTab === 'heute' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 group-hover:text-slate-900'
          }`}>
            <Sparkles className={`w-5 h-5 ${activeTab === 'heute' ? 'text-amber-500' : ''}`} />
          </div>
          <span className={`text-[10px] tracking-tight mt-0.5 ${
            activeTab === 'heute' ? 'font-black text-emerald-900' : 'font-semibold text-slate-500'
          }`}>
            Heute
          </span>
        </button>

        <button
          onClick={() => setActiveTab('woche')}
          className="flex-1 flex flex-col items-center py-1 group focus:outline-none"
        >
          <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
            activeTab === 'woche' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 group-hover:text-slate-900'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <span className={`text-[10px] tracking-tight mt-0.5 ${
            activeTab === 'woche' ? 'font-black text-emerald-900' : 'font-semibold text-slate-500'
          }`}>
            Woche
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rezepte')}
          className="flex-1 flex flex-col items-center py-1 group focus:outline-none"
        >
          <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
            activeTab === 'rezepte' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 group-hover:text-slate-900'
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className={`text-[10px] tracking-tight mt-0.5 ${
            activeTab === 'rezepte' ? 'font-black text-emerald-900' : 'font-semibold text-slate-500'
          }`}>
            Rezepte
          </span>
        </button>

        <button
          onClick={() => setActiveTab('einkauf')}
          className="flex-1 flex flex-col items-center py-1 group focus:outline-none relative"
        >
          <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center relative ${
            activeTab === 'einkauf' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 group-hover:text-slate-900'
          }`}>
            <ShoppingBag className="w-5 h-5" />
            {expiringCount > 0 && (
              <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-0.5 ${
            activeTab === 'einkauf' ? 'font-black text-emerald-900' : 'font-semibold text-slate-500'
          }`}>
            Einkauf
          </span>
        </button>

        <button
          onClick={() => setActiveTab('vitalitaet')}
          className="flex-1 flex flex-col items-center py-1 group focus:outline-none"
        >
          <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
            (activeTab === 'vitalitaet' || activeTab === 'aemtli')
              ? 'bg-emerald-100 text-emerald-800'
              : 'text-slate-500 group-hover:text-slate-900'
          }`}>
            <Heart className={`w-5 h-5 ${(activeTab === 'vitalitaet' || activeTab === 'aemtli') ? 'text-rose-500 fill-rose-500/20' : ''}`} />
          </div>
          <span className={`text-[10px] tracking-tight mt-0.5 ${
            (activeTab === 'vitalitaet' || activeTab === 'aemtli') ? 'font-black text-emerald-900' : 'font-semibold text-slate-500'
          }`}>
            Vitalität
          </span>
        </button>
      </nav>
    </div>
  );
}

export default App;

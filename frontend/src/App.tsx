import React, { useState, useEffect } from 'react';
import {
  FamilyMember, ProductOffer, WeeklyPlan, ShoppingList, Recipe,
  PantryItem, LeafletBrochure, CustomShoppingItem, DailyHubResponse,
  AppSettings
} from './types';
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
import {
  Users, Calendar, ShoppingBag, Tag, Archive, BookOpen,
  HeartPulse, Sparkles, X, Compass, ChevronRight, CheckCircle2, Smartphone, Download,
  Heart, Star, Radio, Settings
} from 'lucide-react';

export function App() {
  // Main Navigation Tabs (Super App Architecture)
  const [activeTab, setActiveTab] = useState<'heute' | 'woche' | 'einkauf' | 'vitalitaet' | 'aemtli'>('heute');

  // Slide-over / Modal view for secondary tasks (Profiles, Leaflets, Offers, Installer, Settings)
  const [activeModalView, setActiveModalView] = useState<'profiles' | 'leaflets' | 'offers' | 'installer' | 'settings' | null>(null);
  const [isMeshSyncModalOpen, setIsMeshSyncModalOpen] = useState(false);

  // Recipe Modal state
  const [recipeModalData, setRecipeModalData] = useState<{
    dayIndex: number;
    mealType: 'breakfast' | 'lunch' | 'dinner';
    recipe: Recipe;
  } | null>(null);

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

  useEffect(() => {
    fetchSettings();
    fetchDailyHub();
    fetchProfiles();
    fetchOffers(zipCode, onlyHealthy);
    fetchPlan(0);
    fetchShoppingList(0);
    fetchRecipes();
    fetchPantry();
    fetchLeaflets();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
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
      const res = await fetch('/api/settings', {
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
      const res = await fetch('/api/daily-hub');
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
      const res = await fetch('/api/daily-hub/action', {
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
      const res = await fetch('/api/profiles');
      const data = await res.json();
      setMembers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOffers = async (zip: string, healthy: boolean) => {
    setIsLoadingOffers(true);
    try {
      const res = await fetch(`/api/offers?zip_code=${zip}&only_healthy=${healthy}`);
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
      const res = await fetch(`/api/plan/current?week_offset=${offset}`);
      const data = await res.json();
      setWeeklyPlan(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchShoppingList = async (offset: number = selectedWeekOffset) => {
    try {
      const res = await fetch(`/api/shopping-list?week_offset=${offset}`);
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
      const res = await fetch('/api/budget', {
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
      const res = await fetch('/api/recipes');
      const data = await res.json();
      setAllRecipes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPantry = async () => {
    try {
      const res = await fetch('/api/pantry');
      const data = await res.json();
      setPantryItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaflets = async () => {
    try {
      const res = await fetch('/api/leaflets');
      const data = await res.json();
      setLeaflets(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Profile Handlers
  const handleSaveMember = async (memberData: Partial<FamilyMember>) => {
    try {
      const res = await fetch('/api/profiles', {
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
      const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
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
      const res = await fetch(`/api/plan/generate?week_offset=${selectedWeekOffset}`, { method: 'POST' });
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
      const res = await fetch('/api/plan/swap', {
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
      const res = await fetch('/api/pantry/cook-meal', {
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

  // Pantry Handlers
  const handleSavePantryItem = async (item: PantryItem) => {
    try {
      const isExisting = pantryItems.some((i) => i.id === item.id);
      const url = isExisting ? `/api/pantry/${item.id}` : '/api/pantry';
      const method = isExisting ? 'PUT' : 'POST';
      const res = await fetch(url, {
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
      const res = await fetch(`/api/pantry/${id}`, { method: 'DELETE' });
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
      const res = await fetch('/api/pantry/book-cart', {
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
      const res = await fetch('/api/custom-shopping-items', {
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
      const res = await fetch(`/api/custom-shopping-items/${id}`, { method: 'DELETE' });
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('heute')}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  FitPlaner
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold">Multi-Supermarkt</span>
                </h1>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                  Smarter Ernährungsplaner & Familien-Manager
                </span>
              </div>
            </div>

            {/* Super App Kern-Navigation */}
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

            {/* Quick Actions (P2P-Mesh, Smartphone, Prospekte, Familie, Angebote) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMeshSyncModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold transition shadow-2xs"
                title="Halb-Autarke P2P-Synchronisation über lokales WLAN & Bluetooth LE"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">P2P-Mesh</span>
              </button>

              <a
                href="/FitPlaner.apk"
                download="FitPlaner.apk"
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 text-xs font-semibold transition border border-transparent hover:border-slate-200"
                title="Android APK direkt herunterladen (4,2 MB)"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>APK</span>
              </a>

              <button
                onClick={() => setActiveModalView('installer')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                title="APK auf Smartphone installieren & im WLAN verbinden"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">📱 Handy</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                title="Familienmitglieder & Kalorienbedarf anpassen"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Familie ({members.length})</span>
              </button>

              <button
                onClick={() => setActiveModalView('settings')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                title="Supermarkt-Auswahl, Budget & Einstellungen"
              >
                <Settings className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Einstellungen</span>
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
            pantryItems={pantryItems}
            onSavePantryItem={handleSavePantryItem}
            onDeletePantryItem={handleDeletePantryItem}
            onRefreshPantry={fetchPantry}
          />
        )}

        {activeTab === 'vitalitaet' && (
          <FamilyVitalityView
            onNavigateTab={setActiveTab}
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
                />
              )}
              {activeModalView === 'installer' && <DeviceInstallerModal onClose={() => setActiveModalView(null)} />}
              {activeModalView === 'settings' && settings && (
                <SettingsView
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onClose={() => setActiveModalView(null)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* P2P Mesh Sync Modal */}
      <LocalMeshSyncModal
        isOpen={isMeshSyncModalOpen}
        onClose={() => setIsMeshSyncModalOpen(false)}
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

      {/* Mobile Bottom Tab Bar (5 Super-App Tabs) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('heute')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-black ${
            activeTab === 'heute' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Heute
        </button>

        <button
          onClick={() => setActiveTab('woche')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-black ${
            activeTab === 'woche' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Woche
        </button>

        <button
          onClick={() => setActiveTab('einkauf')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-black relative ${
            activeTab === 'einkauf' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Einkauf
          {expiringCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-2" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('vitalitaet')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-black ${
            activeTab === 'vitalitaet' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          Gesundheit
        </button>

        <button
          onClick={() => setActiveTab('aemtli')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-black ${
            activeTab === 'aemtli' ? 'text-amber-700 bg-amber-50' : 'text-slate-500'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          Aufgaben
        </button>
      </div>
    </div>
  );
}

export default App;

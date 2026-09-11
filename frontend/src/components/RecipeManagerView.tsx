import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, RecipeIngredient } from '../types';
import { getRetailerBadgeClass } from '../utils/retailerBadges';
import { apiFetch } from '../api/client';
import {
  Search, Plus, Clock, Flame, ChefHat, Utensils, X,
  Sparkles, Check, Edit3, Trash2,
  BookOpen, CheckCircle2, CalendarPlus, Calendar, ArrowRight,
  ShieldCheck, AlertTriangle, Box
} from 'lucide-react';

interface Props {
  recipes?: Recipe[];
  onRefreshRecipes?: () => Promise<void>;
  onAddToWeeklyPlan?: (recipe: Recipe, dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner') => Promise<boolean>;
  onNavigateTab?: (tab: any) => void;
}

const WEEKDAYS = [
  { idx: 0, label: 'Mo', full: 'Montag' },
  { idx: 1, label: 'Di', full: 'Dienstag' },
  { idx: 2, label: 'Mi', full: 'Mittwoch' },
  { idx: 3, label: 'Do', full: 'Donnerstag' },
  { idx: 4, label: 'Fr', full: 'Freitag' },
  { idx: 5, label: 'Sa', full: 'Samstag' },
  { idx: 6, label: 'So', full: 'Sonntag' },
];

export const RecipeManagerView: React.FC<Props> = ({
  recipes: initialRecipes,
  onRefreshRecipes,
  onAddToWeeklyPlan,
  onNavigateTab,
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes || []);
  const [isLoading, setIsLoading] = useState(!initialRecipes || initialRecipes.length === 0);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'express' | 'high_protein' | 'veggie' | 'gluten_free'>('all');

  // Modals
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
  const [editModalRecipe, setEditModalRecipe] = useState<Recipe | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteConfirmRecipe, setDeleteConfirmRecipe] = useState<Recipe | null>(null);

  // Add to Week Plan Modal State
  const [planSlotRecipe, setPlanSlotRecipe] = useState<Recipe | null>(null);
  const [targetDayIndex, setTargetDayIndex] = useState<number>(0);
  const [targetMealType, setTargetMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('dinner');
  const [isSavingToPlan, setIsSavingToPlan] = useState(false);

  // Form State for Create / Edit
  const [formData, setFormData] = useState<Partial<Recipe>>({});
  const [ingredientsText, setIngredientsText] = useState('');
  const [prepStepsText, setPrepStepsText] = useState('');
  const [cookingStepsText, setCookingStepsText] = useState('');
  const [lunchboxTipsText, setLunchboxTipsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; actionText?: string; onAction?: () => void } | null>(null);

  useEffect(() => {
    if (initialRecipes && initialRecipes.length > 0) {
      setRecipes(initialRecipes);
      setIsLoading(false);
    } else {
      fetchRecipes();
    }
  }, [initialRecipes]);

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/recipes');
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } catch (e) {
      console.error('Failed to fetch recipes:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (text: string, actionText?: string, onAction?: () => void) => {
    setToastMessage({ text, actionText, onAction });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    const newRecipe: Partial<Recipe> = {
      id: `recipe_custom_${Date.now()}`,
      title: '',
      meal_type: 'lunch_lunchbox',
      prep_time_minutes: 10,
      cook_time_minutes: 15,
      difficulty: 'Einfach',
      lunchbox_ready: true,
      base_calories: 450,
      base_protein_g: 25,
      base_carbs_g: 40,
      base_fat_g: 15,
      allergens: [],
      diet_types: ['omnivore'],
      tags: ['Familie', 'Frisch'],
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    };
    setFormData(newRecipe);
    setIngredientsText('Haferflocken | 100 | g | Basics\nSkyr Natur | 150 | g | Kühlung\nHeidelbeeren | 50 | g | Obst');
    setPrepStepsText('Alle Zutaten abwiegen und bereitstellen.\nFrüchte gründlich waschen.');
    setCookingStepsText('Zutaten schichten oder in der Pfanne / Schüssel zubereiten.\nMit Toppings garnieren und servieren.');
    setLunchboxTipsText('In einer dichten Brotdose transportieren.\nOptional Kühlpad einpacken.');
    setIsCreatingNew(true);
    setEditModalRecipe(newRecipe as Recipe);
  };

  // Open Form for Edit
  const handleOpenEdit = (recipe: Recipe, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormData({ ...recipe });
    setIsCreatingNew(false);

    const ingLines = recipe.ingredients
      .map((i) => `${i.name} | ${i.base_amount} | ${i.unit} | ${i.category || 'Basics'}`)
      .join('\n');
    setIngredientsText(ingLines);

    const prep = recipe.detailed_instructions?.prep_steps?.join('\n') || '';
    setPrepStepsText(prep);

    const cook = recipe.detailed_instructions?.cooking_steps?.join('\n') || recipe.instructions?.join('\n') || '';
    setCookingStepsText(cook);

    const tips = recipe.detailed_instructions?.lunchbox_tips?.join('\n') || '';
    setLunchboxTipsText(tips);

    setEditModalRecipe(recipe);
  };

  // Submit Create or Edit
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsedIngredients: RecipeIngredient[] = ingredientsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split('|').map((p) => p.trim());
          return {
            name: parts[0] || 'Zutat',
            base_amount: parseFloat(parts[1]) || 100,
            unit: parts[2] || 'g',
            category: parts[3] || 'Basics',
          };
        });

      const parsedPrepSteps = prepStepsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const parsedCookingSteps = cookingStepsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const parsedLunchboxTips = lunchboxTipsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const completeRecipe: Recipe = {
        id: formData.id || `recipe_custom_${Date.now()}`,
        title: formData.title || 'Unbenanntes Rezept',
        meal_type: formData.meal_type || 'lunch_lunchbox',
        prep_time_minutes: formData.prep_time_minutes ?? 15,
        cook_time_minutes: formData.cook_time_minutes ?? 15,
        difficulty: formData.difficulty || 'Einfach',
        lunchbox_ready: formData.meal_type !== 'dinner_home',
        base_calories: formData.base_calories ?? 450,
        base_protein_g: formData.base_protein_g ?? 25,
        base_carbs_g: formData.base_carbs_g ?? 40,
        base_fat_g: formData.base_fat_g ?? 15,
        allergens: formData.allergens || [],
        diet_types: formData.diet_types || ['omnivore'],
        tags: formData.tags || ['Familie'],
        image_url: formData.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        ingredients: parsedIngredients,
        instructions: parsedCookingSteps,
        detailed_instructions: {
          prep_steps: parsedPrepSteps,
          cooking_steps: parsedCookingSteps,
          lunchbox_tips: parsedLunchboxTips,
        },
      };

      const res = await apiFetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeRecipe),
      });

      if (res.ok) {
        setRecipes((prev) => {
          const idx = prev.findIndex((r) => r.id === completeRecipe.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = completeRecipe;
            return copy;
          }
          return [completeRecipe, ...prev];
        });

        showToast(`✅ Rezept "${completeRecipe.title}" gespeichert.`);
        setEditModalRecipe(null);
        if (onRefreshRecipes) {
          await onRefreshRecipes();
        }
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Fehler beim Speichern des Rezepts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Recipe
  const handleDeleteRecipe = async () => {
    if (!deleteConfirmRecipe) return;
    const recipeId = deleteConfirmRecipe.id;

    try {
      const res = await apiFetch(`/api/recipes/${recipeId}`, { method: 'DELETE' });
      if (res.ok || res.status === 404) {
        setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        showToast('🗑️ Rezept gelöscht.');
        setDeleteConfirmRecipe(null);
        if (viewRecipe?.id === recipeId) {
          setViewRecipe(null);
        }
        if (onRefreshRecipes) {
          await onRefreshRecipes();
        }
      }
    } catch (err) {
      console.error(err);
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setDeleteConfirmRecipe(null);
    }
  };

  // Open "In Wochenplan einplanen" Dialog
  const handleOpenAddToPlan = (recipe: Recipe, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlanSlotRecipe(recipe);
    // Preselect suitable meal slot
    if (recipe.meal_type === 'breakfast_lunchbox') {
      setTargetMealType('breakfast');
    } else if (recipe.meal_type === 'lunch_lunchbox') {
      setTargetMealType('lunch');
    } else {
      setTargetMealType('dinner');
    }
  };

  // Execute Add To Weekly Plan
  const handleConfirmAddToPlan = async () => {
    if (!planSlotRecipe || !onAddToWeeklyPlan) return;
    setIsSavingToPlan(true);
    try {
      const success = await onAddToWeeklyPlan(planSlotRecipe, targetDayIndex, targetMealType);
      const dayName = WEEKDAYS.find((d) => d.idx === targetDayIndex)?.full || 'Tag';
      const slotName = targetMealType === 'breakfast' ? 'Frühstück' : targetMealType === 'lunch' ? 'Mittagessen' : 'Abendessen';

      setPlanSlotRecipe(null);
      if (success) {
        showToast(
          `✅ "${planSlotRecipe.title}" für ${dayName} (${slotName}) eingeplant!`,
          'Zum Wochenplan',
          () => onNavigateTab && onNavigateTab('woche')
        );
      } else {
        showToast('⚠️ Mahlzeit konnte nicht eingeplant werden.');
      }
    } catch (e) {
      console.error(e);
      showToast('⚠️ Fehler beim Einplanen.');
    } finally {
      setIsSavingToPlan(false);
    }
  };

  // Filter Logic
  const filteredRecipes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return recipes.filter((r) => {
      // Search term
      if (q) {
        const titleMatch = r.title.toLowerCase().includes(q);
        const ingMatch = r.ingredients.some((i) => i.name.toLowerCase().includes(q));
        const tagMatch = r.tags?.some((t) => t.toLowerCase().includes(q));
        if (!titleMatch && !ingMatch && !tagMatch) return false;
      }

      // Quick filter
      if (quickFilter === 'breakfast' && r.meal_type !== 'breakfast_lunchbox') return false;
      if (quickFilter === 'lunch' && r.meal_type !== 'lunch_lunchbox') return false;
      if (quickFilter === 'dinner' && r.meal_type !== 'dinner_home') return false;
      if (quickFilter === 'express') {
        const totalTime = (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0);
        if (totalTime > 20) return false;
      }
      if (quickFilter === 'high_protein') {
        if (!r.diet_types?.includes('high_protein') && r.base_protein_g < 25) return false;
      }
      if (quickFilter === 'veggie') {
        if (!r.diet_types?.includes('vegetarian') && !r.diet_types?.includes('vegan')) return false;
      }
      if (quickFilter === 'gluten_free') {
        const lowerAllergens = (r.allergens || []).map((a) => a.toLowerCase());
        if (lowerAllergens.some((a) => a.includes('gluten'))) return false;
      }

      return true;
    });
  }, [recipes, searchTerm, quickFilter]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-16">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 animate-fadeIn border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
          {toastMessage.actionText && toastMessage.onAction && (
            <button
              onClick={toastMessage.onAction}
              className="ml-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black transition"
            >
              {toastMessage.actionText} →
            </button>
          )}
        </div>
      )}

      {/* 1. UNIFIED PAGE HEADER */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Rezept-Bibliothek
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                {recipes.length} Rezepte
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              1.220+ Offline-Rezepte & Familien-Kreationen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('woche')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Wochenplan</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-sm transition active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Neues Rezept</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & HORIZONTAL FILTER PILLS */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rezepte oder Zutaten suchen (z. B. Skyr, Linsen, Hafer, Curry)..."
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 bg-slate-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Alle' },
            { id: 'breakfast', label: '🥪 Frühstück' },
            { id: 'lunch', label: '🥗 Mittag' },
            { id: 'dinner', label: '🍲 Abend' },
            { id: 'express', label: '⚡ < 20 Min' },
            { id: 'high_protein', label: '💪 High-Protein' },
            { id: 'veggie', label: '🌱 Veggie' },
            { id: 'gluten_free', label: '🌾 Glutenfrei' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setQuickFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                quickFilter === f.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Strip */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
        <span>
          <strong>{filteredRecipes.length}</strong> von {recipes.length} Rezepten
        </span>
        {(searchTerm || quickFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setQuickFilter('all');
            }}
            className="text-emerald-700 font-bold hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* 3. COMPACT RECIPE CARDS GRID */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
          <ChefHat className="w-8 h-8 mx-auto mb-2 animate-bounce text-emerald-600" />
          <p className="text-xs font-bold">Lade Rezepte...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/80 max-w-md mx-auto space-y-3">
          <Utensils className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">Keine Rezepte gefunden</h3>
          <p className="text-xs text-slate-500">
            Passe deine Suche an oder erstelle jetzt dein eigenes Familienrezept.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-700 transition"
          >
            + Neues Rezept erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredRecipes.map((recipe) => {
            const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

            return (
              <div
                key={recipe.id}
                onClick={() => setViewRecipe(recipe)}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition duration-150 cursor-pointer overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-3 sm:p-4">
                  {/* Top Row: Thumbnail + Details */}
                  <div className="flex items-start gap-3">
                    {/* Compact 80x80 Photo Thumbnail */}
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 overflow-hidden shrink-0 relative shadow-2xs aspect-square">
                      <img
                        src={recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                    </div>

                    {/* Middle Details: Title, Badges, Macros */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          recipe.meal_type === 'breakfast_lunchbox'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : recipe.meal_type === 'lunch_lunchbox'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-rose-100 text-rose-900 border border-rose-200'
                        }`}>
                          {recipe.meal_type === 'breakfast_lunchbox'
                            ? 'Frühstück'
                            : recipe.meal_type === 'lunch_lunchbox'
                            ? 'Mittag'
                            : 'Abendessen'}
                        </span>

                        {/* Edit & Delete Mini-Buttons */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={(e) => handleOpenEdit(recipe, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Bearbeiten"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmRecipe(recipe);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-1 group-hover:text-emerald-700 transition">
                        {recipe.title}
                      </h3>

                      {/* Key Macros Strip */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {totalTime}m
                        </span>
                        <span className="flex items-center gap-0.5 text-orange-600 font-bold">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {recipe.base_calories}
                        </span>
                        <span className="text-blue-700 font-bold">
                          {recipe.base_protein_g}g P
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          ({recipe.ingredients.length} Zut.)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Strip */}
                <div className="px-3 sm:px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-emerald-700 font-bold text-[11px] group-hover:underline">
                    Rezept ansehen →
                  </span>

                  {/* 1-Tap "In Woche einplanen" Button */}
                  {onAddToWeeklyPlan && (
                    <button
                      onClick={(e) => handleOpenAddToPlan(recipe, e)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black shadow-2xs transition active:scale-95"
                      title="Dieses Rezept direkt in den Wochenplan legen"
                    >
                      <CalendarPlus className="w-3 h-3" />
                      <span>+ In Woche</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL: IN WOCHENPLAN EINPLANEN */}
      {planSlotRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    In Wochenplan einfügen
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                    {planSlotRecipe.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPlanSlotRecipe(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Wochentag Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Wochentag wählen:</label>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d.idx}
                    type="button"
                    onClick={() => setTargetDayIndex(d.idx)}
                    className={`py-2 rounded-xl text-center text-xs font-black transition ${
                      targetDayIndex === d.idx
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mahlzeit Slot */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Mahlzeit wählen:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetMealType('breakfast')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                    targetMealType === 'breakfast'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>🥪 Frühstück</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMealType('lunch')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                    targetMealType === 'lunch'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>🥗 Mittag</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMealType('dinner')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                    targetMealType === 'dinner'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>🍲 Abend</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlanSlotRecipe(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={isSavingToPlan}
                onClick={handleConfirmAddToPlan}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingToPlan ? 'Speichert...' : 'Jetzt einplanen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. RECIPE DETAIL MODAL */}
      {viewRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
            <div className="relative h-48 sm:h-56 w-full bg-slate-900 shrink-0">
              <img
                src={viewRecipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                alt={viewRecipe.title}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              <button
                onClick={() => setViewRecipe(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                    {viewRecipe.meal_type === 'breakfast_lunchbox'
                      ? '🥪 Frühstück'
                      : viewRecipe.meal_type === 'lunch_lunchbox'
                      ? '🥗 Mittagessen'
                      : '🍲 Abendessen'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    {viewRecipe.difficulty}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">{viewRecipe.title}</h2>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Vorbereitung</span>
                  <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-0.5">
                    <Clock className="w-3 h-3 text-slate-400" /> {viewRecipe.prep_time_minutes}m
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Kochzeit</span>
                  <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-0.5">
                    <ChefHat className="w-3 h-3 text-slate-400" /> {viewRecipe.cook_time_minutes}m
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Kalorien</span>
                  <span className="text-xs font-black text-orange-600 flex items-center justify-center gap-0.5">
                    <Flame className="w-3 h-3" /> {viewRecipe.base_calories}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Protein</span>
                  <span className="text-xs font-black text-blue-700">
                    {viewRecipe.base_protein_g}g
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 mb-2">
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  Zutatenliste (1 Portion)
                </h3>
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 divide-y divide-slate-200/60">
                  {viewRecipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between first:pt-0 last:pb-0 text-slate-700">
                      <span>• {ing.name}</span>
                      <span className="font-mono font-bold text-slate-900 flex items-center">
                        {ing.base_amount} {ing.unit}
                        {ing.matched_offer_retailer && (
                          <span className={`ml-1 text-[9px] px-1 py-0.2 rounded font-bold ${getRetailerBadgeClass(ing.matched_offer_retailer)}`}>
                            {ing.matched_offer_retailer}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cooking Steps */}
              {viewRecipe.detailed_instructions?.cooking_steps?.length ? (
                <div>
                  <h3 className="text-xs font-black text-slate-900 mb-2">Kochanleitung</h3>
                  <div className="space-y-1.5">
                    {viewRecipe.detailed_instructions.cooking_steps.map((s, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-xl">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : viewRecipe.instructions?.length ? (
                <div>
                  <h3 className="text-xs font-black text-slate-900 mb-2">Anleitung</h3>
                  <div className="space-y-1.5">
                    {viewRecipe.instructions.map((inst, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-xl">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700">{inst}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => setViewRecipe(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition"
              >
                Schließen
              </button>

              <div className="flex items-center gap-2">
                {onAddToWeeklyPlan && (
                  <button
                    onClick={() => {
                      const r = viewRecipe;
                      setViewRecipe(null);
                      handleOpenAddToPlan(r);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center gap-1"
                  >
                    <CalendarPlus className="w-3 h-3" />
                    <span>In Woche</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    const r = viewRecipe;
                    setViewRecipe(null);
                    handleOpenEdit(r);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  Bearbeiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. CREATE / EDIT MODAL */}
      {editModalRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-base font-black text-slate-900">
                {isCreatingNew ? 'Neues Rezept erstellen' : 'Rezept bearbeiten'}
              </h3>
              <button onClick={() => setEditModalRecipe(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Rezeptname *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mahlzeit *</label>
                  <select
                    value={formData.meal_type || 'lunch_lunchbox'}
                    onChange={(e) => setFormData({ ...formData, meal_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="breakfast_lunchbox">🥪 Frühstück</option>
                    <option value="lunch_lunchbox">🥗 Mittagessen</option>
                    <option value="dinner_home">🍲 Abendessen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Vorbereitung (Min)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.prep_time_minutes ?? 10}
                    onChange={(e) => setFormData({ ...formData, prep_time_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kochzeit (Min)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cook_time_minutes ?? 15}
                    onChange={(e) => setFormData({ ...formData, cook_time_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Schwierigkeit</label>
                  <select
                    value={formData.difficulty || 'Einfach'}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="Einfach">Einfach</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Anspruchsvoll">Anspruchsvoll</option>
                  </select>
                </div>
              </div>

              {/* Nutrition */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Kalorien</span>
                  <input
                    type="number"
                    value={formData.base_calories ?? 500}
                    onChange={(e) => setFormData({ ...formData, base_calories: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Protein (g)</span>
                  <input
                    type="number"
                    value={formData.base_protein_g ?? 30}
                    onChange={(e) => setFormData({ ...formData, base_protein_g: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-xs text-blue-700"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Carbs (g)</span>
                  <input
                    type="number"
                    value={formData.base_carbs_g ?? 45}
                    onChange={(e) => setFormData({ ...formData, base_carbs_g: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Fett (g)</span>
                  <input
                    type="number"
                    value={formData.base_fat_g ?? 15}
                    onChange={(e) => setFormData({ ...formData, base_fat_g: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Foto-URL</label>
                <input
                  type="url"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* Ingredients */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Zutaten (Name | Menge | Einheit) *</label>
                  <span className="text-[10px] text-slate-400">1 Zutat pro Zeile</span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="Haferflocken | 100 | g&#10;Skyr | 150 | g"
                />
              </div>

              {/* Cooking steps */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kochanleitung (1 Schritt pro Zeile)</label>
                <textarea
                  rows={3}
                  value={cookingStepsText}
                  onChange={(e) => setCookingStepsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="Zutaten mischen und kurz erhitzen."
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalRecipe(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Speichert...' : 'Rezept speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {deleteConfirmRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-3 text-center animate-fadeIn">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">Rezept löschen?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Möchtest du <strong>"{deleteConfirmRecipe.title}"</strong> wirklich löschen?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirmRecipe(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteRecipe}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

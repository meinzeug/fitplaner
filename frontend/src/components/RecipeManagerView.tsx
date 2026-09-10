import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, RecipeIngredient, DetailedInstruction } from '../types';
import { getRetailerBadgeClass } from '../utils/retailerBadges';
import { apiFetch } from '../api/client';
import {
  Search, Plus, Clock, Flame, ChefHat, Box, Utensils, X,
  Sparkles, Check, Edit3, Trash2, AlertCircle, AlertTriangle,
  BookOpen, Heart, CheckCircle2, ChevronDown
} from 'lucide-react';

interface Props {
  recipes?: Recipe[];
  onRefreshRecipes?: () => Promise<void>;
}

export const RecipeManagerView: React.FC<Props> = ({
  recipes: initialRecipes,
  onRefreshRecipes,
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes || []);
  const [isLoading, setIsLoading] = useState(!initialRecipes || initialRecipes.length === 0);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [mealFilter, setMealFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner'>('all');
  const [dietFilter, setDietFilter] = useState<'all' | 'vegetarian' | 'vegan' | 'high_protein' | 'low_carb' | 'keto'>('all');
  const [allergenFilter, setAllergenFilter] = useState<'none' | 'gluten_free' | 'lactose_free' | 'nut_free'>('none');
  const [timeFilter, setTimeFilter] = useState<'all' | '15' | '30' | '45'>('all');

  // Modals
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
  const [editModalRecipe, setEditModalRecipe] = useState<Recipe | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteConfirmRecipe, setDeleteConfirmRecipe] = useState<Recipe | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState<Partial<Recipe>>({});
  const [ingredientsText, setIngredientsText] = useState('');
  const [prepStepsText, setPrepStepsText] = useState('');
  const [cookingStepsText, setCookingStepsText] = useState('');
  const [lunchboxTipsText, setLunchboxTipsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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

    // Format ingredients into lines: "Name | amount | unit | category"
    const ingLines = recipe.ingredients
      .map((i) => `${i.name} | ${i.base_amount} | ${i.unit} | ${i.category || 'Basics'}`)
      .join('\n');
    setIngredientsText(ingLines);

    // Prep steps
    const prep = recipe.detailed_instructions?.prep_steps?.join('\n') || '';
    setPrepStepsText(prep);

    // Cooking steps
    const cook = recipe.detailed_instructions?.cooking_steps?.join('\n') || recipe.instructions?.join('\n') || '';
    setCookingStepsText(cook);

    // Lunchbox tips
    const tips = recipe.detailed_instructions?.lunchbox_tips?.join('\n') || '';
    setLunchboxTipsText(tips);

    setEditModalRecipe(recipe);
  };

  // Submit Create or Edit
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse ingredients
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

      // Parse steps
      const prepSteps = prepStepsText.split('\n').map((s) => s.trim()).filter(Boolean);
      const cookingSteps = cookingStepsText.split('\n').map((s) => s.trim()).filter(Boolean);
      const lunchboxTips = lunchboxTipsText.split('\n').map((s) => s.trim()).filter(Boolean);

      const detailed: DetailedInstruction = {
        prep_steps: prepSteps,
        cooking_steps: cookingSteps,
        lunchbox_tips: lunchboxTips,
      };

      const finalRecipe: Recipe = {
        id: formData.id || `recipe_custom_${Date.now()}`,
        title: formData.title || 'Neues Rezept',
        meal_type: formData.meal_type || 'lunch_lunchbox',
        prep_time_minutes: Number(formData.prep_time_minutes) || 10,
        cook_time_minutes: Number(formData.cook_time_minutes) || 15,
        difficulty: formData.difficulty || 'Einfach',
        lunchbox_ready: formData.lunchbox_ready ?? true,
        base_calories: Number(formData.base_calories) || 500,
        base_protein_g: Number(formData.base_protein_g) || 30,
        base_carbs_g: Number(formData.base_carbs_g) || 45,
        base_fat_g: Number(formData.base_fat_g) || 15,
        allergens: formData.allergens || [],
        diet_types: formData.diet_types || ['omnivore'],
        tags: formData.tags || ['Familie'],
        image_url: formData.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        ingredients: parsedIngredients.length > 0 ? parsedIngredients : [
          { name: 'Basis-Zutat', base_amount: 100, unit: 'g', category: 'Basics' }
        ],
        instructions: cookingSteps.length > 0 ? cookingSteps : ['Zutaten zubereiten und anrichten.'],
        detailed_instructions: detailed,
      };

      let response: Response;
      if (isCreatingNew) {
        response = await apiFetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalRecipe),
        });
      } else {
        response = await apiFetch(`/api/recipes/${finalRecipe.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalRecipe),
        });
      }

      if (response.ok) {
        const saved = await response.json();
        setRecipes((prev) => {
          if (isCreatingNew) {
            return [saved, ...prev];
          }
          return prev.map((r) => (r.id === saved.id ? saved : r));
        });
        showToast(isCreatingNew ? '✅ Rezept erfolgreich erstellt!' : '✅ Rezept erfolgreich aktualisiert!');
        setEditModalRecipe(null);
        if (onRefreshRecipes) {
          await onRefreshRecipes();
        }
      } else {
        // Fallback for offline/local simulation
        setRecipes((prev) => {
          if (isCreatingNew) return [finalRecipe, ...prev];
          return prev.map((r) => (r.id === finalRecipe.id ? finalRecipe : r));
        });
        showToast('✅ Rezept lokal gesichert!');
        setEditModalRecipe(null);
      }
    } catch (err) {
      console.error(err);
      alert('Fehler beim Speichern des Rezepts.');
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
        showToast('🗑️ Rezept erfolgreich gelöscht.');
        setDeleteConfirmRecipe(null);
        if (viewRecipe?.id === recipeId) {
          setViewRecipe(null);
        }
        if (onRefreshRecipes) {
          await onRefreshRecipes();
        }
      } else {
        setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        setDeleteConfirmRecipe(null);
      }
    } catch (err) {
      console.error(err);
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setDeleteConfirmRecipe(null);
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

      // Meal type
      if (mealFilter !== 'all') {
        if (mealFilter === 'breakfast' && r.meal_type !== 'breakfast_lunchbox') return false;
        if (mealFilter === 'lunch' && r.meal_type !== 'lunch_lunchbox') return false;
        if (mealFilter === 'dinner' && r.meal_type !== 'dinner_home') return false;
      }

      // Diet style
      if (dietFilter !== 'all') {
        if (dietFilter === 'vegetarian') {
          if (!r.diet_types.includes('vegetarian') && !r.diet_types.includes('vegan')) return false;
        } else if (dietFilter === 'vegan') {
          if (!r.diet_types.includes('vegan')) return false;
        } else if (dietFilter === 'high_protein') {
          if (!r.diet_types.includes('high_protein') && r.base_protein_g < 30) return false;
        } else if (dietFilter === 'low_carb') {
          if (!r.diet_types.includes('low_carb') && r.base_carbs_g > 25) return false;
        } else if (dietFilter === 'keto') {
          if (!r.diet_types.includes('keto') && !(r.base_carbs_g <= 15 && r.base_fat_g >= 20)) return false;
        }
      }

      // Allergen filter
      if (allergenFilter !== 'none') {
        const lowerAllergens = (r.allergens || []).map((a) => a.toLowerCase());
        if (allergenFilter === 'gluten_free' && lowerAllergens.some((a) => a.includes('gluten'))) return false;
        if (allergenFilter === 'lactose_free' && lowerAllergens.some((a) => a.includes('laktose') || a.includes('lactose') || a.includes('milch'))) return false;
        if (allergenFilter === 'nut_free' && lowerAllergens.some((a) => a.includes('nuss') || a.includes('nüsse') || a.includes('erdnuss'))) return false;
      }

      // Time filter
      if (timeFilter !== 'all') {
        const totalTime = (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0);
        const maxTime = parseInt(timeFilter);
        if (totalTime > maxTime) return false;
      }

      return true;
    });
  }, [recipes, searchTerm, mealFilter, dietFilter, allergenFilter, timeFilter]);

  return (
    <div className="space-y-6 pb-16">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Banner with Stats & New Button */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Rezept-Universum</h2>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                1.220+ Offline-Rezepte & Eigene Kreationen
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Stöbere im vollen Rezeptbuch, filtere nach Mahlzeit, Ernährungsform oder Allergien, und
            lege eigene Familienrezepte an, die direkt im Wochenplan eingeplant werden.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl shadow-lg transition active:scale-95 text-xs sm:text-sm self-start md:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Neues Rezept erstellen
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sofort-Suche nach Rezeptname, Zutat (z. B. Haferflocken, Linsen, Skyr) oder Tag..."
            className="w-full pl-12 pr-10 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills Rows */}
        <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
          {/* Row 1: Mahlzeit */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-400 text-[11px] uppercase mr-2 min-w-[75px]">Mahlzeit:</span>
            {[
              { id: 'all', label: 'Alle Mahlzeiten' },
              { id: 'breakfast', label: '🥪 Frühstück' },
              { id: 'lunch', label: '🥗 Mittagessen' },
              { id: 'dinner', label: '🍲 Abendessen' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMealFilter(m.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  mealFilter === m.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Row 2: Ernährungsform */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-400 text-[11px] uppercase mr-2 min-w-[75px]">Ernährung:</span>
            {[
              { id: 'all', label: 'Alle' },
              { id: 'vegetarian', label: '🌱 Vegetarisch' },
              { id: 'vegan', label: '🌿 Vegan' },
              { id: 'high_protein', label: '💪 High Protein' },
              { id: 'low_carb', label: '🥩 Low Carb' },
              { id: 'keto', label: '🥑 Keto' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDietFilter(d.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  dietFilter === d.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Row 3: Allergenfilter & Zubereitungszeit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Allergenfilter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-400 text-[11px] uppercase mr-2 min-w-[75px]">Allergien:</span>
              {[
                { id: 'none', label: 'Kein Filter' },
                { id: 'gluten_free', label: '🌾 Glutenfrei' },
                { id: 'lactose_free', label: '🥛 Laktosefrei' },
                { id: 'nut_free', label: '🥜 Nussfrei' },
              ].map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAllergenFilter(a.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    allergenFilter === a.id
                      ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Zubereitungszeit */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-400 text-[11px] uppercase mr-2">Zeit:</span>
              {[
                { id: 'all', label: 'Alle' },
                { id: '15', label: '< 15 Min' },
                { id: '30', label: '< 30 Min' },
                { id: '45', label: '< 45 Min' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    timeFilter === t.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Results Bar */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500">
        <span>
          Gefunden: <strong>{filteredRecipes.length}</strong> von {recipes.length} Rezepten
        </span>
        {(searchTerm || mealFilter !== 'all' || dietFilter !== 'all' || allergenFilter !== 'none' || timeFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setMealFilter('all');
              setDietFilter('all');
              setAllergenFilter('none');
              setTimeFilter('all');
            }}
            className="text-emerald-600 font-bold hover:underline"
          >
            Alle Filter zurücksetzen
          </button>
        )}
      </div>

      {/* 4. Recipe Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <ChefHat className="w-8 h-8 mx-auto mb-2 animate-bounce text-emerald-600" />
          <p className="text-sm font-bold">Lade Rezepte...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-md mx-auto space-y-3">
          <Utensils className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-800 text-base">Keine passenden Rezepte gefunden</h3>
          <p className="text-xs text-slate-500">
            Passe deine Suche oder Filter an, oder erstelle jetzt dein eigenes Lieblingsgericht.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-700 transition"
          >
            + Neues Rezept erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map((recipe) => {
            const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

            return (
              <div
                key={recipe.id}
                onClick={() => setViewRecipe(recipe)}
                className="bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-xl transition duration-200 cursor-pointer overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Banner */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-95"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    {/* Meal Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide text-white shadow-xs ${
                        recipe.meal_type === 'breakfast_lunchbox'
                          ? 'bg-amber-500'
                          : recipe.meal_type === 'lunch_lunchbox'
                          ? 'bg-blue-600'
                          : 'bg-rose-600'
                      }`}>
                        {recipe.meal_type === 'breakfast_lunchbox'
                          ? '🥪 Frühstück'
                          : recipe.meal_type === 'lunch_lunchbox'
                          ? '🥗 Mittagessen'
                          : '🍲 Abendessen'}
                      </span>
                      {recipe.lunchbox_ready && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/30 backdrop-blur-sm text-white">
                          To-Go
                        </span>
                      )}
                    </div>

                    {/* Action buttons (Edit, Delete) in photo corner */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEdit(recipe, e)}
                        className="w-7 h-7 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition shadow-xs"
                        title="Rezept bearbeiten"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmRecipe(recipe);
                        }}
                        className="w-7 h-7 rounded-full bg-red-950/70 hover:bg-red-600 text-white flex items-center justify-center transition shadow-xs"
                        title="Rezept löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title in bottom banner */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-base font-black text-white leading-tight drop-shadow-sm line-clamp-1">
                        {recipe.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    {/* Time, Calories & Protein Metrics */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {totalTime} Min
                      </span>
                      <span className="flex items-center gap-1 font-bold text-orange-600">
                        <Flame className="w-3.5 h-3.5" />
                        {recipe.base_calories} kcal
                      </span>
                      <span className="font-bold text-blue-700">
                        {recipe.base_protein_g}g Prot.
                      </span>
                    </div>

                    {/* Macro distribution badges */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Protein</span>
                        <strong className="text-blue-700 font-bold">{recipe.base_protein_g}g</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Carbs</span>
                        <strong className="text-amber-700 font-bold">{recipe.base_carbs_g}g</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Fett</span>
                        <strong className="text-emerald-700 font-bold">{recipe.base_fat_g}g</strong>
                      </div>
                    </div>

                    {/* Diet & Allergen tags */}
                    <div className="flex flex-wrap items-center gap-1">
                      {(recipe.diet_types || []).map((d) => (
                        <span
                          key={d}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          {d}
                        </span>
                      ))}
                      {recipe.allergens && recipe.allergens.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                          ⚠️ {recipe.allergens.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {recipe.ingredients.length} Zutaten
                  </span>
                  <span className="text-emerald-700 font-bold group-hover:underline flex items-center gap-1">
                    Rezept ansehen →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. RECIPE DETAIL MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      {viewRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Header Banner */}
            <div className="relative h-60 w-full bg-slate-900 shrink-0">
              <img
                src={viewRecipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                alt={viewRecipe.title}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              <button
                onClick={() => setViewRecipe(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center transition backdrop-blur-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-white">
                    {viewRecipe.meal_type === 'breakfast_lunchbox'
                      ? '🥪 Frühstück to-go'
                      : viewRecipe.meal_type === 'lunch_lunchbox'
                      ? '🥗 Mittag to-go'
                      : '🍲 Abendessen frisch'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                    {viewRecipe.difficulty}
                  </span>
                  {viewRecipe.allergens.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/90 text-stone-900">
                      Allergene: {viewRecipe.allergens.join(', ')}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{viewRecipe.title}</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Vorbereitung</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {viewRecipe.prep_time_minutes} Min
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Kochzeit</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
                    <ChefHat className="w-3.5 h-3.5 text-slate-400" /> {viewRecipe.cook_time_minutes} Min
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Basis-Kalorien</span>
                  <span className="text-sm font-black text-orange-600 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> {viewRecipe.base_calories} kcal
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Protein</span>
                  <span className="text-sm font-black text-blue-700">
                    {viewRecipe.base_protein_g}g
                  </span>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2.5">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  Zutatenliste (1 Basis-Portion)
                </h3>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 divide-y divide-slate-200/60">
                  {viewRecipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
                      <span className="font-semibold text-slate-800">• {ing.name}</span>
                      <span className="font-mono font-bold text-slate-900 flex items-center">
                        {ing.base_amount} {ing.unit}
                        {ing.matched_offer_retailer && (
                          <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-bold shadow-xs ${getRetailerBadgeClass(ing.matched_offer_retailer)}`}>
                            {ing.matched_offer_retailer} Deal
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rich Steps */}
              {viewRecipe.detailed_instructions &&
              ((viewRecipe.detailed_instructions.prep_steps && viewRecipe.detailed_instructions.prep_steps.length > 0) ||
               (viewRecipe.detailed_instructions.cooking_steps && viewRecipe.detailed_instructions.cooking_steps.length > 0) ||
               (viewRecipe.detailed_instructions.lunchbox_tips && viewRecipe.detailed_instructions.lunchbox_tips.length > 0)) ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-emerald-600" />
                    Schritt-für-Schritt Zubereitung
                  </h3>

                  {/* 1. Prep Steps */}
                  {viewRecipe.detailed_instructions.prep_steps && viewRecipe.detailed_instructions.prep_steps.length > 0 && (
                    <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 space-y-2.5">
                      <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        1. Vorbereitung & Schnippeln
                      </span>
                      <div className="space-y-2">
                        {viewRecipe.detailed_instructions.prep_steps.map((s, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 bg-white/90 p-2.5 rounded-xl border border-emerald-100/60">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-slate-800 font-medium leading-relaxed">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Cooking Steps */}
                  {viewRecipe.detailed_instructions.cooking_steps && viewRecipe.detailed_instructions.cooking_steps.length > 0 && (
                    <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100 space-y-2.5">
                      <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        2. Kochen, Braten & Anrichten
                      </span>
                      <div className="space-y-2">
                        {viewRecipe.detailed_instructions.cooking_steps.map((s, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 bg-white/90 p-2.5 rounded-xl border border-amber-100/60">
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-slate-800 font-medium leading-relaxed">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Lunchbox Tips */}
                  {viewRecipe.detailed_instructions.lunchbox_tips && viewRecipe.detailed_instructions.lunchbox_tips.length > 0 && (
                    <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 space-y-2.5">
                      <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5 uppercase tracking-wide">
                        <Box className="w-3.5 h-3.5 text-blue-600" />
                        3. Brotdosen- & Frische-Tipps
                      </span>
                      <div className="space-y-2">
                        {viewRecipe.detailed_instructions.lunchbox_tips.map((tip, idx) => (
                          <div key={idx} className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-blue-100/60">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <span className="text-slate-800 font-medium leading-relaxed">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">Anleitung</h3>
                  <div className="space-y-2">
                    {(viewRecipe.instructions || []).map((inst, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-slate-800 font-medium leading-relaxed">{inst}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => setViewRecipe(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition"
              >
                Schließen
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const r = viewRecipe;
                    setViewRecipe(null);
                    handleOpenEdit(r);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Rezept bearbeiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. CREATE / EDIT RECIPE MODAL                                  */}
      {/* ------------------------------------------------------------- */}
      {editModalRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ChefHat className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {isCreatingNew ? 'Neues Rezept erstellen' : 'Rezept bearbeiten'}
                </h3>
              </div>
              <button
                onClick={() => setEditModalRecipe(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Title & Meal Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Rezeptname *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="z. B. Cremiges Rote-Linsen-Dal"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mahlzeit *</label>
                  <select
                    value={formData.meal_type || 'lunch_lunchbox'}
                    onChange={(e) => setFormData({ ...formData, meal_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="breakfast_lunchbox">🥪 Frühstück (Brotdose)</option>
                    <option value="lunch_lunchbox">🥗 Mittagessen (Lunchbox)</option>
                    <option value="dinner_home">🍲 Abendessen (Frisch warm)</option>
                  </select>
                </div>
              </div>

              {/* Times & Difficulty */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Vorbereitung (Min)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={formData.prep_time_minutes ?? 10}
                    onChange={(e) => setFormData({ ...formData, prep_time_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kochzeit (Min)</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={formData.cook_time_minutes ?? 15}
                    onChange={(e) => setFormData({ ...formData, cook_time_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Schwierigkeit</label>
                  <select
                    value={formData.difficulty || 'Einfach'}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="Einfach">Einfach</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Anspruchsvoll">Anspruchsvoll</option>
                  </select>
                </div>
              </div>

              {/* Nutrition */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label className="font-bold text-slate-800 block mb-1">Nährwerte (pro Portion):</label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Kalorien</span>
                    <input
                      type="number"
                      value={formData.base_calories ?? 500}
                      onChange={(e) => setFormData({ ...formData, base_calories: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Protein (g)</span>
                    <input
                      type="number"
                      value={formData.base_protein_g ?? 30}
                      onChange={(e) => setFormData({ ...formData, base_protein_g: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono font-bold text-xs text-blue-700"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Carbs (g)</span>
                    <input
                      type="number"
                      value={formData.base_carbs_g ?? 45}
                      onChange={(e) => setFormData({ ...formData, base_carbs_g: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono font-bold text-xs text-amber-700"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Fett (g)</span>
                    <input
                      type="number"
                      value={formData.base_fat_g ?? 15}
                      onChange={(e) => setFormData({ ...formData, base_fat_g: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono font-bold text-xs text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* Photo URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Foto / Bild-URL</label>
                <input
                  type="url"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* Ingredients List Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Zutaten (Name | Menge | Einheit | Kategorie) *</label>
                  <span className="text-[10px] text-slate-400">1 Zutat pro Zeile</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Haferflocken | 100 | g | Basics&#10;Skyr Natur | 150 | g | Kühlung"
                />
              </div>

              {/* Steps: Prep, Cooking, Lunchbox Tips */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    1. Vorbereitungsschritte (1 Schritt pro Zeile)
                  </label>
                  <textarea
                    rows={2}
                    value={prepStepsText}
                    onChange={(e) => setPrepStepsText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="Zutaten waschen und kleinschneiden.&#10;Gewürze bereitstellen."
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    2. Koch- & Zubereitungsschritte (1 Schritt pro Zeile)
                  </label>
                  <textarea
                    rows={3}
                    value={cookingStepsText}
                    onChange={(e) => setCookingStepsText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="In der Pfanne bei mittlerer Hitze anbraten.&#10;Mit Kräutern abschmecken und anrichten."
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-blue-600" />
                    3. Brotdosen- & Meal-Prep Tipps (1 Tipp pro Zeile)
                  </label>
                  <textarea
                    rows={2}
                    value={lunchboxTipsText}
                    onChange={(e) => setLunchboxTipsText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="In einer dichten Box im Kühlschrank bis zu 3 Tage haltbar."
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalRecipe(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  {isSubmitting ? 'Speichert...' : isCreatingNew ? 'Rezept anlegen' : 'Änderungen speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. DELETE CONFIRMATION MODAL                                   */}
      {/* ------------------------------------------------------------- */}
      {deleteConfirmRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Rezept löschen?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Möchtest du das Rezept <strong>"{deleteConfirmRecipe.title}"</strong> wirklich endgültig aus der Rezeptdatenbank entfernen?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmRecipe(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteRecipe}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition"
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

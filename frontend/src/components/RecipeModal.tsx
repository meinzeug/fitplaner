import React from 'react';
import { Recipe, PersonMealPortion, PantryItem, FamilyMember } from '../types';
import {
  Clock, Flame, CheckCircle2, Box, Utensils, ChefHat, X, Sparkles,
  AlertCircle
} from 'lucide-react';
import { getRetailerBadgeClass } from '../utils/retailerBadges';

interface Props {
  recipe: Recipe | null;
  dayIndex: number;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  activeMember: FamilyMember;
  portion?: PersonMealPortion;
  pantryItems: PantryItem[];
  isCooked?: boolean;
  isAllMembers?: boolean;
  membersCount?: number;
  onCookMeal: (dayIndex: number, mealType: string) => Promise<void>;
  onClose: () => void;
}

export const RecipeModal: React.FC<Props> = ({
  recipe,
  dayIndex,
  mealType,
  activeMember,
  portion,
  pantryItems,
  isCooked = false,
  isAllMembers = false,
  membersCount,
  onCookMeal,
  onClose,
}) => {
  if (!recipe) return null;

  const isAll = isAllMembers || activeMember.id === 'all' || activeMember.name.toLowerCase().includes('familie');
  const countDisplay = membersCount || (activeMember.id === 'all' ? (activeMember.name.match(/\d+/)?.[0] || 'alle') : undefined);

  const isPantryStockAvailable = (ingredientName: string, requiredAmount: number) => {
    const match = pantryItems.find((p) =>
      p.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
      ingredientName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (!match) return { hasStock: false, available: 0 };
    return { hasStock: match.current_quantity >= requiredAmount, available: match.current_quantity };
  };

  const handleCook = async () => {
    await onCookMeal(dayIndex, mealType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header Photo Banner */}
        <div className="relative h-60 w-full bg-slate-900 shrink-0">
          <img
            src={recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
            alt={recipe.title}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center transition backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title on Banner */}
          <div className="absolute bottom-4 left-6 right-6">
            {isAll && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-400 text-emerald-950 shadow-md">
                  👨‍👩‍👧‍👦 {countDisplay ? `Gesamtmenge für alle ${countDisplay} Familienmitglieder` : 'Gesamtmenge für die Familie'} ({portion?.scaled_calories || recipe.base_calories} kcal gesamt)
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-white">
                {mealType === 'breakfast' ? '🥪 Frühstück to-go' : mealType === 'lunch' ? '🥗 Mittag to-go' : '🍲 Abendessen frisch'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                {recipe.difficulty}
              </span>
              {recipe.allergens.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/90 text-stone-900">
                  Allergene: {recipe.allergens.join(', ')}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{recipe.title}</h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Vorbereitung</span>
              <span className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {recipe.prep_time_minutes} Min
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Kochzeit</span>
              <span className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
                <ChefHat className="w-3.5 h-3.5 text-slate-400" /> {recipe.cook_time_minutes} Min
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                {isAll ? (countDisplay ? `Familie (${countDisplay} P.)` : 'Familien-Portion') : `Portion ${activeMember.name}`}
              </span>
              <span className="text-sm font-black text-orange-600 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5" /> {portion?.scaled_calories || recipe.base_calories} kcal
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                {isAll ? 'Gesamt-Protein' : 'Protein'}
              </span>
              <span className="text-sm font-black text-blue-700">
                {portion?.scaled_protein_g || recipe.base_protein_g}g
              </span>
            </div>
          </div>

          {/* Personalized / Aggregated Ingredients List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600" />
                {isAll
                  ? `Zutaten (Gesamtmenge für alle ${countDisplay || ''} Familienmitglieder)`
                  : `Zutaten (Exakt abgemessen für ${activeMember.name})`}
              </h3>
              <span className="text-xs text-slate-400 font-medium">Lagerbestand wird geprüft</span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 divide-y divide-slate-200/60">
              {(portion?.scaled_ingredients || recipe.ingredients.map(i => ({ name: i.name, amount: i.base_amount, unit: i.unit, matched_retailer: i.matched_offer_retailer }))).map((ing, idx) => {
                const stock = isPantryStockAvailable(ing.name, ing.amount);

                return (
                  <div key={idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0 text-xs">
                    <div className="flex items-center gap-2">
                      {stock.hasStock ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]" title={`Im Lager: ${stock.available} ${ing.unit}`}>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Im Lager
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-800 font-medium bg-amber-100 px-2 py-0.5 rounded-md text-[11px]" title="Muss eingekauft werden">
                          <AlertCircle className="w-3 h-3 text-amber-600" /> Kaufen
                        </span>
                      )}
                      <span className="font-semibold text-slate-700">{ing.name}</span>
                    </div>

                    <div className="text-right flex items-center justify-end">
                      <span className="font-mono font-bold text-slate-900">{ing.amount} {ing.unit}</span>
                      {ing.matched_retailer && (
                        <span className={`ml-1.5 text-[10px] px-2 py-0.5 rounded-md font-bold shadow-xs ${getRetailerBadgeClass(ing.matched_retailer)}`}>
                          {ing.matched_retailer} Deal
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Instructions Steps */}
          {recipe.detailed_instructions &&
          ((recipe.detailed_instructions.prep_steps && recipe.detailed_instructions.prep_steps.length > 0) ||
           (recipe.detailed_instructions.cooking_steps && recipe.detailed_instructions.cooking_steps.length > 0) ||
           (recipe.detailed_instructions.lunchbox_tips && recipe.detailed_instructions.lunchbox_tips.length > 0)) ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-emerald-600" />
                  Schritt-für-Schritt Kochanleitung
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  Frisch & Geling-Garantie
                </span>
              </div>

              {/* 1. Prep Steps */}
              {recipe.detailed_instructions.prep_steps && recipe.detailed_instructions.prep_steps.length > 0 && (
                <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      1. Vorbereitung & Schnippeln
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                      {recipe.detailed_instructions.prep_steps.length} {recipe.detailed_instructions.prep_steps.length === 1 ? 'Schritt' : 'Schritte'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {recipe.detailed_instructions.prep_steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-white/90 p-2.5 rounded-xl border border-emerald-100/60 text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          {idx + 1}
                        </span>
                        <span className="text-slate-800 font-medium leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Cooking Steps */}
              {recipe.detailed_instructions.cooking_steps && recipe.detailed_instructions.cooking_steps.length > 0 && (
                <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      2. Kochen, Braten & Anrichten
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                      {recipe.detailed_instructions.cooking_steps.length} {recipe.detailed_instructions.cooking_steps.length === 1 ? 'Schritt' : 'Schritte'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {recipe.detailed_instructions.cooking_steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-white/90 p-2.5 rounded-xl border border-amber-100/60 text-xs">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          {idx + 1}
                        </span>
                        <span className="text-slate-800 font-medium leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Lunchbox Tips */}
              {recipe.detailed_instructions.lunchbox_tips && recipe.detailed_instructions.lunchbox_tips.length > 0 && (
                <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5 uppercase tracking-wide">
                      <Box className="w-3.5 h-3.5 text-blue-600" />
                      3. Brotdosen- & Frische-Tipps (Meal-Prep)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900">
                      {recipe.detailed_instructions.lunchbox_tips.length} {recipe.detailed_instructions.lunchbox_tips.length === 1 ? 'Tipp' : 'Tipps'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {recipe.detailed_instructions.lunchbox_tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-white/90 p-2.5 rounded-xl border border-blue-100/60 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-slate-800 font-medium leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-emerald-600" />
                Zubereitung
              </h3>
              <div className="space-y-2">
                {(recipe.instructions || []).map((inst, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 font-medium leading-relaxed">{inst}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Cook & Deduct Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition"
          >
            Schließen
          </button>

          <button
            onClick={handleCook}
            disabled={isCooked}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition active:scale-95 ${
              isCooked
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isCooked ? 'Bereits gekocht & aus Lager abgebucht' : '✅ Mahlzeit zubereitet & aus Lager abbuchen'}
          </button>
        </div>
      </div>
    </div>
  );
};

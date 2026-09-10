/**
 * FitPlaner Diet, Allergy, and Food Dislike Validation Engine
 * Ported & enhanced from Python diet_validator.py.
 * Single source of truth for all 14 official EU allergens,
 * diet constraints, and German food dislike stems and synonyms.
 */

import { Recipe, FamilyMember } from '../types';

export const PLANT_DAIRY_EXCLUSIONS = [
  'hafermilch', 'mandelmilch', 'sojamilch', 'kokosmilch',
  'reismilch', 'erbsenmilch', 'dinkelmilch', 'cashewmilch',
  'haferdrink', 'mandeldrink', 'sojadrink', 'kokosdrink',
  'reisdrink', 'erbsendrink', 'dinkeldrink',
  'kokosjoghurt', 'sojajoghurt', 'haferjoghurt', 'mandeljoghurt',
  'erdnussmus', 'erdnussbutter', 'mandelbutter', 'cashewmus', 'mandelmus',
  'vegan', 'pflanzlich', 'hafer cuisine', 'soja cuisine', 'kokos cuisine'
];

export const DAIRY_KEYWORDS = [
  'quark', 'käse', 'kaese', 'feta', 'joghurt', 'butter', 'mozzarella', 'hüttenkäse',
  'huettenkaese', 'sahne', 'parmesan', 'skyr', 'schmand', 'creme fraiche', 'crème fraîche',
  'mascarpone', 'ricotta', 'gouda', 'cheddar', 'frischkäse', 'frischkaese', 'molke'
];

export const MEAT_KEYWORDS = [
  'fleisch', 'hähnchen', 'haehnchen', 'huhn', 'hühn', 'huehn', 'geflügel', 'gefluegel',
  'pute', 'putenbrust', 'rind', 'rinderhack', 'rindersteak', 'schwein', 'schweinefleisch',
  'hackfleisch', 'salami', 'schinken', 'speck', 'wurst', 'würstchen', 'wuerstchen',
  'kalb', 'lamm', 'ente', 'gans', 'bacon', 'prosciutto', 'chorizo', 'meat'
];

export const SEAFOOD_KEYWORDS = [
  'fisch', 'lachs', 'thunfisch', 'forelle', 'forellenfilet', 'kabeljau', 'kabeljaufilet',
  'garnele', 'garnelen', 'seelachs', 'dorade', 'shrimp', 'shrimps', 'scampi', 'meeresfrüchte',
  'meeresfruechte', 'sardine', 'sardinen', 'hering', 'makrele', 'tintenfisch', 'calamari',
  'muschel', 'muscheln', 'krabbe', 'krabben', 'hummer', 'seafood'
];

export const ALLERGEN_KEYWORD_MAP: Record<string, string[]> = {
  laktose: [
    'milch', 'quark', 'käse', 'kaese', 'feta', 'joghurt', 'butter',
    'mozzarella', 'hüttenkäse', 'huettenkaese', 'sahne', 'parmesan',
    'skyr', 'schmand', 'creme fraiche', 'crème fraîche', 'mascarpone',
    'ricotta', 'gouda', 'cheddar', 'frischkäse', 'frischkaese', 'molke'
  ],
  gluten: [
    'gluten', 'weizen', 'dinkel', 'dinkelflocken', 'roggen', 'gerste', 'hafer',
    'haferflocken', 'nudeln', 'spaghetti', 'penne', 'pasta', 'brot', 'toast',
    'baguette', 'brötchen', 'broetchen', 'mehl', 'couscous', 'bulgur', 'seitan',
    'knäckebrot', 'knaeckebrot', 'wrap', 'wraps', 'panade', 'grieß', 'griess'
  ],
  nuesse: [
    'nuss', 'nüsse', 'nuesse', 'walnuss', 'walnüsse', 'walnuesse', 'haselnuss', 'haselnüsse', 'haselnuesse',
    'cashew', 'cashewkerne', 'mandel', 'mandeln', 'pistazie', 'pistazien',
    'pekannuss', 'paranuss', 'macadamia'
  ],
  erdnuesse: [
    'erdnuss', 'erdnüsse', 'erdnuesse', 'erdnussmus', 'erdnussbutter', 'peanut'
  ],
  fisch: [
    'fisch', 'lachs', 'lachsfilet', 'thunfisch', 'kabeljau', 'forelle', 'forellenfilet',
    'seelachs', 'dorade', 'sardine', 'sardinen', 'hering', 'makrele', 'scholle'
  ],
  krebstiere: [
    'garnele', 'garnelen', 'shrimp', 'shrimps', 'scampi', 'krabbe', 'krabben', 'hummer', 'krebstier', 'krustentier'
  ],
  weichtiere: [
    'muschel', 'muscheln', 'tintenfisch', 'calamari', 'oktopus', 'weichtier', 'meeresfrüchte', 'meeresfruechte'
  ],
  eier: [
    'ei', 'eier', 'hühnerei', 'huehnerei', 'rührei', 'ruehrei', 'spiegelei',
    'eigelb', 'eiweiß', 'eiweiss', 'omelett'
  ],
  soja: [
    'soja', 'sojasoße', 'sojasosse', 'sojasauce', 'tofu', 'naturtofu',
    'räuchertofu', 'raeuchertofu', 'edamame', 'tempeh', 'miso'
  ],
  sesam: [
    'sesam', 'sesamöl', 'sesamoel', 'sesamsaat', 'sesamsamen', 'tahin', 'tahina', 'tahini'
  ],
  sellerie: [
    'sellerie', 'staudensellerie', 'knollensellerie', 'suppengrün', 'suppengruen'
  ],
  senf: [
    'senf', 'senfkörner', 'dijonsenf', 'körnersenf'
  ],
  lupinen: [
    'lupine', 'lupinen', 'lupinenmehl'
  ],
  sulfite: [
    'sulfit', 'sulfite', 'schwefeldioxid'
  ],
};

export const ALLERGEN_NORMALIZATION: Record<string, string> = {
  laktose: 'laktose',
  lactose: 'laktose',
  milch: 'laktose',
  milchprodukte: 'laktose',
  gluten: 'gluten',
  weizen: 'gluten',
  getreide: 'gluten',
  nuesse: 'nuesse',
  nüsse: 'nuesse',
  nuts: 'nuesse',
  schalenfrüchte: 'nuesse',
  schalenfruechte: 'nuesse',
  erdnuss: 'erdnuesse',
  erdnüsse: 'erdnuesse',
  erdnuesse: 'erdnuesse',
  fisch: 'fisch',
  fish: 'fisch',
  meeresfrüchte: 'fisch',
  meeresfruechte: 'fisch',
  krebstiere: 'krebstiere',
  weichtiere: 'weichtiere',
  eier: 'eier',
  ei: 'eier',
  egg: 'eier',
  eggs: 'eier',
  soja: 'soja',
  soy: 'soja',
  sesam: 'sesam',
  sesame: 'sesam',
  sellerie: 'sellerie',
  senf: 'senf',
  lupinen: 'lupinen',
  sulfite: 'sulfite',
};

export const DISLIKE_SYNONYMS: Record<string, string[]> = {
  // Fish & Seafood
  fisch: ['fisch', 'lachs', 'räucherlachs', 'thunfisch', 'forelle', 'forellenfilet', 'kabeljau', 'kabeljaufilet', 'seelachs', 'dorade', 'garnele', 'garnelen', 'shrimp', 'shrimps', 'scampi', 'meeresfrüchte', 'meeresfruechte'],
  lachs: ['lachs', 'lachsfilet', 'räucherlachs', 'raeucherlachs', 'salmon'],
  räucherlachs: ['räucherlachs', 'raeucherlachs', 'lachs'],
  thunfisch: ['thunfisch', 'tuna'],
  forelle: ['forelle', 'forellenfilet'],
  kabeljau: ['kabeljau', 'kabeljaufilet'],
  garnele: ['garnele', 'garnelen', 'shrimp', 'shrimps', 'scampi', 'meeresfrüchte'],
  garnelen: ['garnele', 'garnelen', 'shrimp', 'shrimps', 'scampi', 'meeresfrüchte'],
  meeresfrüchte: ['garnele', 'garnelen', 'shrimp', 'shrimps', 'scampi', 'muschel', 'tintenfisch', 'calamari', 'meeresfrüchte', 'meeresfruechte'],

  // Meat & Poultry
  fleisch: ['fleisch', 'hähnchen', 'haehnchen', 'huhn', 'hühn', 'pute', 'putenbrust', 'rind', 'rinderhack', 'rindersteak', 'schwein', 'hackfleisch', 'salami', 'schinken', 'speck', 'wurst'],
  geflügel: ['hähnchen', 'haehnchen', 'huhn', 'hühn', 'pute', 'putenbrust', 'geflügel', 'gefluegel'],
  gefluegel: ['hähnchen', 'haehnchen', 'huhn', 'hühn', 'pute', 'putenbrust', 'geflügel', 'gefluegel'],
  hähnchen: ['hähnchen', 'haehnchen', 'huhn', 'hühn', 'huehn', 'geflügel', 'gefluegel'],
  haehnchen: ['hähnchen', 'haehnchen', 'huhn', 'hühn', 'huehn', 'geflügel', 'gefluegel'],
  huhn: ['hähnchen', 'haehnchen', 'huhn', 'hühn', 'huehn', 'geflügel', 'gefluegel'],
  pute: ['pute', 'putenbrust', 'geflügel', 'gefluegel'],
  putenbrust: ['pute', 'putenbrust'],
  rind: ['rind', 'rinderhack', 'rindersteak', 'rindfleisch', 'hackfleisch'],
  rindfleisch: ['rind', 'rinderhack', 'rindersteak', 'rindfleisch', 'hackfleisch'],
  rinderhack: ['rinderhack', 'hackfleisch', 'rind'],
  hackfleisch: ['hackfleisch', 'rinderhack', 'rind'],
  schwein: ['schwein', 'schweinefleisch', 'salami', 'schinken', 'speck', 'wurst'],
  schweinefleisch: ['schwein', 'schweinefleisch', 'salami', 'schinken', 'speck', 'wurst'],
  wurst: ['wurst', 'salami', 'schinken', 'speck', 'würstchen', 'wuerstchen'],

  // Vegetables & Fungi
  pilz: ['pilz', 'champignon', 'pfifferling', 'steinpilz', 'seitling', 'shiitake', 'austernpilz', 'trüffel'],
  pilze: ['pilz', 'champignon', 'pfifferling', 'steinpilz', 'seitling', 'shiitake', 'austernpilz', 'trüffel'],
  champignon: ['champignon', 'pilz'],
  champignons: ['champignon', 'pilz'],
  zwiebel: ['zwiebel', 'schalotte', 'lauch', 'frühlingszwiebel'],
  zwiebeln: ['zwiebel', 'schalotte', 'lauch', 'frühlingszwiebel'],
  lauch: ['lauch', 'porree', 'frühlingszwiebel'],
  knoblauch: ['knoblauch'],
  tomate: ['tomat'],
  tomaten: ['tomat'],
  paprika: ['paprika'],
  brokkoli: ['brokkoli', 'broccoli'],
  broccoli: ['brokkoli', 'broccoli'],
  aubergine: ['aubergine'],
  auberginen: ['aubergine'],
  zucchini: ['zucchini'],
  spinat: ['spinat', 'babyspinat'],
  babyspinat: ['spinat', 'babyspinat'],
  koriander: ['koriander'],
  sellerie: ['sellerie'],
  rosenkohl: ['rosenkohl'],
  ingwer: ['ingwer'],
  olive: ['oliv'],
  oliven: ['oliv'],
  möhre: ['karotte', 'karotten', 'möhre', 'moehre', 'möhren', 'moehren'],
  karotte: ['karotte', 'karotten', 'möhre', 'moehre', 'möhren', 'moehren'],
  gurke: ['gurke', 'gurken'],
  spargel: ['spargel'],

  // Dairy & Cheese
  käse: ['käse', 'kaese', 'feta', 'gouda', 'mozzarella', 'parmesan', 'frischkäse', 'hüttenkäse', 'cheddar', 'ricotta'],
  kaese: ['käse', 'kaese', 'feta', 'gouda', 'mozzarella', 'parmesan', 'frischkäse', 'hüttenkäse', 'cheddar', 'ricotta'],
  feta: ['feta', 'schafskäse', 'schafskaese'],
  schafskäse: ['feta', 'schafskäse', 'schafskaese'],
};

export function isDairyIngredient(ingName: string): boolean {
  const ingL = ingName.toLowerCase().trim();
  if (PLANT_DAIRY_EXCLUSIONS.some((ex) => ingL.includes(ex))) {
    return false;
  }
  if (DAIRY_KEYWORDS.some((kw) => ingL.includes(kw))) {
    return true;
  }
  return /\b(milch|kuhmilch|vollmilch|magermilch)\b/i.test(ingL);
}

export function isEggIngredient(ingName: string): boolean {
  const ingL = ingName.toLowerCase().trim();
  if (['vegan', 'pflanzlich', 'ei-ersatz'].some((ex) => ingL.includes(ex))) {
    return false;
  }
  return /\b(ei|eier|eiern|eies|hühnerei|hühnereier|huehnerei|rührei|ruehrei|spiegelei|eigelb|eiweiß|eiweiss|omelett)\b/i.test(ingL);
}

export function isMeatIngredient(ingName: string): boolean {
  const ingL = ingName.toLowerCase().trim();
  if (['vegan', 'vegetarisch', 'pflanzlich', 'vegetarische', 'vegane'].some((ex) => ingL.includes(ex))) {
    return false;
  }
  return MEAT_KEYWORDS.some((kw) => ingL.includes(kw));
}

export function isSeafoodIngredient(ingName: string): boolean {
  const ingL = ingName.toLowerCase().trim();
  if (['vegan', 'vegetarisch', 'pflanzlich'].some((ex) => ingL.includes(ex))) {
    return false;
  }
  return SEAFOOD_KEYWORDS.some((kw) => ingL.includes(kw));
}

export function isPorkIngredient(ingName: string): boolean {
  const ingL = ingName.toLowerCase().trim();
  if (['vegan', 'vegetarisch', 'pflanzlich', 'rind', 'geflügel', 'pute', 'hähnchen'].some((ex) => ingL.includes(ex))) {
    return false;
  }
  return ['schwein', 'salami', 'schinken', 'speck', 'pork'].some((w) => ingL.includes(w));
}

export function isRecipeDietCompatible(recipe: Recipe, diet?: string): boolean {
  if (!diet || diet === 'all') return true;
  const titleL = recipe.title.toLowerCase();

  if (diet === 'vegetarian') {
    if (!recipe.diet_types?.includes('vegetarian') && !recipe.diet_types?.includes('vegan')) {
      return false;
    }
    if ((recipe.ingredients || []).some((ing) => isMeatIngredient(ing.name) || isSeafoodIngredient(ing.name))) {
      return false;
    }
    if ([...MEAT_KEYWORDS, ...SEAFOOD_KEYWORDS].some((kw) => titleL.includes(kw))) {
      return false;
    }
    return true;
  }

  if (diet === 'vegan') {
    if (!recipe.diet_types?.includes('vegan')) return false;
    for (const ing of recipe.ingredients || []) {
      if (isMeatIngredient(ing.name) || isSeafoodIngredient(ing.name) || isDairyIngredient(ing.name) || isEggIngredient(ing.name)) {
        return false;
      }
    }
    return true;
  }

  if (diet === 'pescetarian') {
    if (!recipe.diet_types?.some((d) => ['pescetarian', 'vegetarian', 'vegan'].includes(d))) {
      return false;
    }
    if ((recipe.ingredients || []).some((ing) => isMeatIngredient(ing.name))) {
      return false;
    }
    return true;
  }

  if (diet === 'no_pork') {
    if ((recipe.ingredients || []).some((ing) => isPorkIngredient(ing.name))) {
      return false;
    }
    return true;
  }

  return true;
}

export function recipeViolatesAllergies(recipe: Recipe, allergies?: string[]): boolean {
  if (!allergies || allergies.length === 0) return false;

  const normalized = new Set<string>();
  allergies.forEach((a) => {
    const raw = a.toLowerCase().trim();
    if (raw) {
      normalized.add(ALLERGEN_NORMALIZATION[raw] || raw);
    }
  });

  // 1. Check recipe declared allergens
  for (const declared of recipe.allergens || []) {
    const dNorm = ALLERGEN_NORMALIZATION[declared.toLowerCase().trim()] || declared.toLowerCase().trim();
    if (normalized.has(dNorm)) {
      return true;
    }
  }

  // 2. Check ingredients against ALLERGEN_KEYWORD_MAP & detectors
  for (const ing of recipe.ingredients || []) {
    const ingL = ing.name.toLowerCase();
    for (const allergenKey of normalized) {
      if (allergenKey === 'laktose') {
        if (isDairyIngredient(ing.name)) return true;
      } else if (allergenKey === 'eier') {
        if (isEggIngredient(ing.name)) return true;
      } else if (allergenKey === 'fisch') {
        if (isSeafoodIngredient(ing.name)) return true;
      } else {
        const keywords = ALLERGEN_KEYWORD_MAP[allergenKey] || [allergenKey];
        if (keywords.some((kw) => ingL.includes(kw))) {
          return true;
        }
      }
    }
  }

  return false;
}

export function recipeViolatesDislikes(recipe: Recipe, dislikedFoods?: string[]): boolean {
  if (!dislikedFoods || dislikedFoods.length === 0) return false;

  const titleL = recipe.title.toLowerCase();
  const ingNamesL = (recipe.ingredients || []).map((i) => i.name.toLowerCase());

  for (const d of dislikedFoods) {
    const dClean = d.toLowerCase().trim();
    if (!dClean) continue;

    const searchTerms = new Set<string>([dClean]);
    if (DISLIKE_SYNONYMS[dClean]) {
      DISLIKE_SYNONYMS[dClean].forEach((s) => searchTerms.add(s));
    }

    // Stemming: remove trailing en, e, s
    for (const suffix of ['en', 'e', 's']) {
      if (dClean.endsWith(suffix) && dClean.length > suffix.length + 2) {
        const stem = dClean.slice(0, -suffix.length);
        searchTerms.add(stem);
        if (DISLIKE_SYNONYMS[stem]) {
          DISLIKE_SYNONYMS[stem].forEach((s) => searchTerms.add(s));
        }
      }
    }

    for (const term of searchTerms) {
      if (term.length <= 3) {
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        if (regex.test(titleL)) return true;
        if (ingNamesL.some((ing) => regex.test(ing))) return true;
      } else {
        if (titleL.includes(term)) return true;
        if (ingNamesL.some((ing) => ing.includes(term))) return true;
      }
    }
  }

  return false;
}

export function isRecipeSafeForMember(recipe: Recipe, member: FamilyMember): boolean {
  if (!isRecipeDietCompatible(recipe, member.dietary_preference)) {
    return false;
  }
  if (recipeViolatesAllergies(recipe, member.allergies)) {
    return false;
  }
  if (recipeViolatesDislikes(recipe, member.disliked_foods)) {
    return false;
  }
  return true;
}

export function isRecipeSafeForFamily(recipe: Recipe, members: FamilyMember[]): boolean {
  if (!members || members.length === 0) return true;
  return members.every((m) => isRecipeSafeForMember(recipe, m));
}

export function getRecipeMemberConflicts(recipe: Recipe, member: FamilyMember): string[] {
  const conflicts: string[] = [];

  if (!isRecipeDietCompatible(recipe, member.dietary_preference)) {
    conflicts.push(`Ernährung: Nicht passend zu ${member.dietary_preference}`);
  }

  if (member.allergies && member.allergies.length > 0) {
    const violatingAllergies: string[] = [];
    member.allergies.forEach((a) => {
      if (recipeViolatesAllergies(recipe, [a])) {
        violatingAllergies.push(a);
      }
    });
    if (violatingAllergies.length > 0) {
      conflicts.push(`Allergie: ${violatingAllergies.join(', ')}`);
    }
  }

  if (member.disliked_foods && member.disliked_foods.length > 0) {
    const violatingDislikes: string[] = [];
    member.disliked_foods.forEach((d) => {
      if (recipeViolatesDislikes(recipe, [d])) {
        violatingDislikes.push(d);
      }
    });
    if (violatingDislikes.length > 0) {
      conflicts.push(`Abneigung: ${violatingDislikes.join(', ')}`);
    }
  }

  return conflicts;
}

export function getRecipeFamilyConflicts(recipe: Recipe, members: FamilyMember[]): { memberName: string; reasons: string[] }[] {
  const familyConflicts: { memberName: string; reasons: string[] }[] = [];
  for (const m of members) {
    const reasons = getRecipeMemberConflicts(recipe, m);
    if (reasons.length > 0) {
      familyConflicts.push({ memberName: m.name, reasons });
    }
  }
  return familyConflicts;
}

export interface AllergenCatalogEntry {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const EU_ALLERGENS_CATALOG: AllergenCatalogEntry[] = [
  { id: 'gluten', name: 'Glutenhaltiges Getreide', icon: '🌾', description: 'Weizen, Roggen, Gerste, Hafer, Dinkel' },
  { id: 'krebstiere', name: 'Krebstiere', icon: '🦐', description: 'Garnelen, Krebse, Shrimps, Scampi, Hummer' },
  { id: 'eier', name: 'Eier', icon: '🥚', description: 'Hühnereier, Eigelb, Eiprodukte' },
  { id: 'fisch', name: 'Fisch', icon: '🐟', description: 'Lachs, Thunfisch, Forelle, Kabeljau, Fischöle' },
  { id: 'erdnuesse', name: 'Erdnüsse', icon: '🥜', description: 'Erdnüsse, Erdnussbutter, Erdnussöl' },
  { id: 'soja', name: 'Soja', icon: '🌱', description: 'Sojabohnen, Tofu, Sojasauce, Sojamilch' },
  { id: 'laktose', name: 'Milch & Laktose', icon: '🥛', description: 'Kuhmilch, Quark, Käse, Joghurt, Sahne' },
  { id: 'nuesse', name: 'Schalenfrüchte (Nüsse)', icon: '🌰', description: 'Mandeln, Haselnüsse, Walnüsse, Cashews' },
  { id: 'sellerie', name: 'Sellerie', icon: '🥬', description: 'Knollensellerie, Staudensellerie, Suppengrün' },
  { id: 'senf', name: 'Senf', icon: '🌭', description: 'Senfkörner, Tafelsenf, Dijon-Senf' },
  { id: 'sesam', name: 'Sesamsamen', icon: '🥯', description: 'Sesamkörner, Tahini, Sesamöl' },
  { id: 'sulfite', name: 'Schwefeldioxid / Sulfite', icon: '🍷', description: 'Geschwefelte Trockenfrüchte, Weinessig' },
  { id: 'lupinen', name: 'Lupinen', icon: '🌾', description: 'Lupinenmehl, pflanzliche Fleischersatzprodukte' },
  { id: 'weichtiere', name: 'Weichtiere', icon: '🐙', description: 'Muscheln, Tintenfisch, Tintenfischringe, Schnecken' },
];

export interface DislikeCategory {
  title: string;
  icon: string;
  items: string[];
}

export const DISLIKE_CATEGORIES: DislikeCategory[] = [
  {
    title: 'Fisch & Meeresfrüchte',
    icon: '🐟',
    items: ['Lachs', 'Thunfisch', 'Garnelen', 'Kabeljau', 'Forelle', 'Meeresfrüchte', 'Hering', 'Sardinen'],
  },
  {
    title: 'Fleisch & Wurst',
    icon: '🥩',
    items: ['Schweinefleisch', 'Rindfleisch', 'Hähnchen', 'Hackfleisch', 'Speck', 'Salami', 'Lamm', 'Pute'],
  },
  {
    title: 'Gemüse & Pilze',
    icon: '🥦',
    items: ['Brokkoli', 'Champignons', 'Zucchini', 'Tomaten', 'Auberginen', 'Zwiebeln', 'Knoblauch', 'Spinat', 'Rosenkohl', 'Spargel', 'Oliven', 'Paprika', 'Sellerie'],
  },
  {
    title: 'Milchprodukte & Käse',
    icon: '🧀',
    items: ['Feta', 'Ziegenkäse', 'Blauschimmelkäse', 'Parmesan', 'Gorgonzola', 'Hüttenkäse', 'Quark', 'Käse allgemein'],
  },
  {
    title: 'Gewürze & Besonderes',
    icon: '🌿',
    items: ['Koriander', 'Ingwer', 'Chili / Scharf', 'Rosinen', 'Kapern', 'Senf', 'Kümmel', 'Zimt'],
  },
];


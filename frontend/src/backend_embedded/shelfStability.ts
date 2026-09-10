/**
 * Shelf Stability Checker for Embedded Backend.
 * Strictly separates durable dry goods (pantry-eligible: oats, rice, pasta, lentils, seeds, nuts, spices, oils, canned goods)
 * from fresh perishable goods (meat, fish, berries, fresh vegetables, fresh dairy, eggs)
 * which must NEVER migrate to the pantry as leftover surplus.
 * 
 * Direct 1:1 parity with backend/pantry/shelf_stability.py
 */

export const DURABLE_DRY_KEYWORDS = [
  // Grains & Cereals
  'haferflocken', 'dinkelflocken', 'quinoa', 'reis', 'naturreis', 'basmati',
  'jasminreis', 'nudel', 'nudeln', 'vollkornnudeln', 'spaghetti', 'penne', 'fusilli',
  'rigatoni', 'farfalle', 'tagliatelle', 'linguine', 'lasagne', 'couscous', 'bulgur',
  'mehl', 'vollkornmehl', 'weizenmehl', 'dinkelmehl', 'grieß', 'polenta', 'hirse',

  // Nuts, Seeds & Kernels
  'walnuss', 'walnüsse', 'mandel', 'mandeln', 'kürbiskern', 'kürbiskerne',
  'sonnenblumenkern', 'sonnenblumenkerne', 'chiasamen', 'leinsamen', 'cashew',
  'cashewkerne', 'erdnuss', 'erdnüsse', 'haselnuss', 'haselnüsse', 'sesam',
  'pinienkerne', 'erdnussmus', 'mandelmus', 'tahini', 'kerne', 'samen',

  // Shelf-stable Legumes & Canned Staples
  'linsen', 'rote linsen', 'braune linsen', 'berglinsen', 'belugalinsen',
  'kichererbsen', 'kidneybohnen', 'bohnen', 'weiße bohnen',
  'dosentomaten', 'gehackte tomaten', 'passierte tomaten', 'tomatenmark', 'kokosmilch',
  'thunfisch dose',

  // Oils & Vinegars
  'olivenöl', 'rapsöl', 'leinöl', 'kokosöl', 'speiseöl', 'sonnenblumenöl',
  'essig', 'balsamico', 'apfelessig', 'weißweinessig', 'sojasauce', 'sojasoße',

  // Spices & Seasonings & Baking Staples
  'salz', 'meersalz', 'pfeffer', 'paprikapulver', 'zimt', 'kurkuma', 'kreuzkümmel',
  'oregano', 'basilikum getrocknet', 'curry', 'currypulver', 'muskat', 'vanille',
  'trockenhefe', 'backpulver', 'kakao', 'honig', 'ahornsirup', 'senf',

  // Dry Crispbread / Crackers
  'knäckebrot', 'zwieback', 'reiswaffeln', 'reiswaffel',
];

export const PERISHABLE_KEYWORDS = [
  // Meat & Poultry
  'hähnchen', 'hahnchen', 'pute', 'puten', 'rind', 'rinder', 'hack', 'hackfleisch',
  'steak', 'fleisch', 'schwein', 'schweine', 'wurst', 'schinken', 'bacon', 'speck',
  'gulasch', 'schnitzel', 'bratwurst', 'wiener',

  // Fish & Seafood
  'lachs', 'lachsfilet', 'kabeljau', 'kabeljaufilet', 'forelle', 'forellenfilet',
  'thunfisch', 'fisch', 'seelachs', 'dorade', 'zander', 'garnele', 'garnelen',
  'scampi', 'meeresfrüchte', 'krabben',

  // Fresh Produce (Vegetables)
  'brokkoli', 'broccoli', 'zucchini', 'paprika', 'gurke', 'salatgurke', 'tomate',
  'tomaten', 'kirschtomate', 'kirschtomaten', 'strauchtomaten', 'spinat', 'blattspinat',
  'babyspinat', 'salat', 'feldsalat', 'rucola', 'kopfsalat', 'eisbergsalat', 'römersalat',
  'champignon', 'champignons', 'pilze', 'zwiebel', 'zwiebeln', 'frühlingszwiebel',
  'frühlingszwiebeln', 'knoblauch', 'karotte', 'karotten', 'möhre', 'möhren', 'aubergine',
  'auberginen', 'lauch', 'porree', 'spargel', 'zuckerschote', 'zuckerschoten', 'edamame',
  'ingwer', 'kohl', 'blumenkohl', 'weißkohl', 'rotkohl', 'chinakohl', 'kohlrabi', 'sellerie',
  'radieschen', 'fenchel', 'süßkartoffel', 'süßkartoffeln', 'kartoffel', 'kartoffeln',
  'avocado', 'avocados',

  // Fresh Fruit & Berries
  'heidelbeere', 'heidelbeeren', 'blaubeere', 'blaubeeren', 'himbeere', 'himbeeren',
  'erdbeere', 'erdbeeren', 'brombeere', 'brombeeren', 'beere', 'beeren',
  'apfel', 'äpfel', 'banane', 'bananen', 'zitrone', 'zitronen', 'limette', 'limetten',
  'orange', 'orangen', 'mandarine', 'mandarinen', 'birne', 'birnen', 'trauben', 'weintrauben',
  'kiwi', 'mango', 'ananas', 'melone', 'wassermelone', 'pfirsich', 'nektarine', 'pflaume',

  // Fresh Dairy & Refrigerated
  'skyr', 'quark', 'magerquark', 'speisequark', 'frischkäse', 'hüttenkäse', 'körnerkäse',
  'joghurt', 'feta', 'hirtenkäse', 'mozzarella', 'burrata', 'gouda', 'edamer', 'emmentaler',
  'cheddar', 'parmesan', 'reibekäse', 'käse', 'butter', 'margarine', 'milch', 'frischmilch',
  'sahne', 'schlagsahne', 'schmand', 'creme fraiche', 'crème fraîche', 'saure sahne',
  'eier', 'hühnerei', 'bio-ei', 'tofu', 'naturtofu', 'räuchertofu',

  // Perishable Bakery / Fresh Bread
  'vollkornbrot', 'toast', 'frischbrot', 'brötchen',

  // Frozen (freezer, not pantry)
  'tk ', 'tiefkühl',
];

/**
 * Returns true ONLY for durable dry goods and shelf-stable staples.
 * Returns false for all fresh/perishable items (meat, fish, berries, veggies, dairy, eggs, etc.).
 */
export function isShelfStableDryGood(name: string, category?: string): boolean {
  const lower = (name || '').toLowerCase().trim();
  if (!lower) return false;

  // Exception for durable canned staples
  if (['tomatenmark', 'dosentomate', 'gehackte tomate', 'passierte tomate', 'kokosmilch', 'thunfisch dose'].some((c) => lower.includes(c))) {
    return true;
  }

  // Exact word check for eggs
  if (lower === 'ei' || lower === 'eier' || lower.startsWith('ei ') || lower.endsWith(' ei') || lower.includes(' eier')) {
    return false;
  }

  // Check durable dry goods first
  for (const kw of DURABLE_DRY_KEYWORDS) {
    if (lower.includes(kw)) {
      return true;
    }
  }

  // Perishable check
  for (const kw of PERISHABLE_KEYWORDS) {
    if (lower.includes(kw)) {
      return false;
    }
  }

  // Category check if provided
  if (category) {
    const catLower = category.toLowerCase();
    if (['fleisch', 'fisch', 'obst', 'gemüse', 'kühlregal', 'tiefkühl', 'frische', 'molkerei'].some((bad) => catLower.includes(bad))) {
      return false;
    }
    if (['trocken', 'nüsse', 'gewürz', 'öl', 'basic', 'vorrat'].some((good) => catLower.includes(good))) {
      return true;
    }
  }

  return false;
}

/**
 * Supermarket aisle classification matching backend walkway order.
 */
export function getAisleForIngredient(name: string): string {
  const lower = (name || '').toLowerCase().trim();

  if (['apfel', 'äpfel', 'heidelbeere', 'beere', 'himbeere', 'erdbeere', 'gurke', 'paprika', 'brokkoli', 'süßkartoffel', 'spinat', 'avocado', 'tomate', 'zucchini', 'karotte', 'kartoffel', 'zwiebel', 'knoblauch', 'zitrone', 'ingwer', 'banane', 'salat'].some((w) => lower.includes(w))) {
    return '1. Obst- & Gemüse-Insel';
  }
  if (['lachs', 'thunfisch', 'hähnchen', 'pute', 'hack', 'rind', 'steak', 'kabeljau', 'forelle', 'garnele', 'wurst', 'schinken'].some((w) => lower.includes(w))) {
    return '3. Fleisch & Frischer Fisch';
  }
  if (['ei', 'quark', 'skyr', 'frischkäse', 'feta', 'käse', 'milch', 'mozzarella', 'gouda', 'tofu', 'butter', 'sahne', 'joghurt'].some((w) => lower.includes(w))) {
    return '2. Kühlregal & Molkerei';
  }
  if (['haferflocken', 'dinkel', 'quinoa', 'knäckebrot', 'brot', 'wrap', 'linsen', 'kichererbsen', 'bohnen', 'reis', 'nudeln', 'spaghetti', 'penne', 'couscous', 'bulgur', 'mehl', 'chiasamen', 'walnuss', 'mandel', 'müsli'].some((w) => lower.includes(w))) {
    return '4. Trockensortiment & Vorräte';
  }
  if (['shampoo', 'duschgel', 'seife', 'zahnpasta', 'zahnbürste', 'deo', 'deodorant', 'creme', 'lotion', 'rasier', 'tampon', 'binde', 'slipeinlage', 'windel', 'feuchttuch', 'feuchttücher', 'lippenpflege', 'sonnencreme', 'badesalz', 'parfum', 'haarspray', 'wattestäbchen', 'kosmetik'].some((w) => lower.includes(w))) {
    return '6. Drogerie & Körperpflege';
  }
  if (['spülmittel', 'waschmittel', 'allzweckreiniger', 'müllbeutel', 'küchenrolle', 'klopapier', 'toilettenpapier', 'reiniger', 'schwamm', 'alufolie', 'backpapier', 'geschirrspültabs', 'tabs', 'weichspüler', 'putztuch', 'entkalker', 'scheuermilch'].some((w) => lower.includes(w))) {
    return '7. Haushalt & Reinigung';
  }
  if (['vitamin', 'magnesium', 'zink', 'omega', 'pflaster', 'schmerzmittel', 'paracetamol', 'ibuprofen', 'salbe', 'hustensaft', 'nasenspray', 'elektrolyte', 'nahrungsergänzung', 'bandage', 'desinfektion'].some((w) => lower.includes(w))) {
    return '8. Gesundheit & Apotheke';
  }
  if (['katzenfutter', 'hundefutter', 'katzenstreu', 'nassfutter', 'trockenfutter', 'tiernahrung', 'leckerli', 'batterie', 'batterien', 'glühbirne', 'kerze', 'anzünder', 'kohle'].some((w) => lower.includes(w))) {
    return '9. Tierbedarf & Non-Food';
  }
  return '5. Basics & Gewürze';
}

/**
 * Fuzzy finder for pantry items by name
 */
export function findPantryMatch<T extends { name: string }>(name: string, items: T[]): T | undefined {
  const lower = (name || '').toLowerCase().trim();
  if (!lower) return undefined;
  return items.find((it) => {
    const itLower = (it.name || '').toLowerCase().trim();
    return itLower === lower || itLower.includes(lower) || lower.includes(itLower);
  });
}

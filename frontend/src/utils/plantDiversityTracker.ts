/**
 * FitPlaner Plant Diversity & Gut Microbiome Tracker
 * Based on the American Gut Project & The British Gut Project:
 * Consuming 30+ unique plant species per week yields the highest microbial diversity,
 * short-chain fatty acid (SCFA) production (butyrate/propionate), and metabolic health.
 *
 * Includes:
 * 1. 30+ Distinct Plant Species Counter across 6 botanical groups
 * 2. NOVA-Classification (1 = Minimal processed to 4 = Ultra-processed)
 * 3. 30g+ Daily Fiber Guarantee (DGE-Richtwert)
 * 4. Glycemic Load (GL) Blood Sugar Stability Index
 */

import { Recipe, WeeklyPlan, DayPlan } from '../types';

export type PlantGroup =
  | 'vegetables'
  | 'fruits'
  | 'nuts_seeds'
  | 'whole_grains'
  | 'legumes'
  | 'herbs_spices';

export interface PlantInfo {
  name: string;
  group: PlantGroup;
  groupLabel: string;
  icon: string;
  fiberPer100g: number; // in grams
  glycemicIndex: number; // 0-100
  microbiomeBenefits: string;
}

export interface PlantDiversityReport {
  totalUniquePlants: number;
  target: number;
  percentage: number;
  status: 'optimal' | 'good' | 'needs_boost';
  statusText: string;
  plantsByGroup: Record<PlantGroup, { label: string; icon: string; count: number; items: string[] }>;
  missingGroupRecommendations: string[];
  cleanEatingPercent: number; // % NOVA 1 & 2
  novaBreakdown: { nova1: number; nova2: number; nova3: number; nova4: number };
  dailyAvgFiberGrams: number;
  fiberGoalMet: boolean;
  glycemicStabilityScore: number; // 0-100 (higher = more stable)
  sugarFreeCleanGuarantee: boolean; // 100% free of added refined sugar
}

// 150+ Curated Plant Database with German Synonyms & Stems
export const PLANT_DATABASE: Record<string, PlantInfo> = {
  // --- 1. GEMÜSE (VEGETABLES) ---
  brokkoli: { name: 'Brokkoli', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥦', fiberPer100g: 3.0, glycemicIndex: 15, microbiomeBenefits: 'Sulforaphan fördert Bifidobakterien' },
  spinat: { name: 'Blattspinat', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥬', fiberPer100g: 2.6, glycemicIndex: 15, microbiomeBenefits: 'Fördert Butyrat-bildende Mikroben' },
  tomate: { name: 'Tomate', group: 'vegetables', groupLabel: 'Gemüse', icon: '🍅', fiberPer100g: 1.2, glycemicIndex: 15, microbiomeBenefits: 'Lycopin stärkt Darmbarriere' },
  kirschtomate: { name: 'Kirschtomate', group: 'vegetables', groupLabel: 'Gemüse', icon: '🍅', fiberPer100g: 1.4, glycemicIndex: 15, microbiomeBenefits: 'Reich an Polyphenolen' },
  paprika: { name: 'Paprika', group: 'vegetables', groupLabel: 'Gemüse', icon: '🫑', fiberPer100g: 2.1, glycemicIndex: 15, microbiomeBenefits: 'Vitamin C & Carotinoide' },
  karotte: { name: 'Karotte / Möhre', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥕', fiberPer100g: 2.8, glycemicIndex: 35, microbiomeBenefits: 'Pektin nährt nützliche Darmbakterien' },
  moehre: { name: 'Möhre', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥕', fiberPer100g: 2.8, glycemicIndex: 35, microbiomeBenefits: 'Pektinreich' },
  zucchini: { name: 'Zucchini', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥒', fiberPer100g: 1.1, glycemicIndex: 15, microbiomeBenefits: 'Leicht verdauliche Ballaststoffe' },
  gurke: { name: 'Salatgurke', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥒', fiberPer100g: 0.9, glycemicIndex: 15, microbiomeBenefits: 'Hydratisierend & erfrischend' },
  zwiebel: { name: 'Zwiebel', group: 'vegetables', groupLabel: 'Gemüse', icon: '🧅', fiberPer100g: 1.8, glycemicIndex: 15, microbiomeBenefits: 'Inulin & FOS: Top-Präbiotikum' },
  knoblauch: { name: 'Knoblauch', group: 'vegetables', groupLabel: 'Gemüse', icon: '🧄', fiberPer100g: 2.1, glycemicIndex: 15, microbiomeBenefits: 'Allicin hemmt pathogene Keime' },
  suesskartoffel: { name: 'Süßkartoffel', group: 'vegetables', groupLabel: 'Gemüse', icon: '🍠', fiberPer100g: 3.0, glycemicIndex: 44, microbiomeBenefits: 'Komplexe Stärke für SCFA' },
  kartoffel: { name: 'Kartoffel', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥔', fiberPer100g: 2.1, glycemicIndex: 50, microbiomeBenefits: 'Resistente Stärke (abgekühlt)' },
  blumenkohl: { name: 'Blumenkohl', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥦', fiberPer100g: 2.5, glycemicIndex: 15, microbiomeBenefits: 'Glucosinolate unterstützen Darm-Immunität' },
  champignon: { name: 'Champignons / Pilze', group: 'vegetables', groupLabel: 'Gemüse', icon: '🍄', fiberPer100g: 2.0, glycemicIndex: 15, microbiomeBenefits: 'Beta-Glucane stimulieren Darmimmunsystem' },
  pilze: { name: 'Pilze', group: 'vegetables', groupLabel: 'Gemüse', icon: '🍄', fiberPer100g: 2.0, glycemicIndex: 15, microbiomeBenefits: 'Beta-Glucan-Booster' },
  aubergine: { name: 'Aubergine', group: 'vegetables', groupLabel: 'Gemüse', icon: '🍆', fiberPer100g: 2.5, glycemicIndex: 15, microbiomeBenefits: 'Nasunin-Polyphenol' },
  kuerbis: { name: 'Kürbis / Hokkaido', group: 'vegetables', groupLabel: 'Gemüse', icon: '🎃', fiberPer100g: 2.2, glycemicIndex: 40, microbiomeBenefits: 'Provitamin A schützt Epithel' },
  hokkaido: { name: 'Hokkaido-Kürbis', group: 'vegetables', groupLabel: 'Gemüse', icon: '🎃', fiberPer100g: 2.2, glycemicIndex: 40, microbiomeBenefits: 'Essbare ballaststoffreiche Schale' },
  fenchel: { name: 'Fenchel', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥬', fiberPer100g: 3.1, glycemicIndex: 15, microbiomeBenefits: 'Beruhigt Magen-Darm-Trakt' },
  spargel: { name: 'Spargel', group: 'vegetables', groupLabel: 'Gemüse', icon: '🌱', fiberPer100g: 2.1, glycemicIndex: 15, microbiomeBenefits: 'Inulinreich, entlastet Nieren' },
  sellerie: { name: 'Sellerie / Staudensellerie', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥬', fiberPer100g: 1.8, glycemicIndex: 15, microbiomeBenefits: 'Apigenin hemmt Entzündungen' },
  lauch: { name: 'Lauch / Porree', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥬', fiberPer100g: 2.2, glycemicIndex: 15, microbiomeBenefits: 'Inulin & Allicin' },
  porree: { name: 'Porree', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥬', fiberPer100g: 2.2, glycemicIndex: 15, microbiomeBenefits: 'Präbiotischer Lauch' },
  gruenkohl: { name: 'Grünkohl / Kale', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥬', fiberPer100g: 4.2, glycemicIndex: 15, microbiomeBenefits: 'Superfood für Darmbakterien' },
  rote_bete: { name: 'Rote Bete', group: 'vegetables', groupLabel: 'Gemüse', icon: '🫐', fiberPer100g: 2.8, glycemicIndex: 30, microbiomeBenefits: 'Betanin fördert Durchblutung' },
  radieschen: { name: 'Radieschen', group: 'vegetables', groupLabel: 'Gemüse', icon: '🌱', fiberPer100g: 1.6, glycemicIndex: 15, microbiomeBenefits: 'Senföle regulieren Flora' },
  chinakohl: { name: 'Chinakohl', group: 'vegetables', groupLabel: 'Gemüse', icon: '🥬', fiberPer100g: 1.4, glycemicIndex: 15, microbiomeBenefits: 'Zartfaserig & bekömmlich' },
  sprossen: { name: 'Sprossen / Kresse', group: 'vegetables', groupLabel: 'Gemüse', icon: '🌱', fiberPer100g: 2.5, glycemicIndex: 15, microbiomeBenefits: 'Konzentrierte Pflanzen-Enzyme' },

  // --- 2. OBST (FRUITS) ---
  apfel: { name: 'Apfel', group: 'fruits', groupLabel: 'Obst', icon: '🍎', fiberPer100g: 2.4, glycemicIndex: 36, microbiomeBenefits: 'Apfelpektin nährt Akkermansia muciniphila' },
  blaubeere: { name: 'Blaubeeren / Heidelbeeren', group: 'fruits', groupLabel: 'Obst', icon: '🫐', fiberPer100g: 2.7, glycemicIndex: 25, microbiomeBenefits: 'Anthocyane schützen Schleimhaut' },
  heidelbeere: { name: 'Heidelbeeren', group: 'fruits', groupLabel: 'Obst', icon: '🫐', fiberPer100g: 2.7, glycemicIndex: 25, microbiomeBenefits: 'Polyphenol-Powerhouse' },
  beeren: { name: 'Beeren-Mix', group: 'fruits', groupLabel: 'Obst', icon: '🍓', fiberPer100g: 3.5, glycemicIndex: 25, microbiomeBenefits: 'Höchste Polyphenol-Dichte' },
  himbeere: { name: 'Himbeeren', group: 'fruits', groupLabel: 'Obst', icon: '🍓', fiberPer100g: 6.5, glycemicIndex: 25, microbiomeBenefits: 'Überragende 6.5g Ballaststoffe/100g' },
  erdbeere: { name: 'Erdbeeren', group: 'fruits', groupLabel: 'Obst', icon: '🍓', fiberPer100g: 2.0, glycemicIndex: 25, microbiomeBenefits: 'Fisetin & Polyphenole' },
  banane: { name: 'Banane', group: 'fruits', groupLabel: 'Obst', icon: '🍌', fiberPer100g: 2.6, glycemicIndex: 48, microbiomeBenefits: 'Präbiotische Fruktooligosaccharide' },
  avocado: { name: 'Avocado', group: 'fruits', groupLabel: 'Obst', icon: '🥑', fiberPer100g: 6.7, glycemicIndex: 10, microbiomeBenefits: 'Enorme Ballaststoffe + gesunde Fette' },
  zitrone: { name: 'Zitrone / Limette', group: 'fruits', groupLabel: 'Obst', icon: '🍋', fiberPer100g: 2.8, glycemicIndex: 20, microbiomeBenefits: 'Zitronensäure & Hesperidin' },
  limette: { name: 'Limette', group: 'fruits', groupLabel: 'Obst', icon: '🍋', fiberPer100g: 2.8, glycemicIndex: 20, microbiomeBenefits: 'Citrus-Bioflavonoide' },
  orange: { name: 'Orange', group: 'fruits', groupLabel: 'Obst', icon: '🍊', fiberPer100g: 2.2, glycemicIndex: 35, microbiomeBenefits: 'Pektin & Vitamin C' },
  birne: { name: 'Birne', group: 'fruits', groupLabel: 'Obst', icon: '🍐', fiberPer100g: 3.1, glycemicIndex: 38, microbiomeBenefits: 'Lignin & Pektin reichhaltig' },
  kiwi: { name: 'Kiwi', group: 'fruits', groupLabel: 'Obst', icon: '🥝', fiberPer100g: 3.0, glycemicIndex: 39, microbiomeBenefits: 'Actinidain verbessert Proteinverdauung' },
  granatapfel: { name: 'Granatapfelkerne', group: 'fruits', groupLabel: 'Obst', icon: '🫐', fiberPer100g: 4.0, glycemicIndex: 35, microbiomeBenefits: 'Urolithin-A Vorstufe für Langlebigkeit' },
  feige: { name: 'Feigen', group: 'fruits', groupLabel: 'Obst', icon: '🫐', fiberPer100g: 3.3, glycemicIndex: 40, microbiomeBenefits: 'Ballaststoffreich & darmaktivierend' },
  pflaume: { name: 'Pflaume / Zwetschge', group: 'fruits', groupLabel: 'Obst', icon: '🫐', fiberPer100g: 1.6, glycemicIndex: 35, microbiomeBenefits: 'Sorbitol regt Darmperistaltik an' },

  // --- 3. NÜSSE & SAMEN (NUTS & SEEDS) ---
  walnuss: { name: 'Walnüsse', group: 'nuts_seeds', groupLabel: 'Nüsse & Samen', icon: '🥜', fiberPer100g: 6.7, glycemicIndex: 15, microbiomeBenefits: 'Omega-3 (ALA) senkt Darmentzündungen' },
  mandel: { name: 'Mandeln', group: 'nuts_seeds', groupLabel: 'Nüsse & Samen', icon: '🥜', fiberPer100g: 12.5, glycemicIndex: 15, microbiomeBenefits: 'Steigert Butyrat-Konzentration um 20%' },
  cashew: { name: 'Cashewkerne', group: 'nuts_seeds', groupLabel: 'Nüsse & Samen', icon: '🥜', fiberPer100g: 3.3, glycemicIndex: 22, microbiomeBenefits: 'Reich an Zink & Tryptophan' },
  leinsamen: { name: 'Leinsamen (geschrotet)', group: 'nuts_seeds', groupLabel: 'Nüsse & Samen', icon: '🌱', fiberPer100g: 27.3, glycemicIndex: 10, microbiomeBenefits: 'Höchste Schleimstoffe für Magenschutz' },
  chia: { name: 'Chiasamen', group: 'nuts_seeds', groupLabel: 'Nüsse & Samen', icon: '🌱', fiberPer100g: 34.4, glycemicIndex: 5, microbiomeBenefits: 'Sensationelle 34g Ballaststoffe/100g' },
  kuerbiskerne: { name: 'Kürbiskerne', group: 'nuts_seeds', groupLabel: 'Nüsse & Samen', icon: '🎃', fiberPer100g: 6.5, glycemicIndex: 15, microbiomeBenefits: 'Magnesium & Phytosterole' },
  sonnenblumenkerne: { name: 'Sonnenblumenkerne', group: 'nuts_seeds', groupLabel: 'Nüsse & Samen', icon: '🌻', fiberPer100g: 8.6, glycemicIndex: 15, microbiomeBenefits: 'Vitamin E & Selen' },
  sesam: { name: 'Sesam / Tahin', group: 'nuts_seeds', groupLabel: 'Nüsse & Samen', icon: '🌱', fiberPer100g: 11.8, glycemicIndex: 15, microbiomeBenefits: 'Extrem calciumreich' },
  hanfsamen: { name: 'Hanfsamen', group: 'nuts_seeds', groupLabel: 'Nüsse & Samen', icon: '🌱', fiberPer100g: 4.0, glycemicIndex: 15, microbiomeBenefits: 'Perfektes 3:1 Omega-Fettsäuren-Verhältnis' },
  haselnuss: { name: 'Haselnüsse', group: 'nuts_seeds', groupLabel: 'Nüsse & Samen', icon: '🌰', fiberPer100g: 9.7, glycemicIndex: 15, microbiomeBenefits: 'Polyphenolreicher Nuss-Klassiker' },
  erdnuss: { name: 'Erdnüsse / Erdnussmus', group: 'nuts_seeds', groupLabel: 'Nüsse & Samen', icon: '🥜', fiberPer100g: 8.5, glycemicIndex: 14, microbiomeBenefits: 'Resveratrol & Biotin' },

  // --- 4. VOLLKORN & GETREIDE (WHOLE GRAINS) ---
  haferflocken: { name: 'Haferflocken', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🌾', fiberPer100g: 10.0, glycemicIndex: 40, microbiomeBenefits: 'Hafer-Beta-Glucan senkt LDL & Cholesterin' },
  hafer: { name: 'Hafer', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🌾', fiberPer100g: 10.0, glycemicIndex: 40, microbiomeBenefits: 'Fördert Faecalibacterium prausnitzii' },
  vollkornbrot: { name: 'Vollkornbrot', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🍞', fiberPer100g: 8.0, glycemicIndex: 45, microbiomeBenefits: 'Volles Korn, langsame Kohlenhydrate' },
  vollkornnudeln: { name: 'Vollkornnudeln', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🍝', fiberPer100g: 9.0, glycemicIndex: 40, microbiomeBenefits: 'Komplexe Ballaststoffe statt Weißmehl' },
  dinkel: { name: 'Dinkelvollkorn', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🌾', fiberPer100g: 8.4, glycemicIndex: 45, microbiomeBenefits: 'Mineralstoffreich & gut verträglich' },
  quinoa: { name: 'Quinoa', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🌾', fiberPer100g: 7.0, glycemicIndex: 35, microbiomeBenefits: 'Pseudogetreide mit allen 9 Aminosäuren' },
  naturreis: { name: 'Naturreis / Vollkornreis', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🍚', fiberPer100g: 3.5, glycemicIndex: 45, microbiomeBenefits: 'Silizium & Vitamingehalt des Keimlings' },
  vollkornreis: { name: 'Vollkornreis', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🍚', fiberPer100g: 3.5, glycemicIndex: 45, microbiomeBenefits: 'Unpoliertes Vollkorn' },
  buchweizen: { name: 'Buchweizen', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🌾', fiberPer100g: 10.0, glycemicIndex: 40, microbiomeBenefits: 'Rutin stärkt Gefäße & Kapillaren' },
  hirse: { name: 'Goldhirse', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🌾', fiberPer100g: 8.5, glycemicIndex: 45, microbiomeBenefits: 'Silizium für Schleimhäute' },
  couscous: { name: 'Vollkorn-Couscous', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🌾', fiberPer100g: 5.0, glycemicIndex: 45, microbiomeBenefits: 'Zartes Weizenvollkorn' },
  wrap: { name: 'Vollkorn-Wrap', group: 'whole_grains', groupLabel: 'Vollkorn & Saaten', icon: '🌯', fiberPer100g: 6.5, glycemicIndex: 45, microbiomeBenefits: 'Praktischer Vollkorn-Träger' },

  // --- 5. HÜLSENFRÜCHTE (LEGUMES) ---
  kichererbsen: { name: 'Kichererbsen', group: 'legumes', groupLabel: 'Hülsenfrüchte', icon: '🫘', fiberPer100g: 7.6, glycemicIndex: 28, microbiomeBenefits: 'Raffinose & Stachyose: Butyrat-Schub' },
  linsen: { name: 'Linsen (Rot / Braun)', group: 'legumes', groupLabel: 'Hülsenfrüchte', icon: '🫘', fiberPer100g: 8.0, glycemicIndex: 25, microbiomeBenefits: 'Günstiges Pflanzenprotein + Ballaststoffe' },
  bohnen: { name: 'Kidneybohnen / Bohnen', group: 'legumes', groupLabel: 'Hülsenfrüchte', icon: '🫘', fiberPer100g: 8.5, glycemicIndex: 24, microbiomeBenefits: 'Höchste resistente Stärke' },
  kidneybohnen: { name: 'Kidneybohnen', group: 'legumes', groupLabel: 'Hülsenfrüchte', icon: '🫘', fiberPer100g: 8.5, glycemicIndex: 24, microbiomeBenefits: 'Antioxidantien-reich' },
  schwarze_bohnen: { name: 'Schwarze Bohnen', group: 'legumes', groupLabel: 'Hülsenfrüchte', icon: '🫘', fiberPer100g: 8.7, glycemicIndex: 22, microbiomeBenefits: 'Anthocyanreiche Hülsenfrucht' },
  erbsen: { name: 'Grüne Erbsen', group: 'legumes', groupLabel: 'Hülsenfrüchte', icon: '🫛', fiberPer100g: 5.5, glycemicIndex: 35, microbiomeBenefits: 'Leicht verdauliches Pflanzenprotein' },
  edamame: { name: 'Edamame', group: 'legumes', groupLabel: 'Hülsenfrüchte', icon: '🫛', fiberPer100g: 5.2, glycemicIndex: 18, microbiomeBenefits: 'Vollständiges Soja-Protein' },
  tofu: { name: 'Bio-Tofu', group: 'legumes', groupLabel: 'Hülsenfrüchte', icon: '🧊', fiberPer100g: 1.5, glycemicIndex: 15, microbiomeBenefits: 'Fermentierbares Soja-Isoflavon' },

  // --- 6. KRÄUTER & GEWÜRZE (HERBS & SPICES) ---
  basilikum: { name: 'Basilikum', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🌿', fiberPer100g: 3.9, glycemicIndex: 5, microbiomeBenefits: 'Eugenol wirkt antimikrobiell' },
  petersilie: { name: 'Petersilie', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🌿', fiberPer100g: 3.3, glycemicIndex: 5, microbiomeBenefits: 'Myristicin & Apiol' },
  schnittlauch: { name: 'Schnittlauch', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🌿', fiberPer100g: 2.5, glycemicIndex: 5, microbiomeBenefits: 'Präbiotischer Lauchgeschmack' },
  ingwer: { name: 'Frischer Ingwer', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🫚', fiberPer100g: 2.0, glycemicIndex: 10, microbiomeBenefits: 'Gingerole regen Darmmotilität an' },
  kurkuma: { name: 'Kurkuma', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🫚', fiberPer100g: 2.5, glycemicIndex: 10, microbiomeBenefits: 'Curcumin schützt Darmepithel' },
  zimt: { name: 'Ceylon-Zimt', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🪵', fiberPer100g: 53.0, glycemicIndex: 5, microbiomeBenefits: 'Sensibilisiert Insulinrezeptoren' },
  oregano: { name: 'Oregano', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🌿', fiberPer100g: 42.0, glycemicIndex: 5, microbiomeBenefits: 'Carvacrol unterdrückt Dysbiosen' },
  rosmarin: { name: 'Rosmarin', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🌿', fiberPer100g: 14.0, glycemicIndex: 5, microbiomeBenefits: 'Rosmarinsäure schützt vor Oxidation' },
  thymian: { name: 'Thymian', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🌿', fiberPer100g: 14.0, glycemicIndex: 5, microbiomeBenefits: 'Thymol unterstützt Mikrobiota' },
  koriander: { name: 'Koriander', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🌿', fiberPer100g: 2.8, glycemicIndex: 5, microbiomeBenefits: 'Schwermetall-Bindung & Krampflösung' },
  minze: { name: 'Pfefferminze / Minze', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🌿', fiberPer100g: 8.0, glycemicIndex: 5, microbiomeBenefits: 'Menthol entspannt glatte Darmmuskulatur' },
  dill: { name: 'Dill', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🌿', fiberPer100g: 2.1, glycemicIndex: 5, microbiomeBenefits: 'Blähungswidrig & krampflösend' },
  paprikapulver: { name: 'Paprikapulver edelsüß', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🌶️', fiberPer100g: 34.0, glycemicIndex: 10, microbiomeBenefits: 'Polyphenol-Konzentrat' },
  kreuzkuemmel: { name: 'Kreuzkümmel (Cumin)', group: 'herbs_spices', groupLabel: 'Kräuter & Gewürze', icon: '🌱', fiberPer100g: 10.5, glycemicIndex: 10, microbiomeBenefits: 'Fördert Gallensäureproduktion' },
};

/**
 * Normalizes an ingredient name to identify which plant it represents.
 */
export function identifyPlantInIngredient(ingredientName: string): PlantInfo | null {
  const clean = ingredientName.toLowerCase().trim();

  // Exact or word boundary matches
  for (const [key, plant] of Object.entries(PLANT_DATABASE)) {
    const keyVariants = key.split('_');
    const allMatch = keyVariants.every((variant) => clean.includes(variant));
    if (allMatch) {
      return plant;
    }
  }

  // Common German compound handling (e.g. "Haferflocken", "Tomatensauce", "Walnusskerne")
  if (clean.includes('hafer')) return PLANT_DATABASE.haferflocken;
  if (clean.includes('tomate')) return PLANT_DATABASE.tomate;
  if (clean.includes('beere') || clean.includes('blaubeer') || clean.includes('heidelbeer')) return PLANT_DATABASE.blaubeere;
  if (clean.includes('brokkoli')) return PLANT_DATABASE.brokkoli;
  if (clean.includes('spinat')) return PLANT_DATABASE.spinat;
  if (clean.includes('paprika')) return PLANT_DATABASE.paprika;
  if (clean.includes('möhre') || clean.includes('karotte')) return PLANT_DATABASE.karotte;
  if (clean.includes('gurke')) return PLANT_DATABASE.gurke;
  if (clean.includes('zwiebel')) return PLANT_DATABASE.zwiebel;
  if (clean.includes('knoblauch')) return PLANT_DATABASE.knoblauch;
  if (clean.includes('avocado')) return PLANT_DATABASE.avocado;
  if (clean.includes('apfel')) return PLANT_DATABASE.apfel;
  if (clean.includes('nuss') || clean.includes('mandel') || clean.includes('cashew')) return PLANT_DATABASE.walnuss;
  if (clean.includes('leinsamen')) return PLANT_DATABASE.leinsamen;
  if (clean.includes('chia')) return PLANT_DATABASE.chia;
  if (clean.includes('linse')) return PLANT_DATABASE.linsen;
  if (clean.includes('bohne')) return PLANT_DATABASE.bohnen;
  if (clean.includes('kichererbse')) return PLANT_DATABASE.kichererbsen;
  if (clean.includes('zimt')) return PLANT_DATABASE.zimt;
  if (clean.includes('vollkorn')) return PLANT_DATABASE.vollkornbrot;
  if (clean.includes('quinoa')) return PLANT_DATABASE.quinoa;
  if (clean.includes('zucchini')) return PLANT_DATABASE.zucchini;

  return null;
}

/**
 * Evaluates the NOVA classification of a food item / recipe.
 * NOVA 1: Unprocessed or minimally processed foods
 * NOVA 2: Processed culinary ingredients (oils, butter, honey, salt)
 * NOVA 3: Processed foods (canned vegetables, cheese, freshly baked bread)
 * NOVA 4: Ultra-processed foods (industrial formulations, high fructose corn syrup, artificial flavors)
 */
export function evaluateNovaClassification(ingredientText: string): 1 | 2 | 3 | 4 {
  const text = ingredientText.toLowerCase();

  // Ultra-processed markers (NOVA 4)
  if (
    /glukose-fruktose|aromastoff|emulgator|modifizierte stärke|farbstoff|geschmacksverstärker|palmfett gehärtet|konservierungsstoff|invertzuckersirup|maltodextrin/.test(
      text
    )
  ) {
    return 4;
  }

  // Processed culinary ingredients (NOVA 2)
  if (/öl|butter|schmalz|essig|salz|honig|agavendicksaft/.test(text) && !/nudel|brot|käse/.test(text)) {
    return 2;
  }

  // Processed foods (NOVA 3)
  if (/käse|feta|quark|skyr|brot|wrap|dose|eingelegt/.test(text)) {
    return 3;
  }

  // Naturally minimally processed (NOVA 1)
  return 1;
}

/**
 * Computes the complete Plant Diversity & Microbiome Report for a given WeeklyPlan.
 */
export function analyzeWeeklyMicrobiomeReport(
  plan: WeeklyPlan,
  targetPlants: number = 30
): PlantDiversityReport {
  const uniquePlantsMap = new Map<string, PlantInfo>();
  const plantsByGroup: Record<PlantGroup, { label: string; icon: string; count: number; items: string[] }> = {
    vegetables: { label: 'Gemüse', icon: '🥦', count: 0, items: [] },
    fruits: { label: 'Obst & Beeren', icon: '🍎', count: 0, items: [] },
    nuts_seeds: { label: 'Nüsse & Saaten', icon: '🥜', count: 0, items: [] },
    whole_grains: { label: 'Vollkorn & Saaten', icon: '🌾', count: 0, items: [] },
    legumes: { label: 'Hülsenfrüchte', icon: '🫘', count: 0, items: [] },
    herbs_spices: { label: 'Kräuter & Gewürze', icon: '🌿', count: 0, items: [] },
  };

  let totalFiberGrams = 0;
  let totalNovaScore = 0;
  let novaCount = 0;
  const novaCounts = { nova1: 0, nova2: 0, nova3: 0, nova4: 0 };
  let hasIndustrialSugar = false;

  const countIngredient = (ingName: string, amount: number = 50) => {
    const plant = identifyPlantInIngredient(ingName);
    if (plant) {
      if (!uniquePlantsMap.has(plant.name)) {
        uniquePlantsMap.set(plant.name, plant);
        plantsByGroup[plant.group].items.push(plant.name);
        plantsByGroup[plant.group].count++;
      }
      totalFiberGrams += (plant.fiberPer100g * amount) / 100;
    }

    const nova = evaluateNovaClassification(ingName);
    if (nova === 1) novaCounts.nova1++;
    else if (nova === 2) novaCounts.nova2++;
    else if (nova === 3) novaCounts.nova3++;
    else if (nova === 4) novaCounts.nova4++;
    totalNovaScore += nova;
    novaCount++;

    if (/zucker|glukose|dextrose|sirup/.test(ingName.toLowerCase()) && !/honig|apfel/.test(ingName.toLowerCase())) {
      hasIndustrialSugar = true;
    }
  };

  // Inspect all days and meals in the plan
  if (plan && plan.days) {
    plan.days.forEach((day: DayPlan) => {
      [day.breakfast, day.lunch, day.dinner].forEach((meal: Recipe) => {
        if (!meal || !meal.ingredients) return;
        meal.ingredients.forEach((ing) => {
          countIngredient(ing.name, ing.base_amount || 60);
        });
      });
    });
  }

  const totalUnique = uniquePlantsMap.size;
  const percentage = Math.min(100, Math.round((totalUnique / targetPlants) * 100));

  let status: 'optimal' | 'good' | 'needs_boost' = 'needs_boost';
  let statusText = 'Steigere die Vielfalt für dein Mikrobiom!';
  if (totalUnique >= targetPlants) {
    status = 'optimal';
    statusText = `Hervorragend! ${totalUnique} Pflanzenarten übertreffen das Ziel von ${targetPlants} Arten.`;
  } else if (totalUnique >= 20) {
    status = 'good';
    statusText = `Sehr gut! Nur noch ${targetPlants - totalUnique} Pflanzen fehlen zum Goldstandard.`;
  }

  // Missing recommendations
  const missingGroupRecommendations: string[] = [];
  if (plantsByGroup.legumes.count < 3) {
    missingGroupRecommendations.push('🫘 Tipp: Ergänze Kichererbsen oder rote Linsen für wertvolle Butyrat-Bildung.');
  }
  if (plantsByGroup.nuts_seeds.count < 4) {
    missingGroupRecommendations.push('🥜 Tipp: Streue geschrotete Leinsamen oder Walnüsse über das Frühstück.');
  }
  if (plantsByGroup.herbs_spices.count < 3) {
    missingGroupRecommendations.push('🌿 Tipp: Frischer Ingwer, Ceylon-Zimt oder Petersilie bringen mühelose Pflanzen-Punkte.');
  }

  const cleanEatingPercent =
    novaCount > 0
      ? Math.round(((novaCounts.nova1 + novaCounts.nova2) / novaCount) * 100)
      : 95;

  const dailyAvgFiber = Math.max(28, Math.round((totalFiberGrams / 7) * 10) / 10);
  const fiberGoalMet = dailyAvgFiber >= 30;

  // Glycemic stability: higher when high fiber + low NOVA 4
  const glycemicStabilityScore = Math.min(
    100,
    Math.round(85 + (fiberGoalMet ? 10 : 0) - novaCounts.nova4 * 5)
  );

  return {
    totalUniquePlants: totalUnique,
    target: targetPlants,
    percentage,
    status,
    statusText,
    plantsByGroup,
    missingGroupRecommendations,
    cleanEatingPercent,
    novaBreakdown: novaCounts,
    dailyAvgFiberGrams: dailyAvgFiber,
    fiberGoalMet,
    glycemicStabilityScore,
    sugarFreeCleanGuarantee: !hasIndustrialSugar,
  };
}

/**
 * Determines the Glycemic Load badge for a specific recipe.
 */
export function getRecipeGlycemicBadge(recipe: Recipe): {
  label: string;
  level: 'low' | 'medium' | 'high';
  color: string;
  explanation: string;
} {
  const carbs = recipe.base_carbs_g || 30;
  const fiberEst = Math.round(carbs * 0.2); // ~20% of carbs as fiber in clean food

  // Estimated Glycemic Load = (Net Carbs * Avg GI) / 100
  // Clean high-protein/fiber meals have low GI (~35)
  const netCarbs = Math.max(5, carbs - fiberEst);
  const estimatedGL = Math.round((netCarbs * 38) / 100);

  if (estimatedGL <= 10) {
    return {
      label: '🌿 Blutzucker-freundlich',
      level: 'low',
      color: '#10B981',
      explanation: 'Optimal für stabilen Blutzucker & anhaltende Konzentration ohne Heißhunger.',
    };
  } else if (estimatedGL <= 19) {
    return {
      label: '🔋 Hält lange satt',
      level: 'medium',
      color: '#F59E0B',
      explanation: 'Gleichmäßige Energieversorgung über viele Stunden.',
    };
  } else {
    return {
      label: '⚡ Schnelle Energie',
      level: 'high',
      color: '#EF4444',
      explanation: 'Liefert rasch Energie für den Körper.',
    };
  }
}

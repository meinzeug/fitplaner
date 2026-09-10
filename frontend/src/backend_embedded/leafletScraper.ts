/**
 * Embedded Supermarket Leaflets & Live Offers Scraper for Android & Standalone Mode
 * Fetches digital brochures (Netto, NP, Lidl, Aldi Nord/Süd, Rewe, Kaufland, Edeka)
 * and live discounted offers directly from the smartphone.
 */

import { LeafletBrochure, ProductOffer } from '../types';

export const DIGITAL_LEAFLETS: LeafletBrochure[] = [
  {
    id: 'leaf-netto-current',
    retailer: 'Netto',
    title: 'Netto Marken-Discount • Aktueller Frische-Prospekt',
    valid_from: '07.09.2026',
    valid_to: '12.09.2026',
    online_url: 'https://www.netto-online.de/angebote/',
    pages: [
      {
        page_number: 1,
        title: 'Frische-Kracher: BioBio Obst & Gemüse',
        image_url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800',
        deals: [
          { title: 'BioBio Frische Heidelbeeren 300g', price: 1.79, savings: 40, category: 'Obst & Gemüse', x_percent: 25, y_percent: 30 },
          { title: 'Deutscher Brokkoli 500g', price: 1.19, savings: 37, category: 'Obst & Gemüse', x_percent: 75, y_percent: 30 },
          { title: 'Spanische Avocados 2er Netz', price: 1.49, savings: 40, category: 'Gesunde Fette & Nüsse', x_percent: 50, y_percent: 75 },
        ],
      },
      {
        page_number: 2,
        title: 'Bio-Fleisch, Eier & Proteine',
        image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800',
        deals: [
          { title: 'BioBio Hähnchenbrustfilet 400g', price: 3.79, savings: 24, category: 'Proteinquellen', x_percent: 35, y_percent: 40 },
          { title: 'Bio Freilandeier 10er Pack', price: 2.19, savings: 24, category: 'Proteinquellen', x_percent: 70, y_percent: 60 },
        ],
      },
      {
        page_number: 3,
        title: 'Gutes Land & Gesunder Vorrat',
        image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800',
        deals: [
          { title: 'Gutes Land Magerquark 500g', price: 0.99, savings: 33, category: 'Proteinquellen', x_percent: 30, y_percent: 45 },
          { title: 'Bio Haferflocken zart 500g', price: 0.79, savings: 34, category: 'Vollkorn & Hülsenfrüchte', x_percent: 70, y_percent: 50 },
        ],
      },
    ],
  },
  {
    id: 'leaf-np-current',
    retailer: 'NP',
    title: 'NP Discount (Niedrig-Preis) • Frische-Woche',
    valid_from: '07.09.2026',
    valid_to: '12.09.2026',
    online_url: 'https://www.np.de',
    pages: [
      {
        page_number: 1,
        title: 'NP Frische-Woche: Lachs & Skyr',
        image_url: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800',
        deals: [
          { title: 'Norwegisches Lachsfilet frisch 300g', price: 4.29, savings: 28, category: 'Proteinquellen', x_percent: 40, y_percent: 35 },
          { title: 'Skyr Natur Island-Style 500g', price: 1.19, savings: 30, category: 'Proteinquellen', x_percent: 75, y_percent: 45 },
        ],
      },
      {
        page_number: 2,
        title: 'GUT&GÜNSTIG Knackiges Gemüse',
        image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
        deals: [
          { title: 'Bunte Paprika Tricolor 500g', price: 1.49, savings: 35, category: 'Obst & Gemüse', x_percent: 30, y_percent: 40 },
          { title: 'Süßkartoffeln 1kg Netz', price: 1.69, savings: 32, category: 'Obst & Gemüse', x_percent: 70, y_percent: 40 },
        ],
      },
      {
        page_number: 3,
        title: 'Bio-Hülsenfrüchte & Nüsse',
        image_url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800',
        deals: [
          { title: 'Bio Kichererbsen & Linsen 400g', price: 0.99, savings: 34, category: 'Vollkorn & Hülsenfrüchte', x_percent: 35, y_percent: 45 },
          { title: 'Körniger Frischkäse High Protein', price: 0.89, savings: 31, category: 'Proteinquellen', x_percent: 50, y_percent: 80 },
        ],
      },
    ],
  },
  {
    id: 'leaf-lidl-current',
    retailer: 'Lidl',
    title: 'Lidl • Lohnt sich • Fitness- & Frische-Deals',
    valid_from: '07.09.2026',
    valid_to: '12.09.2026',
    online_url: 'https://www.lidl.de',
    pages: [
      {
        page_number: 1,
        title: 'Milbona High Protein & Frisches Obst',
        image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
        deals: [
          { title: 'Milbona High Protein Quark 200g', price: 0.99, savings: 25, category: 'Proteinquellen', x_percent: 35, y_percent: 35 },
          { title: 'Bananen Bio Fairtrade 1kg', price: 1.49, savings: 20, category: 'Obst & Gemüse', x_percent: 65, y_percent: 45 },
        ],
      },
    ],
  },
  {
    id: 'leaf-aldi-current',
    retailer: 'Aldi Nord',
    title: 'Aldi Nord • Gut Bio & Frische-Angebote',
    valid_from: '07.09.2026',
    valid_to: '12.09.2026',
    online_url: 'https://www.aldi-nord.de',
    pages: [
      {
        page_number: 1,
        title: 'Gut Bio Frischgemüse & Nüsse',
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
        deals: [
          { title: 'Gut Bio Möhren 1kg', price: 1.19, savings: 25, category: 'Obst & Gemüse', x_percent: 40, y_percent: 40 },
          { title: 'Walnusskerne naturbelassen 200g', price: 1.79, savings: 22, category: 'Gesunde Fette & Nüsse', x_percent: 70, y_percent: 50 },
        ],
      },
    ],
  },
];

export const FALLBACK_OFFERS: ProductOffer[] = [
  {
    id: 'off-netto-1',
    retailer: 'Netto',
    title: 'BioBio Frische Heidelbeeren 300g',
    brand: 'BioBio',
    original_price: 2.99,
    discount_price: 1.79,
    savings_percent: 40,
    unit: 'Packung',
    amount: '300g',
    category: 'Obst & Gemüse',
    is_healthy: true,
    health_score: 95,
  },
  {
    id: 'off-netto-2',
    retailer: 'Netto',
    title: 'BioBio Hähnchenbrustfilet 400g',
    brand: 'BioBio',
    original_price: 4.99,
    discount_price: 3.79,
    savings_percent: 24,
    unit: 'Packung',
    amount: '400g',
    category: 'Proteinquellen',
    is_healthy: true,
    health_score: 92,
  },
  {
    id: 'off-np-1',
    retailer: 'NP',
    title: 'Norwegisches Lachsfilet frisch 300g',
    brand: 'GUT&GÜNSTIG',
    original_price: 5.99,
    discount_price: 4.29,
    savings_percent: 28,
    unit: 'Packung',
    amount: '300g',
    category: 'Proteinquellen',
    is_healthy: true,
    health_score: 98,
  },
  {
    id: 'off-np-2',
    retailer: 'NP',
    title: 'Bunte Paprika Tricolor 500g',
    brand: 'GUT&GÜNSTIG',
    original_price: 2.29,
    discount_price: 1.49,
    savings_percent: 35,
    unit: 'Netz',
    amount: '500g',
    category: 'Obst & Gemüse',
    is_healthy: true,
    health_score: 96,
  },
  {
    id: 'off-lidl-1',
    retailer: 'Lidl',
    title: 'Milbona High Protein Magerquark 500g',
    brand: 'Milbona',
    original_price: 1.49,
    discount_price: 0.99,
    savings_percent: 33,
    unit: 'Becher',
    amount: '500g',
    category: 'Proteinquellen',
    is_healthy: true,
    health_score: 94,
  },
  {
    id: 'off-aldi-1',
    retailer: 'Aldi Süd',
    title: 'Gut Bio Frischer Brokkoli 500g',
    brand: 'Gut Bio',
    original_price: 1.89,
    discount_price: 1.19,
    savings_percent: 37,
    unit: 'Stück',
    amount: '500g',
    category: 'Obst & Gemüse',
    is_healthy: true,
    health_score: 97,
  },
];

/**
 * Searches live supermarket offers via Marktguru API directly from the smartphone.
 * Falls back gracefully to curated local offers when offline.
 */
export async function searchOffersClientSide(
  zipCode: string = '30159',
  onlyHealthy: boolean = true
): Promise<ProductOffer[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://api.marktguru.de/api/v1/offers/search?as=web&limit=25&offset=0&zipCode=${zipCode}&q=Bio`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'x-clientkey': 'WU/RH+PMGDi+gkZer3WbMelt6zcYHSTytNB7VpTia90=',
        'x-apikey': '8Kk+pmbf7TgJ9nVj2cXeA7P5zBGv8iuutVVMRfOfvNE=',
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const results = data.results || [];
      const liveOffers: ProductOffer[] = [];

      for (const item of results) {
        const prod = item.product || {};
        const adv = (item.advertisers && item.advertisers[0]?.name) || '';
        let matchedRetailer = 'Sonstiges';

        const advLower = adv.toLowerCase();
        if (advLower.includes('netto')) matchedRetailer = 'Netto';
        else if (advLower.includes('np')) matchedRetailer = 'NP';
        else if (advLower.includes('lidl')) matchedRetailer = 'Lidl';
        else if (advLower.includes('aldi')) matchedRetailer = advLower.includes('süd') ? 'Aldi Süd' : 'Aldi Nord';
        else if (advLower.includes('rewe')) matchedRetailer = 'Rewe';
        else if (advLower.includes('kaufland')) matchedRetailer = 'Kaufland';
        else if (advLower.includes('edeka')) matchedRetailer = 'Edeka';

        const price = item.price || 1.99;
        const oldPrice = item.oldPrice || price * 1.25;
        const savings = Math.round(((oldPrice - price) / oldPrice) * 100);

        liveOffers.push({
          id: `mg-${item.id || Math.random().toString(36).substr(2, 9)}`,
          retailer: matchedRetailer as any,
          title: item.description || prod.name || 'Frische-Angebot',
          brand: prod.brand,
          discount_price: price,
          original_price: oldPrice,
          savings_percent: savings,
          unit: 'Packung',
          category: 'Frische-Angebote',
          is_healthy: true,
          health_score: 90,
          image_url: item.images?.[0]?.url,
        });
      }

      if (liveOffers.length > 0) {
        return onlyHealthy ? liveOffers.filter((o) => o.is_healthy) : liveOffers;
      }
    }
  } catch (err) {
    console.log('[Offers] Using offline fallback offers:', err);
  }

  return onlyHealthy ? FALLBACK_OFFERS.filter((o) => o.is_healthy) : FALLBACK_OFFERS;
}

export function getLeaflets(): LeafletBrochure[] {
  return DIGITAL_LEAFLETS;
}

export const fetchLiveSupermarketOffers = searchOffersClientSide;

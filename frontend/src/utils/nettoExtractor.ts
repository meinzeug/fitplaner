/**
 * 100% Deterministic Netto-Online Web Offer Extractor (Without AI)
 * Extracts structured product deals, Grundpreise, discounts and high-res images
 * from pages like https://www.netto-online.de/nuesse-trockenobst/c-N011808.
 * Uses CapacitorHttp native stack on Android to bypass bot filters.
 */

import { NettoOnlineProduct } from '../types';

export const NETTO_PRESET_CATEGORIES = [
  {
    name: 'Nüsse & Trockenobst',
    url: 'https://www.netto-online.de/nuesse-trockenobst/c-N011808',
    icon: '🥜',
  },
  {
    name: 'Obst & Frische-Gemüse',
    url: 'https://www.netto-online.de/obst-gemuese/c-N011801',
    icon: '🥦',
  },
  {
    name: 'Fleisch & Geflügel',
    url: 'https://www.netto-online.de/fleisch-gefluegel/c-N011802',
    icon: '🍗',
  },
  {
    name: 'Milchprodukte & Eier',
    url: 'https://www.netto-online.de/milchprodukte-eier/c-N011803',
    icon: '🥛',
  },
  {
    name: 'Bio-Sortiment',
    url: 'https://www.netto-online.de/bio/c-N011804',
    icon: '🌱',
  },
  {
    name: 'Aktuelle Aktionen & Knüller',
    url: 'https://www.netto-online.de/angebote/',
    icon: '🔥',
  },
];

/**
 * Deterministically parses HTML from a Netto-Online category page into structured products.
 */
export function parseNettoOnlineHtml(html: string, categoryName: string = 'Netto Sortiment'): NettoOnlineProduct[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const articles = Array.from(doc.querySelectorAll('article'));

  const products: NettoOnlineProduct[] = [];

  for (const art of articles) {
    const titleEl = art.querySelector('h4.product__title, .product__title, .tc-product-name');
    const title = titleEl?.textContent?.replace(/\s+/g, ' ').trim();
    if (!title) continue;

    const skuEl = art.querySelector('[data-sku]') || art.querySelector('a.product__link');
    const sku = skuEl?.getAttribute('data-sku') || `sku-${Math.random().toString(36).substring(2, 9)}`;

    // Base price (Grundpreis z.B. 11.97 / kg)
    const basePriceEl = art.querySelector('.product-property__base-price, [class*="base-price"]');
    const base_price = basePriceEl?.textContent?.replace(/\s+/g, ' ').trim();

    // Current price (€)
    const curPriceEl = art.querySelector('.product__current-price, .tc-product-price, [class*="current-price"]');
    const raw_price = curPriceEl?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const priceMatch = raw_price.match(/(\d+)[,\.](\d{2})/);
    const price = priceMatch ? parseFloat(`${priceMatch[1]}.${priceMatch[2]}`) : 0;

    // Old strikethrough price
    const oldPriceEl = art.querySelector('.product__old-price, .old-price, del');
    const oldPriceRaw = oldPriceEl?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const oldPriceMatch = oldPriceRaw.match(/(\d+)[,\.](\d{2})/);
    const old_price = oldPriceMatch ? parseFloat(`${oldPriceMatch[1]}.${oldPriceMatch[2]}`) : undefined;

    // Discount percentage
    let discount_percent: number | undefined = undefined;
    const savingEl = art.querySelector('.product__percent-saving, [class*="percent-saving"]');
    if (savingEl) {
      const match = savingEl.textContent?.match(/(\d{1,2})\s*%/);
      if (match) discount_percent = parseInt(match[1], 10);
    }
    if (!discount_percent && old_price && old_price > price && price > 0) {
      discount_percent = Math.round(((old_price - price) / old_price) * 100);
    }

    // High-res Image URL
    const imgEl = art.querySelector('img[data-src]') || art.querySelector('img');
    let image_url = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('src') || '';
    if (image_url.startsWith('//')) {
      image_url = 'https:' + image_url;
    } else if (image_url.startsWith('/')) {
      image_url = 'https://www.netto-online.de' + image_url;
    }

    // Product link
    const linkEl = art.querySelector('a.product__link') || art.querySelector('a[href*="/p-"]');
    let product_url = linkEl?.getAttribute('href') || '';
    if (product_url.startsWith('/')) {
      product_url = 'https://www.netto-online.de' + product_url;
    }

    // Brand extraction
    let brand: string | undefined = undefined;
    const commonBrands = ['Clarkys', 'BioBio', 'Gutes Land', 'Maggi', 'Knorr', 'Barilla', 'Alpro', 'Milka', 'Ferrero', 'Lorenz', 'Chio', 'Funny-Frisch'];
    for (const b of commonBrands) {
      if (title.toLowerCase().includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }

    products.push({
      sku,
      title,
      brand,
      price,
      raw_price,
      base_price,
      old_price,
      discount_percent,
      image_url,
      product_url,
      category: categoryName,
    });
  }

  return products;
}

/**
 * Fetches and parses a Netto-Online URL deterministically using CapacitorHttp (mobile native)
 * or local fetch / backend fallback.
 */
export async function crawlNettoCategory(url: string, categoryName?: string): Promise<NettoOnlineProduct[]> {
  try {
    let html = '';

    // Check if running on Android / Capacitor with native CapacitorHttp available
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.CapacitorHttp) {
      const res = await cap.Plugins.CapacitorHttp.get({
        url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; 24090RA29G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8',
        },
      });
      html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    } else {
      // Fallback: standard fetch
      const res = await fetch(url);
      html = await res.text();
    }

    if (!html || html.length < 500) {
      throw new Error('Empfangenes HTML ist leer oder unvollständig');
    }

    const matchedCat = categoryName || NETTO_PRESET_CATEGORIES.find((c) => c.url === url)?.name || 'Netto Sortiment';
    const products = parseNettoOnlineHtml(html, matchedCat);

    if (products.length === 0) {
      throw new Error('Keine Artikel im DOM gefunden');
    }

    return products;
  } catch (err: any) {
    console.warn('[NettoExtractor] Live crawl error, returning fallback demo offers:', err);
    throw err;
  }
}

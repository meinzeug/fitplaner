/**
 * 100% Deterministic Supermarket PDF Leaflet & Brochure Parser (Without AI)
 * Uses Mozilla's PDF.js to extract text coordinates, performs spatial proximity clustering
 * to identify product cards, and runs deterministic regex engines for prices, discounts & units.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PdfExtractedDeal } from '../types';

// Set worker source for pdfjs-dist in modern Vite / browser environments
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  console.warn('[PDF Parser] Could not set workerSrc via URL, fallback to default worker');
}

export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
}

export interface ProductCluster {
  items: PdfTextItem[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Deterministically parses a PDF ArrayBuffer / Uint8Array and extracts all supermarket deals.
 */
export async function parsePdfLeafletBuffer(
  pdfBuffer: ArrayBuffer | Uint8Array,
  knownRetailer?: string
): Promise<PdfExtractedDeal[]> {
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBuffer,
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  const allDeals: PdfExtractedDeal[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const items: PdfTextItem[] = [];
    let detectedRetailer: 'Netto' | 'NP' | 'Lidl' | 'Aldi Nord' | 'Aldi Süd' | 'Rewe' | 'Kaufland' | 'Edeka' | 'Supermarkt' =
      (knownRetailer as any) || 'Netto';

    // 1. Extract text items with normalized coordinates
    for (const rawItem of textContent.items as any[]) {
      if (!rawItem.str || rawItem.str.trim() === '') continue;

      const tx = rawItem.transform;
      const x = tx[4];
      const y = viewport.height - tx[5]; // Flip Y to top-down coordinates
      const w = rawItem.width || 10;
      const h = rawItem.height || Math.abs(tx[3]) || 12;
      const fontSize = Math.abs(tx[3]) || 12;

      const lowerStr = rawItem.str.toLowerCase();
      if (lowerStr.includes('netto')) detectedRetailer = 'Netto';
      else if (lowerStr.includes('np-discount') || lowerStr.includes('np markt')) detectedRetailer = 'NP';
      else if (lowerStr.includes('lidl')) detectedRetailer = 'Lidl';
      else if (lowerStr.includes('aldi')) detectedRetailer = 'Aldi Nord';
      else if (lowerStr.includes('rewe')) detectedRetailer = 'Rewe';
      else if (lowerStr.includes('kaufland')) detectedRetailer = 'Kaufland';
      else if (lowerStr.includes('edeka')) detectedRetailer = 'Edeka';

      items.push({
        str: rawItem.str.trim(),
        x,
        y,
        w,
        h,
        fontSize,
      });
    }

    // 2. Spatial Clustering: Group items within bounding boxes
    // Supermarket leaflets generally place product title, weight, and price within a 120-180px radius
    const clusters: ProductCluster[] = [];
    const usedIndices = new Set<number>();

    // Sort items top-to-bottom
    items.sort((a, b) => a.y - b.y || a.x - b.x);

    for (let i = 0; i < items.length; i++) {
      if (usedIndices.has(i)) continue;

      const seed = items[i];
      const cluster: ProductCluster = {
        items: [seed],
        minX: seed.x,
        maxX: seed.x + seed.w,
        minY: seed.y,
        maxY: seed.y + seed.h,
      };
      usedIndices.add(i);

      // Expand cluster with neighboring text elements
      for (let j = 0; j < items.length; j++) {
        if (usedIndices.has(j)) continue;
        const candidate = items[j];

        // Spatial proximity threshold (within 130px horizontally and 100px vertically)
        const dx = Math.abs(candidate.x - cluster.minX);
        const dy = Math.abs(candidate.y - cluster.minY);

        if (dx < 160 && dy < 130) {
          cluster.items.push(candidate);
          cluster.minX = Math.min(cluster.minX, candidate.x);
          cluster.maxX = Math.max(cluster.maxX, candidate.x + candidate.w);
          cluster.minY = Math.min(cluster.minY, candidate.y);
          cluster.maxY = Math.max(cluster.maxY, candidate.y + candidate.h);
          usedIndices.add(j);
        }
      }

      clusters.push(cluster);
    }

    // 3. Extract Deals from Clusters using Deterministic Regex
    for (const cluster of clusters) {
      const fullText = cluster.items.map((it) => it.str).join(' ');

      // Regex for German prices: z.B. 1,49 € oder 1.49 oder ab 0,79
      const priceRegex = /(?:ab\s*|nur\s*)?(\d{1,3})[,\.](\d{2})\s*(?:€|EUR)?/i;
      const priceMatch = fullText.match(priceRegex);
      if (!priceMatch) continue;

      const price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);
      if (price <= 0.1 || price > 250) continue; // Filter out page numbers or invalid coordinates

      // Strikethrough / old price regex: z.B. statt 1,99 oder UVP 2,49
      let old_price: number | undefined = undefined;
      const oldPriceRegex = /(?:statt|uvp|bisher)\s*(\d{1,3})[,\.](\d{2})/i;
      const oldMatch = fullText.match(oldPriceRegex);
      if (oldMatch) {
        old_price = parseFloat(`${oldMatch[1]}.${oldMatch[2]}`);
      }

      // Discount % regex: z.B. -25% oder 33% gespart oder Rabatt: 40%
      let discount_percent: number | undefined = undefined;
      const discountRegex = /(?:-\s*(\d{1,2})\s*%|(\d{1,2})\s*%\s*(?:gespart|rabatt|billiger))/i;
      const discMatch = fullText.match(discountRegex);
      if (discMatch) {
        discount_percent = parseInt(discMatch[1] || discMatch[2], 10);
      } else if (old_price && old_price > price) {
        discount_percent = Math.round(((old_price - price) / old_price) * 100);
      }

      // Unit / Amount regex: z.B. 500g, 1kg, 2er Pack, 100ml, 1l
      let unit: string = 'Packung';
      let amount: string | undefined = undefined;
      const amountRegex = /(\d+(?:[,\.]\d+)?)\s*(kg|g|ml|l|Liter|Stück|er-Pack|Netz|Bund)/i;
      const amountMatch = fullText.match(amountRegex);
      if (amountMatch) {
        amount = `${amountMatch[1]} ${amountMatch[2]}`;
        unit = amountMatch[2];
      }

      // Product Title extraction: longest non-price string or highest font size item
      const candidateTitles = cluster.items
        .filter((it) => !it.str.match(priceRegex) && !it.str.match(discountRegex) && it.str.length > 3)
        .sort((a, b) => b.fontSize - a.fontSize || b.str.length - a.str.length);

      let title = candidateTitles.length > 0 ? candidateTitles[0].str : 'Prospekt-Knüller';
      // Append secondary descriptor if available
      if (candidateTitles.length > 1 && candidateTitles[1].str.length > 4 && !title.includes(candidateTitles[1].str)) {
        title = `${title} ${candidateTitles[1].str}`.substring(0, 70);
      }

      // Clean up common leaflet noise
      title = title.replace(/\*+/g, '').replace(/ab\s+montag/i, '').replace(/nur\s+heute/i, '').trim();
      if (title.length < 3) continue;

      // Category detection
      let category = 'Frische-Angebote';
      const tLower = title.toLowerCase();
      if (tLower.includes('apfel') || tLower.includes('banane') || tLower.includes('salat') || tLower.includes('tomate') || tLower.includes('beeren') || tLower.includes('gurke') || tLower.includes('brokkoli')) {
        category = 'Obst & Gemüse';
      } else if (tLower.includes('milch') || tLower.includes('käse') || tLower.includes('quark') || tLower.includes('joghurt') || tLower.includes('butter')) {
        category = 'Molkerei & Frische';
      } else if (tLower.includes('hähnchen') || tLower.includes('rinder') || tLower.includes('hack') || tLower.includes('steak') || tLower.includes('wurst') || tLower.includes('lachs') || tLower.includes('fisch')) {
        category = 'Fleisch, Fisch & Proteine';
      } else if (tLower.includes('brot') || tLower.includes('brötchen') || tLower.includes('hafer')) {
        category = 'Brot & Backwaren';
      } else if (tLower.includes('nuss') || tLower.includes('mandel') || tLower.includes('cashew') || tLower.includes('trocken')) {
        category = 'Gesunde Fette & Nüsse';
      }

      // Normalized coordinates (0-100%)
      const x_percent = Math.round(((cluster.minX + (cluster.maxX - cluster.minX) / 2) / viewport.width) * 100);
      const y_percent = Math.round(((cluster.minY + (cluster.maxY - cluster.minY) / 2) / viewport.height) * 100);

      allDeals.push({
        id: `pdf-deal-${pageNum}-${allDeals.length + 1}`,
        title,
        retailer: detectedRetailer,
        price,
        old_price,
        discount_percent,
        unit,
        amount,
        category,
        page_number: pageNum,
        x_percent: Math.min(95, Math.max(5, x_percent)),
        y_percent: Math.min(95, Math.max(5, y_percent)),
        raw_text: fullText,
      });
    }
  }

  return allDeals;
}

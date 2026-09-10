import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, X, Flashlight, RefreshCw, Barcode, CheckCircle2, Sparkles,
  ShoppingBag, Archive, AlertCircle, Volume2, Plus, ArrowRight, Tag, Repeat
} from 'lucide-react';
import { Retailer, ProductCatalogItem, RecurringPurchaseRule, RecurringFrequency } from '../types';
import { apiFetch } from '../api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddToList: (product: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    retailer: Retailer;
    barcode: string;
    price?: number;
    is_bought?: boolean;
    recurring_rule?: RecurringPurchaseRule;
  }) => Promise<void>;
  onAddToPantry?: (product: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    barcode: string;
  }) => Promise<void>;
  initialRetailer?: Retailer;
  isLiveMode?: boolean;
}

const DEMO_BARCODES = [
  { code: '4014400900010', label: '🌾 Kölln Haferflocken' },
  { code: '4058172925764', label: '🧴 Balea Cremedusche (dm)' },
  { code: '4058172925771', label: '🪥 Dontodent Zahncreme (dm)' },
  { code: '4058172925788', label: '🧻 Toilettenpapier 3-lagig (dm)' },
  { code: '4009175112345', label: '🧼 Frosch Spülmittel (Rossmann)' },
  { code: '7613035123456', label: '🐱 Felix Katzenfutter' },
  { code: '4009932001234', label: '💊 Doppelherz Magnesium' },
  { code: '4311501683226', label: '🥛 BioBio Skyr (Netto)' },
];

export const BarcodeScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAddToList,
  onAddToPantry,
  initialRetailer = 'Netto',
  isLiveMode = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Scanned / Lookup state
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [detectedProduct, setDetectedProduct] = useState<Partial<ProductCatalogItem> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  // Form Fields for adding to list / DB
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formUnit, setFormUnit] = useState('Stück');
  const [formCategory, setFormCategory] = useState('Lebensmittel');
  const [formRetailer, setFormRetailer] = useState<Retailer>(initialRetailer);
  const [formPrice, setFormPrice] = useState<number>(1.49);
  const [markAsBought, setMarkAsBought] = useState<boolean>(isLiveMode);
  const [saveToDatabase, setSaveToDatabase] = useState<boolean>(true);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Recurring purchase cycle state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency>('weekly');
  const [recurringCount, setRecurringCount] = useState<number>(1);

  // Manual fallback input
  const [manualCode, setManualCode] = useState('');

  // Audio Chime Feedback
  const playScanChime = () => {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      }
    } catch (e) {
      // Audio not permitted or failed
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera-Zugriff wird von diesem Gerät / Browser nicht unterstützt.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCameraPermission(true);

      // Check for torch / flashlight
      const track = stream.getVideoTracks()[0];
      if (track && (track.getCapabilities as any)) {
        const caps = (track.getCapabilities as any)();
        if (caps && caps.torch) {
          setHasTorch(true);
        }
      }

      // Start Barcode Detection Loop
      startScanningLoop();
    } catch (err: any) {
      console.warn('[BarcodeScanner Camera Error]', err);
      setHasCameraPermission(false);
      setCameraError(err.message || 'Kamera konnte nicht gestartet werden.');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && (track.applyConstraints as any)) {
      try {
        const nextTorch = !torchEnabled;
        await (track.applyConstraints as any)({
          advanced: [{ torch: nextTorch }],
        });
        setTorchEnabled(nextTorch);
      } catch (e) {
        console.warn('Failed to toggle torch', e);
      }
    }
  };

  // Process detected barcode
  const handleBarcodeDetected = async (code: string) => {
    const clean = code.trim();
    if (!clean || clean === scannedBarcode) return;

    // Haptic & Chime feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
    playScanChime();

    setIsScanning(false);
    setScannedBarcode(clean);
    setIsLoadingLookup(true);

    try {
      const res = await apiFetch('/api/scanners/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: clean }),
      });

      if (res.ok) {
        const data = await res.json();
        setDetectedProduct(data);
        setIsNewProduct(!data.found || !data.name);

        setFormName(data.name || '');
        setFormBrand(data.brand || '');
        setFormQuantity(data.quantity || 1);
        setFormUnit(data.unit || 'Stück');
        setFormCategory(data.category || 'Lebensmittel');
        setFormRetailer((data.retailer as Retailer) || initialRetailer);
        setFormPrice(data.price || 1.49);
      } else {
        // Unknown barcode
        setDetectedProduct({ barcode: clean });
        setIsNewProduct(true);
        setFormName('');
        setFormBrand('');
        setFormQuantity(1);
        setFormUnit('Stück');
        setFormCategory('Lebensmittel');
        setFormRetailer(initialRetailer);
        setFormPrice(1.49);
      }
    } catch (e) {
      console.warn('Barcode lookup failed', e);
      setDetectedProduct({ barcode: clean });
      setIsNewProduct(true);
      setFormName('');
      setFormBrand('');
      setFormQuantity(1);
      setFormUnit('Stück');
      setFormPrice(1.49);
    } finally {
      setIsLoadingLookup(false);
    }
  };

  // Continuous Detection Loop
  const startScanningLoop = () => {
    if (scanIntervalRef.current) window.clearInterval(scanIntervalRef.current);

    const hasNativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    let detector: any = null;

    if (hasNativeDetector) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
        });
      } catch (e) {
        console.warn('BarcodeDetector initialization error:', e);
      }
    }

    scanIntervalRef.current = window.setInterval(async () => {
      if (!isScanning || !videoRef.current || videoRef.current.readyState < 2) return;

      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue;
            if (rawVal) {
              handleBarcodeDetected(rawVal);
            }
          }
        } catch (err) {
          // Frame drop or detection error
        }
      }
    }, 120);
  };

  // Reset to continue scanning next item
  const handleScanNext = () => {
    setScannedBarcode(null);
    setDetectedProduct(null);
    setIsNewProduct(false);
    setFormName('');
    setFormBrand('');
    setManualCode('');
    setIsRecurring(false);
    setRecurringFreq('weekly');
    setRecurringCount(1);
    setIsScanning(true);
    startScanningLoop();
  };

  // Submit to shopping list
  const handleConfirmAdd = async () => {
    if (!formName.trim() || !scannedBarcode) return;

    let recurringRule: RecurringPurchaseRule | undefined = undefined;
    if (isRecurring) {
      recurringRule = {
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: formName.trim(),
        barcode: scannedBarcode,
        brand: formBrand.trim() || undefined,
        category: formCategory,
        retailer: formRetailer,
        quantity: formQuantity,
        unit: formUnit,
        price: formPrice,
        frequency: recurringFreq,
        count_per_cycle: recurringCount,
        active: true,
        created_at: new Date().toISOString(),
        next_due_date: new Date().toISOString(),
      };

      try {
        await apiFetch('/api/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recurringRule),
        });
      } catch (e) {
        console.warn('Failed to save recurring rule', e);
      }
    }

    const fullProduct: ProductCatalogItem = {
      barcode: scannedBarcode,
      name: formName.trim(),
      brand: formBrand.trim() || undefined,
      quantity: formQuantity,
      unit: formUnit,
      category: formCategory,
      retailer: formRetailer,
      price: formPrice,
      nutri_score: detectedProduct?.nutri_score,
      image_url: detectedProduct?.image_url,
      source: isNewProduct ? 'Eingabe' : (detectedProduct?.source || 'Scanner'),
      last_scanned_at: new Date().toISOString(),
      recurring_rule: recurringRule,
    };

    // 1. Save to local product database if toggle enabled
    if (saveToDatabase) {
      try {
        await apiFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullProduct),
        });
      } catch (e) {
        console.warn('Failed to save to product catalog', e);
      }
    }

    // 2. Add to Shopping List
    await onAddToList({
      name: fullProduct.name,
      quantity: formQuantity,
      unit: formUnit,
      category: formCategory,
      retailer: formRetailer,
      barcode: scannedBarcode,
      price: formPrice,
      is_bought: markAsBought,
      recurring_rule: recurringRule,
    });

    const freqLabel = recurringFreq === 'daily'
      ? 'täglich'
      : recurringFreq === 'weekly'
      ? 'wöchentlich'
      : recurringFreq === 'biweekly'
      ? 'alle 2 Wochen'
      : 'monatlich';

    setActionSuccessToast(
      isRecurring
        ? `„${fullProduct.name}“ als Dauer-Routine (${recurringCount}x ${freqLabel}) gesichert!`
        : `„${fullProduct.name}“ zur Einkaufsliste hinzugefügt!`
    );
    setTimeout(() => {
      setActionSuccessToast(null);
      handleScanNext();
    }, 1500);
  };

  // Submit directly to pantry
  const handleConfirmAddToPantry = async () => {
    if (!formName.trim() || !scannedBarcode || !onAddToPantry) return;

    if (saveToDatabase) {
      try {
        await apiFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcode: scannedBarcode,
            name: formName.trim(),
            brand: formBrand.trim(),
            quantity: formQuantity,
            unit: formUnit,
            category: formCategory,
            retailer: formRetailer,
            price: formPrice,
          }),
        });
      } catch (e) {}
    }

    await onAddToPantry({
      name: formName.trim(),
      quantity: formQuantity,
      unit: formUnit,
      category: formCategory,
      barcode: scannedBarcode,
    });

    setActionSuccessToast(`„${formName}“ ins Vorratslager gebucht!`);
    setTimeout(() => {
      setActionSuccessToast(null);
      handleScanNext();
    }, 1500);
  };

  // Effect to manage camera on open/close
  useEffect(() => {
    if (isOpen) {
      setScannedBarcode(null);
      setDetectedProduct(null);
      setIsScanning(true);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/70 border-b border-slate-800 text-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Live Barcode-Scanner
              </h3>
              <p className="text-[11px] text-slate-400">
                EAN-13 / Supermarkt-Codes automatisch erfassen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl border text-xs font-bold transition ${
                  torchEnabled
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Taschenlampe / Blitzlicht"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {actionSuccessToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-black flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{actionSuccessToast}</span>
          </div>
        )}

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* CAMERA VIEWFINDER (when scanning) */}
          {isScanning && (
            <div className="relative aspect-4/3 w-full bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="relative w-64 h-36 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center overflow-hidden">
                  {/* Laser Scan Line Animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse transition-all duration-75"
                    style={{
                      animation: 'scanLine 2s ease-in-out infinite',
                    }}
                  />
                  {/* Target Corners */}
                  <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-300" />
                  <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-300" />
                  <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-300" />
                  <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-300" />
                </div>
                <div className="mt-3 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 backdrop-blur-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Barcode im Rahmen zentrieren
                  </span>
                </div>
              </div>

              {/* Camera Error / Permission Fallback */}
              {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <div className="text-white text-sm font-bold">Kamerazugriff erforderlich</div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {cameraError || 'Bitte erlaube der FitPlaner App den Zugriff auf die Smartphone-Kamera.'}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition"
                  >
                    Kamera erneut versuchen
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DETECTED PRODUCT SHEET */}
          {scannedBarcode && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 text-white space-y-4 animate-fadeIn">
              {isLoadingLookup ? (
                <div className="py-8 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                  <div className="text-sm font-bold text-slate-300">
                    Produktdatenbank & Open Food Facts abfragen...
                  </div>
                  <div className="text-xs text-slate-500 font-mono">{scannedBarcode}</div>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                        EAN: {scannedBarcode}
                      </span>
                      {detectedProduct?.nutri_score && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          detectedProduct.nutri_score === 'A' ? 'bg-emerald-600 text-white' :
                          detectedProduct.nutri_score === 'B' ? 'bg-lime-600 text-white' :
                          detectedProduct.nutri_score === 'C' ? 'bg-amber-600 text-white' :
                          'bg-red-600 text-white'
                        }`}>
                          Nutri-Score {detectedProduct.nutri_score}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleScanNext}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Neu scannen</span>
                    </button>
                  </div>

                  {isNewProduct && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">✨ Neues Produkt!</span>
                        Noch nicht in der Datenbank. Vergib Name & Details – das Produkt wird dauerhaft gespeichert!
                      </div>
                    </div>
                  )}

                  {/* Form fields */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Produktname:</label>
                      <input
                        type="text"
                        placeholder="z.B. Bio Haferflocken 500g"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Marke / Hersteller:</label>
                        <input
                          type="text"
                          placeholder="z.B. BioBio / Netto"
                          value={formBrand}
                          onChange={(e) => setFormBrand(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Supermarkt / Drogerie:</label>
                        <select
                          value={formRetailer}
                          onChange={(e) => setFormRetailer(e.target.value as Retailer)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none"
                        >
                          <option value="Netto">🟡 Netto Marken-Discount</option>
                          <option value="NP">🔴 NP Supermarkt</option>
                          <option value="dm">🟣 dm Drogeriemarkt</option>
                          <option value="Rossmann">🔴 Rossmann Drogerie</option>
                          <option value="Müller">🟠 Müller Drogerie</option>
                          <option value="Apotheke">🟢 Apotheke / Gesundheit</option>
                          <option value="Tierbedarf">🐾 Tierbedarf</option>
                          <option value="Lidl">🔵 Lidl</option>
                          <option value="Aldi Süd">🔷 Aldi</option>
                          <option value="Rewe">🔴 Rewe</option>
                          <option value="Edeka">🟡 Edeka</option>
                          <option value="Kaufland">🔴 Kaufland</option>
                          <option value="Baumarkt">🔨 Baumarkt</option>
                          <option value="Sonstiges">⚪ Sonstiges</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Kategorie & Abteilung:</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none"
                      >
                        <option value="Drogerie & Körperpflege">🧴 Drogerie & Körperpflege (Shampoo, Duschgel, Zahnpasta)</option>
                        <option value="Haushalt & Reinigung">🧼 Haushalt & Reinigung (Spülmittel, Papier, Reiniger)</option>
                        <option value="Gesundheit & Apotheke">💊 Gesundheit & Vitamine (Nahrungsergänzung, Pflaster)</option>
                        <option value="Tierbedarf">🐱🐶 Haustierbedarf (Futter, Streu, Snacks)</option>
                        <option value="Baby & Familie">👶 Baby & Kind (Windeln, Feuchttücher)</option>
                        <option value="Getränke">🧃 Getränke, Wasser & Kaffee</option>
                        <option value="Obst & Gemüse">🍏 Frisches Obst & Gemüse</option>
                        <option value="Kühlregal">🥛 Kühlregal & Molkerei</option>
                        <option value="Proteinquellen">🥩 Fleisch, Fisch & Protein</option>
                        <option value="Vollkorn & Hülsenfrüchte">🌾 Vorrat & Trockenware</option>
                        <option value="Lebensmittel">🛒 Allgemeine Lebensmittel</option>
                        <option value="Non-Food & Sonstiges">📦 Non-Food & Sonstiges</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Menge:</label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.5"
                          value={formQuantity}
                          onChange={(e) => setFormQuantity(parseFloat(e.target.value) || 1)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Einheit:</label>
                        <select
                          value={formUnit}
                          onChange={(e) => setFormUnit(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none"
                        >
                          <option value="Stück">Stück</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                          <option value="Packung">Packung</option>
                          <option value="Flasche">Flasche</option>
                          <option value="Rolle">Rolle</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Preis (€):</label>
                        <input
                          type="number"
                          min="0.05"
                          step="0.10"
                          value={formPrice}
                          onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* RECURRING PURCHASE CYCLE (Abo & Haushalts-Routine) */}
                    <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-3 space-y-2.5">
                      <label className="flex items-center justify-between cursor-pointer select-none">
                        <span className="text-emerald-400 font-black flex items-center gap-1.5 text-xs">
                          <Repeat className="w-4 h-4 text-emerald-400" />
                          Wiederkehrender Kauf-Zyklus (Abo-Routine)
                        </span>
                        <input
                          type="checkbox"
                          checked={isRecurring}
                          onChange={(e) => setIsRecurring(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 bg-slate-900 border-slate-700"
                        />
                      </label>

                      {isRecurring && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-fadeIn text-[11px]">
                          <div className="text-slate-400 font-medium">
                            Kauf-Intervall festlegen:
                          </div>

                          {/* Frequency Pills */}
                          <div className="grid grid-cols-4 gap-1">
                            {(
                              [
                                { id: 'daily', label: 'Täglich' },
                                { id: 'weekly', label: 'Wöchentlich' },
                                { id: 'biweekly', label: '2-Wöchig' },
                                { id: 'monthly', label: 'Monatlich' },
                              ] as const
                            ).map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setRecurringFreq(opt.id)}
                                className={`py-1.5 px-1.5 rounded-xl font-bold text-center border transition text-[11px] ${
                                  recurringFreq === opt.id
                                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          {/* Multiplier / Count */}
                          <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                            <span className="text-slate-300 font-medium">
                              Menge pro {recurringFreq === 'daily' ? 'Tag' : recurringFreq === 'weekly' ? 'Woche' : recurringFreq === 'biweekly' ? '2 Wochen' : 'Monat'}:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setRecurringCount(Math.max(1, recurringCount - 1))}
                                className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-emerald-400 text-xs w-6 text-center">
                                {recurringCount}x
                              </span>
                              <button
                                type="button"
                                onClick={() => setRecurringCount(recurringCount + 1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                            <span>💡</span>
                            <span>Wird als Haushalts-Routine gespeichert und regelmäßig auf die Einkaufsliste gesetzt.</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Toggles */}
                    <div className="pt-2 border-t border-slate-700/60 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={markAsBought}
                          onChange={(e) => setMarkAsBought(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-900 border-slate-700"
                        />
                        <span className="text-slate-200 font-semibold">
                          🛒 Direkt als „im Wagen“ (gekauft) markieren
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={saveToDatabase}
                          onChange={(e) => setSaveToDatabase(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-900 border-slate-700"
                        />
                        <span className="text-slate-300">
                          💾 In die lokale Produktdatenbank aufnehmen
                        </span>
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmAdd}
                        disabled={!formName.trim()}
                        className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Zur Einkaufsliste</span>
                      </button>

                      {onAddToPantry && (
                        <button
                          type="button"
                          onClick={handleConfirmAddToPantry}
                          disabled={!formName.trim()}
                          className="w-full sm:w-auto py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                        >
                          <Archive className="w-4 h-4 text-amber-400" />
                          <span>Ins Vorratslager</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* MANUAL ENTRY & DEMO BARCODES (always accessible) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-xs text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                Barcode manuell eingeben / Schnell-Test
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="EAN-13 Code (z.B. 4014400900010)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualCode.trim()) {
                    handleBarcodeDetected(manualCode.trim());
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                disabled={!manualCode.trim()}
                onClick={() => handleBarcodeDetected(manualCode.trim())}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold active:scale-95 transition"
              >
                Prüfen
              </button>
            </div>

            {/* Quick Demo Buttons */}
            <div>
              <span className="text-[10px] text-slate-500 block mb-1.5 font-bold uppercase tracking-wider">
                Demo-Barcodes zum Sofort-Testen:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_BARCODES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleBarcodeDetected(item.code)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700/60 active:scale-95 transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800 text-center text-[10px] text-slate-500">
          Unterstützt alle EAN-13, EAN-8, Code-128 & QR-Codes • Automatische Synchronisation mit Open Food Facts & lokaler Datenbank
        </div>
      </div>
    </div>
  );
};

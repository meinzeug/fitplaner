import React, { useState, useEffect, useRef } from 'react';
import { ShoppingList, ShoppingItem, FamilyMember } from '../types';
import {
  Sparkles, Camera, Copy, Check, ExternalLink, X, ShieldAlert,
  Volume2, VolumeX, Store, Compass, ArrowRight, CheckCircle2,
  ChevronRight, RefreshCw, Smartphone
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shoppingList: ShoppingList | null;
  familyMembers: FamilyMember[];
  selectedStoreFilter?: string;
  checkedMap?: Record<string, boolean>;
  onToggleCheck?: (key: string) => void;
}

export const ChatGptLiveModal: React.FC<Props> = ({
  isOpen,
  onClose,
  shoppingList,
  familyMembers,
  selectedStoreFilter = 'all',
  checkedMap = {},
  onToggleCheck,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen || !shoppingList) return null;

  // Flatten items for current store filter
  const allItems: (ShoppingItem & { store: string; key: string })[] = [];
  const storeBuckets: [string, ShoppingItem[]][] = [
    ['Netto', shoppingList.items_netto || []],
    ['NP', shoppingList.items_np || []],
    ['Lidl', shoppingList.items_lidl || []],
    ['Aldi', shoppingList.items_aldi || []],
    ['Rewe', shoppingList.items_rewe || []],
    ['Kaufland', shoppingList.items_kaufland || []],
    ['Edeka', shoppingList.items_edeka || []],
    ['Vorrat', shoppingList.items_pantry || []],
  ];

  storeBuckets.forEach(([store, items]) => {
    if (selectedStoreFilter === 'all' || selectedStoreFilter === store) {
      items.forEach((it) => {
        allItems.push({
          ...it,
          store,
          key: `${store}-${it.name}`,
        });
      });
    }
  });

  const uncheckedItems = allItems.filter((it) => !checkedMap[it.key]);
  const activeItems = uncheckedItems.length > 0 ? uncheckedItems : allItems;
  const currentItem = activeItems[Math.min(currentItemIndex, activeItems.length - 1)];

  // Extract strict family allergy & dislike constraints
  const familyConstraints: { name: string; allergies: string[]; dislikes: string[] }[] = [];
  familyMembers.forEach((m) => {
    if ((m.allergies && m.allergies.length > 0) || (m.disliked_foods && m.disliked_foods.length > 0)) {
      familyConstraints.push({
        name: m.name,
        allergies: m.allergies || [],
        dislikes: m.disliked_foods || [],
      });
    }
  });

  // Group items by category / aisle
  const itemsByAisle: Record<string, typeof allItems> = {};
  allItems.forEach((it) => {
    const aisle = it.aisle || it.category || 'Allgemein';
    if (!itemsByAisle[aisle]) itemsByAisle[aisle] = [];
    itemsByAisle[aisle].push(it);
  });

  // Generate comprehensive ChatGPT Live Shopping Prompt
  const generatePrompt = (): string => {
    const storeLabel = selectedStoreFilter === 'all' ? 'Supermarkt (Netto & NP)' : selectedStoreFilter;

    let text = `Du bist mein persönlicher Live-Einkaufsbegleiter im Supermarkt (${storeLabel}). `;
    text += `Ich habe meine Kamera und Sprachfunktion aktiviert und du begleitest mich jetzt Schritt für Schritt durch meinen Einkauf.\n\n`;

    text += `⚠️ STRENGSTE FAMILIEN-SICHERHEITSREGELN (ALLERGIEN & ABNEIGUNGEN):\n`;
    if (familyConstraints.length > 0) {
      familyConstraints.forEach((c) => {
        text += `- ${c.name}: `;
        if (c.allergies.length > 0) text += `ALLERGIE gegen [${c.allergies.join(', ').toUpperCase()}]. `;
        if (c.dislikes.length > 0) text += `Mag absolut NICHT [${c.dislikes.join(', ')}]. `;
        text += `\n`;
      });
      text += `-> WICHTIG: Sobald ich dir ein Produkt oder eine Zutatenliste in die Kamera halte, prüfe SOFORT, ob Fisch, Fischöl, Lachs oder andere Allergene der Familie enthalten sind, und warne mich laut & deutlich!\n\n`;
    } else {
      text += `- Keine speziellen Allergien hinterlegt, achte auf frische, gesunde Qualität.\n\n`;
    }

    text += `🔥 PROSPEKT-ANGEBOTE & ERSPARNIS:\n`;
    text += `- Achte auf Prospekt-Deals, Sonderangebote und günstige Eigenmarken. Weise mich darauf hin, wenn ein Produkt im Angebot ist oder eine billigere Alternative daneben steht.\n\n`;

    text += `🛒 EINKAUFSLISTE (${allItems.length} Artikel, sortiert nach Supermarkt-Laufweg):\n`;
    Object.entries(itemsByAisle).forEach(([aisle, items]) => {
      text += `\n[Gang: ${aisle}]\n`;
      items.forEach((it) => {
        const dealTag = it.is_on_sale ? ' [🔥 PROSPEKT-DEAL]' : '';
        const packInfo = it.packs_to_buy > 0 ? ` (${it.packs_to_buy}x ${it.pack_size || ''} ${it.unit})` : '';
        text += `• ${it.store}: ${it.exact_product_name || it.name} - ${it.total_quantity} ${it.unit}${packInfo}${dealTag}\n`;
      });
    });

    text += `\nDEINE ANWEISUNGEN FÜR UNSER LIVE-GESPRÄCH:\n`;
    text += `1. Führe mich Gang für Gang durch den Markt: Fang mit Obst & Gemüse an.\n`;
    text += `2. Sprich kurz, sympathisch und prägnant (keine langen Monologe, wir sind beim Einkaufen).\n`;
    text += `3. Wenn ich dir Produkte zeige, sag mir kurz: "Passt perfekt!" oder "Achtung, enthält Allergen/Zusatzstoffe!".\n`;
    text += `4. Wenn ein Artikel ausverkauft ist, schlage mir sofort eine gesunde, sichere Alternative vor.\n\n`;
    text += `Bist du bereit? Begrüße mich kurz und nenne mir den allerersten Artikel aus dem Obst- & Gemüse-Bereich!`;

    return text;
  };

  const promptText = generatePrompt();

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenChatGpt = async () => {
    await handleCopyPrompt();

    // Deep link or Web URL for ChatGPT
    const encoded = encodeURIComponent(promptText);
    const appDeepLink = `chatgpt://chat?prompt=${encoded}`;
    const webUrl = `https://chatgpt.com/?q=${encoded}`;

    // Attempt to open native ChatGPT app or fallback to browser
    const link = document.createElement('a');
    link.href = appDeepLink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Fallback timer to web if app link doesn't trigger
    setTimeout(() => {
      window.open(webUrl, '_blank');
    }, 400);
  };

  // In-App Camera HUD
  const startCamera = async () => {
    try {
      setCameraError(null);
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
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Kamera-Zugriff nicht möglich. Bitte Berechtigung in Android erteilen oder extern zu ChatGPT wechseln.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleVoiceSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleNextItem = () => {
    if (currentItem && onToggleCheck) {
      onToggleCheck(currentItem.key);
    }
    setCurrentItemIndex((prev) => (prev + 1) % Math.max(1, activeItems.length));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">KI-Einkaufsbegleiter</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                  LIVE KAMERA & CHATGPT
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Begleiteter Supermarkt-Einkauf mit Echtzeit-Sprache & Kamera-Erkennung
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Family Safety Alert Box */}
          {familyConstraints.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900 block text-sm">
                  Aktive Familien-Schutzregeln im Prompt integriert:
                </span>
                <ul className="mt-1 space-y-0.5 text-rose-800">
                  {familyConstraints.map((c, i) => (
                    <li key={i}>
                      • <strong className="font-semibold">{c.name}:</strong>{' '}
                      {c.allergies.length > 0 && `Allergie: ${c.allergies.join(', ')} `}
                      {c.dislikes.length > 0 && `(Mag nicht: ${c.dislikes.join(', ')})`}
                    </li>
                  ))}
                </ul>
                <span className="text-[11px] text-rose-700 font-medium block mt-1">
                  Die KI prüft jedes gefilmte Produkt streng auf diese Allergene & Abneigungen!
                </span>
              </div>
            </div>
          )}

          {/* Dual Action Launchers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Direct ChatGPT App Handover */}
            <button
              onClick={handleOpenChatGpt}
              className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-left shadow-lg transition active:scale-95 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  Empfohlen
                </span>
                <ExternalLink className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </div>
              <div>
                <div className="text-base font-black flex items-center gap-1.5 mb-1">
                  <span>🚀 In ChatGPT Live starten</span>
                </div>
                <p className="text-xs text-emerald-100 leading-snug">
                  Kopiert Liste & Allergien automatisch und öffnet ChatGPT mit aktiviertem Prompt.
                </p>
              </div>
            </button>

            {/* In-App Camera Companion HUD */}
            <button
              onClick={() => {
                if (isCameraActive) stopCamera();
                else startCamera();
              }}
              className={`p-4 rounded-2xl border font-bold text-left transition active:scale-95 flex flex-col justify-between group ${
                isCameraActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded-md">
                  {isCameraActive ? 'Kamera Aktiv' : 'In-App Begleiter'}
                </span>
                <Camera className={`w-4 h-4 ${isCameraActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              </div>
              <div>
                <div className="text-base font-black flex items-center gap-1.5 mb-1">
                  <span>📷 Live-Kamera & HUD {isCameraActive ? 'stoppen' : 'starten'}</span>
                </div>
                <p className={`text-xs leading-snug ${isCameraActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  Öffnet den Kamera-Sucher direkt in FitPlaner mit Artikel-Leitfaden.
                </p>
              </div>
            </button>
          </div>

          {/* In-App Camera Viewfinder HUD */}
          {isCameraActive && (
            <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-emerald-500 shadow-xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 sm:h-80 object-cover"
              />

              {/* Viewfinder Target Frame */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="w-full h-full border-2 border-dashed border-emerald-400/70 rounded-2xl flex items-center justify-center">
                  <span className="bg-black/60 backdrop-blur-sm text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full">
                    Produkt / Zutatenliste hierhin halten
                  </span>
                </div>
              </div>

              {/* Top Warning Ribbon in HUD */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/10">
                  <Store className="w-3.5 h-3.5 text-emerald-400" />
                  {currentItem?.store || 'Supermarkt'}
                </span>
                <span className="bg-rose-600/90 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-xs">
                  ⚠️ Fisch- & Lachs-Check
                </span>
              </div>

              {/* Bottom Current Item Bar in HUD */}
              {currentItem && (
                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-white flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Aktueller Artikel ({currentItemIndex + 1} / {activeItems.length})
                    </div>
                    <div className="font-bold text-sm truncate">{currentItem.exact_product_name || currentItem.name}</div>
                    <div className="text-xs text-slate-300">
                      Bedarf: {currentItem.total_quantity} {currentItem.unit}
                      {currentItem.is_on_sale && <span className="ml-1.5 text-yellow-300 font-bold">🔥 Deal</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        handleVoiceSpeak(
                          `Nächster Artikel bei ${currentItem.store}: ${currentItem.name}, ${currentItem.total_quantity} ${currentItem.unit}. Denke an die Fisch-Allergie von Dennis und Juna Fee!`
                        )
                      }
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                      title="Artikel vorlesen"
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4 text-emerald-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleNextItem}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" /> Gefunden
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              {cameraError}
            </div>
          )}

          {/* Generated Prompt Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                Vollständiger KI-Prompt für Kamera & Audio:
              </span>
              <button
                onClick={handleCopyPrompt}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 active:scale-95 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Kopiert! ✓' : 'Kopieren'}
              </button>
            </div>

            <div className="relative">
              <textarea
                readOnly
                rows={6}
                value={promptText}
                className="w-full font-mono text-xs p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 leading-relaxed resize-none focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Guide */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 text-xs text-slate-600 space-y-1.5">
            <span className="font-bold text-slate-800 block">So funktioniert der Live-Einkauf mit ChatGPT:</span>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span>Klicke auf <strong>"In ChatGPT Live starten"</strong> (Prompt wird kopiert und ChatGPT geöffnet).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span>Tippe in der ChatGPT App auf das <strong>Kopfhörer-Symbol (Live Audio)</strong> oder füge den Prompt ein.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span>Schalte die <strong>Kamera an</strong> und halte Produkte oder Regalschilder ins Bild. ChatGPT führt dich durch alle Gänge!</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-white transition"
          >
            Schließen
          </button>

          <button
            onClick={handleOpenChatGpt}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Jetzt an ChatGPT übergeben</span>
          </button>
        </div>
      </div>
    </div>
  );
};

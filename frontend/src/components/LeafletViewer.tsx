import React, { useState } from 'react';
import { LeafletBrochure } from '../types';
import { BookOpen, ExternalLink, ChevronLeft, ChevronRight, Tag, Sparkles, PlusCircle } from 'lucide-react';

interface Props {
  leaflets: LeafletBrochure[];
  onAddCustomItem: (name: string, retailer: any) => Promise<void>;
}

const RETAILER_CONFIG: Record<string, { label: string; activeClass: string; icon: string }> = {
  'Netto': { label: 'Netto Marken-Discount', activeClass: 'bg-amber-400 text-stone-900 shadow-md', icon: '🟡' },
  'NP': { label: 'NP Discount', activeClass: 'bg-red-600 text-white shadow-md', icon: '🔴' },
  'Lidl': { label: 'Lidl', activeClass: 'bg-blue-600 text-white shadow-md', icon: '🔵' },
  'Aldi Nord': { label: 'Aldi Nord', activeClass: 'bg-sky-800 text-white shadow-md', icon: '🔷' },
  'Aldi Süd': { label: 'Aldi Süd', activeClass: 'bg-indigo-900 text-white shadow-md', icon: '🔷' },
  'Rewe': { label: 'Rewe', activeClass: 'bg-red-700 text-white shadow-md', icon: '🔴' },
  'Kaufland': { label: 'Kaufland', activeClass: 'bg-rose-900 text-white shadow-md', icon: '🔴' },
  'Edeka': { label: 'Edeka', activeClass: 'bg-yellow-400 text-blue-950 shadow-md', icon: '🟡' },
};

export const LeafletViewer: React.FC<Props> = ({ leaflets, onAddCustomItem }) => {
  const [selectedRetailer, setSelectedRetailer] = useState<string>('Netto');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const activeBrochure = leaflets.find((l) => l.retailer.toLowerCase() === selectedRetailer.toLowerCase()) || leaflets[0];
  const pages = activeBrochure?.pages || [];
  const currentPage = pages[currentPageIndex] || pages[0];

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleAddDealToShopping = async (title: string) => {
    await onAddCustomItem(title, selectedRetailer);
    setAddedToast(title);
    setTimeout(() => setAddedToast(null), 2500);
  };

  if (!activeBrochure) {
    return <div className="p-8 text-center text-slate-500">Keine Prospekte verfügbar.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Digitale Supermarkt-Prospekte</h2>
          </div>
          <p className="text-xs text-slate-500">
            Gültig vom {activeBrochure.valid_from} bis {activeBrochure.valid_to} • Blättere durch die aktuellen Wochenangebote
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={activeBrochure.online_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <span>Original-Onlineprospekt</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Multi-Retailer Switcher Pills */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-thin">
        {Object.entries(RETAILER_CONFIG).map(([retKey, conf]) => {
          const isSelected = selectedRetailer.toLowerCase() === retKey.toLowerCase();
          const hasBrochure = leaflets.some((l) => l.retailer.toLowerCase() === retKey.toLowerCase());
          return (
            <button
              key={retKey}
              onClick={() => {
                setSelectedRetailer(retKey);
                setCurrentPageIndex(0);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition flex items-center gap-1.5 ${
                isSelected
                  ? conf.activeClass
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              } ${!hasBrochure ? 'opacity-50' : ''}`}
            >
              <span>{conf.icon}</span>
              <span>{conf.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toast */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-500 animate-bounce text-xs font-bold">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>„{addedToast}“ auf die Einkaufsliste gesetzt!</span>
        </div>
      )}

      {/* Leaflet Page Viewer */}
      {currentPage && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Leaflet Page Display (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800 relative flex flex-col">
            {/* Top Toolbar */}
            <div className="bg-slate-950/80 backdrop-blur-md px-6 py-3 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  Seite {currentPage.page_number} von {pages.length}
                </span>
                <span className="text-xs text-slate-400">• {currentPage.title}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPageIndex === 0}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white flex items-center justify-center transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPageIndex === pages.length - 1}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white flex items-center justify-center transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Page Image with Hotspot Deals */}
            <div className="relative min-h-[480px] sm:min-h-[580px] bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={currentPage.image_url}
                alt={currentPage.title}
                className="w-full h-full object-cover max-h-[680px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Deals on this page floating */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
                {currentPage.deals.map((deal, idx) => (
                  <div
                    key={idx}
                    className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/40 shadow-lg text-slate-900 flex items-center gap-3 animate-fadeIn"
                  >
                    <div>
                      <span className="font-bold text-xs block leading-tight">{deal.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-emerald-700 font-black text-sm">{deal.price.toFixed(2)} €</span>
                        {deal.savings && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.2 rounded">
                            -{deal.savings}%
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddDealToShopping(deal.title)}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow"
                      title="Auf Einkaufsliste setzen"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Page Thumbnails & Direct Deals List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Page Navigation Thumbnails */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                Prospekt-Seiten
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {pages.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`p-2 rounded-2xl border text-center transition ${
                      currentPageIndex === idx
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="h-16 w-full rounded-xl bg-slate-100 overflow-hidden mb-1.5">
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 block">S. {p.page_number}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Deals on this page breakdown */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Angebote dieser Seite ({currentPage.deals.length})
              </h3>
              <div className="space-y-2.5">
                {currentPage.deals.map((deal, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-800 block leading-tight">{deal.title}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{deal.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-emerald-700 font-mono">{deal.price.toFixed(2)} €</span>
                      <button
                        onClick={() => handleAddDealToShopping(deal.title)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                      >
                        + Liste
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import {
  Compass,
  Map,
  Search,
  BookOpen,
  ExternalLink,
  Info,
  Sparkles,
  Trophy,
  Layers,
  Camera,
  Building,
  Eye,
  FileDown,
} from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';
import { AudioController } from './AudioController';

export const HeaderNavbar: React.FC = () => {
  const { currentWing, activeModal, salonInfo } = useExhibitionStore();

  const getWingIcon = (id: string) => {
    switch (id) {
      case 'foyer': return <Sparkles size={14} className="text-amber-400" />;
      case 'awards': return <Trophy size={14} className="text-yellow-400" />;
      case 'monochrome': return <Layers size={14} className="text-slate-300" />;
      case 'nature': return <Compass size={14} className="text-emerald-400" />;
      case 'street': return <Camera size={14} className="text-orange-400" />;
      case 'architecture': return <Building size={14} className="text-cyan-400" />;
      case 'creative': return <Eye size={14} className="text-purple-400" />;
      default: return <Compass size={14} />;
    }
  };

  return (
    <header className="fixed top-3 inset-x-3 sm:inset-x-6 z-40 flex items-center justify-between pointer-events-none">
      {/* Brand & Salon Title */}
      <div className="flex items-center gap-3 glass-panel px-3.5 py-2 rounded-2xl pointer-events-auto shadow-2xl border border-amber-500/20">
        <div className="flex items-center gap-2">
          <img
            src="/logos/school_crest.png"
            alt="Rajapaksa Central College"
            className="h-8 w-auto object-contain filter drop-shadow"
          />
          <img
            src="/logos/chayaksha_logo.png"
            alt="Chayaksha 26'"
            className="h-7 w-auto object-contain filter drop-shadow"
          />
          <img
            src="/logos/radapasa_media_unit.png"
            alt="Radapasa Media Unit"
            className="h-7 w-auto object-contain filter drop-shadow hidden sm:block"
          />
        </div>
        <div className="flex flex-col border-l border-slate-700/60 pl-2.5">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black text-xs sm:text-sm tracking-widest text-poster-gold">
              CHAYAKSHA 26'
            </span>
            <span className="hidden lg:inline-block text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              RMU Live
            </span>
          </div>
          <span className="text-[10px] text-amber-300/90 hidden sm:block tracking-wide">
            Rajapaksa Central College, Weeraketiya
          </span>
        </div>

        {/* Current Wing indicator pill */}
        <div className="hidden md:flex items-center gap-1.5 pl-3 ml-1 border-l border-slate-700/60 text-xs text-slate-300">
          {getWingIcon(currentWing.id)}
          <span className="font-medium text-slate-200">{currentWing.name}</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-2xl pointer-events-auto shadow-2xl">
        {/* Soundscape Visualizer / Toggle */}
        <AudioController />

        {/* Catalog PDF Download (if uploaded/imported) */}
        {salonInfo.catalogPdfUrl && (
          <a
            href={salonInfo.catalogPdfUrl}
            download={salonInfo.catalogPdfName || 'Chayaksha_26_Catalogue.pdf'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-300 border border-amber-500/40 hover:from-amber-500 hover:to-yellow-400 hover:text-slate-950 transition-all shadow"
            title="Download Official Exhibition Catalog PDF"
          >
            <FileDown size={14} />
            <span className="hidden md:inline">Catalog PDF</span>
          </a>
        )}

        {/* Floor Plan */}
        <button
          onClick={() => exhibitionStore.setActiveModal(activeModal === 'floorplan' ? null : 'floorplan')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            activeModal === 'floorplan'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/25'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Architectural Floor Plan & Teleport"
        >
          <Map size={15} />
          <span className="hidden sm:inline">Floor Plan</span>
        </button>

        {/* Salon Catalogue */}
        <button
          onClick={() => exhibitionStore.setActiveModal(activeModal === 'catalogue' ? null : 'catalogue')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            activeModal === 'catalogue'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/25'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Search Salon Catalogue"
        >
          <Search size={15} />
          <span className="hidden sm:inline">Catalogue</span>
        </button>

        {/* Visitor Guestbook */}
        <button
          onClick={() => exhibitionStore.setActiveModal(activeModal === 'guestbook' ? null : 'guestbook')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            activeModal === 'guestbook'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/25'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Salon Guestbook"
        >
          <BookOpen size={15} />
          <span className="hidden sm:inline">Guestbook</span>
        </button>

        {/* IAAP Results Page Link */}
        {salonInfo.iaapResultsUrl && (
          <a
            href={salonInfo.iaapResultsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow cursor-pointer"
            title="Official IAAP Salon Results Page"
          >
            <ExternalLink size={14} />
            <span className="hidden md:inline">IAAP Results</span>
          </a>
        )}

        {/* Salon Info */}
        <button
          onClick={() => exhibitionStore.setActiveModal(activeModal === 'info' ? null : 'info')}
          className={`p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ${
            activeModal === 'info' ? 'text-amber-400' : ''
          }`}
          title="Salon Patronage & Jury Info"
        >
          <Info size={16} />
        </button>
      </div>
    </header>
  );
};

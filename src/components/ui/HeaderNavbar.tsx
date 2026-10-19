import React from 'react';
import {
  Compass,
  Map,
  Search,
  BookOpen,
  Sliders,
  Info,
  Sparkles,
  Trophy,
  Layers,
  Camera,
  Building,
  Eye,
} from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';
import { AudioController } from './AudioController';

export const HeaderNavbar: React.FC = () => {
  const { currentWing, activeModal } = useExhibitionStore();

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
      <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-2xl pointer-events-auto shadow-2xl">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Eye size={18} className="text-slate-950 font-bold" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm tracking-widest text-slate-100">
              CHAYAKSHA
            </span>
            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              2026
            </span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
            छाय • आक्ष | Virtual Photography Salon
          </span>
        </div>

        {/* Current Wing indicator pill */}
        <div className="hidden md:flex items-center gap-1.5 pl-3 ml-2 border-l border-slate-700/60 text-xs text-slate-300">
          {getWingIcon(currentWing.id)}
          <span className="font-medium text-slate-200">{currentWing.name}</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-2xl pointer-events-auto shadow-2xl">
        {/* Soundscape Visualizer / Toggle */}
        <AudioController />

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

        {/* Curator Studio Drawer */}
        <button
          onClick={() => exhibitionStore.setActiveModal(activeModal === 'curator' ? null : 'curator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
            activeModal === 'curator'
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-lg shadow-amber-500/25'
              : 'text-amber-300 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20'
          }`}
          title="Curator Administration Suite"
        >
          <Sliders size={15} />
          <span className="hidden md:inline">Curator Portal</span>
        </button>

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

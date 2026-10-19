import React, { useState } from 'react';
import { GalleryCanvas } from './components/3d/GalleryCanvas';
import { GalleryScene } from './components/3d/GalleryScene';
import { HeaderNavbar } from './components/ui/HeaderNavbar';
import { NavigationHUD } from './components/ui/NavigationHUD';
import { ArchivalViewerModal } from './components/ui/ArchivalViewerModal';
import { FloorPlanModal } from './components/ui/FloorPlanModal';
import { SalonCatalogueModal } from './components/ui/SalonCatalogueModal';
import { GuestbookModal } from './components/ui/GuestbookModal';
import { CuratorStudioModal } from './components/ui/CuratorStudioModal';
import { SalonInfoModal } from './components/ui/SalonInfoModal';
import { useExhibitionStore, exhibitionStore } from './store/exhibitionStore';
import { Volume2, Sparkles, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const [sceneInstance, setSceneInstance] = useState<GalleryScene | null>(null);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(true);

  const { activeModal, activeArtwork } = useExhibitionStore();

  const handleStartExperience = (withAudio: boolean) => {
    setShowWelcomeIntro(false);
    if (withAudio) {
      exhibitionStore.toggleAudio();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-slate-100 select-none">
      {/* 3D WebGL Gallery Canvas */}
      <GalleryCanvas onSceneReady={setSceneInstance} />

      {/* Floating Glassmorphic Top Navbar */}
      <HeaderNavbar />

      {/* Navigation HUD (Desktop Keys & Mobile Joystick) */}
      <NavigationHUD sceneInstance={sceneInstance} />

      {/* Modals & Overlays */}
      {activeArtwork && <ArchivalViewerModal />}
      {activeModal === 'floorplan' && <FloorPlanModal />}
      {activeModal === 'catalogue' && <SalonCatalogueModal />}
      {activeModal === 'guestbook' && <GuestbookModal />}
      {activeModal === 'curator' && <CuratorStudioModal />}
      {activeModal === 'info' && <SalonInfoModal />}

      {/* Inaugural Welcome Screen (First-time visitor intro) */}
      {showWelcomeIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="w-full max-w-lg glass-panel-gold rounded-3xl p-8 text-center shadow-2xl border border-amber-500/40 relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Emblem */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
              <Sparkles size={32} />
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white tracking-wider mb-1">
              CHAYAKSHA
            </h1>
            <p className="text-xs font-mono text-amber-400 mb-4 tracking-widest uppercase">
              छाय • आक्ष | Virtual Photography Salon 2026
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Welcome to the digital sanctuary of international salon photography. Stroll through the continuous 3D hallway, inspect archival works with EXIF detail, and immerse yourself in the curated wings.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => handleStartExperience(true)}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all transform hover:scale-102 cursor-pointer"
              >
                <Volume2 size={16} />
                Enter with Ambient Soundscape
              </button>
              <button
                onClick={() => handleStartExperience(false)}
                className="py-3 px-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                Enter Silently
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-center gap-4">
              <span>FIAP Patronage 2026/184</span>
              <span>•</span>
              <span>PSA Recognition 2026-412</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

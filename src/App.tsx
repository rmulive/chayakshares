import React, { useState, useEffect } from 'react';
import { GalleryCanvas } from './components/3d/GalleryCanvas';
import { GalleryScene } from './components/3d/GalleryScene';
import { HeaderNavbar } from './components/ui/HeaderNavbar';
import { NavigationHUD } from './components/ui/NavigationHUD';
import { ArchivalViewerModal } from './components/ui/ArchivalViewerModal';
import { FloorPlanModal } from './components/ui/FloorPlanModal';
import { SalonCatalogueModal } from './components/ui/SalonCatalogueModal';
import { GuestbookModal } from './components/ui/GuestbookModal';
import { SalonInfoModal } from './components/ui/SalonInfoModal';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { useExhibitionStore, exhibitionStore } from './store/exhibitionStore';
import { ArrowRight, ExternalLink, FileDown, Eye } from 'lucide-react';

export const App: React.FC = () => {
  const [sceneInstance, setSceneInstance] = useState<GalleryScene | null>(null);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(true);

  // URL Path routing for dedicated /admin route
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const { activeModal, activeArtwork, salonInfo } = useExhibitionStore();

  const handleStartExperience = (withAudio: boolean) => {
    setShowWelcomeIntro(false);
    if (withAudio) {
      exhibitionStore.toggleAudio();
    }
  };

  // Dedicated /admin page (accessible via URL only, no public links on website)
  const isAdminRoute =
    currentPath === '/admin' ||
    currentPath === '/admin/' ||
    window.location.hash === '#/admin';

  if (isAdminRoute) {
    return (
      <AdminPortalPage
        onExit={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

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
      {activeModal === 'info' && <SalonInfoModal />}

      {/* Inaugural Welcome Screen (First-time visitor intro) */}
      {showWelcomeIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div className="w-full max-w-xl glass-panel-gold rounded-3xl p-8 text-center shadow-2xl border border-amber-500/40 relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Official Logos Trio */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <img
                src="/logos/school_crest.png"
                alt="Rajapaksa Central College"
                className="h-14 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(234,179,8,0.4)]"
              />
              <div className="h-12 w-px bg-amber-500/40" />
              <img
                src="/logos/chayaksha_logo.png"
                alt="Chayaksha 26'"
                className="h-16 w-auto object-contain filter drop-shadow-[0_2px_14px_rgba(234,179,8,0.6)]"
              />
              <div className="h-12 w-px bg-amber-500/40" />
              <img
                src="/logos/radapasa_media_unit.png"
                alt="Radapasa Media Unit"
                className="h-14 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(234,179,8,0.4)]"
              />
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-poster-gold tracking-wider mb-1">
              CHAYAKSHA 26'
            </h1>
            <p className="text-xs font-mono text-amber-300 mb-1 tracking-widest uppercase">
              Virtual Photography Exhibition 2026
            </p>
            <p className="text-xs text-amber-200/90 font-medium mb-4">
              Organized by Radapasa Media Unit • Rajapaksa Central College, Weeraketiya
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Welcome to the digital sanctuary of photography. Stroll through the uninterrupted 3D grand hallway, inspect award-winning works honoring photographer Name, Place, and School, and immerse yourself in the curated gallery wings.
            </p>

            {/* Action Buttons: Visit Exhibition, Download Catalog, IAAP Results Page */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                {/* 1. Visit Exhibition */}
                <button
                  onClick={() => handleStartExperience(true)}
                  className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all transform hover:scale-102 cursor-pointer flex-1"
                >
                  <Eye size={17} />
                  Visit Exhibition
                </button>

                {/* 2. Download Catalog */}
                {salonInfo.catalogPdfUrl ? (
                  <a
                    href={salonInfo.catalogPdfUrl}
                    download={salonInfo.catalogPdfName || 'Chayaksha_26_Catalogue.pdf'}
                    className="py-3 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                  >
                    <FileDown size={15} />
                    Download Catalog
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      setShowWelcomeIntro(false);
                      exhibitionStore.setActiveModal('catalogue');
                    }}
                    className="py-3 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                  >
                    <FileDown size={15} />
                    View Catalogue
                  </button>
                )}

                {/* 3. IAAP Results Page */}
                {salonInfo.iaapResultsUrl && (
                  <a
                    href={salonInfo.iaapResultsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                  >
                    <ExternalLink size={15} />
                    IAAP Results Page
                  </a>
                )}
              </div>

              {/* Silent Entrance Option */}
              <button
                onClick={() => handleStartExperience(false)}
                className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Enter Silently without Soundscape</span>
                <ArrowRight size={11} />
              </button>
            </div>

            {/* Dynamic Patronages Footer (Admin controlled) */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-center gap-3 flex-wrap">
              {salonInfo.patronageList && salonInfo.patronageList.length > 0 ? (
                salonInfo.patronageList.map((p, idx) => (
                  <React.Fragment key={p.id}>
                    {idx > 0 && <span>•</span>}
                    <span className="text-amber-300/90 font-semibold">{p.organization} Patronage: {p.patronageNumber}</span>
                  </React.Fragment>
                ))
              ) : (
                <span className="text-amber-300/80">International Association of Art Photographers</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

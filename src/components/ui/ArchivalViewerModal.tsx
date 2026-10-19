import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Camera,
  MapPin,
  Calendar,
  Award,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';

export const ArchivalViewerModal: React.FC = () => {
  const { activeArtwork, artworks } = useExhibitionStore();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const startPanRef = useRef({ x: 0, y: 0 });

  // Reset zoom on artwork change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [activeArtwork?.id]);

  if (!activeArtwork) return null;

  // Find index for Previous / Next
  const currentIndex = artworks.findIndex(a => a.id === activeArtwork.id);
  const prevArtwork = currentIndex > 0 ? artworks[currentIndex - 1] : artworks[artworks.length - 1];
  const nextArtwork = currentIndex < artworks.length - 1 ? artworks[currentIndex + 1] : artworks[0];

  const handleZoom = (factor: number) => {
    setZoom(prev => {
      const next = Math.max(1, Math.min(4, prev + factor));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.25 : -0.25;
    handleZoom(factor);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsPanning(true);
      startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoom > 1) {
      setPan({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isAward = activeArtwork.awardTier !== 'Salon Acceptance';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fadeIn select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-8 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: Artwork Title & Award Badge */}
        <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-2xl pointer-events-auto">
          <div className="flex flex-col">
            <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide">
              {activeArtwork.title}
            </h3>
            <span className="text-xs text-slate-300">
              {activeArtwork.photographer} {activeArtwork.photographerHonors && `(${activeArtwork.photographerHonors})`} • {activeArtwork.country}
            </span>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ml-2 border ${
              isAward
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {activeArtwork.awardTier}
          </span>
        </div>

        {/* Right: Inspection Toolbar & Close */}
        <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-2xl pointer-events-auto">
          <button
            onClick={() => handleZoom(0.35)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => handleZoom(-0.35)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw size={17} />
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className={`p-2 rounded-xl transition-colors ${showMetadata ? 'text-amber-400 bg-slate-800/80' : 'text-slate-400 hover:text-white'}`}
            title="Toggle Archival Data Panel"
          >
            <Sliders size={18} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            onClick={() => exhibitionStore.setActiveArtwork(null)}
            className="p-2 text-slate-300 hover:text-red-400 hover:bg-slate-800/80 rounded-xl transition-colors"
            title="Close Inspection"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Viewing Canvas */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing p-4 pt-20 pb-16"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <div
          className="relative transition-transform duration-75 ease-out shadow-2xl max-w-full max-h-full flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <img
            src={activeArtwork.imageUrl}
            alt={activeArtwork.title}
            className="max-h-[82vh] max-w-[85vw] object-contain rounded-md shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-slate-800/80 pointer-events-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Navigation Arrows (Prev / Next) */}
      <button
        onClick={() => exhibitionStore.setActiveArtwork(prevArtwork, true)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full glass-panel text-slate-300 hover:text-white hover:bg-slate-800 transition-all shadow-xl"
        title={`Previous: ${prevArtwork.title}`}
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={() => exhibitionStore.setActiveArtwork(nextArtwork, true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full glass-panel text-slate-300 hover:text-white hover:bg-slate-800 transition-all shadow-xl"
        title={`Next: ${nextArtwork.title}`}
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide-out Archival Metadata Card */}
      {showMetadata && (
        <div className="absolute right-4 bottom-4 sm:bottom-6 sm:right-6 w-full max-w-sm glass-panel rounded-2xl p-5 z-40 border border-slate-700/80 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-serif font-bold text-xs uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Award size={14} /> Archival Salon Record
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ID: {activeArtwork.id}
            </span>
          </div>

          {/* Description & Statement */}
          <div className="py-3 border-b border-slate-800/80">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{activeArtwork.description}"
            </p>
            {activeArtwork.curatorNote && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                <span className="font-semibold text-amber-300 block mb-0.5">Jury Critique:</span>
                {activeArtwork.curatorNote}
              </div>
            )}
          </div>

          {/* Technical Camera EXIF Grid */}
          <div className="py-3">
            <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera size={13} /> Technical EXIF Capture
            </h5>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Camera</span>
                <span className="text-slate-200 font-medium truncate block">{activeArtwork.exif.camera}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Lens</span>
                <span className="text-slate-200 font-medium truncate block">{activeArtwork.exif.lens}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Exposure</span>
                <span className="text-slate-200 font-mono font-medium">{activeArtwork.exif.aperture} • {activeArtwork.exif.shutterSpeed}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Sensitivity & Focal</span>
                <span className="text-slate-200 font-mono font-medium">ISO {activeArtwork.exif.iso} • {activeArtwork.exif.focalLength}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-amber-400" /> {activeArtwork.exif.location}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar size={12} /> {activeArtwork.exif.year}
              </span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => {
              exhibitionStore.setActiveArtwork(activeArtwork, true);
              setShowMetadata(false);
            }}
            className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
          >
            <ExternalLink size={14} />
            Stand Before Artwork in 3D Gallery
          </button>
        </div>
      )}
    </div>
  );
};

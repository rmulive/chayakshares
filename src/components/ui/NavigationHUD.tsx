import React, { useState, useEffect, useRef } from 'react';
import { Home, MousePointer, Play, Pause, Eye, Zap } from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';
import { GalleryScene } from '../3d/GalleryScene';

interface NavigationHUDProps {
  sceneInstance: GalleryScene | null;
}

export const NavigationHUD: React.FC<NavigationHUDProps> = ({ sceneInstance }) => {
  const { currentWing } = useExhibitionStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isCinematic, setIsCinematic] = useState(false);
  const [focusedTitle, setFocusedTitle] = useState<string | null>(null);

  // Mobile virtual joystick state
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickStickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Poll for focused artwork and cinematic tour status
  useEffect(() => {
    const interval = setInterval(() => {
      if (sceneInstance) {
        setIsCinematic(sceneInstance.controller.isCinematicTour);
        setFocusedTitle(sceneInstance.focusedArtwork?.title || null);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [sceneInstance]);

  const handleToggleCinematicTour = () => {
    if (!sceneInstance) return;
    if (sceneInstance.controller.isCinematicTour) {
      sceneInstance.controller.stopCinematicTour();
      setIsCinematic(false);
    } else {
      sceneInstance.controller.startCinematicTour();
      setIsCinematic(true);
    }
  };

  const handleReturnToFoyer = () => {
    if (sceneInstance?.controller.isCinematicTour) {
      sceneInstance.controller.stopCinematicTour();
      setIsCinematic(false);
    }
    exhibitionStore.teleportTo(0, 1.7, 4.0, 0, 30);
  };

  // Joystick touch handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDraggingJoystick(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingJoystick) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingJoystick(false);
    setJoystickPos({ x: 0, y: 0 });
    touchIdRef.current = null;
    if (sceneInstance) {
      sceneInstance.controller.virtualJoystick = { x: 0, y: 0 };
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current || !sceneInstance) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(deltaY, deltaX);

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    setJoystickPos({ x: stickX, y: stickY });

    sceneInstance.controller.virtualJoystick = {
      x: stickX / maxRadius,
      y: stickY / maxRadius,
    };
  };

  return (
    <>
      {/* Center Screen Interactive Focus Reticle */}
      {!isMobile && (
        <div className="fixed inset-0 pointer-events-none z-20 flex items-center justify-center">
          {focusedTitle ? (
            <div className="flex flex-col items-center animate-fadeIn">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/50 flex items-center justify-center animate-pulse">
                <Eye size={14} className="text-amber-300" />
              </div>
              <div className="mt-2 px-3 py-1 rounded-full glass-panel text-[11px] font-medium text-amber-300 border border-amber-500/40 shadow-xl whitespace-nowrap">
                <span className="font-mono font-bold bg-amber-400/20 px-1.5 py-0.5 rounded mr-1.5">E / CLICK</span>
                Inspect "{focusedTitle}"
              </div>
            </div>
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 ring-4 ring-black/20" />
          )}
        </div>
      )}

      {/* Bottom HUD Bar */}
      <div className="fixed inset-x-0 bottom-4 pointer-events-none z-30 flex items-end justify-between px-4 sm:px-6">
        {/* Left: Desktop Controls OR Mobile Virtual Joystick */}
        <div className="pointer-events-auto">
          {isMobile ? (
            <div
              ref={joystickBaseRef}
              onTouchStart={handleJoystickTouchStart}
              onTouchMove={handleJoystickTouchMove}
              onTouchEnd={handleJoystickTouchEnd}
              className="w-28 h-28 rounded-full bg-slate-900/60 border-2 border-slate-700/60 backdrop-blur-md relative flex items-center justify-center shadow-2xl active:border-amber-400 touch-none select-none"
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-30 text-white text-[10px] pointer-events-none font-bold">
                WALK
              </div>
              <div
                ref={joystickStickRef}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-lg shadow-amber-500/30 border-2 border-white pointer-events-none transition-transform duration-75"
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                }}
              />
            </div>
          ) : (
            <div className="glass-panel px-3.5 py-2 rounded-2xl flex items-center gap-3 text-xs text-slate-300 shadow-xl border border-slate-700/60">
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-amber-300 font-bold">W</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-amber-300 font-bold">A</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-amber-300 font-bold">S</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-amber-300 font-bold">D</span>
                <span className="text-[11px] text-slate-400 ml-1">Walk</span>
              </div>
              <div className="h-3 w-px bg-slate-700" />
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Zap size={12} className="text-amber-400" />
                <span>Shift Sprint</span>
              </div>
              <div className="h-3 w-px bg-slate-700" />
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <MousePointer size={12} className="text-amber-400" />
                <span>Click Canvas to Look Freely</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Cinematic Guided Auto-Tour Mode */}
          <button
            onClick={handleToggleCinematicTour}
            className={`glass-panel px-3 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xl ${
              isCinematic
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30'
                : 'text-slate-300 hover:text-white hover:border-amber-400/50'
            }`}
            title={isCinematic ? 'Stop Guided Tour' : 'Start Cinematic Guided Tour'}
          >
            {isCinematic ? <Pause size={14} /> : <Play size={14} className="text-amber-400" />}
            <span className="hidden sm:inline">{isCinematic ? 'Touring...' : 'Cinematic Tour'}</span>
          </button>

          {/* Return to Grand Foyer */}
          <button
            onClick={handleReturnToFoyer}
            className="glass-panel px-3 py-2 rounded-2xl text-xs font-medium text-slate-300 hover:text-white hover:border-amber-400/50 flex items-center gap-1.5 transition-all shadow-xl"
            title="Return to Grand Entrance Foyer"
          >
            <Home size={15} className="text-amber-400" />
            <span className="hidden sm:inline">Grand Foyer</span>
          </button>

          {/* Current Wing Pill */}
          <div className="glass-panel px-3.5 py-2 rounded-2xl text-xs font-semibold text-amber-300 flex items-center gap-1.5 shadow-xl border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{currentWing.name}</span>
          </div>
        </div>
      </div>
    </>
  );
};

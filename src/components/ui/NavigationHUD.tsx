import React, { useState, useEffect, useRef } from 'react';
import { Home, MousePointer } from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';
import { GalleryScene } from '../3d/GalleryScene';

interface NavigationHUDProps {
  sceneInstance: GalleryScene | null;
}

export const NavigationHUD: React.FC<NavigationHUDProps> = ({ sceneInstance }) => {
  const { currentWing } = useExhibitionStore();
  const [isMobile, setIsMobile] = useState(false);

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

  const handleReturnToFoyer = () => {
    exhibitionStore.teleportTo(0, 1.7, 4.5, 0, 15);
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

    // Send normalized vector to camera controller (-1 to +1)
    sceneInstance.controller.virtualJoystick = {
      x: stickX / maxRadius,
      y: stickY / maxRadius,
    };
  };

  return (
    <div className="fixed inset-x-0 bottom-4 pointer-events-none z-30 flex items-end justify-between px-4 sm:px-6">
      {/* Left side: Desktop controls helper OR Mobile Virtual Joystick */}
      <div className="pointer-events-auto">
        {isMobile ? (
          /* Mobile Virtual Thumb Joystick */
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
            {/* Joystick Thumb Stick */}
            <div
              ref={joystickStickRef}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-lg shadow-amber-500/30 border-2 border-white pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              }}
            />
          </div>
        ) : (
          /* Desktop Keyboard Guide */
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
              <MousePointer size={12} className="text-amber-400" />
              <span>Drag to Look</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">CLICK</span>
              <span>Inspect Artwork</span>
            </div>
          </div>
        )}
      </div>

      {/* Right side: Quick Jump actions & Salon Info */}
      <div className="pointer-events-auto flex items-center gap-2">
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
  );
};

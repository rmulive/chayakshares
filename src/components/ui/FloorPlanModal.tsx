import React from 'react';
import { X, Navigation, Trophy, Sparkles, Layers, Compass, Camera, Building, Eye } from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';

export const FloorPlanModal: React.FC = () => {
  const { wings, cameraPosition, currentWing } = useExhibitionStore();

  const handleTeleportToWing = (wingId: string) => {
    const wing = wings.find(w => w.id === wingId);
    if (!wing) return;

    // Teleport visitor to the center of this wing facing down the corridor
    const targetZ = (wing.zStart + wing.zEnd) / 2;
    exhibitionStore.teleportTo(0, 1.7, targetZ, 0, targetZ + 10);
    exhibitionStore.setActiveModal(null);
  };

  // Map 3D Z position (0 to 184m) to percentage (0% to 100%)
  const totalLength = 184;
  const visitorZPercent = Math.max(0, Math.min(100, (cameraPosition.z / totalLength) * 100));

  const getWingIcon = (id: string) => {
    switch (id) {
      case 'foyer': return <Sparkles size={16} className="text-amber-400" />;
      case 'awards': return <Trophy size={16} className="text-yellow-400" />;
      case 'monochrome': return <Layers size={16} className="text-slate-300" />;
      case 'nature': return <Compass size={16} className="text-emerald-400" />;
      case 'street': return <Camera size={16} className="text-orange-400" />;
      case 'architecture': return <Building size={16} className="text-cyan-400" />;
      case 'creative': return <Eye size={16} className="text-purple-400" />;
      default: return <Compass size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl glass-panel rounded-3xl p-6 sm:p-8 flex flex-col max-h-[90vh] shadow-2xl border border-slate-700/80">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <Navigation size={20} className="text-amber-400" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
                Architectural Floor Plan & Teleport
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live spatial coordinates: Z: {cameraPosition.z.toFixed(1)}m | Current Section: {currentWing.name}
            </p>
          </div>
          <button
            onClick={() => exhibitionStore.setActiveModal(null)}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Blueprint Map Container */}
        <div className="my-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 overflow-x-auto">
          {/* Spatial corridor visualization */}
          <div className="relative min-w-[700px] h-32 flex items-center px-4">
            {/* Gallery central corridor axis line */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-1.5 bg-slate-800 rounded-full" />

            {/* Wing sections */}
            <div className="relative z-10 w-full flex justify-between items-center">
              {wings.map((wing) => {
                const isActive = currentWing.id === wing.id;
                return (
                  <button
                    key={wing.id}
                    onClick={() => handleTeleportToWing(wing.id)}
                    className={`group relative flex flex-col items-center transition-all duration-300 p-2 rounded-xl ${
                      isActive ? 'scale-105' : 'hover:scale-102 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Node circle on corridor */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/40 text-amber-300'
                          : 'bg-slate-900 border-slate-700 text-slate-400 group-hover:border-slate-500'
                      }`}
                    >
                      {getWingIcon(wing.id)}
                    </div>

                    <span className="text-[11px] font-medium text-slate-200 mt-2 text-center max-w-[90px] truncate">
                      {wing.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {wing.zStart}m - {wing.zEnd}m
                    </span>

                    {/* Quick Teleport Tag */}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold whitespace-nowrap shadow-md">
                      Teleport
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Pulsing Live Visitor Marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-200 z-20"
              style={{ left: `calc(32px + ${visitorZPercent * 0.88}%)` }}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-6 h-6 rounded-full bg-amber-400/40 animate-ping" />
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white shadow-lg shadow-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Wing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-1">
          {wings.map(wing => {
            const isCurrent = currentWing.id === wing.id;
            return (
              <div
                key={wing.id}
                onClick={() => handleTeleportToWing(wing.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {getWingIcon(wing.id)}
                      <h4 className="font-serif text-sm font-semibold text-slate-100">{wing.name}</h4>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                        You Are Here
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{wing.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-500">{wing.zStart}m - {wing.zEnd}m</span>
                  <span className="text-amber-400 font-medium group-hover:underline">Teleport &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

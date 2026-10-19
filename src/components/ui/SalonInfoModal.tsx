import React from 'react';
import { X, Award, ShieldCheck, Users, Eye } from 'lucide-react';
import { exhibitionStore } from '../../store/exhibitionStore';
import { SALON_INFO } from '../../data/salonData';

export const SalonInfoModal: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 flex flex-col max-h-[90vh] shadow-2xl border border-slate-700/80 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
              <Eye size={20} />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
                About Chayaksha 2026
              </h2>
              <span className="text-xs text-amber-400 font-mono">
                छाय • आक्ष | Shadow & Eye • {SALON_INFO.edition}
              </span>
            </div>
          </div>
          <button
            onClick={() => exhibitionStore.setActiveModal(null)}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Narrative & Etymology */}
        <div className="py-4 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
          <p>
            Rooted in classical Sanskrit, <span className="text-amber-300 font-semibold">Chayaksha</span> brings together <em>Chaya</em> (छाय — Shadow/Form) and <em>Aaksha</em> (आक्ष — Vision/Eye). It represents the timeless interplay between photon and perception, celebrating the photographic art in its highest architectural sanctuary.
          </p>
          <p className="text-slate-400">
            Conducted strictly in compliance with international salon guidelines, Chayaksha features juried acceptances and premier medalists across six dedicated wings, accessible worldwide via modern WebGL rendering.
          </p>
        </div>

        {/* Patronage Cards */}
        <div className="my-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-white">FIAP Patronage</h4>
              <p className="text-xs text-slate-400 mt-0.5">Fédération Internationale de l’Art Photographique</p>
              <span className="inline-block mt-2 font-mono text-[11px] text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                {SALON_INFO.patronages.fiap}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Award size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-white">PSA Recognition</h4>
              <p className="text-xs text-slate-400 mt-0.5">Photographic Society of America</p>
              <span className="inline-block mt-2 font-mono text-[11px] text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                {SALON_INFO.patronages.psa}
              </span>
            </div>
          </div>
        </div>

        {/* International Salon Statistics */}
        <div className="my-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="block font-serif text-lg font-bold text-amber-400">
              {SALON_INFO.totalSubmissions.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Entries Juried</span>
          </div>
          <div className="border-x border-slate-800">
            <span className="block font-serif text-lg font-bold text-white">
              {SALON_INFO.countriesRepresented}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Countries</span>
          </div>
          <div>
            <span className="block font-serif text-lg font-bold text-amber-400">
              {SALON_INFO.acceptedCount}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Acceptances</span>
          </div>
        </div>

        {/* Jury & Salon Committee */}
        <div className="pt-3 border-t border-slate-800/80">
          <h4 className="font-serif text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users size={14} /> International Jury Panel
          </h4>
          <p className="text-xs text-slate-300">
            <span className="text-amber-400 font-semibold">{SALON_INFO.juryChair}</span> — Jury Chairperson
          </p>
        </div>
      </div>
    </div>
  );
};

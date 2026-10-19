import React from 'react';
import { X, Award, ShieldCheck, Users, Globe, FileDown, CheckCircle2 } from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';

export const SalonInfoModal: React.FC = () => {
  const { salonInfo } = useExhibitionStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-8 flex flex-col max-h-[90vh] shadow-2xl border border-slate-700/80 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img
                src="/logos/school_crest.png"
                alt="Rajapaksa Central College"
                className="h-10 w-auto object-contain filter drop-shadow"
              />
              <img
                src="/logos/chayaksha_logo.png"
                alt="Chayaksha 26'"
                className="h-9 w-auto object-contain filter drop-shadow"
              />
              <img
                src="/logos/radapasa_media_unit.png"
                alt="Radapasa Media Unit"
                className="h-10 w-auto object-contain filter drop-shadow hidden sm:block"
              />
            </div>
            <div className="border-l border-slate-700/60 pl-3">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-poster-gold tracking-wide">
                {salonInfo.name}
              </h2>
              <span className="text-xs text-amber-300 font-mono block">
                {salonInfo.organizedBy} • {salonInfo.school}
              </span>
            </div>
          </div>
          <button
            onClick={() => exhibitionStore.setActiveModal(null)}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Narrative & Etymology */}
        <div className="py-4 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
          <p>
            Rooted in classical Sanskrit, <span className="text-poster-gold font-semibold">Chayaksha</span> brings together <em>Chaya</em> (छाय — Shadow/Form) and <em>Aaksha</em> (आक्ष — Vision/Eye). It represents the timeless interplay between photon and perception, celebrating the photographic art in its highest architectural sanctuary.
          </p>
          <p className="text-slate-400">
            Conducted strictly in compliance with international salon guidelines, Chayaksha features juried acceptances and premier medalists across dedicated gallery wings, accessible worldwide via real-time 3D WebGL rendering.
          </p>
        </div>

        {/* Patronage Cards: FIAP, PSA, IAAP */}
        <div className="my-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* FIAP */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-xs text-white">FIAP Patronage</h4>
                <p className="text-[11px] text-slate-400">Fédération Internationale de l’Art Photographique</p>
              </div>
            </div>
            <span className="mt-3 font-mono text-[11px] text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-center font-bold">
              {salonInfo.patronages.fiap}
            </span>
          </div>

          {/* PSA */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Award size={18} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-xs text-white">PSA Recognition</h4>
                <p className="text-[11px] text-slate-400">Photographic Society of America</p>
              </div>
            </div>
            <span className="mt-3 font-mono text-[11px] text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-center font-bold">
              {salonInfo.patronages.psa}
            </span>
          </div>

          {/* IAAP */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-xs text-white">IAAP Patronage</h4>
                <p className="text-[11px] text-slate-400">International Association of Art Photographers</p>
              </div>
            </div>
            <span className="mt-3 font-mono text-[11px] text-emerald-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-center font-bold">
              {salonInfo.patronages.iaap || 'IAAP: 2026/503'}
            </span>
          </div>
        </div>

        {/* International Salon Statistics */}
        <div className="my-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="block font-serif text-lg font-bold text-poster-gold">
              {salonInfo.totalSubmissions.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Entries Juried</span>
          </div>
          <div className="border-x border-slate-800">
            <span className="block font-serif text-lg font-bold text-white">
              {salonInfo.countriesRepresented}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Countries</span>
          </div>
          <div>
            <span className="block font-serif text-lg font-bold text-poster-gold">
              {salonInfo.acceptedCount}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Acceptances</span>
          </div>
        </div>

        {/* Official Website & Catalog PDF */}
        <div className="my-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-slate-900/60 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Globe size={18} />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Official Salon Portal</span>
              <a
                href={salonInfo.officialUrl || 'https://chayaksha.rmulive.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-amber-300 hover:underline flex items-center gap-1"
              >
                {salonInfo.officialUrl?.replace('https://', '') || 'chayaksha.rmulive.com'}
              </a>
            </div>
          </div>

          {salonInfo.catalogPdfUrl && (
            <a
              href={salonInfo.catalogPdfUrl}
              download={salonInfo.catalogPdfName || 'Chayaksha_26_Exhibition_Catalogue.pdf'}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
            >
              <FileDown size={15} />
              Download Exhibition Catalog PDF
            </a>
          )}
        </div>

        {/* Panel of Judges */}
        <div className="pt-4 border-t border-slate-800/80 mt-2">
          <h4 className="font-serif text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users size={14} className="text-amber-400" /> International Panel of Judges
          </h4>

          {salonInfo.judges && salonInfo.judges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {salonInfo.judges.map(judge => (
                <div key={judge.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h5 className="font-serif text-xs font-bold text-amber-200">{judge.name}</h5>
                    <p className="text-[11px] text-amber-400/90 font-mono mt-0.5">{judge.honors}</p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{judge.country}</span>
                    <span className="text-slate-500 italic">{judge.role}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-300">
              <span className="text-amber-400 font-semibold">{salonInfo.juryChair}</span> — Jury Chairperson
            </p>
          )}
        </div>
      </div>
    </div>
  );
};


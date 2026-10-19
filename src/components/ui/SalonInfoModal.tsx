import React from 'react';
import { X, Users, Globe, FileDown, ExternalLink, Eye, ShieldCheck } from 'lucide-react';
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
            Conducted in compliance with international salon standards, Chayaksha features juried acceptances and premier medalists across dedicated gallery wings, accessible worldwide via real-time 3D WebGL rendering.
          </p>
        </div>

        {/* Quick Action Navigation Buttons: Visit Exhibition, Download Catalog, IAAP Results Page */}
        <div className="my-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-900/80 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => exhibitionStore.setActiveModal(null)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
            >
              <Eye size={15} />
              Visit Exhibition in 3D
            </button>

            {salonInfo.catalogPdfUrl && (
              <a
                href={salonInfo.catalogPdfUrl}
                download={salonInfo.catalogPdfName || 'Chayaksha_26_Exhibition_Catalogue.pdf'}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileDown size={14} />
                Download Catalog PDF
              </a>
            )}
          </div>

          {salonInfo.iaapResultsUrl && (
            <a
              href={salonInfo.iaapResultsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-white border border-cyan-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ExternalLink size={14} />
              IAAP Results Page
            </a>
          )}
        </div>

        {/* Dynamic Patronages (Configured from Admin Panel, No Hardcoded Numbers) */}
        {salonInfo.patronageList && salonInfo.patronageList.length > 0 && (
          <div className="my-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
              Official Patronages & Recognitions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {salonInfo.patronageList.map(pat => (
                <div key={pat.id} className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-xs text-white">{pat.organization} Patronage</h4>
                    <span className="font-mono text-xs text-amber-300 font-bold block">{pat.patronageNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Official Website */}
        <div className="my-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-amber-400" />
            <span className="text-slate-300">Official Salon Portal:</span>
          </div>
          <a
            href={salonInfo.officialUrl || 'https://chayaksha.rmulive.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-amber-300 hover:underline flex items-center gap-1"
          >
            {salonInfo.officialUrl?.replace('https://', '') || 'chayaksha.rmulive.com'}
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Panel of Judges with Images */}
        <div className="pt-4 border-t border-slate-800/80 mt-2">
          <h4 className="font-serif text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users size={14} className="text-amber-400" /> International Panel of Judges
          </h4>

          {salonInfo.judges && salonInfo.judges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {salonInfo.judges.map(judge => (
                <div key={judge.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center gap-2.5 mb-2">
                    <img
                      src={judge.imageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80'}
                      alt={judge.name}
                      className="w-10 h-10 rounded-full object-cover border border-amber-400/40 shadow"
                    />
                    <div>
                      <h5 className="font-serif text-xs font-bold text-amber-200">{judge.name}</h5>
                      <span className="text-[10px] text-slate-400">{judge.country}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-400/90 font-mono">{judge.honors}</p>
                    <p className="text-[10px] text-slate-500 italic mt-0.5">{judge.role}</p>
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

import React, { useState, useMemo } from 'react';
import { X, Search, Trophy, Eye, ExternalLink, School, FileDown } from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';
import type { Artwork } from '../../types/exhibition';

export const SalonCatalogueModal: React.FC = () => {
  const { artworks, wings, salonInfo } = useExhibitionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAwardFilter, setSelectedAwardFilter] = useState<'all' | 'awards' | 'acceptances'>('all');

  // Filter artworks
  const filteredArtworks = useMemo(() => {
    return artworks.filter(art => {
      // Category filter
      if (selectedCategory !== 'all' && art.category !== selectedCategory) {
        return false;
      }

      // Award filter
      if (selectedAwardFilter === 'awards' && art.awardTier === 'Salon Acceptance') {
        return false;
      }
      if (selectedAwardFilter === 'acceptances' && art.awardTier !== 'Salon Acceptance') {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = art.title.toLowerCase().includes(query);
        const matchesArtist = art.photographer.toLowerCase().includes(query);
        const matchesSchool = art.school ? art.school.toLowerCase().includes(query) : false;
        const matchesPlace = art.place ? art.place.toLowerCase().includes(query) : false;
        const matchesCountry = art.country ? art.country.toLowerCase().includes(query) : false;
        const matchesCamera = art.exif?.camera ? art.exif.camera.toLowerCase().includes(query) : false;
        const matchesDesc = art.description ? art.description.toLowerCase().includes(query) : false;
        return matchesTitle || matchesArtist || matchesSchool || matchesPlace || matchesCountry || matchesCamera || matchesDesc;
      }

      return true;
    });
  }, [artworks, selectedCategory, selectedAwardFilter, searchQuery]);

  const handleInspect = (art: Artwork) => {
    exhibitionStore.setActiveArtwork(art, false);
    exhibitionStore.setActiveModal(null);
  };

  const handleTeleportToArt = (art: Artwork) => {
    exhibitionStore.setActiveArtwork(art, true);
    exhibitionStore.setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl glass-panel rounded-3xl p-6 sm:p-8 flex flex-col max-h-[92vh] shadow-2xl border border-slate-700/80">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-700/60 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Search size={22} className="text-amber-400" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-poster-gold tracking-wide">
                Salon Catalogue & Archive
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Curated international acceptances conforming to FIAP, PSA & IAAP standards
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {salonInfo.iaapResultsUrl && (
              <a
                href={salonInfo.iaapResultsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold flex items-center gap-1.5 border border-cyan-500/30 transition-all cursor-pointer"
                title="Open official IAAP Salon Results"
              >
                <ExternalLink size={13} />
                IAAP Results
              </a>
            )}
            {salonInfo.catalogPdfUrl && (
              <a
                href={salonInfo.catalogPdfUrl}
                download={salonInfo.catalogPdfName || 'Chayaksha_26_Catalogue.pdf'}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                title="Download complete Exhibition Catalog PDF"
              >
                <FileDown size={14} />
                Catalog PDF
              </a>
            )}
            <button
              onClick={() => exhibitionStore.setActiveModal(null)}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="my-5 flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, photographer, country, camera, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Award Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-700 text-xs">
            <button
              onClick={() => setSelectedAwardFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedAwardFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setSelectedAwardFilter('awards')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                selectedAwardFilter === 'awards'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy size={13} /> Medals & Ribbons
            </button>
            <button
              onClick={() => setSelectedAwardFilter('acceptances')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedAwardFilter === 'acceptances'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Acceptances
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap border transition-all ${
              selectedCategory === 'all'
                ? 'bg-white text-slate-950 border-white font-semibold'
                : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All Wings ({artworks.length})
          </button>
          {wings.map(wing => {
            const count = artworks.filter(a => a.category === wing.id).length;
            const isSelected = selectedCategory === wing.id;
            return (
              <button
                key={wing.id}
                onClick={() => setSelectedCategory(wing.id)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                    : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>{wing.name}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Artworks Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredArtworks.map(art => {
            const isAward = art.awardTier !== 'Salon Acceptance';
            return (
              <div
                key={art.id}
                className="group relative rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/50 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10"
              >
                {/* Image & Award Overlay */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Place / Award Badge */}
                  <div className="absolute top-2.5 left-2.5 max-w-[85%]">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-md shadow-md border truncate block ${
                        isAward
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-300 font-extrabold'
                          : 'bg-slate-900/85 text-slate-300 border-slate-700'
                      }`}
                    >
                      🏆 {art.place || art.awardTier}
                    </span>
                  </div>

                  {/* Hover Quick Action Buttons */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3 backdrop-blur-xs">
                    <button
                      onClick={() => handleInspect(art)}
                      className="px-3 py-1.5 rounded-xl bg-white text-slate-950 text-xs font-semibold flex items-center gap-1 hover:bg-amber-400 transition-colors shadow cursor-pointer"
                      title="Archival Deep Zoom"
                    >
                      <Eye size={14} /> Inspect
                    </button>
                    <button
                      onClick={() => handleTeleportToArt(art)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-semibold flex items-center gap-1 hover:bg-amber-400 transition-colors shadow cursor-pointer"
                      title="Teleport in 3D Gallery"
                    >
                      <ExternalLink size={14} /> Visit in 3D
                    </button>
                  </div>
                </div>

                {/* Details info highlighting Name, School, and Camera specs */}
                <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                      {art.title}
                    </h4>
                    {/* Photographer Name (Highlighted) */}
                    <p className="text-xs font-bold text-amber-300 truncate mt-0.5">
                      {art.photographer} {art.photographerHonors && <span className="text-[10px] font-normal text-slate-400">({art.photographerHonors})</span>}
                    </p>
                    {/* School (Highlighted) */}
                    <p className="text-[11px] text-cyan-300 font-medium truncate flex items-center gap-1 mt-0.5">
                      <School size={11} className="text-cyan-400 shrink-0" />
                      <span className="truncate">{art.school || 'Rajapaksa Central College, Weeraketiya'}</span>
                    </p>
                  </div>

                  {/* Section & Institution footer (no camera data) */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="truncate text-amber-300/80 font-serif">Chayaksha 26'</span>
                    <span className="truncate text-slate-500 font-sans">RMU Live</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer status */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredArtworks.length} of {artworks.length} works</span>
          <span className="font-mono text-[11px] text-amber-400/80">FIAP / PSA Standard Catalogue</span>
        </div>
      </div>
    </div>
  );
};

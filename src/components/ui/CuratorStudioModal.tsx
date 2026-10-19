import React, { useState } from 'react';
import {
  X,
  Sliders,
  Palette,
  PlusCircle,
  Trash2,
  Download,
  RotateCcw,
  Trophy,
  Check,
  Eye,
  FileText,
} from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';
import type { Artwork, AwardTier, GalleryTheme } from '../../types/exhibition';

export const CuratorStudioModal: React.FC = () => {
  const { theme, artworks, wings, guestbook } = useExhibitionStore();
  const [activeTab, setActiveTab] = useState<'themes' | 'add' | 'artworks' | 'guestbook'>('themes');

  // New artwork state
  const [title, setTitle] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [photographerHonors, setPhotographerHonors] = useState('AFIAP');
  const [country, setCountry] = useState('United States');
  const [category, setCategory] = useState(wings[1]?.id || 'awards');
  const [awardTier, setAwardTier] = useState<AwardTier>('Salon Acceptance');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [camera, setCamera] = useState('Sony Alpha 1');
  const [lens, setLens] = useState('FE 24-70mm f/2.8 GM II');
  const [aperture, setAperture] = useState('f/5.6');
  const [shutterSpeed, setShutterSpeed] = useState('1/250s');
  const [iso, setIso] = useState('100');
  const [location, setLocation] = useState('Location Studio');
  const [successMsg, setSuccessMsg] = useState('');

  const themesList: { id: GalleryTheme; name: string; desc: string; colors: string[] }[] = [
    {
      id: 'minimalist-alabaster',
      name: 'Minimalist Alabaster',
      desc: 'Pristine museum white plaster with Carrara marble reflections and crisp daylight.',
      colors: ['#ffffff', '#e2e8f0', '#94a3b8'],
    },
    {
      id: 'dark-noir',
      name: 'Dark Noir Velvet',
      desc: 'Moody charcoal acoustic walls, warm gold directional spotlights, and walnut wood.',
      colors: ['#0f172a', '#1e293b', '#ca8a04'],
    },
    {
      id: 'warm-travertine',
      name: 'Warm Travertine Stone',
      desc: 'Natural Italian limestone with horizontal strata fissures and golden hour warmth.',
      colors: ['#eae2cf', '#d8cbba', '#b45309'],
    },
    {
      id: 'brutalist-concrete',
      name: 'Brutalist Concrete',
      desc: 'Textured board-formed architectural concrete with expansion joints and industrial steel.',
      colors: ['#475569', '#334155', '#e2e8f0'],
    },
  ];

  const handleCreateArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !photographer.trim() || !imageUrl.trim()) return;

    // Determine spatial position based on category
    const wing = wings.find(w => w.id === category) || wings[1];
    const categoryArtworks = artworks.filter(a => a.category === category);
    const wallSide = categoryArtworks.length % 2 === 0 ? 'left' : 'right';
    const zOffset = wing.zStart + 4 + (categoryArtworks.length * 6);

    const newArtwork: Artwork = {
      id: `art-curator-${Date.now()}`,
      title: title.trim(),
      photographer: photographer.trim(),
      photographerHonors: photographerHonors.trim(),
      country: country.trim(),
      countryCode: country.slice(0, 2).toUpperCase(),
      category,
      awardTier,
      imageUrl: imageUrl.trim(),
      aspectRatio: 1.5,
      description: description.trim() || 'Curator selection for the international salon.',
      exif: {
        camera,
        lens,
        focalLength: '50mm',
        aperture,
        shutterSpeed,
        iso,
        location,
        year: 2026,
      },
      position: [wallSide === 'left' ? -5.9 : 5.9, 2.3, zOffset],
      wallSide,
      rotationY: wallSide === 'left' ? Math.PI / 2 : -Math.PI / 2,
    };

    exhibitionStore.addArtwork(newArtwork);
    setSuccessMsg(`"${newArtwork.title}" successfully curated into ${wing.name}!`);
    setTitle('');
    setPhotographer('');
    setImageUrl('');
    setDescription('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(artworks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chayaksha-salon-artworks-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl glass-panel rounded-3xl p-6 sm:p-8 flex flex-col max-h-[92vh] shadow-2xl border border-slate-700/80">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <Sliders size={22} className="text-amber-400" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
                Curator Administration Suite
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live spatial orchestration, architectural themes, and salon management
            </p>
          </div>
          <button
            onClick={() => exhibitionStore.setActiveModal(null)}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'themes'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Palette size={14} /> Architectural Themes
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'add'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PlusCircle size={14} /> Add Submission
          </button>
          <button
            onClick={() => setActiveTab('artworks')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'artworks'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText size={14} /> Manage Artworks ({artworks.length})
          </button>
          <button
            onClick={() => setActiveTab('guestbook')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'guestbook'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Trophy size={14} /> Moderate Guestbook ({guestbook.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-5 pr-1">
          {/* 1. Architectural Themes */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Instantly transforms the 3D gallery walls, floors, specular lighting, and ceiling ambient mood in real-time.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themesList.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => exhibitionStore.setTheme(t.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 shadow-xl shadow-amber-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
                            {t.name}
                          </h4>
                          {isSelected && (
                            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold">
                              <Check size={14} />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">{t.desc}</p>
                      </div>

                      {/* Color Palette Preview Swatches */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                        {t.colors.map((c, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full border border-slate-700 shadow-inner"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <span className="text-[10px] font-mono text-slate-400 ml-auto">
                          {isSelected ? 'Active Theme' : 'Click to Apply'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Add New Artwork */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateArtwork} className="space-y-4 max-w-2xl bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-medium animate-fadeIn">
                  {successMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Artwork Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dawn over Kilimanjaro"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Photographer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Aurelius"
                    value={photographer}
                    onChange={(e) => setPhotographer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Honors (FIAP/PSA)</label>
                  <input
                    type="text"
                    placeholder="e.g. EFIAP/p, GMPSA"
                    value={photographerHonors}
                    onChange={(e) => setPhotographerHonors(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Australia"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category Stall</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    {wings.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Award Tier</label>
                  <select
                    value={awardTier}
                    onChange={(e) => setAwardTier(e.target.value as AwardTier)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="Best of Show">Best of Show</option>
                    <option value="FIAP Gold">FIAP Gold Medal</option>
                    <option value="PSA Gold">PSA Gold Medal</option>
                    <option value="FIAP Silver">FIAP Silver Medal</option>
                    <option value="PSA Bronze">PSA Bronze Medal</option>
                    <option value="FIAP Ribbon">FIAP Ribbon</option>
                    <option value="Honorable Mention">Honorable Mention</option>
                    <option value="Salon Acceptance">Salon Acceptance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">High-Res Image URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Curator Description & Statement</label>
                <textarea
                  rows={2}
                  placeholder="Artwork narrative and juried comments..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Quick EXIF preset inputs */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">Camera EXIF Metadata</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Camera"
                    value={camera}
                    onChange={(e) => setCamera(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Lens"
                    value={lens}
                    onChange={(e) => setLens(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Aperture"
                    value={aperture}
                    onChange={(e) => setAperture(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Shutter Speed"
                    value={shutterSpeed}
                    onChange={(e) => setShutterSpeed(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="ISO"
                    value={iso}
                    onChange={(e) => setIso(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <PlusCircle size={15} />
                Curate & Install into 3D Space
              </button>
            </form>
          )}

          {/* 3. Manage Artworks */}
          {activeTab === 'artworks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
                <span>Active Salon Submissions ({artworks.length})</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJSON}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1"
                  >
                    <Download size={13} /> Export JSON
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Reset gallery artworks to official salon defaults?')) {
                        exhibitionStore.resetArtworksToDefault();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-900/50 text-red-300 border border-red-900/50 flex items-center gap-1"
                  >
                    <RotateCcw size={13} /> Reset Defaults
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">Work</th>
                      <th className="p-3">Photographer</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Award Tier</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {artworks.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 flex items-center gap-2">
                          <img
                            src={art.imageUrl}
                            alt=""
                            className="w-10 h-8 rounded object-cover border border-slate-700"
                          />
                          <span className="font-serif font-medium text-white truncate max-w-[150px]">
                            {art.title}
                          </span>
                        </td>
                        <td className="p-3 truncate max-w-[120px]">{art.photographer} ({art.country})</td>
                        <td className="p-3 font-mono text-[11px] text-slate-400 capitalize">{art.category}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700">
                            {art.awardTier}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              exhibitionStore.setActiveArtwork(art, true);
                              exhibitionStore.setActiveModal(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded transition-colors mr-1"
                            title="Visit in 3D"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => exhibitionStore.deleteArtwork(art.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                            title="Delete artwork"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Moderate Guestbook */}
          {activeTab === 'guestbook' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 block pb-2">
                Moderate visitor signatures inscribed in the salon ledger.
              </span>
              <div className="space-y-2">
                {guestbook.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{entry.author}</span>
                        <span className="text-[10px] text-slate-400">({entry.country})</span>
                        <span className="text-[10px] font-mono text-amber-400">★ {entry.rating}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 italic">"{entry.message}"</p>
                    </div>

                    <button
                      onClick={() => exhibitionStore.deleteGuestbookEntry(entry.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors ml-4"
                      title="Remove signature"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

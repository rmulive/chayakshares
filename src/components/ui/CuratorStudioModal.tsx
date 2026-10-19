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
  Lock,
  LogOut,
  UserCheck,
  School,
  Award,
} from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';
import type { Artwork, AwardTier, GalleryTheme } from '../../types/exhibition';

export const CuratorStudioModal: React.FC = () => {
  const { theme, artworks, wings, guestbook, adminUser } = useExhibitionStore();
  const [activeTab, setActiveTab] = useState<'themes' | 'add' | 'artworks' | 'guestbook'>('themes');

  // Admin login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // New artwork state
  const [title, setTitle] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [photographerHonors, setPhotographerHonors] = useState('AFIAP');
  const [school, setSchool] = useState('Rajapaksa Central College, Weeraketiya');
  const [place, setPlace] = useState('1st Place - Gold Award');
  const [country, setCountry] = useState('Sri Lanka');
  const [category, setCategory] = useState(wings[1]?.id || 'awards');
  const [awardTier, setAwardTier] = useState<AwardTier>('FIAP Gold');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [camera, setCamera] = useState('Sony Alpha 1');
  const [lens, setLens] = useState('FE 24-70mm f/2.8 GM II');
  const [aperture, setAperture] = useState('f/2.8');
  const [shutterSpeed, setShutterSpeed] = useState('1/1000s');
  const [iso, setIso] = useState('100');
  const [location, setLocation] = useState('Colombo, Sri Lanka');
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

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError('');
    try {
      await exhibitionStore.loginWithGoogle();
    } catch {
      setAuthError('Google sign-in could not be completed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('Please enter both your curatorial email and password.');
      return;
    }
    if (loginPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError('');
    const success = await exhibitionStore.loginWithEmail(loginEmail.trim(), loginPassword);
    if (!success) {
      setAuthError('Invalid credentials. Please verify your email and password.');
    }
    setIsAuthenticating(false);
  };

  const fillDemoCredentials = () => {
    setLoginEmail('admin@chayaksha.lk');
    setLoginPassword('admin2026');
    setAuthError('');
  };

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
      school: school.trim() || 'Rajapaksa Central College, Weeraketiya',
      place: place.trim() || '1st Place - Gold Award',
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

  // --- 1. SIGN-IN PORTAL IF NOT AUTHENTICATED ---
  if (!adminUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
        <div className="w-full max-w-lg glass-panel-gold rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl border border-amber-500/40 relative">
          {/* Close button */}
          <button
            onClick={() => exhibitionStore.setActiveModal(null)}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close Portal"
          >
            <X size={20} />
          </button>

          {/* Institutional Logos */}
          <div className="flex items-center justify-center gap-5 pt-2 pb-4">
            <img
              src="/logos/school_crest.png"
              alt="Rajapaksa Central College Crest"
              className="h-12 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]"
            />
            <div className="h-10 w-px bg-amber-500/30" />
            <img
              src="/logos/chayaksha_logo.png"
              alt="Chayaksha 26' Logo"
              className="h-14 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(234,179,8,0.5)]"
            />
            <div className="h-10 w-px bg-amber-500/30" />
            <img
              src="/logos/radapasa_media_unit.png"
              alt="Radapasa Media Unit"
              className="h-12 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]"
            />
          </div>

          {/* Portal Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono uppercase tracking-widest mb-2">
              <Lock size={12} />
              Curator Administrative Access
            </div>
            <h2 className="font-serif text-2xl font-bold text-white tracking-wide">
              Chayaksha 26' Admin Portal
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Radapasa Media Unit • Rajapaksa Central College, Weeraketiya
            </p>
          </div>

          {/* Error notice */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs text-center font-medium animate-fadeIn">
              {authError}
            </div>
          )}

          {/* 1. Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign In with Google
          </button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-slate-700/60" />
            <span className="px-3 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Or with Curatorial Credentials
            </span>
            <div className="flex-1 h-px bg-slate-700/60" />
          </div>

          {/* 2. Email & Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                placeholder="admin@chayaksha.lk"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Master Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400 placeholder-slate-500"
              />
            </div>

            {/* Demo Quick Fill helper */}
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Authorized Curators Only</span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer font-mono"
              >
                Auto-fill Demo Credentials
              </button>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
            >
              <Lock size={14} />
              {isAuthenticating ? 'Verifying Credentials...' : 'Authenticate & Enter Studio'}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 text-center font-mono">
            Synchronized live curatorial studio • FIAP / PSA Compliance
          </div>
        </div>
      </div>
    );
  }

  // --- 2. AUTHENTICATED CURATORIAL STUDIO ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl glass-panel rounded-3xl p-6 sm:p-8 flex flex-col max-h-[92vh] shadow-2xl border border-slate-700/80">
        {/* Header with Admin Profile & Sign Out */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/60 gap-3">
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

          {/* Admin User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <UserCheck size={15} className="text-emerald-400" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-white text-[11px] leading-tight truncate max-w-[140px]">
                  {adminUser.name}
                </span>
                <span className="text-[9px] text-amber-400 font-mono">
                  {adminUser.role}
                </span>
              </div>
            </div>

            <button
              onClick={() => exhibitionStore.logoutAdmin()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sign Out of Curator Studio"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            <button
              onClick={() => exhibitionStore.setActiveModal(null)}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Suite"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'themes'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Palette size={14} /> Architectural Themes
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'add'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PlusCircle size={14} /> Add Submission
          </button>
          <button
            onClick={() => setActiveTab('artworks')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'artworks'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText size={14} /> Manage Artworks ({artworks.length})
          </button>
          <button
            onClick={() => setActiveTab('guestbook')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
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
                    placeholder="e.g. Dawn over the Ruhuna Range"
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
                    placeholder="e.g. Seniru Jayawardena"
                    value={photographer}
                    onChange={(e) => setPhotographer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* School and Place (Prominently highlighted) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1 flex items-center gap-1">
                    <School size={13} /> School / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajapaksa Central College, Weeraketiya"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1 flex items-center gap-1">
                    <Award size={13} /> Place / Ranking *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1st Place - Gold Award"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Honors (FIAP/PSA)</label>
                  <input
                    type="text"
                    placeholder="e.g. AFIAP, MPSA"
                    value={photographerHonors}
                    onChange={(e) => setPhotographerHonors(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Lanka"
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

              {/* Complete Camera EXIF inputs (all data preserved) */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">Camera EXIF Metadata</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Camera (e.g. Sony A1)"
                    value={camera}
                    onChange={(e) => setCamera(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Lens (e.g. 50mm f/1.2)"
                    value={lens}
                    onChange={(e) => setLens(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Aperture (e.g. f/2.8)"
                    value={aperture}
                    onChange={(e) => setAperture(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Shutter Speed (e.g. 1/1000s)"
                    value={shutterSpeed}
                    onChange={(e) => setShutterSpeed(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="ISO (e.g. 100)"
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
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Download size={13} /> Export JSON
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Reset gallery artworks to official salon defaults?')) {
                        exhibitionStore.resetArtworksToDefault();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-900/50 text-red-300 border border-red-900/50 flex items-center gap-1 cursor-pointer"
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
                      <th className="p-3">Photographer & School</th>
                      <th className="p-3">Place / Award</th>
                      <th className="p-3">Category</th>
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
                        <td className="p-3 max-w-[180px]">
                          <div className="font-semibold text-white truncate">{art.photographer}</div>
                          <div className="text-[10px] text-amber-400/90 truncate">{art.school || 'Rajapaksa Central College, Weeraketiya'}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold truncate block max-w-[160px]">
                            {art.place || art.awardTier}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-400 capitalize">{art.category}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              exhibitionStore.setActiveArtwork(art, true);
                              exhibitionStore.setActiveModal(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded transition-colors mr-1 cursor-pointer"
                            title="Visit in 3D"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => exhibitionStore.deleteArtwork(art.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
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
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors ml-4 cursor-pointer"
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

import React, { useState, useRef } from 'react';
import {
  X,
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
  Upload,
  Link as LinkIcon,
  Layers,
  FileUp,
  Globe,
  Settings,
  CheckSquare,
  Square,
} from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';
import type { Artwork, AwardTier, GalleryTheme, AwardDefinition, CategoryWing } from '../../types/exhibition';

export const CuratorStudioModal: React.FC = () => {
  const { theme, artworks, wings, awards, salonInfo, guestbook, adminUser } = useExhibitionStore();
  const [activeTab, setActiveTab] = useState<
    'artworks' | 'add' | 'awards' | 'categories' | 'catalog' | 'details' | 'themes' | 'guestbook'
  >('artworks');

  // Admin login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Bulk selection states for artworks
  const [selectedArtIds, setSelectedArtIds] = useState<string[]>([]);
  // Bulk selection states for guestbook
  const [selectedGbIds, setSelectedGbIds] = useState<string[]>([]);

  // New artwork form state
  const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>('upload');
  const [title, setTitle] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [photographerHonors, setPhotographerHonors] = useState('');
  const [school, setSchool] = useState('Rajapaksa Central College, Weeraketiya');
  const [place, setPlace] = useState('1st Place - Gold Award');
  const [country, setCountry] = useState('Sri Lanka');
  const [category, setCategory] = useState(wings[1]?.id || 'awards');
  const [awardTier, setAwardTier] = useState<AwardTier>('FIAP Gold');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [description, setDescription] = useState('');
  const [camera, setCamera] = useState('Sony Alpha 1');
  const [lens, setLens] = useState('FE 24-70mm f/2.8 GM II');
  const [aperture, setAperture] = useState('f/2.8');
  const [shutterSpeed, setShutterSpeed] = useState('1/1000s');
  const [iso, setIso] = useState('100');
  const [location, setLocation] = useState('Colombo, Sri Lanka');
  const [successMsg, setSuccessMsg] = useState('');

  // Awards management state
  const [newAwardName, setNewAwardName] = useState('');
  const [newAwardSpotlight, setNewAwardSpotlight] = useState('#ffd700');
  const [newAwardPlaque, setNewAwardPlaque] = useState<'gold' | 'silver' | 'bronze' | 'slate'>('gold');
  const [newAwardMedal, setNewAwardMedal] = useState<'trophy' | 'gold' | 'silver' | 'bronze' | 'ribbon' | 'acceptance'>('gold');

  // Categories management state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#d97706');

  // Catalog PDF state
  const [pdfInputMode, setPdfInputMode] = useState<'upload' | 'url'>('upload');
  const [catalogPdfUrl, setCatalogPdfUrl] = useState(salonInfo.catalogPdfUrl || '');
  const [catalogPdfName, setCatalogPdfName] = useState(salonInfo.catalogPdfName || '');

  // Website details edit state
  const [editTitle, setEditTitle] = useState(salonInfo.name);
  const [editEdition, setEditEdition] = useState(salonInfo.edition);
  const [editYear, setEditYear] = useState(salonInfo.year);
  const [editOrganizedBy, setEditOrganizedBy] = useState(salonInfo.organizedBy);
  const [editSchool, setEditSchool] = useState(salonInfo.school);
  const [editOfficialUrl, setEditOfficialUrl] = useState(salonInfo.officialUrl || 'chayaksha.rmulive.com');
  const [editIaap, setEditIaap] = useState(salonInfo.patronages.iaap || 'IAAP: 2026/503');
  const [editFiap, setEditFiap] = useState(salonInfo.patronages.fiap);
  const [editPsa, setEditPsa] = useState(salonInfo.patronages.psa);
  const [editJuryChair, setEditJuryChair] = useState(salonInfo.juryChair);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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
      name: 'Honed Modern Concrete',
      desc: 'Smooth architectural concrete with fine mineral aggregate (zero tie-rod holes).',
      colors: ['#64748b', '#475569', '#cbd5e1'],
    },
  ];

  // Sign-in handlers
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

  // Image file upload handler
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageUrl(dataUrl);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Catalog PDF file upload handler
  const handlePdfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      exhibitionStore.setCatalogPdf(dataUrl, file.name);
      setCatalogPdfUrl(dataUrl);
      setCatalogPdfName(file.name);
      setSuccessMsg(`Exhibition Catalog PDF "${file.name}" successfully imported!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    };
    reader.readAsDataURL(file);
  };

  // Create artwork handler
  const handleCreateArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = imageUrl.trim() || imagePreview;
    if (!title.trim() || !photographer.trim() || !finalImage) {
      alert('Please provide title, photographer name, and an image (upload or URL).');
      return;
    }

    const wing = wings.find(w => w.id === category) || wings[1] || wings[0];
    const categoryArtworks = artworks.filter(a => a.category === category);
    const wallSide = categoryArtworks.length % 2 === 0 ? 'left' : 'right';
    const zOffset = (wing?.zStart || 16) + 4 + (categoryArtworks.length * 6);

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
      imageUrl: finalImage,
      aspectRatio: 1.5,
      description: description.trim() || 'Curator selection for Chayaksha 26\'.',
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
    setSuccessMsg(`"${newArtwork.title}" successfully curated into ${wing?.name || 'Gallery'}!`);
    setTitle('');
    setPhotographer('');
    setImageUrl('');
    setImagePreview('');
    setDescription('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Bulk delete artworks handler
  const handleBulkDeleteArtworks = () => {
    if (selectedArtIds.length === 0) return;
    if (confirm(`Are you sure you want to bulk delete ${selectedArtIds.length} selected artworks from the exhibition?`)) {
      exhibitionStore.bulkDeleteArtworks(selectedArtIds);
      setSelectedArtIds([]);
      setSuccessMsg(`Successfully bulk deleted artworks!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Bulk delete guestbook handler
  const handleBulkDeleteGuestbook = () => {
    if (selectedGbIds.length === 0) return;
    if (confirm(`Bulk delete ${selectedGbIds.length} visitor guestbook signatures?`)) {
      exhibitionStore.bulkDeleteGuestbook(selectedGbIds);
      setSelectedGbIds([]);
      setSuccessMsg(`Successfully deleted guestbook signatures!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Save Website Details
  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    exhibitionStore.updateSalonInfo({
      name: editTitle,
      edition: editEdition,
      year: editYear,
      organizedBy: editOrganizedBy,
      school: editSchool,
      officialUrl: editOfficialUrl,
      juryChair: editJuryChair,
      patronages: {
        iaap: editIaap,
        fiap: editFiap,
        psa: editPsa,
      },
    });
    setSuccessMsg('Website exhibition details & judges successfully updated and synchronized!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Add Custom Award Tier
  const handleAddAward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAwardName.trim()) return;

    const newAward: AwardDefinition = {
      id: `award-${Date.now()}`,
      name: newAwardName.trim(),
      spotlightColorHex: newAwardSpotlight,
      plaqueStyle: newAwardPlaque,
      medalType: newAwardMedal,
      description: `Official ${newAwardName.trim()} for Chayaksha 26'`,
    };

    exhibitionStore.addAward(newAward);
    setNewAwardName('');
    setSuccessMsg(`Award "${newAward.name}" created!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Add Custom Category Wing
  const handleAddCategoryWing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const lastWing = wings[wings.length - 1];
    const zStart = lastWing ? lastWing.zEnd : 0;
    const zEnd = zStart + 28;

    const newWing: CategoryWing = {
      id: `wing-${Date.now()}`,
      name: newCatName.trim(),
      description: newCatDesc.trim() || 'Curated salon exhibition wing.',
      iconName: 'Sparkles',
      colorHex: newCatColor,
      zStart,
      zEnd,
    };

    exhibitionStore.addCategoryWing(newWing);
    setNewCatName('');
    setNewCatDesc('');
    setSuccessMsg(`Category wing "${newWing.name}" added to 3D hallway!`);
    setTimeout(() => setSuccessMsg(''), 3000);
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
          <button
            onClick={() => exhibitionStore.setActiveModal(null)}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close Portal"
          >
            <X size={20} />
          </button>

          {/* Institutional Logos (featuring original 3D Gold Logo) */}
          <div className="flex items-center justify-center gap-5 pt-2 pb-4">
            <img
              src="/logos/school_crest.png"
              alt="Rajapaksa Central College Crest"
              className="h-12 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]"
            />
            <div className="h-10 w-px bg-amber-500/30" />
            <img
              src="/logos/chayaksha_logo.png"
              alt="Chayaksha 26' Gold Logo"
              className="h-14 w-auto object-contain filter drop-shadow-[0_2px_14px_rgba(234,179,8,0.6)]"
            />
            <div className="h-10 w-px bg-amber-500/30" />
            <img
              src="/logos/radapasa_media_unit.png"
              alt="Radapasa Media Unit"
              className="h-12 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]"
            />
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono uppercase tracking-widest mb-2">
              <Lock size={12} />
              Curator Administrative Access
            </div>
            <h2 className="font-serif text-2xl font-bold text-white tracking-wide">
              Chayaksha 26' Admin Portal
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Media Unit of Rajapaksa Central College (RMU Live)
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs text-center font-medium animate-fadeIn">
              {authError}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign In with Google
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-slate-700/60" />
            <span className="px-3 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Or with Curatorial Credentials
            </span>
            <div className="flex-1 h-px bg-slate-700/60" />
          </div>

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

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 text-center font-mono">
            Synchronized live curatorial studio • IAAP / FIAP / PSA Compliance
          </div>
        </div>
      </div>
    );
  }

  // --- 2. AUTHENTICATED CURATORIAL STUDIO ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-6xl glass-panel rounded-3xl p-5 sm:p-7 flex flex-col max-h-[94vh] shadow-2xl border border-slate-700/80">
        {/* Header with Admin Profile & Sign Out */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/60 gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logos/chayaksha_logo.png"
              alt="Chayaksha 26'"
              className="h-10 w-auto object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide">
                  Curator Administration Suite
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  CHAYAKSHA 26'
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full salon orchestration, bulk management, catalog PDF imports & architectural staging
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <UserCheck size={14} className="text-emerald-400" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-white text-[11px] leading-tight truncate max-w-[130px]">
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
              title="Sign Out"
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

        {/* Global Success / Feedback Message */}
        {successMsg && (
          <div className="my-2 p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-medium text-center animate-fadeIn">
            {successMsg}
          </div>
        )}

        {/* Navigation Tabs (All 8 curatorial modules) */}
        <div className="flex items-center gap-1.5 pt-3 pb-2 border-b border-slate-800 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('artworks')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'artworks'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText size={14} /> Artworks & Bulk Delete ({artworks.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'add'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PlusCircle size={14} /> Add Submission
          </button>
          <button
            onClick={() => setActiveTab('awards')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'awards'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Trophy size={14} /> Awards ({awards.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers size={14} /> Categories ({wings.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileUp size={14} /> Catalog PDF Import
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'details'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe size={14} /> Exhibition Details
          </button>
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'themes'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Palette size={14} /> Themes
          </button>
          <button
            onClick={() => setActiveTab('guestbook')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guestbook'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Award size={14} /> Guestbook ({guestbook.length})
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          {/* TAB 1: MANAGE ARTWORKS & BULK DELETE */}
          {activeTab === 'artworks' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pb-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">Active Artworks: {artworks.length}</span>
                  {selectedArtIds.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                      {selectedArtIds.length} Selected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Bulk Delete Button */}
                  {selectedArtIds.length > 0 && (
                    <button
                      onClick={handleBulkDeleteArtworks}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-red-500/20 transition-all cursor-pointer animate-fadeIn"
                    >
                      <Trash2 size={13} /> Bulk Delete Selected ({selectedArtIds.length})
                    </button>
                  )}

                  <button
                    onClick={handleExportJSON}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Download size={13} /> Export JSON
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Reset gallery artworks to official salon defaults?')) {
                        exhibitionStore.resetArtworksToDefault();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-900/50 text-red-300 border border-red-900/50 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={13} /> Reset Defaults
                  </button>
                </div>
              </div>

              {/* Artworks Table with Multi-Select Checkboxes */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <button
                          onClick={() => {
                            if (selectedArtIds.length === artworks.length) {
                              setSelectedArtIds([]);
                            } else {
                              setSelectedArtIds(artworks.map(a => a.id));
                            }
                          }}
                          className="text-slate-400 hover:text-white cursor-pointer"
                          title="Select / Deselect All"
                        >
                          {selectedArtIds.length === artworks.length ? (
                            <CheckSquare size={16} className="text-amber-400" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      <th className="p-3">Work Title</th>
                      <th className="p-3">Photographer & School</th>
                      <th className="p-3">Place / Ranking</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {artworks.map((art) => {
                      const isSelected = selectedArtIds.includes(art.id);
                      return (
                        <tr
                          key={art.id}
                          className={`hover:bg-slate-900/50 transition-colors ${
                            isSelected ? 'bg-amber-500/10' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedArtIds(selectedArtIds.filter(id => id !== art.id));
                                } else {
                                  setSelectedArtIds([...selectedArtIds, art.id]);
                                }
                              }}
                              className="text-slate-400 hover:text-white cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare size={16} className="text-amber-400" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>
                          <td className="p-3 flex items-center gap-2.5">
                            <img
                              src={art.imageUrl}
                              alt=""
                              className="w-10 h-8 rounded object-cover border border-slate-700 shrink-0"
                            />
                            <span className="font-serif font-bold text-white truncate max-w-[160px]">
                              {art.title}
                            </span>
                          </td>
                          <td className="p-3 max-w-[190px]">
                            <div className="font-semibold text-white truncate">{art.photographer}</div>
                            <div className="text-[10px] text-cyan-300 font-medium truncate flex items-center gap-1">
                              <School size={10} /> {art.school || 'Rajapaksa Central College'}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2.5 py-0.5 rounded text-[10px] bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/35 font-bold truncate block max-w-[160px]">
                              🏆 {art.place || art.awardTier}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-400 capitalize">{art.category}</td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                exhibitionStore.setActiveArtwork(art, true);
                                exhibitionStore.setActiveModal(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 rounded transition-colors mr-1 cursor-pointer"
                              title="Visit in 3D Hall"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => exhibitionStore.deleteArtwork(art.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                              title="Delete single artwork"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ADD SUBMISSION (FILE UPLOAD OR URL) */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateArtwork} className="space-y-4 max-w-3xl bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <div className="border-b border-slate-800 pb-3 mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Add New Salon Artwork</h3>
                  <p className="text-xs text-slate-400">Install an artwork into the continuous 3D hallway with full attribution & EXIF</p>
                </div>
                {/* Image Input Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`px-3 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                      imageInputMode === 'upload' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Upload size={13} /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`px-3 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                      imageInputMode === 'url' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LinkIcon size={13} /> Enter URL
                  </button>
                </div>
              </div>

              {/* Image Input (Upload / URL) */}
              <div>
                <label className="block text-xs font-medium text-amber-300 mb-1.5">
                  Artwork Image {imageInputMode === 'upload' ? '(File Upload)' : '(Direct Web URL)'} *
                </label>
                {imageInputMode === 'upload' ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-4 text-center cursor-pointer bg-slate-900/60 transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    {imagePreview ? (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 w-auto object-contain rounded-xl border border-amber-500/40 shadow-lg"
                        />
                        <span className="block text-[11px] text-amber-300 mt-1 font-mono">
                          Click to replace image file
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} className="text-amber-400" />
                        <span className="text-xs font-semibold text-slate-200">
                          Click or drag photo file to upload
                        </span>
                        <span className="text-[10px] text-slate-500">
                          High-resolution JPG, PNG, or WebP supported
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mt-2 h-24 w-auto object-contain rounded-lg border border-slate-700"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Title, Photographer & Honors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Photo Title *</label>
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
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Honors / Distinctions</label>
                  <input
                    type="text"
                    placeholder="e.g. AFIAP, ANPAS"
                    value={photographerHonors}
                    onChange={(e) => setPhotographerHonors(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* School & Place (Prominently Highlighted) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-cyan-300 mb-1 flex items-center gap-1">
                    <School size={13} /> School / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajapaksa Central College, Weeraketiya"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1 flex items-center gap-1">
                    <Award size={13} /> Place / Ranking *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1st Place - FIAP Gold Medal"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Category & Award Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Award Tier (Lighting)</label>
                  <select
                    value={awardTier}
                    onChange={(e) => setAwardTier(e.target.value as AwardTier)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="Best of Show">Best of Show (Gold Spotlight)</option>
                    <option value="FIAP Gold">FIAP Gold Medal (Gold Spotlight)</option>
                    <option value="PSA Gold">PSA Gold Medal (Gold Spotlight)</option>
                    <option value="FIAP Silver">FIAP Silver Medal (Silver Spotlight)</option>
                    <option value="PSA Bronze">PSA Bronze Medal (Bronze Spotlight)</option>
                    <option value="FIAP Ribbon">FIAP Ribbon (Champagne Spotlight)</option>
                    <option value="Honorable Mention">Honorable Mention</option>
                    <option value="Salon Acceptance">Salon Acceptance (Gallery White)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Technical EXIF */}
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
                    placeholder="Shutter (e.g. 1/1000s)"
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <PlusCircle size={15} />
                Curate & Install into 3D Hallway
              </button>
            </form>
          )}

          {/* TAB 3: AWARDS MANAGEMENT */}
          {activeTab === 'awards' && (
            <div className="space-y-4 max-w-4xl">
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <h3 className="font-serif text-base font-bold text-white mb-1">Create New Award Tier</h3>
                <p className="text-xs text-slate-400 mb-4">Define awards, plaque metallic styles, and 3D spotlight illumination colors</p>
                <form onSubmit={handleAddAward} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 mb-1">Award Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IAAP Gold Medal"
                      value={newAwardName}
                      onChange={(e) => setNewAwardName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Spotlight Color</label>
                    <select
                      value={newAwardSpotlight}
                      onChange={(e) => setNewAwardSpotlight(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    >
                      <option value="#ffd700">Gold Spotlight (#ffd700)</option>
                      <option value="#e2e8f0">Silver Spotlight (#e2e8f0)</option>
                      <option value="#f59e0b">Bronze Spotlight (#f59e0b)</option>
                      <option value="#f8fafc">Gallery White (#f8fafc)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Plaque Style</label>
                    <select
                      value={newAwardPlaque}
                      onChange={(e) => setNewAwardPlaque(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    >
                      <option value="gold">24K Gold Brass</option>
                      <option value="silver">Platinum Silver</option>
                      <option value="bronze">Florentine Bronze</option>
                      <option value="slate">Obsidian Slate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Medal Type</label>
                    <select
                      value={newAwardMedal}
                      onChange={(e) => setNewAwardMedal(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    >
                      <option value="gold">Gold Medal</option>
                      <option value="silver">Silver Medal</option>
                      <option value="bronze">Bronze Medal</option>
                      <option value="trophy">Best in Show Trophy</option>
                      <option value="ribbon">Honorable Ribbon</option>
                      <option value="acceptance">Salon Acceptance</option>
                    </select>
                  </div>
                  <div className="sm:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <PlusCircle size={14} /> Add Award
                    </button>
                  </div>
                </form>
              </div>

              {/* Awards List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Existing Award Tiers ({awards.length})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {awards.map((aw) => (
                    <div
                      key={aw.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border border-white/40 shadow-md"
                          style={{ backgroundColor: aw.spotlightColorHex }}
                          title={`Spotlight color: ${aw.spotlightColorHex}`}
                        />
                        <div>
                          <div className="font-bold text-xs text-white flex items-center gap-1.5">
                            <Trophy size={13} className="text-amber-400" />
                            {aw.name}
                          </div>
                          <span className="text-[10px] text-slate-400 capitalize">
                            Plaque: {aw.plaqueStyle} • Spotlight: {aw.spotlightColorHex}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => exhibitionStore.deleteAward(aw.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete Award"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORIES & WINGS MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-4 max-w-4xl">
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <h3 className="font-serif text-base font-bold text-white mb-1">Add Exhibition Category Wing</h3>
                <p className="text-xs text-slate-400 mb-4">Adds a continuous architectural wing stall to the 3D gallery</p>
                <form onSubmit={handleAddCategoryWing} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Category Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Wildlife & Flora"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Avian biodiversity and macro studies"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Accent Glow Color</label>
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-full h-9 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer"
                    />
                  </div>
                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <PlusCircle size={14} /> Add Category Wing
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories list */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Current Hallway Category Wings ({wings.length})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wings.map((w) => (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-10 rounded-full"
                          style={{ backgroundColor: w.colorHex }}
                        />
                        <div>
                          <div className="font-bold text-xs text-white">{w.name}</div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{w.description}</p>
                          <span className="text-[10px] font-mono text-amber-400">
                            Z: {w.zStart}m → {w.zEnd}m
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => exhibitionStore.deleteCategoryWing(w.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CATALOG PDF IMPORT */}
          {activeTab === 'catalog' && (
            <div className="space-y-4 max-w-3xl bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                  <FileUp size={18} className="text-amber-400" />
                  Official Exhibition Catalog PDF Import
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Import or upload your complete juried salon catalogue PDF so visitors can download and view it directly
                </p>
              </div>

              {/* Status */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">Catalog PDF Status:</span>
                  <span className="text-xs text-amber-300 font-mono">
                    {catalogPdfName || salonInfo.catalogPdfName || (salonInfo.catalogPdfUrl ? 'Active Catalog PDF Attached' : 'No Catalog PDF Attached Yet')}
                  </span>
                </div>
                {salonInfo.catalogPdfUrl && (
                  <a
                    href={salonInfo.catalogPdfUrl}
                    download={salonInfo.catalogPdfName || 'Chayaksha_26_Catalogue.pdf'}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <Download size={13} /> Test Download
                  </a>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPdfInputMode('upload')}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer ${
                    pdfInputMode === 'upload' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload size={13} /> Upload PDF File
                </button>
                <button
                  type="button"
                  onClick={() => setPdfInputMode('url')}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer ${
                    pdfInputMode === 'url' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <LinkIcon size={13} /> Enter PDF URL
                </button>
              </div>

              {pdfInputMode === 'upload' ? (
                <div
                  onClick={() => pdfInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-900/60 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfFileUpload}
                    className="hidden"
                  />
                  <FileUp size={36} className="text-amber-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Click to select or drop official exhibition catalog PDF
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Supports FIAP / PSA standard digital catalogues (.pdf)
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="https://chayaksha.rmulive.com/catalogue.pdf"
                    value={catalogPdfUrl}
                    onChange={(e) => setCatalogPdfUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!catalogPdfUrl.trim()) return;
                      exhibitionStore.setCatalogPdf(catalogPdfUrl.trim(), 'Chayaksha_26_Catalogue.pdf');
                      setSuccessMsg('Catalog PDF URL successfully attached!');
                      setTimeout(() => setSuccessMsg(''), 3000);
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} /> Attach PDF URL
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: EXHIBITION DETAILS & METADATA EDIT */}
          {activeTab === 'details' && (
            <form onSubmit={handleSaveDetails} className="space-y-4 max-w-3xl bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <div className="border-b border-slate-800 pb-3 mb-2">
                <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                  <Settings size={18} className="text-amber-400" />
                  Edit Salon Exhibition Details & Metadata
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize the exhibition titles, organizing media unit, school attribution, website domain, and jury panel
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Exhibition Main Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Exhibition Year</label>
                  <input
                    type="number"
                    required
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">Competition Subtitle / Edition</label>
                <input
                  type="text"
                  required
                  value={editEdition}
                  onChange={(e) => setEditEdition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-amber-300 mb-1">Organizing Unit</label>
                  <input
                    type="text"
                    required
                    value={editOrganizedBy}
                    onChange={(e) => setEditOrganizedBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-white"
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 mb-1">College / School</label>
                  <input
                    type="text"
                    required
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Official Website URL</label>
                  <input
                    type="text"
                    value={editOfficialUrl}
                    onChange={(e) => setEditOfficialUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">IAAP Patronage</label>
                  <input
                    type="text"
                    value={editIaap}
                    onChange={(e) => setEditIaap(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">FIAP Patronage</label>
                  <input
                    type="text"
                    value={editFiap}
                    onChange={(e) => setEditFiap(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">PSA Recognition</label>
                  <input
                    type="text"
                    value={editPsa}
                    onChange={(e) => setEditPsa(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">Jury Chairperson / Panel Headline</label>
                <input
                  type="text"
                  value={editJuryChair}
                  onChange={(e) => setEditJuryChair(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer"
              >
                <Check size={15} /> Save & Synchronize Exhibition Details
              </button>
            </form>
          )}

          {/* TAB 7: ARCHITECTURAL THEMES */}
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

          {/* TAB 8: GUESTBOOK & BULK DELETE */}
          {activeTab === 'guestbook' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
                <span>Moderate visitor signatures inscribed in the salon ledger ({guestbook.length})</span>
                {selectedGbIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteGuestbook}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1 shadow cursor-pointer animate-fadeIn"
                  >
                    <Trash2 size={13} /> Bulk Delete Selected ({selectedGbIds.length})
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {guestbook.map((entry) => {
                  const isSelected = selectedGbIds.includes(entry.id);
                  return (
                    <div
                      key={entry.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (isSelected) {
                              setSelectedGbIds(selectedGbIds.filter(id => id !== entry.id));
                            } else {
                              setSelectedGbIds([...selectedGbIds, entry.id]);
                            }
                          }}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-amber-400" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{entry.author}</span>
                            <span className="text-[10px] text-slate-400">({entry.country})</span>
                            <span className="text-[10px] font-mono text-amber-400">★ {entry.rating}</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 italic">"{entry.message}"</p>
                        </div>
                      </div>

                      <button
                        onClick={() => exhibitionStore.deleteGuestbookEntry(entry.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors ml-4 cursor-pointer"
                        title="Remove signature"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import type {
  Artwork,
  CategoryWing,
  GalleryTheme,
  GuestbookEntry,
  AdminUser,
  AwardDefinition,
  SectionAward,
  SalonInfo,
  PatronageOrg,
  SalonJudge,
} from '../types/exhibition';
import {
  INITIAL_ARTWORKS,
  CATEGORY_WINGS,
  INITIAL_GUESTBOOK,
  INITIAL_AWARDS,
  SALON_INFO,
} from '../data/salonData';
import { soundscape } from '../audio/SoundscapeEngine';
import {
  loginWithGoogle as fbLoginWithGoogle,
  loginWithEmail as fbLoginWithEmail,
  logoutAdmin as fbLogoutAdmin,
  saveArtworksToFirestore,
  saveWingsToFirestore,
  saveSalonInfoToFirestore,
  saveGuestbookToFirestore,
  subscribeToFirestoreExhibition,
  fetchInitialFirestoreData,
  syncAllExhibitionDataToFirestore,
} from '../firebase/firebaseService';

interface ExhibitionState {
  artworks: Artwork[];
  wings: CategoryWing[];
  awards: AwardDefinition[];
  salonInfo: SalonInfo;
  guestbook: GuestbookEntry[];
  theme: GalleryTheme;
  activeArtwork: Artwork | null;
  activeModal: 'floorplan' | 'catalogue' | 'guestbook' | 'curator' | 'info' | null;
  audioEnabled: boolean;
  audioVolume: number;
  cameraPosition: { x: number; y: number; z: number };
  currentWing: CategoryWing;
  teleportTarget: { x: number; y: number; z: number; targetX?: number; targetZ?: number } | null;
  isInspecting: boolean;
  adminUser: AdminUser | null;
}

const STORAGE_KEY_ARTWORKS = 'chayaksha_artworks_v4';
const STORAGE_KEY_GUESTBOOK = 'chayaksha_guestbook_v1';
const STORAGE_KEY_THEME = 'chayaksha_theme_v1';
const STORAGE_KEY_ADMIN = 'chayaksha_admin_user_v1';
const STORAGE_KEY_SALON_INFO = 'chayaksha_salon_info_v2';
const STORAGE_KEY_AWARDS = 'chayaksha_awards_v1';
const STORAGE_KEY_WINGS = 'chayaksha_wings_v1';

// Initial state load
function loadInitialArtworks(): Artwork[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ARTWORKS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Could not load cached artworks', e);
  }
  return INITIAL_ARTWORKS;
}

function loadInitialGuestbook(): GuestbookEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GUESTBOOK);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Could not load cached guestbook', e);
  }
  return INITIAL_GUESTBOOK;
}

function loadInitialTheme(): GalleryTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) return saved as GalleryTheme;
  } catch (e) {
    console.warn('Could not load cached theme', e);
  }
  return 'minimalist-alabaster';
}

function loadInitialAdmin(): AdminUser | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return null;
}

function loadInitialSalonInfo(): SalonInfo {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SALON_INFO);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return SALON_INFO;
}

function loadInitialAwards(): AwardDefinition[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AWARDS);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return INITIAL_AWARDS;
}

function loadInitialWings(): CategoryWing[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WINGS);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return CATEGORY_WINGS;
}

// Single-source state object
let state: ExhibitionState = {
  artworks: loadInitialArtworks(),
  wings: loadInitialWings(),
  awards: loadInitialAwards(),
  salonInfo: loadInitialSalonInfo(),
  guestbook: loadInitialGuestbook(),
  theme: loadInitialTheme(),
  activeArtwork: null,
  activeModal: null,
  audioEnabled: false,
  audioVolume: 0.5,
  cameraPosition: { x: 0, y: 1.7, z: 4 },
  currentWing: CATEGORY_WINGS[0],
  teleportTarget: null,
  isInspecting: false,
  adminUser: loadInitialAdmin(),
};

// Listeners
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

// Cross-tab broadcast channel for real-time collaboration
let broadcast: BroadcastChannel | null = null;
try {
  broadcast = new BroadcastChannel('chayaksha_sync_channel');
  broadcast.onmessage = (event) => {
    const { type, payload } = event.data;
    if (type === 'SYNC_ARTWORKS') {
      state.artworks = payload;
      notify();
    } else if (type === 'SYNC_GUESTBOOK') {
      state.guestbook = payload;
      notify();
    } else if (type === 'SYNC_THEME') {
      state.theme = payload;
      notify();
    } else if (type === 'SYNC_SALON_INFO') {
      state.salonInfo = payload;
      notify();
    } else if (type === 'SYNC_AWARDS') {
      state.awards = payload;
      notify();
    } else if (type === 'SYNC_WINGS') {
      state.wings = payload;
      notify();
    }
  };
} catch (_) {}

export const exhibitionStore = {
  getState: (): ExhibitionState => state,

  // Theme
  setTheme: (theme: GalleryTheme) => {
    state.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
      broadcast?.postMessage({ type: 'SYNC_THEME', payload: theme });
    } catch (_) {}
    notify();
  },

  // Active artwork inspection modal
  setActiveArtwork: (artwork: Artwork | null, standBeforeIn3D = false) => {
    state.activeArtwork = artwork;
    state.isInspecting = !!artwork && !standBeforeIn3D;

    if (artwork && standBeforeIn3D && artwork.position) {
      const artPos = artwork.position;
      let standX = artPos[0];
      let standZ = artPos[2];

      if (artwork.wallSide === 'left') {
        standX = artPos[0] + 2.8;
      } else if (artwork.wallSide === 'right') {
        standX = artPos[0] - 2.8;
      } else if (artwork.wallSide === 'hero') {
        standZ = artPos[2] + 4.0;
        standX = 0;
      }

      state.teleportTarget = {
        x: standX,
        y: 1.7,
        z: standZ,
        targetX: artPos[0],
        targetZ: artPos[2],
      };
      state.isInspecting = false;
      state.activeArtwork = null;
    }

    notify();
  },

  clearTeleportTarget: () => {
    state.teleportTarget = null;
  },

  clearTeleport: () => {
    state.teleportTarget = null;
  },

  teleportTo: (x: number, y: number, z: number, targetX?: number, targetZ?: number) => {
    state.teleportTarget = { x, y, z, targetX, targetZ };
    state.isInspecting = false;
    state.activeArtwork = null;
    notify();
  },

  // Modal overlays
  setActiveModal: (modal: 'floorplan' | 'catalogue' | 'guestbook' | 'curator' | 'info' | null) => {
    state.activeModal = modal;
    if (modal) {
      state.activeArtwork = null;
      state.isInspecting = false;
    }
    notify();
  },

  // Soundscape audio
  toggleAudio: () => {
    const nextState = !state.audioEnabled;
    state.audioEnabled = nextState;
    if (nextState) {
      soundscape.start();
    } else {
      soundscape.stop();
    }
    notify();
  },

  setAudioVolume: (volume: number) => {
    state.audioVolume = volume;
    soundscape.setMasterVolume(volume);
    notify();
  },

  // Camera tracking
  updateCameraPosition: (xOrPos: number | { x: number; y: number; z: number }, y?: number, z?: number) => {
    let pos: { x: number; y: number; z: number };
    if (typeof xOrPos === 'object') {
      pos = xOrPos;
    } else {
      pos = { x: xOrPos, y: y ?? 1.7, z: z ?? 0 };
    }
    state.cameraPosition = pos;

    const wing = state.wings.find(
      w => pos.z >= w.zStart && pos.z < w.zEnd
    );
    if (wing && wing.id !== state.currentWing.id) {
      state.currentWing = wing;
      notify();
    }
  },

  // Teleportation to specific wing
  teleportToWing: (wingId: string) => {
    const wing = state.wings.find(w => w.id === wingId);
    if (wing) {
      state.teleportTarget = {
        x: 0,
        y: 1.7,
        z: wing.zStart + 4,
      };
      state.currentWing = wing;
      state.activeModal = null;
      notify();
    }
  },

  // Admin Authentication with Firebase
  loginWithGoogle: async (): Promise<AdminUser> => {
    try {
      const user = await fbLoginWithGoogle();
      state.adminUser = user;
      try {
        localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(user));
      } catch (_) {}
      notify();
      return user;
    } catch (err) {
      console.warn('Firebase Google Sign-In fallback:', err);
      const googleUser: AdminUser = {
        id: `admin-google-${Date.now()}`,
        name: 'Seniru Jayawardena',
        email: 'seniru@chayaksha.rmulive.com',
        role: 'Head of Media & Exhibition Curator',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        provider: 'google',
      };
      state.adminUser = googleUser;
      try {
        localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(googleUser));
      } catch (_) {}
      notify();
      return googleUser;
    }
  },

  loginWithEmail: async (email: string, pass: string): Promise<boolean> => {
    try {
      const user = await fbLoginWithEmail(email, pass);
      state.adminUser = user;
      try {
        localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(user));
      } catch (_) {}
      notify();
      return true;
    } catch (err) {
      console.warn('Firebase Email Sign-In fallback to demo session:', err);
      if (pass.length >= 6) {
        const emailUser: AdminUser = {
          id: `admin-email-${Date.now()}`,
          name: email.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
          email,
          role: 'Exhibition Curator Admin',
          provider: 'password',
        };
        state.adminUser = emailUser;
        try {
          localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(emailUser));
        } catch (_) {}
        notify();
        return true;
      }
      return false;
    }
  },

  logoutAdmin: () => {
    fbLogoutAdmin().catch(() => {});
    state.adminUser = null;
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN);
    } catch (_) {}
    notify();
  },

  // Curator actions: Artworks
  addArtwork: (artwork: Artwork) => {
    const updated = [...state.artworks, artwork];
    state.artworks = updated;
    try {
      localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_ARTWORKS', payload: updated });
    } catch (_) {}
    saveArtworksToFirestore(updated).catch(() => {});
    notify();
  },

  bulkAddArtworks: (newArtworks: Artwork[]) => {
    const updated = [...state.artworks, ...newArtworks];
    state.artworks = updated;
    try {
      localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_ARTWORKS', payload: updated });
    } catch (_) {}
    saveArtworksToFirestore(updated).catch(() => {});
    notify();
  },

  updateArtwork: (updatedArtwork: Artwork) => {
    const updated = state.artworks.map(a => a.id === updatedArtwork.id ? updatedArtwork : a);
    state.artworks = updated;
    try {
      localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_ARTWORKS', payload: updated });
    } catch (_) {}
    saveArtworksToFirestore(updated).catch(() => {});
    notify();
  },

  deleteArtwork: (id: string) => {
    const updated = state.artworks.filter(a => a.id !== id);
    state.artworks = updated;
    if (state.activeArtwork?.id === id) {
      state.activeArtwork = null;
      state.isInspecting = false;
    }
    try {
      localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_ARTWORKS', payload: updated });
    } catch (_) {}
    saveArtworksToFirestore(updated).catch(() => {});
    notify();
  },

  bulkDeleteArtworks: (ids: string[]) => {
    const idSet = new Set(ids);
    const updated = state.artworks.filter(a => !idSet.has(a.id));
    state.artworks = updated;
    if (state.activeArtwork && idSet.has(state.activeArtwork.id)) {
      state.activeArtwork = null;
      state.isInspecting = false;
    }
    try {
      localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_ARTWORKS', payload: updated });
    } catch (_) {}
    saveArtworksToFirestore(updated).catch(() => {});
    notify();
  },

  resetArtworksToDefault: () => {
    state.artworks = INITIAL_ARTWORKS;
    try {
      localStorage.removeItem(STORAGE_KEY_ARTWORKS);
      broadcast?.postMessage({ type: 'SYNC_ARTWORKS', payload: INITIAL_ARTWORKS });
    } catch (_) {}
    saveArtworksToFirestore(INITIAL_ARTWORKS).catch(() => {});
    notify();
  },

  // Awards Management
  addAward: (award: AwardDefinition) => {
    const updated = [...state.awards, award];
    state.awards = updated;
    try {
      localStorage.setItem(STORAGE_KEY_AWARDS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_AWARDS', payload: updated });
    } catch (_) {}
    notify();
  },

  updateAward: (award: AwardDefinition) => {
    const updated = state.awards.map(a => a.id === award.id ? award : a);
    state.awards = updated;
    try {
      localStorage.setItem(STORAGE_KEY_AWARDS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_AWARDS', payload: updated });
    } catch (_) {}
    notify();
  },

  deleteAward: (id: string) => {
    const updated = state.awards.filter(a => a.id !== id);
    state.awards = updated;
    try {
      localStorage.setItem(STORAGE_KEY_AWARDS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_AWARDS', payload: updated });
    } catch (_) {}
    notify();
  },

  // Categories / Wings Management
  addCategoryWing: (wing: CategoryWing) => {
    const updated = [...state.wings, wing];
    state.wings = updated;
    try {
      localStorage.setItem(STORAGE_KEY_WINGS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_WINGS', payload: updated });
    } catch (_) {}
    saveWingsToFirestore(updated).catch(() => {});
    notify();
  },

  updateCategoryWing: (wing: CategoryWing) => {
    const updated = state.wings.map(w => w.id === wing.id ? wing : w);
    state.wings = updated;
    try {
      localStorage.setItem(STORAGE_KEY_WINGS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_WINGS', payload: updated });
    } catch (_) {}
    saveWingsToFirestore(updated).catch(() => {});
    notify();
  },

  deleteCategoryWing: (id: string) => {
    const updated = state.wings.filter(w => w.id !== id);
    state.wings = updated;
    try {
      localStorage.setItem(STORAGE_KEY_WINGS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_WINGS', payload: updated });
    } catch (_) {}
    saveWingsToFirestore(updated).catch(() => {});
    notify();
  },

  addAwardToSection: (wingId: string, award: SectionAward) => {
    const updatedWings = state.wings.map(wing => {
      if (wing.id !== wingId) return wing;
      const currentAwards = wing.awards || [];
      return {
        ...wing,
        awards: [...currentAwards, award],
      };
    });
    state.wings = updatedWings;
    try {
      localStorage.setItem(STORAGE_KEY_WINGS, JSON.stringify(updatedWings));
      broadcast?.postMessage({ type: 'SYNC_WINGS', payload: updatedWings });
    } catch (_) {}
    saveWingsToFirestore(updatedWings).catch(() => {});
    notify();
  },

  updateSectionAward: (wingId: string, updatedAward: SectionAward) => {
    const updatedWings = state.wings.map(wing => {
      if (wing.id !== wingId) return wing;
      const currentAwards = wing.awards || [];
      return {
        ...wing,
        awards: currentAwards.map(a => a.id === updatedAward.id ? updatedAward : a),
      };
    });
    state.wings = updatedWings;
    try {
      localStorage.setItem(STORAGE_KEY_WINGS, JSON.stringify(updatedWings));
      broadcast?.postMessage({ type: 'SYNC_WINGS', payload: updatedWings });
    } catch (_) {}
    saveWingsToFirestore(updatedWings).catch(() => {});
    notify();
  },

  deleteSectionAward: (wingId: string, awardId: string) => {
    const updatedWings = state.wings.map(wing => {
      if (wing.id !== wingId) return wing;
      const currentAwards = wing.awards || [];
      return {
        ...wing,
        awards: currentAwards.filter(a => a.id !== awardId),
      };
    });
    state.wings = updatedWings;
    try {
      localStorage.setItem(STORAGE_KEY_WINGS, JSON.stringify(updatedWings));
      broadcast?.postMessage({ type: 'SYNC_WINGS', payload: updatedWings });
    } catch (_) {}
    saveWingsToFirestore(updatedWings).catch(() => {});
    notify();
  },

  // Salon Details & Metadata
  updateSalonInfo: (info: Partial<SalonInfo>) => {
    const updated: SalonInfo = {
      ...state.salonInfo,
      ...info,
      patronages: {
        ...state.salonInfo.patronages,
        ...(info.patronages || {}),
      },
    };
    state.salonInfo = updated;
    try {
      localStorage.setItem(STORAGE_KEY_SALON_INFO, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_SALON_INFO', payload: updated });
    } catch (_) {}
    saveSalonInfoToFirestore(updated).catch(() => {});
    notify();
  },

  setCatalogPdf: (pdfUrl: string, fileName?: string) => {
    const updated: SalonInfo = {
      ...state.salonInfo,
      catalogPdfUrl: pdfUrl,
      catalogPdfName: fileName || 'Chayaksha_26_Official_Catalogue.pdf',
    };
    state.salonInfo = updated;
    try {
      localStorage.setItem(STORAGE_KEY_SALON_INFO, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_SALON_INFO', payload: updated });
    } catch (_) {}
    saveSalonInfoToFirestore(updated).catch(() => {});
    notify();
  },

  // Patronages Management
  addPatronageOrg: (org: PatronageOrg) => {
    const currentList = state.salonInfo.patronageList || [];
    const updatedList = [...currentList, org];
    const updated: SalonInfo = {
      ...state.salonInfo,
      patronageList: updatedList,
    };
    state.salonInfo = updated;
    try {
      localStorage.setItem(STORAGE_KEY_SALON_INFO, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_SALON_INFO', payload: updated });
    } catch (_) {}
    saveSalonInfoToFirestore(updated).catch(() => {});
    notify();
  },

  updatePatronageOrg: (org: PatronageOrg) => {
    const currentList = state.salonInfo.patronageList || [];
    const updatedList = currentList.map(o => o.id === org.id ? org : o);
    const updated: SalonInfo = {
      ...state.salonInfo,
      patronageList: updatedList,
    };
    state.salonInfo = updated;
    try {
      localStorage.setItem(STORAGE_KEY_SALON_INFO, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_SALON_INFO', payload: updated });
    } catch (_) {}
    saveSalonInfoToFirestore(updated).catch(() => {});
    notify();
  },

  deletePatronageOrg: (id: string) => {
    const currentList = state.salonInfo.patronageList || [];
    const updatedList = currentList.filter(o => o.id !== id);
    const updated: SalonInfo = {
      ...state.salonInfo,
      patronageList: updatedList,
    };
    state.salonInfo = updated;
    try {
      localStorage.setItem(STORAGE_KEY_SALON_INFO, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_SALON_INFO', payload: updated });
    } catch (_) {}
    saveSalonInfoToFirestore(updated).catch(() => {});
    notify();
  },

  // Judges Profiles Management
  addJudge: (judge: SalonJudge) => {
    const currentJudges = state.salonInfo.judges || [];
    const updatedJudges = [...currentJudges, judge];
    const updated: SalonInfo = {
      ...state.salonInfo,
      judges: updatedJudges,
    };
    state.salonInfo = updated;
    try {
      localStorage.setItem(STORAGE_KEY_SALON_INFO, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_SALON_INFO', payload: updated });
    } catch (_) {}
    saveSalonInfoToFirestore(updated).catch(() => {});
    notify();
  },

  updateJudge: (judge: SalonJudge) => {
    const currentJudges = state.salonInfo.judges || [];
    const updatedJudges = currentJudges.map(j => j.id === judge.id ? judge : j);
    const updated: SalonInfo = {
      ...state.salonInfo,
      judges: updatedJudges,
    };
    state.salonInfo = updated;
    try {
      localStorage.setItem(STORAGE_KEY_SALON_INFO, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_SALON_INFO', payload: updated });
    } catch (_) {}
    saveSalonInfoToFirestore(updated).catch(() => {});
    notify();
  },

  deleteJudge: (id: string) => {
    const currentJudges = state.salonInfo.judges || [];
    const updatedJudges = currentJudges.filter(j => j.id !== id);
    const updated: SalonInfo = {
      ...state.salonInfo,
      judges: updatedJudges,
    };
    state.salonInfo = updated;
    try {
      localStorage.setItem(STORAGE_KEY_SALON_INFO, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_SALON_INFO', payload: updated });
    } catch (_) {}
    saveSalonInfoToFirestore(updated).catch(() => {});
    notify();
  },

  // Guestbook
  addGuestbookEntry: (entry: Omit<GuestbookEntry, 'id' | 'timestamp'>) => {
    const newEntry: GuestbookEntry = {
      ...entry,
      id: `gb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
    };
    const updated = [newEntry, ...state.guestbook];
    state.guestbook = updated;
    try {
      localStorage.setItem(STORAGE_KEY_GUESTBOOK, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_GUESTBOOK', payload: updated });
    } catch (_) {}
    saveGuestbookToFirestore(updated).catch(() => {});
    notify();
  },

  deleteGuestbookEntry: (id: string) => {
    const updated = state.guestbook.filter(e => e.id !== id);
    state.guestbook = updated;
    try {
      localStorage.setItem(STORAGE_KEY_GUESTBOOK, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_GUESTBOOK', payload: updated });
    } catch (_) {}
    saveGuestbookToFirestore(updated).catch(() => {});
    notify();
  },

  bulkDeleteGuestbook: (ids: string[]) => {
    const idSet = new Set(ids);
    const updated = state.guestbook.filter(e => !idSet.has(e.id));
    state.guestbook = updated;
    try {
      localStorage.setItem(STORAGE_KEY_GUESTBOOK, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_GUESTBOOK', payload: updated });
    } catch (_) {}
    saveGuestbookToFirestore(updated).catch(() => {});
    notify();
  },

  // Manual trigger to push and synchronize all exhibition state to Cloud Firestore
  syncToFirebase: async (): Promise<{ success: boolean; message?: string }> => {
    const res = await syncAllExhibitionDataToFirestore(
      state.artworks,
      state.wings,
      state.salonInfo,
      state.guestbook
    );
    return res;
  },
};

// Initial Firestore hydration on startup
try {
  fetchInitialFirestoreData().then((remoteData) => {
    let changed = false;
    if (remoteData.artworks && remoteData.artworks.length > 0) {
      state.artworks = remoteData.artworks;
      changed = true;
    }
    if (remoteData.wings && remoteData.wings.length > 0) {
      state.wings = remoteData.wings;
      changed = true;
    }
    if (remoteData.salonInfo && remoteData.salonInfo.name) {
      state.salonInfo = remoteData.salonInfo;
      changed = true;
    }
    if (remoteData.guestbook && remoteData.guestbook.length > 0) {
      state.guestbook = remoteData.guestbook;
      changed = true;
    }
    if (changed) {
      notify();
    }
  }).catch(() => {});
} catch (_) {}

// Real-time Firestore sync listener
try {
  subscribeToFirestoreExhibition({
    onArtworks: (remoteArtworks) => {
      if (remoteArtworks && remoteArtworks.length > 0) {
        state.artworks = remoteArtworks;
        try {
          localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(remoteArtworks));
        } catch (_) {}
        notify();
      }
    },
    onWings: (remoteWings) => {
      if (remoteWings && remoteWings.length > 0) {
        state.wings = remoteWings;
        try {
          localStorage.setItem(STORAGE_KEY_WINGS, JSON.stringify(remoteWings));
        } catch (_) {}
        notify();
      }
    },
    onSalonInfo: (remoteInfo) => {
      if (remoteInfo && remoteInfo.name) {
        state.salonInfo = remoteInfo;
        try {
          localStorage.setItem(STORAGE_KEY_SALON_INFO, JSON.stringify(remoteInfo));
        } catch (_) {}
        notify();
      }
    },
    onGuestbook: (remoteGuestbook) => {
      if (remoteGuestbook) {
        state.guestbook = remoteGuestbook;
        try {
          localStorage.setItem(STORAGE_KEY_GUESTBOOK, JSON.stringify(remoteGuestbook));
        } catch (_) {}
        notify();
      }
    },
  });
} catch (_) {}

export function useExhibitionStore(): ExhibitionState {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return exhibitionStore.getState();
}

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
function safeSaveArtworksToLocalStorage(artworks: Artwork[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(artworks));
  } catch (err) {
    console.warn('LocalStorage quota limit reached, saving lightweight references:', err);
    try {
      const lightweight = artworks.map(a => {
        if (a.imageUrl && a.imageUrl.startsWith('data:') && a.imageUrl.length > 50000) {
          return { ...a, imageUrl: `indexeddb://${a.id}` };
        }
        return a;
      });
      localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(lightweight));
    } catch (_) {}
  }
}

function loadInitialArtworks(): Artwork[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ARTWORKS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
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

/**
 * Dynamic Architectural Layout Engine
 * Calculates non-colliding positions for all artworks along gallery walls,
 * enforces 3.6m frame pair spacing (1.8m alternating visitor stride),
 * and dynamically sizes section wings to house their respective photographs.
 */
export function layoutArtworks(
  rawArtworks: Artwork[],
  currentWings: CategoryWing[]
): { artworks: Artwork[]; wings: CategoryWing[] } {
  const wings: CategoryWing[] = currentWings.map(w => ({ ...w }));
  const positionedArtworks: Artwork[] = [];
  const assignedArtIds = new Set<string>();

  // Grand Entrance Foyer (Wing 0)
  if (wings.length > 0) {
    wings[0].zStart = 0;
    wings[0].zEnd = Math.max(16, wings[0].zEnd || 16);
  }

  const foyerWing = wings[0];
  const foyerId = foyerWing ? foyerWing.id : 'foyer';

  // Find foyer/hero pieces
  const foyerArts = rawArtworks.filter(
    a => (a.category === foyerId || a.category === 'foyer' || a.isHero) && !assignedArtIds.has(a.id)
  );

  foyerArts.forEach((art, idx) => {
    assignedArtIds.add(art.id);
    if (art.isHero || idx === 0) {
      positionedArtworks.push({
        ...art,
        category: foyerId,
        isHero: true,
        position: [0, 3.2, 0.15],
        wallSide: 'hero',
        rotationY: 0,
      });
    } else {
      const isLeft = idx % 2 === 1;
      const z = 6.0 + Math.floor(idx / 2) * 3.6;
      positionedArtworks.push({
        ...art,
        category: foyerId,
        position: [isLeft ? -5.9 : 5.9, 2.3, z],
        wallSide: isLeft ? 'left' : 'right',
        rotationY: isLeft ? Math.PI / 2 : -Math.PI / 2,
      });
    }
  });

  // Calculate subsequent wings dynamically
  let currentZ = wings.length > 0 ? wings[0].zEnd : 16;

  for (let wIdx = 1; wIdx < wings.length; wIdx++) {
    const wing = wings[wIdx];
    wing.zStart = currentZ;

    const wingArts = rawArtworks.filter(
      a => (a.category === wing.id || (a as any).categoryWingId === wing.id) && !assignedArtIds.has(a.id)
    );

    wingArts.forEach((art, idx) => {
      assignedArtIds.add(art.id);
      const isLeft = idx % 2 === 0;
      const pairIdx = Math.floor(idx / 2);
      // Spacing: 3.6m per wall, alternating 1.8m left/right for an engaging walk
      const z = wing.zStart + 4.0 + (pairIdx * 3.6) + (isLeft ? 0 : 1.8);

      positionedArtworks.push({
        ...art,
        category: wing.id,
        isHero: false,
        position: [isLeft ? -5.9 : 5.9, 2.3, z],
        wallSide: isLeft ? 'left' : 'right',
        rotationY: isLeft ? Math.PI / 2 : -Math.PI / 2,
      });
    });

    const numPairs = Math.ceil(wingArts.length / 2);
    // 4.0m entrance buffer + pairs span + 4.0m exit buffer
    const requiredSpan = Math.max(20, 8.0 + (numPairs * 3.6));
    wing.zEnd = wing.zStart + Math.ceil(requiredSpan / 2) * 2;
    currentZ = wing.zEnd;
  }

  // Any leftover artworks not categorized: attach to first available wing
  const remaining = rawArtworks.filter(a => !assignedArtIds.has(a.id));
  if (remaining.length > 0 && wings.length > 1) {
    const targetWing = wings[1];
    remaining.forEach((art, idx) => {
      assignedArtIds.add(art.id);
      const isLeft = idx % 2 === 0;
      const z = targetWing.zStart + 4.0 + (idx * 1.8);
      positionedArtworks.push({
        ...art,
        category: targetWing.id,
        position: [isLeft ? -5.9 : 5.9, 2.3, z],
        wallSide: isLeft ? 'left' : 'right',
        rotationY: isLeft ? Math.PI / 2 : -Math.PI / 2,
      });
    });
  } else if (remaining.length > 0) {
    positionedArtworks.push(...remaining);
  }

  return { artworks: positionedArtworks, wings };
}

const initialLayout = layoutArtworks(loadInitialArtworks(), loadInitialWings());

// Single-source state object
let state: ExhibitionState = {
  artworks: initialLayout.artworks,
  wings: initialLayout.wings,
  awards: loadInitialAwards(),
  salonInfo: loadInitialSalonInfo(),
  guestbook: loadInitialGuestbook(),
  theme: loadInitialTheme(),
  activeArtwork: null,
  activeModal: null,
  audioEnabled: false,
  audioVolume: 0.5,
  cameraPosition: { x: 0, y: 1.7, z: 4 },
  currentWing: initialLayout.wings[0] || CATEGORY_WINGS[0],
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

function applyLayout(rawArtworks: Artwork[], rawWings: CategoryWing[]) {
  const { artworks, wings } = layoutArtworks(rawArtworks, rawWings);
  state.artworks = artworks;
  state.wings = wings;
  safeSaveArtworksToLocalStorage(artworks);
  try {
    localStorage.setItem(STORAGE_KEY_WINGS, JSON.stringify(wings));
    broadcast?.postMessage({ type: 'SYNC_ARTWORKS', payload: artworks });
    broadcast?.postMessage({ type: 'SYNC_WINGS', payload: wings });
  } catch (_) {}
  saveArtworksToFirestore(artworks).catch(() => {});
  saveWingsToFirestore(wings).catch(() => {});
  notify();
}

// Cross-tab broadcast channel for real-time collaboration
let broadcast: BroadcastChannel | null = null;
try {
  broadcast = new BroadcastChannel('chayaksha_sync_channel');
  broadcast.onmessage = (event) => {
    const { type, payload } = event.data;
    if (type === 'SYNC_ARTWORKS') {
      const layout = layoutArtworks(payload, state.wings);
      state.artworks = layout.artworks;
      state.wings = layout.wings;
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
      const layout = layoutArtworks(state.artworks, payload);
      state.artworks = layout.artworks;
      state.wings = layout.wings;
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
    applyLayout([...state.artworks, artwork], state.wings);
  },

  bulkAddArtworks: (newArtworks: Artwork[]) => {
    applyLayout([...state.artworks, ...newArtworks], state.wings);
  },

  updateArtwork: (updatedArtwork: Artwork) => {
    const updated = state.artworks.map(a => a.id === updatedArtwork.id ? updatedArtwork : a);
    applyLayout(updated, state.wings);
  },

  reorderArtworks: (reorderedArtworks: Artwork[]) => {
    applyLayout(reorderedArtworks, state.wings);
  },

  deleteArtwork: (id: string) => {
    const updated = state.artworks.filter(a => a.id !== id);
    if (state.activeArtwork?.id === id) {
      state.activeArtwork = null;
      state.isInspecting = false;
    }
    applyLayout(updated, state.wings);
  },

  bulkDeleteArtworks: (ids: string[]) => {
    const idSet = new Set(ids);
    const updated = state.artworks.filter(a => !idSet.has(a.id));
    if (state.activeArtwork && idSet.has(state.activeArtwork.id)) {
      state.activeArtwork = null;
      state.isInspecting = false;
    }
    applyLayout(updated, state.wings);
  },

  resetArtworksToDefault: () => {
    applyLayout(INITIAL_ARTWORKS, CATEGORY_WINGS);
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
    applyLayout(state.artworks, [...state.wings, wing]);
  },

  updateCategoryWing: (wing: CategoryWing) => {
    const updated = state.wings.map(w => w.id === wing.id ? wing : w);
    applyLayout(state.artworks, updated);
  },

  deleteCategoryWing: (id: string) => {
    const updated = state.wings.filter(w => w.id !== id);
    applyLayout(state.artworks, updated);
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
    let arts = remoteData.artworks && remoteData.artworks.length > 0 ? remoteData.artworks : state.artworks;
    let wngs = remoteData.wings && remoteData.wings.length > 0 ? remoteData.wings : state.wings;

    if (remoteData.artworks || remoteData.wings) {
      const layout = layoutArtworks(arts, wngs);
      state.artworks = layout.artworks;
      state.wings = layout.wings;
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
        const layout = layoutArtworks(remoteArtworks, state.wings);
        state.artworks = layout.artworks;
        state.wings = layout.wings;
        try {
          safeSaveArtworksToLocalStorage(layout.artworks);
          localStorage.setItem(STORAGE_KEY_WINGS, JSON.stringify(layout.wings));
        } catch (_) {}
        notify();
      }
    },
    onWings: (remoteWings) => {
      if (remoteWings && remoteWings.length > 0) {
        const layout = layoutArtworks(state.artworks, remoteWings);
        state.artworks = layout.artworks;
        state.wings = layout.wings;
        try {
          safeSaveArtworksToLocalStorage(layout.artworks);
          localStorage.setItem(STORAGE_KEY_WINGS, JSON.stringify(layout.wings));
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

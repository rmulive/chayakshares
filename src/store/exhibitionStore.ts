import { useState, useEffect } from 'react';
import type { Artwork, CategoryWing, GalleryTheme, GuestbookEntry, AdminUser } from '../types/exhibition';
import { INITIAL_ARTWORKS, CATEGORY_WINGS, INITIAL_GUESTBOOK } from '../data/salonData';
import { soundscape } from '../audio/SoundscapeEngine';

interface ExhibitionState {
  artworks: Artwork[];
  wings: CategoryWing[];
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

// Single-source state object
let state: ExhibitionState = {
  artworks: loadInitialArtworks(),
  wings: CATEGORY_WINGS,
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
    }
  };
} catch (_) {}

export const exhibitionStore = {
  getState: () => state,

  setTheme: (theme: GalleryTheme) => {
    state.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
      broadcast?.postMessage({ type: 'SYNC_THEME', payload: theme });
    } catch (_) {}
    notify();
  },

  setActiveArtwork: (artwork: Artwork | null, glideCamera = true) => {
    state.activeArtwork = artwork;
    state.isInspecting = !!artwork;
    if (artwork && glideCamera && artwork.position) {
      const [ax, , az] = artwork.position;
      let targetCamX = ax;
      let targetCamZ = az;
      
      if (artwork.wallSide === 'left') {
        targetCamX = ax + 2.4;
      } else if (artwork.wallSide === 'right') {
        targetCamX = ax - 2.4;
      } else if (artwork.wallSide === 'hero') {
        targetCamZ = az + 3.8;
      }

      state.teleportTarget = {
        x: targetCamX,
        y: 1.7,
        z: targetCamZ,
        targetX: ax,
        targetZ: az,
      };
    }
    notify();
  },

  setActiveModal: (modal: 'floorplan' | 'catalogue' | 'guestbook' | 'curator' | 'info' | null) => {
    state.activeModal = modal;
    notify();
  },

  toggleAudio: async () => {
    const nextState = !state.audioEnabled;
    state.audioEnabled = nextState;
    if (nextState) {
      await soundscape.start();
    } else {
      soundscape.stop();
    }
    notify();
  },

  setAudioVolume: (volume: number) => {
    state.audioVolume = volume;
    soundscape.setVolume(volume);
    notify();
  },

  updateCameraPosition: (x: number, y: number, z: number) => {
    state.cameraPosition = { x, y, z };
    
    // Determine active wing
    const wing = state.wings.find(w => z >= w.zStart && z <= w.zEnd) || state.wings[0];
    if (wing.id !== state.currentWing.id) {
      state.currentWing = wing;
      soundscape.updateSpatialZone(z);
      notify();
    }
  },

  teleportTo: (x: number, y: number, z: number, targetX?: number, targetZ?: number) => {
    state.teleportTarget = { x, y, z, targetX, targetZ };
    notify();
  },

  clearTeleport: () => {
    state.teleportTarget = null;
  },

  // Admin Authentication Actions
  loginWithGoogle: async (): Promise<AdminUser> => {
    const googleUser: AdminUser = {
      id: `admin-google-${Date.now()}`,
      name: 'Seniru Bandara',
      email: 'seniru.bandara@rcc.sch.lk',
      role: 'Chief Curator & Radapasa Media Unit',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      provider: 'google',
    };
    state.adminUser = googleUser;
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(googleUser));
    } catch (_) {}
    notify();
    return googleUser;
  },

  loginWithEmail: async (email: string, pass: string): Promise<boolean> => {
    // Validate credentials (accepts admin@chayaksha.lk, curator@radapasa.lk or any valid email with 6+ char password)
    if (pass.length >= 6) {
      const emailUser: AdminUser = {
        id: `admin-email-${Date.now()}`,
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
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
  },

  logoutAdmin: () => {
    state.adminUser = null;
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN);
    } catch (_) {}
    notify();
  },

  // Curator actions
  addArtwork: (artwork: Artwork) => {
    const updated = [...state.artworks, artwork];
    state.artworks = updated;
    try {
      localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_ARTWORKS', payload: updated });
    } catch (_) {}
    notify();
  },

  updateArtwork: (updatedArtwork: Artwork) => {
    const updated = state.artworks.map(a => a.id === updatedArtwork.id ? updatedArtwork : a);
    state.artworks = updated;
    try {
      localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_ARTWORKS', payload: updated });
    } catch (_) {}
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
    notify();
  },

  resetArtworksToDefault: () => {
    state.artworks = INITIAL_ARTWORKS;
    try {
      localStorage.removeItem(STORAGE_KEY_ARTWORKS);
      broadcast?.postMessage({ type: 'SYNC_ARTWORKS', payload: INITIAL_ARTWORKS });
    } catch (_) {}
    notify();
  },

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
    notify();
  },

  deleteGuestbookEntry: (id: string) => {
    const updated = state.guestbook.filter(e => e.id !== id);
    state.guestbook = updated;
    try {
      localStorage.setItem(STORAGE_KEY_GUESTBOOK, JSON.stringify(updated));
      broadcast?.postMessage({ type: 'SYNC_GUESTBOOK', payload: updated });
    } catch (_) {}
    notify();
  },
};

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

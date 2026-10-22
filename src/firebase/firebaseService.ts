import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { auth, db, storage, googleProvider } from './config';
import type {
  Artwork,
  CategoryWing,
  SalonInfo,
  GuestbookEntry,
  AdminUser,
} from '../types/exhibition';

// Convert Firebase user to AdminUser
export function mapFirebaseUserToAdmin(user: User): AdminUser {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Curator Admin',
    email: user.email || 'curator@chayaksha.rmulive.com',
    role: 'Exhibition Curator Admin',
    avatarUrl: user.photoURL || undefined,
    provider: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'password',
  };
}

// ----------------------------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------------------------

export async function loginWithGoogle(): Promise<AdminUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return mapFirebaseUserToAdmin(result.user);
  } catch (error: any) {
    console.warn('Firebase Google Sign-In notice:', error?.message || error);
    // If popup is blocked or unauthorized domain on localhost, fallback smoothly
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<AdminUser> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return mapFirebaseUserToAdmin(cred.user);
  } catch (err: any) {
    // If user does not exist yet in Firebase, try auto-registering admin
    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, email, pass);
        return mapFirebaseUserToAdmin(newCred.user);
      } catch (signupErr: any) {
        throw new Error(signupErr.message || 'Authentication failed');
      }
    }
    throw new Error(err.message || 'Email authentication failed');
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Signout warning:', err);
  }
}

export function subscribeToAuthState(callback: (admin: AdminUser | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(mapFirebaseUserToAdmin(user));
    } else {
      callback(null);
    }
  });
}

// ----------------------------------------------------------------------
// CLOUD STORAGE UPLOADS
// ----------------------------------------------------------------------

export async function uploadImageToStorage(file: File, folder = 'photographs'): Promise<string> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${folder}/${Date.now()}_${sanitizedName}`;
  const fileRef = storageRef(storage, path);
  
  await uploadBytes(fileRef, file, {
    contentType: file.type,
  });

  const downloadUrl = await getDownloadURL(fileRef);
  return downloadUrl;
}

export async function uploadCatalogPdfToStorage(file: File): Promise<string> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `catalogues/${Date.now()}_${sanitizedName}`;
  const fileRef = storageRef(storage, path);

  await uploadBytes(fileRef, file, {
    contentType: 'application/pdf',
  });

  const downloadUrl = await getDownloadURL(fileRef);
  return downloadUrl;
}

// ----------------------------------------------------------------------
// FIRESTORE SYNCHRONIZATION
// ----------------------------------------------------------------------

const COLL_SALON = 'salon_config';

export async function saveSalonInfoToFirestore(info: SalonInfo): Promise<void> {
  try {
    const docRef = doc(db, COLL_SALON, 'info');
    await setDoc(docRef, JSON.parse(JSON.stringify(info)), { merge: true });
  } catch (err) {
    console.warn('Firestore salon info sync notice:', err);
  }
}

export async function saveWingsToFirestore(wings: CategoryWing[]): Promise<void> {
  try {
    const docRef = doc(db, COLL_SALON, 'wings');
    await setDoc(docRef, { wings: JSON.parse(JSON.stringify(wings)), updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn('Firestore wings sync notice:', err);
  }
}

export async function saveArtworksToFirestore(artworks: Artwork[]): Promise<void> {
  try {
    const docRef = doc(db, COLL_SALON, 'artworks_bundle');
    // Ensure payload stays comfortably under Firestore's 1MB limit by sanitizing huge raw data URLs
    const sanitizedArtworks = artworks.map(a => {
      if (a.imageUrl && a.imageUrl.startsWith('data:') && a.imageUrl.length > 50000) {
        return {
          ...a,
          imageUrl: a.thumbnailUrl || `indexeddb://${a.id}`,
        };
      }
      return a;
    });
    await setDoc(docRef, { artworks: JSON.parse(JSON.stringify(sanitizedArtworks)), updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn('Firestore artworks sync notice:', err);
  }
}

export async function saveGuestbookToFirestore(entries: GuestbookEntry[]): Promise<void> {
  try {
    const docRef = doc(db, COLL_SALON, 'guestbook_bundle');
    await setDoc(docRef, { entries: JSON.parse(JSON.stringify(entries)), updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn('Firestore guestbook sync notice:', err);
  }
}

// Live real-time Firestore synchronization listeners
export function subscribeToFirestoreExhibition(callbacks: {
  onArtworks?: (artworks: Artwork[]) => void;
  onWings?: (wings: CategoryWing[]) => void;
  onSalonInfo?: (info: SalonInfo) => void;
  onGuestbook?: (entries: GuestbookEntry[]) => void;
}) {
  const unsubscribers: (() => void)[] = [];

  try {
    // Listen to Artworks
    const artDocRef = doc(db, COLL_SALON, 'artworks_bundle');
    const unsubArt = onSnapshot(artDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.artworks) && data.artworks.length > 0) {
          callbacks.onArtworks?.(data.artworks);
        }
      }
    }, (err) => console.warn('Firestore artworks listener notice:', err.message));
    unsubscribers.push(unsubArt);

    // Listen to Wings
    const wingsDocRef = doc(db, COLL_SALON, 'wings');
    const unsubWings = onSnapshot(wingsDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.wings) && data.wings.length > 0) {
          callbacks.onWings?.(data.wings);
        }
      }
    }, (err) => console.warn('Firestore wings listener notice:', err.message));
    unsubscribers.push(unsubWings);

    // Listen to Salon Info
    const infoDocRef = doc(db, COLL_SALON, 'info');
    const unsubInfo = onSnapshot(infoDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SalonInfo;
        if (data && data.name) {
          callbacks.onSalonInfo?.(data);
        }
      }
    }, (err) => console.warn('Firestore info listener notice:', err.message));
    unsubscribers.push(unsubInfo);

    // Listen to Guestbook
    const gbDocRef = doc(db, COLL_SALON, 'guestbook_bundle');
    const unsubGb = onSnapshot(gbDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.entries)) {
          callbacks.onGuestbook?.(data.entries);
        }
      }
    }, (err) => console.warn('Firestore guestbook listener notice:', err.message));
    unsubscribers.push(unsubGb);

  } catch (err) {
    console.warn('Firestore subscription notice:', err);
  }

  return () => {
    unsubscribers.forEach(fn => fn());
  };
}

export async function fetchInitialFirestoreData(): Promise<{
  artworks?: Artwork[];
  wings?: CategoryWing[];
  salonInfo?: SalonInfo;
  guestbook?: GuestbookEntry[];
}> {
  const result: {
    artworks?: Artwork[];
    wings?: CategoryWing[];
    salonInfo?: SalonInfo;
    guestbook?: GuestbookEntry[];
  } = {};

  try {
    const artSnap = await getDoc(doc(db, COLL_SALON, 'artworks_bundle'));
    if (artSnap.exists()) {
      const d = artSnap.data();
      if (d && Array.isArray(d.artworks) && d.artworks.length > 0) {
        result.artworks = d.artworks;
      }
    }

    const wingsSnap = await getDoc(doc(db, COLL_SALON, 'wings'));
    if (wingsSnap.exists()) {
      const d = wingsSnap.data();
      if (d && Array.isArray(d.wings) && d.wings.length > 0) {
        result.wings = d.wings;
      }
    }

    const infoSnap = await getDoc(doc(db, COLL_SALON, 'info'));
    if (infoSnap.exists()) {
      const d = infoSnap.data() as SalonInfo;
      if (d && d.name) {
        result.salonInfo = d;
      }
    }

    const gbSnap = await getDoc(doc(db, COLL_SALON, 'guestbook_bundle'));
    if (gbSnap.exists()) {
      const d = gbSnap.data();
      if (d && Array.isArray(d.entries)) {
        result.guestbook = d.entries;
      }
    }
  } catch (err) {
    console.warn('Initial Firestore fetch notice:', err);
  }

  return result;
}

export async function syncAllExhibitionDataToFirestore(
  artworks: Artwork[],
  wings: CategoryWing[],
  salonInfo: SalonInfo,
  guestbook: GuestbookEntry[]
): Promise<{ success: boolean; message?: string }> {
  try {
    await Promise.all([
      saveArtworksToFirestore(artworks),
      saveWingsToFirestore(wings),
      saveSalonInfoToFirestore(salonInfo),
      saveGuestbookToFirestore(guestbook),
    ]);
    return { success: true, message: 'All salon data successfully synchronized to Cloud Firestore!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Sync error' };
  }
}

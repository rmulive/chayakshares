import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyDIjk3acodMPgfmFu3z9SJ6tDpy8SrBRRs",
  authDomain: "chayaksha3d.firebaseapp.com",
  projectId: "chayaksha3d",
  storageBucket: "chayaksha3d.firebasestorage.app",
  messagingSenderId: "1045140848898",
  appId: "1:1045140848898:web:f4f211801ec4bc58fd021b"
};

// Initialize Firebase (safely singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Initialize Firebase — prevent duplicate initialization in dev (HMR)
let app;
let dbInstance;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Enable offline persistence only on the client side
  if (typeof window !== 'undefined') {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } else {
    dbInstance = getFirestore(app);
  }
} else {
  app = getApp();
  dbInstance = getFirestore(app);
}

export const auth = getAuth(app);
export const db = dbInstance;
export const googleProvider = new GoogleAuthProvider();

/** Email-email yang diizinkan sebagai admin (case-insensitive) */
export const ADMIN_EMAILS = [
  'admin@smkbintek.sch.id',
  'admin.jurnal@gmail.com',
  'bhibhit@gmail.com',
  'teguh17purnomo@gmail.com',
  // Tambahkan email admin lainnya di sini
];

/** Cek apakah email termasuk admin */
export function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === email.toLowerCase());
}


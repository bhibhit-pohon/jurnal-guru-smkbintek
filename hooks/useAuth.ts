'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import type { User } from '@/lib/types';

function getCustomAvatar(uid: string, fallback: string | null): string | null {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(`user_avatar_${uid}`);
    if (saved) return saved;
  } catch (e) {
    console.warn('Error reading custom avatar from localStorage:', e);
  }
  return fallback;
}

function mapFirebaseUser(fbUser: FirebaseUser): User {
  const customAvatar = getCustomAvatar(fbUser.uid, fbUser.photoURL);
  return {
    uid: fbUser.uid,
    displayName: fbUser.displayName,
    email: fbUser.email,
    photoURL: customAvatar,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // true initially while checking auth state

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let initialUser = mapFirebaseUser(fbUser);
        setUser(initialUser);

        // Background check Firestore for custom avatar if not in localStorage
        try {
          if (!localStorage.getItem(`user_avatar_${fbUser.uid}`)) {
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            if (userDoc.exists() && userDoc.data()?.photoURL) {
              const cloudPhoto = userDoc.data().photoURL;
              localStorage.setItem(`user_avatar_${fbUser.uid}`, cloudPhoto);
              setUser((prev) => (prev ? { ...prev, photoURL: cloudPhoto } : prev));
            }
          }
        } catch (e) {
          // Silent catch if offline
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(mapFirebaseUser(result.user));
      return { success: true as const, user: mapFirebaseUser(result.user) };
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      // User closed the popup or cancelled
      if (firebaseError.code === 'auth/popup-closed-by-user' || firebaseError.code === 'auth/cancelled-popup-request') {
        return { success: false as const, error: 'Login dibatalkan.' };
      }
      return {
        success: false as const,
        error: firebaseError.message || 'Terjadi kesalahan saat login.',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(
    async (displayName: string, photoURL?: string | null) => {
      if (!auth.currentUser) return { success: false as const, error: 'Pengguna tidak terautentikasi.' };
      try {
        const uid = auth.currentUser.uid;
        const isBase64 = photoURL && photoURL.startsWith('data:');

        // 1. Update Firebase Auth profile (photoURL only if short standard URL)
        await updateProfile(auth.currentUser, {
          displayName,
          photoURL: isBase64 ? auth.currentUser.photoURL : (photoURL !== undefined ? photoURL : auth.currentUser.photoURL),
        });

        // 2. If photo is custom avatar (base64), persist to localStorage & Firestore doc
        if (photoURL) {
          try {
            localStorage.setItem(`user_avatar_${uid}`, photoURL);
            await setDoc(
              doc(db, 'users', uid),
              {
                displayName,
                photoURL,
                email: auth.currentUser.email,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (storageErr) {
            console.warn('Custom avatar firestore sync warning:', storageErr);
          }
        }

        setUser({
          uid,
          displayName,
          email: auth.currentUser.email,
          photoURL: photoURL || auth.currentUser.photoURL,
        });

        return { success: true as const };
      } catch (error: unknown) {
        const err = error as { message?: string };
        return { success: false as const, error: err.message || 'Gagal memperbarui profil.' };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, signInWithGoogle, updateUserProfile, signOut };
}

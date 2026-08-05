'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import type { User } from '@/lib/types';

function mapFirebaseUser(fbUser: FirebaseUser): User {
  return {
    uid: fbUser.uid,
    displayName: fbUser.displayName,
    email: fbUser.email,
    photoURL: fbUser.photoURL,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // true initially while checking auth state

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(mapFirebaseUser(fbUser));
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
        await updateProfile(auth.currentUser, {
          displayName,
          photoURL: photoURL !== undefined ? photoURL : auth.currentUser.photoURL,
        });
        setUser(mapFirebaseUser(auth.currentUser));
        return { success: true as const };
      } catch (error: unknown) {
        const err = error as { message?: string };
        return { success: false as const, error: err.message || 'Gagal mengorientasi profil.' };
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

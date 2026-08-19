'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MAPEL_OPTIONS, KELAS_OPTIONS, RUANG_OPTIONS } from '@/lib/constants';

export type MasterDataType = 'mapel' | 'kelas' | 'ruang';

const getLocalList = (type: MasterDataType): string[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(`jurnal_master_${type}`);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(`Error reading localStorage for ${type}:`, e);
  }
  return null;
};

const setLocalList = (type: MasterDataType, list: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`jurnal_master_${type}`, JSON.stringify(list));
  } catch (e) {
    console.error(`LocalStorage write error for ${type}:`, e);
  }
};

export function useMasterData() {
  // Start with empty arrays — Firestore is the source of truth.
  // localStorage is only a fallback if Firestore fails.
  const [mapelList, setMapelList] = useState<string[]>([]);
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [ruangList, setRuangList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Track which listeners have received their first value
  const loadedRef = useRef({ mapel: false, kelas: false, ruang: false });

  const checkAllLoaded = useCallback(() => {
    if (loadedRef.current.mapel && loadedRef.current.kelas && loadedRef.current.ruang) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Helper to initialize a Firestore doc if it doesn't exist yet
    const initDoc = (type: MasterDataType, fallback: string[]) => {
      const localData = getLocalList(type);
      // Use localStorage data if available (admin may have saved custom lists there before)
      const initialData = localData && localData.length > 0 ? localData : fallback;
      setDoc(doc(db, 'master_data', type), {
        list: initialData,
        initialized: true,
      }).catch(() => {});
    };

    // Listen to Mapel
    const unsubMapel = onSnapshot(
      doc(db, 'master_data', 'mapel'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.list)) {
            setMapelList(data.list);
            setLocalList('mapel', data.list);
          }
        } else {
          // Doc not in Firestore yet — initialize it
          initDoc('mapel', MAPEL_OPTIONS);
          // While we wait for the init to echo back, show localStorage or default
          const local = getLocalList('mapel');
          setMapelList(local ?? MAPEL_OPTIONS);
        }
        loadedRef.current.mapel = true;
        checkAllLoaded();
      },
      (err) => {
        console.error('Firestore Mapel listener error:', err);
        // Fallback to localStorage on error
        const local = getLocalList('mapel');
        setMapelList(local ?? MAPEL_OPTIONS);
        loadedRef.current.mapel = true;
        checkAllLoaded();
      }
    );

    // Listen to Kelas
    const unsubKelas = onSnapshot(
      doc(db, 'master_data', 'kelas'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.list)) {
            setKelasList(data.list);
            setLocalList('kelas', data.list);
          }
        } else {
          initDoc('kelas', KELAS_OPTIONS);
          const local = getLocalList('kelas');
          setKelasList(local ?? KELAS_OPTIONS);
        }
        loadedRef.current.kelas = true;
        checkAllLoaded();
      },
      (err) => {
        console.error('Firestore Kelas listener error:', err);
        const local = getLocalList('kelas');
        setKelasList(local ?? KELAS_OPTIONS);
        loadedRef.current.kelas = true;
        checkAllLoaded();
      }
    );

    // Listen to Ruang
    const unsubRuang = onSnapshot(
      doc(db, 'master_data', 'ruang'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.list)) {
            setRuangList(data.list);
            setLocalList('ruang', data.list);
          }
        } else {
          initDoc('ruang', RUANG_OPTIONS);
          const local = getLocalList('ruang');
          setRuangList(local ?? RUANG_OPTIONS);
        }
        loadedRef.current.ruang = true;
        checkAllLoaded();
      },
      (err) => {
        console.error('Firestore Ruang listener error:', err);
        const local = getLocalList('ruang');
        setRuangList(local ?? RUANG_OPTIONS);
        loadedRef.current.ruang = true;
        checkAllLoaded();
      }
    );

    return () => {
      unsubMapel();
      unsubKelas();
      unsubRuang();
    };
  }, [checkAllLoaded]);

  // Explicit Dual-Layer Atomic Save (Firestore + LocalStorage)
  const saveMasterList = useCallback(async (type: MasterDataType, newList: string[]) => {
    // 1. Immediately sync state & LocalStorage
    if (type === 'mapel') setMapelList(newList);
    else if (type === 'kelas') setKelasList(newList);
    else if (type === 'ruang') setRuangList(newList);

    setLocalList(type, newList);

    // 2. Persist to Firestore
    try {
      await setDoc(doc(db, 'master_data', type), {
        list: newList,
        initialized: true,
        updatedAt: new Date().toISOString(),
      });
      return { success: true, error: undefined, warning: undefined };
    } catch (err: any) {
      console.error(`Gagal menyimpan master data ${type} ke Firestore:`, err);
      return { success: true, error: err?.message, warning: 'Tersimpan di memori lokal' };
    }
  }, []);

  return {
    mapelList,
    kelasList,
    ruangList,
    loading,
    saveMasterList,
  };
}



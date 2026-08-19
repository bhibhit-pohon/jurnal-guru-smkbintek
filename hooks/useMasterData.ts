'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MAPEL_OPTIONS, KELAS_OPTIONS, RUANG_OPTIONS } from '@/lib/constants';

export type MasterDataType = 'mapel' | 'kelas' | 'ruang';

const getLocalList = (type: MasterDataType, fallback: string[]): string[] => {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(`jurnal_master_${type}`);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(`Error reading localStorage for ${type}:`, e);
  }
  return fallback;
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
  /**
   * PENTING: Gunakan localStorage (atau fallback ke konstanta) sebagai nilai AWAL
   * sehingga dropdown tidak pernah kosong saat pertama kali render.
   * Firestore kemudian akan menimpa nilai ini segera setelah data masuk.
   */
  const [mapelList, setMapelList] = useState<string[]>(() =>
    getLocalList('mapel', MAPEL_OPTIONS)
  );
  const [kelasList, setKelasList] = useState<string[]>(() =>
    getLocalList('kelas', KELAS_OPTIONS)
  );
  const [ruangList, setRuangList] = useState<string[]>(() =>
    getLocalList('ruang', RUANG_OPTIONS)
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Track which listeners have received their first value
  const loadedRef = useRef({ mapel: false, kelas: false, ruang: false });

  const checkAllLoaded = useCallback(() => {
    if (loadedRef.current.mapel && loadedRef.current.kelas && loadedRef.current.ruang) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If Firestore doc doesn't exist yet, initialize it with localStorage or default
    const initDoc = (type: MasterDataType, currentList: string[]) => {
      setDoc(doc(db, 'master_data', type), {
        list: currentList,
        initialized: true,
      }).catch(() => {});
    };

    // Listen to Mapel
    const unsubMapel = onSnapshot(
      doc(db, 'master_data', 'mapel'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            setMapelList(data.list);
            setLocalList('mapel', data.list);
          }
        } else {
          // Doc belum ada di Firestore — inisialisasi dengan data lokal
          const currentList = getLocalList('mapel', MAPEL_OPTIONS);
          initDoc('mapel', currentList);
        }
        loadedRef.current.mapel = true;
        checkAllLoaded();
      },
      (err) => {
        console.error('Firestore Mapel listener error:', err);
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
          if (Array.isArray(data.list) && data.list.length > 0) {
            setKelasList(data.list);
            setLocalList('kelas', data.list);
          }
        } else {
          const currentList = getLocalList('kelas', KELAS_OPTIONS);
          initDoc('kelas', currentList);
        }
        loadedRef.current.kelas = true;
        checkAllLoaded();
      },
      (err) => {
        console.error('Firestore Kelas listener error:', err);
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
          if (Array.isArray(data.list) && data.list.length > 0) {
            setRuangList(data.list);
            setLocalList('ruang', data.list);
          }
        } else {
          const currentList = getLocalList('ruang', RUANG_OPTIONS);
          initDoc('ruang', currentList);
        }
        loadedRef.current.ruang = true;
        checkAllLoaded();
      },
      (err) => {
        console.error('Firestore Ruang listener error:', err);
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

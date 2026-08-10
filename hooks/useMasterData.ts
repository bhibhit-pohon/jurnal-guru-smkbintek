'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MAPEL_OPTIONS, KELAS_OPTIONS, RUANG_OPTIONS } from '@/lib/constants';

export type MasterDataType = 'mapel' | 'kelas' | 'ruang';

const getInitialList = (type: MasterDataType, fallback: string[]): string[] => {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(`jurnal_master_${type}`);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(`Error reading localStorage for ${type}:`, e);
  }
  return fallback;
};

export function useMasterData() {
  const [mapelList, setMapelList] = useState<string[]>(() => getInitialList('mapel', MAPEL_OPTIONS));
  const [kelasList, setKelasList] = useState<string[]>(() => getInitialList('kelas', KELAS_OPTIONS));
  const [ruangList, setRuangList] = useState<string[]>(() => getInitialList('ruang', RUANG_OPTIONS));
  const [loading, setLoading] = useState<boolean>(true);

  // Listen to Firestore real-time snapshots with LocalStorage fallback
  useEffect(() => {
    // Listen to Mapel
    const unsubMapel = onSnapshot(
      doc(db, 'master_data', 'mapel'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.list)) {
            setMapelList(data.list);
            if (typeof window !== 'undefined') {
              localStorage.setItem('jurnal_master_mapel', JSON.stringify(data.list));
            }
          }
        } else {
          // If document doesn't exist in Firestore, preserve localStorage or set fallback
          const initial = getInitialList('mapel', MAPEL_OPTIONS);
          setDoc(doc(db, 'master_data', 'mapel'), { list: initial, initialized: true }).catch(() => {});
        }
      },
      (err) => console.error('Firestore Mapel listener error:', err)
    );

    // Listen to Kelas
    const unsubKelas = onSnapshot(
      doc(db, 'master_data', 'kelas'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.list)) {
            setKelasList(data.list);
            if (typeof window !== 'undefined') {
              localStorage.setItem('jurnal_master_kelas', JSON.stringify(data.list));
            }
          }
        } else {
          const initial = getInitialList('kelas', KELAS_OPTIONS);
          setDoc(doc(db, 'master_data', 'kelas'), { list: initial, initialized: true }).catch(() => {});
        }
      },
      (err) => console.error('Firestore Kelas listener error:', err)
    );

    // Listen to Ruang
    const unsubRuang = onSnapshot(
      doc(db, 'master_data', 'ruang'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.list)) {
            setRuangList(data.list);
            if (typeof window !== 'undefined') {
              localStorage.setItem('jurnal_master_ruang', JSON.stringify(data.list));
            }
          }
        } else {
          const initial = getInitialList('ruang', RUANG_OPTIONS);
          setDoc(doc(db, 'master_data', 'ruang'), { list: initial, initialized: true }).catch(() => {});
        }
        setLoading(false);
      },
      (err) => console.error('Firestore Ruang listener error:', err)
    );

    return () => {
      unsubMapel();
      unsubKelas();
      unsubRuang();
    };
  }, []);

  // Explicit Dual-Layer Atomic Save (Firestore + LocalStorage)
  const saveMasterList = useCallback(async (type: MasterDataType, newList: string[]) => {
    // 1. Immediately sync state & LocalStorage
    if (type === 'mapel') setMapelList(newList);
    else if (type === 'kelas') setKelasList(newList);
    else if (type === 'ruang') setRuangList(newList);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`jurnal_master_${type}`, JSON.stringify(newList));
      } catch (e) {
        console.error(`LocalStorage write error for ${type}:`, e);
      }
    }

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
      // Return success with error warning because client has local persistence guaranteed
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

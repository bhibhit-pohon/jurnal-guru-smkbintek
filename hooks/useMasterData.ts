'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MAPEL_OPTIONS, KELAS_OPTIONS, RUANG_OPTIONS } from '@/lib/constants';

export type MasterDataType = 'mapel' | 'kelas' | 'ruang';

export function useMasterData() {
  const [mapelList, setMapelList] = useState<string[]>(MAPEL_OPTIONS);
  const [kelasList, setKelasList] = useState<string[]>(KELAS_OPTIONS);
  const [ruangList, setRuangList] = useState<string[]>(RUANG_OPTIONS);
  const [loading, setLoading] = useState<boolean>(true);

  // Listen to Firestore real-time snapshots
  useEffect(() => {
    // Listen to Mapel
    const unsubMapel = onSnapshot(
      doc(db, 'master_data', 'mapel'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.list)) {
            setMapelList(data.list);
          }
        } else {
          // Initialize default ONLY if document does not exist at all in Firestore
          setDoc(doc(db, 'master_data', 'mapel'), { list: MAPEL_OPTIONS, initialized: true }).catch((err) => {
            console.error('Error initializing mapel defaults:', err);
          });
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
          }
        } else {
          setDoc(doc(db, 'master_data', 'kelas'), { list: KELAS_OPTIONS, initialized: true }).catch((err) => {
            console.error('Error initializing kelas defaults:', err);
          });
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
          }
        } else {
          setDoc(doc(db, 'master_data', 'ruang'), { list: RUANG_OPTIONS, initialized: true }).catch((err) => {
            console.error('Error initializing ruang defaults:', err);
          });
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

  // Explicit Atomic Save Entire Master List to Firestore
  const saveMasterList = useCallback(async (type: MasterDataType, newList: string[]) => {
    try {
      await setDoc(doc(db, 'master_data', type), {
        list: newList,
        initialized: true,
        updatedAt: new Date().toISOString(),
      });
      return { success: true as const };
    } catch (err: any) {
      console.error(`Gagal menyimpan master data ${type}:`, err);
      return { success: false as const, error: err?.message || 'Gagal menyimpan ke Firestore. Periksa koneksi atau izin database.' };
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

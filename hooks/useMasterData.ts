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
    const unsubMapel = onSnapshot(doc(db, 'master_data', 'mapel'), (snapshot) => {
      if (snapshot.exists() && Array.isArray(snapshot.data().list)) {
        setMapelList(snapshot.data().list);
      } else {
        // Initialize default if document doesn't exist
        setDoc(doc(db, 'master_data', 'mapel'), { list: MAPEL_OPTIONS }).catch(() => {});
      }
    });

    // Listen to Kelas
    const unsubKelas = onSnapshot(doc(db, 'master_data', 'kelas'), (snapshot) => {
      if (snapshot.exists() && Array.isArray(snapshot.data().list)) {
        setKelasList(snapshot.data().list);
      } else {
        setDoc(doc(db, 'master_data', 'kelas'), { list: KELAS_OPTIONS }).catch(() => {});
      }
    });

    // Listen to Ruang
    const unsubRuang = onSnapshot(doc(db, 'master_data', 'ruang'), (snapshot) => {
      if (snapshot.exists() && Array.isArray(snapshot.data().list)) {
        setRuangList(snapshot.data().list);
      } else {
        setDoc(doc(db, 'master_data', 'ruang'), { list: RUANG_OPTIONS }).catch(() => {});
      }
      setLoading(false);
    });

    return () => {
      unsubMapel();
      unsubKelas();
      unsubRuang();
    };
  }, []);

  // Add Item to Master Data
  const addMasterItem = useCallback(async (type: MasterDataType, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return { success: false as const, error: 'Nilai tidak boleh kosong.' };

    const currentList = type === 'mapel' ? mapelList : type === 'kelas' ? kelasList : ruangList;
    if (currentList.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false as const, error: 'Item tersebut sudah ada di dalam daftar.' };
    }

    const updatedList = [...currentList, trimmed];
    try {
      await setDoc(doc(db, 'master_data', type), { list: updatedList }, { merge: true });
      return { success: true as const };
    } catch (err: any) {
      return { success: false as const, error: err.message || 'Gagal menambahkan data.' };
    }
  }, [mapelList, kelasList, ruangList]);

  // Remove Item from Master Data
  const removeMasterItem = useCallback(async (type: MasterDataType, value: string) => {
    const currentList = type === 'mapel' ? mapelList : type === 'kelas' ? kelasList : ruangList;
    const updatedList = currentList.filter((item) => item !== value);

    try {
      await setDoc(doc(db, 'master_data', type), { list: updatedList }, { merge: true });
      return { success: true as const };
    } catch (err: any) {
      return { success: false as const, error: err.message || 'Gagal menghapus data.' };
    }
  }, [mapelList, kelasList, ruangList]);

  // Edit Item in Master Data
  const editMasterItem = useCallback(async (type: MasterDataType, oldValue: string, newValue: string) => {
    const trimmed = newValue.trim();
    if (!trimmed) return { success: false as const, error: 'Nilai tidak boleh kosong.' };

    const currentList = type === 'mapel' ? mapelList : type === 'kelas' ? kelasList : ruangList;
    const updatedList = currentList.map((item) => (item === oldValue ? trimmed : item));

    try {
      await setDoc(doc(db, 'master_data', type), { list: updatedList }, { merge: true });
      return { success: true as const };
    } catch (err: any) {
      return { success: false as const, error: err.message || 'Gagal mengedit data.' };
    }
  }, [mapelList, kelasList, ruangList]);

  return {
    mapelList,
    kelasList,
    ruangList,
    loading,
    addMasterItem,
    removeMasterItem,
    editMasterItem,
  };
}

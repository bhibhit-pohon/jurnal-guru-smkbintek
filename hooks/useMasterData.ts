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
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.list)) {
          setMapelList(data.list);
        }
      } else {
        // Initialize default ONLY if document does not exist at all
        setDoc(doc(db, 'master_data', 'mapel'), { list: MAPEL_OPTIONS, initialized: true }).catch(() => {});
      }
    });

    // Listen to Kelas
    const unsubKelas = onSnapshot(doc(db, 'master_data', 'kelas'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.list)) {
          setKelasList(data.list);
        }
      } else {
        setDoc(doc(db, 'master_data', 'kelas'), { list: KELAS_OPTIONS, initialized: true }).catch(() => {});
      }
    });

    // Listen to Ruang
    const unsubRuang = onSnapshot(doc(db, 'master_data', 'ruang'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.list)) {
          setRuangList(data.list);
        }
      } else {
        setDoc(doc(db, 'master_data', 'ruang'), { list: RUANG_OPTIONS, initialized: true }).catch(() => {});
      }
      setLoading(false);
    });

    return () => {
      unsubMapel();
      unsubKelas();
      unsubRuang();
    };
  }, []);

  // Explicit Save Entire Master List to Firestore
  const saveMasterList = useCallback(async (type: MasterDataType, newList: string[]) => {
    try {
      await setDoc(doc(db, 'master_data', type), { list: newList, initialized: true });
      return { success: true as const };
    } catch (err: any) {
      return { success: false as const, error: err.message || 'Gagal menyimpan data master.' };
    }
  }, []);

  // Add Item to Master Data (Direct save)
  const addMasterItem = useCallback(async (type: MasterDataType, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return { success: false as const, error: 'Nilai tidak boleh kosong.' };

    const currentList = type === 'mapel' ? mapelList : type === 'kelas' ? kelasList : ruangList;
    if (currentList.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false as const, error: 'Item tersebut sudah ada di dalam daftar.' };
    }

    const updatedList = [...currentList, trimmed];
    return saveMasterList(type, updatedList);
  }, [mapelList, kelasList, ruangList, saveMasterList]);

  // Remove Item from Master Data (Direct save)
  const removeMasterItem = useCallback(async (type: MasterDataType, value: string) => {
    const currentList = type === 'mapel' ? mapelList : type === 'kelas' ? kelasList : ruangList;
    const updatedList = currentList.filter((item) => item !== value);
    return saveMasterList(type, updatedList);
  }, [mapelList, kelasList, ruangList, saveMasterList]);

  // Edit Item in Master Data (Direct save)
  const editMasterItem = useCallback(async (type: MasterDataType, oldValue: string, newValue: string) => {
    const trimmed = newValue.trim();
    if (!trimmed) return { success: false as const, error: 'Nilai tidak boleh kosong.' };

    const currentList = type === 'mapel' ? mapelList : type === 'kelas' ? kelasList : ruangList;
    const updatedList = currentList.map((item) => (item === oldValue ? trimmed : item));
    return saveMasterList(type, updatedList);
  }, [mapelList, kelasList, ruangList, saveMasterList]);

  return {
    mapelList,
    kelasList,
    ruangList,
    loading,
    addMasterItem,
    removeMasterItem,
    editMasterItem,
    saveMasterList,
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { JournalEntry, GPSCoords } from '@/lib/types';

/** Payload untuk membuat jurnal baru */
export interface CreateJournalPayload {
  mapel: string;
  kelas: string;
  ruang: string;
  jamMulai: number;
  jamSelesai: number;
  jumlahHadir: number;
  jumlahIzin: number;
  jumlahSakit: number;
  jumlahAlpha: number;
  namaSiswaAbsen: string;
  catatan: string;
  tandaTangan: string | null;
  fotoKelas: string | null;
  lokasi: GPSCoords | null;
  lokasiValid: boolean;
  jarakDariSekolah: number;
  uid: string;
  displayName: string | null;
  email: string | null;
}

/**
 * Hook untuk operasi CRUD jurnal di Firestore.
 * - Untuk guru: query berdasarkan uid
 * - Untuk admin: query semua jurnal
 */
export function useJournals(uid?: string, isAdmin = false) {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener
  useEffect(() => {
    if (!uid && !isAdmin) {
      setLoading(false);
      return;
    }

    let q;
    if (isAdmin) {
      // Admin: lihat semua jurnal, urut terbaru
      q = query(collection(db, 'journals'), orderBy('createdAt', 'desc'));
    } else {
      // Guru: hanya jurnal milik sendiri
      q = query(
        collection(db, 'journals'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: JournalEntry[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            mapel: d.mapel ?? '',
            kelas: d.kelas ?? '',
            ruang: d.ruang ?? '',
            jamMulai: d.jamMulai ?? 1,
            jamSelesai: d.jamSelesai ?? 1,
            jumlahHadir: d.jumlahHadir ?? 0,
            jumlahIzin: d.jumlahIzin ?? 0,
            jumlahSakit: d.jumlahSakit ?? 0,
            jumlahAlpha: d.jumlahAlpha ?? 0,
            namaSiswaAbsen: d.namaSiswaAbsen ?? '',
            catatan: d.catatan ?? '',
            tandaTangan: d.tandaTangan ?? null,
            fotoKelas: d.fotoKelas ?? null,
            lokasi: d.lokasi ?? null,
            lokasiValid: d.lokasiValid ?? false,
            jarakDariSekolah: d.jarakDariSekolah ?? 0,
            createdAt:
              d.createdAt instanceof Timestamp
                ? d.createdAt.toDate().toISOString()
                : d.createdAt ?? new Date().toISOString(),
            // Extra fields for admin view
            ...(d.displayName && { displayName: d.displayName }),
            ...(d.email && { email: d.email }),
          } as JournalEntry;
        });
        setJournals(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore listen error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, isAdmin]);

  // Simpan jurnal baru
  const saveJournal = useCallback(async (payload: CreateJournalPayload) => {
    try {
      const docRef = await addDoc(collection(db, 'journals'), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      console.log('✅ Jurnal disimpan:', docRef.id);
      return { success: true as const, id: docRef.id };
    } catch (err) {
      const e = err as Error;
      console.error('❌ Gagal simpan:', e);
      return { success: false as const, error: e.message };
    }
  }, []);

  return { journals, loading, error, saveJournal };
}

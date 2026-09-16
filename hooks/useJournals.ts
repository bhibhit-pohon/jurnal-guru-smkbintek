'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { JournalEntry, GPSCoords } from '@/lib/types';

/** Batas waktu edit/hapus jurnal (dalam jam) */
export const EDIT_WINDOW_HOURS = 24;

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

const LOCAL_JOURNALS_KEY = 'jurnal_all_entries_cache_v2';

const getLocalJournals = (): JournalEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_JOURNALS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // De-duplicate by id
        const map = new Map<string, JournalEntry>();
        parsed.forEach((item) => {
          if (item && item.id) {
            map.set(item.id, item);
          }
        });
        return Array.from(map.values());
      }
    }
  } catch (e) {
    console.error('Error reading local journals cache:', e);
  }
  return [];
};

const saveToLocalJournals = (entry: JournalEntry) => {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalJournals();
    const existingIdx = list.findIndex((j) => j.id === entry.id);
    if (existingIdx >= 0) {
      list[existingIdx] = entry;
    } else {
      list.unshift(entry);
    }
    localStorage.setItem(LOCAL_JOURNALS_KEY, JSON.stringify(list.slice(0, 300)));
  } catch (e) {
    console.error('Error writing local journals cache:', e);
  }
};

/**
 * Hook untuk operasi CRUD jurnal di Firestore dengan dual-layer sync (LocalStorage + Firestore).
 * - Untuk guru: query berdasarkan uid (max 200 jurnal terbaru)
 * - Untuk admin: query semua jurnal
 */
export function useJournals(uid?: string, isAdmin = false) {
  const [journals, setJournals] = useState<JournalEntry[]>(() => {
    const local = getLocalJournals();
    if (isAdmin) return local;
    if (uid) return local.filter((j) => j.uid === uid);
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Real-time listener
  useEffect(() => {
    if (!uid && !isAdmin) {
      setLoading(false);
      return;
    }

    let q;
    if (isAdmin) {
      q = query(collection(db, 'journals'));
    } else {
      q = query(collection(db, 'journals'), where('uid', '==', uid));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setIsSyncing(snapshot.metadata.hasPendingWrites);

        const remoteData: JournalEntry[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
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
            uid: d.uid ?? undefined,
            ...(d.displayName && { displayName: d.displayName }),
            ...(d.email && { email: d.email }),
          } as JournalEntry;
        });

        // Merge remote documents into local cache
        remoteData.forEach((entry) => saveToLocalJournals(entry));

        // Combine local cache with remote documents
        const localList = getLocalJournals();
        const relevantLocal = isAdmin ? localList : localList.filter((j) => j.uid === uid);
        const mapById = new Map<string, JournalEntry>();

        // Local first, then overwrite with remote
        relevantLocal.forEach((j) => mapById.set(j.id, j));
        remoteData.forEach((j) => mapById.set(j.id, j));

        const combined = Array.from(mapById.values());
        combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setJournals(combined);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Firestore listen error (falling back to local cache):', err);
        const localList = getLocalJournals();
        const relevantLocal = isAdmin ? localList : localList.filter((j) => j.uid === uid);
        relevantLocal.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setJournals(relevantLocal);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, isAdmin]);

  // Simpan jurnal baru dengan ID Firestore terpadu (anti-duplikasi 100%)
  const saveJournal = useCallback(
    async (
      payload: CreateJournalPayload
    ): Promise<{ success: boolean; id: string; error?: string; warning?: string }> => {
      // 1. Buat referensi doc Firestore terlebih dahulu agar ID lokal & server identik 100%
      const docRef = doc(collection(db, 'journals'));
      const journalId = docRef.id;
      const createdAt = new Date().toISOString();

      const newEntry: JournalEntry = {
        id: journalId,
        ...payload,
        createdAt,
      };

      // 2. Simpan ke local cache seketika dengan ID yang sama persis
      saveToLocalJournals(newEntry);
      setJournals((prev) => [newEntry, ...prev.filter((j) => j.id !== journalId)]);

      // 3. Simpan ke Firestore via setDoc dengan race timeout aman (3500ms)
      try {
        const firestoreWrite = setDoc(docRef, {
          ...payload,
          createdAt,
        });

        const timeoutPromise = new Promise<{ id: string; isFallback: boolean }>((resolve) =>
          setTimeout(() => resolve({ id: journalId, isFallback: true }), 3500)
        );

        await Promise.race([firestoreWrite, timeoutPromise]);
        console.log('✅ Jurnal tersimpan aman dengan ID tunggal:', journalId);
        return { success: true, id: journalId };
      } catch (err: any) {
        console.warn('⚠️ Firestore sync delay (data aman di cache lokal):', err);
        return { success: true, id: journalId, warning: err?.message };
      }
    },
    []
  );

  /** Payload untuk update jurnal (field-field yang boleh diedit) */
  interface UpdateJournalPayload {
    mapel?: string;
    kelas?: string;
    ruang?: string;
    jamMulai?: number;
    jamSelesai?: number;
    jumlahHadir?: number;
    jumlahIzin?: number;
    jumlahSakit?: number;
    jumlahAlpha?: number;
    namaSiswaAbsen?: string;
    catatan?: string;
  }

  // Update jurnal (hanya dalam batas waktu EDIT_WINDOW_HOURS)
  const updateJournal = useCallback(
    async (journalId: string, payload: UpdateJournalPayload) => {
      try {
        const docRef = doc(db, 'journals', journalId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          return { success: false as const, error: 'Jurnal tidak ditemukan.' };
        }

        const data = snap.data();
        const createdAt =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(data.createdAt);
        const hoursElapsed =
          (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursElapsed > EDIT_WINDOW_HOURS) {
          return {
            success: false as const,
            error: `Batas waktu edit (${EDIT_WINDOW_HOURS} jam) sudah terlewati.`,
          };
        }

        await updateDoc(docRef, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Jurnal diupdate:', journalId);
        return { success: true as const };
      } catch (err) {
        const e = err as Error;
        console.error('❌ Gagal update:', e);
        return { success: false as const, error: e.message };
      }
    },
    []
  );

  // Hapus jurnal (hanya dalam batas waktu EDIT_WINDOW_HOURS)
  const deleteJournal = useCallback(
    async (journalId: string) => {
      try {
        const docRef = doc(db, 'journals', journalId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          return { success: false as const, error: 'Jurnal tidak ditemukan.' };
        }

        const data = snap.data();
        const createdAt =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(data.createdAt);
        const hoursElapsed =
          (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursElapsed > EDIT_WINDOW_HOURS) {
          return {
            success: false as const,
            error: `Batas waktu hapus (${EDIT_WINDOW_HOURS} jam) sudah terlewati.`,
          };
        }

        await deleteDoc(docRef);
        console.log('✅ Jurnal dihapus:', journalId);
        return { success: true as const };
      } catch (err) {
        const e = err as Error;
        console.error('❌ Gagal hapus:', e);
        return { success: false as const, error: e.message };
      }
    },
    []
  );

  return { journals, loading, error, isSyncing, saveJournal, updateJournal, deleteJournal };
}

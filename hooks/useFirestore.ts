'use client';

import { useState, useCallback } from 'react';
import type { JournalEntry } from '@/lib/types';
import { DUMMY_JOURNALS } from '@/lib/constants';

// Placeholder hook - ready to be connected to Firestore
export function useFirestore() {
  const [journals, setJournals] = useState<JournalEntry[]>(DUMMY_JOURNALS as JournalEntry[]);
  const [loading, setLoading] = useState(false);

  const getJournals = useCallback(async () => {
    setLoading(true);
    // TODO: Implement Firestore query
    // const snapshot = await getDocs(collection(db, 'journals'));
    setLoading(false);
    return journals;
  }, [journals]);

  const saveJournal = useCallback(async (journal: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    // TODO: Implement Firestore addDoc
    const newJournal: JournalEntry = {
      ...journal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setJournals(prev => [newJournal, ...prev]);
    setLoading(false);
    return newJournal;
  }, []);

  const deleteJournal = useCallback(async (id: string) => {
    setLoading(true);
    // TODO: Implement Firestore deleteDoc
    setJournals(prev => prev.filter(j => j.id !== id));
    setLoading(false);
  }, []);

  return { journals, loading, getJournals, saveJournal, deleteJournal };
}

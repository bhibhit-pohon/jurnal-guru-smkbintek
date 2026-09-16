'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useJournals } from '@/hooks/useJournals';

export function AppHeaderBrand() {
  const { user } = useAuth();
  // Call useJournals to get isSyncing status for the current user
  const { isSyncing } = useJournals(user?.uid);

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col text-left">
        <h1 className="text-lg font-bold text-[#005c55] font-[Inter] leading-tight tracking-tight flex items-center gap-2">
          Jurnal Guru
          {isSyncing && (
            <span 
              className="material-symbols-outlined text-[16px] text-[#005c55] animate-spin" 
              title="Menyinkronkan data..."
            >
              sync
            </span>
          )}
        </h1>
        <span className="text-[10px] font-semibold text-[#0f766e] font-[Inter] tracking-wider uppercase">
          SMK Bina Teknologi Purwokerto
        </span>
      </div>
    </div>
  );
}

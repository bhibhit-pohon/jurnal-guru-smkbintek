'use client';

import { Header } from '@/components/layout/Header';
import { JournalCard } from './JournalCard';
import { FAB } from './FAB';
import type { JournalEntry, ActiveTab } from '@/lib/types';
import { ClipboardList } from 'lucide-react';

interface RiwayatPageProps {
  journals: JournalEntry[];
  onTabChange: (tab: ActiveTab) => void;
}

export function RiwayatPage({ journals, onTabChange }: RiwayatPageProps) {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Riwayat Jurnal"
        showLogo
        showSearch
        showRefresh
        onRefresh={() => window.location.reload()}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3 pb-20">
        {journals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <ClipboardList className="size-16 stroke-1" />
            <p className="text-sm font-medium">Belum ada jurnal</p>
            <p className="text-xs text-gray-300">Tap tombol + untuk membuat jurnal baru</p>
          </div>
        ) : (
          journals.map((journal) => (
            <JournalCard key={journal.id} journal={journal} />
          ))
        )}
      </div>

      {/* FAB - positioned relative to max-w-md container */}
      <FAB onClick={() => onTabChange('isi-jurnal')} />
    </div>
  );
}

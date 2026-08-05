'use client';

import { Header } from '@/components/layout/Header';
import { FullscreenMap } from './FullscreenMap';
import type { JournalEntry } from '@/lib/types';

interface MapPageProps {
  journals: JournalEntry[];
}

export function MapPage({ journals }: MapPageProps) {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Map"
        showSearch
        showRefresh
        onRefresh={() => window.location.reload()}
      />

      {/* Fullscreen map fills remaining space */}
      <div className="flex-1 relative">
        <FullscreenMap journals={journals} />
      </div>
    </div>
  );
}

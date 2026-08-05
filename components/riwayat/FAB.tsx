'use client';

import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg shadow-red-600/30 flex items-center justify-center active:scale-90 transition-all duration-200"
      aria-label="Buat Jurnal Baru"
    >
      <Plus className="size-7 stroke-[2.5]" />
    </button>
  );
}

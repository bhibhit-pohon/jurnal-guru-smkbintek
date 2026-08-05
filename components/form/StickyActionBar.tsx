'use client';

interface StickyActionBarProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function StickyActionBar({ onCancel, onSave, isSaving = false }: StickyActionBarProps) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <button
        onClick={onCancel}
        className="flex-1 h-11 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex-1 h-11 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-red-600/20"
      >
        {isSaving ? 'Menyimpan...' : 'Save'}
      </button>
    </div>
  );
}

'use client';

import type { JournalEntry } from '@/lib/types';

interface DeleteConfirmModalProps {
  journal: JournalEntry;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({ journal, onClose, onConfirm, isDeleting }: DeleteConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 flex flex-col gap-4 animate-scale-in">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-[#ffdad6] p-3 rounded-full">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[32px]">delete_forever</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#1a1c1c] font-[Inter] text-center">
          Hapus Jurnal?
        </h3>

        {/* Description */}
        <p className="text-sm text-[#3e4947] font-[Inter] text-center leading-relaxed">
          Apakah Anda yakin ingin menghapus jurnal{' '}
          <strong className="text-[#005c55]">{journal.mapel}</strong> —{' '}
          <strong className="text-[#005c55]">{journal.kelas}</strong>?
        </p>

        <p className="text-xs text-[#ba1a1a] font-medium font-[Inter] text-center bg-[#ffdad6]/40 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          Tindakan ini tidak dapat dibatalkan.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-lg border border-[#E7E5E4] text-sm font-medium text-[#3e4947] font-[Inter] hover:bg-[#F5F5F4] transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-lg bg-[#ba1a1a] text-white text-sm font-semibold font-[Inter] hover:bg-[#93000a] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menghapus...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Ya, Hapus
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

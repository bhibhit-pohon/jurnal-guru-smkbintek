'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { JournalEntry } from '@/lib/types';

interface JournalReminderProps {
  journals: JournalEntry[];
  /** Whether to show the "Isi Jurnal" CTA button (hide it on the isi-jurnal page itself) */
  showCTA?: boolean;
}

/**
 * In-App Reminder banner — Opsi B.
 * Muncul di hari kerja (Senin–Jumat) untuk mengingatkan guru mengisi jurnal.
 * - Jika belum ada jurnal hari ini → banner kuning/amber.
 * - Jika sudah ada → banner hijau (bisa di-dismiss).
 * - Sabtu/Minggu → tidak muncul.
 * Dismiss disimpan di sessionStorage agar tidak muncul terus dalam 1 sesi browser.
 */
export default function JournalReminder({ journals, showCTA = true }: JournalReminderProps) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  // Check sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = `reminder_dismissed_${new Date().toDateString()}`;
      const wasDismissed = sessionStorage.getItem(key) === 'true';
      setDismissed(wasDismissed);
    }
  }, []);

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday

  // Weekend → don't show
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Count today's journals
  const todayJournalCount = useMemo(() => {
    const todayStr = today.toDateString();
    return journals.filter((j) => {
      const jDate = new Date(j.createdAt);
      return jDate.toDateString() === todayStr;
    }).length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journals]);

  const hasJournalToday = todayJournalCount > 0;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      const key = `reminder_dismissed_${new Date().toDateString()}`;
      sessionStorage.setItem(key, 'true');
    }
  };

  // Don't render if weekend, dismissed, or still loading
  if (isWeekend || dismissed) return null;

  return (
    <div
      className="animate-slide-down"
      style={{ animation: 'slide-down 0.35s ease-out both' }}
    >
      {hasJournalToday ? (
        /* ── Sudah Mengisi ── */
        <div className="bg-[#0f766e]/10 border border-[#005c55]/20 rounded-lg px-4 py-3 flex items-start gap-3">
          <div className="bg-[#005c55] p-1.5 rounded-full shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#005c55] font-[Inter]">
              Jurnal hari ini sudah terisi ✅
            </p>
            <p className="text-xs text-[#3e4947] font-[Inter] mt-0.5">
              {todayJournalCount} jurnal tercatat hari ini. Terima kasih, Bapak/Ibu Guru!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-[#005c55]/10 transition-colors shrink-0"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[#005c55] text-[18px]">close</span>
          </button>
        </div>
      ) : (
        /* ── Belum Mengisi ── */
        <div className="bg-[#fef3c7] border border-[#f59e0b]/30 rounded-lg px-4 py-3 flex items-start gap-3">
          <div className="bg-[#f59e0b] p-1.5 rounded-full shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-white text-[16px]">
              notifications_active
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#92400e] font-[Inter]">
              Jangan lupa isi jurnal hari ini! 📚
            </p>
            <p className="text-xs text-[#78350f]/80 font-[Inter] mt-0.5">
              Anda belum mencatat aktivitas mengajar hari ini. Segera isi jurnal Anda.
            </p>
            {showCTA && (
              <Link
                href="/isi-jurnal"
                className="inline-flex items-center gap-1.5 mt-2 bg-[#f59e0b] text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-[#d97706] transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">edit_note</span>
                Isi Jurnal Sekarang
              </Link>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-[#f59e0b]/10 transition-colors shrink-0"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[#92400e] text-[18px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}

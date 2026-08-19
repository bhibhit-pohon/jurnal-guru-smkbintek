'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useJournals, EDIT_WINDOW_HOURS } from '@/hooks/useJournals';
import { DUMMY_JOURNALS } from '@/lib/constants';
import type { JournalEntry } from '@/lib/types';

import { AppHeaderBrand } from '@/components/layout/AppHeaderBrand';
import JournalReminder from '@/components/layout/JournalReminder';
import EditJournalModal from '@/components/riwayat/EditJournalModal';
import DeleteConfirmModal from '@/components/riwayat/DeleteConfirmModal';

/* ── Helper: get Monday of a given week ── */
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/* ── Helper: format date range ── */
function formatWeekRange(monday: Date): string {
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const optMonth: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const optFull: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

  const startStr = monday.toLocaleDateString('id-ID', optMonth);
  const endStr = friday.toLocaleDateString('id-ID', optFull);

  return `${startStr} – ${endStr}`;
}

/* ── Helper: format day label ── */
function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/* ── Helper: check if same day ── */
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/* ── Helper: check if today ── */
function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

/* ── Helper: check if journal is within edit window ── */
function isWithinEditWindow(createdAt: string): boolean {
  const created = new Date(createdAt);
  const hoursElapsed = (Date.now() - created.getTime()) / (1000 * 60 * 60);
  return hoursElapsed <= EDIT_WINDOW_HOURS;
}

/* ── Helper: get remaining edit time ── */
function getRemainingTime(createdAt: string): string {
  const created = new Date(createdAt);
  const deadline = new Date(created.getTime() + EDIT_WINDOW_HOURS * 60 * 60 * 1000);
  const remainingMs = deadline.getTime() - Date.now();
  if (remainingMs <= 0) return '0 menit';
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
}

/**
 * Halaman Riwayat Jurnal — navigasi mingguan + edit/hapus jurnal.
 * Route-protected: redirect ke /login jika belum login.
 */
export default function RiwayatJurnalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { journals: firestoreJournals, updateJournal, deleteJournal } = useJournals(user?.uid);

  // Combine Firestore journals with Dummy Journals (avoiding duplicate IDs)
  const allJournals = useMemo(() => {
    const fsIds = new Set(firestoreJournals.map((j) => j.id));
    const uniqueDummies = DUMMY_JOURNALS.filter((d) => !fsIds.has(d.id));
    return [...firestoreJournals, ...uniqueDummies];
  }, [firestoreJournals]);

  /* ── Week navigation ── */
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));

  const goToPreviousWeek = useCallback(() => {
    setCurrentMonday((prev) => {
      const newMonday = new Date(prev);
      newMonday.setDate(prev.getDate() - 7);
      return newMonday;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentMonday((prev) => {
      const newMonday = new Date(prev);
      newMonday.setDate(prev.getDate() + 7);
      return newMonday;
    });
  }, []);

  const goToThisWeek = useCallback(() => {
    setCurrentMonday(getMonday(new Date()));
  }, []);

  const isCurrentWeek = useMemo(() => {
    const thisMonday = getMonday(new Date());
    return isSameDay(currentMonday, thisMonday);
  }, [currentMonday]);

  /* ── Build 5 weekdays (Mon-Fri) ── */
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(currentMonday);
      day.setDate(currentMonday.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentMonday]);

  /* ── Match journals to days ── */
  const journalsByDay = useMemo(() => {
    return weekDays.map((day) => {
      const dayJournals = allJournals.filter((j) => {
        const journalDate = new Date(j.createdAt);
        return isSameDay(journalDate, day);
      });
      return { day, journals: dayJournals };
    });
  }, [weekDays, allJournals]);

  /* ── Route protection ── */
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  /* ── Edit/Delete State ── */
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [deletingJournal, setDeletingJournal] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  /* ── Toast ── */
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  /* ── Edit handler ── */
  const handleEditSave = useCallback(
    async (
      id: string,
      data: {
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
      }
    ) => {
      const result = await updateJournal(id, data);
      if (result.success) {
        showToast('✏️ Jurnal berhasil diperbarui!', 'success');
      } else {
        showToast(result.error || 'Gagal memperbarui jurnal.', 'error');
      }
      return result;
    },
    [updateJournal, showToast]
  );

  /* ── Delete handler ── */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingJournal) return;
    setIsDeleting(true);
    const result = await deleteJournal(deletingJournal.id);
    setIsDeleting(false);
    if (result.success) {
      showToast('🗑️ Jurnal berhasil dihapus.', 'success');
      setDeletingJournal(null);
    } else {
      showToast(result.error || 'Gagal menghapus jurnal.', 'error');
    }
  }, [deletingJournal, deleteJournal, showToast]);

  /* ── Check if journal belongs to current user and is editable ── */
  const isEditable = useCallback(
    (journal: JournalEntry) => {
      if (!user) return false;
      // Only Firestore journals (not dummy) that belong to user and within time window
      const isDummy = DUMMY_JOURNALS.some((d) => d.id === journal.id);
      if (isDummy) return false;
      if (journal.uid && journal.uid !== user.uid) return false;
      return isWithinEditWindow(journal.createdAt);
    },
    [user]
  );

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f8]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#005c55]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-[#3e4947]">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-[#f9f9f8] text-[#1a1c1c] antialiased min-h-screen flex flex-col pt-16 pb-24">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] animate-slide-down max-w-[90%] w-[450px]">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
              toast.type === 'error' ? 'bg-[#ba1a1a]' : toast.type === 'success' ? 'bg-[#005c55]' : 'bg-[#5a5f64]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'error' ? 'error' : toast.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-1 hover:opacity-80" aria-label="Tutup">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ TopAppBar ══════════════ */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#f9f9f8] shadow-sm">
        <AppHeaderBrand />
        <Link href="/profil" className="flex items-center">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt="Profil"
              className="w-9 h-9 rounded-full border-2 border-[#005c55]/20 hover:border-[#005c55]/50 transition-colors"
            />
          ) : (
            <span className="material-symbols-outlined text-[#005c55] hover:opacity-80 transition-opacity p-2">
              account_circle
            </span>
          )}
        </Link>
      </header>

      {/* ══════════════ Main Content ══════════════ */}
      <main className="flex-grow px-4 flex flex-col gap-4 pt-4 relative max-w-[600px] mx-auto w-full">
        {/* ── Title ── */}
        <h2 className="text-xl leading-7 font-semibold text-[#1a1c1c] font-[Inter]">
          Riwayat Jurnal
        </h2>

        {/* ── In-App Reminder ── */}
        <JournalReminder journals={allJournals} showCTA={true} />

        {/* ── Week Navigator ── */}
        <div className="flex items-center justify-between bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg px-3 py-2.5">
          <button
            onClick={goToPreviousWeek}
            className="p-1.5 rounded-full hover:bg-[#e8e8e7] transition-colors active:scale-95 duration-150"
            aria-label="Minggu sebelumnya"
          >
            <span className="material-symbols-outlined text-[#005c55] text-[20px]">chevron_left</span>
          </button>

          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-[#1a1c1c] font-[Inter]">
              {isCurrentWeek ? 'Minggu Ini' : formatWeekRange(currentMonday)}
            </span>
            {isCurrentWeek && (
              <span className="text-[11px] text-[#3e4947] font-[Inter]">
                {formatWeekRange(currentMonday)}
              </span>
            )}
          </div>

          <button
            onClick={goToNextWeek}
            disabled={isCurrentWeek}
            className={`p-1.5 rounded-full transition-colors active:scale-95 duration-150 ${
              isCurrentWeek
                ? 'text-[#bdc9c6] cursor-not-allowed'
                : 'hover:bg-[#e8e8e7] text-[#005c55]'
            }`}
            aria-label="Minggu berikutnya"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>

        {/* ── Quick return to this week ── */}
        {!isCurrentWeek && (
          <button
            onClick={goToThisWeek}
            className="text-xs font-medium text-[#005c55] font-[Inter] flex items-center justify-center gap-1 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-[14px]">today</span>
            Kembali ke Minggu Ini
          </button>
        )}

        {/* ── Daily Journal Cards ── */}
        {journalsByDay.map(({ day, journals }, dayIndex) => (
          <div key={dayIndex} className="flex flex-col gap-2" style={{ animation: `fade-in 0.3s ease-out ${dayIndex * 0.06}s both` }}>
            {/* Day header */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold font-[Inter] uppercase tracking-wider ${
                  isToday(day) ? 'text-[#005c55]' : 'text-[#6e7977]'
                }`}
              >
                {isToday(day) ? '● Hari Ini' : formatDayLabel(day)}
              </span>
              {isToday(day) && (
                <span className="text-[11px] text-[#3e4947] font-[Inter]">
                  — {formatDayLabel(day)}
                </span>
              )}
            </div>

            {journals.length > 0 ? (
              journals.map((journal) => (
                <article
                  key={journal.id}
                  className="bg-[#F5F5F4] rounded-lg border border-[#E7E5E4] flex flex-col overflow-hidden shadow-sm"
                >
                  <div className={`h-[3px] bg-gradient-to-r ${isToday(day) ? 'from-[#005c55] via-[#0f766e] to-[#80d5cb]' : 'from-[#bdc9c6] via-[#d0d7d5] to-[#e8e8e7]'}`} />

                  <div className="p-4 flex-grow flex flex-col gap-2">
                    {/* Top row */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium font-[Inter] text-[#005c55] bg-[#0f766e]/10 px-2 py-0.5 rounded-md">
                            {journal.mapel}
                          </span>
                          <span className="text-xs font-medium font-[Inter] text-[#3e4947] bg-[#e8e8e7] px-2 py-0.5 rounded-md">
                            {journal.kelas}
                          </span>
                        </div>
                        <span className="text-[11px] font-[Inter] text-[#6e7977]">
                          {journal.ruang} • Jam ke-{journal.jamMulai}–{journal.jamSelesai}
                        </span>
                      </div>

                      {/* Right side: attendance + menu */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold font-[Inter] text-[#005c55]">
                            {journal.jumlahHadir}
                          </span>
                          <span className="text-[10px] text-[#6e7977] font-[Inter]">hadir</span>
                        </div>

                        {/* ⋮ More menu — only for editable journals */}
                        {isEditable(journal) && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === journal.id ? null : journal.id);
                              }}
                              className="p-1 rounded-full hover:bg-[#e8e8e7] transition-colors"
                              aria-label="Menu jurnal"
                            >
                              <span className="material-symbols-outlined text-[#6e7977] text-[18px]">more_vert</span>
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuId === journal.id && (
                              <div
                                className="absolute right-0 top-8 bg-white border border-[#E7E5E4] rounded-lg shadow-lg z-30 w-40 overflow-hidden animate-scale-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    setEditingJournal(journal);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2.5 text-left text-sm font-[Inter] text-[#1a1c1c] hover:bg-[#F5F5F4] flex items-center gap-2 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[#005c55] text-[18px]">edit</span>
                                  Edit Jurnal
                                </button>
                                <div className="h-px bg-[#E7E5E4]" />
                                <button
                                  onClick={() => {
                                    setDeletingJournal(journal);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2.5 text-left text-sm font-[Inter] text-[#ba1a1a] hover:bg-[#ffdad6]/20 flex items-center gap-2 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">delete</span>
                                  Hapus Jurnal
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Editable badge */}
                    {isEditable(journal) && (
                      <span className="text-[10px] font-medium font-[Inter] text-[#005c55] bg-[#0f766e]/10 px-2 py-0.5 rounded-md self-start flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        Bisa diedit (sisa {getRemainingTime(journal.createdAt)})
                      </span>
                    )}

                    {/* Catatan */}
                    <p className="text-sm leading-5 font-normal font-[Inter] text-[#3e4947] line-clamp-2">
                      {journal.catatan}
                    </p>

                    {/* Attendance + location badges */}
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {journal.jumlahSakit > 0 && (
                        <span className="text-[10px] font-medium font-[Inter] text-[#7f4025] bg-[#ffb598]/20 px-1.5 py-0.5 rounded">
                          {journal.jumlahSakit} sakit
                        </span>
                      )}
                      {journal.jumlahIzin > 0 && (
                        <span className="text-[10px] font-medium font-[Inter] text-[#5a5f64] bg-[#c3c7cd]/20 px-1.5 py-0.5 rounded">
                          {journal.jumlahIzin} izin
                        </span>
                      )}
                      {journal.jumlahAlpha > 0 && (
                        <span className="text-[10px] font-medium font-[Inter] text-[#ba1a1a] bg-[#ffdad6]/40 px-1.5 py-0.5 rounded">
                          {journal.jumlahAlpha} alpha
                        </span>
                      )}
                      {journal.lokasiValid && (
                        <span className="text-[10px] font-medium font-[Inter] text-[#005c55] flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            verified
                          </span>
                          lokasi valid
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="bg-[#F5F5F4] rounded-lg border border-dashed border-[#E7E5E4] p-4 flex items-center justify-center">
                <span className="text-sm text-[#6e7977] font-[Inter] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">event_busy</span>
                  Tidak ada jurnal
                </span>
              </div>
            )}
          </div>
        ))}

        {/* ── Arsip Lengkap ── */}
        <Link
          href="/riwayat-jurnal/arsip"
          className="mt-2 bg-white border border-[#bdc9c6] rounded-lg p-4 flex items-center justify-center gap-3 hover:bg-[#f3f4f3] transition-colors active:scale-[0.98] duration-150"
        >
          <span className="material-symbols-outlined text-[#005c55]">folder_open</span>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-[#1a1c1c] font-[Inter]">Lihat Arsip Lengkap</span>
            <span className="text-[11px] text-[#6e7977] font-[Inter]">Riwayat per bulan & semester</span>
          </div>
          <span className="material-symbols-outlined text-[#bdc9c6] ml-auto">chevron_right</span>
        </Link>

        {/* ── FAB: Tambah Jurnal ── */}
        <Link
          href="/isi-jurnal"
          aria-label="Tambah Jurnal"
          className="fixed bottom-24 right-4 bg-[#005c55] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_20px_-2px_rgba(0,92,85,0.4)] hover:opacity-90 active:scale-95 transition-all z-40"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            add
          </span>
        </Link>
      </main>

      {/* ══════════════ Bottom Navigation (2 items) ══════════════ */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-[#f9f9f8] shadow-lg rounded-t-xl">
        {/* Isi Jurnal */}
        <Link
          href="/isi-jurnal"
          aria-label="Isi Jurnal"
          className="flex flex-col items-center justify-center text-[#3e4947] px-6 py-1.5 hover:bg-[#e8e8e7] transition-colors active:scale-95 duration-150 rounded-xl"
        >
          <span className="material-symbols-outlined">description</span>
          <span className="text-sm leading-5 font-medium tracking-[0.01em] font-[Inter] mt-1">
            Isi Jurnal
          </span>
        </Link>

        {/* Riwayat Jurnal — Active */}
        <button
          aria-current="page"
          aria-label="Riwayat Jurnal"
          className="flex flex-col items-center justify-center bg-[#dfe3e9] text-[#60656a] rounded-xl px-6 py-1.5 transition-colors active:scale-95 duration-150"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            history
          </span>
          <span className="text-sm leading-5 font-medium tracking-[0.01em] font-[Inter] mt-1 font-bold">
            Riwayat
          </span>
        </button>
      </nav>

      {/* ══════════════ Modals ══════════════ */}
      {editingJournal && (
        <EditJournalModal
          journal={editingJournal}
          onClose={() => setEditingJournal(null)}
          onSave={handleEditSave}
        />
      )}

      {deletingJournal && (
        <DeleteConfirmModal
          journal={deletingJournal}
          onClose={() => setDeletingJournal(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

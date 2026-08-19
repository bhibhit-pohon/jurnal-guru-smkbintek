'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useJournals } from '@/hooks/useJournals';
import { DUMMY_JOURNALS } from '@/lib/constants';
import { AppHeaderBrand } from '@/components/layout/AppHeaderBrand';
import { useTheme, Theme } from '@/hooks/useTheme';

/**
 * Halaman Profil Guru — info, edit profil (nama & foto), statistik mengajar, pengaturan, logout.
 * Route-protected: redirect ke /login jika belum login.
 */
export default function ProfilPage() {
  const { user, loading, updateUserProfile, signOut } = useAuth();
  const { journals: firestoreJournals } = useJournals(user?.uid);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Contact Admin Modal State
  const [showContactModal, setShowContactModal] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Route protection ── */
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Sync state when entering edit mode or user changes
  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || '');
      setEditPhotoURL(user.photoURL || null);
    }
  }, [user]);

  // Load saved notification preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jurnal_notifications_enabled');
      if (saved === 'true') {
        setNotificationsEnabled(true);
      }
    }
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  /* ── Notification Toggle Handler ── */
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Check browser notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem('jurnal_notifications_enabled', 'true');
          showToast(
            'Pengingat Aktif! 📚 Notifikasi dijadwalkan setiap Senin–Jumat jam 07:15 WIB: "Selamat Pagi Bapak/Ibu Guru! 📚 Jangan lupa mencatat aktivitas mengajar hari ini di Jurnal Guru Online. Selamat mengajar! 🌟"',
            'success'
          );
        } else {
          showToast('Izin notifikasi ditolak oleh browser.', 'error');
        }
      } else {
        setNotificationsEnabled(true);
        localStorage.setItem('jurnal_notifications_enabled', 'true');
        showToast('Pengingat harian Senin–Jumat jam 07:15 WIB telah diaktifkan.', 'info');
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('jurnal_notifications_enabled', 'false');
      showToast('Notifikasi pengingat dinonaktifkan.', 'info');
    }
  };

  /* ── Logout handler ── */
  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  /* ── Image Upload Handler ── */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditPhotoURL(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* ── Save Profile Handler ── */
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayName.trim()) {
      showToast('Nama tampilan tidak boleh kosong', 'error');
      return;
    }

    setIsUpdating(true);
    const res = await updateUserProfile(editDisplayName.trim(), editPhotoURL);
    setIsUpdating(false);

    if (res.success) {
      showToast('Profil berhasil diperbarui!', 'success');
      setIsEditing(false);
    } else {
      showToast(res.error || 'Gagal memperbarui profil', 'error');
    }
  };

  // Combine Firestore journals with DUMMY_JOURNALS for stats calculation
  const allJournals = useMemo(() => {
    const fsIds = new Set(firestoreJournals.map((j) => j.id));
    const uniqueDummies = DUMMY_JOURNALS.filter((d) => !fsIds.has(d.id));
    return [...firestoreJournals, ...uniqueDummies];
  }, [firestoreJournals]);

  /* ── Month navigation for stats ── */
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const goToPrevMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      if (prev === 0) {
        setSelectedYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    if (isCurrentMonth) return;
    setSelectedMonth((prev) => {
      if (prev === 11) {
        setSelectedYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, [selectedMonth, selectedYear, now]);

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  /* ── Compute stats for selected month ── */
  const monthlyJournals = useMemo(() => {
    return allJournals.filter((j) => {
      const d = new Date(j.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [allJournals, selectedMonth, selectedYear]);

  const totalJurnalBulan = monthlyJournals.length;
  const totalJamMengajar = monthlyJournals.reduce(
    (sum, j) => sum + (j.jamSelesai - j.jamMulai + 1),
    0
  );
  const totalSiswa = monthlyJournals.reduce(
    (sum, j) => sum + j.jumlahHadir + j.jumlahIzin + j.jumlahSakit + j.jumlahAlpha,
    0
  );
  const totalHadir = monthlyJournals.reduce((sum, j) => sum + j.jumlahHadir, 0);
  const rataKehadiran = totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 0;

  // Unique teaching days
  const uniqueTeachingDays = useMemo(() => {
    const dates = new Set(monthlyJournals.map((j) => new Date(j.createdAt).toDateString()));
    return dates.size;
  }, [monthlyJournals]);

  // Unique subjects taught
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(monthlyJournals.map((j) => j.mapel));
    return Array.from(subjects);
  }, [monthlyJournals]);

  // Estimate workdays in the selected month (Mon-Fri)
  const workdaysInMonth = useMemo(() => {
    let count = 0;
    const year = selectedYear;
    const month = selectedMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dow = d.getDay();
      if (dow >= 1 && dow <= 5) count++;
      // For current month, only count up to today
      if (isCurrentMonth && d > now) break;
    }
    return count;
  }, [selectedMonth, selectedYear, isCurrentMonth, now]);

  const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f8]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#005c55]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-[#3e4947] font-[Inter]">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-[#f9f9f8] text-[#1a1c1c] antialiased min-h-screen flex flex-col font-[Inter] pb-12">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] animate-slide-down max-w-[90%] w-[450px]">
          <div
            className={`flex items-start gap-2.5 px-4 py-3 rounded-lg shadow-lg text-xs leading-relaxed font-medium text-white ${
              toast.type === 'error' ? 'bg-[#ba1a1a]' : toast.type === 'info' ? 'bg-[#5a5f64]' : 'bg-[#005c55]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
              {toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'check_circle'}
            </span>
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-1 hover:opacity-80 shrink-0">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ Header ══════════════ */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-16 bg-[#f9f9f8] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[#e8e8e7] transition-colors active:scale-95 duration-150"
            aria-label="Kembali"
          >
            <span className="material-symbols-outlined text-[#005c55]">arrow_back</span>
          </button>
          <AppHeaderBrand />
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-semibold text-[#005c55] bg-[#0f766e]/10 px-3 py-1.5 rounded-full hover:bg-[#0f766e]/20 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isEditing ? 'close' : 'edit'}
          </span>
          {isEditing ? 'Batal' : 'Edit Profil'}
        </button>
      </header>

      <main className="flex-grow px-4 pb-8 flex flex-col gap-5 max-w-[600px] mx-auto w-full">
        {/* ═══════════ Profile Card ═══════════ */}
        <section className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg flex flex-col overflow-hidden shadow-sm pt-4 pb-6 px-4 items-center text-center relative mt-4">
          <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />

          {/* Avatar Container */}
          <div className="relative group mb-3">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt="Foto profil"
                className="w-24 h-24 rounded-full border-4 border-[#005c55]/20 object-cover shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#0f766e]/10 flex items-center justify-center border-4 border-[#005c55]/20 shadow-md">
                <span className="material-symbols-outlined text-[#005c55] text-[48px]">person</span>
              </div>
            )}

            {/* Quick Upload Button overlay */}
            <button
              onClick={() => {
                setIsEditing(true);
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              className="absolute bottom-0 right-0 bg-[#005c55] text-white p-2 rounded-full shadow-lg hover:bg-[#0f766e] transition-transform active:scale-95"
              title="Ganti Foto"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </button>
          </div>

          <h2 className="text-xl font-semibold text-[#1a1c1c] font-[Inter]">
            {user.displayName || 'Guru SMK Bintek'}
          </h2>
          <p className="text-sm text-[#3e4947] font-[Inter] mt-0.5">
            {user.email}
          </p>

          <div className="mt-3 flex items-center gap-2">
            {/* Badge Status: Guru */}
            <span className="text-xs font-semibold text-[#005c55] bg-[#0f766e]/10 px-3 py-1 rounded-full font-[Inter] flex items-center gap-1.5 border border-[#005c55]/20">
              <span className="w-2 h-2 rounded-full bg-[#005c55]"></span>
              Guru
            </span>
          </div>
        </section>

        {/* ═══════════ Edit Form Section (When active) ═══════════ */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-[#005c55]/30 rounded-lg p-4 flex flex-col gap-4 shadow-md animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-2">
              <h3 className="text-base font-semibold text-[#005c55] font-[Inter] flex items-center gap-2">
                <span className="material-symbols-outlined">edit_square</span>
                Edit Informasi Profil
              </h3>
              <span className="text-xs text-[#6e7977]">Disimpan ke akun</span>
            </div>

            {/* Photo Selection Preview */}
            <div className="flex items-center gap-4 bg-[#F5F5F4] p-3 rounded-lg border border-[#E7E5E4]">
              {editPhotoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editPhotoURL}
                  alt="Preview"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#005c55]"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#005c55]/10 flex items-center justify-center text-[#005c55]">
                  <span className="material-symbols-outlined text-[28px]">person</span>
                </div>
              )}

              <div className="flex flex-col gap-1 flex-1">
                <span className="text-xs font-medium text-[#1a1c1c] font-[Inter]">Foto Profil</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-left text-[#005c55] font-semibold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">upload</span>
                  Pilih Foto Baru (Maks 2MB)
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Display Name Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#3e4947] font-[Inter]">
                Nama Tampilan Guru <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Contoh: Teguh Prasetyo, S.Pd"
                className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-md px-4 py-2.5 text-base font-[Inter] text-[#1a1c1c] w-full focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#E7E5E4] text-sm font-medium text-[#3e4947] font-[Inter] hover:bg-[#F5F5F4]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 py-2.5 rounded-lg bg-[#005c55] text-white text-sm font-medium font-[Inter] hover:bg-[#0f766e] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ═══════════ Statistik Mengajar (Rekap Bulanan) ═══════════ */}
        <section className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg flex flex-col overflow-hidden shadow-sm">
          <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb]" />
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1a1c1c] font-[Inter] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#005c55] text-[20px]">bar_chart</span>
                Rekap Mengajar
              </h3>
            </div>

            {/* Month Navigator */}
            <div className="flex items-center justify-between bg-white border border-[#E7E5E4] rounded-lg px-3 py-2">
              <button
                onClick={goToPrevMonth}
                className="p-1 rounded-full hover:bg-[#e8e8e7] transition-colors active:scale-95"
                aria-label="Bulan sebelumnya"
              >
                <span className="material-symbols-outlined text-[#005c55] text-[18px]">chevron_left</span>
              </button>
              <span className="text-sm font-semibold text-[#1a1c1c] font-[Inter] capitalize">
                {monthName}
              </span>
              <button
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
                className={`p-1 rounded-full transition-colors active:scale-95 ${
                  isCurrentMonth ? 'text-[#bdc9c6] cursor-not-allowed' : 'hover:bg-[#e8e8e7] text-[#005c55]'
                }`}
                aria-label="Bulan berikutnya"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2">
              {/* Total Jurnal */}
              <div className="bg-white rounded-lg p-3 flex flex-col items-center gap-1 border border-[#E7E5E4]">
                <span className="text-3xl font-bold text-[#005c55] font-[Inter]">{totalJurnalBulan}</span>
                <span className="text-[10px] font-medium text-[#6e7977] font-[Inter] uppercase tracking-wider text-center">
                  Jurnal
                </span>
              </div>

              {/* Total Jam */}
              <div className="bg-white rounded-lg p-3 flex flex-col items-center gap-1 border border-[#E7E5E4]">
                <span className="text-3xl font-bold text-[#005c55] font-[Inter]">{totalJamMengajar}</span>
                <span className="text-[10px] font-medium text-[#6e7977] font-[Inter] uppercase tracking-wider text-center">
                  Jam
                </span>
              </div>

              {/* Rata-rata Kehadiran */}
              <div className="bg-white rounded-lg p-3 flex flex-col items-center gap-1 border border-[#E7E5E4]">
                <span className="text-3xl font-bold text-[#005c55] font-[Inter]">{rataKehadiran}%</span>
                <span className="text-[10px] font-medium text-[#6e7977] font-[Inter] uppercase tracking-wider text-center">
                  Kehadiran
                </span>
              </div>
            </div>

            {/* Mini Summary Detail */}
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-3 flex flex-col gap-2">
              {/* Teaching days */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#3e4947] font-[Inter] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[#005c55]">calendar_today</span>
                  Hari mengajar
                </span>
                <span className="text-xs font-semibold text-[#1a1c1c] font-[Inter]">
                  {uniqueTeachingDays} / {workdaysInMonth} hari kerja
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-[#E7E5E4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#005c55] to-[#0f766e] rounded-full transition-all duration-500"
                  style={{ width: `${workdaysInMonth > 0 ? Math.min(100, (uniqueTeachingDays / workdaysInMonth) * 100) : 0}%` }}
                />
              </div>

              {/* Unfilled days warning */}
              {workdaysInMonth - uniqueTeachingDays > 0 && (
                <span className="text-[11px] text-[#92400e] font-medium font-[Inter] bg-[#fef3c7] px-2 py-1 rounded flex items-center gap-1 self-start">
                  <span className="material-symbols-outlined text-[12px]">warning</span>
                  {workdaysInMonth - uniqueTeachingDays} hari belum ada jurnal
                </span>
              )}

              {/* Subjects taught */}
              {uniqueSubjects.length > 0 && (
                <div className="flex flex-col gap-1 pt-1 border-t border-[#E7E5E4]">
                  <span className="text-[11px] text-[#6e7977] font-[Inter] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-[#005c55]">school</span>
                    Mata pelajaran yang diajar:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {uniqueSubjects.map((subj) => (
                      <span
                        key={subj}
                        className="text-[10px] font-medium text-[#005c55] bg-[#0f766e]/10 px-2 py-0.5 rounded-md font-[Inter]"
                      >
                        {subj}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══════════ Menu List ═══════════ */}
        <section className="flex flex-col gap-1">
          <h4 className="text-xs font-semibold text-[#6e7977] font-[Inter] uppercase tracking-wider px-1 mb-1">
            Pengaturan & Akun
          </h4>

          {/* Edit Profil Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg px-4 py-3.5 flex items-center gap-3 hover:bg-[#eeeeed] transition-colors active:scale-[0.99] duration-150 w-full text-left"
          >
            <span className="material-symbols-outlined text-[#005c55] text-[22px]">badge</span>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-[#1a1c1c] font-[Inter]">Ubah Data Profil</span>
              <span className="text-[11px] text-[#6e7977] font-[Inter]">Ubah nama tampilan & foto profil</span>
            </div>
            <span className="material-symbols-outlined text-[#bdc9c6] text-[20px]">chevron_right</span>
          </button>

          {/* Notifikasi Button */}
          <button
            onClick={handleToggleNotifications}
            className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg px-4 py-3.5 flex items-center gap-3 hover:bg-[#eeeeed] transition-colors active:scale-[0.99] duration-150 w-full text-left"
          >
            <span className="material-symbols-outlined text-[#005c55] text-[22px]">
              {notificationsEnabled ? 'notifications_active' : 'notifications'}
            </span>
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#1a1c1c] font-[Inter]">Notifikasi Pengingat</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  notificationsEnabled ? 'bg-[#0f766e]/10 text-[#005c55]' : 'bg-[#bdc9c6]/30 text-[#6e7977]'
                }`}>
                  {notificationsEnabled ? 'AKTIF (07:15)' : 'NON-AKTIF'}
                </span>
              </div>
              <span className="text-[11px] text-[#6e7977] font-[Inter]">
                Pengingat jurnaling otomatis Senin–Jumat jam 07.15 WIB
              </span>
            </div>
            <span className="material-symbols-outlined text-[#bdc9c6] text-[20px]">chevron_right</span>
          </button>

          {/* Tema Aplikasi (Dark Mode Switcher) */}
          <div className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#005c55] text-[22px]">
                {resolvedTheme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium text-[#1a1c1c] font-[Inter]">Tema Tampilan</span>
                <span className="text-[11px] text-[#6e7977] font-[Inter]">
                  Pilih mode gelap, terang, atau otomatis mengikuti sistem HP
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'light' as Theme, label: 'Terang', icon: 'light_mode' },
                { id: 'dark' as Theme, label: 'Gelap', icon: 'dark_mode' },
                { id: 'system' as Theme, label: 'Sistem', icon: 'devices' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg border text-xs font-semibold font-[Inter] transition-all active:scale-95 ${
                    theme === t.id
                      ? 'bg-[#005c55] text-white border-[#005c55] shadow-sm'
                      : 'bg-white border-[#E7E5E4] text-[#3e4947] hover:bg-[#eeeeed]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Tentang & Bantuan */}
        <section className="flex flex-col gap-1">
          <h4 className="text-xs font-semibold text-[#6e7977] font-[Inter] uppercase tracking-wider px-1 mb-1">
            Bantuan & Informasi
          </h4>

          {/* Panduan & FAQ */}
          <Link
            href="/profil/faq"
            className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg px-4 py-3.5 flex items-center gap-3 hover:bg-[#eeeeed] transition-colors active:scale-[0.99] duration-150 w-full text-left"
          >
            <span className="material-symbols-outlined text-[#005c55] text-[22px]">help</span>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-[#1a1c1c] font-[Inter]">Panduan & FAQ</span>
              <span className="text-[11px] text-[#6e7977] font-[Inter]">Petunjuk teknis penggunaan aplikasi</span>
            </div>
            <span className="material-symbols-outlined text-[#bdc9c6] text-[20px]">chevron_right</span>
          </Link>

          {/* Hubungi Admin */}
          <button
            onClick={() => setShowContactModal(true)}
            className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg px-4 py-3.5 flex items-center gap-3 hover:bg-[#eeeeed] transition-colors active:scale-[0.99] duration-150 w-full text-left"
          >
            <span className="material-symbols-outlined text-[#005c55] text-[22px]">support_agent</span>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-[#1a1c1c] font-[Inter]">Hubungi Admin</span>
              <span className="text-[11px] text-[#6e7977] font-[Inter]">Kontak WhatsApp & Email (Teguh Purnomo)</span>
            </div>
            <span className="material-symbols-outlined text-[#bdc9c6] text-[20px]">chevron_right</span>
          </button>

          {/* Versi */}
          <div className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg px-4 py-3.5 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#005c55] text-[22px]">info</span>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-[#1a1c1c] font-[Inter]">Versi Aplikasi</span>
              <span className="text-[11px] text-[#6e7977] font-[Inter]">1.0.0 — SMK Bina Teknologi Purwokerto</span>
            </div>
          </div>
        </section>

        {/* ═══════════ Logout ═══════════ */}
        <button
          onClick={handleLogout}
          className="mt-4 w-full bg-white border border-[#ffdad6] text-[#ba1a1a] text-sm font-medium font-[Inter] py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#ffdad6]/20 active:scale-[0.98] transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Keluar dari Akun
        </button>

        <p className="text-center text-[11px] text-[#6e7977] font-[Inter] mt-2 mb-4">
          SMK Bina Teknologi Purwokerto © 2026
        </p>
      </main>

      {/* ══════════════ Contact Admin Modal ══════════════ */}
      {showContactModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
              <h3 className="font-bold text-base text-[#005c55] flex items-center gap-2 font-[Inter]">
                <span className="material-symbols-outlined">support_agent</span>
                Hubungi Admin Sekolah
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-[#6e7977] hover:bg-[#F5F5F4] p-1 rounded-full"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#3e4947] leading-relaxed">
              Jika Anda memerlukan bantuan teknis, silakan hubungi <strong>Bapak Teguh Purnomo</strong> melalui kontak berikut:
            </p>

            <div className="flex flex-col gap-2 pt-1">
              {/* WhatsApp Direct Link (No pre-filled text template) */}
              <a
                href="https://wa.me/6285640019685"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] text-white p-3.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-xs"
              >
                <span className="material-symbols-outlined text-[22px]">chat</span>
                Chat via WhatsApp (085640019685)
              </a>

              {/* Email Direct Link */}
              <a
                href="mailto:teguh17purnomo@gmail.com"
                className="bg-white border border-[#E7E5E4] text-[#1a1c1c] p-3.5 rounded-lg text-sm font-semibold hover:bg-[#F5F5F4] transition-colors flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-[#005c55] text-[22px]">mail</span>
                Kirim Email (teguh17purnomo@gmail.com)
              </a>
            </div>

            <button
              onClick={() => setShowContactModal(false)}
              className="mt-2 text-xs text-[#6e7977] hover:underline text-center"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

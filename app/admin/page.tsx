'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';
import { useJournals } from '@/hooks/useJournals';
import { useMasterData, MasterDataType } from '@/hooks/useMasterData';
import { isAdminEmail } from '@/lib/firebase';
import { DUMMY_JOURNALS, SCHOOL_COORDS } from '@/lib/constants';
import type { JournalEntry } from '@/lib/types';

export default function AdminDashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Fetch all journals for admin view (isAdmin = true)
  const { journals: firestoreJournals, loading: journalsLoading } = useJournals(
    undefined,
    true
  );

  // Combine Firestore journals with DUMMY_JOURNALS for rich demonstration data
  const allJournals = useMemo(() => {
    const fsIds = new Set(firestoreJournals.map((j) => j.id));
    const uniqueDummies = DUMMY_JOURNALS.map((d) => ({
      ...d,
      displayName: d.mapel.includes('Matematika')
        ? 'Teguh Prasetyo, S.Pd'
        : d.mapel.includes('Inggris')
        ? 'Siti Nurhaliza, M.Pd'
        : d.mapel.includes('Teknik')
        ? 'Budi Santoso, S.Kom'
        : 'Guru SMK Bintek',
      email: 'guru@smkbintek.sch.id',
    }));
    const filteredDummies = uniqueDummies.filter((d) => !fsIds.has(d.id));
    return [...firestoreJournals, ...filteredDummies];
  }, [firestoreJournals]);

  // Master Data Hook
  const {
    mapelList,
    kelasList,
    ruangList,
    addMasterItem,
    removeMasterItem,
    editMasterItem,
    saveMasterList,
  } = useMasterData();

  // Admin Navigation tab & Mobile Sidebar Drawer
  const [activeTab, setActiveTab] = useState<'overview' | 'jurnal' | 'guru' | 'master'>('jurnal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Master Data Inputs State
  const [inputMapel, setInputMapel] = useState('');
  const [inputKelas, setInputKelas] = useState('');
  const [inputRuang, setInputRuang] = useState('');
  const [editingItem, setEditingItem] = useState<{ type: MasterDataType; oldValue: string; newValue: string } | null>(null);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterMapel, setFilterMapel] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Selected Journal Detail Modal
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);

  /* ── Route Protection ── */
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const isAdmin = user ? isAdminEmail(user.email) : false;

  /* ── Filtered Journals ── */
  const filteredJournals = useMemo(() => {
    return allJournals.filter((j) => {
      const matchSearch =
        searchQuery === '' ||
        (j as any).displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.mapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.catatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.kelas.toLowerCase().includes(searchQuery.toLowerCase());

      const matchKelas = filterKelas === '' || j.kelas === filterKelas;
      const matchMapel = filterMapel === '' || j.mapel === filterMapel;
      const matchDate =
        filterDate === '' || j.createdAt.startsWith(filterDate);

      return matchSearch && matchKelas && matchMapel && matchDate;
    });
  }, [allJournals, searchQuery, filterKelas, filterMapel, filterDate]);

  /* ── Stats Calculations ── */
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayJournals = allJournals.filter((j) =>
      j.createdAt.startsWith(todayStr)
    );

    const uniqueTeachers = new Set(
      allJournals.map((j) => (j as any).displayName || (j as any).email || 'Guru')
    );

    const totalSiswa = allJournals.reduce(
      (acc, j) => acc + j.jumlahHadir + j.jumlahIzin + j.jumlahSakit + j.jumlahAlpha,
      0
    );
    const totalHadir = allJournals.reduce((acc, j) => acc + j.jumlahHadir, 0);
    const avgAttendance =
      totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 0;

    return {
      totalJournals: allJournals.length,
      todayCount: todayJournals.length,
      totalTeachers: Math.max(uniqueTeachers.size, 12),
      avgAttendance,
    };
  }, [allJournals]);

  /* ── Weekday & Attendance Breakdown Stats ── */
  const weekdayStats = useMemo(() => {
    const days = [
      { name: 'Senin', count: 0 },
      { name: 'Selasa', count: 0 },
      { name: 'Rabu', count: 0 },
      { name: 'Kamis', count: 0 },
      { name: 'Jumat', count: 0 },
    ];

    allJournals.forEach((j) => {
      const d = new Date(j.createdAt);
      const dayIdx = d.getDay(); // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
      if (dayIdx >= 1 && dayIdx <= 5) {
        days[dayIdx - 1].count += 1;
      }
    });

    const maxCount = Math.max(...days.map((d) => d.count), 1);
    return days.map((d) => ({
      ...d,
      heightPercent: Math.max(Math.round((d.count / maxCount) * 100), 12),
    }));
  }, [allJournals]);

  const attendanceBreakdown = useMemo(() => {
    const totalHadir = allJournals.reduce((acc, j) => acc + j.jumlahHadir, 0);
    const totalSakit = allJournals.reduce((acc, j) => acc + j.jumlahSakit, 0);
    const totalIzin = allJournals.reduce((acc, j) => acc + j.jumlahIzin, 0);
    const totalAlpha = allJournals.reduce((acc, j) => acc + j.jumlahAlpha, 0);
    const totalAll = totalHadir + totalSakit + totalIzin + totalAlpha;

    const getPercent = (val: number) => (totalAll > 0 ? Math.round((val / totalAll) * 100) : 0);

    return {
      totalHadir,
      totalSakit,
      totalIzin,
      totalAlpha,
      hadirPct: getPercent(totalHadir),
      sakitPct: getPercent(totalSakit),
      izinPct: getPercent(totalIzin),
      alphaPct: getPercent(totalAlpha),
    };
  }, [allJournals]);

  /* ── Export to Excel (.xlsx) ── */
  const handleExportExcel = () => {
    const excelData = filteredJournals.map((j, index) => ({
      No: index + 1,
      Tanggal: new Date(j.createdAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      Waktu: new Date(j.createdAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      'Nama Guru': (j as any).displayName || (j as any).email || 'Guru',
      'Mata Pelajaran': j.mapel,
      Kelas: j.kelas,
      Ruang: j.ruang,
      'Rentang Jam': `Jam ke-${j.jamMulai} s/d ${j.jamSelesai}`,
      'Hadir (Siswa)': j.jumlahHadir,
      Sakit: j.jumlahSakit,
      Izin: j.jumlahIzin,
      Alpha: j.jumlahAlpha,
      'Nama Siswa Absen': j.namaSiswaAbsen || '-',
      'Catatan Jurnal': j.catatan || '-',
      'Status Lokasi': j.lokasiValid ? 'Valid (≤ 50m)' : 'Di Luar Radius',
      'Jarak dari Sekolah': `${j.jarakDariSekolah} meter`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Jurnal Guru');

    // Auto-fit column width
    const max_widths = Object.keys(excelData[0] || {}).map((key) => ({
      wch: Math.max(key.length + 5, 12),
    }));
    worksheet['!cols'] = max_widths;

    const filename = `Laporan_Jurnal_Guru_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  /* ── Loading state ── */
  if (loading || journalsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f8]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#005c55]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-[#3e4947] font-[Inter]">Memuat Dashboard Admin...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-[#f4f5f5] text-[#1a1c1c] min-h-screen flex font-[Inter]">
      {/* ══════════════ Mobile Overlay Drawer ══════════════ */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <aside className="relative w-64 bg-[#005c55] text-white flex flex-col shrink-0 shadow-2xl z-10">
            <div className="p-4 border-b border-[#0f766e]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white text-[24px]">school</span>
                <h1 className="font-bold text-base">Admin Dashboard</h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-white p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex-grow p-4 flex flex-col gap-2">
              {[
                { id: 'jurnal', label: 'Data Jurnal Guru', icon: 'table_chart' },
                { id: 'overview', label: 'Ringkasan Statistik', icon: 'analytics' },
                { id: 'guru', label: 'Monitoring Guru', icon: 'groups' },
                { id: 'master', label: 'Kelola Data Master', icon: 'settings_suggest' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id ? 'bg-white/20 text-white font-semibold' : 'text-[#a3faef]/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-[#0f766e]/40 flex flex-col gap-2">
              <Link
                href="/riwayat-jurnal"
                className="text-xs text-[#a3faef] hover:underline flex items-center gap-2 py-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">smartphone</span>
                Tampilan Aplikasi Guru (Mobile)
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* ══════════════ Desktop & Split-Screen Sidebar ══════════════ */}
      <aside className="w-16 xl:w-64 bg-[#005c55] text-white flex flex-col shrink-0 shadow-lg hidden md:flex transition-all duration-200">
        {/* Brand */}
        <div className="p-4 xl:p-6 border-b border-[#0f766e]/40 flex items-center gap-3 justify-center xl:justify-start">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
            <span className="material-symbols-outlined text-white text-[24px]">school</span>
          </div>
          <div className="flex flex-col hidden xl:flex">
            <h1 className="font-bold text-base leading-tight">Jurnal Guru</h1>
            <span className="text-[11px] text-[#a3faef] font-medium tracking-wide">
              ADMIN DASHBOARD
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-grow p-2 xl:p-4 flex flex-col gap-1.5">
          {[
            { id: 'jurnal', label: 'Data Jurnal Guru', icon: 'table_chart' },
            { id: 'overview', label: 'Ringkasan Statistik', icon: 'analytics' },
            { id: 'guru', label: 'Monitoring Guru', icon: 'groups' },
            { id: 'master', label: 'Kelola Data Master', icon: 'settings_suggest' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              title={item.label}
              className={`flex items-center gap-3 px-3 xl:px-4 py-3 rounded-lg text-sm font-medium transition-colors justify-center xl:justify-start ${
                activeTab === item.id
                  ? 'bg-white/15 text-white font-semibold border-l-4 border-[#a3faef]'
                  : 'text-[#a3faef]/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
              <span className="hidden xl:inline truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Admin Footer */}
        <div className="p-3 xl:p-4 border-t border-[#0f766e]/40 flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-white/10 p-2 xl:p-3 rounded-lg justify-center xl:justify-start">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="Admin" className="w-8 h-8 rounded-full border border-white/30 shrink-0" />
            ) : (
              <span className="material-symbols-outlined text-white text-[24px] shrink-0">account_circle</span>
            )}
            <div className="flex flex-col min-w-0 hidden xl:flex">
              <span className="text-xs font-semibold truncate">{user.displayName || 'Administrator'}</span>
              <span className="text-[10px] text-[#a3faef] truncate">{user.email}</span>
            </div>
          </div>

          <Link
            href="/riwayat-jurnal"
            className="text-xs text-[#a3faef] hover:underline flex items-center justify-center gap-1 py-1.5"
            title="Tampilan Aplikasi Guru (Mobile)"
          >
            <span className="material-symbols-outlined text-[16px] shrink-0">smartphone</span>
            <span className="hidden xl:inline">Tampilan Mobile</span>
          </Link>
        </div>
      </aside>

      {/* ══════════════ Main Content Area ══════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Desktop Bar */}
        <header className="bg-white border-b border-[#E7E5E4] px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-[#005c55] p-1.5 rounded-lg hover:bg-[#005c55]/10 shrink-0"
              aria-label="Buka Menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-[#005c55] truncate">
              {activeTab === 'jurnal'
                ? '📋 Rekapitulasi Jurnal Guru'
                : activeTab === 'overview'
                ? '📊 Dashboard Analisis & Statistik'
                : activeTab === 'guru'
                ? '👥 Monitoring Kehadiran Guru'
                : '⚙️ Kelola Data Master Sekolah'}
            </h2>

            {!isAdmin && (
              <span className="hidden sm:inline-block text-[11px] bg-[#ffdbce] text-[#72361b] px-2 py-0.5 rounded-full font-medium border border-[#ffb598] shrink-0">
                Mode Pratinjau Admin
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              className="bg-[#005c55] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#0f766e] transition-colors flex items-center gap-1.5 shadow-xs active:scale-95 shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="hidden sm:inline">Export Excel (.xlsx)</span>
              <span className="inline sm:hidden">Excel</span>
            </button>

            <button
              onClick={async () => {
                await signOut();
                router.replace('/login');
              }}
              className="border border-[#E7E5E4] text-[#ba1a1a] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#ffdad6]/20 transition-colors flex items-center gap-1 shrink-0"
              title="Keluar"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <main className="p-6 flex flex-col gap-6 max-w-7xl w-full mx-auto">
          {/* ═══════════ Stats Overview Grid ═══════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1 */}
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 flex flex-col overflow-hidden shadow-xs relative">
              <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6e7977] uppercase tracking-wider">Total Jurnal</span>
                <span className="material-symbols-outlined text-[#005c55] bg-[#0f766e]/10 p-2 rounded-lg text-[20px]">
                  article
                </span>
              </div>
              <span className="text-3xl font-bold text-[#1a1c1c] mt-2">{stats.totalJournals}</span>
              <span className="text-xs text-[#005c55] mt-1 font-medium">Tersimpan di sistem</span>
            </div>

            {/* Stat 2 */}
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 flex flex-col overflow-hidden shadow-xs relative">
              <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6e7977] uppercase tracking-wider">Jurnal Hari Ini</span>
                <span className="material-symbols-outlined text-[#005c55] bg-[#0f766e]/10 p-2 rounded-lg text-[20px]">
                  today
                </span>
              </div>
              <span className="text-3xl font-bold text-[#005c55] mt-2">{stats.todayCount}</span>
              <span className="text-xs text-[#6e7977] mt-1">Mengajar hari ini</span>
            </div>

            {/* Stat 3 */}
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 flex flex-col overflow-hidden shadow-xs relative">
              <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6e7977] uppercase tracking-wider">Guru Terdaftar</span>
                <span className="material-symbols-outlined text-[#005c55] bg-[#0f766e]/10 p-2 rounded-lg text-[20px]">
                  group
                </span>
              </div>
              <span className="text-3xl font-bold text-[#1a1c1c] mt-2">{stats.totalTeachers}</span>
              <span className="text-xs text-[#6e7977] mt-1">SMK Bina Teknologi</span>
            </div>

            {/* Stat 4 */}
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 flex flex-col overflow-hidden shadow-xs relative">
              <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6e7977] uppercase tracking-wider">Rerata Kehadiran</span>
                <span className="material-symbols-outlined text-[#005c55] bg-[#0f766e]/10 p-2 rounded-lg text-[20px]">
                  check_circle
                </span>
              </div>
              <span className="text-3xl font-bold text-[#005c55] mt-2">{stats.avgAttendance}%</span>
              <span className="text-xs text-[#6e7977] mt-1">Kehadiran siswa dikelas</span>
            </div>
          </div>

          {/* ═══════════ Tab Content 0: Overview Analytics & Charts ═══════════ */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Row 1: Grafik Tren Pengisian Jurnal Harian (Bar Chart) */}
              <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-xs flex flex-col gap-4 relative overflow-hidden">
                <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
                <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#005c55] flex items-center gap-2">
                      <span className="material-symbols-outlined">bar_chart</span>
                      Grafik Tren Pengisian Jurnal Mengajar Harian (Senin – Jumat)
                    </h3>
                    <p className="text-xs text-[#6e7977] mt-0.5">
                      Statistik aktivitas pengisian jurnal harian oleh guru-guru SMK Bina Teknologi.
                    </p>
                  </div>
                  <span className="text-xs bg-[#005c55]/10 text-[#005c55] px-3 py-1 rounded-full font-semibold">
                    Minggu Berjalan
                  </span>
                </div>

                {/* SVG/HTML Bar Chart */}
                <div className="pt-6 pb-2 flex items-end justify-between gap-3 sm:gap-6 h-64 border-b border-[#E7E5E4] px-4">
                  {weekdayStats.map((day) => (
                    <div key={day.name} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <span className="text-xs font-bold text-[#005c55] bg-[#005c55]/10 px-2 py-0.5 rounded opacity-80 group-hover:opacity-100 transition-opacity">
                        {day.count} Jurnal
                      </span>
                      <div className="w-full max-w-[48px] bg-[#E7E5E4] rounded-t-lg flex items-end overflow-hidden h-full">
                        <div
                          style={{ height: `${day.heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-[#005c55] to-[#0f766e] rounded-t-lg transition-all duration-500 group-hover:from-[#0f766e] group-hover:to-[#80d5cb]"
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#3e4947] mt-1">{day.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2: Grid 2 Kolom (Distribution & Live Activity Feed) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 🍰 Breakdown Kehadiran Siswa */}
                <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-xs flex flex-col gap-4 relative overflow-hidden">
                  <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
                  <div className="border-b border-[#E7E5E4] pb-3">
                    <h3 className="text-base font-bold text-[#005c55] flex items-center gap-2">
                      <span className="material-symbols-outlined">pie_chart</span>
                      Distribusi Kehadiran Siswa
                    </h3>
                    <p className="text-xs text-[#6e7977] mt-0.5">Rasio kumulatif status kehadiran seluruh kelas.</p>
                  </div>

                  <div className="flex flex-col gap-3 py-2">
                    {/* Hadir */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#005c55] flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#005c55]" /> Hadir
                        </span>
                        <span>{attendanceBreakdown.totalHadir} siswa ({attendanceBreakdown.hadirPct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-[#E7E5E4] rounded-full overflow-hidden">
                        <div style={{ width: `${attendanceBreakdown.hadirPct}%` }} className="h-full bg-[#005c55] rounded-full transition-all duration-500" />
                      </div>
                    </div>

                    {/* Sakit */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#d97706] flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" /> Sakit
                        </span>
                        <span>{attendanceBreakdown.totalSakit} siswa ({attendanceBreakdown.sakitPct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-[#E7E5E4] rounded-full overflow-hidden">
                        <div style={{ width: `${attendanceBreakdown.sakitPct}%` }} className="h-full bg-[#d97706] rounded-full transition-all duration-500" />
                      </div>
                    </div>

                    {/* Izin */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#2563eb] flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" /> Izin
                        </span>
                        <span>{attendanceBreakdown.totalIzin} siswa ({attendanceBreakdown.izinPct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-[#E7E5E4] rounded-full overflow-hidden">
                        <div style={{ width: `${attendanceBreakdown.izinPct}%` }} className="h-full bg-[#2563eb] rounded-full transition-all duration-500" />
                      </div>
                    </div>

                    {/* Alpha */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#dc2626] flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" /> Alpha
                        </span>
                        <span>{attendanceBreakdown.totalAlpha} siswa ({attendanceBreakdown.alphaPct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-[#E7E5E4] rounded-full overflow-hidden">
                        <div style={{ width: `${attendanceBreakdown.alphaPct}%` }} className="h-full bg-[#dc2626] rounded-full transition-all duration-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ⚡ Activity Stream (Jurnal Terbaru) */}
                <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-xs flex flex-col gap-4 relative overflow-hidden">
                  <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
                  <div className="border-b border-[#E7E5E4] pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[#005c55] flex items-center gap-2">
                        <span className="material-symbols-outlined">schedule</span>
                        Aktivitas Pengisian Terkini
                      </h3>
                      <p className="text-xs text-[#6e7977] mt-0.5">Jurnal mengajar terbaru yang di-input guru.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {allJournals.slice(0, 4).map((j, idx) => (
                      <div key={j.id || idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F5F5F4]/60 border border-[#E7E5E4]">
                        <div className="w-9 h-9 rounded-full bg-[#005c55]/10 text-[#005c55] font-bold text-sm flex items-center justify-center border border-[#005c55]/20 shrink-0">
                          {(j as any).displayName?.[0] || 'G'}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-[#1a1c1c] truncate">
                              {(j as any).displayName || (j as any).email || 'Guru SMK Bintek'}
                            </span>
                            <span className="text-[10px] text-[#6e7977]">{j.createdAt.split('T')[0]}</span>
                          </div>
                          <span className="text-xs text-[#005c55] truncate font-medium">
                            {j.mapel} • Kelas {j.kelas} (Ruang {j.ruang})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ Tab Content 1: Data Jurnal Table ═══════════ */}
          {activeTab === 'jurnal' && (
            <div className="bg-white border border-[#E7E5E4] rounded-xl shadow-xs flex flex-col overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb]" />

              {/* Filters Header Bar */}
              <div className="p-4 border-b border-[#E7E5E4] bg-[#F5F5F4]/60 flex flex-wrap items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1 min-w-[240px]">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7977] text-[20px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama guru, mapel, kelas, atau catatan..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#E7E5E4] rounded-lg text-sm focus:outline-none focus:border-[#005c55]"
                  />
                </div>

                {/* Filter dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-3 py-2 bg-white border border-[#E7E5E4] rounded-lg text-sm text-[#3e4947] focus:outline-none focus:border-[#005c55]"
                  />

                  <select
                    value={filterKelas}
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="px-3 py-2 bg-white border border-[#E7E5E4] rounded-lg text-sm text-[#3e4947] focus:outline-none focus:border-[#005c55]"
                  >
                    <option value="">Semua Kelas</option>
                    <option value="X-A">X-A</option>
                    <option value="X-B">X-B</option>
                    <option value="XI-A">XI-A</option>
                    <option value="XI-B">XI-B</option>
                    <option value="XII-A">XII-A</option>
                    <option value="XII-C">XII-C</option>
                  </select>

                  <select
                    value={filterMapel}
                    onChange={(e) => setFilterMapel(e.target.value)}
                    className="px-3 py-2 bg-white border border-[#E7E5E4] rounded-lg text-sm text-[#3e4947] focus:outline-none focus:border-[#005c55]"
                  >
                    <option value="">Semua Mapel</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Fisika">Fisika</option>
                    <option value="Teknik Komputer & Jaringan">TKJ</option>
                    <option value="Rekayasa Perangkat Lunak">RPL</option>
                  </select>

                  {(searchQuery || filterKelas || filterMapel || filterDate) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterKelas('');
                        setFilterMapel('');
                        setFilterDate('');
                      }}
                      className="px-3 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition-colors"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F5F5F4] text-[#3e4947] text-xs font-semibold uppercase tracking-wider border-b border-[#E7E5E4]">
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Tanggal & Jam</th>
                      <th className="py-3 px-4">Nama Guru</th>
                      <th className="py-3 px-4">Mapel & Kelas</th>
                      <th className="py-3 px-4 text-center">Kehadiran Siswa</th>
                      <th className="py-3 px-4">Catatan Jurnal</th>
                      <th className="py-3 px-4">Status GPS</th>
                      <th className="py-3 px-4 text-center">Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4] text-sm text-[#1a1c1c]">
                    {filteredJournals.length > 0 ? (
                      filteredJournals.map((j, idx) => (
                        <tr
                          key={j.id}
                          className="hover:bg-[#f9f9f8] transition-colors cursor-pointer"
                          onClick={() => setSelectedJournal(j)}
                        >
                          <td className="py-3.5 px-4 font-mono text-xs text-[#6e7977]">
                            {idx + 1}
                          </td>

                          {/* Tanggal */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(j.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              <span className="text-xs text-[#6e7977]">
                                Jam ke-{j.jamMulai}–{j.jamSelesai} ({j.ruang})
                              </span>
                            </div>
                          </td>

                          {/* Nama Guru */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#005c55]">
                            {(j as any).displayName || (j as any).email || 'Guru'}
                          </td>

                          {/* Mapel & Kelas */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-[#1a1c1c]">{j.mapel}</span>
                              <span className="text-xs text-[#3e4947] bg-[#e8e8e7] px-2 py-0.5 rounded w-fit">
                                {j.kelas}
                              </span>
                            </div>
                          </td>

                          {/* Kehadiran */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                              <span className="text-[#005c55] bg-[#0f766e]/10 px-2 py-1 rounded" title="Hadir">
                                H: {j.jumlahHadir}
                              </span>
                              <span className="text-[#7f4025] bg-[#ffb598]/20 px-2 py-1 rounded" title="Sakit">
                                S: {j.jumlahSakit}
                              </span>
                              <span className="text-[#5a5f64] bg-[#c3c7cd]/20 px-2 py-1 rounded" title="Izin">
                                I: {j.jumlahIzin}
                              </span>
                              <span className="text-[#ba1a1a] bg-[#ffdad6]/40 px-2 py-1 rounded" title="Alpha">
                                A: {j.jumlahAlpha}
                              </span>
                            </div>
                          </td>

                          {/* Catatan */}
                          <td className="py-3.5 px-4 max-w-xs truncate text-[#3e4947]">
                            {j.catatan || '-'}
                          </td>

                          {/* GPS Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {j.lokasiValid ? (
                              <span className="text-xs font-semibold text-[#005c55] bg-[#0f766e]/10 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Valid ({j.jarakDariSekolah}m)
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-[#ba1a1a] bg-[#ffdad6]/40 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                                <span className="material-symbols-outlined text-[14px]">error</span>
                                Di Luar ({j.jarakDariSekolah}m)
                              </span>
                            )}
                          </td>

                          {/* Bukti Foto & TTD */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJournal(j);
                              }}
                              className="text-xs font-semibold text-[#005c55] hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              Lihat Bukti
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#6e7977]">
                          <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-[40px] text-[#bdc9c6]">search_off</span>
                            <span className="font-medium text-sm">Tidak ada data jurnal yang sesuai filter.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════ Tab Content 2: Monitoring Guru ═══════════ */}
          {activeTab === 'guru' && (
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#005c55]">Daftar Guru SMK Bina Teknologi</h3>
                  <p className="text-xs text-[#6e7977] mt-0.5">Pantau keaktifan dan pengisian jurnal mengajar harian.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Teguh Prasetyo, S.Pd', email: 'teguh@smkbintek.sch.id', mapel: 'Matematika', count: 18, status: 'Sudah Mengisi' },
                  { name: 'Siti Nurhaliza, M.Pd', email: 'siti@smkbintek.sch.id', mapel: 'Bahasa Inggris', count: 15, status: 'Sudah Mengisi' },
                  { name: 'Budi Santoso, S.Kom', email: 'budi@smkbintek.sch.id', mapel: 'Teknik Komputer & Jaringan', count: 12, status: 'Sudah Mengisi' },
                  { name: 'Ahmad Fauzi, S.ST', email: 'fauzi@smkbintek.sch.id', mapel: 'Rekayasa Perangkat Lunak', count: 14, status: 'Sudah Mengisi' },
                  { name: 'Dewi Lestari, S.Pd', email: 'dewi@smkbintek.sch.id', mapel: 'Fisika', count: 10, status: 'Sudah Mengisi' },
                  { name: 'Rina Agustina, S.Pd', email: 'rina@smkbintek.sch.id', mapel: 'Bahasa Indonesia', count: 0, status: 'Belum Mengisi Hari Ini' },
                ].map((g, i) => (
                  <div key={i} className="border border-[#E7E5E4] rounded-lg p-4 flex items-center gap-3 bg-[#F5F5F4]/40 hover:bg-white transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#005c55]/10 flex items-center justify-center text-[#005c55] font-bold text-lg border border-[#005c55]/20">
                      {g.name[0]}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-sm truncate">{g.name}</span>
                      <span className="text-xs text-[#6e7977] truncate">{g.mapel}</span>
                      <span className={`text-[11px] font-medium mt-1 ${g.count > 0 ? 'text-[#005c55]' : 'text-[#ba1a1a]'}`}>
                        {g.count > 0 ? `✅ ${g.count} Jurnal Terisi` : '⚠️ Belum mengisi hari ini'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ Tab Content 3: Kelola Data Master ═══════════ */}
          {activeTab === 'master' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-xs flex flex-col gap-2 relative overflow-hidden">
                <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
                <h3 className="text-base font-bold text-[#005c55] flex items-center gap-2">
                  <span className="material-symbols-outlined">settings_suggest</span>
                  Kelola Data Master Sekolah
                </h3>
                <p className="text-xs text-[#6e7977]">
                  Tambah, edit, atau hapus daftar Mata Pelajaran, Kelas, dan Ruangan. Perubahan data di sini langsung terhubung secara <strong>Real-time</strong> ke menu "Isi Jurnal" di HP seluruh guru.
                </p>
              </div>

              {/* Grid 3 Kolom Responsif */}
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* ── 1. Mata Pelajaran ── */}
                <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden">
                  <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
                  <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
                    <span className="font-bold text-sm text-[#005c55] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      Mata Pelajaran
                    </span>
                  </div>

                  {/* Add Input */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!inputMapel.trim()) return;
                      const res = await addMasterItem('mapel', inputMapel);
                      if (res.success) setInputMapel('');
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      value={inputMapel}
                      onChange={(e) => setInputMapel(e.target.value)}
                      placeholder="Nama mapel baru..."
                      className="min-w-0 flex-1 px-3 py-2 bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg text-xs focus:outline-none focus:border-[#005c55]"
                    />
                    <button
                      type="submit"
                      className="bg-[#005c55] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#0f766e] shrink-0 active:scale-95 transition-transform"
                    >
                      + Tambah
                    </button>
                  </form>

                  {/* Item List */}
                  <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1">
                    {mapelList.length === 0 ? (
                      <p className="text-xs text-[#6e7977] italic py-4 text-center">Belum ada mata pelajaran. Silakan tambahkan baru.</p>
                    ) : (
                      mapelList.map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#F5F5F4]/60 hover:bg-[#F5F5F4] border border-[#E7E5E4] text-xs min-w-0"
                        >
                          <span className="font-medium text-[#1a1c1c] truncate flex-1 mr-2">{item}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                const newName = prompt('Edit Nama Mata Pelajaran:', item);
                                if (newName && newName.trim() !== item) {
                                  editMasterItem('mapel', item, newName);
                                }
                              }}
                              className="text-[#005c55] hover:bg-[#005c55]/10 p-1.5 rounded"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus mapel "${item}"?`)) {
                                  removeMasterItem('mapel', item);
                                }
                              }}
                              className="text-[#ba1a1a] hover:bg-[#ffdad6]/40 p-1.5 rounded"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Explicit Save Button */}
                  <div className="border-t border-[#E7E5E4] pt-3 flex items-center justify-between mt-auto">
                    <span className="text-[11px] font-medium text-[#6e7977]">{mapelList.length} item terdaftar</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await saveMasterList('mapel', mapelList);
                        if (res.success) {
                          showToast('Data master Mata Pelajaran berhasil disimpan!', 'success');
                        } else {
                          showToast(res.error || 'Gagal menyimpan data master', 'error');
                        }
                      }}
                      className="bg-[#005c55] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#0f766e] flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      Simpan Perubahan
                    </button>
                  </div>
                </div>

                {/* ── 2. Kelas ── */}
                <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden">
                  <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
                  <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
                    <span className="font-bold text-sm text-[#005c55] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">school</span>
                      Kelas
                    </span>
                  </div>

                  {/* Add Input */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!inputKelas.trim()) return;
                      const res = await addMasterItem('kelas', inputKelas);
                      if (res.success) setInputKelas('');
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      value={inputKelas}
                      onChange={(e) => setInputKelas(e.target.value)}
                      placeholder="Nama kelas baru..."
                      className="min-w-0 flex-1 px-3 py-2 bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg text-xs focus:outline-none focus:border-[#005c55]"
                    />
                    <button
                      type="submit"
                      className="bg-[#005c55] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#0f766e] shrink-0 active:scale-95 transition-transform"
                    >
                      + Tambah
                    </button>
                  </form>

                  {/* Item List */}
                  <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1">
                    {kelasList.length === 0 ? (
                      <p className="text-xs text-[#6e7977] italic py-4 text-center">Belum ada kelas. Silakan tambahkan baru.</p>
                    ) : (
                      kelasList.map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#F5F5F4]/60 hover:bg-[#F5F5F4] border border-[#E7E5E4] text-xs min-w-0"
                        >
                          <span className="font-medium text-[#1a1c1c] truncate flex-1 mr-2">{item}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                const newName = prompt('Edit Nama Kelas:', item);
                                if (newName && newName.trim() !== item) {
                                  editMasterItem('kelas', item, newName);
                                }
                              }}
                              className="text-[#005c55] hover:bg-[#005c55]/10 p-1.5 rounded"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus kelas "${item}"?`)) {
                                  removeMasterItem('kelas', item);
                                }
                              }}
                              className="text-[#ba1a1a] hover:bg-[#ffdad6]/40 p-1.5 rounded"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Explicit Save Button */}
                  <div className="border-t border-[#E7E5E4] pt-3 flex items-center justify-between mt-auto">
                    <span className="text-[11px] font-medium text-[#6e7977]">{kelasList.length} item terdaftar</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await saveMasterList('kelas', kelasList);
                        if (res.success) {
                          showToast('Data master Kelas berhasil disimpan!', 'success');
                        } else {
                          showToast(res.error || 'Gagal menyimpan data master', 'error');
                        }
                      }}
                      className="bg-[#005c55] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#0f766e] flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      Simpan Perubahan
                    </button>
                  </div>
                </div>

                {/* ── 3. Ruangan ── */}
                <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden">
                  <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
                  <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
                    <span className="font-bold text-sm text-[#005c55] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                      Ruangan
                    </span>
                  </div>

                  {/* Add Input */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!inputRuang.trim()) return;
                      const res = await addMasterItem('ruang', inputRuang);
                      if (res.success) setInputRuang('');
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      value={inputRuang}
                      onChange={(e) => setInputRuang(e.target.value)}
                      placeholder="Nama ruangan baru..."
                      className="min-w-0 flex-1 px-3 py-2 bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg text-xs focus:outline-none focus:border-[#005c55]"
                    />
                    <button
                      type="submit"
                      className="bg-[#005c55] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#0f766e] shrink-0 active:scale-95 transition-transform"
                    >
                      + Tambah
                    </button>
                  </form>

                  {/* Item List */}
                  <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1">
                    {ruangList.length === 0 ? (
                      <p className="text-xs text-[#6e7977] italic py-4 text-center">Belum ada ruangan. Silakan tambahkan baru.</p>
                    ) : (
                      ruangList.map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#F5F5F4]/60 hover:bg-[#F5F5F4] border border-[#E7E5E4] text-xs min-w-0"
                        >
                          <span className="font-medium text-[#1a1c1c] truncate flex-1 mr-2">{item}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                const newName = prompt('Edit Nama Ruangan:', item);
                                if (newName && newName.trim() !== item) {
                                  editMasterItem('ruang', item, newName);
                                }
                              }}
                              className="text-[#005c55] hover:bg-[#005c55]/10 p-1.5 rounded"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus ruangan "${item}"?`)) {
                                  removeMasterItem('ruang', item);
                                }
                              }}
                              className="text-[#ba1a1a] hover:bg-[#ffdad6]/40 p-1.5 rounded"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Explicit Save Button */}
                  <div className="border-t border-[#E7E5E4] pt-3 flex items-center justify-between mt-auto">
                    <span className="text-[11px] font-medium text-[#6e7977]">{ruangList.length} item terdaftar</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await saveMasterList('ruang', ruangList);
                        if (res.success) {
                          showToast('Data master Ruangan berhasil disimpan!', 'success');
                        } else {
                          showToast(res.error || 'Gagal menyimpan data master', 'error');
                        }
                      }}
                      className="bg-[#005c55] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#0f766e] flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════════════ Detail Modal ══════════════ */}
      {selectedJournal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 bg-[#005c55] text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="material-symbols-outlined">description</span>
                Detail Jurnal Guru
              </h3>
              <button
                onClick={() => setSelectedJournal(null)}
                className="hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 bg-[#F5F5F4] p-4 rounded-lg border border-[#E7E5E4]">
                <div>
                  <span className="text-xs text-[#6e7977] font-semibold uppercase">Guru Pengajar</span>
                  <p className="font-semibold text-base text-[#005c55]">
                    {(selectedJournal as any).displayName || 'Guru'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#6e7977] font-semibold uppercase">Mata Pelajaran</span>
                  <p className="font-semibold text-base">{selectedJournal.mapel}</p>
                </div>
                <div>
                  <span className="text-xs text-[#6e7977] font-semibold uppercase">Kelas & Ruang</span>
                  <p className="text-sm font-medium">{selectedJournal.kelas} • {selectedJournal.ruang}</p>
                </div>
                <div>
                  <span className="text-xs text-[#6e7977] font-semibold uppercase">Rentang Waktu</span>
                  <p className="text-sm font-medium">Jam ke-{selectedJournal.jamMulai}–{selectedJournal.jamSelesai}</p>
                </div>
              </div>

              {/* Attendance breakdown */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[#6e7977] uppercase">Kehadiran Siswa</span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-[#0f766e]/10 border border-[#005c55]/20 p-2 rounded-lg">
                    <span className="text-xl font-bold text-[#005c55]">{selectedJournal.jumlahHadir}</span>
                    <span className="block text-[11px] text-[#3e4947]">Hadir</span>
                  </div>
                  <div className="bg-[#ffb598]/20 border border-[#ffb598] p-2 rounded-lg">
                    <span className="text-xl font-bold text-[#7f4025]">{selectedJournal.jumlahSakit}</span>
                    <span className="block text-[11px] text-[#3e4947]">Sakit</span>
                  </div>
                  <div className="bg-[#c3c7cd]/20 border border-[#c3c7cd] p-2 rounded-lg">
                    <span className="text-xl font-bold text-[#5a5f64]">{selectedJournal.jumlahIzin}</span>
                    <span className="block text-[11px] text-[#3e4947]">Izin</span>
                  </div>
                  <div className="bg-[#ffdad6]/40 border border-[#ffdad6] p-2 rounded-lg">
                    <span className="text-xl font-bold text-[#ba1a1a]">{selectedJournal.jumlahAlpha}</span>
                    <span className="block text-[11px] text-[#3e4947]">Alpha</span>
                  </div>
                </div>
                {selectedJournal.namaSiswaAbsen && (
                  <p className="text-xs text-[#3e4947] bg-[#F5F5F4] p-2.5 rounded border border-[#E7E5E4] mt-1">
                    <strong>Siswa Absen:</strong> {selectedJournal.namaSiswaAbsen}
                  </p>
                )}
              </div>

              {/* Catatan */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#6e7977] uppercase">Catatan Jurnal Kelas</span>
                <p className="text-sm bg-[#F5F5F4] p-3 rounded-lg border border-[#E7E5E4] leading-relaxed">
                  {selectedJournal.catatan || 'Tidak ada catatan.'}
                </p>
              </div>

              {/* Photo & Signature Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <span className="text-xs font-semibold text-[#6e7977] uppercase block mb-1">
                    Foto Bukti Kelas
                  </span>
                  {selectedJournal.fotoKelas ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedJournal.fotoKelas}
                      alt="Foto Kelas"
                      className="w-full h-44 object-cover rounded-lg border border-[#E7E5E4]"
                    />
                  ) : (
                    <div className="w-full h-44 bg-[#F5F5F4] rounded-lg border border-dashed border-[#E7E5E4] flex items-center justify-center text-xs text-[#6e7977]">
                      Tidak ada foto
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#6e7977] uppercase block mb-1">
                    Tanda Tangan Guru
                  </span>
                  {selectedJournal.tandaTangan ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedJournal.tandaTangan}
                      alt="Tanda Tangan"
                      className="w-full h-44 object-contain bg-white rounded-lg border border-[#E7E5E4]"
                    />
                  ) : (
                    <div className="w-full h-44 bg-[#F5F5F4] rounded-lg border border-dashed border-[#E7E5E4] flex items-center justify-center text-xs text-[#6e7977]">
                      Tidak ada tanda tangan
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F5F5F4] border-t border-[#E7E5E4] flex justify-end">
              <button
                onClick={() => setSelectedJournal(null)}
                className="px-5 py-2 bg-[#005c55] text-white rounded-lg text-sm font-medium hover:bg-[#0f766e]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

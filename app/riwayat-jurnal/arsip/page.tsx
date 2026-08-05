'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useJournals } from '@/hooks/useJournals';
import { DUMMY_JOURNALS, KELAS_OPTIONS, MAPEL_OPTIONS } from '@/lib/constants';
import type { JournalEntry } from '@/lib/types';

export default function ArsipJurnalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { journals: firestoreJournals, loading: journalsLoading } = useJournals(user?.uid);

  // Combine Firestore journals with DUMMY_JOURNALS
  const allJournals = useMemo(() => {
    const fsIds = new Set(firestoreJournals.map((j) => j.id));
    const uniqueDummies = DUMMY_JOURNALS.filter((d) => !fsIds.has(d.id));
    return [...firestoreJournals, ...uniqueDummies];
  }, [firestoreJournals]);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08'); // default current month
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  /* ── Route protection ── */
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  /* ── Available Months Dropdown ── */
  const monthOptions = useMemo(() => {
    const months = new Map<string, string>();
    allJournals.forEach((j) => {
      const d = new Date(j.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      months.set(key, label);
    });
    // Add current month if not present
    const now = new Date();
    const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nowLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    months.set(nowKey, nowLabel);

    return Array.from(months.entries()).map(([value, label]) => ({ value, label }));
  }, [allJournals]);

  /* ── Filtered Journals ── */
  const filteredJournals = useMemo(() => {
    return allJournals.filter((j) => {
      const journalDateStr = j.createdAt.substring(0, 7); // 'YYYY-MM'
      const matchMonth = selectedMonth === '' || journalDateStr === selectedMonth;
      const matchKelas = selectedKelas === '' || j.kelas === selectedKelas;
      const matchMapel = selectedMapel === '' || j.mapel === selectedMapel;
      const matchQuery =
        searchQuery === '' ||
        j.mapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.catatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.ruang.toLowerCase().includes(searchQuery.toLowerCase());

      return matchMonth && matchKelas && matchMapel && matchQuery;
    });
  }, [allJournals, selectedMonth, selectedKelas, selectedMapel, searchQuery]);

  /* ── Compute Monthly Stats ── */
  const monthlyStats = useMemo(() => {
    const totalJurnal = filteredJournals.length;
    const totalJam = filteredJournals.reduce(
      (sum, j) => sum + (j.jamSelesai - j.jamMulai + 1),
      0
    );
    const totalSiswa = filteredJournals.reduce(
      (sum, j) => sum + j.jumlahHadir + j.jumlahIzin + j.jumlahSakit + j.jumlahAlpha,
      0
    );
    const totalHadir = filteredJournals.reduce((sum, j) => sum + j.jumlahHadir, 0);
    const rerataKehadiran = totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 0;

    return { totalJurnal, totalJam, rerataKehadiran };
  }, [filteredJournals]);

  /* ── Loading state ── */
  if (loading || journalsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f8]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#005c55]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-[#3e4947] font-[Inter]">Memuat Arsip Jurnal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-[#f9f9f8] text-[#1a1c1c] antialiased min-h-screen flex flex-col pb-16 font-[Inter]">
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
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-[#005c55] leading-tight">
              Arsip Jurnal Lengkap
            </h1>
            <span className="text-[10px] font-semibold text-[#0f766e] uppercase tracking-wider">
              SMK Bina Teknologi Purwokerto
            </span>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="p-2 text-[#005c55] hover:bg-[#0f766e]/10 rounded-full transition-colors"
          title="Cetak / Download PDF"
        >
          <span className="material-symbols-outlined">print</span>
        </button>
      </header>

      <main className="flex-grow px-4 pt-4 flex flex-col gap-4 max-w-[600px] mx-auto w-full">
        {/* ═══════════ Filter Card ═══════════ */}
        <section className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg p-4 flex flex-col gap-3 relative overflow-hidden shadow-xs">
          <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />

          <h2 className="text-sm font-semibold text-[#1a1c1c] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#005c55] text-[18px]">filter_alt</span>
            Filter Arsip
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Month Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#6e7977]">Bulan & Tahun</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-[#E7E5E4] rounded-md px-3 py-2 text-xs font-medium text-[#1a1c1c] w-full focus:outline-none focus:border-[#005c55]"
              >
                <option value="">Semua Bulan</option>
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#6e7977]">Kelas</label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="bg-white border border-[#E7E5E4] rounded-md px-3 py-2 text-xs font-medium text-[#1a1c1c] w-full focus:outline-none focus:border-[#005c55]"
              >
                <option value="">Semua Kelas</option>
                {KELAS_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mt-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7977] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi, catatan, atau ruangan..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#E7E5E4] rounded-md text-xs text-[#1a1c1c] focus:outline-none focus:border-[#005c55]"
            />
          </div>
        </section>

        {/* ═══════════ Monthly Summary Card ═══════════ */}
        <section className="bg-white border border-[#E7E5E4] rounded-lg p-4 flex flex-col gap-3 shadow-xs relative overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#005c55] uppercase tracking-wider">
              Ringkasan Rekapitulasi
            </h3>
            <span className="text-[11px] font-medium text-[#6e7977]">
              {filteredJournals.length} Catatan Jurnal
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#F5F5F4] p-2.5 rounded-lg border border-[#E7E5E4]">
              <span className="text-2xl font-bold text-[#005c55]">{monthlyStats.totalJurnal}</span>
              <span className="block text-[10px] text-[#6e7977] uppercase mt-0.5">Jurnal</span>
            </div>
            <div className="bg-[#F5F5F4] p-2.5 rounded-lg border border-[#E7E5E4]">
              <span className="text-2xl font-bold text-[#005c55]">{monthlyStats.totalJam}</span>
              <span className="block text-[10px] text-[#6e7977] uppercase mt-0.5">Jam Mengajar</span>
            </div>
            <div className="bg-[#F5F5F4] p-2.5 rounded-lg border border-[#E7E5E4]">
              <span className="text-2xl font-bold text-[#005c55]">{monthlyStats.rerataKehadiran}%</span>
              <span className="block text-[10px] text-[#6e7977] uppercase mt-0.5">Kehadiran</span>
            </div>
          </div>
        </section>

        {/* ═══════════ Journal Entries List ═══════════ */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#1a1c1c]">Daftar Jurnal Terarsip</h3>

          {filteredJournals.length > 0 ? (
            filteredJournals.map((j) => (
              <article
                key={j.id}
                className="bg-white border border-[#E7E5E4] rounded-lg p-4 flex flex-col gap-2 shadow-xs relative overflow-hidden"
              >
                <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb] absolute top-0 left-0 right-0" />

                <div className="flex justify-between items-start pt-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#005c55]">
                      {new Date(j.createdAt).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[11px] text-[#6e7977]">
                      Jam ke-{j.jamMulai}–{j.jamSelesai} ({j.ruang})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#005c55] bg-[#0f766e]/10 px-2 py-0.5 rounded">
                      {j.mapel}
                    </span>
                    <span className="text-xs font-semibold text-[#3e4947] bg-[#e8e8e7] px-2 py-0.5 rounded">
                      {j.kelas}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#3e4947] bg-[#F5F5F4] p-2.5 rounded border border-[#E7E5E4] mt-1 leading-relaxed">
                  {j.catatan || 'Tidak ada catatan.'}
                </p>

                {/* Badges */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[#005c55]">Hadir: {j.jumlahHadir}</span>
                    {j.jumlahSakit > 0 && <span className="text-[#7f4025]">Sakit: {j.jumlahSakit}</span>}
                    {j.jumlahIzin > 0 && <span className="text-[#5a5f64]">Izin: {j.jumlahIzin}</span>}
                    {j.jumlahAlpha > 0 && <span className="text-[#ba1a1a]">Alpha: {j.jumlahAlpha}</span>}
                  </div>

                  {j.lokasiValid && (
                    <span className="text-[#005c55] font-medium flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      GPS Valid
                    </span>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="bg-white border border-dashed border-[#E7E5E4] p-8 rounded-lg text-center flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[36px] text-[#bdc9c6]">folder_off</span>
              <p className="text-xs text-[#6e7977]">Tidak ada jurnal pada filter yang dipilih.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

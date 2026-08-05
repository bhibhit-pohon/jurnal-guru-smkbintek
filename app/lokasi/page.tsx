'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { AppHeaderBrand } from '@/components/layout/AppHeaderBrand';

/* ── Koordinat SMK Bina Teknologi Purwokerto ── */
const SCHOOL_CENTER: [number, number] = [-7.43272163415813, 109.22089476611995];
const DEFAULT_ZOOM = 16;

/* ── Lazy-load MapContainer agar SSR tidak error (leaflet butuh window) ── */
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

/**
 * Halaman Lokasi — menampilkan peta interaktif dengan pin lokasi sekolah.
 * Route-protected: redirect ke /login jika belum login.
 */
export default function LokasiPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  /* ── Search state ── */
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Route protection ── */
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f8]">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-[#005c55]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-[#3e4947]">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-[#f9f9f8] text-[#1a1c1c] antialiased h-screen overflow-hidden flex flex-col">
      {/* ══════════════ Top AppBar ══════════════ */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#f9f9f8] shadow-sm">
        <AppHeaderBrand />
        <Link href="/profil" className="flex items-center">
          <button
            aria-label="Profile"
            className="text-[#005c55] hover:opacity-80 transition-opacity active:scale-95 duration-150 p-2 rounded-full hover:bg-[#f3f4f3]"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </Link>
      </header>

      {/* ══════════════ Main Content — Map ══════════════ */}
      <main className="flex-grow relative mt-16 mb-[80px]">
        {/* ── Search & Filters Overlay ── */}
        <div className="absolute top-0 left-0 w-full p-4 z-[400] flex flex-col gap-2 pointer-events-none">
          {/* Search Bar */}
          <div className="bg-[#f9f9f8] rounded-full shadow-md flex items-center px-4 py-2 pointer-events-auto border border-[#bdc9c6]/30">
            <span className="material-symbols-outlined text-[#3e4947] mr-3">
              search
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-base leading-6 font-[Inter] text-[#1a1c1c] placeholder-[#3e4947]/70"
              placeholder="Cari sekolah atau kelas..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pointer-events-auto">
            {/* Active chip */}
            <button className="bg-[#0f766e] text-[#a3faef] px-4 py-1.5 rounded-full text-sm leading-5 font-medium font-[Inter] whitespace-nowrap flex items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">
                school
              </span>
              SMK Bina Teknologi
            </button>
            {/* Inactive chips */}
            <button className="bg-[#e8e8e7] text-[#1a1c1c] px-4 py-1.5 rounded-full text-sm leading-5 font-medium font-[Inter] border border-[#bdc9c6]/50 whitespace-nowrap flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">
                group
              </span>
              Kelas 10
            </button>
            <button className="bg-[#e8e8e7] text-[#1a1c1c] px-4 py-1.5 rounded-full text-sm leading-5 font-medium font-[Inter] border border-[#bdc9c6]/50 whitespace-nowrap">
              Jadwal Hari Ini
            </button>
          </div>
        </div>

        {/* ── Map Container ── */}
        <div className="w-full h-full">
          <LeafletMap center={SCHOOL_CENTER} zoom={DEFAULT_ZOOM} />
        </div>

        {/* ── FAB: My Location ── */}
        <button
          aria-label="Lokasi saya"
          onClick={() => window.dispatchEvent(new Event('fly-to-my-location'))}
          className="absolute bottom-6 right-6 bg-[#005c55] text-white p-4 rounded-xl shadow-lg hover:bg-[#005c55]/90 transition-colors z-[400] flex items-center justify-center active:scale-95 duration-150"
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </main>

      {/* ══════════════ Bottom Navigation ══════════════ */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-[#f9f9f8] shadow-lg rounded-t-xl">
        {/* Riwayat Jurnal */}
        <Link
          href="/riwayat-jurnal"
          aria-label="Riwayat Jurnal"
          className="flex flex-col items-center justify-center text-[#3e4947] px-4 py-1 hover:bg-[#e8e8e7] transition-colors active:scale-95 duration-150 rounded-xl"
        >
          <span className="material-symbols-outlined">history</span>
          <span className="text-sm leading-5 font-medium tracking-[0.01em] font-[Inter] mt-1">
            Riwayat Jurnal
          </span>
        </Link>

        {/* Isi Jurnal */}
        <Link
          href="/isi-jurnal"
          aria-label="Isi Jurnal"
          className="flex flex-col items-center justify-center text-[#3e4947] px-4 py-1 hover:bg-[#e8e8e7] transition-colors active:scale-95 duration-150 rounded-xl"
        >
          <span className="material-symbols-outlined">description</span>
          <span className="text-sm leading-5 font-medium tracking-[0.01em] font-[Inter] mt-1">
            Isi Jurnal
          </span>
        </Link>

        {/* Lokasi — Active */}
        <button
          aria-current="page"
          aria-label="Lokasi"
          className="flex flex-col items-center justify-center bg-[#dfe3e9] text-[#60656a] rounded-xl px-4 py-1 transition-colors active:scale-95 duration-150"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            map
          </span>
          <span className="text-sm leading-5 font-medium tracking-[0.01em] font-[Inter] mt-1 font-bold">
            Lokasi
          </span>
        </button>
      </nav>
    </div>
  );
}

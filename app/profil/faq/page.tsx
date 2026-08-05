'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeaderBrand } from '@/components/layout/AppHeaderBrand';

const FAQ_ITEMS = [
  {
    q: 'Bagaimana cara mengisi jurnal mengajar?',
    a: 'Buka menu "Isi Jurnal" dari navigasi bawah. Pilih Mata Pelajaran, Kelas, Ruang, dan Rentang Jam mengajar (Jam 1 - 10). Isikan data kehadiran siswa, unggah foto bukti kelas melalui kamera, bubuhi tanda tangan digital Anda, lalu klik "Simpan Jurnal".',
  },
  {
    q: 'Mengapa lokasi GPS saya terdeteksi "Di Luar Area"?',
    a: 'Aplikasi memverifikasi bahwa pengisian jurnal dilakukan di area sekolah dengan batas toleransi 50 meter dari koordinat SMK Bina Teknologi Purwokerto. Pastikan fitur Lokasi/GPS di HP Anda aktif dan Anda berada di lingkungan sekolah.',
  },
  {
    q: 'Bagaimana jika saya mengajar lebih dari 1 kelas dalam sehari?',
    a: 'Anda dapat mengisi jurnal beberapa kali dalam sehari. Setelah selesai mengisi dan menyimpan jurnal untuk kelas pertama, Anda cukup membuat pengisian baru untuk kelas berikutnya.',
  },
  {
    q: 'Bagaimana cara melihat jurnal mengajar minggu lalu atau bulan lalu?',
    a: 'Di menu "Riwayat", Anda dapat menggunakan panah ◀ ▶ untuk berpindah minggu. Jika ingin melihat histori bulanan atau semester sebelumnya, klik tombol "Lihat Arsip Lengkap" di bagian bawah menu Riwayat.',
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-[#f9f9f8] text-[#1a1c1c] antialiased min-h-screen flex flex-col font-[Inter] pb-12">
      {/* Header */}
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
      </header>

      <main className="flex-grow px-4 pt-4 flex flex-col gap-4 max-w-[600px] mx-auto w-full">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-[#1a1c1c]">Panduan & FAQ</h2>
          <p className="text-xs text-[#6e7977]">
            Petunjuk penggunaan dan jawaban atas pertanyaan umum penggunaan Jurnal Guru Online.
          </p>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3 mt-2">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden shadow-xs transition-all"
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 bg-[#F5F5F4]/40 hover:bg-[#eeeeed]/60 transition-colors"
              >
                <span className="text-sm font-semibold text-[#005c55] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">help_outline</span>
                  {item.q}
                </span>
                <span className="material-symbols-outlined text-[#6e7977] text-[20px]">
                  {openIndex === idx ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {openIndex === idx && (
                <div className="p-4 pt-2 border-t border-[#E7E5E4] text-xs leading-relaxed text-[#3e4947] bg-white">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact help footer */}
        <div className="mt-4 bg-[#0f766e]/10 border border-[#005c55]/20 rounded-lg p-4 flex flex-col gap-2 text-center items-center">
          <span className="material-symbols-outlined text-[#005c55] text-[28px]">support_agent</span>
          <h3 className="text-sm font-bold text-[#005c55]">Masih Butuh Bantuan?</h3>
          <p className="text-xs text-[#3e4947]">
            Jika Anda mengalami kendala teknis yang tidak ada di panduan, silakan hubungi Admin Sekolah.
          </p>
          <a
            href="https://wa.me/6285640019685"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 bg-[#005c55] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#0f766e] transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            Hubungi Admin (WhatsApp)
          </a>
        </div>
      </main>
    </div>
  );
}

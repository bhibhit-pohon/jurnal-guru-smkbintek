# 📘 DOKUMENTASI LENGKAP & RIWAYAT PENGEMBANGAN JURNAL GURU ONLINE
**Sekolah:** SMK Bina Teknologi Purwokerto  
**Tanggal Update Terakhir:** 15 Agustus 2026  
**Status Aplikasi:** `PRODUCTION READY & DEPLOYED ON VERCEL` 🚀  

---

## 📌 1. OVERVIEW PROJEK
Aplikasi **Jurnal Guru Online** adalah sistem pencatatan jurnal mengajar harian guru berbasis web (Responsive Mobile & Desktop) yang terhubung langsung secara real-time ke database Firebase Firestore dan ter-deploy secara publik di Vercel.

---

## 🛠️ 2. TEKNOLOGI & ARCHITECTURE STACK
- **Framework Utama:** Next.js 16 (App Router, Turbopack) & TypeScript
- **Styling UI:** Tailwind CSS (Modern, Responsive, Dark/Light Elements, Glassmorphism)
- **Database & Auth:** Firebase Firestore (Real-time DB) & Firebase Authentication (Google Auth & Email)
- **Export Data:** XLSX (Export Laporan Excel .xlsx)
- **Deployment Platform:** Vercel Hosting (Auto-Deploy dari GitHub repository `main` branch)
- **Favicon & Icon Custom:** Disimpan di `app-next/app/icon.png` (Logo resmi sekolah)

---

## ✨ 3. FITUR-FITUR UTAMA YANG TELAH SELESAI (COMPLETED)

### A. 📱 Halaman Pengisian Jurnal Mengajar Guru (`/isi-jurnal`)
- **Pilihan Master Data Dynamic:** Menampilkan daftar Mata Pelajaran, Kelas, dan Ruangan yang terhubung langsung secara real-time dengan menu Admin.
- **Form Absensi Siswa:** Jumlah Hadir, Sakit, Izin, Alpha, serta input nama siswa yang absen/keterangan.
- **Dokumentasi Foto & Tanda Tangan Digital:** Upload/kamera foto kegiatan belajar mengajar + Signature Canvas tanda tangan guru.
- **Validasi Geolocation (Radius ≤ 50m Sekolah):**
  - Mengukur posisi GPS guru dibanding Koordinat SMK Bina Teknologi (`Latitude: -7.4339, Longitude: 109.2483`).
  - Memberikan indikator lokasi valid (≤ 50m) atau di luar radius sekolah.

### B. 📚 Halaman Riwayat & Arsip Jurnal (`/riwayat-jurnal`)
- Filter riwayat jurnal berdasarkan tanggal, mata pelajaran, dan kelas.
- Tampilan kartu jurnal ringkas dengan modal detail lengkap saat diklik.

### C. 📊 Dashboard Admin & Analytics (`/admin`)
- **Responsive Layout:** Adaptive Sidebar (Mode Full di Layar Lebar, Compact Icon Bar pada Split Window/Tablet, & Mobile Overlay Drawer dengan tombol ☰).
- **4 Kartu Ringkasan Statistik:** Total Jurnal, Jurnal Hari Ini, Guru Terdaftar, Rerata Kehadiran Siswa.
- **Grafik Analytics & Visualisasi:**
  - 📊 **Grafik Tren Pengisian Jurnal Harian (Bar Chart Senin – Jumat)**.
  - 🍰 **Diagram Distribusi Kehadiran Siswa** (Hadir, Sakit, Izin, Alpha).
  - ⚡ **Aktivitas Pengisian Terkini** (Live Feed 4 jurnal terbaru).
- **Export Laporan Excel (.xlsx):** Sekali klik untuk mengunduh seluruh data jurnal dalam format Excel yang rapi.

### D. ⚙️ Kelola Data Master Sekolah (`/admin` -> Tab Master)
- **3 Kategori Data:** Mata Pelajaran, Kelas, dan Ruangan.
- **Fitur Hapus Semua (Kosong) Allowed:** Daftar kosong (`[]`) diakui sebagai data sah buatan Admin dan tidak akan reset ke default bawaan.
- **Dual-Layer Persistence System (LocalStorage + Firestore):**
  - Penginputan dan pengeditan draf dilakukan secara instan di memori lokal.
  - Tombol **`💾 Simpan Perubahan`** melakukan penguncian permanen sekaligus ke `localStorage` dan Firestore database.
- **Floating Toast Notification System:** Notifikasi melayang berwarna di atas layar untuk setiap aksi (Tambah 📌, Edit ✏️, Hapus 🗑️, dan Simpan Sukses 💾).

---

## 📁 4. STRUKTUR DIREKTORI KUNCI PROJEK
```text
JURNAL GURU ONLINE/
├── app-next/
│   ├── app/
│   │   ├── admin/page.tsx        # Dashboard Admin & Kelola Data Master
│   │   ├── isi-jurnal/page.tsx    # Form Pengisian Jurnal Guru
│   │   ├── riwayat-jurnal/page.tsx# Riwayat Jurnal Guru
│   │   ├── icon.png              # Favicon Resmi Aplikasi
│   │   └── page.tsx              # Landing / Splash Screen
│   ├── hooks/
│   │   ├── useMasterData.ts      # Dual-Layer Master Data Hook (LocalStorage + Firestore)
│   │   ├── useJournals.ts        # Hook Fetch & Simpan Jurnal Firestore
│   │   ├── useAuth.ts            # Hook Authentication Firebase
│   │   └── useGeolocation.ts     # Hook Hitung Jarak GPS Sekolah
│   └── lib/
│       ├── firebase.ts           # Konfigurasi Firebase App, Auth, & Firestore
│       └── constants.ts          # Koordinat Sekolah & Option Bawaan
└── DOKUMENTASI_PROJEK_JURNAL_GURU.md  # File Dokumentasi Ini
```

---

## 💡 5. PETUNJUK UNTUK ASISTEN AI PADA SESI BARU
Jika sesi percakapan diakhiri/di-update dan dilanjutkan kembali di chat baru:
1. **AI cukup membaca file ini (`DOKUMENTASI_PROJEK_JURNAL_GURU.md`) dan kode di dalam direktori `app-next/`.**
2. Seluruh riwayat fitur, arsitektur, dan kode telah aman tersimpan di repositori Git dan Vercel online.
3. Anda bisa langsung meminta kelanjutan pengembangan (misal: penambahan fitur baru, cetak PDF, dll) dan AI akan langsung memahami seluruh konteks tanpa ada yang hilang!

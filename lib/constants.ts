export const MASTER_DATA_VERSION = 4;

export const MAPEL_OPTIONS = [
  // --- Mata Pelajaran Umum / Normatif & Adaptif ---
  'Pendidikan Agama Islam & Budi Pekerti',
  'Pendidikan Agama Kristen & Budi Pekerti',
  'Pendidikan Agama Katolik & Budi Pekerti',
  'Pendidikan Pancasila (PPKn)',
  'Bahasa Indonesia',
  'Matematika',
  'Bahasa Inggris',
  'Sejarah Indonesia',
  'Seni Budaya',
  'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)',
  'Informatika',
  'Projek Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Projek Kreatif dan Kewirausahaan (PKK)',
  'Projek Penguatan Profil Pelajar Pancasila (P5)',
  'Bahasa Jawa',
  'Bimbingan Konseling (BK)',
  'Literasi dan Numerasi Kejuruan',

  // --- Broadcasting dan Perfilman (BCF) ---
  'Dasar-Dasar Broadcasting dan Perfilman',
  'Pengantar Industri Broadcasting dan Perfilman',
  'Dasar-Dasar Produksi Audio Visual',
  'Manajemen Pra Produksi (MPrP)',
  'Manajemen Produksi (MP)',
  'Manajemen Pasca Produksi (MPsP)',
  'Penyiaran Online (PO) & Live Streaming',
  'Tata Kamera dan Tata Cahaya',
  'Tata Suara Audio dan Perekaman',
  'Editing Video dan Efek Visual',
  'Penulisan Naskah dan Skenario',
  'Tata Artistik dan Properti Film',

  // --- Teknik Komputer dan Jaringan (TKJ) ---
  'Dasar-Dasar Teknik Jaringan Komputer',
  'Administrasi Server dan Jaringan',
  'Keamanan Jaringan Komputer (Cyber Security)',
  'Jaringan Nirkabel dan Fiber Optik',
  'Instalasi & Konfigurasi Jaringan MikroTik/Cisco',
  'Layanan Cloud Computing',
  'Dasar Pemrograman Web & Mobile',
  'IoT & Sistem Terdistribusi',

  // --- Teknik Kendaraan Ringan (TKR) ---
  'Dasar-Dasar Teknik Otomotif',
  'Pemeliharaan Mesin Kendaraan Ringan (PMKR)',
  'Pemeliharaan Sasis & Pemindah Tenaga (PSPTKR)',
  'Pemeliharaan Kelistrikan Kendaraan Ringan (PKKR)',
  'Sistem Bahan Bakar Injeksi (EFI)',
  'Perawatan Berkala Kendaraan Ringan',
  'Diagnosis Kerusakan Kendaraan Ringan',

  // --- Teknik Sepeda Motor (TSM) ---
  'Dasar-Dasar Otomotif Sepeda Motor',
  'Pemeliharaan Mesin Sepeda Motor (PMSM)',
  'Pemeliharaan Sasis Sepeda Motor (PSSM)',
  'Pemeliharaan Kelistrikan Sepeda Motor (PKSM)',
  'Troubleshooting & Servis Sepeda Motor',
  'Pengelolaan Bengkel Sepeda Motor',

  // --- Teknik Pemesinan (TP) ---
  'Dasar-Dasar Teknik Mesin',
  'Gambar Teknik Manufaktur',
  'Teknik Pemesinan Bubut',
  'Teknik Pemesinan Frais',
  'Teknik Pemesinan Gerinda',
  'Teknik Pemesinan CNC & CAM',
  'Fabrikasi Logam dan Pengelasan',
];

export const KELAS_OPTIONS = [
  'X TP',
  'X TKR 1',
  'X TKR 2',
  'X TSM',
  'X TKJ',
  'X BCF',
  'XI TP',
  'XI TKR 1',
  'XI TKR 2',
  'XI TSM',
  'XI TKJ',
  'XI BCF',
  'XII TP',
  'XII TKR 1',
  'XII TKR 2',
  'XII TSM',
  'XII TKJ',
  'XII BCF',
];

export const RUANG_OPTIONS = [
  'Ruang 1',
  'Ruang 2',
  'Ruang 3',
  'Ruang 4',
  'Ruang 5',
  'Ruang 6',
  'Ruang 7',
  'Ruang 8',
  'Ruang 9',
  'Ruang 10',
  'Ruang 11',
  'Ruang 12',
  'Ruang 13',
  'Ruang 14',
  'Ruang 15',
  'Ruang 16',
  'Ruang 17',
  'Ruang 18',
  'Ruang 19',
  'Ruang 20',
  'Ruang 21',
  'Ruang 22',
  'Ruang 23',
  'Ruang 24',
  'Ruang 25',
  'Ruang 26',
  'Ruang 27',
  'Ruang 28',
  'Ruang 29',
  'Ruang 30',
  'Ruang 31',
  'Lab Komputer TKJ 1',
  'Lab Komputer TKJ 2',
  'Studio Broadcasting (BCF)',
  'Bengkel Pemesinan (TP)',
  'Bengkel Otomotif Mobil (TKR)',
  'Bengkel Sepeda Motor (TSM)',
  'Bengkel Pengelasan & Fabrikasi',
  'Ruang Guru',
  'Ruang Kepala Sekolah & TU',
  'Perpustakaan',
  'Aula SMK Bintek',
  'Lapangan Olahraga',
];

/** Jam ke-1 sampai ke-10 */
export const JAM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Koordinat SMK Bina Teknologi Purwokerto */
export const SCHOOL_COORDS = {
  latitude: -7.43272163415813,
  longitude: 109.22089476611995,
  name: 'SMK Bina Teknologi Purwokerto',
  /** Radius toleransi dalam meter */
  toleranceRadius: 50,
};

/**
 * Hitung jarak antara dua koordinat GPS (Haversine formula).
 * @returns jarak dalam meter
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // radius bumi (meter)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

import type { JournalEntry } from '@/lib/types';

export const DUMMY_JOURNALS: JournalEntry[] = [];

export const MAPEL_OPTIONS = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sejarah',
  'Geografi',
  'Ekonomi',
  'Sosiologi',
  'PKN',
  'Pendidikan Agama',
  'Seni Budaya',
  'PJOK',
  'Informatika',
  'Prakarya',
  'Teknik Komputer & Jaringan',
  'Rekayasa Perangkat Lunak',
  'Multimedia',
  'Akuntansi',
  'Administrasi Perkantoran',
  'Pemasaran',
];

export const KELAS_OPTIONS = [
  'X-A', 'X-B', 'X-C', 'X-D',
  'XI-A', 'XI-B', 'XI-C', 'XI-D',
  'XII-A', 'XII-B', 'XII-C', 'XII-D',
];

export const RUANG_OPTIONS = [
  'R.101', 'R.102', 'R.103', 'R.104', 'R.105',
  'R.201', 'R.202', 'R.203', 'R.204', 'R.205',
  'R.301', 'R.302', 'R.303', 'R.304', 'R.305',
  'Lab Komputer 1', 'Lab Komputer 2',
  'Lab IPA', 'Lab Bahasa',
  'Perpustakaan', 'Aula',
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

export const DUMMY_JOURNALS = [
  {
    id: '1',
    mapel: 'Matematika',
    kelas: 'X-A',
    ruang: 'R.101',
    jamMulai: 1,
    jamSelesai: 2,
    jumlahHadir: 30,
    jumlahIzin: 1,
    jumlahSakit: 2,
    jumlahAlpha: 0,
    namaSiswaAbsen: 'Budi Santoso (Izin), Ani Wulandari (Sakit), Dimas Prasetyo (Sakit)',
    catatan: 'Siswa mempelajari cara menyelesaikan persamaan kuadrat dengan metode faktorisasi dan rumus ABC.',
    tandaTangan: null as string | null,
    fotoKelas: null as string | null,
    lokasi: { latitude: -7.4327, longitude: 109.2209 },
    lokasiValid: true,
    jarakDariSekolah: 5,
    createdAt: '2026-07-28T08:00:00+07:00',
  },
  {
    id: '2',
    mapel: 'Bahasa Inggris',
    kelas: 'XI-B',
    ruang: 'R.203',
    jamMulai: 3,
    jamSelesai: 4,
    jumlahHadir: 28,
    jumlahIzin: 0,
    jumlahSakit: 1,
    jumlahAlpha: 3,
    namaSiswaAbsen: 'Rina Melati (Sakit), Ahmad Fauzi (Alpha), Siti Nurhaliza (Alpha), Dedi Kurniawan (Alpha)',
    catatan: 'Membahas struktur dan ciri-ciri narrative text serta menganalisis contoh cerita rakyat dalam bahasa Inggris.',
    tandaTangan: null as string | null,
    fotoKelas: null as string | null,
    lokasi: { latitude: -7.4328, longitude: 109.2210 },
    lokasiValid: true,
    jarakDariSekolah: 15,
    createdAt: '2026-07-29T10:00:00+07:00',
  },
  {
    id: '3',
    mapel: 'Teknik Komputer & Jaringan',
    kelas: 'XII-C',
    ruang: 'Lab Komputer 1',
    jamMulai: 5,
    jamSelesai: 6,
    jumlahHadir: 32,
    jumlahIzin: 0,
    jumlahSakit: 0,
    jumlahAlpha: 1,
    namaSiswaAbsen: 'Rizky Pratama (Alpha)',
    catatan: 'Praktik konfigurasi dasar router MikroTik meliputi setting IP address, DHCP server, dan firewall NAT.',
    tandaTangan: null as string | null,
    fotoKelas: null as string | null,
    lokasi: { latitude: -7.4326, longitude: 109.2208 },
    lokasiValid: true,
    jarakDariSekolah: 20,
    createdAt: '2026-07-30T13:00:00+07:00',
  },
  {
    id: '4',
    mapel: 'Fisika',
    kelas: 'XI-A',
    ruang: 'Lab IPA',
    jamMulai: 7,
    jamSelesai: 8,
    jumlahHadir: 31,
    jumlahIzin: 1,
    jumlahSakit: 0,
    jumlahAlpha: 0,
    namaSiswaAbsen: 'Dewi Lestari (Izin)',
    catatan: 'Eksperimen hukum Newton III menggunakan pegas dan neraca pegas. Semua kelompok berhasil menyelesaikan laporan.',
    tandaTangan: null as string | null,
    fotoKelas: null as string | null,
    lokasi: { latitude: -7.4327, longitude: 109.2209 },
    lokasiValid: true,
    jarakDariSekolah: 3,
    createdAt: '2026-07-31T14:00:00+07:00',
  },
  {
    id: '5',
    mapel: 'Rekayasa Perangkat Lunak',
    kelas: 'XII-A',
    ruang: 'Lab Komputer 2',
    jamMulai: 1,
    jamSelesai: 3,
    jumlahHadir: 29,
    jumlahIzin: 2,
    jumlahSakit: 1,
    jumlahAlpha: 0,
    namaSiswaAbsen: 'Andi Saputra (Izin), Rina Agustina (Izin), Fajar Nugroho (Sakit)',
    catatan: 'Presentasi proyek akhir semester — aplikasi web inventory. 4 dari 6 kelompok sudah presentasi.',
    tandaTangan: null as string | null,
    fotoKelas: null as string | null,
    lokasi: { latitude: -7.4327, longitude: 109.2209 },
    lokasiValid: true,
    jarakDariSekolah: 8,
    createdAt: '2026-08-01T08:00:00+07:00',
  },
];

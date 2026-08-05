export interface JournalEntry {
  id: string;
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
  tandaTangan: string | null; // base64 data URL
  fotoKelas: string | null; // base64 data URL
  lokasi: GPSCoords | null;
  lokasiValid: boolean;
  jarakDariSekolah: number; // jarak dalam meter
  createdAt: string;
  updatedAt?: string;
}

export interface GPSCoords {
  latitude: number;
  longitude: number;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type ActiveTab = 'riwayat' | 'isi-jurnal' | 'map';

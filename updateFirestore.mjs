import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MAPEL_OPTIONS = [
  'Pengantar Industri Broadcasting dan Perfilman', 'Dasar-Dasar Produksi Audio Visual', 'Menejemen Pra Produksi (MPrP)', 'Menejemen Produksi (MP)', 'Menejemen Pasca Produksi (MPsP)', 'Penyiaran Online (PO)', 'Tata Kamera dan Tata Cahaya', 'Tata Suara Audio dan Perekaman', 'Editing Video dan Efek Visual', 'Penulisan Naskah dan Skenario', 'Tata Artistik dan Properti Film', 'Dasar-Dasar Teknik Jaringan Komputer', 'Administrasi Server dan Jaringan', 'Keamanan Jaringan Komputer', 'Jaringan Nirkabel dan Fiber Optik', 'Instalasi & Konfigurasi Jaringan MikroTik/Cisco', 'Layanan Cloud Computing', 'Dasar Pemrograman Web & Mobile', 'Dasar-Dasar Teknik Otomotif', 'Pemeliharaan Mesin Kendaraan Ringan (PMKR)', 'Pemeliharaan Sasis & Pemindah Tenaga (PSPTKR)', 'Pemeliharaan Kelistrikan Kendaraan Ringan (PKKR)', 'Sistem Bahan Bakar Injeksi (EFI)', 'Perawatan Berkala Kendaraan Ringan', 'Dasar-Dasar Otomotif Sepeda Motor', 'Pemeliharaan Mesin Sepeda Motor (PMSM)', 'Pemeliharaan Sasis Sepeda Motor (PSSM)', 'Pemeliharaan Kelistrikan Sepeda Motor (PKSM)', 'Troubleshooting & Servis Sepeda Motor', 'Dasar-Dasar Teknik Mesin', 'Gambar Teknik Manufaktur', 'Teknik Pemesinan Bubut', 'Teknik Pemesinan Frais', 'Teknik Pemesinan CNC & CAM', 'Fabrikasi Logam dan Pengelasan', 'Pendidikan Agama Islam & Budi Pekerti', 'Pendidikan Agama Kristen & Budi Pekerti', 'Pendidikan Pancasila & Kewarganegaraan (PPKn)', 'Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'Sejarah Indonesia', 'Seni Budaya', 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)', 'Informatika', 'Projek Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'Projek Kreatif dan Kewirausahaan (PKK)', 'Projek Penguatan Profil Pelajar Pancasila (P5)', 'Bahasa Jawa', 'Bimbingan Konseling (BK)', 'Muatan Lokal / Keterampilan Kejuruan', 'Literasi dan Numerasi Kejuruan'
];

const KELAS_OPTIONS = [
  'X TP', 'X TKR 1', 'X TKR 2', 'X TSM', 'X TKJ', 'X BCF', 'XI TP', 'XI TKR 1', 'XI TKR 2', 'XI TSM', 'XI TKJ', 'XI BCF', 'XII TP', 'XII TKR 1', 'XII TKR 2', 'XII TSM', 'XII TKJ', 'XII BCF'
];

const RUANG_OPTIONS = [
  'Ruang 1', 'Ruang 2', 'Ruang 3', 'Ruang 4', 'Ruang 5', 'Ruang 6', 'Ruang 7', 'Ruang 8', 'Ruang 9', 'Ruang 10', 'Ruang 11', 'Ruang 12', 'Ruang 13', 'Ruang 14', 'Ruang 15', 'Ruang 16', 'Ruang 17', 'Ruang 18', 'Ruang 19', 'Ruang 20', 'Ruang 21', 'Ruang 22', 'Ruang 23', 'Ruang 24', 'Ruang 25', 'Ruang 26', 'Ruang 27', 'Ruang 28', 'Ruang 29', 'Ruang 30', 'Ruang 31'
];

async function update() {
  await setDoc(doc(db, 'master_data', 'mapel'), { list: MAPEL_OPTIONS, initialized: true });
  console.log('Mapel updated');
  await setDoc(doc(db, 'master_data', 'kelas'), { list: KELAS_OPTIONS, initialized: true });
  console.log('Kelas updated');
  await setDoc(doc(db, 'master_data', 'ruang'), { list: RUANG_OPTIONS, initialized: true });
  console.log('Ruang updated');
  process.exit(0);
}
update();

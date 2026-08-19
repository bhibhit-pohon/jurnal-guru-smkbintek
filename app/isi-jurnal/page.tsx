'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useJournals } from '@/hooks/useJournals';
import { useMasterData } from '@/hooks/useMasterData';
import { useTheme } from '@/hooks/useTheme';
import { AppHeaderBrand } from '@/components/layout/AppHeaderBrand';
import JournalReminder from '@/components/layout/JournalReminder';
import {
  MAPEL_OPTIONS,
  KELAS_OPTIONS,
  RUANG_OPTIONS,
  JAM_OPTIONS,
  SCHOOL_COORDS,
  calculateDistance,
} from '@/lib/constants';

/* ── Lazy-load SignatureCanvas (needs window) ── */
const SignatureCanvas: any = dynamic(() => import('react-signature-canvas'), {
  ssr: false,
});

/* ── Form State ── */
interface JurnalFormState {
  mapel: string;
  kelas: string;
  ruang: string;
  jamMulai: number | null;
  jamSelesai: number | null;
  jumlahHadir: number;
  jumlahIzin: number;
  jumlahSakit: number;
  jumlahAlpha: number;
  namaSiswaAbsen: string;
  catatan: string;
  fotoKelas: string | null; // base64
  tandaTangan: string | null; // base64
}

const INITIAL_FORM: JurnalFormState = {
  mapel: '',
  kelas: '',
  ruang: '',
  jamMulai: null,
  jamSelesai: null,
  jumlahHadir: 32,
  jumlahIzin: 0,
  jumlahSakit: 0,
  jumlahAlpha: 0,
  namaSiswaAbsen: '',
  catatan: '',
  fotoKelas: null,
  tandaTangan: null,
};

/**
 * Halaman Isi Jurnal — form pengisian jurnal mengajar guru.
 * Route-protected: redirect ke /login jika belum login.
 */
export default function IsiJurnalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { coords, error: geoError, loading: geoLoading } = useGeolocation();
  const { journals: myJournals, saveJournal } = useJournals(user?.uid);
  const { mapelList, kelasList, ruangList } = useMasterData();

  const [form, setForm] = useState<JurnalFormState>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<'idle' | 'uploading' | 'confirming' | 'done'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  /* ── Custom Manual Input States ── */
  const [isCustomMapel, setIsCustomMapel] = useState(false);
  const [isCustomKelas, setIsCustomKelas] = useState(false);
  const [isCustomRuang, setIsCustomRuang] = useState(false);

  /* ── Attendance edit modal ── */
  const [editingField, setEditingField] = useState<'jumlahHadir' | 'jumlahIzin' | 'jumlahSakit' | 'jumlahAlpha' | null>(null);
  const [editValue, setEditValue] = useState('');

  /* ── Signature ref ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sigRef = useRef<any>(null);

  /* ── Camera ref ── */
  const cameraInputRef = useRef<HTMLInputElement>(null);

  /* ── GPS distance ── */
  const distance = coords
    ? calculateDistance(
        coords.latitude,
        coords.longitude,
        SCHOOL_COORDS.latitude,
        SCHOOL_COORDS.longitude
      )
    : null;
  const isWithinRadius = distance !== null && distance <= SCHOOL_COORDS.toleranceRadius;

  /* ── Route protection ── */
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  /* ── Toast helper ── */
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  /* ── Form helpers ── */
  const updateField = useCallback(
    <K extends keyof JurnalFormState>(field: K, value: JurnalFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  /* ── Jam selection ── */
  const handleJamClick = useCallback(
    (jam: number) => {
      if (form.jamMulai === null || (form.jamMulai !== null && form.jamSelesai !== null)) {
        // Start new selection
        setForm((prev) => ({ ...prev, jamMulai: jam, jamSelesai: null }));
      } else {
        // Complete the range
        if (jam >= form.jamMulai) {
          setForm((prev) => ({ ...prev, jamSelesai: jam }));
        } else {
          setForm((prev) => ({ ...prev, jamMulai: jam, jamSelesai: prev.jamMulai }));
        }
      }
    },
    [form.jamMulai, form.jamSelesai]
  );

  const isJamSelected = useCallback(
    (jam: number) => {
      if (form.jamMulai === null) return false;
      if (form.jamSelesai === null) return jam === form.jamMulai;
      return jam >= form.jamMulai && jam <= form.jamSelesai;
    },
    [form.jamMulai, form.jamSelesai]
  );

  /* ── Attendance edit ── */
  const openAttendanceEdit = useCallback(
    (field: 'jumlahHadir' | 'jumlahIzin' | 'jumlahSakit' | 'jumlahAlpha') => {
      setEditingField(field);
      setEditValue(String(form[field]));
    },
    [form]
  );

  const confirmAttendanceEdit = useCallback(() => {
    if (editingField) {
      const num = parseInt(editValue, 10);
      updateField(editingField, isNaN(num) ? 0 : Math.max(0, num));
      setEditingField(null);
    }
  }, [editingField, editValue, updateField]);

/**
 * Kompresi foto bukti kelas menggunakan HTML5 Canvas.
 * Target: < 150KB — cukup jelas untuk melihat guru + siswa di kelas.
 * Firestore max doc size = 1MB. Foto disimpan sebagai base64 di dokumen.
 * maxWidth=480 / quality=0.45 → rata-rata hasilnya 60-130KB.
 */
function compressImageFile(file: File): Promise<string> {
  const MAX_DIM = 480;   // px — cukup jelas untuk bukti foto kelas
  const QUALITY = 0.45;  // JPEG quality — target ~80-130KB

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        // Scale down proportionally
        if (width > height) {
          if (width > MAX_DIM) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
        } else {
          if (height > MAX_DIM) { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(event.target?.result as string); return; }

        ctx.drawImage(img, 0, 0, width, height);
        let result = canvas.toDataURL('image/jpeg', QUALITY);

        // Safety net: jika masih > 200KB, kompres lebih dalam
        const sizeKB = (result.length * 3) / 4 / 1024;
        if (sizeKB > 200) {
          result = canvas.toDataURL('image/jpeg', 0.3);
        }

        resolve(result);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

  /* ── Camera capture ── */
  const handleCameraCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        showToast('Memproses foto...', 'info');
        const compressed = await compressImageFile(file);
        const sizeKB = Math.round((compressed.length * 3) / 4 / 1024);
        updateField('fotoKelas', compressed);
        showToast(`Foto siap (${sizeKB}KB)`, 'success');
      } catch (err) {
        console.error('Gagal mengompres foto:', err);
        showToast('Gagal memproses foto. Coba lagi.', 'error');
      }
    },
    [updateField, showToast]
  );

  /* ── Signature save ── */
  const saveSignature = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL('image/png');
      updateField('tandaTangan', dataUrl);
      showToast('Tanda tangan tersimpan', 'success');
    }
  }, [updateField, showToast]);

  const clearSignature = useCallback(() => {
    if (sigRef.current) {
      sigRef.current.clear();
      updateField('tandaTangan', null);
    }
  }, [updateField]);

  /* ── Validation ── */
  const getValidationErrors = useCallback((): string[] => {
    const errors: string[] = [];
    if (!form.mapel) errors.push('Mata Pelajaran');
    if (!form.kelas) errors.push('Kelas');
    if (!form.ruang) errors.push('Ruang');
    if (form.jamMulai === null || form.jamSelesai === null) errors.push('Rentang Jam');
    if (!form.fotoKelas) errors.push('Foto Kelas');
    if (!isWithinRadius) errors.push('Lokasi (di luar radius 50m)');
    return errors;
  }, [form, isWithinRadius]);

  /* ── Submit handler ── */
  const handleSimpan = useCallback(async () => {
    if (!user) return;

    const errors = getValidationErrors();
    if (errors.length > 0) {
      showToast(`Lengkapi: ${errors.join(', ')}`, 'error');
      return;
    }

    // Final size check
    if (form.fotoKelas) {
      const sizeKB = (form.fotoKelas.length * 3) / 4 / 1024;
      if (sizeKB > 400) {
        showToast('Foto terlalu besar. Hapus & ambil ulang foto.', 'error');
        return;
      }
    }

    if (sigRef.current && !sigRef.current.isEmpty() && !form.tandaTangan) {
      saveSignature();
    }

    setIsSaving(true);
    setSaveStep('uploading');
    try {
      const payload = {
        mapel: form.mapel,
        kelas: form.kelas,
        ruang: form.ruang,
        jamMulai: form.jamMulai!,
        jamSelesai: form.jamSelesai!,
        jumlahHadir: form.jumlahHadir,
        jumlahIzin: form.jumlahIzin,
        jumlahSakit: form.jumlahSakit,
        jumlahAlpha: form.jumlahAlpha,
        namaSiswaAbsen: form.namaSiswaAbsen,
        catatan: form.catatan,
        tandaTangan: form.tandaTangan,
        fotoKelas: form.fotoKelas,
        lokasi: coords,
        lokasiValid: isWithinRadius,
        jarakDariSekolah: distance ? Math.round(distance) : 0,
        uid: user.uid,
        displayName: user.displayName || 'Guru',
        email: user.email || '',
      };

      const result = await saveJournal(payload);
      if (result.success) {
        setSaveStep('done');
        setForm(INITIAL_FORM);
        if (sigRef.current) sigRef.current.clear();
        // Redirect langsung — Firestore addDoc sudah confirmed
        router.push('/riwayat-jurnal');
      } else {
        throw new Error(result.error);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Gagal menyimpan:', err);
      showToast(`Gagal menyimpan: ${err.message || 'Periksa koneksi internet'}`, 'error');
      setSaveStep('idle');
    } finally {
      setIsSaving(false);
    }
  }, [user, form, coords, distance, isWithinRadius, getValidationErrors, saveSignature, saveJournal, showToast]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f8]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#005c55]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-[#3e4947]">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  /* ── Tanggal ── */
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const ATTENDANCE_LABELS: { key: 'jumlahHadir' | 'jumlahIzin' | 'jumlahSakit' | 'jumlahAlpha'; label: string; color: string; borderColor: string }[] = [
    { key: 'jumlahHadir', label: 'Hadir', color: 'text-[#005c55]', borderColor: 'border-[#E7E5E4]' },
    { key: 'jumlahSakit', label: 'Sakit', color: 'text-[#7f4025]', borderColor: 'border-[#ffb598]' },
    { key: 'jumlahIzin', label: 'Izin', color: 'text-[#5a5f64]', borderColor: 'border-[#c3c7cd]' },
    { key: 'jumlahAlpha', label: 'Alpha', color: 'text-[#ba1a1a]', borderColor: 'border-[#ffdad6]' },
  ];

  return (
    <div className="bg-[#f9f9f8] text-[#1a1c1c] antialiased min-h-screen flex flex-col pb-[90px] pt-[72px]">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] animate-slide-down">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
              toast.type === 'error' ? 'bg-[#ba1a1a]' : toast.type === 'success' ? 'bg-[#005c55]' : 'bg-[#5a5f64]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'error' ? 'error' : toast.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80" aria-label="Tutup">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ TopAppBar ══════════════ */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-[#f9f9f8] shadow-sm">
        <AppHeaderBrand />
        <div className="flex items-center gap-2">
          {/* Dark Mode Quick Toggle */}
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="text-[#005c55] p-2 rounded-lg hover:bg-[#0f766e]/10 transition-colors active:scale-95 duration-150"
            aria-label={resolvedTheme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            title={resolvedTheme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            <span className="material-symbols-outlined text-[22px]">
              {resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          {/* Profile Link */}
          <Link href="/profil" className="flex items-center">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt="Profil"
                className="w-9 h-9 rounded-full border-2 border-[#005c55]/20 hover:border-[#005c55]/50 transition-colors"
              />
            ) : (
              <span className="material-symbols-outlined text-[#005c55] hover:opacity-80 transition-opacity p-1 text-[28px]">account_circle</span>
            )}
          </Link>
        </div>
      </header>

      {/* ══════════════ Main Content ══════════════ */}
      <main className="px-4 flex flex-col gap-5 max-w-[600px] mx-auto w-full">
        {/* ── Header ── */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl leading-8 font-semibold text-[#1a1c1c] font-[Inter]">
            Isi Jurnal Mengajar
          </h2>
          <p className="text-sm leading-5 font-normal font-[Inter] text-[#3e4947]">
            {today}
          </p>
        </div>

        {/* ── In-App Reminder ── */}
        <JournalReminder journals={myJournals} showCTA={false} />

        {/* ═══════════ Card 1: Info Mengajar ═══════════ */}
        <section className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg flex flex-col overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb]" />
          <div className="p-4 flex flex-col gap-4">

          <h3 className="text-base font-semibold text-[#1a1c1c] font-[Inter] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#005c55] text-[20px]">school</span>
            Info Mengajar
          </h3>

          {/* Mapel */}
          <div className="flex flex-col gap-1">
            <label className="text-xs leading-4 font-medium font-[Inter] text-[#3e4947]">
              Mata Pelajaran <span className="text-[#ba1a1a]">*</span>
            </label>
            {!isCustomMapel ? (
              <select
                value={form.mapel}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomMapel(true);
                    updateField('mapel', '');
                  } else {
                    updateField('mapel', e.target.value);
                  }
                }}
                className="bg-white border border-[#E7E5E4] rounded-md px-4 py-2.5 text-base font-[Inter] text-[#1a1c1c] w-full focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow appearance-none"
              >
                <option value="">Pilih Mata Pelajaran</option>
                {mapelList.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
                <option value="__custom__">✏️ + Ketik Manual...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.mapel}
                  onChange={(e) => updateField('mapel', e.target.value)}
                  placeholder="Ketik nama mata pelajaran..."
                  className="bg-white border border-[#005c55] rounded-md px-4 py-2 text-base font-[Inter] text-[#1a1c1c] w-full focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMapel(false);
                    updateField('mapel', '');
                  }}
                  className="text-xs text-[#005c55] underline shrink-0 px-2"
                >
                  Pilih List
                </button>
              </div>
            )}
          </div>

          {/* Kelas + Ruang (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Kelas */}
            <div className="flex flex-col gap-1">
              <label className="text-xs leading-4 font-medium font-[Inter] text-[#3e4947]">
                Kelas <span className="text-[#ba1a1a]">*</span>
              </label>
              {!isCustomKelas ? (
                <select
                  value={form.kelas}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomKelas(true);
                      updateField('kelas', '');
                    } else {
                      updateField('kelas', e.target.value);
                    }
                  }}
                  className="bg-white border border-[#E7E5E4] rounded-md px-3 py-2.5 text-base font-[Inter] text-[#1a1c1c] w-full focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow appearance-none"
                >
                  <option value="">Pilih</option>
                  {kelasList.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                  <option value="__custom__">✏️ + Ketik Manual...</option>
                </select>
              ) : (
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    value={form.kelas}
                    onChange={(e) => updateField('kelas', e.target.value)}
                    placeholder="Ketik kelas..."
                    className="bg-white border border-[#005c55] rounded-md px-3 py-2 text-sm font-[Inter] text-[#1a1c1c] w-full focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomKelas(false);
                      updateField('kelas', '');
                    }}
                    className="text-[11px] text-[#005c55] underline text-left"
                  >
                    Pilih List
                  </button>
                </div>
              )}
            </div>

            {/* Ruang */}
            <div className="flex flex-col gap-1">
              <label className="text-xs leading-4 font-medium font-[Inter] text-[#3e4947]">
                Ruang <span className="text-[#ba1a1a]">*</span>
              </label>
              {!isCustomRuang ? (
                <select
                  value={form.ruang}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomRuang(true);
                      updateField('ruang', '');
                    } else {
                      updateField('ruang', e.target.value);
                    }
                  }}
                  className="bg-white border border-[#E7E5E4] rounded-md px-3 py-2.5 text-base font-[Inter] text-[#1a1c1c] w-full focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow appearance-none"
                >
                  <option value="">Pilih</option>
                  {ruangList.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="__custom__">✏️ + Ketik Manual...</option>
                </select>
              ) : (
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    value={form.ruang}
                    onChange={(e) => updateField('ruang', e.target.value)}
                    placeholder="Ketik ruang..."
                    className="bg-white border border-[#005c55] rounded-md px-3 py-2 text-sm font-[Inter] text-[#1a1c1c] w-full focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomRuang(false);
                      updateField('ruang', '');
                    }}
                    className="text-[11px] text-[#005c55] underline text-left"
                  >
                    Pilih List
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Rentang Jam */}
          <div className="flex flex-col gap-2">
            <label className="text-xs leading-4 font-medium font-[Inter] text-[#3e4947]">
              Rentang Jam Mengajar <span className="text-[#ba1a1a]">*</span>
            </label>
            <p className="text-[11px] text-[#6e7977] font-[Inter] -mt-1">
              Tap jam mulai, lalu tap jam selesai
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {JAM_OPTIONS.map((jam) => (
                <button
                  key={jam}
                  type="button"
                  onClick={() => handleJamClick(jam)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold font-[Inter] transition-all duration-150 active:scale-95 ${
                    isJamSelected(jam)
                      ? 'bg-[#005c55] text-white shadow-sm'
                      : 'bg-white border border-[#E7E5E4] text-[#3e4947] hover:bg-[#eeeeed]'
                  }`}
                >
                  {jam}
                </button>
              ))}
            </div>
            {form.jamMulai !== null && form.jamSelesai !== null && (
              <p className="text-xs text-[#005c55] font-medium font-[Inter]">
                Jam ke-{form.jamMulai} s/d Jam ke-{form.jamSelesai}
              </p>
            )}
          </div>
        </div></section>

        {/* ═══════════ Card 2: Kehadiran ═══════════ */}
        <section className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg flex flex-col overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb]" />
          <div className="p-4 flex flex-col gap-4">

          <h3 className="text-base font-semibold text-[#1a1c1c] font-[Inter] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#005c55] text-[20px]">groups</span>
            Kehadiran Siswa
          </h3>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2">
            {ATTENDANCE_LABELS.map(({ key, label, color, borderColor }) => (
              <button
                key={key}
                type="button"
                onClick={() => openAttendanceEdit(key)}
                className={`bg-white border ${borderColor} rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#eeeeed] transition-colors active:scale-95 duration-150`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-4xl font-bold font-[Inter] ${color}`}>
                    {form[key]}
                  </span>
                  <span className={`material-symbols-outlined ${color} text-[16px]`}>edit</span>
                </div>
                <span className="text-xs leading-4 font-medium font-[Inter] text-[#3e4947] uppercase tracking-wide">
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Nama Siswa Absen */}
          <div className="flex flex-col gap-1">
            <label className="text-xs leading-4 font-medium font-[Inter] text-[#3e4947]">
              Nama Siswa yang Tidak Hadir
            </label>
            <textarea
              value={form.namaSiswaAbsen}
              onChange={(e) => updateField('namaSiswaAbsen', e.target.value)}
              rows={2}
              className="bg-white border border-[#E7E5E4] rounded-md px-4 py-2 text-sm font-[Inter] text-[#1a1c1c] w-full resize-none focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow"
              placeholder="Contoh: Budi (Sakit), Ani (Alpha)..."
            />
          </div>

          {/* Catatan */}
          <div className="flex flex-col gap-1">
            <label className="text-xs leading-4 font-medium font-[Inter] text-[#3e4947]">
              Catatan Jurnal
            </label>
            <textarea
              value={form.catatan}
              onChange={(e) => updateField('catatan', e.target.value)}
              rows={3}
              className="bg-white border border-[#E7E5E4] rounded-md px-4 py-2 text-sm font-[Inter] text-[#1a1c1c] w-full resize-none focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow"
              placeholder="Catatan aktivitas mengajar, kejadian khusus..."
            />
          </div>
        </div></section>

        {/* ═══════════ Card 3: Validasi & Bukti ═══════════ */}
        <section className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg flex flex-col overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#005c55] via-[#0f766e] to-[#80d5cb]" />
          <div className="p-4 flex flex-col gap-4">

          <h3 className="text-base font-semibold text-[#1a1c1c] font-[Inter] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#005c55] text-[20px]">verified</span>
            Validasi & Bukti
          </h3>

          {/* ── Foto Kelas ── */}
          <div className="flex flex-col gap-2">
            <label className="text-xs leading-4 font-medium font-[Inter] text-[#3e4947]">
              Foto Kelas <span className="text-[#ba1a1a]">*</span>
              <span className="text-[#6e7977] font-normal ml-1">(maks 2MB)</span>
            </label>

            {form.fotoKelas ? (
              <div className="relative rounded-lg overflow-hidden border border-[#E7E5E4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.fotoKelas}
                  alt="Foto kelas"
                  className="w-full h-[180px] object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateField('fotoKelas', null);
                    if (cameraInputRef.current) cameraInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 bg-[#ba1a1a] text-white p-1.5 rounded-full shadow-md hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="bg-white border border-dashed border-[#bdc9c6] rounded-lg p-6 flex flex-col gap-2 items-center justify-center cursor-pointer hover:bg-[#eeeeed] transition-colors"
              >
                <span className="material-symbols-outlined text-[#005c55] text-[32px]">
                  photo_camera
                </span>
                <span className="text-sm font-medium font-[Inter] text-[#005c55]">
                  Ambil Foto Kelas
                </span>
                <span className="text-[11px] text-[#6e7977] font-[Inter]">
                  Kamera saja — galeri tidak tersedia
                </span>
              </button>
            )}

            {/* Hidden camera input — capture="environment" forces camera, accept limits to images */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
          </div>

          {/* ── Tanda Tangan ── */}
          <div className="flex flex-col gap-2">
            <label className="text-xs leading-4 font-medium font-[Inter] text-[#3e4947]">
              Tanda Tangan Guru
            </label>

            {form.tandaTangan ? (
              <div className="relative rounded-lg overflow-hidden border border-[#E7E5E4] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.tandaTangan}
                  alt="Tanda tangan"
                  className="w-full h-[120px] object-contain bg-white"
                />
                <button
                  type="button"
                  onClick={clearSignature}
                  className="absolute top-2 right-2 bg-[#5a5f64] text-white p-1.5 rounded-full shadow-md hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
              </div>
            ) : (
              <div className="bg-white border border-[#E7E5E4] rounded-lg flex flex-col relative overflow-hidden">
                <div className="absolute top-2 left-3 text-[10px] font-medium font-[Inter] text-[#6e7977] uppercase tracking-wider z-10 pointer-events-none">
                  Tanda tangan di sini ↓
                </div>
                <SignatureCanvas
                  ref={sigRef}
                  canvasProps={{
                    className: 'w-full h-[130px] cursor-crosshair',
                  }}
                  penColor="#1a1c1c"
                  backgroundColor="white"
                />
                <div className="flex gap-2 p-2 border-t border-[#E7E5E4]">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="flex-1 py-1.5 rounded text-xs font-medium text-[#3e4947] border border-[#E7E5E4] hover:bg-[#f3f4f3] transition-colors font-[Inter] flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">undo</span>
                    Hapus
                  </button>
                  <button
                    type="button"
                    onClick={saveSignature}
                    className="flex-1 py-1.5 rounded text-xs font-medium text-white bg-[#005c55] hover:opacity-90 transition-opacity font-[Inter] flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    Simpan TTD
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Lokasi ── */}
          <div className="flex flex-col gap-2">
            <label className="text-xs leading-4 font-medium font-[Inter] text-[#3e4947]">
              Lokasi Mengajar <span className="text-[#ba1a1a]">*</span>
            </label>

            <div className="bg-white border border-[#E7E5E4] rounded-lg p-4 flex flex-col gap-3">
              {/* Status */}
              {geoLoading ? (
                <div className="flex items-center gap-3">
                  <div className="bg-[#0f766e]/10 p-2 rounded-full">
                    <svg className="animate-spin h-5 w-5 text-[#005c55]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium font-[Inter] text-[#1a1c1c]">Mendeteksi lokasi...</span>
                    <span className="text-xs font-[Inter] text-[#6e7977]">Mohon izinkan akses lokasi</span>
                  </div>
                </div>
              ) : geoError ? (
                <div className="flex items-center gap-3">
                  <div className="bg-[#ffdad6] p-2 rounded-full">
                    <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">location_off</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium font-[Inter] text-[#ba1a1a]">GPS Tidak Tersedia</span>
                    <span className="text-xs font-[Inter] text-[#6e7977]">Aktifkan GPS dan izinkan akses lokasi</span>
                  </div>
                </div>
              ) : isWithinRadius ? (
                <div className="flex items-center gap-3">
                  <div className="bg-[#0f766e]/10 p-2 rounded-full">
                    <span className="material-symbols-outlined text-[#005c55] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium font-[Inter] text-[#005c55]">Sesuai Lokasi</span>
                    <span className="text-xs font-[Inter] text-[#6e7977]">
                      {SCHOOL_COORDS.name} • Jarak: {Math.round(distance!)}m
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#005c55]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="bg-[#ffdad6] p-2 rounded-full">
                    <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">location_off</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium font-[Inter] text-[#ba1a1a]">Di Luar Area</span>
                    <span className="text-xs font-[Inter] text-[#6e7977]">
                      Jarak: {Math.round(distance!)}m — melebihi batas {SCHOOL_COORDS.toleranceRadius}m
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#ba1a1a]">error</span>
                </div>
              )}

              {/* Coordinates display */}
              {coords && (
                <div className="text-[11px] font-[Inter] text-[#6e7977] bg-[#f3f4f3] rounded px-3 py-1.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">gps_fixed</span>
                  {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                </div>
              )}
            </div>
          </div>
        </div></section>

        {/* ═══════════ Submit Button ═══════════ */}
        <button
          type="button"
          onClick={handleSimpan}
          disabled={isSaving || !isWithinRadius}
          className={`w-full text-sm leading-5 font-medium tracking-[0.01em] font-[Inter] py-4 rounded-full shadow-sm mt-2 transition-all active:scale-[0.98] duration-150 disabled:cursor-not-allowed ${
            isWithinRadius
              ? 'bg-[#005c55] text-white hover:opacity-90 disabled:opacity-50'
              : 'bg-[#E7E5E4] text-[#6e7977] cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {saveStep === 'uploading' ? 'Mengirim ke server...' : 'Menyimpan...'}
            </span>
          ) : !isWithinRadius ? (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              Lokasi Di Luar Area — Tidak Bisa Simpan
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">save</span>
              Simpan Jurnal
            </span>
          )}
        </button>

        {/* Spacer */}
        <div className="h-6" />
      </main>

      {/* ══════════════ Bottom Navigation (2 items) ══════════════ */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-[#f9f9f8] shadow-lg rounded-t-xl">
        {/* Isi Jurnal — Active */}
        <button
          aria-current="page"
          aria-label="Isi Jurnal"
          className="flex flex-col items-center justify-center bg-[#dfe3e9] text-[#60656a] rounded-xl px-6 py-1.5 transition-colors active:scale-95 duration-150"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            description
          </span>
          <span className="text-sm leading-5 font-medium tracking-[0.01em] font-[Inter] mt-1 font-bold">
            Isi Jurnal
          </span>
        </button>

        {/* Riwayat Jurnal — prefetch for instant navigation */}
        <Link
          href="/riwayat-jurnal"
          prefetch={true}
          aria-label="Riwayat Jurnal"
          className="flex flex-col items-center justify-center text-[#3e4947] px-6 py-1.5 hover:bg-[#e8e8e7] transition-colors active:scale-95 duration-150 rounded-xl"
        >
          <span className="material-symbols-outlined">history</span>
          <span className="text-sm leading-5 font-medium tracking-[0.01em] font-[Inter] mt-1">
            Riwayat
          </span>
        </Link>
      </nav>

      {/* ══════════════ Attendance Edit Modal ══════════════ */}
      {editingField && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-8">
          <div
            className="bg-white rounded-xl p-6 w-full max-w-[300px] flex flex-col gap-4 shadow-xl"
            style={{ animation: 'slide-up 0.2s ease-out' }}
          >
            <h4 className="text-lg font-semibold text-[#1a1c1c] font-[Inter] capitalize">
              Edit {ATTENDANCE_LABELS.find((a) => a.key === editingField)?.label}
            </h4>
            <input
              type="number"
              min={0}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAttendanceEdit();
              }}
              autoFocus
              className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-md px-4 py-3 text-2xl font-bold text-center text-[#1a1c1c] font-[Inter] w-full focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="flex-1 py-2.5 rounded-lg border border-[#E7E5E4] text-sm font-medium text-[#3e4947] font-[Inter] hover:bg-[#f3f4f3] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmAttendanceEdit}
                className="flex-1 py-2.5 rounded-lg bg-[#005c55] text-white text-sm font-medium font-[Inter] hover:opacity-90 transition-opacity"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

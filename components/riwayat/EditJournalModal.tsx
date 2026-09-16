'use client';

import { useState, useCallback } from 'react';
import type { JournalEntry } from '@/lib/types';
import { JAM_OPTIONS } from '@/lib/constants';
import { useMasterData } from '@/hooks/useMasterData';

interface EditJournalModalProps {
  journal: JournalEntry;
  onClose: () => void;
  onSave: (
    id: string,
    data: {
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
    }
  ) => Promise<{ success: boolean; error?: string }>;
}

export default function EditJournalModal({ journal, onClose, onSave }: EditJournalModalProps) {
  const { mapelList, kelasList, ruangList } = useMasterData();

  const [mapel, setMapel] = useState(journal.mapel);
  const [kelas, setKelas] = useState(journal.kelas);
  const [ruang, setRuang] = useState(journal.ruang);
  const [jamMulai, setJamMulai] = useState<number | null>(journal.jamMulai);
  const [jamSelesai, setJamSelesai] = useState<number | null>(journal.jamSelesai);
  const [jumlahHadir, setJumlahHadir] = useState(journal.jumlahHadir);
  const [jumlahIzin, setJumlahIzin] = useState(journal.jumlahIzin);
  const [jumlahSakit, setJumlahSakit] = useState(journal.jumlahSakit);
  const [jumlahAlpha, setJumlahAlpha] = useState(journal.jumlahAlpha);
  const [namaSiswaAbsen, setNamaSiswaAbsen] = useState(journal.namaSiswaAbsen);
  const [catatan, setCatatan] = useState(journal.catatan);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Custom manual input toggles */
  const [isCustomMapel, setIsCustomMapel] = useState(!mapelList.includes(journal.mapel));
  const [isCustomKelas, setIsCustomKelas] = useState(!kelasList.includes(journal.kelas));
  const [isCustomRuang, setIsCustomRuang] = useState(!ruangList.includes(journal.ruang));

  /* Jam selection logic */
  const handleJamClick = useCallback(
    (jam: number) => {
      if (jamMulai !== null && jamSelesai !== null) {
        setJamMulai(jam);
        setJamSelesai(jam);
      } else if (jamMulai !== null && jamSelesai === null) {
        if (jam >= jamMulai) {
          setJamSelesai(jam);
        } else {
          setJamSelesai(jamMulai);
          setJamMulai(jam);
        }
      } else {
        setJamMulai(jam);
        setJamSelesai(null);
      }
    },
    [jamMulai, jamSelesai]
  );

  const isJamSelected = useCallback(
    (jam: number) => {
      if (jamMulai === null) return false;
      if (jamSelesai === null) return jam === jamMulai;
      return jam >= jamMulai && jam <= jamSelesai;
    },
    [jamMulai, jamSelesai]
  );

  const handleSubmit = async () => {
    if (!mapel || !kelas || !ruang || jamMulai === null || jamSelesai === null) {
      setError('Lengkapi Mata Pelajaran, Kelas, Ruang, dan Rentang Jam.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await onSave(journal.id, {
      mapel,
      kelas,
      ruang,
      jamMulai: jamMulai!,
      jamSelesai: jamSelesai!,
      jumlahHadir,
      jumlahIzin,
      jumlahSakit,
      jumlahAlpha,
      namaSiswaAbsen,
      catatan,
    });

    setIsSaving(false);

    if (!result.success) {
      setError(result.error || 'Gagal menyimpan perubahan.');
    } else {
      onClose();
    }
  };

  const ATTENDANCE_FIELDS = [
    { key: 'jumlahHadir' as const, label: 'Hadir', value: jumlahHadir, set: setJumlahHadir, color: 'text-[#005c55]', border: 'border-[#E7E5E4]' },
    { key: 'jumlahSakit' as const, label: 'Sakit', value: jumlahSakit, set: setJumlahSakit, color: 'text-[#7f4025]', border: 'border-[#ffb598]' },
    { key: 'jumlahIzin' as const, label: 'Izin', value: jumlahIzin, set: setJumlahIzin, color: 'text-[#5a5f64]', border: 'border-[#c3c7cd]' },
    { key: 'jumlahAlpha' as const, label: 'Alpha', value: jumlahAlpha, set: setJumlahAlpha, color: 'text-[#ba1a1a]', border: 'border-[#ffdad6]' },
  ];

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#f9f9f8] rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[#E7E5E4] bg-[#f9f9f8]">
          <h3 className="text-base font-bold text-[#005c55] font-[Inter] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
            Edit Jurnal
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#e8e8e7] transition-colors"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[#6e7977] text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
          {/* Error Banner */}
          {error && (
            <div className="bg-[#ffdad6] text-[#ba1a1a] text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          {/* Mapel */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium font-[Inter] text-[#3e4947]">
              Mata Pelajaran <span className="text-[#ba1a1a]">*</span>
            </label>
            {!isCustomMapel ? (
              <select
                value={mapel}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomMapel(true);
                    setMapel('');
                  } else {
                    setMapel(e.target.value);
                  }
                }}
                className="bg-white border border-[#E7E5E4] rounded-md px-4 py-2.5 text-sm font-[Inter] text-[#1a1c1c] w-full focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow appearance-none"
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
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  placeholder="Ketik nama mata pelajaran..."
                  className="bg-white border border-[#005c55] rounded-md px-4 py-2 text-sm font-[Inter] text-[#1a1c1c] w-full focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => { setIsCustomMapel(false); setMapel(''); }}
                  className="text-xs text-[#005c55] underline shrink-0 px-2"
                >
                  Pilih List
                </button>
              </div>
            )}
          </div>

          {/* Kelas + Ruang */}
          <div className="grid grid-cols-2 gap-3">
            {/* Kelas */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium font-[Inter] text-[#3e4947]">
                Kelas <span className="text-[#ba1a1a]">*</span>
              </label>
              {!isCustomKelas ? (
                <select
                  value={kelas}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomKelas(true);
                      setKelas('');
                    } else {
                      setKelas(e.target.value);
                    }
                  }}
                  className="bg-white border border-[#E7E5E4] rounded-md px-3 py-2.5 text-sm font-[Inter] text-[#1a1c1c] w-full focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow appearance-none"
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
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    placeholder="Ketik kelas..."
                    className="bg-white border border-[#005c55] rounded-md px-3 py-2 text-sm font-[Inter] text-[#1a1c1c] w-full focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => { setIsCustomKelas(false); setKelas(''); }}
                    className="text-[11px] text-[#005c55] underline text-left"
                  >
                    Pilih List
                  </button>
                </div>
              )}
            </div>

            {/* Ruang */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium font-[Inter] text-[#3e4947]">
                Ruang <span className="text-[#ba1a1a]">*</span>
              </label>
              {!isCustomRuang ? (
                <select
                  value={ruang}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomRuang(true);
                      setRuang('');
                    } else {
                      setRuang(e.target.value);
                    }
                  }}
                  className="bg-white border border-[#E7E5E4] rounded-md px-3 py-2.5 text-sm font-[Inter] text-[#1a1c1c] w-full focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow appearance-none"
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
                    value={ruang}
                    onChange={(e) => setRuang(e.target.value)}
                    placeholder="Ketik ruang..."
                    className="bg-white border border-[#005c55] rounded-md px-3 py-2 text-sm font-[Inter] text-[#1a1c1c] w-full focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => { setIsCustomRuang(false); setRuang(''); }}
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
            <label className="text-xs font-medium font-[Inter] text-[#3e4947]">
              Rentang Jam Mengajar <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {JAM_OPTIONS.map((jam) => (
                <button
                  key={jam}
                  type="button"
                  onClick={() => handleJamClick(jam)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold font-[Inter] transition-all duration-150 active:scale-95 ${
                    isJamSelected(jam)
                      ? 'bg-[#005c55] text-white shadow-sm'
                      : 'bg-white border border-[#E7E5E4] text-[#3e4947] hover:bg-[#eeeeed]'
                  }`}
                >
                  {jam}
                </button>
              ))}
            </div>
            {jamMulai !== null && jamSelesai !== null && (
              <p className="text-xs text-[#005c55] font-medium font-[Inter]">
                Jam ke-{jamMulai} s/d Jam ke-{jamSelesai}
              </p>
            )}
          </div>

          {/* Kehadiran */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium font-[Inter] text-[#3e4947]">
              Kehadiran Siswa
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ATTENDANCE_FIELDS.map(({ key, label, value, set, color, border }) => (
                <div key={key} className={`bg-white border ${border} rounded-lg p-2 flex flex-col items-center gap-1`}>
                  <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) => set(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full text-center text-2xl font-bold font-[Inter] ${color} bg-transparent focus:outline-none`}
                  />
                  <span className="text-[10px] font-medium font-[Inter] text-[#3e4947] uppercase tracking-wide">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Nama Siswa Absen */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium font-[Inter] text-[#3e4947]">
              Nama Siswa yang Tidak Hadir
            </label>
            <textarea
              value={namaSiswaAbsen}
              onChange={(e) => setNamaSiswaAbsen(e.target.value)}
              rows={2}
              className="bg-white border border-[#E7E5E4] rounded-md px-4 py-2 text-sm font-[Inter] text-[#1a1c1c] w-full resize-none focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow"
              placeholder="Contoh: Budi (Sakit), Ani (Alpha)..."
            />
          </div>

          {/* Catatan */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium font-[Inter] text-[#3e4947]">
              Materi dan Kegiatan Pembelajaran
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              className="bg-white border border-[#E7E5E4] rounded-md px-4 py-2 text-sm font-[Inter] text-[#1a1c1c] w-full resize-none focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow"
              placeholder="Catatan aktivitas mengajar..."
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 z-10 flex gap-2 px-5 py-4 border-t border-[#E7E5E4] bg-[#f9f9f8]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-[#E7E5E4] text-sm font-medium text-[#3e4947] font-[Inter] hover:bg-[#F5F5F4] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-3 rounded-lg bg-[#005c55] text-white text-sm font-semibold font-[Inter] hover:bg-[#0f766e] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

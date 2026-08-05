'use client';

import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { SelectField } from './SelectField';
import { AttendanceGrid } from './AttendanceGrid';
import { SignaturePad } from './SignaturePad';
import { PhotoCapture } from './PhotoCapture';
import { GPSLocation } from './GPSLocation';
import { StickyActionBar } from './StickyActionBar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MAPEL_OPTIONS, KELAS_OPTIONS, RUANG_OPTIONS } from '@/lib/constants';
import type { ActiveTab, GPSCoords, JournalEntry } from '@/lib/types';

interface IsiJurnalPageProps {
  onTabChange: (tab: ActiveTab) => void;
  onSave: (journal: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const initialFormState = {
  mapel: '',
  kelas: '',
  ruang: '',
  jamKe: '',
  jumlahHadir: 0,
  jumlahIzin: 0,
  jumlahSakit: 0,
  jumlahAlpha: 0,
  namaSiswaAbsen: '',
  materiPembelajaran: '',
  uraianPembelajaran: '',
  tandaTangan: null as string | null,
  fotoKelas: null as string | null,
  lokasi: null as GPSCoords | null,
};

export function IsiJurnalPage({ onTabChange, onSave }: IsiJurnalPageProps) {
  const [form, setForm] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = <K extends keyof typeof initialFormState>(
    field: K,
    value: (typeof initialFormState)[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttendanceChange = (field: 'hadir' | 'izin' | 'sakit' | 'alpha', value: number) => {
    const fieldMap = {
      hadir: 'jumlahHadir',
      izin: 'jumlahIzin',
      sakit: 'jumlahSakit',
      alpha: 'jumlahAlpha',
    } as const;
    updateField(fieldMap[field], value);
  };

  const handleCancel = () => {
    setForm(initialFormState);
    onTabChange('riwayat');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...form,
        jamMulai: parseInt(form.jamKe) || 1,
        jamSelesai: parseInt(form.jamKe) || 2,
        catatan: `${form.materiPembelajaran}\n${form.uraianPembelajaran}`,
        lokasiValid: true,
        jarakDariSekolah: 0,
      });
      setForm(initialFormState);
      onTabChange('riwayat');
    } catch (err) {
      console.error('Failed to save journal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLocationChange = useCallback((coords: GPSCoords | null) => {
    setForm((prev) => ({ ...prev, lokasi: coords }));
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      <Header
        title="Isi Jurnal"
        showBack
        onBack={handleCancel}
      />

      {/* Scrollable form content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 pb-4">
          {/* Mapel */}
          <SelectField
            label="Mapel"
            placeholder="Pilih Mapel"
            options={MAPEL_OPTIONS}
            value={form.mapel}
            onChange={(v) => updateField('mapel', v)}
          />

          {/* Kelas */}
          <SelectField
            label="Kelas"
            placeholder="Pilih Kelas"
            options={KELAS_OPTIONS}
            value={form.kelas}
            onChange={(v) => updateField('kelas', v)}
          />

          {/* Ruang */}
          <SelectField
            label="Ruang"
            placeholder="Pilih Ruang"
            options={RUANG_OPTIONS}
            value={form.ruang}
            onChange={(v) => updateField('ruang', v)}
          />

          {/* Jam Ke */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-gray-700">Jam Ke</Label>
            <Input
              placeholder="Contoh: 1-2"
              value={form.jamKe}
              onChange={(e) => updateField('jamKe', e.target.value)}
              className="h-11 rounded-lg border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:border-red-400"
            />
          </div>

          {/* Attendance Grid */}
          <AttendanceGrid
            hadir={form.jumlahHadir}
            izin={form.jumlahIzin}
            sakit={form.jumlahSakit}
            alpha={form.jumlahAlpha}
            onChange={handleAttendanceChange}
          />

          {/* Nama Siswa Absen */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-gray-700">Nama Siswa Absen</Label>
            <Textarea
              placeholder="Tulis nama siswa yang tidak hadir..."
              value={form.namaSiswaAbsen}
              onChange={(e) => updateField('namaSiswaAbsen', e.target.value)}
              rows={3}
              className="rounded-lg border-gray-200 bg-gray-50/50 text-sm resize-none focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:border-red-400"
            />
          </div>

          {/* Materi Pembelajaran */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-gray-700">Materi Pembelajaran</Label>
            <Input
              placeholder="Judul materi yang diajarkan"
              value={form.materiPembelajaran}
              onChange={(e) => updateField('materiPembelajaran', e.target.value)}
              className="h-11 rounded-lg border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:border-red-400"
            />
          </div>

          {/* Uraian Pembelajaran */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-gray-700">Uraian Pembelajaran</Label>
            <Textarea
              placeholder="Deskripsikan kegiatan pembelajaran..."
              value={form.uraianPembelajaran}
              onChange={(e) => updateField('uraianPembelajaran', e.target.value)}
              rows={4}
              className="rounded-lg border-gray-200 bg-gray-50/50 text-sm resize-none focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:border-red-400"
            />
          </div>

          {/* Signature Pad */}
          <SignaturePad
            value={form.tandaTangan}
            onChange={(v) => updateField('tandaTangan', v)}
          />

          {/* Photo Capture */}
          <PhotoCapture
            value={form.fotoKelas}
            onChange={(v) => updateField('fotoKelas', v)}
          />

          {/* GPS Location */}
          <GPSLocation
            value={form.lokasi}
            onChange={handleLocationChange}
          />
        </div>

        {/* Sticky Action Bar */}
        <StickyActionBar
          onCancel={handleCancel}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}

'use client';

import { MapPin, Calendar, BookOpen } from 'lucide-react';
import type { JournalEntry } from '@/lib/types';

interface JournalCardProps {
  journal: JournalEntry;
  onClick?: () => void;
}

export function JournalCard({ journal, onClick }: JournalCardProps) {
  const formattedDate = new Date(journal.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(journal.createdAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalSiswa = journal.jumlahHadir + journal.jumlahIzin + journal.jumlahSakit + journal.jumlahAlpha;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 overflow-hidden text-left"
    >
      <div className="flex">
        {/* Thumbnail */}
        <div className="w-24 h-28 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center shrink-0">
          {journal.fotoKelas ? (
            <img
              src={journal.fotoKelas}
              alt="Foto Kelas"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <BookOpen className="size-8 text-red-300" />
              <span className="text-[10px] text-red-300 font-medium">No Photo</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-semibold text-[15px] text-gray-900 truncate">
              {journal.mapel}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {journal.kelas} &middot; {journal.ruang}
            </p>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="size-3.5" />
              <span>{formattedDate}, {formattedTime}</span>
            </div>
            {journal.lokasi && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <MapPin className="size-3.5" />
                <span>{journal.lokasi.latitude.toFixed(4)}, {journal.lokasi.longitude.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Attendance badge */}
        <div className="pr-3 pt-3 shrink-0">
          <div className="bg-red-50 text-red-600 rounded-lg px-2 py-1 text-center">
            <span className="text-sm font-bold">{journal.jumlahHadir}</span>
            <span className="text-[10px] text-red-400 block">/{totalSiswa}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

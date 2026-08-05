'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AttendanceGridProps {
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  onChange: (field: 'hadir' | 'izin' | 'sakit' | 'alpha', value: number) => void;
}

const fields = [
  { key: 'hadir' as const, label: 'Hadir', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'izin' as const, label: 'Izin', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'sakit' as const, label: 'Sakit', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'alpha' as const, label: 'Alpha', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
];

export function AttendanceGrid({ hadir, izin, sakit, alpha, onChange }: AttendanceGridProps) {
  const values = { hadir, izin, sakit, alpha };

  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-medium text-gray-700">Kehadiran</Label>
      <div className="grid grid-cols-2 gap-2.5">
        {fields.map((field) => (
          <div
            key={field.key}
            className={`${field.bg} ${field.border} border rounded-lg p-2.5 flex items-center justify-between`}
          >
            <span className={`text-xs font-semibold ${field.color}`}>{field.label}</span>
            <Input
              type="number"
              min={0}
              value={values[field.key]}
              onChange={(e) => onChange(field.key, parseInt(e.target.value) || 0)}
              className={`w-16 h-8 text-center text-sm font-bold bg-white border-0 rounded-md shadow-sm ${field.color}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

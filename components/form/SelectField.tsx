'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SelectFieldProps {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function SelectField({ label, placeholder, options, value, onChange }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-medium text-gray-700">{label}</Label>
      <Select value={value} onValueChange={(v) => { if (v !== null) onChange(v); }}>
        <SelectTrigger className="h-11 rounded-lg border-gray-200 bg-gray-50/50 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

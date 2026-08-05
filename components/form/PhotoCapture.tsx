'use client';

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Camera, X, Image as ImageIcon } from 'lucide-react';

interface PhotoCaptureProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function PhotoCapture({ value, onChange }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreview(result);
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-medium text-gray-700">Foto Kelas</Label>

      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt="Preview Foto Kelas"
            className="w-full h-48 object-cover"
          />
          <button
            onClick={removePhoto}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50/30 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Camera className="size-6" />
          </div>
          <span className="text-sm font-medium">Ambil Foto / Upload</span>
          <span className="text-xs text-gray-300">JPG, PNG • Maks 5MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

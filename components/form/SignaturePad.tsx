'use client';

import { useState, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Lock, Unlock, Eraser } from 'lucide-react';

interface SignaturePadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    return ctx;
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    if (isLocked) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || isLocked) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange(null);
  };

  const unlock = () => {
    setIsLocked(false);
    // Initialize canvas dimensions after unlock
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[13px] font-medium text-gray-700">Tanda Tangan</Label>
        {!isLocked && (
          <button
            onClick={clearSignature}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Eraser className="size-3.5" />
            Hapus
          </button>
        )}
      </div>
      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
        {isLocked ? (
          <button
            onClick={unlock}
            className="w-full h-32 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-red-500 hover:bg-red-50/50 transition-all"
          >
            <Lock className="size-6" />
            <span className="text-sm font-medium">Tap to unlock</span>
          </button>
        ) : (
          <>
            <div className="absolute top-2 left-2 z-10">
              <Unlock className="size-3.5 text-emerald-400" />
            </div>
            <canvas
              ref={canvasRef}
              className="w-full h-32 touch-none cursor-crosshair bg-white"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </>
        )}
      </div>
    </div>
  );
}

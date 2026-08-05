'use client';

import { ArrowLeft, Search, RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showSearch?: boolean;
  showRefresh?: boolean;
  showLogo?: boolean;
  onBack?: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
}

export function Header({
  title,
  showBack = false,
  showSearch = false,
  showRefresh = false,
  showLogo = false,
  onBack,
  onSearch,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="h-14 bg-red-600 flex items-center px-4 gap-3 shrink-0 z-40 shadow-md">
      {/* Left side */}
      {showBack && (
        <button
          onClick={onBack}
          className="text-white p-1.5 -ml-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="size-5" />
        </button>
      )}

      {showLogo && (
        <div className="size-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">SMK</span>
        </div>
      )}

      {/* Title */}
      <h1 className="text-white font-semibold text-lg flex-1 truncate">
        {title}
      </h1>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {showSearch && (
          <button
            onClick={onSearch}
            className="text-white p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Cari"
          >
            <Search className="size-5" />
          </button>
        )}
        {showRefresh && (
          <button
            onClick={onRefresh}
            className="text-white p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="size-5" />
          </button>
        )}
      </div>
    </header>
  );
}

'use client';

import { CalendarDays, ClipboardList, MapPin } from 'lucide-react';
import type { ActiveTab } from '@/lib/types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const tabs = [
  { id: 'riwayat' as ActiveTab, label: 'Riwayat', icon: CalendarDays },
  { id: 'isi-jurnal' as ActiveTab, label: 'Isi Jurnal', icon: ClipboardList },
  { id: 'map' as ActiveTab, label: 'Map', icon: MapPin },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="h-16 bg-white border-t border-gray-200 flex items-stretch shrink-0 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 relative ${
              isActive ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            aria-label={tab.label}
          >
            {/* Active indicator dot */}
            {isActive && (
              <div className="absolute top-1.5 w-1 h-1 rounded-full bg-red-600" />
            )}
            <Icon className={`size-5 mt-1 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
            <span className={`text-[11px] font-medium ${isActive ? 'font-semibold' : ''}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

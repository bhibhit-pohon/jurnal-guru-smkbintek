'use client';

import { Map, Satellite } from 'lucide-react';

interface MapTypeToggleProps {
  mapType: 'map' | 'satellite';
  onChange: (type: 'map' | 'satellite') => void;
}

export function MapTypeToggle({ mapType, onChange }: MapTypeToggleProps) {
  return (
    <div className="absolute top-3 left-3 z-[1000] flex rounded-lg overflow-hidden shadow-md border border-gray-200">
      <button
        onClick={() => onChange('map')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
          mapType === 'map'
            ? 'bg-white text-gray-900'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        <Map className="size-3.5" />
        Map
      </button>
      <button
        onClick={() => onChange('satellite')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${
          mapType === 'satellite'
            ? 'bg-white text-gray-900'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        <Satellite className="size-3.5" />
        Satellite
      </button>
    </div>
  );
}

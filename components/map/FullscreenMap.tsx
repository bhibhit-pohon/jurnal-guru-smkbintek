'use client';

import { useEffect, useState } from 'react';
import { MapTypeToggle } from './MapTypeToggle';
import type { JournalEntry } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface FullscreenMapProps {
  journals: JournalEntry[];
}

export function FullscreenMap({ journals }: FullscreenMapProps) {
  const [mapType, setMapType] = useState<'map' | 'satellite'>('map');
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([rl, L]) => {
      // Fix default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setMapComponents(rl);
      setLeaflet(L);
    });
  }, []);

  if (!MapComponents || !leaflet) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Loader2 className="size-8 animate-spin text-red-400" />
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = MapComponents;

  const journalsWithLocation = journals.filter((j) => j.lokasi !== null);
  const center: [number, number] = journalsWithLocation.length > 0
    ? [journalsWithLocation[0].lokasi!.latitude, journalsWithLocation[0].lokasi!.longitude]
    : [-6.2088, 106.8456]; // Default: Jakarta

  const tileUrl = mapType === 'satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttribution = mapType === 'satellite'
    ? 'Tiles &copy; Esri'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <div className="relative w-full h-full">
      <MapTypeToggle mapType={mapType} onChange={setMapType} />
      <MapContainer
        center={center}
        zoom={15}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />
        {journalsWithLocation.map((journal) => (
          <Marker
            key={journal.id}
            position={[journal.lokasi!.latitude, journal.lokasi!.longitude]}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <p className="font-semibold text-gray-900">{journal.mapel}</p>
                <p className="text-gray-500 text-xs mt-0.5">{journal.kelas} &middot; {journal.ruang}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(journal.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

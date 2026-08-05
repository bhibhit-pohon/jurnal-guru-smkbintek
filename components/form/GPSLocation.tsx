'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { GPSCoords } from '@/lib/types';

interface GPSLocationProps {
  value: GPSCoords | null;
  onChange: (coords: GPSCoords | null) => void;
}

export function GPSLocation({ value, onChange }: GPSLocationProps) {
  const { coords, error, loading } = useGeolocation();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (coords && !value) {
      onChange(coords);
    }
  }, [coords, value, onChange]);

  // Dynamic import for Leaflet (SSR-safe)
  useEffect(() => {
    setMapReady(true);
  }, []);

  const displayCoords = value || coords;

  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-medium text-gray-700">Lokasi GPS</Label>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
        {/* Coordinates display */}
        <div className="px-3 py-2.5 border-b border-gray-100">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="size-4 animate-spin" />
              <span>Mendapatkan lokasi...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="size-4" />
              <span>{error}</span>
            </div>
          ) : displayCoords ? (
            <div className="flex items-start gap-2">
              <MapPin className="size-4 text-red-500 mt-0.5 shrink-0" />
              <div className="text-sm space-y-0.5">
                <p className="text-gray-600">
                  <span className="text-gray-400 text-xs">Lat:</span>{' '}
                  <span className="font-mono font-medium">{displayCoords.latitude.toFixed(6)}</span>
                </p>
                <p className="text-gray-600">
                  <span className="text-gray-400 text-xs">Lng:</span>{' '}
                  <span className="font-mono font-medium">{displayCoords.longitude.toFixed(6)}</span>
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Mini Map */}
        <div className="h-40 bg-gray-200 relative">
          {mapReady && displayCoords ? (
            <MiniMap lat={displayCoords.latitude} lng={displayCoords.longitude} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <MapPin className="size-8 stroke-1" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Separate component for dynamic Leaflet import
function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } | null>(null);

  useEffect(() => {
    import('react-leaflet').then((mod) => {
      setMapComponents({
        MapContainer: mod.MapContainer,
        TileLayer: mod.TileLayer,
        Marker: mod.Marker,
      });
    });
    // Import leaflet CSS
    import('leaflet/dist/leaflet.css');
    // Fix default marker icon
    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    });
  }, []);

  if (!MapComponents) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker } = MapComponents;

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      className="w-full h-full z-0"
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} />
    </MapContainer>
  );
}

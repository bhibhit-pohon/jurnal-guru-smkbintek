'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Fix Leaflet default icon issue in Next.js/Webpack ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Custom school icon ── */
const schoolIcon = new L.DivIcon({
  className: 'custom-school-marker',
  html: `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    ">
      <div style="
        background: #005c55;
        color: white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      ">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1; font-size: 22px;">school</span>
      </div>
      <div style="
        margin-top: 4px;
        background: #f9f9f8;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        font-family: Inter, sans-serif;
        color: #1a1c1c;
        border: 1px solid rgba(189,201,198,0.2);
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      ">
        SMK Bina Teknologi
      </div>
    </div>
  `,
  iconSize: [140, 60],
  iconAnchor: [70, 20],
  popupAnchor: [0, -20],
});

/* ── User location blue dot icon ── */
const userLocationIcon = new L.DivIcon({
  className: 'custom-user-location',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="
        width: 24px;
        height: 24px;
        background: #005c55;
        border-radius: 50%;
        border: 4px solid #f9f9f8;
        box-shadow: 0 2px 8px rgba(0,92,85,0.4);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; background: #f9f9f8; border-radius: 50%;"></div>
      </div>
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        background: #005c55;
        border-radius: 50%;
        opacity: 0.3;
        animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

/* ── Component to fly to user location ── */
function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 17, { duration: 1.5 });
    }
  }, [position, map]);

  return null;
}

/* ── Props ── */
interface LeafletMapProps {
  center: [number, number];
  zoom: number;
}

export default function LeafletMap({ center, zoom }: LeafletMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  /* ── Get user geolocation on mount ── */
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  /* ── Handle "my location" FAB click via custom event ── */
  useEffect(() => {
    const handler = () => {
      if (userPosition) {
        setFlyTarget(userPosition);
      } else {
        // Re-request geolocation
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setUserPosition(newPos);
            setFlyTarget(newPos);
          },
          () => alert('Tidak dapat mengambil lokasi Anda.'),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    };

    window.addEventListener('fly-to-my-location', handler);
    return () => window.removeEventListener('fly-to-my-location', handler);
  }, [userPosition]);

  /* ── Inject global styles for leaflet markers ── */
  useEffect(() => {
    const styleId = 'leaflet-custom-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes ping {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        .custom-school-marker,
        .custom-user-location {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          z-index: 1;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      zoomControl={false}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* School Marker */}
      <Marker position={center} icon={schoolIcon}>
        <Popup>
          <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px' }}>
            <strong style={{ color: '#005c55', fontSize: '14px' }}>
              SMK Bina Teknologi Purwokerto
            </strong>
            <br />
            <span style={{ color: '#3e4947', fontSize: '12px' }}>
              Jl. S. Parman, Purwokerto
            </span>
          </div>
        </Popup>
      </Marker>

      {/* User Location Marker */}
      {userPosition && (
        <Marker position={userPosition} icon={userLocationIcon}>
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif' }}>
              <strong style={{ color: '#005c55' }}>Lokasi Anda</strong>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Fly to target */}
      <FlyToLocation position={flyTarget} />
    </MapContainer>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Loader2 } from 'lucide-react';

// Fix Leaflet default icon bug in React Vite apps
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Red Pertamina Pin Icon
const pertaminaIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper component to recenter map when lat/lng change from outside or GPS
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

// Helper component to handle click events on the map
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({ lat, lng, onChange, onLocationError }) {
  const [loadingGps, setLoadingGps] = useState(false);

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  // Default fallback position (Bitung City center) if lat/lng are invalid
  const position = useMemo(() => {
    const validLat = !isNaN(parsedLat) ? parsedLat : 1.4404;
    const validLng = !isNaN(parsedLng) ? parsedLng : 125.1217;
    return [validLat, validLng];
  }, [parsedLat, parsedLng]);

  const handleMarkerDrag = (e) => {
    const marker = e.target;
    if (marker != null) {
      const { lat: newLat, lng: newLng } = marker.getLatLng();
      onChange({ lat: newLat.toFixed(6), lng: newLng.toFixed(6) });
    }
  };

  const handleMapClick = (newLat, newLng) => {
    onChange({ lat: newLat.toFixed(6), lng: newLng.toFixed(6) });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      if (onLocationError) onLocationError('Browser Anda tidak mendukung fitur Geolocation GPS.');
      return;
    }

    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoadingGps(false);
        const currentLat = pos.coords.latitude.toFixed(6);
        const currentLng = pos.coords.longitude.toFixed(6);
        onChange({ lat: currentLat, lng: currentLng });
      },
      (err) => {
        setLoadingGps(false);
        let msg = 'Gagal mendapatkan lokasi saat ini.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Izin akses lokasi ditolak. Harap izinkan akses lokasi di browser Anda.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Informasi lokasi tidak tersedia saat ini.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Waktu permintaan lokasi habis.';
        }
        if (onLocationError) onLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-2">
      {/* Map Control Bar */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-pertamina-red" />
          Pilih Titik di Peta (Klik atau Geser Marker)
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loadingGps}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pertamina-blue/10 hover:bg-pertamina-blue/20 text-pertamina-blue dark:text-blue-400 text-xs font-semibold transition-all duration-200 disabled:opacity-50"
          title="Ambil koordinat posisi Anda saat ini"
        >
          {loadingGps ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{loadingGps ? 'Mencari Lokasi...' : 'Lokasi Saat Ini'}</span>
        </button>
      </div>

      {/* Interactive Leaflet Mini Map Container */}
      <div className="relative h-52 w-full rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-800">
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={position} />
          <MapClickHandler onClick={handleMapClick} />
          <Marker
            position={position}
            icon={pertaminaIcon}
            draggable={true}
            eventHandlers={{ dragend: handleMarkerDrag }}
          />
        </MapContainer>
        
        {/* Visual Help Banner */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] text-gray-600 dark:text-gray-300 font-medium shadow-sm border border-gray-200/50 dark:border-slate-700/50 pointer-events-none">
          📍 Klik peta atau tahan & geser pin merah
        </div>
      </div>
    </div>
  );
}

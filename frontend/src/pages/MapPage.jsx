import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { MapPin, Building2, AlertTriangle, CheckCircle, Star, Truck, Navigation, ShieldCheck, Activity } from 'lucide-react';

// Fix Leaflet default icon bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = createIcon('green');
const goldIcon = createIcon('gold');
const orangeIcon = createIcon('orange');
const redIcon = createIcon('red');
const greyIcon = createIcon('grey');
const blueIcon = createIcon('blue');

// Custom Truck DivIcon with pulsing blue aura
const truckDivIcon = L.divIcon({
  className: 'custom-truck-marker',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
      <div style="position: absolute; width: 36px; height: 36px; background-color: rgba(14, 165, 233, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; width: 30px; height: 30px; background: linear-gradient(135deg, #0284c7, #0369a1); border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export default function MapPage() {
  const toast = useToast();
  const [spbuMarkers, setSpbuMarkers] = useState([]);
  const [activeTrucks, setActiveTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'SPBU', 'TRUCK'

  useEffect(() => {
    // 1. Fetch SPBU markers
    const fetchSpbu = api.get('/spbu').then(res => {
      return res.data.data.map(spbu => ({
        id: spbu.id,
        name: spbu.name,
        address: spbu.address,
        code: spbu.code,
        lat: spbu.lat ? parseFloat(spbu.lat) : null,
        lng: spbu.lng ? parseFloat(spbu.lng) : null,
        hasComplaint: spbu.hasComplaint || false,
        averageRating: spbu.averageRating || 0,
      })).filter(spbu => spbu.lat !== null && spbu.lng !== null);
    });

    // 2. Fetch Active AMT Truck locations
    const fetchActiveTrucks = api.get('/location/active').then(res => {
      return res.data.data || [];
    }).catch(err => {
      console.warn('Failed to fetch active truck locations:', err);
      return [];
    });

    Promise.all([fetchSpbu, fetchActiveTrucks])
      .then(([spbuData, trucksData]) => {
        setSpbuMarkers(spbuData);
        setActiveTrucks(trucksData);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Gagal memuat data peta');
        setLoading(false);
      });

    // 3. Connect Socket.IO for real-time truck position updates
    const backendUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : `${window.location.protocol}//${window.location.hostname}:5002`;

    const socket = io(backendUrl, { transports: ['websocket', 'polling'], credentials: true });

    socket.on('connect', () => {
      socket.emit('join-dashboard');
    });

    socket.on('amt-location-update', (data) => {
      setActiveTrucks(prev => {
        const index = prev.findIndex(t => t.amt?.id === data.amtId || t.loId === data.loId);
        const updatedItem = {
          loId: data.loId,
          noLO: data.noLO || 'LO-IN-TRANSIT',
          amt: { id: data.amtId, name: data.amtName },
          truck: { nopol: data.truckNopol || 'Armada Tangki' },
          spbu: { name: data.spbuName || 'SPBU Tujuan', lat: data.spbuLat, lng: data.spbuLng },
          lat: data.lat,
          lng: data.lng,
          speed: data.speed,
          lastUpdate: data.recordedAt,
        };

        if (index >= 0) {
          const newArray = [...prev];
          newArray[index] = { ...newArray[index], ...updatedItem };
          return newArray;
        } else {
          return [...prev, updatedItem];
        }
      });
    });

    socket.on('lo-status-updated', (data) => {
      if (['DELIVERED', 'COMPLETED'].includes(data.status)) {
        setActiveTrucks(prev => prev.filter(t => t.loId !== data.loId));
      }
    });

    socket.on('spbu-rating-updated', (data) => {
      setSpbuMarkers(prev => prev.map(spbu => {
        if (spbu.id === data.spbuId) {
          return {
            ...spbu,
            averageRating: data.averageRating,
            hasComplaint: data.hasComplaint !== undefined ? data.hasComplaint : spbu.hasComplaint
          };
        }
        return spbu;
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  // Bitung coordinates as default center
  const position = [1.4404, 125.1217];

  return (
    <div className="space-y-4 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      {/* Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-pertamina-red" /> Peta Real-Time SPBU & Tracking AMT
          </h1>
          <p className="text-xs text-gray-500">
            Monitoring lokasi titik SPBU dan pergerakan armada Mobil Tangki (AMT) secara langsung.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterMode === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua ({spbuMarkers.length + activeTrucks.length})
          </button>
          <button
            onClick={() => setFilterMode('SPBU')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterMode === 'SPBU'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            SPBU ({spbuMarkers.length})
          </button>
          <button
            onClick={() => setFilterMode('TRUCK')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              filterMode === 'TRUCK'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Armada Tangki ({activeTrucks.length})
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-glass relative">
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
            url={`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
          />

          {/* Render SPBU Markers */}
          {(filterMode === 'ALL' || filterMode === 'SPBU') && spbuMarkers.map(m => {
            let icon = greyIcon;
            if (m.hasComplaint || (m.averageRating > 0 && m.averageRating < 2)) icon = redIcon;
            else if (m.averageRating >= 4) icon = greenIcon;
            else if (m.averageRating >= 3) icon = goldIcon;
            else if (m.averageRating >= 2) icon = orangeIcon;

            return (
              <Marker key={`spbu-${m.id}`} position={[m.lat, m.lng]} icon={icon}>
                <Popup>
                  <div className="p-1 space-y-2 text-slate-800 max-w-[250px]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Building2 className="w-4 h-4 text-pertamina-blue" />
                      <span>{m.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{m.address}</p>
                    <p className="text-xs text-gray-400">Kode: {m.code}</p>
                    
                    <div className="flex items-center gap-1 mt-2 mb-1">
                      <Star className={`w-3.5 h-3.5 ${m.averageRating > 0 ? 'text-yellow-400' : 'text-gray-300'} fill-current`} />
                      <span className="text-xs font-bold text-gray-700">
                        {m.averageRating > 0 ? m.averageRating.toFixed(1) : 'Belum ada rating'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      {m.hasComplaint ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Ada Keluhan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Normal
                        </span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Render Active AMT Truck Markers */}
          {(filterMode === 'ALL' || filterMode === 'TRUCK') && activeTrucks.map((truckItem, idx) => {
            if (!truckItem.lat || !truckItem.lng) return null;

            return (
              <Marker
                key={`truck-${truckItem.loId || idx}`}
                position={[parseFloat(truckItem.lat), parseFloat(truckItem.lng)]}
                icon={truckDivIcon}
              >
                <Popup>
                  <div className="p-1 space-y-2 text-slate-800 max-w-[260px]">
                    <div className="flex items-center justify-between gap-2 border-b pb-1.5 border-slate-100">
                      <div className="flex items-center gap-1.5 font-bold text-sky-700">
                        <Truck className="w-4 h-4 text-sky-600" />
                        <span>{truckItem.truck?.nopol || 'Mobil Tangki'}</span>
                      </div>
                      <span className="text-[10px] uppercase font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full animate-pulse">
                        In-Transit
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-slate-700"><b>AMT Driver:</b> {truckItem.amt?.name || 'Driver AMT'}</p>
                      <p className="text-slate-700"><b>No. LO:</b> {truckItem.noLO || '-'}</p>
                      <p className="text-slate-700"><b>Tujuan:</b> {truckItem.spbu?.name || 'SPBU Bitung'}</p>
                      {truckItem.speed !== undefined && (
                        <p className="text-slate-700 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-sky-600" />
                          <b>Kecepatan:</b> {truckItem.speed} km/jam
                        </p>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 border-t pt-1 flex items-center justify-between">
                      <span>Update: {truckItem.lastUpdate ? new Date(truckItem.lastUpdate).toLocaleTimeString('id-ID') : 'Baru saja'}</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Live GPS
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Building2, AlertTriangle, CheckCircle, Star } from 'lucide-react';

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

export default function MapPage() {
  const toast = useToast();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load SPBU data directly from database
    api.get('/spbu')
      .then(res => {
        const spbuData = res.data.data.map(spbu => ({
          id: spbu.id,
          name: spbu.name,
          address: spbu.address,
          code: spbu.code,
          lat: spbu.lat ? parseFloat(spbu.lat) : null,
          lng: spbu.lng ? parseFloat(spbu.lng) : null,
          hasComplaint: spbu.hasComplaint || false,
          averageRating: spbu.averageRating || 0,
        })).filter(spbu => spbu.lat !== null && spbu.lng !== null);
        
        setMarkers(spbuData);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Gagal memuat data peta');
        setLoading(false);
      });
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
    <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-6 h-6 text-pertamina-red" /> Peta Monitoring SPBU
        </h1>
        <p className="text-sm text-gray-500">
          Warna Titik: Hijau (4-5 Bintang), Kuning (3-4 Bintang), Oranye (2-3 Bintang), Merah (1-2 Bintang / Ada Keluhan), Abu-abu (Belum ada rating)
        </p>
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-glass">
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
            url={`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
          />
          {markers.map(m => {
            let icon = greyIcon;
            if (m.hasComplaint || (m.averageRating > 0 && m.averageRating < 2)) icon = redIcon;
            else if (m.averageRating >= 4) icon = greenIcon;
            else if (m.averageRating >= 3) icon = goldIcon;
            else if (m.averageRating >= 2) icon = orangeIcon;

            return (
              <Marker key={m.id} position={[m.lat, m.lng]} icon={icon}>
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
        </MapContainer>
      </div>
    </div>
  );
}

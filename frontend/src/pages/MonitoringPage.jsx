import { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import { Radio, Eye, AlertTriangle, Activity, Wifi, WifiOff } from 'lucide-react';

export default function MonitoringPage() {
  const toast = useToast();
  const [liveFeed, setLiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [streamFilter, setStreamFilter] = useState('ALL'); // ALL | HIGH_PRIORITY
  const socketRef = useRef(null);

  useEffect(() => {
    // Update current date every minute
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    // Load initial data (max 50)
    api.get('/feedback/live/feed').then(res => {
      setLiveFeed(res.data.data.slice(0, 50));
      setLoading(false);
    }).catch(() => setLoading(false));

    // Connect to Socket.IO
    const socketHost = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : window.location.hostname === 'localhost'
        ? 'http://localhost:5002'
        : window.location.origin;
    const socket = io(socketHost, {
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-dashboard');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new-feedback', (data) => {
      setLiveFeed(prev => [data, ...prev].slice(0, 50));
      toast.info(`📥 Feedback baru: ${data.noLO} — ${data.spbu}`);
    });

    socket.on('high-priority-alert', (data) => {
      toast.error(`⚠️ HIGH PRIORITY: ${data.noLO} — ${data.spbu}`);
    });

    return () => {
      socket.disconnect();
      clearInterval(dateInterval);
    };
  }, []);

  const filteredFeed = streamFilter === 'HIGH_PRIORITY' 
    ? liveFeed.filter(f => f.status === 'HIGH_PRIORITY')
    : liveFeed;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-pertamina-red" /> Live Monitoring
          </h1>
          <p className="text-sm text-gray-500">Real-time stream feedback penerimaan BBM dari SPBU</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/feedback-history"
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
            title="Buka Riwayat Lengkap"
          >
            <Eye className="w-3.5 h-3.5" /> Lihat Riwayat Lengkap
          </a>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            connected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700'
          }`}>
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? `Connected - ${currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Stream Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-100 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStreamFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              streamFilter === 'ALL'
                ? 'bg-pertamina-red text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-750'
            }`}
          >
            ⚡ Semua Live Stream ({liveFeed.length})
          </button>
          <button
            type="button"
            onClick={() => setStreamFilter('HIGH_PRIORITY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
              streamFilter === 'HIGH_PRIORITY'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Hanya Kritis / Alert ({liveFeed.filter(f => f.status === 'HIGH_PRIORITY').length})
          </button>
        </div>
      </div>

      {/* Live Feed Table */}
      <div className="table-container bg-white dark:bg-slate-900">
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>SPBU</th>
              <th>Produk</th>
              <th>No. LO</th>
              <th>Nopol</th>
              <th>AMT</th>
              <th>Rating</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12"><div className="spinner mx-auto" /></td></tr>
            ) : filteredFeed.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12">
                <Radio className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Tidak ada stream feedback dalam filter ini...</p>
              </td></tr>
            ) : (() => {
              // Group by date
              const groupedByDate = filteredFeed.reduce((groups, fb) => {
                const dateKey = fb.submittedAt 
                  ? new Date(fb.submittedAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Unknown';
                if (!groups[dateKey]) {
                  groups[dateKey] = [];
                }
                groups[dateKey].push(fb);
                return groups;
              }, {});

              return Object.entries(groupedByDate).map(([date, items], dateIndex) => (
                <>
                  {dateIndex > 0 && (
                    <tr key={`date-${date}`}>
                      <td colSpan={8} className="py-3 px-5 bg-slate-50 dark:bg-slate-800/50 font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {date}
                      </td>
                    </tr>
                  )}
                  {items.map((fb, i) => {
                    const globalIndex = filteredFeed.findIndex(item => item.id === fb.id);
                    return (
                      <tr key={fb.id || `${date}-${i}`} className={globalIndex === 0 ? 'bg-yellow-50/50 dark:bg-yellow-950/10' : ''}>
                        <td className="whitespace-nowrap text-xs">
                          {fb.submittedAt ? new Date(fb.submittedAt).toLocaleString('id-ID', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit',
                            hour12: false 
                          }) : '-'}
                        </td>
                        <td className="font-medium">{fb.lo?.spbu?.name || fb.spbu || '-'}</td>
                        <td>{fb.lo?.product || fb.product || '-'}</td>
                        <td className="font-semibold text-gray-900 dark:text-white">{fb.lo?.noLO || fb.noLO || '-'}</td>
                        <td>{fb.lo?.truck?.nopol || '-'}</td>
                        <td>{fb.lo?.amt?.name || '-'}</td>
                        <td>{'⭐'.repeat(fb.rating || 0)}</td>
                        <td>
                          <span className={`badge ${
                            (fb.status || '') === 'HIGH_PRIORITY' ? 'badge-danger' : 'badge-success'
                          }`}>
                            {(fb.status || '') === 'HIGH_PRIORITY' ? (
                              <><AlertTriangle className="w-3 h-3 mr-1" />KRITIS</>
                            ) : 'NORMAL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

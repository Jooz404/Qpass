import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Bell, Check, Trash2, Mail, MailOpen } from 'lucide-react';

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications || []);
    } catch {
      toast.error('Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      toast.success('Notifikasi dibaca');
      fetchNotifications();
    } catch {
      toast.error('Gagal memperbarui status');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      toast.success('Semua notifikasi dibaca');
      fetchNotifications();
    } catch {
      toast.error('Gagal memperbarui status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-pertamina-red" /> Notifikasi Internal
          </h1>
          <p className="text-sm text-gray-500">Pemberitahuan insiden kritis dan laporan baru</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button onClick={handleMarkAllRead} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 flex justify-center"><div className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center border border-gray-100 dark:border-slate-800 text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            Tidak ada notifikasi baru
          </div>
        ) : notifications.map(n => (
          <div
            key={n.id}
            className={`p-4 rounded-xl border flex gap-4 transition-all ${
              n.isRead
                ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-850 opacity-70'
                : 'bg-red-50/40 dark:bg-red-950/10 border-red-100 dark:border-red-900/30'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              n.isRead ? 'bg-gray-100 dark:bg-slate-800 text-gray-400' : 'bg-red-100 dark:bg-red-900/30 text-red-500'
            }`}>
              {n.isRead ? <MailOpen className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h4 className={`text-sm ${n.isRead ? 'font-medium text-gray-600 dark:text-gray-400' : 'font-bold text-gray-900 dark:text-white'}`}>
                  {n.title}
                </h4>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleTimeString('id-ID')}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.message}</p>
            </div>
            {!n.isRead && (
              <button
                onClick={() => handleMarkAsRead(n.id)}
                className="p-1 rounded bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 self-center"
                title="Tandai sudah dibaca"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

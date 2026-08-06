import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Plus, Search, Edit3, Trash2, X, UserCheck, BarChart3, Star, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import ConfirmModal from '../components/ConfirmModal';

export default function AmtPage() {
  const toast = useToast();
  const [amts, setAmts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState(null);
  const [report, setReport] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, target: null, loading: false });

  const [form, setForm] = useState({
    name: '', phone: '', nip: ''
  });

  const fetchAmts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/amt', { params: { search } });
      setAmts(res.data.data);
    } catch (err) {
      console.error('Error fetching AMTs:', err);
      console.error('Error response:', err.response);
      toast.error(err.response?.data?.message || 'Gagal memuat data AMT');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAmts();
  }, [fetchAmts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/amt/${editId}`, { name: form.name, phone: form.phone, nip: form.nip });
        toast.success('AMT berhasil diperbarui');
      } else {
        const res = await api.post('/amt', { name: form.name, phone: form.phone, nip: form.nip });
        toast.success(`AMT berhasil ditambahkan dengan NIP: ${res.data.data.nip}`);
      }
      setShowCreate(false);
      setEditId(null);
      setForm({ name: '', phone: '', nip: '' });
      fetchAmts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data');
    }
  };

  const handleEdit = (a) => {
    setEditId(a.id);
    setForm({ name: a.name, phone: a.phone || '', nip: a.nip || '' });
    setShowCreate(true);
  };

  const handleDelete = (amtItem) => {
    setDeleteConfirm({ isOpen: true, target: amtItem, loading: false });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.target) return;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/amt/${deleteConfirm.target.id}`);
      toast.success('AMT dinonaktifkan');
      fetchAmts();
      setDeleteConfirm({ isOpen: false, target: null, loading: false });
    } catch (err) {
      toast.error('Gagal menonaktifkan AMT');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const showReportCard = async (id) => {
    try {
      const res = await api.get(`/amt/${id}/report`);
      setReport(res.data.data);
    } catch {
      toast.error('Gagal memuat rapor AMT');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <UserCheck className="w-6 h-6 text-pertamina-red flex-shrink-0" /> Rapor Awak Mobil Tangki (AMT)
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Kelola dan pantau kinerja skor AMT
          </p>
        </div>
        <button onClick={() => {
          setEditId(null);
          setForm({ name: '', phone: '', nip: '' });
          setShowCreate(true);
        }} className="btn-primary flex items-center gap-2 py-2 px-4 text-xs sm:text-sm font-bold shadow-md shadow-pertamina-blue/20 hover:shadow-lg hover:shadow-pertamina-blue/35 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Tambah AMT
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-10 py-2.5" placeholder="Cari nama atau NIP AMT..."
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center"><div className="spinner" /></div>
        ) : amts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">Tidak ada data AMT ditemukan</div>
        ) : amts.map(a => (
          <div key={a.id} className="glass-card p-5 border border-gray-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="px-2.5 py-1 rounded bg-pertamina-blue/10 text-pertamina-blue dark:bg-pertamina-blue/20 dark:text-blue-400 text-xs font-bold">
                  NIP: {a.nip}
                </span>
                <span className={`badge ${a.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {a.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 truncate">{a.name}</h3>
              <p className="text-xs text-gray-400 mb-3">{a.phone || '—'}</p>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>
                  <p className="text-[10px] text-gray-400">Total Pengiriman</p>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">{a._count?.loadingOrders || 0} Rit</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Rating Rata-rata</p>
                  <p className="font-semibold text-amber-500">⭐ {a.avgRating || '—'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-5 justify-end">
              <button onClick={() => showReportCard(a.id)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" /> Rapor Kinerja
              </button>
              <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-850 text-blue-500" title="Edit">
                <Edit3 className="w-4 h-4" />
              </button>
              {a.isActive && (
                <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-850 text-red-500" title="Nonaktifkan">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showCreate && (
        <Modal title={editId ? 'Edit AMT' : 'Tambah AMT Baru'} onClose={() => { setShowCreate(false); setEditId(null); }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">NIP Karyawan</label>
              <input 
                type="text" 
                value={form.nip} 
                onChange={e => setForm(f => ({ ...f, nip: e.target.value }))} 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-pertamina-blue focus:ring-4 focus:ring-pertamina-blue/10 outline-none transition-all duration-200" 
                required 
                placeholder="Contoh: AMT-202607-00001" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Lengkap</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-pertamina-blue focus:ring-4 focus:ring-pertamina-blue/10 outline-none transition-all duration-200" 
                required 
                placeholder="Supriyadi" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">No. Telepon / WhatsApp</label>
              <input 
                type="text" 
                value={form.phone} 
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-pertamina-blue focus:ring-4 focus:ring-pertamina-blue/10 outline-none transition-all duration-200" 
                placeholder="628123456789" 
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => { setShowCreate(false); setEditId(null); }} 
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pertamina-red to-pertamina-red-dark text-white font-semibold hover:shadow-lg hover:shadow-pertamina-red/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Rapor Kinerja Modal */}
      {report && (
        <Modal title={`Rapor AMT — ${report.amt?.name}`} onClose={() => setReport(null)}>
          <div className="space-y-5">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Ritase</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{report.stats?.totalDeliveries}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Skor Kinerja</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{report.stats?.avgRating ? (report.stats.avgRating * 20).toFixed(1) : 0}/100</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Rating Pelayanan</p>
                <p className="text-xl font-bold text-amber-500 mt-1 flex items-center justify-center gap-0.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {report.stats?.avgRating}
                </p>
              </div>
            </div>

            {/* Performance line chart */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-4 rounded-2xl h-48">
              <p className="text-xs font-semibold text-gray-500 mb-2">Tren Kepuasan Pelayanan (Bintang)</p>
              <Line
                data={{
                  labels: report.recentOrders?.filter(o => o.feedback).slice(0, 7).reverse().map((o, idx) => `Rit ${idx+1}`),
                  datasets: [{
                    label: 'Rating',
                    data: report.recentOrders?.filter(o => o.feedback).slice(0, 7).reverse().map(o => o.feedback.rating),
                    borderColor: '#E30613',
                    tension: 0.2,
                  }]
                }}
                options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 1, max: 5, ticks: { stepSize: 1 } } } }}
              />
            </div>

            {/* Recent Orders List */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Riwayat Pengantaran BBM</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {report.recentOrders?.slice(0, 5).map(o => (
                  <div key={o.id} className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/30 text-xs">
                    <div>
                      <p className="font-semibold">{o.noLO}</p>
                      <p className="text-gray-400">{o.spbu?.name} • {o.product}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{new Date(o.date).toLocaleDateString('id-ID')}</p>
                      <span className={`badge py-0.5 text-[9px] ${
                        o.feedback ? (o.feedback.status === 'HIGH_PRIORITY' ? 'badge-danger' : 'badge-success') : 'badge-warning'
                      }`}>
                        {o.feedback ? (o.feedback.status === 'HIGH_PRIORITY' ? 'KRITIS' : 'NORMAL') : 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modern Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, target: null, loading: false })}
        onConfirm={confirmDelete}
        title="Nonaktifkan Awak MT"
        message={deleteConfirm.target ? `Yakin ingin menonaktifkan Awak MT "${deleteConfirm.target.name}" (${deleteConfirm.target.nip || 'NIP -'})?` : 'Yakin menonaktifkan AMT ini?'}
        confirmText="Nonaktifkan"
        cancelText="Batal"
        type="danger"
        loading={deleteConfirm.loading}
      />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 rounded-t-3xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 pb-8 sm:pb-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

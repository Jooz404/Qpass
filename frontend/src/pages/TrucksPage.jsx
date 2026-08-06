import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Plus, Search, Edit3, Trash2, X, Truck, BarChart3, Star, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import ConfirmModal from '../components/ConfirmModal';

export default function TrucksPage() {
  const toast = useToast();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState(null);
  const [report, setReport] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, target: null, loading: false });

  const [form, setForm] = useState({
    nopol: '', capacity: '8000', type: 'Tangki'
  });

  const fetchTrucks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/trucks', { params: { search } });
      setTrucks(res.data.data);
    } catch {
      toast.error('Gagal memuat data Mobil Tangki');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/trucks/${editId}`, form);
        toast.success('Mobil Tangki berhasil diperbarui');
      } else {
        await api.post('/trucks', form);
        toast.success('Mobil Tangki berhasil ditambahkan');
      }
      setShowCreate(false);
      setEditId(null);
      setForm({ nopol: '', capacity: '8000', type: 'Tangki' });
      fetchTrucks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data');
    }
  };

  const handleEdit = (t) => {
    setEditId(t.id);
    setForm({ nopol: t.nopol, capacity: String(t.capacity), type: t.type });
    setShowCreate(true);
  };

  const handleDelete = (t) => {
    setDeleteConfirm({ isOpen: true, target: t, loading: false });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.target) return;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.delete(`/trucks/${deleteConfirm.target.id}`);
      toast.success(res.data.message || 'Mobil Tangki berhasil dihapus');
      fetchTrucks();
      setDeleteConfirm({ isOpen: false, target: null, loading: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus Mobil Tangki');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const showReportCard = async (id) => {
    try {
      const res = await api.get(`/trucks/${id}/report`);
      setReport(res.data.data);
    } catch {
      toast.error('Gagal memuat rapor Mobil Tangki');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-pertamina-red" /> Rapor Mobil Tangki
          </h1>
          <p className="text-sm text-gray-500">Kelola Mobil Tangki dan pantau kinerjanya</p>
        </div>
        <button onClick={() => { setEditId(null); setShowCreate(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Tambah Mobil Tangki
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-10 py-2.5" placeholder="Cari nomor polisi..."
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center"><div className="spinner" /></div>
        ) : trucks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">Tidak ada Mobil Tangki ditemukan</div>
        ) : trucks.map(t => (
          <div key={t.id} className="glass-card p-5 border border-gray-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="px-2.5 py-1 rounded bg-pertamina-red/10 text-pertamina-red dark:bg-pertamina-red/20 text-xs font-bold uppercase">
                  {t.type}
                </span>
                <span className={`badge ${t.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {t.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2 tracking-wide">{t.nopol}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Kapasitas: <span className="font-bold">{t.capacity.toLocaleString()} Liter</span></p>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-500">
                Total Distribusi: <span className="font-semibold text-gray-700 dark:text-gray-300">{t._count?.loadingOrders || 0} Pengiriman</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-5 justify-end">
              <button onClick={() => showReportCard(t.id)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" /> Rapor Kinerja
              </button>
              <button onClick={() => handleEdit(t)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-850 text-blue-500" title="Edit">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-850 text-red-500" title="Hapus">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showCreate && (
        <Modal title={editId ? 'Edit Mobil Tangki' : 'Tambah Mobil Tangki'} onClose={() => { setShowCreate(false); setEditId(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Polisi (Nopol)</label>
              <input type="text" value={form.nopol} onChange={e => setForm(f => ({ ...f, nopol: e.target.value.toUpperCase() }))} className="input-field mt-1" required placeholder="DB 8001 AA" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kapasitas (Liter)</label>
                <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="input-field mt-1" required placeholder="8000" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipe</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field mt-1">
                  <option value="Tangki">Tangki</option>
                  <option value="Semi Trailer">Semi Trailer</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setEditId(null); }} className="btn-secondary flex-1">Batal</button>
              <button type="submit" className="btn-primary flex-1">Simpan</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Rapor Kinerja Modal */}
      {report && (
        <Modal title={`Rapor Mobil Tangki — ${report.truck?.nopol}`} onClose={() => setReport(null)}>
          <div className="space-y-5">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Ritase</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{report.stats?.totalDeliveries}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Keluhan</p>
                <p className="text-xl font-bold text-red-500 mt-1">{report.stats?.totalComplaints}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl animate-fade-in">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Rata-rata Rating</p>
                <p className="text-xl font-bold text-amber-500 mt-1 flex items-center justify-center gap-0.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {report.stats?.avgRating}
                </p>
              </div>
            </div>

            {/* Performance line chart */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-4 rounded-2xl h-48">
              <p className="text-xs font-semibold text-gray-500 mb-2">Riwayat Rating Pengiriman Terbaru</p>
              <Line
                data={{
                  labels: report.recentOrders?.filter(o => o.feedback).slice(0, 7).reverse().map((o, idx) => `Rit ${idx+1}`),
                  datasets: [{
                    label: 'Rating',
                    data: report.recentOrders?.filter(o => o.feedback).slice(0, 7).reverse().map(o => o.feedback.rating),
                    borderColor: '#f59e0b',
                    tension: 0.2,
                  }]
                }}
                options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 1, max: 5, ticks: { stepSize: 1 } } } }}
              />
            </div>

            {/* Recent Orders List */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Aktivitas Distribusi Terbaru</p>
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
        title="Hapus Mobil Tangki"
        message={deleteConfirm.target ? `Apakah Anda yakin ingin menghapus Mobil Tangki dengan nopol "${deleteConfirm.target.nopol}"?` : 'Apakah Anda yakin ingin menghapus Mobil Tangki ini?'}
        confirmText="Hapus Mobil Tangki"
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
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 rounded-t-3xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-6 pb-8 sm:pb-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

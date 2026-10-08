import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Plus, Search, Edit3, Trash2, X, Truck, BarChart3, Star, AlertTriangle, ShieldCheck, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import ConfirmModal from '../components/ConfirmModal';

export default function TrucksPage() {
  const toast = useToast();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  
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

  // Client-side pagination logic for Trucks list
  const totalPages = Math.ceil(trucks.length / pageSize) || 1;
  const paginatedTrucks = trucks.slice((page - 1) * pageSize, page * pageSize);

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

      {/* Search & View Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10 py-2.5 text-xs sm:text-sm"
            placeholder="Cari nomor polisi atau tipe..."
          />
        </div>
        <div className="flex items-center gap-2">
          {/* View Switcher Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-pertamina-red shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Tampilan Kartu (Grid)"
            >
              <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-pertamina-red shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" /> <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>

          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="input-field py-2 text-xs w-auto"
          >
            <option value={12}>12 / Hal</option>
            <option value={24}>24 / Hal</option>
            <option value={48}>48 / Hal</option>
          </select>
        </div>
      </div>

      {/* Main Content: Grid vs Table */}
      {loading ? (
        <div className="py-12 flex justify-center"><div className="spinner" /></div>
      ) : paginatedTrucks.length === 0 ? (
        <div className="py-12 text-center text-gray-500">Tidak ada Mobil Tangki ditemukan</div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTrucks.map(t => (
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
      ) : (
        /* Table View */
        <div className="table-container bg-white dark:bg-slate-900">
          <table>
            <thead>
              <tr>
                <th>Nomor Polisi</th>
                <th>Tipe Kendaraan</th>
                <th>Kapasitas</th>
                <th>Total Pengiriman</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrucks.map(t => (
                <tr key={t.id}>
                  <td className="font-bold text-gray-900 dark:text-white">{t.nopol}</td>
                  <td><span className="badge badge-info">{t.type}</span></td>
                  <td><span className="font-semibold">{t.capacity.toLocaleString()} L</span> ({t.capacity / 1000} KL)</td>
                  <td>{t._count?.loadingOrders || 0} Rit</td>
                  <td>
                    <span className={`badge ${t.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {t.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => showReportCard(t.id)} className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5" /> Rapor
                      </button>
                      <button onClick={() => handleEdit(t)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-500" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-red-500" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {!loading && trucks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1 text-xs text-gray-500">
          <div>
            Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{((page - 1) * pageSize) + 1}</span> - <span className="font-semibold text-gray-900 dark:text-white">{Math.min(page * pageSize, trucks.length)}</span> dari <span className="font-semibold text-gray-900 dark:text-white">{trucks.length}</span> armada Mobil Tangki
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1 px-2 font-medium text-gray-700 dark:text-gray-300">
              Halaman <span className="font-bold text-pertamina-red dark:text-red-400">{page}</span> dari <span className="font-bold">{totalPages}</span>
            </div>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showCreate && (
        <Modal title={editId ? 'Edit Mobil Tangki' : 'Tambah Mobil Tangki'} onClose={() => { setShowCreate(false); setEditId(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Polisi (Nopol)</label>
              <input type="text" value={form.nopol} onChange={e => setForm(f => ({ ...f, nopol: e.target.value.toUpperCase() }))} className="input-field mt-1" required placeholder="DB 8001 AA" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipe Kendaraan</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field mt-1">
                  <option value="Tangki">Tangki</option>
                  <option value="Semi Trailer">Semi Trailer</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kapasitas (Liter)</label>
                  <span className="text-xs font-semibold text-pertamina-red dark:text-red-400">
                    {form.capacity ? `${(Number(form.capacity)/1000).toLocaleString('id-ID')} KL` : ''}
                  </span>
                </div>
                <input 
                  type="number" 
                  value={form.capacity} 
                  onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} 
                  className="input-field" 
                  required 
                  placeholder="Contoh: 8000" 
                  step="1000"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Pilih Kapasitas Standar (Quick Select):</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '8.000 L', kl: '8 KL', komp: '1 Komp', val: '8000' },
                  { label: '16.000 L', kl: '16 KL', komp: '2 Komp', val: '16000' },
                  { label: '24.000 L', kl: '24 KL', komp: '3 Komp', val: '24000' },
                ].map((preset) => {
                  const isSelected = String(form.capacity) === preset.val;
                  return (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, capacity: preset.val }))}
                      className={`p-2.5 rounded-xl text-left border transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-pertamina-red/10 border-pertamina-red text-pertamina-red dark:bg-pertamina-red/20 dark:border-red-500 dark:text-red-400 ring-2 ring-pertamina-red/20 font-bold'
                          : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold">{preset.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isSelected ? 'bg-pertamina-red text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {preset.kl}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-75 mt-1">{preset.komp}</span>
                    </button>
                  );
                })}
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

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Plus, Search, Edit3, Trash2, X, Building2, MapPin } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import LocationPickerMap from '../components/LocationPickerMap';

export default function SpbuPage() {
  const toast = useToast();
  const [spbus, setSpbus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, target: null, loading: false });
  const [activeConfirm, setActiveConfirm] = useState({ isOpen: false, target: null, loading: false });
  
  const [form, setForm] = useState({
    name: '', code: '', address: '', city: 'Bitung', region: 'Sulawesi Utara', lat: '1.4404', lng: '125.1217', phone: '', ownerName: ''
  });

  const fetchSpbu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/spbu', { params: { search } });
      setSpbus(res.data.data);
    } catch {
      toast.error('Gagal memuat data SPBU');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSpbu();
  }, [fetchSpbu]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/spbu/${editId}`, form);
        toast.success('SPBU berhasil diperbarui');
      } else {
        await api.post('/spbu', form);
        toast.success('SPBU berhasil ditambahkan');
      }
      setShowCreate(false);
      setEditId(null);
      setForm({ name: '', code: '', address: '', city: 'Bitung', region: 'Sulawesi Utara', lat: '1.4404', lng: '125.1217', phone: '', ownerName: '' });
      fetchSpbu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data');
    }
  };

  const handleEdit = (s) => {
    setEditId(s.id);
    setForm({
      name: s.name, code: s.code, address: s.address, city: s.city, region: s.region,
      lat: String(s.lat), lng: String(s.lng), phone: s.phone || '', ownerName: s.ownerName || ''
    });
    setShowCreate(true);
  };

  const handleToggleActive = (s) => {
    setActiveConfirm({ isOpen: true, target: s, loading: false });
  };

  const confirmToggleActive = async () => {
    if (!activeConfirm.target) return;
    const s = activeConfirm.target;
    const actionText = s.isActive ? 'menonaktifkan' : 'mengaktifkan';
    setActiveConfirm(prev => ({ ...prev, loading: true }));
    try {
      await api.put(`/spbu/${s.id}`, { name: s.name, code: s.code, address: s.address, isActive: !s.isActive });
      toast.success(`SPBU berhasil di${s.isActive ? 'nonaktifkan' : 'aktifkan'}`);
      fetchSpbu();
      setActiveConfirm({ isOpen: false, target: null, loading: false });
    } catch {
      toast.error(`Gagal ${actionText} SPBU`);
      setActiveConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const handlePermanentDelete = (s) => {
    setDeleteConfirm({ isOpen: true, target: s, loading: false });
  };

  const confirmPermanentDelete = async () => {
    if (!deleteConfirm.target) return;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/spbu/${deleteConfirm.target.id}/permanent`);
      toast.success('SPBU berhasil dihapus secara permanen');
      fetchSpbu();
      setDeleteConfirm({ isOpen: false, target: null, loading: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus SPBU');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-pertamina-red" /> Kelola SPBU
          </h1>
          <p className="text-sm text-gray-500">Daftar SPBU penerima pasokan BBM</p>
        </div>
        <button onClick={() => { setEditId(null); setShowCreate(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Tambah SPBU
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-10 py-2.5" placeholder="Cari nama, kode SPBU, alamat..."
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center"><div className="spinner" /></div>
        ) : spbus.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">Tidak ada data SPBU ditemukan</div>
        ) : spbus.map(s => (
          <div key={s.id} className="glass-card p-5 border border-gray-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="px-2.5 py-1 rounded bg-pertamina-blue/10 text-pertamina-blue dark:bg-pertamina-blue/20 dark:text-blue-400 text-xs font-bold">
                  Kode: {s.code}
                </span>
                <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {s.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 truncate">{s.name}</h3>
              <p className="text-xs text-gray-400 mb-3">{s.ownerName || 'PT Pertamina'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 min-h-[40px]">{s.address}</p>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-500">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Telepon</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{s.phone || '—'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-5 justify-end">
              <button onClick={() => handleEdit(s)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              {s.isActive ? (
                <button onClick={() => handleToggleActive(s)} className="py-1.5 px-3 text-xs font-semibold rounded-xl text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 border border-transparent flex items-center gap-1">
                  Nonaktifkan
                </button>
              ) : (
                <button onClick={() => handleToggleActive(s)} className="py-1.5 px-3 text-xs font-semibold rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-transparent flex items-center gap-1">
                  Aktifkan
                </button>
              )}
              <button onClick={() => handlePermanentDelete(s)} className="py-1.5 px-3 text-xs font-semibold rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-200 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title={editId ? 'Edit SPBU' : 'Tambah SPBU Baru'} onClose={() => { setShowCreate(false); setEditId(null); }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identitas SPBU */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pertamina-red to-pertamina-red-dark flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Identitas SPBU</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Nama SPBU</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field mt-1 transition-all duration-200 focus:ring-2 focus:ring-pertamina-red/20" required placeholder="SPBU 74.951.01" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Kode SPBU</label>
                  <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="input-field mt-1 transition-all duration-200 focus:ring-2 focus:ring-pertamina-red/20" required placeholder="74.951.01" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Pemilik / Owner</label>
                <input type="text" value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} className="input-field mt-1 transition-all duration-200 focus:ring-2 focus:ring-pertamina-red/20" placeholder="PT Pertamina Retail" />
              </div>
            </div>

            {/* Lokasi & Kontak */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pertamina-blue to-blue-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Lokasi & Kontak</h4>
              </div>

              {/* Mini Map Location Picker */}
              <LocationPickerMap
                lat={form.lat}
                lng={form.lng}
                onChange={({ lat, lng }) => setForm(f => ({ ...f, lat, lng }))}
                onLocationError={(msg) => toast.error(msg)}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Latitude (Garis Lintang)</label>
                  <input type="text" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} className="input-field mt-1 transition-all duration-200 focus:ring-2 focus:ring-pertamina-blue/20" required placeholder="1.4404" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Longitude (Garis Bujur)</label>
                  <input type="text" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} className="input-field mt-1 transition-all duration-200 focus:ring-2 focus:ring-pertamina-blue/20" required placeholder="125.1217" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Alamat Lengkap</label>
                <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-field mt-1 min-h-[70px] resize-none transition-all duration-200 focus:ring-2 focus:ring-pertamina-red/20" required placeholder="Jl. Sam Ratulangi No.1, Bitung" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">No. Telepon</label>
                <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field mt-1 transition-all duration-200 focus:ring-2 focus:ring-pertamina-red/20" placeholder="0438-21001" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditId(null); }} className="btn-secondary flex-1 py-3 font-semibold transition-all duration-200 hover:scale-[1.02]">Batal</button>
              <button type="submit" className="btn-primary flex-1 py-3 font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">Simpan</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modern Confirmation Modals */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, target: null, loading: false })}
        onConfirm={confirmPermanentDelete}
        title="Hapus SPBU Permanen"
        message={deleteConfirm.target ? `Yakin ingin menghapus SPBU "${deleteConfirm.target.name}" secara permanen? Data yang terkait akan ikut terhapus.` : ''}
        confirmText="Hapus Permanen"
        cancelText="Batal"
        type="danger"
        loading={deleteConfirm.loading}
      />

      <ConfirmModal
        isOpen={activeConfirm.isOpen}
        onClose={() => setActiveConfirm({ isOpen: false, target: null, loading: false })}
        onConfirm={confirmToggleActive}
        title={activeConfirm.target?.isActive ? 'Nonaktifkan SPBU' : 'Aktifkan SPBU'}
        message={activeConfirm.target ? `Yakin ingin ${activeConfirm.target.isActive ? 'menonaktifkan' : 'mengaktifkan'} SPBU "${activeConfirm.target.name}"?` : ''}
        confirmText={activeConfirm.target?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        cancelText="Batal"
        type={activeConfirm.target?.isActive ? 'danger' : 'warning'}
        loading={activeConfirm.loading}
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

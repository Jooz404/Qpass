import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Plus, Search, Edit3, Trash2, X, Users, Shield, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function UsersPage() {
  const toast = useToast();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  
  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '', loading: false });

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'PENGAWAS', nip: ''
  });
  const [nipLookup, setNipLookup] = useState({ loading: false, amt: null, error: null });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { search } });
      setUsersList(res.data.data);
    } catch {
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/users/stats');
      console.log('Stats response:', res.data);
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      console.error('Error response:', err.response?.data);
      // Don't show toast error for stats, just log it
      // Stats are optional, page should still work without them
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate NIP for AMT
    if (form.role === 'AMT' && !editId) {
      if (!form.nip || !form.nip.trim()) {
        toast.error('NIP wajib diisi untuk akun AMT');
        return;
      }
      if (!nipLookup.amt) {
        toast.error('NIP tidak valid atau belum diverifikasi');
        return;
      }
    }
    try {
      if (editId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        delete payload.nip;
        await api.put(`/users/${editId}`, payload);
        toast.success('Pengguna berhasil diperbarui');
      } else {
        await api.post('/users', form);
        toast.success('Pengguna berhasil dibuat');
      }
      setShowCreate(false);
      setEditId(null);
      setForm({ name: '', email: '', password: '', role: 'PENGAWAS', nip: '' });
      setNipLookup({ loading: false, amt: null, error: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleNipChange = async (nip) => {
    setForm(f => ({ ...f, nip }));
    if (!nip || nip.length < 6) {
      setNipLookup({ loading: false, amt: null, error: null });
      return;
    }
    setNipLookup({ loading: true, amt: null, error: null });
    try {
      const res = await api.get(`/amt/by-nip/${nip.trim()}`);
      setNipLookup({ loading: false, amt: res.data.data, error: null });
    } catch (err) {
      setNipLookup({ loading: false, amt: null, error: err.response?.data?.message || 'NIP tidak ditemukan' });
    }
  };

  const handleEdit = (u) => {
    setEditId(u.id);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, nip: '' });
    setNipLookup({ loading: false, amt: null, error: null });
    setShowCreate(true);
  };

  const handleDelete = (user) => {
    setDeleteConfirm({ isOpen: true, id: user.id, name: user.name, loading: false });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/users/${deleteConfirm.id}`);
      toast.success('Pengguna berhasil dihapus');
      fetchUsers();
      setDeleteConfirm({ isOpen: false, id: null, name: '', loading: false });
    } catch (err) {
      toast.error('Gagal menghapus pengguna');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-pertamina-red" /> Kelola Pengguna
          </h1>
          <p className="text-sm text-gray-500">Kelola kredensial Admin dan Pengawas IT</p>
        </div>
        <button onClick={() => { setEditId(null); setShowCreate(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Tambah Pengguna
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Pengguna</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalUsers || 0}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pengguna Aktif</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeUsers || 0}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pengguna Nonaktif</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.inactiveUsers || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-10 py-2.5" placeholder="Cari nama atau email..."
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center"><div className="spinner" /></div>
        ) : usersList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">Tidak ada pengguna ditemukan</div>
        ) : usersList.map(u => (
          <div key={u.id} className="glass-card p-5 border border-gray-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className={`badge ${
                  u.role === 'ADMIN' ? 'badge-danger' : 'badge-info'
                } flex items-center gap-1`}>
                  <Shield className="w-3 h-3" /> {u.role}
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{u.name}</h3>
              <p className="text-sm text-gray-500 truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-2 mt-5 justify-end">
              <button onClick={() => handleEdit(u)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-850 text-red-500" title="Hapus">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showCreate && (
        <Modal title={editId ? 'Edit Pengguna' : 'Tambah Pengguna'} onClose={() => { setShowCreate(false); setEditId(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field mt-1" required placeholder="Nama Lengkap" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field mt-1" required placeholder="email@pertamina.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password {editId && '(kosongkan jika tidak ingin diubah)'}</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field mt-1" required={!editId} placeholder="••••••••" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select value={form.role} onChange={e => {
                setForm(f => ({ ...f, role: e.target.value, nip: '' }));
                setNipLookup({ loading: false, amt: null, error: null });
              }} className="input-field mt-1">
                <option value="PENGAWAS">Pengawas IT</option>
                <option value="ADMIN">Admin</option>
                <option value="AMT">Awak MT (AMT)</option>
              </select>
            </div>
            {/* NIP field only for AMT role on create */}
            {form.role === 'AMT' && !editId && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  NIP AMT <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={form.nip}
                    onChange={e => handleNipChange(e.target.value)}
                    className="input-field pr-10"
                    required
                    placeholder="Contoh: AMT-202507-00001"
                  />
                  {nipLookup.loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                  )}
                </div>
                {nipLookup.amt && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{nipLookup.amt.name}</p>
                      <p className="text-[10px] text-emerald-600/70">AMT ditemukan & siap ditautkan</p>
                    </div>
                  </div>
                )}
                {nipLookup.error && (
                  <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600">{nipLookup.error}</p>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">Masukkan NIP yang terdaftar di data Awak MT</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setEditId(null); }} className="btn-secondary flex-1">Batal</button>
              <button type="submit" className="btn-primary flex-1">Simpan</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modern Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '', loading: false })}
        onConfirm={confirmDelete}
        title="Hapus Pengguna"
        message={deleteConfirm.name ? `Apakah Anda yakin ingin menghapus pengguna "${deleteConfirm.name}"?` : 'Apakah Anda yakin ingin menghapus pengguna ini?'}
        confirmText="Hapus Pengguna"
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

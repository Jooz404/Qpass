import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  Plus, Search, QrCode, Eye, Edit3, Trash2, Download, RefreshCw,
  ChevronLeft, ChevronRight, X, Calendar, Filter,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function LoadingOrdersPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, target: null, loading: false });
  const [generateConfirm, setGenerateConfirm] = useState({ isOpen: false, targetDate: '', loading: false });

  // Dropdown data
  const [spbus, setSpbus] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [amts, setAmts] = useState([]);

  // Form state
  const [form, setForm] = useState({
    noLO: '', product: 'Pertalite', volume: '8000', spbuId: '', truckId: '', amtId: '', secondaryAmtId: '', date: new Date().toISOString().slice(0, 10),
  });
  const [editId, setEditId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const res = await api.get('/lo', { params });
      setOrders(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [pagination.page, search, statusFilter, dateFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    Promise.all([
      api.get('/spbu'), api.get('/trucks'), api.get('/amt'),
    ]).then(([s, t, a]) => {
      setSpbus(s.data.data);
      setTrucks(t.data.data);
      setAmts(a.data.data);
    });
  }, []);

  const generateLONumber = () => {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    setForm(prev => ({ ...prev, noLO: `LO-${dateStr}-${rand}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/lo/${editId}`, form);
        toast.success('Loading Order berhasil diperbarui');
      } else {
        await api.post('/lo', form);
        toast.success('Loading Order berhasil dibuat');
      }
      setShowCreate(false);
      setEditId(null);
      setForm({ noLO: '', product: 'Pertalite', volume: '8000', spbuId: '', truckId: '', amtId: '', secondaryAmtId: '', date: new Date().toISOString().slice(0, 10) });
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleDelete = (lo) => {
    setDeleteConfirm({ isOpen: true, target: lo, loading: false });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.target) return;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/lo/${deleteConfirm.target.id}`);
      toast.success('Loading Order berhasil dihapus');
      fetchOrders();
      setDeleteConfirm({ isOpen: false, target: null, loading: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const handleEdit = (lo) => {
    setEditId(lo.id);
    setForm({
      noLO: lo.noLO, product: lo.product, volume: String(lo.volume),
      spbuId: String(lo.spbuId), truckId: String(lo.truckId), amtId: String(lo.amtId), secondaryAmtId: lo.secondaryAmtId ? String(lo.secondaryAmtId) : '',
      date: new Date(lo.date).toISOString().slice(0, 10),
    });
    setShowCreate(true);
  };

  const handleGenerateDaily = () => {
    const targetDate = new Date().toISOString().slice(0, 10);
    setGenerateConfirm({ isOpen: true, targetDate, loading: false });
  };

  const confirmGenerateDaily = async () => {
    if (!generateConfirm.targetDate) return;
    const parsedDate = new Date(generateConfirm.targetDate);
    if (Number.isNaN(parsedDate.getTime())) {
      toast.error('Format tanggal tidak valid');
      return;
    }

    setGenerateConfirm(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.post('/lo/generate-daily', { date: parsedDate.toISOString() });
      toast.success(res.data.message);
      setDateFilter(generateConfirm.targetDate);
      fetchOrders();
      setGenerateConfirm({ isOpen: false, targetDate: '', loading: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal generate LO');
      setGenerateConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const products = ['Pertalite', 'Pertamax', 'Pertamax Turbo', 'Dexlite', 'Pertamina Dex'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loading Orders</h1>
          <p className="text-sm text-gray-500">Kelola Loading Order dan QR Code</p>
        </div>
        {user?.role !== 'PENGAWAS' && (
          <div className="flex gap-2">
            <button onClick={handleGenerateDaily} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Generate Harian
            </button>
            <button onClick={() => { setEditId(null); generateLONumber(); setShowCreate(true); }} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Buat LO
            </button>
          </div>
        )}
      </div>

      {/* Status Quick Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
        {[
          { label: 'Semua Status', value: '' },
          { label: '⏳ PENDING', value: 'PENDING' },
          { label: '🚚 IN TRANSIT', value: 'IN_TRANSIT' },
          { label: '📍 DELIVERED', value: 'DELIVERED' },
          { label: '✅ COMPLETED', value: 'COMPLETED' },
        ].map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => { setStatusFilter(tab.value); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-pertamina-red text-white border-pertamina-red shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Date Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="input-field pl-10 py-2.5 text-xs sm:text-sm"
            placeholder="Cari No. LO, produk, SPBU..."
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="input-field py-2 text-xs"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => { setDateFilter(''); setPagination(p => ({ ...p, page: 1 })); }}
                className="btn-secondary py-2 px-2 text-xs text-gray-500 hover:text-red-500"
                title="Tampilkan Semua Tanggal"
              >
                Semua
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto sm:ml-2">
            <span>Per hal:</span>
            <select
              value={pagination.limit || 15}
              onChange={e => setPagination(p => ({ ...p, limit: Number(e.target.value), page: 1 }))}
              className="input-field py-1.5 text-xs w-auto"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container bg-white dark:bg-slate-900">
        <table>
          <thead>
            <tr>
              <th>No. LO</th>
              <th>Produk</th>
              <th>Volume</th>
              <th>SPBU</th>
              <th>Nopol</th>
              <th>AMT</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th>Feedback</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-12"><div className="spinner mx-auto" /></td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-gray-500">Tidak ada data Loading Order</td></tr>
            ) : orders.map(lo => (
              <tr key={lo.id}>
                <td className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{lo.noLO}</td>
                <td>{lo.product}</td>
                <td>{lo.volume?.toLocaleString()} L</td>
                <td className="max-w-[150px] truncate">{lo.spbu?.name}</td>
                <td>{lo.truck?.nopol}</td>
                <td className="max-w-[180px]">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">{lo.amt?.name || '—'}</div>
                    {lo.secondaryAmt?.name && <div className="text-xs text-gray-500">+ {lo.secondaryAmt.name}</div>}
                  </div>
                </td>
                <td className="whitespace-nowrap">{new Date(lo.date).toLocaleDateString('id-ID')}</td>
                <td>
                  <span className={`badge ${
                    lo.status === 'COMPLETED' ? 'badge-success' :
                    lo.status === 'PENDING' ? 'badge-warning' : 'badge-info'
                  }`}>{lo.status}</span>
                </td>
                <td>
                  {lo.feedback ? (
                    <span className={`badge ${lo.feedback.status === 'HIGH_PRIORITY' ? 'badge-danger' : 'badge-success'}`}>
                      {lo.feedback.status === 'HIGH_PRIORITY' ? '⚠ KRITIS' : `⭐ ${lo.feedback.rating}`}
                    </span>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setShowQR(lo)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500" title="QR Code">
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowDetail(lo)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500" title="Detail">
                      <Eye className="w-4 h-4" />
                    </button>
                    {user?.role !== 'PENGAWAS' && (
                      <>
                        <button onClick={() => handleEdit(lo)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-500" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {!lo.feedback && (
                          <button onClick={() => handleDelete(lo)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-red-500" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {!loading && pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1 text-xs text-gray-500">
          <div>
            Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{((pagination.page - 1) * pagination.limit) + 1}</span> - <span className="font-semibold text-gray-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari <span className="font-semibold text-gray-900 dark:text-white">{pagination.total}</span> data LO
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1 px-2 font-medium text-gray-700 dark:text-gray-300">
              Halaman <span className="font-bold text-pertamina-red dark:text-red-400">{pagination.page}</span> dari <span className="font-bold">{pagination.totalPages || 1}</span>
            </div>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <Modal title={editId ? 'Edit Loading Order' : 'Buat Loading Order'} onClose={() => { setShowCreate(false); setEditId(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nomor LO</label>
              <div className="flex gap-2 mt-1">
                <input type="text" value={form.noLO} onChange={e => setForm(f => ({ ...f, noLO: e.target.value }))} className="input-field flex-1" required />
                <button type="button" onClick={generateLONumber} className="btn-secondary text-xs whitespace-nowrap">Generate</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Produk</label>
                <select value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} className="input-field mt-1">
                  {products.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Volume (L)</label>
                <input type="number" value={form.volume} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} className="input-field mt-1" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SPBU Tujuan</label>
              <select value={form.spbuId} onChange={e => setForm(f => ({ ...f, spbuId: e.target.value }))} className="input-field mt-1" required>
                <option value="">Pilih SPBU</option>
                {spbus.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobil Tangki</label>
                <select value={form.truckId} onChange={e => setForm(f => ({ ...f, truckId: e.target.value }))} className="input-field mt-1" required>
                  <option value="">Pilih MT</option>
                  {trucks.map(t => <option key={t.id} value={t.id}>{t.nopol}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">AMT Utama</label>
                <select value={form.amtId} onChange={e => setForm(f => ({ ...f, amtId: e.target.value }))} className="input-field mt-1" required>
                  <option value="">Pilih AMT Utama</option>
                  {amts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">AMT Tambahan (Opsional)</label>
              <select value={form.secondaryAmtId} onChange={e => setForm(f => ({ ...f, secondaryAmtId: e.target.value }))} className="input-field mt-1">
                <option value="">Tidak ada AMT tambahan</option>
                {amts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field mt-1" required />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setEditId(null); }} className="btn-secondary flex-1">Batal</button>
              <button type="submit" className="btn-primary flex-1">{editId ? 'Simpan' : 'Buat LO & Generate QR'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <Modal title={`QR Code — ${showQR.noLO}`} onClose={() => setShowQR(null)}>
          <div className="text-center py-4">
            {showQR.qrCode ? (
              <>
                <img src={showQR.qrCode} alt="QR Code" className="w-64 h-64 mx-auto mb-4 rounded-xl" />
                <p className="text-sm text-gray-500 mb-4">Scan QR ini untuk membuka form feedback</p>
                <div className="flex gap-2 justify-center">
                  <a href={showQR.qrCode} download={`QR_${showQR.noLO}.png`} className="btn-primary flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4" /> Download QR
                  </a>
                </div>
              </>
            ) : (
              <p className="text-gray-500">QR Code belum tersedia</p>
            )}
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <Modal title={`Detail — ${showDetail.noLO}`} onClose={() => setShowDetail(null)}>
          <div className="space-y-3 text-sm">
            <DetailRow label="Nomor LO" value={showDetail.noLO} />
            <DetailRow label="Produk" value={showDetail.product} />
            <DetailRow label="Volume" value={`${showDetail.volume?.toLocaleString()} L`} />
            <DetailRow label="SPBU" value={showDetail.spbu?.name} />
            <DetailRow label="Nopol" value={showDetail.truck?.nopol} />
            <DetailRow label="AMT" value={showDetail.amt?.name ? `${showDetail.amt.name}${showDetail.secondaryAmt?.name ? ` / ${showDetail.secondaryAmt.name}` : ''}` : '-'} />
            <DetailRow label="Tanggal" value={new Date(showDetail.date).toLocaleDateString('id-ID')} />
            <DetailRow label="Status" value={showDetail.status} />
            {showDetail.feedback && (
              <>
                <hr className="dark:border-slate-700" />
                <h4 className="font-bold text-gray-900 dark:text-white">Feedback</h4>
                <DetailRow label="Segel" value={showDetail.feedback.sealCondition} />
                <DetailRow label="Volume" value={showDetail.feedback.volumeStatus} />
                <DetailRow label="Rating" value={`⭐ ${showDetail.feedback.rating}/5`} />
                <DetailRow label="Status" value={getFeedbackBadge(showDetail.feedback).text} />
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Modern Confirmation Modals */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, target: null, loading: false })}
        onConfirm={confirmDelete}
        title="Hapus Loading Order"
        message={deleteConfirm.target ? `Yakin ingin menghapus Loading Order No. "${deleteConfirm.target.noLO}"?` : 'Yakin hapus Loading Order ini?'}
        confirmText="Hapus LO"
        cancelText="Batal"
        type="danger"
        loading={deleteConfirm.loading}
      />

      <ConfirmModal
        isOpen={generateConfirm.isOpen}
        onClose={() => setGenerateConfirm({ isOpen: false, targetDate: '', loading: false })}
        onConfirm={confirmGenerateDaily}
        title="Generate Harian LO"
        message={`Generate Loading Orders otomatis untuk tanggal ${generateConfirm.targetDate} bagi seluruh SPBU?`}
        confirmText="Generate LO"
        cancelText="Batal"
        type="info"
        loading={generateConfirm.loading}
      />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm transition-all duration-200" onClick={onClose}>
      <div className="w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 rounded-t-3xl">
          <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 pb-8 sm:pb-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

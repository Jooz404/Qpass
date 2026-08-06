import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { AlertTriangle, CheckCircle, Clock, Eye, X, MessageSquare, ShieldAlert } from 'lucide-react';

export default function ComplaintsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [detail, setDetail] = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNote, setResolveNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/complaints', { params });
      
      let filteredComplaints = res.data.data;
      
      // Filter complaints for AMT - only show complaints related to their LOs
      if (user?.role === 'AMT') {
        filteredComplaints = filteredComplaints.filter(c => 
          c.feedback?.lo?.amtId === user?.amtId || 
          c.feedback?.lo?.secondaryAmtId === user?.amtId
        );
      }
      
      setComplaints(filteredComplaints);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Gagal memuat data keluhan');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, statusFilter, user?.role, user?.amtId]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolveNote) {
      toast.warning('Tuliskan catatan tindak lanjut terlebih dahulu');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/complaints/${resolveModal.id}/resolve`, { resolvedNote: resolveNote });
      toast.success('Keluhan berhasil diselesaikan');
      setResolveModal(null);
      setResolveNote('');
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyelesaikan keluhan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-pertamina-red" /> Keluhan SPBU (High Priority)
        </h1>
        <p className="text-sm text-gray-500">Tindaklanjuti keluhan dan laporan kritis dari SPBU</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="input-field w-auto py-2"
        >
          <option value="">Semua Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container bg-white dark:bg-slate-900">
        <table>
          <thead>
            <tr>
              <th>Waktu Masuk</th>
              <th>No. LO</th>
              <th>SPBU</th>
              <th>Masalah Utama</th>
              <th>Status</th>
              <th>Penyelesai</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12"><div className="spinner mx-auto" /></td></tr>
            ) : complaints.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-500">Tidak ada keluhan saat ini</td></tr>
            ) : complaints.map(c => (
              <tr key={c.id}>
                <td className="whitespace-nowrap text-xs">{new Date(c.createdAt).toLocaleString('id-ID')}</td>
                <td className="font-semibold text-gray-900 dark:text-white">{c.feedback?.lo?.noLO}</td>
                <td>{c.feedback?.lo?.spbu?.name}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(c.reasons) ? c.reasons : (c.reasons ? c.reasons.split(', ') : [])).map((r, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[10px] font-bold">
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    c.status === 'RESOLVED' ? 'badge-success' :
                    c.status === 'OPEN' ? 'badge-danger' : 'badge-warning'
                  }`}>{c.status}</span>
                </td>
                <td>{c.resolvedBy?.name || <span className="text-gray-400">—</span>}</td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setDetail(c)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500" title="Lihat Detail">
                      <Eye className="w-4 h-4" />
                    </button>
                    {c.status !== 'RESOLVED' && user?.role !== 'SPBU' && user?.role !== 'AMT' && (
                      <button onClick={() => setResolveModal(c)} className="btn-primary py-1 px-3 text-xs flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Selesaikan
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detail && (
        <Modal title={`Keluhan LO: ${detail.feedback?.lo?.noLO}`} onClose={() => setDetail(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">SPBU</p>
                <p className="font-bold text-gray-800 dark:text-white">{detail.feedback?.lo?.spbu?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Produk</p>
                <p className="font-bold text-gray-800 dark:text-white">{detail.feedback?.lo?.product}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Nopol Mobil Tangki</p>
                <p className="font-semibold text-gray-800 dark:text-white">{detail.feedback?.lo?.truck?.nopol}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Nama AMT</p>
                <p className="font-semibold text-gray-800 dark:text-white">{detail.feedback?.lo?.amt?.name}</p>
              </div>
            </div>

            <hr className="dark:border-slate-800" />

            <div>
              <p className="text-xs text-gray-400 font-bold mb-2">Penyebab Kritis</p>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(detail.reasons) ? detail.reasons : (detail.reasons ? detail.reasons.split(', ') : [])).map((r, i) => (
                  <span key={i} className="px-2.5 py-1 rounded bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-bold">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400">Deskripsi Masalah</p>
              <p className="mt-1 p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-gray-700 dark:text-gray-300">
                {detail.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl">
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Segel</p>
                <p className={`font-semibold ${detail.feedback?.sealCondition === 'RUSAK' ? 'text-red-500' : 'text-emerald-500'}`}>{detail.feedback?.sealCondition}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Volume</p>
                <p className={`font-semibold ${detail.feedback?.volumeStatus === 'SELISIH' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {detail.feedback?.volumeStatus} {detail.feedback?.volumeDiff ? `(${detail.feedback?.volumeDiff}L)` : ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Visual</p>
                <p className={`font-semibold ${detail.feedback?.visualCondition !== 'JERNIH' ? 'text-red-500' : 'text-emerald-500'}`}>{detail.feedback?.visualCondition?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Densitas</p>
                <p className="font-semibold">{detail.feedback?.density} kg/m³</p>
              </div>
            </div>

            {detail.feedback?.photoUrl && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Foto Terlampir</p>
                <img src={detail.feedback.photoUrl} alt="Keluhan" className="w-full rounded-xl object-cover max-h-60" />
              </div>
            )}

            {detail.status === 'RESOLVED' && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs text-emerald-700 dark:text-emerald-400">
                  <span className="font-semibold">Selesai Tindak Lanjut</span>
                  <span>{new Date(detail.resolvedAt).toLocaleString('id-ID')}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Diselesaikan oleh: <span className="font-bold">{detail.resolvedBy?.name}</span></p>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mt-1">"{detail.resolvedNote}"</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Resolve Action Modal */}
      {resolveModal && (
        <Modal title="Tindak Lanjut Keluhan" onClose={() => setResolveModal(null)}>
          <form onSubmit={handleResolve} className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Masukkan catatan tindak lanjut dan solusi untuk menyelesaikan keluhan SPBU ini.</p>
              <textarea
                value={resolveNote}
                onChange={e => setResolveNote(e.target.value)}
                className="input-field min-h-[120px] resize-none"
                placeholder="Contoh: Telah diinstruksikan pengiriman ulang / kompensasi volume telah diberikan..."
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setResolveModal(null)} className="btn-secondary flex-1" disabled={submitting}>Batal</button>
              <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={submitting}>
                {submitting ? 'Memproses...' : 'Selesaikan Keluhan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

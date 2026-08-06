import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { History, Search, Download, ChevronLeft, ChevronRight, Eye, X, Filter } from 'lucide-react';

const getFeedbackIssueCount = (feedback) => {
  if (!feedback) return 0;
  let count = 0;
  if (feedback.sealCondition === 'RUSAK') count += 1;
  if (feedback.volumeStatus === 'SELISIH') count += 1;
  if (feedback.visualCondition && feedback.visualCondition !== 'JERNIH') count += 1;
  if (typeof feedback.density === 'number' && (feedback.density < 715 || feedback.density > 770)) count += 1;
  if (typeof feedback.rating === 'number' && feedback.rating <= 2) count += 1;
  if (typeof feedback.ratingKeseluruhan === 'number' && feedback.ratingKeseluruhan <= 2) count += 1;
  return count;
};

const getHistoryStatusBadge = (feedback) => {
  const issues = getFeedbackIssueCount(feedback);
  if (issues === 1) return { text: 'Perlu Perhatian', className: 'badge badge-warning' };
  if (issues === 2) return { text: 'Tinggi', className: 'badge badge-orange' };
  if (issues > 2) return { text: 'Kritis', className: 'badge badge-danger' };
  return { text: 'Normal', className: 'badge badge-success' };
};

export default function FeedbackHistoryPage() {
  const toast = useToast();
  const { user } = useAuth();
  const { id } = useParams();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', startDate: '', endDate: '' });
  const [detail, setDetail] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      
      let res;
      if (user?.role === 'AMT') {
        // Fetch AMT feedback history
        res = await api.get('/amt-feedback/my', { params });
      } else {
        // Fetch regular SPBU feedback history
        res = await api.get('/feedback', { params });
      }
      
      setFeedbacks(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat data');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
  }, [pagination.page, filters]);

  useEffect(() => {
    if (id) {
      // Load specific feedback detail when ID is in URL
      api.get(`/feedback/${id}`)
        .then(res => setDetail(res.data.data))
        .catch(err => toast.error('Feedback tidak ditemukan'));
    }
  }, [id]);

  const handleExport = async (type) => {
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.get(`/export/feedback/${type}`, { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `QPass_Feedback.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      toast.success(`Export ${type.toUpperCase()} berhasil`);
    } catch { toast.error('Export gagal'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-pertamina-red" /> Riwayat Feedback
          </h1>
          <p className="text-sm text-gray-500">Semua feedback Q&Q dari SPBU</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('excel')} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => handleExport('pdf')} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
            className="input-field pl-10 py-2.5" placeholder="Cari No. LO..."
          />
        </div>
        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }} className="input-field w-auto py-2.5">
          <option value="">Semua Status</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH_PRIORITY">High Priority</option>
        </select>
        <input type="date" value={filters.startDate} onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }} className="input-field w-auto py-2.5" />
        <input type="date" value={filters.endDate} onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }} className="input-field w-auto py-2.5" />
      </div>

      {/* Table */}
      <div className="table-container bg-white dark:bg-slate-900">
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>No. LO</th>
              <th>SPBU</th>
              <th>Alamat</th>
              <th>Produk</th>
              <th>Nopol</th>
              <th>AMT</th>
              <th>Segel</th>
              <th>Volume</th>
              <th>Visual</th>
              <th>Densitas</th>
              <th>Pelayanan AMT</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={14} className="text-center py-12"><div className="spinner mx-auto" /></td></tr>
            ) : feedbacks.length === 0 ? (
              <tr><td colSpan={14} className="text-center py-12 text-gray-500">Tidak ada data</td></tr>
            ) : feedbacks.map(fb => (
              <tr key={fb.id}>
                <td className="whitespace-nowrap text-xs">{fb.submittedAt ? new Date(fb.submittedAt).toLocaleString('id-ID') : '-'}</td>
                <td className="font-medium text-gray-900 dark:text-white">{fb.lo?.noLO || '-'}</td>
                <td className="max-w-[120px] truncate">{fb.lo?.spbu?.name || '-'}</td>
                <td className="max-w-[150px] truncate text-xs text-gray-500">{fb.lo?.spbu?.address || '-'}</td>
                <td>{fb.lo?.product || '-'}</td>
                <td>{fb.lo?.truck?.nopol || '-'}</td>
                <td>{fb.lo?.amt?.name || '-'}</td>
                <td>{fb.sealCondition ? <span className={fb.sealCondition === 'RUSAK' ? 'text-red-600 font-semibold' : 'text-emerald-600'}>{fb.sealCondition}</span> : '-'}</td>
                <td>{fb.volumeStatus ? <span className={fb.volumeStatus === 'SELISIH' ? 'text-red-600 font-semibold' : 'text-emerald-600'}>{fb.volumeStatus}{fb.volumeDiff ? ` (${fb.volumeDiff}L)` : ''}</span> : '-'}</td>
                <td>{fb.visualCondition ? <span className={fb.visualCondition !== 'JERNIH' ? 'text-red-600 font-semibold' : 'text-emerald-600'}>{fb.visualCondition.replace('_', ' ')}</span> : '-'}</td>
                <td>{fb.density !== undefined && fb.density !== null ? <span className={fb.density < 715 || fb.density > 770 ? 'text-red-600 font-semibold' : ''}>{fb.density}</span> : '-'}</td>
                <td>{'⭐'.repeat(fb.rating || fb.ratingKeseluruhan || 0)}</td>
                <td>
                  {(() => {
                    const badge = getHistoryStatusBadge(fb);
                    return <span className={badge.className}>{badge.text}</span>;
                  })()}
                </td>
                <td>
                  <button onClick={() => setDetail(fb)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{feedbacks.length} dari {pagination.total} data</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1} className="btn-secondary p-2 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">{pagination.page}/{pagination.totalPages}</span>
            <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages} className="btn-secondary p-2 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-bold text-gray-900 dark:text-white">Detail Feedback</h3>
              <button onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">LO</span><span className="font-semibold">{detail.lo?.noLO}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">SPBU</span><span className="font-semibold">{detail.lo?.spbu?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Produk</span><span>{detail.lo?.product}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Nopol</span><span>{detail.lo?.truck?.nopol}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">AMT</span><span>{detail.lo?.amt?.name}</span></div>
              <hr className="dark:border-slate-700" />
              {detail.sealCondition && <div className="flex justify-between"><span className="text-gray-500">Segel</span><span className={detail.sealCondition === 'RUSAK' ? 'text-red-600 font-bold' : 'text-emerald-600'}>{detail.sealCondition}</span></div>}
              {detail.volumeStatus && <div className="flex justify-between"><span className="text-gray-500">Volume</span><span className={detail.volumeStatus === 'SELISIH' ? 'text-red-600 font-bold' : 'text-emerald-600'}>{detail.volumeStatus}{detail.volumeDiff ? ` (${detail.volumeDiff}L)` : ''}</span></div>}
              {detail.visualCondition && <div className="flex justify-between"><span className="text-gray-500">Visual</span><span className={detail.visualCondition !== 'JERNIH' ? 'text-red-600 font-bold' : 'text-emerald-600'}>{detail.visualCondition.replace('_', ' ')}</span></div>}
              {detail.density !== undefined && detail.density !== null && <div className="flex justify-between"><span className="text-gray-500">Densitas</span><span className={detail.density < 715 || detail.density > 770 ? 'text-red-600 font-bold' : ''}>{detail.density} kg/m³</span></div>}
              {detail.ratingKeramahan && <div className="flex justify-between"><span className="text-gray-500">Keramahan</span><span>{'⭐'.repeat(detail.ratingKeramahan)}</span></div>}
              {detail.ratingKooperasi && <div className="flex justify-between"><span className="text-gray-500">Kerjasama</span><span>{'⭐'.repeat(detail.ratingKooperasi)}</span></div>}
              {detail.ratingFasilitas && <div className="flex justify-between"><span className="text-gray-500">Fasilitas</span><span>{'⭐'.repeat(detail.ratingFasilitas)}</span></div>}
              {detail.ratingProses && <div className="flex justify-between"><span className="text-gray-500">Proses Bongkar</span><span>{'⭐'.repeat(detail.ratingProses)}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Rating Total</span><span>{'⭐'.repeat(detail.rating || detail.ratingKeseluruhan || 0)} ({detail.rating || detail.ratingKeseluruhan || 0}/5)</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={getHistoryStatusBadge(detail).className}>{getHistoryStatusBadge(detail).text}</span></div>
              {detail.notes && <div><span className="text-gray-500">Catatan:</span><p className="mt-1 text-gray-700 dark:text-gray-300">{detail.notes}</p></div>}
              {detail.photoUrl && <img src={detail.photoUrl} alt="Foto" className="w-full rounded-xl mt-2" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

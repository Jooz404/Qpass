import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import qualityControlService from '../services/qualityControlService';
import vesselDischargeService from '../services/vesselDischargeService';
import loService from '../services/loService';
import CQDFormModal from '../components/CQDFormModal';
import CQDDetailModal from '../components/CQDDetailModal';
import {
  ShieldCheck, Plus, Search, Edit3, Trash2, X, AlertTriangle,
  CheckCircle2, Ship, Database, Truck, FileText, Printer,
  Filter, Calendar, Scale, Fuel, Calculator
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const STAGES = [
  { id: 'CQD_VESSEL', label: 'CQD / LO Discharge Kapal', icon: Ship, color: 'blue', desc: 'Penyaluran & Penerimaan Kargo Kapal (LO Discharge)' },
  { id: 'VESSEL_DISCHARGE', label: 'Sampling Kapal Tanker', icon: Ship, color: 'sky', desc: 'Pre-discharge sampling & uji lab dari kapal' },
  { id: 'STORAGE_TANK', label: 'Tangki Timbun Terminal', icon: Database, color: 'purple', desc: 'Daily quality check di tangki darat' },
  { id: 'FILLING_SHED_TRUCK', label: 'Mobil Tanki & LO SPBU', icon: Truck, color: 'emerald', desc: 'Quality check sebelum pengisian Mobil Tanki' },
];

const PRODUCTS = ['BIOFAME', 'BIOSOLAR B50', 'SOLAR B50', 'PERTALITE', 'DEXLITE', 'PERTAMAX', 'AVTUR', 'KEROSENE'];

function getDensitySpec(product) {
  const p = (product || '').toUpperCase();
  if (p.includes('SOLAR') || p.includes('BIOSOLAR') || p.includes('DEX') || p.includes('FAME')) {
    return { min: 815, max: 870, label: '815 - 870 kg/m³' };
  } else if (p.includes('AVTUR')) {
    return { min: 775, max: 840, label: '775 - 840 kg/m³' };
  } else if (p.includes('KEROSENE') || p.includes('MINYAK TANAH')) {
    return { min: 790, max: 835, label: '790 - 835 kg/m³' };
  }
  return { min: 715, max: 770, label: '715 - 770 kg/m³' };
}

export default function QualityControlPage() {
  const toast = useToast();
  const [activeStage, setActiveStage] = useState('CQD_VESSEL');

  // Lists & Stats
  const [qcList, setQcList] = useState([]);
  const [cqdList, setCqdList] = useState([]);
  const [stats, setStats] = useState(null);
  const [cqdStats, setCqdStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingCQD, setSubmittingCQD] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showQCModal, setShowQCModal] = useState(false);
  const [showCQDFormModal, setShowCQDFormModal] = useState(false);
  const [showCQDDetailModal, setShowCQDDetailModal] = useState(false);
  const [selectedCQD, setSelectedCQD] = useState(null);
  const [editId, setEditId] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, type: 'QC', name: '', loading: false });

  // QC Sampling Form State
  const [form, setForm] = useState({
    stage: 'VESSEL_DISCHARGE',
    product: 'PERTALITE',
    batchNo: '',
    sourceName: '',
    densityObserved: '',
    temperature: '',
    density15C: '',
    visualCondition: 'JERNIH',
    waterContent: '0',
    flashPoint: '',
    sampleDate: new Date().toISOString().slice(0, 16),
    inspectorName: 'Admin QQ Bitung',
    notes: '',
    loId: '',
  });

  // Fetch QC Records & CQD Records
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeStage === 'CQD_VESSEL') {
        const [resCQD, resCQDStats] = await Promise.all([
          vesselDischargeService.getAll({ search, product: productFilter }),
          vesselDischargeService.getStats(),
        ]);
        setCqdList(resCQD.data.data || []);
        setCqdStats(resCQDStats.data.data || null);
      } else {
        const [resList, resStats] = await Promise.all([
          qualityControlService.getAll({ stage: activeStage, search, product: productFilter, status: statusFilter }),
          qualityControlService.getStats(),
        ]);
        setQcList(resList.data.data || []);
        setStats(resStats.data.data || null);
      }
    } catch (err) {
      toast.error('Gagal memuat data Quality Control: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [activeStage, search, productFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CQD Submission Handler
  const handleCQDSubmit = async (cqdData) => {
    setSubmittingCQD(true);
    try {
      const res = await vesselDischargeService.create(cqdData);
      if (res.data.data.isToleranceExceeded) {
        toast.warning(`CQD Disimpan. WARN: Susut kargo (${res.data.data.percentageVsBL}%) melebihi toleransi!`);
      } else {
        toast.success(`CQD LO Discharge (${res.data.data.noLODischarge}) Berhasil Disimpan!`);
      }
      setShowCQDFormModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan dokumen CQD');
    } finally {
      setSubmittingCQD(false);
    }
  };

  const handleOpenAdd = () => {
    if (activeStage === 'CQD_VESSEL') {
      setShowCQDFormModal(true);
    } else {
      setEditId(null);
      setForm({
        stage: activeStage,
        product: 'PERTALITE',
        batchNo: activeStage === 'VESSEL_DISCHARGE' ? 'B/L-' + Date.now().toString().slice(-6) : '',
        sourceName: activeStage === 'VESSEL_DISCHARGE' ? 'MT Sinar Bitung' : activeStage === 'STORAGE_TANK' ? 'Tangki T-01' : '',
        densityObserved: '732.5',
        temperature: '29.5',
        density15C: '735.0',
        visualCondition: 'JERNIH',
        waterContent: '0',
        flashPoint: '55',
        sampleDate: new Date().toISOString().slice(0, 16),
        inspectorName: 'Admin QQ Bitung',
        notes: '',
        loId: '',
      });
      setShowQCModal(true);
    }
  };

  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setForm({
      stage: item.stage,
      product: item.product,
      batchNo: item.batchNo || '',
      sourceName: item.sourceName || '',
      densityObserved: item.densityObserved !== null ? String(item.densityObserved) : '',
      temperature: item.temperature !== null ? String(item.temperature) : '',
      density15C: item.density15C !== null ? String(item.density15C) : '',
      visualCondition: item.visualCondition || 'JERNIH',
      waterContent: item.waterContent !== null ? String(item.waterContent) : '0',
      flashPoint: item.flashPoint !== null ? String(item.flashPoint) : '',
      sampleDate: item.sampleDate ? new Date(item.sampleDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      inspectorName: item.inspectorName || '',
      notes: item.notes || '',
      loId: item.loId ? String(item.loId) : '',
    });
    setShowQCModal(true);
  };

  const handleQCSubmit = async (e) => {
    e.preventDefault();
    if (!form.sourceName || !form.density15C) {
      toast.error('Sumber Pengambilan dan Density 15°C wajib diisi');
      return;
    }

    try {
      if (editId) {
        await qualityControlService.update(editId, form);
        toast.success('Log Quality Control berhasil diperbarui');
      } else {
        const res = await qualityControlService.create(form);
        if (res.data.data.isOffSpec) {
          toast.warning('Log QC tersimpan, namun terdeteksi OUT OF SPECIFICATION!');
        } else {
          toast.success('Log Quality Control berhasil disimpan (PASSED)');
        }
      }
      setShowQCModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data QC');
    }
  };

  const handleDelete = (item, type = 'QC') => {
    setDeleteConfirm({
      isOpen: true,
      id: item.id,
      type,
      name: type === 'CQD' ? `${item.noLODischarge} - ${item.vesselName}` : `${item.product} - ${item.sourceName}`,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      if (deleteConfirm.type === 'CQD') {
        await vesselDischargeService.delete(deleteConfirm.id);
        toast.success('Dokumen CQD berhasil dihapus');
      } else {
        await qualityControlService.delete(deleteConfirm.id);
        toast.success('Log QC berhasil dihapus');
      }
      fetchData();
      setDeleteConfirm({ isOpen: false, id: null, type: 'QC', name: '', loading: false });
    } catch (err) {
      toast.error('Gagal menghapus data: ' + (err.response?.data?.message || err.message));
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const spec = getDensitySpec(form.product);
  const currentDensity = parseFloat(form.density15C);
  const isFormOffSpec = !isNaN(currentDensity) && (currentDensity < spec.min || currentDensity > spec.max);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-pertamina-red to-pertamina-red-dark text-white shadow-lg shadow-pertamina-red/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Quality & Quantity Control (CQD)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Pencatatan Penyaluran & Pengujian Kualitas BBM Kapal Tanker ke Tangki Timbun — IT Bitung
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-pertamina-red to-pertamina-red-dark hover:from-pertamina-red-dark hover:to-pertamina-red text-white text-sm font-bold shadow-lg shadow-pertamina-red/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{activeStage === 'CQD_VESSEL' ? 'Input CQD / LO Discharge Kapal' : 'Tambah Log Kualitas'}</span>
        </button>
      </div>

      {/* Top Stats Banner */}
      {activeStage === 'CQD_VESSEL' && cqdStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Ship className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Discharge Kapal</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{cqdStats.totalRecords || 0}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total BBM Diterima (L15)</p>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400">{(cqdStats.totalL15Received || 0).toLocaleString()} L</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Selisih (Shortage)</p>
                <p className={`text-xl font-black ${(cqdStats.overallShortage || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {(cqdStats.overallShortage || 0).toLocaleString()} L
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Peringatan Toleransi Susut</p>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{cqdStats.warningCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STAGES.map(s => {
          const Icon = s.icon;
          const isActive = activeStage === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStage(s.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? 'bg-white dark:bg-slate-900 border-pertamina-red dark:border-pertamina-red shadow-lg shadow-pertamina-red/10 ring-2 ring-pertamina-red/30'
                  : 'bg-white/60 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              {isActive && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pertamina-red to-pertamina-blue" />}
              <div className="flex items-center gap-3 mb-1">
                <div className={`p-2 rounded-xl ${
                  isActive ? 'bg-pertamina-red text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">{s.label}</h3>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug pl-11">{s.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-sm backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeStage === 'CQD_VESSEL' ? 'Cari No LO Discharge, nama kapal, produk, B/L, BAST...' : 'Cari kapal, tangki, nopol MT, B/L, inspector...'}
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pertamina-red/30"
          />
        </div>

        <select
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
        >
          <option value="">Semua Produk BBM</option>
          {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table Section */}
      <div className="glass-card rounded-2xl border border-slate-200/70 dark:border-slate-800/70 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="spinner" />
            <p className="text-xs font-bold">Memuat data...</p>
          </div>
        ) : activeStage === 'CQD_VESSEL' ? (
          /* CQD Vessel Discharge Table */
          cqdList.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Ship className="w-12 h-12 mx-auto mb-2 opacity-30 text-pertamina-red" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada dokumen Certificate of Quantity Discharge (CQD)</p>
              <p className="text-xs text-slate-500">Klik tombol "Input CQD / LO Discharge Kapal" untuk membuat dokumen baru</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/70 dark:border-slate-800/70">
                  <tr>
                    <th className="px-5 py-3.5">No. LO Discharge & Tanggal</th>
                    <th className="px-5 py-3.5">Nama Kapal & Produk</th>
                    <th className="px-5 py-3.5">B/L Volume (L15)</th>
                    <th className="px-5 py-3.5">Diterima (L15)</th>
                    <th className="px-5 py-3.5">Selisih & % VS B/L</th>
                    <th className="px-5 py-3.5">Status Toleransi Susut</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                  {cqdList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/60 transition-colors">
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-mono font-bold text-xs">
                          {item.noLODischarge}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(item.cqdDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-slate-900 dark:text-white font-bold">{item.vesselName}</p>
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                          {item.product}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold">
                        {(item.blQuantityLiters15 || 0).toLocaleString()} L
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {(item.totalReceivedLiters15 || 0).toLocaleString()} L
                      </td>

                      <td className="px-5 py-4 font-mono">
                        <span className={`font-bold ${(item.shortageLiters15 || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                          {(item.shortageLiters15 || 0).toLocaleString()} L
                        </span>
                        <p className="text-[11px] font-black">{item.percentageVsBL}%</p>
                      </td>

                      <td className="px-5 py-4">
                        {item.isToleranceExceeded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-200 dark:border-rose-900 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> TOLERANSI TERLAMPAUI (&gt;0.5%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle2 className="w-3 h-3" /> DALAM TOLERANSI (&lt;0.5%)
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCQD(item);
                              setShowCQDDetailModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" /> Sertifikat CQD
                          </button>
                          <button
                            onClick={() => handleDelete(item, 'CQD')}
                            className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500"
                            title="Hapus CQD"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Existing QC Sampling Table */
          qcList.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-30 text-pertamina-red" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada data Quality Control</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/70 dark:border-slate-800/70">
                  <tr>
                    <th className="px-5 py-3.5">Tanggal & Inspector</th>
                    <th className="px-5 py-3.5">Sumber / Batch</th>
                    <th className="px-5 py-3.5">Produk BBM</th>
                    <th className="px-5 py-3.5">Density 15°C</th>
                    <th className="px-5 py-3.5">Suhu & Visual</th>
                    <th className="px-5 py-3.5">Status QC</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                  {qcList.map(item => {
                    const itemSpec = getDensitySpec(item.product);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div>
                              <p className="text-slate-900 dark:text-white font-bold">
                                {new Date(item.sampleDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <span className="text-[10px] text-slate-400">{item.inspectorName}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-slate-900 dark:text-white font-bold">{item.sourceName}</p>
                          {item.batchNo && <p className="text-[10px] text-slate-400 font-mono">B/L: {item.batchNo}</p>}
                        </td>

                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                            {item.product}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Scale className="w-3.5 h-3.5 text-slate-400" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white font-mono">
                                {item.density15C} <span className="text-[10px] font-normal text-slate-400">kg/m³</span>
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">Spec: {itemSpec.label}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            <p className="text-slate-700 dark:text-slate-300 font-mono">{item.temperature ? `${item.temperature} °C` : '-'}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              item.visualCondition === 'JERNIH' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                            }`}>
                              {item.visualCondition}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {item.isOffSpec ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[10px] border border-red-200 dark:border-red-900 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> OFF-SPEC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-200 dark:border-emerald-900">
                              <CheckCircle2 className="w-3 h-3" /> PASSED
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewDetail(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-pertamina-blue hover:text-white text-slate-600 dark:text-slate-300 transition-all text-xs font-bold flex items-center gap-1"
                              title="Lihat Sertifikat Quality Pass"
                            >
                              <FileText className="w-3.5 h-3.5" /> Certificate
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item, 'QC')}
                              className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* CQD Form Modal */}
      <CQDFormModal
        isOpen={showCQDFormModal}
        onClose={() => setShowCQDFormModal(false)}
        onSubmit={handleCQDSubmit}
        isLoading={submittingCQD}
      />

      {/* CQD Certificate Detail View Modal */}
      <CQDDetailModal
        isOpen={showCQDDetailModal}
        onClose={() => setShowCQDDetailModal(false)}
        cqd={selectedCQD}
      />

      {/* QC Add / Edit Modal */}
      {showQCModal && (
        <Modal title={editId ? 'Edit Log Quality Control' : 'Tambah Log Quality Control Baru'} onClose={() => setShowQCModal(false)}>
          <form onSubmit={handleQCSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tahap Monitoring</label>
                <select
                  value={form.stage}
                  onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                  className="input-field mt-1 text-xs"
                >
                  <option value="VESSEL_DISCHARGE">Sampling Kapal Tanker</option>
                  <option value="STORAGE_TANK">Tangki Timbun Terminal</option>
                  <option value="FILLING_SHED_TRUCK">Mobil Tanki / Loading Order</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jenis Produk BBM</label>
                <select
                  value={form.product}
                  onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                  className="input-field mt-1 text-xs"
                >
                  {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {form.stage === 'VESSEL_DISCHARGE' ? 'Nama Kapal Tanker' : form.stage === 'STORAGE_TANK' ? 'No. Tangki Timbun' : 'Nopol MT / Kran'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.sourceName}
                  onChange={e => setForm(f => ({ ...f, sourceName: e.target.value }))}
                  className="input-field mt-1 text-xs"
                  placeholder={form.stage === 'VESSEL_DISCHARGE' ? 'MT Sinar Bitung' : 'Tangki T-01'}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">No. Batch / B/L / Tangki</label>
                <input
                  type="text"
                  value={form.batchNo}
                  onChange={e => setForm(f => ({ ...f, batchNo: e.target.value }))}
                  className="input-field mt-1 text-xs"
                  placeholder="B/L-102938"
                />
              </div>
            </div>

            {/* Density & Specs Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-pertamina-red" /> Parameter Pengujian Lab / Lapangan
                </span>
                <span className="text-[10px] font-mono text-slate-500">Spec: {spec.label}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Density Obs ($kg/m^3$)</label>
                  <input
                    type="number" step="0.1"
                    value={form.densityObserved}
                    onChange={e => setForm(f => ({ ...f, densityObserved: e.target.value }))}
                    className="input-field mt-1 text-xs font-mono"
                    placeholder="732.5"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Suhu (°C)</label>
                  <input
                    type="number" step="0.1"
                    value={form.temperature}
                    onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))}
                    className="input-field mt-1 text-xs font-mono"
                    placeholder="29.5"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Density 15°C ($kg/m^3$) *</label>
                  <input
                    type="number" step="0.1"
                    value={form.density15C}
                    onChange={e => setForm(f => ({ ...f, density15C: e.target.value }))}
                    className={`input-field mt-1 text-xs font-mono font-bold ${
                      isFormOffSpec ? 'border-red-500 ring-2 ring-red-500/20 text-red-600' : ''
                    }`}
                    placeholder="735.0"
                    required
                  />
                </div>
              </div>

              {form.density15C && (
                <div className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                  isFormOffSpec
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 border border-red-200 dark:border-red-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                }`}>
                  <span className="flex items-center gap-1.5">
                    {isFormOffSpec ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isFormOffSpec ? 'OUT OF SPECIFICATION (Terlalu Tinggi/Rendah)' : 'MEMENUHI SPESIFIKASI PERTAMINA'}
                  </span>
                  <span className="font-mono text-[10px]">Standar: {spec.label}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kondisi Visual</label>
                <select
                  value={form.visualCondition}
                  onChange={e => setForm(f => ({ ...f, visualCondition: e.target.value }))}
                  className="input-field mt-1 text-xs"
                >
                  <option value="JERNIH">Jernih & Terang</option>
                  <option value="ADA_AIR">Ada Air</option>
                  <option value="ADA_ENDAPAN">Ada Endapan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kandungan Air (ppm/mm)</label>
                <input
                  type="number" step="0.1"
                  value={form.waterContent}
                  onChange={e => setForm(f => ({ ...f, waterContent: e.target.value }))}
                  className="input-field mt-1 text-xs"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Flash Point (°C)</label>
                <input
                  type="number" step="0.1"
                  value={form.flashPoint}
                  onChange={e => setForm(f => ({ ...f, flashPoint: e.target.value }))}
                  className="input-field mt-1 text-xs"
                  placeholder="55"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Sampling</label>
                <input
                  type="datetime-local"
                  value={form.sampleDate}
                  onChange={e => setForm(f => ({ ...f, sampleDate: e.target.value }))}
                  className="input-field mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Petugas Inspector QQ</label>
                <input
                  type="text"
                  value={form.inspectorName}
                  onChange={e => setForm(f => ({ ...f, inspectorName: e.target.value }))}
                  className="input-field mt-1 text-xs"
                  placeholder="Nama Inspector"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan Pengujian</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="input-field mt-1 text-xs"
                rows="2"
                placeholder="Catatan tambahan mengenai sampel BBM..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowQCModal(false)} className="btn-secondary flex-1">Batal</button>
              <button type="submit" className="btn-primary flex-1">Simpan Data QC</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Quality Pass Detail View Modal */}
      {viewDetail && (
        <Modal title="Certificate of Quality (CoQ) — Pertamina IT Bitung" onClose={() => setViewDetail(null)}>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-3 relative overflow-hidden border border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-pertamina-red">PT PERTAMINA PATRA NIAGA</span>
                  <h3 className="text-lg font-black tracking-tight">QUALITY RELEASE CERTIFICATE</h3>
                  <p className="text-[11px] text-slate-400">Integrated Terminal Bitung — Quantity & Quality Assurance</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    viewDetail.isOffSpec ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {viewDetail.isOffSpec ? 'OFF-SPEC' : 'QUALITY PASSED'}
                  </span>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">ID: QC-{viewDetail.id}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Produk BBM</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{viewDetail.product}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Sumber / Tangki / Kapal</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{viewDetail.sourceName}</p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                  <tr>
                    <th className="p-3">Parameter Uji</th>
                    <th className="p-3">Hasil Uji</th>
                    <th className="p-3">Spesifikasi Standar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  <tr>
                    <td className="p-3 font-sans font-bold">Density @ 15°C</td>
                    <td className="p-3 font-bold text-pertamina-blue">{viewDetail.density15C} kg/m³</td>
                    <td className="p-3 text-slate-400">{getDensitySpec(viewDetail.product).label}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans">Observed Density</td>
                    <td className="p-3">{viewDetail.densityObserved ? `${viewDetail.densityObserved} kg/m³` : '-'}</td>
                    <td className="p-3 text-slate-400">Report</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans">Suhu (Temperature)</td>
                    <td className="p-3">{viewDetail.temperature ? `${viewDetail.temperature} °C` : '-'}</td>
                    <td className="p-3 text-slate-400">Report</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans">Kejelasan Visual</td>
                    <td className="p-3 font-bold text-emerald-600">{viewDetail.visualCondition}</td>
                    <td className="p-3 text-slate-400">Clear & Bright</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans">Kandungan Air</td>
                    <td className="p-3">{viewDetail.waterContent !== null ? `${viewDetail.waterContent} ppm` : '-'}</td>
                    <td className="p-3 text-slate-400">Nill / Traces</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-xs">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Petugas Testing / Inspector</p>
              <p className="font-bold text-slate-900 dark:text-white">{viewDetail.inspectorName}</p>
              <p className="text-[10px] text-slate-400 mt-1">Tanggal: {new Date(viewDetail.sampleDate).toLocaleString('id-ID')}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setViewDetail(null)} className="btn-secondary flex-1">Tutup</button>
              <button onClick={() => window.print()} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Cetak Certificate
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, type: 'QC', name: '', loading: false })}
        onConfirm={confirmDelete}
        title={deleteConfirm.type === 'CQD' ? 'Hapus Dokumen CQD' : 'Hapus Log Quality Control'}
        message={`Apakah Anda yakin ingin menghapus data "${deleteConfirm.name}"?`}
        confirmText="Hapus Data"
        cancelText="Batal"
        type="danger"
        loading={deleteConfirm.loading}
      />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 rounded-t-3xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-pertamina-red" />
            {title}
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 pb-8 sm:pb-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

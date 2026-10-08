import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle, CheckCircle, Ship, Fuel, Calendar, FileText, Calculator } from 'lucide-react';

export default function CQDFormModal({ isOpen, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    noLODischarge: '',
    vesselName: 'BG. AME IX',
    loadedAt: 'PT. KUTAI REFINERY NUSANTARA/PSO',
    dischargeAt: '1419 Integrated Terminal Bitung',
    externalNo: '124/WSS-BL/IDBPN-IDBIT/VIII/2026',
    bastNumber: '503',
    materialNo: 'A040900014/BIOFAME',
    poNumber: '5250015489',
    product: 'BIOFAME',
    psoType: 'PSO',
    cqdDate: new Date().toISOString().slice(0, 10),
    cqdTime: '14:10',
    blQuantityLitersObs: '2054650',
    blQuantityLiters15: '1999851',
    blQuantityMetricTon: '1739.236',
    remarks: '',
    loadingPort: 'PT KRN - Agung Priyadi',
    surveyorBy: 'PT. TRS - Kamarudin',
    preparedBy: 'Spv I Fuel Rec.&Sto. & LPG Bulk - Nasrul',
    checkedBy: 'Loading Master - Ujang Muhidin',
    acknowledgeBy: 'IT Manager Bitung - Arman Prastiono',
  });

  const [tanks, setTanks] = useState([
    {
      id: 1,
      tankNo: '5',
      date: new Date().toISOString().slice(0, 10),
      time: '04:46',
      testDensity: '0.8543',
      testTemp: '30.01',
      density15C: '0.8641',
      totalDip: '7400',
      waterDip: '0',
      tempObs: '30.01',
      netProductObsL: '488006',
      correction: '0.988276',
      liters15: '482285',
      metricTon: '416.209',
    },
    {
      id: 2,
      tankNo: '8',
      date: new Date().toISOString().slice(0, 10),
      time: '13:56',
      testDensity: '0.8609',
      testTemp: '31.56',
      density15C: '0.8716',
      totalDip: '9976',
      waterDip: '0',
      tempObs: '31.56',
      netProductObsL: '1556149',
      correction: '0.987288',
      liters15: '1535484',
      metricTon: '1335.910',
    },
  ]);

  // Derived Calculations
  const totalReceivedObs = tanks.reduce((sum, t) => sum + (parseFloat(t.netProductObsL) || 0), 0);
  const totalReceivedL15 = tanks.reduce((sum, t) => sum + (parseFloat(t.liters15) || 0), 0);
  const totalReceivedMT = tanks.reduce((sum, t) => sum + (parseFloat(t.metricTon) || 0), 0);

  const blL15 = parseFloat(formData.blQuantityLiters15) || 0;
  const shortageL15 = blL15 > 0 ? totalReceivedL15 - blL15 : 0;
  const percentageVsBL = blL15 > 0 ? (shortageL15 / blL15) * 100 : 0;
  const isToleranceExceeded = percentageVsBL < -0.5;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTankChange = (index, field, value) => {
    const updated = [...tanks];
    updated[index][field] = value;

    // Auto-calculate liters15 if test density & correction are available
    if (field === 'netProductObsL' || field === 'correction') {
      const netObs = parseFloat(updated[index].netProductObsL || 0);
      const corr = parseFloat(updated[index].correction || 1);
      if (netObs > 0 && corr > 0) {
        updated[index].liters15 = Math.round(netObs * corr);
      }
    }

    setTanks(updated);
  };

  const addTankRow = () => {
    setTanks([
      ...tanks,
      {
        id: Date.now(),
        tankNo: String(tanks.length + 1),
        date: new Date().toISOString().slice(0, 10),
        time: '12:00',
        testDensity: '0.8500',
        testTemp: '30.00',
        density15C: '0.8600',
        totalDip: '0',
        waterDip: '0',
        tempObs: '30.00',
        netProductObsL: '0',
        correction: '0.988000',
        liters15: '0',
        metricTon: '0',
      },
    ]);
  };

  const removeTankRow = (index) => {
    if (tanks.length <= 1) return;
    setTanks(tanks.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tanks,
      totalReceivedLitersObs: totalReceivedObs,
      totalReceivedLiters15: totalReceivedL15,
      totalReceivedMetricTon: totalReceivedMT,
      shortageLiters15: shortageL15,
      percentageVsBL: percentageVsBL.toFixed(3),
      isToleranceExceeded,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-xl">
              <Ship className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Certificate of Quantity Discharge (CQD) - LO Discharge
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan Penyaluran & Pengukuran Kargo BBM dari Kapal Tanker ke Tangki Timbun Depot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Section 1: Header Information */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> 1. Informasi Utama Kargo Kapal & LO Discharge
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">No. LO Discharge (Auto/Custom)</label>
                <input
                  type="text"
                  name="noLODischarge"
                  value={formData.noLODischarge}
                  onChange={handleInputChange}
                  placeholder="Kosongkan untuk Auto-Generate (LO-DISCH-YYYYMMDD-XXX)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nama Kapal / Vessel *</label>
                <input
                  type="text"
                  name="vesselName"
                  required
                  value={formData.vesselName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Jenis Produk BBM *</label>
                <select
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="BIOFAME">BIOFAME</option>
                  <option value="BIOSOLAR B50">BIOSOLAR B50</option>
                  <option value="PERTALITE">PERTALITE</option>
                  <option value="DEXLITE">DEXLITE</option>
                  <option value="PERTAMAX">PERTAMAX</option>
                  <option value="AVTUR">AVTUR</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Pelabuhan Asal (Loaded At)</label>
                <input
                  type="text"
                  name="loadedAt"
                  value={formData.loadedAt}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Lokasi Discharge</label>
                <input
                  type="text"
                  name="dischargeAt"
                  value={formData.dischargeAt}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">No. Bill of Lading (B/L)</label>
                <input
                  type="text"
                  name="externalNo"
                  value={formData.externalNo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">No. PO (Purchase Order)</label>
                <input
                  type="text"
                  name="poNumber"
                  value={formData.poNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">No. BAST</label>
                <input
                  type="text"
                  name="bastNumber"
                  value={formData.bastNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tanggal & Waktu CQD</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="cqdDate"
                    value={formData.cqdDate}
                    onChange={handleInputChange}
                    className="w-1/2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    name="cqdTime"
                    value={formData.cqdTime}
                    onChange={handleInputChange}
                    placeholder="HH:MM"
                    className="w-1/2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Bill of Lading (B/L) Baseline Volume */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4" /> 2. Acuan Kuantitas Bill of Lading (B/L Quantity)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Volume B/L (Observed Liters)</label>
                <input
                  type="number"
                  name="blQuantityLitersObs"
                  value={formData.blQuantityLitersObs}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium text-blue-600 dark:text-blue-400">
                  Volume B/L (Liters @ 15°C) * (Standar Pertamina)
                </label>
                <input
                  type="number"
                  name="blQuantityLiters15"
                  required
                  value={formData.blQuantityLiters15}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg text-slate-900 dark:text-white font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Metric Ton B/L (MT)</label>
                <input
                  type="number"
                  step="0.001"
                  name="blQuantityMetricTon"
                  value={formData.blQuantityMetricTon}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Shore Tank Discharge Dynamic Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Fuel className="w-4 h-4 text-emerald-500" /> 3. Pengukuran Tangki Darat (Product in Shore Tank)
              </h4>
              <button
                type="button"
                onClick={addTankRow}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Tangki Darat
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">No. Tangki</th>
                    <th className="p-2.5">Waktu</th>
                    <th className="p-2.5">Test Dens / Temp</th>
                    <th className="p-2.5">Dens 15°C</th>
                    <th className="p-2.5">Total Dip (cm)</th>
                    <th className="p-2.5">Net Product Obs (L)</th>
                    <th className="p-2.5">Faktor Koreksi</th>
                    <th className="p-2.5 text-blue-600 dark:text-blue-400">Liters @ 15°C</th>
                    <th className="p-2.5">Metric Ton</th>
                    <th className="p-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {tanks.map((tank, idx) => (
                    <tr key={tank.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={tank.tankNo}
                          onChange={(e) => handleTankChange(idx, 'tankNo', e.target.value)}
                          className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-semibold text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={tank.time}
                          onChange={(e) => handleTankChange(idx, 'time', e.target.value)}
                          placeholder="13:56"
                          className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-center"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <input
                            type="number"
                            step="0.0001"
                            value={tank.testDensity}
                            placeholder="Dens"
                            onChange={(e) => handleTankChange(idx, 'testDensity', e.target.value)}
                            className="w-16 px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={tank.testTemp}
                            placeholder="Temp"
                            onChange={(e) => handleTankChange(idx, 'testTemp', e.target.value)}
                            className="w-14 px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                          />
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.0001"
                          value={tank.density15C}
                          onChange={(e) => handleTankChange(idx, 'density15C', e.target.value)}
                          className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-blue-600 dark:text-blue-400 font-semibold"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={tank.totalDip}
                          onChange={(e) => handleTankChange(idx, 'totalDip', e.target.value)}
                          className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={tank.netProductObsL}
                          onChange={(e) => handleTankChange(idx, 'netProductObsL', e.target.value)}
                          className="w-28 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-semibold text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.000001"
                          value={tank.correction}
                          onChange={(e) => handleTankChange(idx, 'correction', e.target.value)}
                          className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={tank.liters15}
                          onChange={(e) => handleTankChange(idx, 'liters15', e.target.value)}
                          className="w-28 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded text-blue-700 dark:text-blue-300 font-bold text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.001"
                          value={tank.metricTon}
                          onChange={(e) => handleTankChange(idx, 'metricTon', e.target.value)}
                          className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-right"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeTankRow(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                          disabled={tanks.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Auto-Calculated Rekonsiliasi & Tolerance Warning */}
          <div className={`p-4 rounded-xl border ${isToleranceExceeded ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800' : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isToleranceExceeded ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                )}
                4. Ringkasan Rekonsiliasi & Loss Control (% VS B/L)
              </h4>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isToleranceExceeded ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-600 text-white'}`}>
                {isToleranceExceeded ? '⚠️ TOLERANSI SUSUT TERLAMPAUI (> 0.5%)' : '✓ SUSUT DALAM TOLERANSI (< 0.5%)'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block">Total Diterima (@15°C)</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">{totalReceivedL15.toLocaleString()} L</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block">Acuan Bill of Lading (B/L)</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">{blL15.toLocaleString()} L</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block">Selisih (Shortage/Excess)</span>
                <span className={`text-base font-bold ${shortageL15 < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                  {shortageL15.toLocaleString()} L15
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block">Persentase Susut (% VS B/L)</span>
                <span className={`text-lg font-black ${isToleranceExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                  {percentageVsBL.toFixed(3)} %
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Signatures / Signatories */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">5. Penandatangan & Otorisasi Dokumen</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Loading Port</label>
                <input
                  type="text"
                  name="loadingPort"
                  value={formData.loadingPort}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Surveyor By</label>
                <input
                  type="text"
                  name="surveyorBy"
                  value={formData.surveyorBy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Prepared By (Spv Rec & Storage)</label>
                <input
                  type="text"
                  name="preparedBy"
                  value={formData.preparedBy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Checked By (Loading Master)</label>
                <input
                  type="text"
                  name="checkedBy"
                  value={formData.checkedBy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan CQD...' : 'Simpan Document CQD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

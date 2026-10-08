import React from 'react';
import { X, Printer, Ship, FileCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function CQDDetailModal({ isOpen, onClose, cqd }) {
  if (!isOpen || !cqd) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = cqd.cqdDate
    ? new Date(cqd.cqdDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden print:m-0 print:border-none print:shadow-none print:w-full">
        {/* Header Actions (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-xl">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Certificate of Quantity Discharge (CQD) - {cqd.noLODischarge}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dokumen Resmi Penerimaan & Pengukuran Kargo BBM dari Kapal Tanker
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> Cetak / Print CQD
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 font-sans text-slate-900 dark:text-slate-100 space-y-6 text-xs print:p-4 print:text-black">
          {/* Header Title */}
          <div className="border-b-2 border-slate-900 dark:border-slate-200 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                  Certificate of Quantity Discharge
                </h1>
                <h2 className="text-sm font-bold text-blue-700 dark:text-blue-400 print:text-black">
                  PT PERTAMINA PATRA NIAGA
                </h2>
                <p className="text-[10px] text-slate-500 print:text-slate-700">INTEGRATED TERMINAL BITUNG</p>
              </div>
              <div className="text-right space-y-1">
                <div className="text-xs font-mono font-bold">Date : {formattedDate}</div>
                <div className="text-xs font-mono">Time : {cqd.cqdTime || '14.10.46'}</div>
                <div className="mt-2 px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-mono font-bold rounded text-[11px] inline-block">
                  {cqd.noLODischarge}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-b border-slate-200 dark:border-slate-800 pb-4 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex"><span className="w-32 font-bold text-slate-500">Delivery by</span><span>: Vessel</span></div>
              <div className="flex"><span className="w-32 font-bold text-slate-500">Name of Vessel</span><span className="font-bold text-slate-900 dark:text-white">: {cqd.vesselName}</span></div>
              <div className="flex"><span className="w-32 font-bold text-slate-500">Loaded at</span><span>: {cqd.loadedAt}</span></div>
              <div className="flex"><span className="w-32 font-bold text-slate-500">External No</span><span>: {cqd.externalNo || '-'}</span></div>
              <div className="flex"><span className="w-32 font-bold text-slate-500">Discharge at</span><span>: {cqd.dischargeAt}</span></div>
              <div className="flex"><span className="w-32 font-bold text-slate-500">Status</span><span>: {cqd.psoType || 'PSO'}</span></div>
            </div>
            <div className="space-y-1">
              <div className="flex"><span className="w-32 font-bold text-slate-500">BAST NUMBER</span><span className="font-bold">: {cqd.bastNumber || '-'}</span></div>
              <div className="flex"><span className="w-32 font-bold text-slate-500">Material No</span><span className="font-bold text-blue-600 dark:text-blue-400">: {cqd.materialNo || cqd.product}</span></div>
              <div className="flex"><span className="w-32 font-bold text-slate-500">PO NUMBER</span><span>: {cqd.poNumber || '-'}</span></div>
              <div className="flex"><span className="w-32 font-bold text-slate-500">Product</span><span className="font-bold text-slate-900 dark:text-white">: {cqd.product}</span></div>
            </div>
          </div>

          {/* Table: Shore Sample & Product in Shore Tank */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse border border-slate-300 dark:border-slate-700 text-[11px] font-mono">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="border border-slate-300 dark:border-slate-700 p-1.5" rowSpan={2}>INDICATION</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1.5" rowSpan={2}>Tank No.</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1.5" rowSpan={2}>Date</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1.5" rowSpan={2}>Time</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1.5" colSpan={3}>Shore Sample</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1.5" colSpan={5}>Product in Shore Tank</th>
                </tr>
                <tr>
                  <th className="border border-slate-300 dark:border-slate-700 p-1">Test Dens</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1">Test Temp</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1">Dens 15°C</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1">Total Dip</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1">Net Prod (Obs) L</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1">Correction</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1 text-blue-700 dark:text-blue-300 font-bold">Liters 15°C</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1">Metric Ton</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {cqd.tanks && cqd.tanks.length > 0 ? (
                  cqd.tanks.map((t, i) => (
                    <tr key={t.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5 font-bold">{t.indication || 'NET'}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5 font-bold">{t.tankNo}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5">{formattedDate}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5">{t.time || '-'}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5">{t.testDensity || '-'}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5">{t.testTemp || '-'}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5 font-bold text-blue-600 dark:text-blue-400">{t.density15C || '-'}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5">{t.totalDip || '0'}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-right font-mono">{(t.netProductObsL || 0).toLocaleString()}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5">{t.correction || '0.988'}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-right font-bold text-blue-700 dark:text-blue-300">{(t.liters15 || 0).toLocaleString()}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-right">{(t.metricTon || 0).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="p-4 text-slate-400 italic">Tidak ada rincian tangki darat</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Reconciliation Table Summary */}
          <div className="space-y-2 font-mono">
            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2.5 rounded font-bold">
              <span>TOTAL QUANTITY RECEIVED IN SHORE TANK (@15°C)</span>
              <span className="text-base text-blue-600 dark:text-blue-400">{(cqd.totalReceivedLiters15 || 0).toLocaleString()} Liters</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2 rounded">
              <span>BILL OF LADING QUANTITY (B/L)</span>
              <span>{(cqd.blQuantityLiters15 || 0).toLocaleString()} Liters</span>
            </div>
            <div className={`flex justify-between items-center p-2.5 rounded font-bold border ${cqd.isToleranceExceeded ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
              <div className="flex items-center gap-2">
                {cqd.isToleranceExceeded ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                <span>SHORTAGE / EXCESS (% VS B/L)</span>
              </div>
              <div className="text-right">
                <span className="mr-4">{(cqd.shortageLiters15 || 0).toLocaleString()} Liters 15°C</span>
                <span className="text-sm font-black underline">{cqd.percentageVsBL}%</span>
              </div>
            </div>
          </div>

          {/* Tolerance Alert Message if Applicable */}
          {cqd.isToleranceExceeded && (
            <div className="p-3 bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200 rounded-lg text-xs font-semibold border border-rose-300 dark:border-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>PERINGATAN AUDIT LOSS CONTROL:</strong> Kargo mengalami persentase susut {cqd.percentageVsBL}% yang melebihi batas toleransi standar Pertamina (0.5%). Berita Acara Klaim & Investigasi QC wajib ditindaklanjuti.
              </div>
            </div>
          )}

          {/* Official Signatures Grid */}
          <div className="pt-8 grid grid-cols-5 gap-2 text-center text-[10px] font-mono border-t border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-500 mb-10">Loading Port</p>
              <p className="font-bold border-t border-slate-400 pt-1">{cqd.loadingPort || 'PT KRN'}</p>
            </div>
            <div>
              <p className="font-bold text-slate-500 mb-10">Surveyor by</p>
              <p className="font-bold border-t border-slate-400 pt-1">{cqd.surveyorBy || 'PT. TRS'}</p>
            </div>
            <div>
              <p className="font-bold text-slate-500 mb-10">Prepared by</p>
              <p className="font-bold border-t border-slate-400 pt-1">{cqd.preparedBy || 'Spv Fuel Rec & Sto'}</p>
            </div>
            <div>
              <p className="font-bold text-slate-500 mb-10">Checked by</p>
              <p className="font-bold border-t border-slate-400 pt-1">{cqd.checkedBy || 'Loading Master'}</p>
            </div>
            <div>
              <p className="font-bold text-slate-500 mb-10">Acknowledge by</p>
              <p className="font-bold border-t border-slate-400 pt-1">{cqd.acknowledgeBy || 'IT Manager Bitung'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

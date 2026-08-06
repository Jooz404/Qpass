import React from 'react';
import { MapPin, ShieldCheck, Clock, Battery, AlertTriangle, Truck } from 'lucide-react';

export default function AMTTrackingPermissionModal({ isOpen, onClose, onConfirm, loData }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Gradient */}
        <div className="relative p-6 bg-gradient-to-r from-red-600 via-rose-600 to-pertamina-blue text-white overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <MapPin className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-white/80">Sistem Q-Pass Bitung</span>
              <h2 className="text-xl font-bold">Akses Lokasi Pengiriman</h2>
            </div>
          </div>
          {loData && (
            <div className="mt-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-between text-sm">
              <span className="font-semibold text-white/90">No. LO: {loData.noLO}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{loData.spbu?.name || 'SPBU Tujuan'}</span>
            </div>
          )}
        </div>

        {/* Content & Information List */}
        <div className="p-6 space-y-4 text-slate-700 dark:text-slate-300">
          <p className="text-sm leading-relaxed">
            Untuk memastikan kelancaran dan keamanan distribusi BBM, sistem akan memantau lokasi armada tangki Anda selama perjalanan menuju SPBU.
          </p>

          <div className="space-y-3">
            {/* Feature 1 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">Privasi Terjaga</h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Pelacakan <b>hanya aktif</b> saat Anda mengonfirmasi tugas pengiriman (status <i>In-Transit</i>).
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0 mt-0.5">
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">Pantauan Real-Time Pengawas</h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Pengawas Lapangan & Admin dapat melihat estimasi kedatangan (ETA) dan memberikan bantuan jika ada kendala di rute.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
                <Battery className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">Otomatis Berhenti (Hemat Baterai)</h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Sistem pelacakan akan otomatis mati ketika pengiriman telah diselesaikan di SPBU.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Nanti Dulu
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:flex-1 py-3 px-5 text-sm font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-pertamina-blue hover:opacity-95 rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Izinkan & Mulai Pengiriman
          </button>
        </div>
      </div>
    </div>
  );
}

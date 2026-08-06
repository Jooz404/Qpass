import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus',
  message = 'Apakah Anda yakin ingin menghapus data ini?',
  confirmText = 'Hapus',
  cancelText = 'Batal',
  type = 'danger',
  loading = false
}) {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 z-10 overflow-hidden"
        >
          {/* Top Decorative bar */}
          <div className={`absolute top-0 inset-x-0 h-1.5 ${isDanger ? 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-emerald-500'}`} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center pt-2">
            {/* Warning Icon Badge */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg ${
              isDanger 
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shadow-red-500/10 ring-8 ring-red-50/50 dark:ring-red-950/20' 
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shadow-amber-500/10 ring-8 ring-amber-50/50 dark:ring-amber-950/20'
            }`}>
              {isDanger ? <Trash2 className="w-8 h-8 animate-pulse" /> : <AlertTriangle className="w-8 h-8" />}
            </div>

            {/* Title */}
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mb-7">
              {message}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isDanger
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/25'
                    : 'bg-gradient-to-r from-pertamina-blue to-blue-600 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/25'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

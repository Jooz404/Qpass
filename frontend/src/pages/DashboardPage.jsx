import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ClipboardList, MessageSquare, AlertTriangle, Star, Building2, Truck,
  UserCheck, TrendingUp, ArrowUpRight, RefreshCw, Sparkles, Activity,
  ShieldCheck, Clock3
} from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 110, damping: 18 } }
};

export default function DashboardPage() {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-activity'),
      ]);
      setStats(statsRes.data.data);
      setRecentActivity(activityRes.data.data);
    } catch (err) {
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-pertamina-red/20 blur-xl" />
          <div className="spinner relative" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500 animate-pulse">
          Mengambil Data Real-Time...
        </p>
      </div>
    );
  }

  const statCards = [
    { label: 'LO Hari Ini', value: stats?.totalLOToday || 0, icon: ClipboardList, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', change: 'Live', description: 'Jumlah Loading Order yang dibuat hari ini' },
    { label: 'Total Feedback', value: stats?.totalFeedback || 0, icon: MessageSquare, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', change: 'Aktif', description: 'Total feedback yang telah dikirim oleh SPBU' },
    { label: 'Feedback Hari Ini', value: stats?.feedbackToday || 0, icon: TrendingUp, color: 'from-violet-500 to-fuchsia-500', bg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', description: 'Feedback yang dikirim hari ini' },
    { label: 'Kondisi Kritis', value: stats?.highPriorityCount || 0, icon: AlertTriangle, color: 'from-rose-500 to-red-600', bg: 'bg-red-500/10 text-pertamina-red', alert: true, description: 'Feedback dengan status HIGH_PRIORITY yang memerlukan perhatian' },
    { label: 'Keluhan Terbuka', value: stats?.openComplaints || 0, icon: AlertTriangle, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', alert: (stats?.openComplaints || 0) > 0, description: 'Jumlah keluhan dengan status OPEN yang belum ditindaklanjuti' },
    { label: 'Rata-Rata Rating', value: stats?.avgRating || 0, icon: Star, color: 'from-yellow-400 to-amber-500', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', suffix: '/5', description: 'Rata-rata rating pelayanan AMT dari semua feedback' },
    { label: 'Jumlah SPBU', value: stats?.totalSpbu || 0, icon: Building2, color: 'from-cyan-500 to-sky-500', bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', description: 'Total SPBU yang terdaftar dalam sistem' },
    { label: 'Mobil Tangki', value: stats?.totalTrucks || 0, icon: Truck, color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', description: 'Total mobil tangki yang tersedia untuk pengiriman' },
    { label: 'Jumlah AMT', value: stats?.totalAmt || 0, icon: UserCheck, color: 'from-pink-500 to-rose-500', bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400', description: 'Total Awak Mobil Tangki yang aktif dalam sistem' },
  ];

  // Filter cards based on user role
  const visibleCards = (() => {
    if (user?.role === 'SPBU' || user?.role === 'PENGAWAS') {
      return [];
    }
    if (user?.role === 'ADMIN') {
      // Exclude Feedback Hari Ini, Kondisi Kritis, and Keluhan Terbuka for ADMIN
      return statCards.filter(card => 
        !['Feedback Hari Ini', 'Kondisi Kritis', 'Keluhan Terbuka'].includes(card.label)
      );
    }
    return statCards;
  })();

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/18 dark:from-slate-900 dark:via-slate-950 dark:to-black sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pertamina-red/30 blur-3xl" />
        <div className="absolute -bottom-24 left-20 h-64 w-64 rounded-full bg-pertamina-blue/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/75 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-pertamina-red-light" /> Sistem Testimonial Digital
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Selamat datang, {user?.name || 'User'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-300">
              {user?.role === 'SPBU'
                ? 'Pantau penerimaan BBM, riwayat feedback, dan status keluhan SPBU Anda dalam satu tampilan yang ringkas.'
                : 'Monitoring real-time kualitas dan kuantitas BBM — Integrated Terminal Bitung.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300"><Activity className="h-4 w-4 text-emerald-400" /> Status</div>
              <p className="mt-1 text-sm font-black">Online</p>
            </div>
            {user?.role === 'SPBU' && (
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300"><Building2 className="h-4 w-4 text-cyan-400" /> Lokasi</div>
                <p className="mt-1 text-sm font-black truncate max-w-[150px]">
                  {user?.lastLoginLat && user?.lastLoginLng 
                    ? `${user.lastLoginLat.toFixed(4)}, ${user.lastLoginLng.toFixed(4)}`
                    : user?.spbu?.address || 'Tidak tersedia'}
                </p>
              </div>
            )}
            <button
              onClick={fetchData}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0"
            >
              <RefreshCw className="mr-2 inline h-4 w-4" /> Segarkan
            </button>
          </div>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        {visibleCards.length > 0 ? (
          visibleCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                className="group premium-card relative overflow-hidden p-5"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.color}`} />
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-slate-100 blur-2xl transition group-hover:bg-slate-200 dark:bg-slate-800/60" />
                <div className="relative flex items-center gap-4">
                  <div className={`flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-2xl ${card.bg} shadow-sm`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      {card.label}
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <p className={`text-3xl font-black tracking-tight ${card.alert ? 'text-pertamina-red' : 'text-slate-950 dark:text-white'}`}>
                        {card.value}{card.suffix || ''}
                      </p>
                      {card.change && (
                        <span className="flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <ArrowUpRight className="h-3 w-3" /> {card.change}
                        </span>
                      )}
                    </div>
                    {card.description && (
                      <p className="mt-2 truncate text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        {card.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            variants={itemVariants}
            className="col-span-full premium-card p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-pertamina-red/10 text-pertamina-red">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tentang Q-PASS Bitung</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Q-PASS (Quality & Quantity Feedback System) adalah sistem testimonial digital terintegrasi untuk Integrated Terminal Bitung. 
                  Sistem ini memungkinkan monitoring real-time kualitas dan kuantitas BBM melalui feedback digital dari SPBU penerima.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Monitoring Kualitas BBM</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>Tracking Real-Time</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <MessageSquare className="h-4 w-4 text-violet-500" />
                    <span>Feedback Digital</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Manajemen Keluhan</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="premium-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-pertamina-red" /> Feedback Terbaru
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-500">Aktivitas penerimaan terkini dari SPBU.</p>
            </div>
            <span className="eyebrow"><Clock3 className="h-3 w-3" /> Live</span>
          </div>

          <div className="space-y-3.5">
            {recentActivity?.recentFeedbacks?.length > 0 ? (
              recentActivity.recentFeedbacks.slice(0, 5).map(fb => (
                <div
                  key={fb.id}
                  onClick={() => navigate(`/feedback-history/${fb.id}`)}
                  className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-slate-800/60 dark:bg-slate-800/35 dark:hover:bg-slate-800/70"
                >
                  <div className={`h-10 w-1.5 rounded-full ${fb.status === 'HIGH_PRIORITY' ? 'bg-pertamina-red' : 'bg-pertamina-green'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">
                      {fb.lo?.noLO} — {fb.lo?.spbu?.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {fb.lo?.product} • {'★'.repeat(fb.rating || 0)}
                    </p>
                  </div>
                  <span className={fb.status === 'HIGH_PRIORITY' ? 'badge-danger' : 'badge-success'}>
                    {fb.status === 'HIGH_PRIORITY' ? 'Kritis' : 'Normal'}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                <MessageSquare className="mx-auto h-9 w-9 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">Belum ada feedback pengiriman.</p>
              </div>
            )}
          </div>
        </div>

        <div className="premium-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" /> Keluhan Aktif
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-500">Daftar isu yang membutuhkan tindak lanjut.</p>
            </div>
            <span className="eyebrow">Action</span>
          </div>

          <div className="space-y-3.5">
            {recentActivity?.recentComplaints?.length > 0 ? (
              recentActivity.recentComplaints.slice(0, 5).map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/feedback-history/${c.feedbackId}`)}
                  className="flex cursor-pointer items-center gap-3.5 rounded-2xl border border-red-100 bg-red-50/50 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-red-950/40 dark:bg-red-950/12"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-pertamina-red shadow-sm dark:bg-slate-900">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">
                        {c.feedback?.lo?.noLO} — {c.feedback?.lo?.spbu?.name}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{c.description}</p>
                  </div>
                  <span className={c.status === 'OPEN' ? 'badge-danger' : 'badge-warning'}>
                    {c.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-8 text-center dark:border-emerald-950/40 dark:bg-emerald-950/12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-pertamina-green shadow-sm dark:bg-slate-900">
                  <Star className="h-7 w-7" />
                </div>
                <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">Semua Berjalan Normal</p>
                <p className="mt-1 text-xs text-slate-500">Tidak ada keluhan aktif dari SPBU saat ini.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

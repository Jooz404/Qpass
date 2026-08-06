import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Truck, 
  Star, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  QrCode,
  TrendingUp,
  Award,
  Zap,
  Flame,
  Sparkles
} from 'lucide-react';

export default function AMTDashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentLOs, setRecentLOs] = useState([]);
  const [pendingFeedback, setPendingFeedback] = useState([]);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [activeComplaints, setActiveComplaints] = useState([]);
  const [showAllLOs, setShowAllLOs] = useState(false);
  const [expandedLO, setExpandedLO] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent LOs for this AMT
      const loRes = await api.get('/amt/my-lo');
      setRecentLOs(loRes.data.data || []);
      
      // Fetch pending feedback (LOs that need AMT feedback)
      const feedbackRes = await api.get('/amt-feedback/my');
      const submittedLOIds = feedbackRes.data.data.map(f => f.loId);
      
      const pending = loRes.data.data.filter(lo => 
        lo.status === 'DELIVERED' && !submittedLOIds.includes(lo.id)
      );
      setPendingFeedback(pending);
      
      // Fetch AMT feedback history
      setRecentFeedbacks(feedbackRes.data.data || []);
      
      // Fetch complaints for this AMT
      const complaintsRes = await api.get('/complaints');
      const amtComplaints = complaintsRes.data.data.filter(c => 
        c.feedback?.lo?.amtId === user?.amtId || 
        c.feedback?.lo?.secondaryAmtId === user?.amtId
      );
      setActiveComplaints(amtComplaints.filter(c => c.status === 'OPEN'));
      
      // Fetch SPBU feedback for this AMT (rating yang diberikan SPBU ke AMT)
      const spbuFeedbackRes = await api.get('/feedback');
      const amtFeedbackFromSPBU = spbuFeedbackRes.data.data.filter(f => 
        f.lo?.amtId === user?.amtId || f.lo?.secondaryAmtId === user?.amtId
      );
      
      // Calculate stats
      const totalLOs = loRes.data.data.length || 0;
      const completedLOs = loRes.data.data.filter(lo => lo.status === 'COMPLETED').length || 0;
      const totalFeedback = amtFeedbackFromSPBU.length || 0;
      
      // Calculate average ratings from SPBU feedback (rating yang diberikan SPBU ke AMT)
      const avgRating = totalFeedback > 0 
        ? amtFeedbackFromSPBU.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
        : 0;
      
      // Calculate performance score (0-100)
      const performanceScore = avgRating * 20;
      
      setStats({
        totalLOs,
        completedLOs,
        pendingFeedback: pending.length,
        totalFeedback,
        avgRating: avgRating.toFixed(1),
        performanceScore: performanceScore.toFixed(1),
        activeComplaints: activeComplaints.length
      });
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGiveFeedback = (loId) => {
    navigate(`/amt-feedback/${loId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200/50 to-slate-300/50 dark:from-slate-800/30 dark:to-slate-700/30 rounded-3xl blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-400 dark:to-slate-500 rounded-2xl shadow-lg shadow-slate-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                Dashboard AMT
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 ml-14">
              Selamat datang kembali, <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.name}</span> 👋
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Pengiriman */}
          <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-300/50 dark:hover:shadow-slate-800/50 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-slate-200/50 dark:from-slate-700/30 dark:to-slate-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-slate-500 to-slate-600 dark:from-slate-400 dark:to-slate-500 rounded-2xl shadow-md shadow-slate-500/20 group-hover:scale-110 transition-transform duration-500">
                  <Truck className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Pengiriman</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
                {stats?.totalLOs || 0}
              </p>
              <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-slate-500 to-slate-600 dark:from-slate-400 dark:to-slate-500 rounded-full transition-all duration-1000" style={{ width: '75%' }} />
              </div>
            </div>
          </div>

          {/* Selesai */}
          <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-300/50 dark:hover:shadow-slate-800/50 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-green-100/50 dark:from-emerald-900/20 dark:to-green-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 rounded-2xl shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Selesai</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                {stats?.completedLOs || 0}
              </p>
              <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 rounded-full transition-all duration-1000" style={{ width: `${stats?.totalLOs > 0 ? (stats?.completedLOs / stats?.totalLOs * 100) : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Feedback Pending */}
          <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700/50 hover:shadow-xl hover:shadow-amber-300/50 dark:hover:shadow-amber-900/30 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 rounded-2xl shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                {stats?.pendingFeedback > 0 && (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm font-semibold bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full animate-pulse">
                    <Zap className="w-3 h-3" />
                    <span>Urgent</span>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Feedback Pending</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                {stats?.pendingFeedback || 0}
              </p>
              <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 rounded-full transition-all duration-1000 ${stats?.pendingFeedback > 0 ? 'animate-pulse' : ''}`} style={{ width: `${stats?.pendingFeedback > 0 ? Math.min(stats?.pendingFeedback * 20, 100) : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Skor Kinerja */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 shadow-lg shadow-slate-500/20 hover:shadow-xl hover:shadow-slate-600/30 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl group-hover:scale-110 transition-transform duration-500">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-white/70 text-sm font-semibold bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Flame className="w-3 h-3" />
                  <span>Top</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-white/70 mb-1">Skor Kinerja</p>
              <p className="text-4xl font-bold text-white">
                {stats?.performanceScore || 0}
              </p>
              <p className="text-xs text-white/60 mt-1">
                Rating: {stats?.avgRating || 0}/5 ⭐
              </p>
              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-white/60 to-white/40 rounded-full transition-all duration-1000" style={{ width: `${stats?.performanceScore || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Feedback Section */}
        {pendingFeedback.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/20 mb-8 animate-fade-in border border-amber-200 dark:border-amber-800/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-md shadow-amber-500/20">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Feedback yang Perlu Diberikan</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Segera lengkapi feedback untuk pengiriman ini</p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-full">
                  <span className="text-amber-700 dark:text-amber-300 font-bold">{pendingFeedback.length} Pending</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {pendingFeedback.map((lo) => (
                  <div
                    key={lo.id}
                    className="group flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl hover:bg-white/80 dark:hover:bg-slate-800/70 transition-all duration-300 border border-amber-200 dark:border-amber-800/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {lo.noLO}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {lo.spbu?.name} - {lo.product}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleGiveFeedback(lo.id)}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105"
                    >
                      Beri Feedback
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Feedback */}
        {recentFeedbacks.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700/50 mb-8 animate-slide-up">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-md shadow-purple-500/20">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Feedback Terbaru</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Riwayat feedback yang telah diberikan</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/feedback-history')}
                  className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
                >
                  Lihat Semua
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="space-y-3">
                {recentFeedbacks.slice(0, 5).map((feedback, index) => (
                  <div
                    key={feedback.id}
                    className="group flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-purple-50 dark:from-slate-800/50 dark:to-purple-900/20 rounded-2xl hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all duration-300 border border-slate-100 dark:border-slate-700/50 hover:border-purple-200 dark:hover:border-purple-700/50"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {feedback.lo?.noLO}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {feedback.spbu?.name} - Rating: {feedback.ratingKeseluruhan}/5
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(feedback.createdAt).toLocaleDateString('id-ID')}
                      </span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < feedback.ratingKeseluruhan
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Complaints */}
        {activeComplaints.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 shadow-lg shadow-red-200/50 dark:shadow-red-900/20 mb-8 animate-slide-up border border-red-200 dark:border-red-800/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-md shadow-red-500/20">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Keluhan Aktif</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Perlu perhatian segera</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/complaints')}
                  className="group flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/10 backdrop-blur-sm text-red-700 dark:text-red-300 font-semibold rounded-xl hover:bg-white/70 dark:hover:bg-white/20 transition-all duration-300 hover:scale-105"
                >
                  Lihat Semua
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="space-y-3">
                {activeComplaints.slice(0, 5).map((complaint, index) => (
                  <div
                    key={complaint.id}
                    className="group flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl hover:bg-white/80 dark:hover:bg-slate-800/70 transition-all duration-300 border border-red-200 dark:border-red-800/30"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {complaint.feedback?.lo?.noLO}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {complaint.description?.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <span className="text-red-700 dark:text-red-300 text-xs font-bold">{complaint.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent LOs */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700/50 animate-slide-up">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-100/50 to-cyan-100/50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full blur-3xl" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-600 dark:from-slate-400 dark:to-slate-500 rounded-2xl shadow-md shadow-slate-500/20">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Pengiriman Terbaru</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Riwayat pengiriman terbaru</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllLOs(!showAllLOs)}
                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 dark:from-slate-400 dark:to-slate-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-slate-500/30 transition-all duration-300 hover:scale-105"
              >
                {showAllLOs ? 'Tampilkan Sedikit' : 'Lihat Semua'}
                <ChevronRight className={`w-4 h-4 transition-transform ${showAllLOs ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {recentLOs.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-3xl mb-4">
                  <Truck className="w-12 h-12 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">Belum ada pengiriman</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(showAllLOs ? recentLOs : recentLOs.slice(0, 5)).map((lo, index) => (
                  <div key={lo.id}>
                    <div
                      onClick={() => setExpandedLO(expandedLO === lo.id ? null : lo.id)}
                      className="group flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-2xl hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 transition-all duration-300 border border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-700/50 cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                          lo.status === 'COMPLETED' 
                            ? 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30' 
                            : lo.status === 'DELIVERED'
                            ? 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30'
                            : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700'
                        }`}>
                          <Truck className={`w-5 h-5 ${
                            lo.status === 'COMPLETED' 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : lo.status === 'DELIVERED'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">
                            {lo.noLO}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {lo.spbu?.name} - {lo.product}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          lo.status === 'COMPLETED' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : lo.status === 'DELIVERED'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {lo.status}
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedLO === lo.id ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    
                    {expandedLO === lo.id && (
                      <div className="mt-2 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Tanggal</p>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {new Date(lo.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Volume</p>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {lo.volume.toLocaleString()} Liter
                            </p>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">SPBU</p>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {lo.spbu?.name}
                            </p>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Truk</p>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {lo.truck?.nopol}
                            </p>
                          </div>
                        </div>
                        {lo.status === 'DELIVERED' && (
                          <button
                            onClick={() => handleGiveFeedback(lo.id)}
                            className="mt-4 w-full py-3 bg-gradient-to-r from-slate-500 to-slate-600 dark:from-slate-400 dark:to-slate-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-slate-500/30 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <Star className="w-4 h-4" />
                            Beri Feedback
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

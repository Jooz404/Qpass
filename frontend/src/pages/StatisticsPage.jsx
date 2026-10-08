import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { BarChart3, TrendingUp, HelpCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend
);

export default function StatisticsPage() {
  const toast = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [spbuData, setSpbuData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/dashboard/charts/monthly', { params: { year: selectedYear } }),
      api.get('/dashboard/charts/products'),
      api.get('/dashboard/charts/spbu-performance'),
    ]).then(([monthly, products, spbu]) => {
      setMonthlyData(monthly.data.data);
      setProductData(products.data.data);
      setSpbuData(spbu.data.data);
      setLoading(false);
    }).catch(() => {
      toast.error('Gagal memuat data statistik');
      setLoading(false);
    });
  }, [selectedYear]);

  // Aggregate stats for Top Summary Cards
  const totalLOYear = monthlyData.reduce((sum, m) => sum + (m.loCount || 0), 0);
  const totalFeedbackYear = monthlyData.reduce((sum, m) => sum + (m.feedbackCount || 0), 0);
  const totalHighPriorityYear = monthlyData.reduce((sum, m) => sum + (m.highPriorityCount || 0), 0);
  const avgRatingYear = (monthlyData.filter(m => m.avgRating > 0).reduce((sum, m) => sum + m.avgRating, 0) / (monthlyData.filter(m => m.avgRating > 0).length || 1)).toFixed(1);

  // 1. Line Chart: Bulanan (LO vs Feedbacks)
  const lineChartData = {
    labels: monthlyData.map(m => m.monthName),
    datasets: [
      {
        label: 'Total Loading Order',
        data: monthlyData.map(m => m.loCount),
        borderColor: '#003D7C',
        backgroundColor: '#003D7C',
        tension: 0.3,
      },
      {
        label: 'Feedback Diterima',
        data: monthlyData.map(m => m.feedbackCount),
        borderColor: '#E30613',
        backgroundColor: '#E30613',
        tension: 0.3,
      },
    ],
  };

  // 2. Bar Chart: Feedback Kritis vs Normal Bulanan
  const barChartData = {
    labels: monthlyData.map(m => m.monthName),
    datasets: [
      {
        label: 'High Priority (Kritis)',
        data: monthlyData.map(m => m.highPriorityCount),
        backgroundColor: '#E30613',
      },
      {
        label: 'Normal',
        data: monthlyData.map(m => m.feedbackCount - m.highPriorityCount),
        backgroundColor: '#10b981',
      },
    ],
  };

  // 3. Doughnut Chart: Top 5 SPBU Distribusi Terbanyak + "Lainnya"
  const sortedSpbu = [...spbuData].sort((a, b) => b.totalLO - a.totalLO);
  const top5Spbu = sortedSpbu.slice(0, 5);
  const otherSpbuLO = sortedSpbu.slice(5).reduce((sum, s) => sum + s.totalLO, 0);

  const spbuDoughnutLabels = [...top5Spbu.map(s => s.name), ...(otherSpbuLO > 0 ? ['SPBU Lainnya'] : [])];
  const spbuDoughnutData = [...top5Spbu.map(s => s.totalLO), ...(otherSpbuLO > 0 ? [otherSpbuLO] : [])];

  const doughnutSpbuChartData = {
    labels: spbuDoughnutLabels,
    datasets: [
      {
        data: spbuDoughnutData,
        backgroundColor: ['#003D7C', '#E30613', '#f59e0b', '#10b981', '#6366f1', '#94a3b8'],
        borderWidth: 1,
      },
    ],
  };

  const yearsOptions = [2026, 2025, 2024];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Year Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-pertamina-red" /> Grafik Analisis & Statistik
          </h1>
          <p className="text-sm text-gray-500">Visualisasi data dan tren distribusi Q-Pass Bitung</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Periode Tahun:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="input-field py-2 px-3 text-xs font-bold w-auto"
          >
            {yearsOptions.map(y => <option key={y} value={y}>Tahun {y}</option>)}
          </select>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex flex-col justify-between">
          <p className="text-xs text-gray-400 uppercase font-semibold">Total LO (Tahun {selectedYear})</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalLOYear.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <p className="text-xs text-gray-400 uppercase font-semibold">Total Feedback</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totalFeedbackYear.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <p className="text-xs text-gray-400 uppercase font-semibold">Keluhan Kritis</p>
          <p className="text-2xl font-bold text-red-500 mt-2">{totalHighPriorityYear.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <p className="text-xs text-gray-400 uppercase font-semibold">Rata-rata Rating</p>
          <p className="text-2xl font-bold text-amber-500 mt-2 flex items-center gap-1">
            ⭐ {avgRatingYear} / 5.0
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1 */}
          <div className="glass-card p-5">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Pengiriman vs Feedback ({selectedYear})</h3>
            <div className="h-64">
              <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Perbandingan tren pengiriman Loading Order dan respons feedback per bulan pada tahun {selectedYear}.
            </p>
          </div>

          {/* Chart 2 */}
          <div className="glass-card p-5">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Distribusi Keluhan ({selectedYear})</h3>
            <div className="h-64">
              <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} />
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Distribusi perbandingan feedback Normal vs Kritis (High Priority) setiap bulan.
            </p>
          </div>

          {/* Chart 3: Top SPBU */}
          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Pangsa Pengiriman per Top SPBU</h3>
            <div className="h-64 flex justify-center">
              <Doughnut data={doughnutSpbuChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-tight text-center">
              Komposisi pengiriman BBM ke 5 SPBU tujuan terbesar dan akumulasi SPBU lainnya agar grafik tetap bersih.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

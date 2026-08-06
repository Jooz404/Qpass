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
  const [monthlyData, setMonthlyData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [spbuData, setSpbuData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/charts/monthly'),
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

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
        label: 'High Priority (Masalah)',
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

  // 3. Doughnut Chart: Pembagian Produk
  const doughnutData = {
    labels: productData.map(p => p.product),
    datasets: [
      {
        data: productData.map(p => p.totalLO),
        backgroundColor: ['#E30613', '#003D7C', '#f59e0b', '#10b981', '#6366f1'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-pertamina-red" /> Statistik & Grafik Analisis
        </h1>
        <p className="text-sm text-gray-500">Visualisasi data Q-Pass Bitung</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="glass-card p-5">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Pengiriman vs Feedback</h3>
          <div className="h-64">
            <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-tight">
            Perbandingan antara jumlah Loading Order yang dikirim dengan feedback yang diterima setiap bulan untuk memantau tingkat responsivitas SPBU.
          </p>
        </div>

        {/* Chart 2 */}
        <div className="glass-card p-5">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Keluhan Bulanan</h3>
          <div className="h-64">
            <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} />
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-tight">
            Distribusi feedback berdasarkan prioritas (High Priority vs Normal) per bulan untuk mengidentifikasi tren masalah kualitas BBM.
          </p>
        </div>

        {/* Chart 3 */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Persentase Pengiriman per Produk</h3>
          <div className="h-64 flex justify-center">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-tight">
            Komposisi pengiriman BBM berdasarkan jenis produk untuk melihat distribusi dan preferensi produk yang dikirim dari Terminal Bitung.
          </p>
        </div>
      </div>
    </div>
  );
}

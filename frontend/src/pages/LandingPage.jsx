import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, QrCode, LogIn, LayoutDashboard, Fuel, ArrowRight, CheckCircle2, MapPin, Award, Zap, BarChart3, Users, Globe } from 'lucide-react';
import Logo from '../components/Logo';

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans text-slate-900 dark:text-white overflow-hidden relative">
      
      {/* Animated gradient backgrounds */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-pertamina-red/8 via-pertamina-red/4 to-transparent blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-pertamina-blue/8 via-pertamina-blue/4 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-gradient-to-r from-amber-500/4 via-transparent to-emerald-500/4 blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50' 
          : 'bg-gradient-to-r from-white/90 via-white/80 to-white/90 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-slate-950/90 backdrop-blur-md border-b border-slate-100/50 dark:border-slate-800/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          <Logo variant="horizontal" height="42" />
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => navigate('/login')} 
              className="text-xs sm:text-sm font-bold text-slate-600 hover:text-pertamina-red dark:text-slate-300 dark:hover:text-pertamina-red transition-colors duration-300 whitespace-nowrap"
            >
              Masuk Portal
            </button>
            <button 
              onClick={() => navigate('/scan-qr')} 
              className="btn-primary py-2 px-3 sm:py-2.5 sm:px-5 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-pertamina-red to-pertamina-red-dark hover:from-pertamina-red-dark hover:to-pertamina-red text-white rounded-xl shadow-lg shadow-pertamina-red/25 hover:shadow-pertamina-red/35 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Scan QR LO
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Professional Gradient Background */}
      <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 lg:pt-40 lg:py-28 overflow-hidden">
        {/* Professional Gradient Background */}
        <div className="absolute inset-0 -z-20">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pertamina-red/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pertamina-blue/20 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-pertamina-red/10 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-pertamina-blue/10 to-transparent blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
          
          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pertamina-red/20 to-pertamina-blue/20 border border-pertamina-red/30 text-xs font-bold text-pertamina-red uppercase tracking-wider shadow-sm backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4" /> Integrated Terminal Bitung
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              Digital Quality &<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pertamina-red via-pertamina-red-dark to-pertamina-blue animate-gradient">
                Quantity Feedback
              </span>
              <br />System
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-lg lg:text-xl leading-relaxed max-w-xl font-medium">
              Q-PASS hadir untuk mempercepat, memverifikasi, dan menjamin kualitas serta kuantitas BBM yang disalurkan dari Terminal BBM Bitung menuju SPBU tujuan secara real-time dengan presisi tinggi.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <button
                onClick={() => navigate('/login')}
                className="group relative py-3 px-6 sm:py-3.5 sm:px-8 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 font-bold text-sm sm:text-base text-white shadow-xl shadow-pertamina-red/25 hover:shadow-pertamina-red/35 active:scale-95 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden w-full sm:w-auto"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pertamina-red/95 via-pertamina-red-dark/90 to-pertamina-red/95 group-hover:from-pertamina-red-dark/95 group-hover:via-pertamina-red/90 group-hover:to-pertamina-red-dark/95 transition-colors duration-300" />
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                <span className="relative z-10">Masuk Portal</span>
              </button>

              <button
                onClick={() => navigate('/scan-qr')}
                className="group relative py-3 px-6 sm:py-3.5 sm:px-8 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 font-bold text-sm sm:text-base text-white shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden w-full sm:w-auto"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pertamina-blue/95 via-pertamina-blue-dark/90 to-pertamina-blue/95 group-hover:from-pertamina-blue-dark/95 group-hover:via-pertamina-blue/90 group-hover:to-pertamina-blue-dark/95 transition-colors duration-300" />
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                <span className="relative z-10">Scan QR Order</span>
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Aman & Terkunci</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                <div className="w-10 h-10 rounded-xl bg-pertamina-red/10 dark:bg-pertamina-red/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-pertamina-red" />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Standar Pertamina</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Real-Time</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Illustration Cards with Pertamina imagery */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {/* Main Terminal Bitung card with image */}
            <div className="col-span-1 sm:col-span-2 glass-card p-0 text-white border-none rounded-3xl shadow-2xl overflow-hidden h-56 relative">
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url("/pt8.jpg")',
                  backgroundPosition: 'center'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/65 to-slate-900/50" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/20 to-transparent" />
              
              <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-pertamina-red uppercase">PT Pertamina</span>
                  <h3 className="text-2xl font-black mt-2">Integrated Terminal Bitung</h3>
                  <p className="text-sm text-slate-200 mt-3 max-w-sm leading-relaxed">
                    Pusat verifikasi digital, pengisian Loading Order, dan monitoring distribusi BBM berkualitas standar Pertamina.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <span className="text-xs font-bold text-pertamina-red">Integrated Terminal Bitung</span>
                    <span className="w-2 h-2 rounded-full bg-pertamina-green animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobil Tangki card */}
            <div className="glass-card p-0 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between h-52 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/80 dark:to-slate-900/50 overflow-hidden relative">
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop")',
                  backgroundPosition: 'center'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
              <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pertamina-red/90 to-pertamina-red-dark flex items-center justify-center text-white shadow-lg">
                  <Fuel className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-lg text-white">Mobil Tangki & AMT</h4>
                  <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                    Verifikasi plat nomor tangki, awak mobil tangki, dan status segel pengiriman BBM.
                  </p>
                </div>
              </div>
            </div>

            {/* SPBU card */}
            <div className="glass-card p-0 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between h-52 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/80 dark:to-slate-900/50 overflow-hidden relative">
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=2072&auto=format&fit=crop")',
                  backgroundPosition: 'center'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
              <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pertamina-blue/90 to-pertamina-blue-dark flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-lg text-white">Validasi SPBU</h4>
                  <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                    Uji densitas, volume tera, dan visual produk di SPBU tujuan penerima BBM.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/pt9.jpg")',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pertamina-red/10 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Statistik Kinerja</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">Q-PASS memberikan akurasi dan keandalan tinggi dalam setiap proses verifikasi BBM</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, value: '100%', label: 'Akurasi Uji', desc: 'Presisi tinggi dalam pengujian', color: 'from-pertamina-red to-pertamina-red-dark' },
              { icon: Zap, value: 'Real-Time', label: 'Monitoring', desc: 'Update data langsung', color: 'from-pertamina-blue to-pertamina-blue-dark' },
              { icon: Users, value: '24/7', label: 'Dukungan', desc: 'Layanan tanpa henti', color: 'from-emerald-500 to-emerald-600' },
              { icon: Globe, value: 'Digital', label: 'Terintegrasi', desc: 'Sistem terhubung penuh', color: 'from-amber-500 to-amber-600' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center mb-4 shadow-lg group-hover:from-white/30 group-hover:to-white/20 transition-all">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                  <p className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{stat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800/80 py-10 bg-white/80 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <p>© 2026 Q-PASS Bitung — Integrated Terminal Bitung. PT Pertamina (Persero).</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">Panduan Pengguna</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">Kebijakan Privasi</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">Bantuan</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff, Shield, LogIn, ChevronRight, Fuel, Zap, Award, CheckCircle2, UserPlus, Mail, User, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import api from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [spbuCode, setSpbuCode] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('SPBU');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) { 
      toast.warning('Username dan password wajib diisi'); 
      return; 
    }
    setLoading(true);
    try {
      console.log('Attempting login with:', username);
      const user = await login(username, password, {});
      console.log('Login successful:', user);
      toast.success(`Selamat datang kembali, ${user.name}!`);
      
      // Redirect based on role
      if (user.role === 'AMT') {
        navigate('/amt-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.message || 'Login gagal. Silakan periksa kembali username & password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !username || !password || !spbuCode) { 
      toast.warning('Semua field wajib diisi'); 
      return; 
    }
    if (role === 'SPBU' && !address) {
      toast.warning('Alamat SPBU wajib diisi');
      return;
    }
    if (password.length < 6) {
      toast.warning('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { name, username, password, spbuCode, role, address });
      toast.success('Registrasi berhasil! Silakan login.');
      setIsLogin(true);
      setPassword('');
      setSpbuCode('');
      setAddress('');
      setName('');
      setUsername('');
      setRole('SPBU');
    } catch (err) {
      toast.error(err.response?.data?.message || `Registrasi gagal. ${role === 'AMT' ? 'NIP AMT' : 'Kode SPBU'} mungkin tidak valid.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col lg:flex-row relative overflow-hidden font-sans">
      
      {/* Animated gradient backgrounds */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-pertamina-red/8 via-pertamina-red/4 to-transparent blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-pertamina-blue/8 via-pertamina-blue/4 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-gradient-to-r from-amber-500/4 via-transparent to-emerald-500/4 blur-3xl" />
      </div>

      {/* Left side: Premium Corporate Identity & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-pertamina-red/5 via-white to-pertamina-blue/5 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-16 flex-col justify-between relative border-r border-slate-200/50 dark:border-slate-800/30">
        
        {/* Top Branding logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Logo variant="horizontal" height="68" />
        </motion.div>

        {/* Center Illustration/Welcome Message */}
        <div className="my-auto max-w-lg space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pertamina-red/10 to-pertamina-blue/10 dark:from-pertamina-red/20 dark:to-pertamina-blue/20 border border-pertamina-red/20 dark:border-pertamina-red/30 text-xs font-bold text-pertamina-red uppercase tracking-wider shadow-sm">
              <Shield className="w-4 h-4" /> Secure Enterprise Portal
            </span>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              Akselerasi Digital <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pertamina-red via-pertamina-red-dark to-pertamina-blue">
                Quality & Quantity
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base lg:text-lg leading-relaxed font-medium">
              Sistem Testimonial Digital Terintegrasi Q-PASS untuk monitoring kualitas dan kuantitas BBM yang akurat, transparan, dan real-time di seluruh SPBU Integrated Terminal Bitung.
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-1 gap-4"
          >
            {[
              { icon: CheckCircle2, title: 'Verifikasi Digital', desc: 'Validasi otomatis segel dan volume BBM' },
              { icon: Zap, title: 'Real-Time Feedback', desc: 'Monitoring langsung dari SPBU penerima' },
              { icon: Award, title: 'Standar Pertamina', desc: 'Kepatuhan penuh standar HSSE & SOP' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pertamina-red/10 to-pertamina-blue/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-pertamina-red" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-slate-400 font-medium"
        >
          © 2026 Integrated Terminal Bitung. PT Pertamina (Persero)
        </motion.div>
      </div>

      {/* Right side: Modern Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 relative">
        
        {/* Back Link to Landing Page */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 right-6 text-xs text-slate-500 hover:text-pertamina-red dark:hover:text-pertamina-red font-bold flex items-center gap-1 transition-colors duration-300"
        >
          Kembali ke Beranda <ChevronRight className="w-4 h-4" />
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md space-y-8"
        >
          {/* Logo on mobile view only */}
          <div className="lg:hidden flex justify-center mb-6">
            <Logo variant="vertical" height="76" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isLogin ? 'Masuk Sistem' : 'Daftar Akun'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {isLogin 
                ? 'Silakan masukkan kredensial akun Anda untuk mengakses dashboard'
                : 'Buat akun baru untuk mengakses sistem Q-PASS'
              }
            </p>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Tipe Akun
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('SPBU')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      role === 'SPBU'
                        ? 'border-pertamina-red bg-pertamina-red/5 text-pertamina-red'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-pertamina-red/50'
                    }`}
                  >
                    <Fuel className="w-6 h-6" />
                    <span className="font-semibold text-sm">SPBU</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('AMT')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      role === 'AMT'
                        ? 'border-pertamina-red bg-pertamina-red/5 text-pertamina-red'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-pertamina-red/50'
                    }`}
                  >
                    <Zap className="w-6 h-6" />
                    <span className="font-semibold text-sm">AMT</span>
                  </button>
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {role === 'SPBU' ? 'Nama SPBU' : 'Nama Lengkap'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200"
                  placeholder="username"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {role === 'AMT' ? 'NIP AMT' : 'Kode SPBU'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={spbuCode}
                    onChange={e => setSpbuCode(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200"
                    placeholder={role === 'AMT' ? '7171010101010001' : '74.951.01'}
                    required
                  />
                </div>
              </div>
            )}

            {!isLogin && role === 'SPBU' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Alamat SPBU
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200"
                    placeholder="Jl. Sam Ratulangi No.1, Bitung"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Fuel className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pertamina-red transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pertamina-red to-pertamina-red-dark hover:from-pertamina-red-dark hover:to-pertamina-red text-white font-bold rounded-xl transition-all duration-300 shadow-xl shadow-pertamina-red/25 hover:shadow-pertamina-red/35 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isLogin ? 'Memverifikasi...' : 'Mendaftar...'}</span>
                </>
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  <span>{isLogin ? 'Masuk Portal' : 'Daftar Akun'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle between login and register */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setPassword('');
              }}
              className="text-sm font-bold text-slate-600 hover:text-pertamina-red dark:text-slate-400 dark:hover:text-pertamina-red transition-colors duration-300"
            >
              {isLogin 
                ? 'Belum punya akun? Daftar sekarang' 
                : 'Sudah punya akun? Masuk sekarang'
              }
            </button>
          </div>


          
          {/* Footer for mobile view */}
          <p className="lg:hidden text-center text-xs text-slate-400">
            © 2026 Integrated Terminal Bitung
          </p>
        </motion.div>
      </div>

    </div>
  );
}

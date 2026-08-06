import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, MapPin, BarChart3, Truck, Users, Building2,
  ClipboardList, Bell, LogOut, Menu, X, Moon, Sun, ChevronDown, Settings,
  AlertTriangle, History, UserCheck, QrCode, Sparkles
} from 'lucide-react';
import api from '../services/api';
import Logo from './Logo';

const adminLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/monitoring', label: 'Live Monitoring', icon: BarChart3 },
  { path: '/loading-orders', label: 'Loading Orders', icon: ClipboardList },
  { path: '/feedback-history', label: 'Riwayat Feedback', icon: History },
  { path: '/complaints', label: 'Keluhan', icon: AlertTriangle },
  { path: '/statistics', label: 'Statistik', icon: BarChart3 },
  { path: '/map', label: 'Peta SPBU', icon: MapPin },
  { path: '/spbu', label: 'Data SPBU', icon: Building2 },
  { path: '/trucks', label: 'Mobil Tangki', icon: Truck },
  { path: '/amt', label: 'Awak MT', icon: UserCheck },
  { path: '/users', label: 'Pengguna', icon: Users },
];

const pengawasLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/monitoring', label: 'Live Monitoring', icon: BarChart3 },
  { path: '/loading-orders', label: 'Loading Orders', icon: ClipboardList },
  { path: '/feedback-history', label: 'Riwayat Feedback', icon: History },
  { path: '/complaints', label: 'Keluhan', icon: AlertTriangle },
  { path: '/statistics', label: 'Statistik', icon: BarChart3 },
  { path: '/map', label: 'Peta SPBU', icon: MapPin },
  { path: '/trucks', label: 'Rapor Mobil Tangki', icon: Truck },
  { path: '/amt', label: 'Rapor AMT', icon: UserCheck },
];

const spbuLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/scan-qr', label: 'Scan QR Code', icon: QrCode },
  { path: '/feedback-history', label: 'Riwayat Penerimaan', icon: History },
  { path: '/complaints', label: 'Keluhan SPBU', icon: AlertTriangle },
];

const amtLinks = [
  { path: '/amt-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/feedback-history', label: 'Riwayat Feedback', icon: History },
  { path: '/complaints', label: 'Keluhan', icon: AlertTriangle },
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return photoPath;
  };

  const links = user?.role === 'ADMIN' 
    ? adminLinks 
    : user?.role === 'SPBU' 
      ? spbuLinks 
      : user?.role === 'AMT'
        ? amtLinks
        : pengawasLinks;

  useEffect(() => {
    api.get('/notifications').then(res => {
      setNotifCount(res.data.data.unreadCount || 0);
    }).catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine active bottom nav path
  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden bg-transparent font-sans pb-16 lg:pb-0">
      
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72
        bg-white/88 dark:bg-slate-950/82 backdrop-blur-2xl border-r border-white/70 dark:border-slate-800/70
        transform transition-transform duration-300 ease-in-out shadow-2xl shadow-slate-900/10 lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="relative flex items-center gap-3 px-6 py-5 border-b border-white/70 dark:border-slate-800/60">
          <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-pertamina-red/30 to-transparent" />
          <Logo variant="horizontal" height="56" />
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links for Sidebar */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {links.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setSidebarOpen(false); }}
                className={`relative flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl transition-all duration-200 text-sm font-bold group overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-pertamina-red to-pertamina-red-dark text-white shadow-lg shadow-pertamina-red/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/70 hover:text-slate-950 dark:hover:text-white hover:shadow-sm'
                }`}
              >
                {isActive && <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />}
                <Icon className={`relative w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-pertamina-red'
                }`} />
                <span className="relative">{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile bottom corner */}
        <div className="p-4 border-t border-white/70 dark:border-slate-800/60">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/78 p-3 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
            {user?.avatar ? (
              <img 
                src={getPhotoUrl(user.avatar)} 
                alt="Profile" 
                className="w-9 h-9 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pertamina-red to-pertamina-blue flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">{user?.name?.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{user?.name}</p>
              <span className="text-[10px] font-bold text-pertamina-blue uppercase tracking-wider">{user?.role}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white/74 dark:bg-slate-950/72 backdrop-blur-2xl border-b border-white/70 dark:border-slate-800/70 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 z-30 shadow-sm">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="lg:hidden p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Quick Branding for mobile */}
          <div className="lg:hidden flex items-center min-w-0 max-w-[170px] xs:max-w-[220px] overflow-hidden">
            <Logo variant="horizontal" height="28" />
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/72 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-pertamina-red" />
            Integrated Terminal Bitung
          </div>

          <div className="flex-1" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Ganti Tema"
          >
            {darkMode ? <Sun className="w-5.5 h-5.5" /> : <Moon className="w-5.5 h-5.5" />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Notifikasi"
          >
            <Bell className="w-5.5 h-5.5" />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-pertamina-red text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {user?.avatar ? (
                <img 
                  src={getPhotoUrl(user.avatar)} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-lg object-cover shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pertamina-red to-pertamina-blue flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user?.name?.charAt(0)}
                </div>
              )}
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>
            
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-11 z-40 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-700/80 py-2 animate-scale-in">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => { setProfileOpen(false); navigate('/settings'); }} 
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Pengaturan
                  </button>
                  <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-7">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Visible only on mobile screen widths) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/86 dark:bg-slate-950/86 backdrop-blur-2xl border-t border-white/70 dark:border-slate-800/70 flex items-center justify-around px-4 z-40 shadow-2xl shadow-slate-900/10">
        
        {/* Dashboard button */}
        <button 
          onClick={() => navigate(user?.role === 'AMT' ? '/amt-dashboard' : '/dashboard')}
          className={`flex flex-col items-center justify-center gap-1 w-12 h-12 transition-colors ${
            isActivePath(user?.role === 'AMT' ? '/amt-dashboard' : '/dashboard') ? 'text-pertamina-red' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-bold">Dashboard</span>
        </button>

        {/* Floating Action Button (FAB) for scanning QR */}
        <div className="relative -top-4">
          <button 
            onClick={() => navigate('/scan-qr')}
            className="w-14 h-14 bg-gradient-to-br from-pertamina-red to-pertamina-red-dark hover:from-pertamina-red-dark hover:to-pertamina-red rounded-full flex items-center justify-center text-white shadow-xl shadow-pertamina-red/35 active:scale-95 transition-all"
            title="Scan QR LO"
          >
            <QrCode className="w-6 h-6 animate-pulse" />
          </button>
        </div>

        {/* History / Receival button */}
        <button 
          onClick={() => navigate('/feedback-history')}
          className={`flex flex-col items-center justify-center gap-1 w-12 h-12 transition-colors ${
            isActivePath('/feedback-history') ? 'text-pertamina-red' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[9px] font-bold">Riwayat</span>
        </button>

        {/* Complaints button */}
        <button 
          onClick={() => navigate('/complaints')}
          className={`flex flex-col items-center justify-center gap-1 w-12 h-12 transition-colors ${
            isActivePath('/complaints') ? 'text-pertamina-red' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-[9px] font-bold">Keluhan</span>
        </button>

      </div>
    </div>
  );
}

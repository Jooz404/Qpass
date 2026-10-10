import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AnimatePresence } from 'framer-motion';

// Components
import DashboardLayout from './components/DashboardLayout';
import SplashScreen from './components/SplashScreen';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LoadingOrdersPage from './pages/LoadingOrdersPage';
import FeedbackHistoryPage from './pages/FeedbackHistoryPage';
import ComplaintsPage from './pages/ComplaintsPage';
import StatisticsPage from './pages/StatisticsPage';
import MapPage from './pages/MapPage';
import SpbuPage from './pages/SpbuPage';
import TrucksPage from './pages/TrucksPage';
import AmtPage from './pages/AmtPage';
import UsersPage from './pages/UsersPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import FeedbackPage from './pages/FeedbackPage';
import MonitoringPage from './pages/MonitoringPage';
import ScanQRPage from './pages/ScanQRPage';
import AMTDashboardPage from './pages/AMTDashboardPage';
import AMTFeedbackPage from './pages/AMTFeedbackPage';
import AMTCameraPage from './pages/AMTCameraPage';
import QualityControlPage from './pages/QualityControlPage';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('qpass_splash_shown');
  });

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('qpass_splash_shown', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
      <Router>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/feedback/:token" element={<FeedbackPage />} />
              <Route path="/feedback/lo/:noLO" element={<FeedbackPage />} />

              {/* Private Routes with Layout */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <DashboardPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/scan-qr" element={
                <PrivateRoute roles={['ADMIN', 'SPBU']}>
                  <DashboardLayout>
                    <ScanQRPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              
              <Route path="/monitoring" element={
                <PrivateRoute roles={['ADMIN', 'PENGAWAS']}>
                  <DashboardLayout>
                    <MonitoringPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/loading-orders" element={
                <PrivateRoute roles={['ADMIN', 'PENGAWAS']}>
                  <DashboardLayout>
                    <LoadingOrdersPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/feedback-history" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <FeedbackHistoryPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/feedback-history/:id" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <FeedbackHistoryPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/complaints" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <ComplaintsPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/statistics" element={
                <PrivateRoute roles={['ADMIN', 'PENGAWAS']}>
                  <DashboardLayout>
                    <StatisticsPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/map" element={
                <PrivateRoute roles={['ADMIN', 'PENGAWAS']}>
                  <DashboardLayout>
                    <MapPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/spbu" element={
                <PrivateRoute roles={['ADMIN']}>
                  <DashboardLayout>
                    <SpbuPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/trucks" element={
                <PrivateRoute roles={['ADMIN', 'PENGAWAS']}>
                  <DashboardLayout>
                    <TrucksPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/amt" element={
                <PrivateRoute roles={['ADMIN', 'PENGAWAS']}>
                  <DashboardLayout>
                    <AmtPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/amt-dashboard" element={
                <PrivateRoute roles={['AMT']}>
                  <DashboardLayout>
                    <AMTDashboardPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/amt-feedback/:loId" element={
                <PrivateRoute roles={['AMT']}>
                  <DashboardLayout>
                    <AMTFeedbackPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/amt-camera/:loId" element={
                <PrivateRoute roles={['AMT']}>
                  <AMTCameraPage />
                </PrivateRoute>
              } />

              <Route path="/users" element={
                <PrivateRoute roles={['ADMIN']}>
                  <DashboardLayout>
                    <UsersPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/quality-control" element={
                <PrivateRoute roles={['ADMIN', 'PENGAWAS']}>
                  <DashboardLayout>
                    <QualityControlPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/notifications" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <NotificationsPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/settings" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <SettingsPage />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
    </>
  );
}

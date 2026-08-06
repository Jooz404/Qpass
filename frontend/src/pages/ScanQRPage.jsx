import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { QrCode, Camera, SwitchCamera, Flashlight, XCircle, CheckCircle, Loader2, ScanLine } from 'lucide-react';

export default function ScanQRPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' = back camera
  const [initializing, setInitializing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        // State: 1 = NOT_STARTED, 2 = SCANNING, 3 = PAUSED
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        // Silently ignore stop errors
      }
      html5QrCodeRef.current = null;
    }
  };

  const startScanner = async () => {
    setError(null);
    setResult(null);
    setInitializing(true);

    // Clean up any previous instance
    await stopScanner();

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      const scannerId = 'qr-reader';
      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: cameraFacing },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Successfully scanned
          handleScanResult(decodedText);
        },
        () => {
          // QR code not found in frame (ignore, keep scanning)
        }
      );

      setScanning(true);
      setInitializing(false);
    } catch (err) {
      setInitializing(false);
      console.error('Camera error:', err);
      setError(
        typeof err === 'string' ? err :
        err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.'
          : err?.message?.includes('NotFoundError') || err?.name === 'NotFoundError'
          ? 'Kamera tidak ditemukan di perangkat ini.'
          : 'Gagal mengakses kamera. Pastikan browser mendukung akses kamera.'
      );
    }
  };

  const handleScanResult = async (decodedText) => {
    // Stop scanner immediately on successful scan
    await stopScanner();
    setScanning(false);

    const rawValue = decodedText?.trim();
    if (!rawValue) {
      setResult({ type: 'invalid', raw: decodedText });
      toast.error('QR Code tidak valid untuk Loading Order');
      return;
    }

    console.log('Processing raw value:', rawValue);

    // Extract the token from the scanned URL, path, query string, or raw token value.
    let token = null;

    try {
      const url = new URL(rawValue);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const feedbackIdx = pathParts.indexOf('feedback');
      if (feedbackIdx !== -1 && pathParts[feedbackIdx + 1]) {
        token = pathParts[feedbackIdx + 1];
      } else {
        const queryToken = url.searchParams.get('token');
        if (queryToken) token = queryToken;
      }
    } catch {
      // Not a URL, treat as raw token or path
      const pathParts = rawValue.split('/').filter(Boolean);
      const feedbackIdx = pathParts.indexOf('feedback');
      if (feedbackIdx !== -1 && pathParts[feedbackIdx + 1]) {
        token = pathParts[feedbackIdx + 1];
      } else {
        const queryMatch = rawValue.match(/[?&]token=([^&#]+)/i);
        if (queryMatch?.[1]) {
          token = decodeURIComponent(queryMatch[1]);
        } else {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(rawValue)) {
            token = rawValue;
          } else {
            // Fallback: if it looks like a token (not http, reasonable length), use it directly
            const fallbackToken = rawValue.split('/').filter(Boolean).pop();
            if (fallbackToken && fallbackToken.length > 8 && !fallbackToken.includes('http')) {
              token = fallbackToken;
            } else if (rawValue.length > 8 && !rawValue.includes('http')) {
              // Use the entire raw value as token if it doesn't look like a URL
              token = rawValue;
            }
          }
        }
      }
    }

    console.log('Extracted token:', token);

    if (token) {
      setResult({ type: 'success', token, raw: decodedText });
      toast.success('QR Code berhasil dipindai!');
    } else {
      setResult({ type: 'invalid', raw: decodedText });
      toast.error('QR Code tidak valid untuk Loading Order');
    }
  };

  const handleNavigateToFeedback = () => {
    if (result?.token) {
      // Get user from localStorage to ensure we have the latest data
      const savedUser = localStorage.getItem('user');
      const userData = savedUser ? JSON.parse(savedUser) : user;
      
      console.log('=== QR Navigate clicked ===');
      console.log('Token:', result.token);
      console.log('User role:', userData?.role);
      console.log('AMT ID:', userData?.amtId);
      
      // Navigate directly to AMTFeedbackPage with the token
      // The AMTFeedbackPage will handle fetching the LO data
      if (userData?.role === 'AMT') {
        const targetUrl = `/amt-feedback/${result.token}`;
        console.log('Navigating to:', targetUrl);
        // Use window.location.href for force reload
        window.location.href = targetUrl;
      } else {
        // SPBU: Navigate to regular FeedbackPage
        let url = `/feedback/${result.token}`;
        const spbuId = userData?.role === 'SPBU' ? userData?.spbuId : null;
        if (spbuId) url += `?spbuId=${spbuId}`;
        console.log('SPBU navigating to:', url);
        window.location.href = url;
      }
    }
  };

  const handleManualSubmit = () => {
    const rawValue = manualInput?.trim();
    console.log('=== Manual submit clicked ===');
    console.log('Raw value:', rawValue);
    
    if (!rawValue) {
      toast.error('Masukkan token atau nomor LO');
      return;
    }
    
    // Get user from localStorage to ensure we have the latest data
    const savedUser = localStorage.getItem('user');
    const userData = savedUser ? JSON.parse(savedUser) : user;
    
    console.log('User data:', userData);
    console.log('User role:', userData?.role);
    console.log('AMT ID:', userData?.amtId);
    
    // Navigate directly to AMTFeedbackPage with the LO number/token
    // The AMTFeedbackPage will handle fetching the LO data
    if (userData?.role === 'AMT') {
      const targetUrl = `/amt-feedback/${rawValue}`;
      console.log('Navigating to:', targetUrl);
      // Use window.location.href as fallback
      window.location.href = targetUrl;
      toast.success('Memuat data Loading Order...');
    } else {
      // SPBU: Navigate to regular FeedbackPage
      let url = `/feedback/${rawValue}`;
      const spbuId = userData?.role === 'SPBU' ? userData?.spbuId : null;
      if (spbuId) url += `?spbuId=${spbuId}`;
      console.log('SPBU navigating to:', url);
      window.location.href = url;
      toast.success('Memuat data Loading Order...');
    }
  };

  const handleSwitchCamera = async () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    if (scanning) {
      await stopScanner();
      setScanning(false);
      // Will restart with new camera in next startScanner call
      setTimeout(() => startScanner(), 300);
    }
  };

  const handleScanAgain = () => {
    setResult(null);
    setError(null);
    startScanner();
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <QrCode className="w-6 h-6 text-pertamina-red" /> Scan QR Code
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Pindai QR Code pada Loading Order untuk mengisi feedback penerimaan BBM
        </p>
      </div>

      {/* Scanner Area */}
      <div className="max-w-md mx-auto">
        {/* Camera Viewfinder */}
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
          {/* Scanner container */}
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full"
            style={{ minHeight: scanning || initializing ? '320px' : '0px' }}
          />

          {/* Overlay when not scanning */}
          {!scanning && !initializing && !result && (
            <div className="flex flex-col items-center justify-center py-16 px-6 bg-gradient-to-br from-slate-900 to-slate-800">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pertamina-red/20 to-pertamina-red/5 border-2 border-dashed border-pertamina-red/40 flex items-center justify-center mb-6 animate-pulse">
                <QrCode className="w-12 h-12 text-pertamina-red/70" />
              </div>
              <p className="text-white/80 text-sm font-medium text-center mb-2">
                Arahkan kamera ke QR Code Loading Order
              </p>
              <p className="text-white/40 text-xs text-center">
                Pastikan QR Code terlihat jelas dan tidak terhalang
              </p>
            </div>
          )}

          {/* Initializing overlay */}
          {initializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
              <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
              <p className="text-white/80 text-sm">Mengaktifkan kamera...</p>
            </div>
          )}

          {/* Scanning indicator overlay */}
          {scanning && !initializing && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/90 backdrop-blur rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-medium">Memindai...</span>
              </div>
              <button
                onClick={handleSwitchCamera}
                className="p-2 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors"
                title="Ganti Kamera"
              >
                <SwitchCamera className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl animate-scale-in">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Gagal Mengakses Kamera</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scan Result */}
        {result && (
          <div className={`mt-4 p-5 rounded-2xl border-2 animate-scale-in ${
            result.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
          }`}>
            <div className="flex items-start gap-3">
              {result.type === 'success' ? (
                <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-bold ${
                  result.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                }`}>
                  {result.type === 'success' ? 'QR Code Valid!' : 'QR Code Tidak Dikenali'}
                </p>
                {result.type === 'success' ? (
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1 break-all">
                    Token: <span className="font-mono">{result.token.substring(0, 16)}...</span>
                  </p>
                ) : (
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1 break-all">
                    Data: {result.raw.substring(0, 80)}...
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              {result.type === 'success' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Navigate button clicked');
                    handleNavigateToFeedback();
                  }}
                  className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-pertamina-red via-pertamina-red to-pertamina-red-dark hover:from-pertamina-red-dark hover:via-pertamina-red hover:to-pertamina-red text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-pertamina-red/30 hover:shadow-xl hover:shadow-pertamina-red/40 active:scale-[0.97] flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Buka Form Feedback</span>
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Scan again button clicked');
                  handleScanAgain();
                }}
                className={`${result.type === 'success' ? '' : 'flex-1'} py-3 sm:py-4 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.97] flex items-center justify-center gap-2 text-sm sm:text-base border border-slate-200 dark:border-slate-600`}
              >
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Scan Ulang</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!scanning && !result && (
          <div className="mt-6 space-y-3">
            <button
              onClick={startScanner}
              disabled={initializing}
              className="w-full py-4 sm:py-5 bg-gradient-to-r from-pertamina-red via-pertamina-red to-pertamina-red-dark hover:from-pertamina-red-dark hover:via-pertamina-red hover:to-pertamina-red text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-pertamina-red/30 hover:shadow-2xl hover:shadow-pertamina-red/40 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base sm:text-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
              {initializing ? (
                <>
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin relative z-10" />
                  <span className="relative z-10">Mengaktifkan Kamera...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                  <span className="relative z-10">Mulai Scan QR Code</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.97] flex items-center justify-center gap-2 text-sm sm:text-base border border-slate-200 dark:border-slate-600"
            >
              {showManualInput ? (
                <>
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Tutup Input Manual</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Input Token Manual</span>
                </>
              )}
            </button>

            {showManualInput && (
              <div className="mt-3 p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg animate-scale-in">
                <label className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 sm:mb-3 block">
                  Token / Nomor LO Manual
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Contoh: LO-20260717-0054"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualSubmit();
                    }
                  }}
                  className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200 text-sm sm:text-base shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    console.log('Button clicked directly');
                    handleManualSubmit();
                  }}
                  className="w-full mt-3 sm:mt-4 py-3 sm:py-4 bg-gradient-to-r from-pertamina-red via-pertamina-red to-pertamina-red-dark hover:from-pertamina-red-dark hover:via-pertamina-red hover:to-pertamina-red text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-pertamina-red/30 hover:shadow-xl hover:shadow-pertamina-red/40 active:scale-[0.97] flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Submit Token</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stop scanning button */}
        {scanning && !initializing && (
          <div className="mt-4">
            <button
              onClick={async () => { await stopScanner(); setScanning(false); }}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.97] flex items-center justify-center gap-2 text-sm sm:text-base border border-slate-200 dark:border-slate-600"
            >
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Berhenti Scan</span>
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 glass-card p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-pertamina-red" />
            Cara Penggunaan
          </h3>
          <ol className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-pertamina-red/10 text-pertamina-red text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              Klik tombol <strong>"Mulai Scan QR Code"</strong> untuk mengaktifkan kamera
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-pertamina-red/10 text-pertamina-red text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              Arahkan kamera ke <strong>QR Code</strong> pada lembar Loading Order
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-pertamina-red/10 text-pertamina-red text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              Setelah QR berhasil dipindai, klik <strong>"Buka Form Feedback"</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-pertamina-red/10 text-pertamina-red text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              Isi data inspeksi BBM lalu kirimkan feedback Anda
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

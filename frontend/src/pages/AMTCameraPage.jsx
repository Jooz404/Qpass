import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, XCircle, CheckCircle } from 'lucide-react';

export default function AMTCameraPage() {
  const { loId } = useParams();
  const navigate = useNavigate();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);
  
  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Requesting camera access...');
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      console.log('Camera stream obtained:', stream);
      console.log('Stream tracks:', stream.getTracks());
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log('Setting video srcObject...');
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          
          videoRef.current.play().then(() => {
            console.log('Video playing successfully');
            setLoading(false);
          }).catch(err => {
            console.error('Error playing video:', err);
            setError('Gagal memutar video kamera: ' + err.message);
            setLoading(false);
          });
        };
        
        videoRef.current.onerror = (err) => {
          console.error('Video error:', err);
          setError('Error pada video element');
          setLoading(false);
        };
        
        // Force loading false after timeout
        setTimeout(() => {
          if (loading) {
            console.log('Forcing loading false after timeout');
            setLoading(false);
          }
        }, 3000);
      } else {
        console.error('Video ref is null');
        setError('Video element tidak tersedia');
        setLoading(false);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setLoading(false);
      setError(
        err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.'
          : err?.message?.includes('NotFoundError') || err?.name === 'NotFoundError'
          ? 'Kamera tidak ditemukan di perangkat ini.'
          : 'Gagal mengakses kamera: ' + (err.message || err)
      );
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedPhoto(imageData);
      stopCamera();
    }
  };
  
  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };
  
  const confirmPhoto = () => {
    if (capturedPhoto) {
      sessionStorage.setItem('amtFeedbackPhoto', capturedPhoto);
      navigate(`/amt-feedback/${loId}`);
    }
  };
  
  const goBack = () => {
    stopCamera();
    navigate(`/amt-feedback/${loId}`);
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <button
          onClick={goBack}
          className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold text-lg">Ambil Foto</h1>
        <div className="w-10" />
      </div>
      
      {/* Camera View */}
      <div className="flex-1 relative">
        {capturedPhoto ? (
          <img
            src={capturedPhoto}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black p-8">
            <div className="text-white text-center">
              <p className="text-lg font-bold mb-2">Gagal Mengakses Kamera</p>
              <p className="text-sm opacity-80 mb-4">{error}</p>
              <button
                onClick={goBack}
                className="px-6 py-3 bg-white text-black rounded-full font-bold"
              >
                Kembali
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white">Memuat kamera...</div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {capturedPhoto ? (
          <div className="flex gap-3">
            <button
              onClick={retakePhoto}
              className="flex-1 py-4 bg-white/20 text-white font-bold rounded-2xl backdrop-blur-sm hover:bg-white/30 transition-all"
            >
              Foto Ulang
            </button>
            <button
              onClick={confirmPhoto}
              className="flex-1 py-4 bg-gradient-to-r from-pertamina-red to-pertamina-red-dark text-white font-bold rounded-2xl flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Gunakan Foto
            </button>
          </div>
        ) : (
          <button
            onClick={capturePhoto}
            className="w-full py-4 bg-gradient-to-r from-pertamina-red to-pertamina-red-dark text-white font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Ambil Foto
          </button>
        )}
      </div>
    </div>
  );
}

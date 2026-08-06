import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Star, Camera, Upload, ArrowLeft, CheckCircle, AlertCircle, X, XCircle, SwitchCamera, Loader2 } from 'lucide-react';

export default function AMTFeedbackPage() {
  const { loId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lo, setLo] = useState(null);
  const [error, setError] = useState(null);
  
  // Rating states
  const [ratingKeramahan, setRatingKeramahan] = useState(0);
  const [ratingKooperasi, setRatingKooperasi] = useState(0);
  const [ratingFasilitas, setRatingFasilitas] = useState(0);
  const [ratingProses, setRatingProses] = useState(0);
  const [ratingKeseluruhan, setRatingKeseluruhan] = useState(0);
  
  // Hover states
  const [hoverKeramahan, setHoverKeramahan] = useState(0);
  const [hoverKooperasi, setHoverKooperasi] = useState(0);
  const [hoverFasilitas, setHoverFasilitas] = useState(0);
  const [hoverProses, setHoverProses] = useState(0);
  const [hoverKeseluruhan, setHoverKeseluruhan] = useState(0);
  
  // Other form states
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' = rear camera, 'user' = front
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    fetchLO();
    
    // Check for photo from camera page
    const savedPhoto = sessionStorage.getItem('amtFeedbackPhoto');
    if (savedPhoto) {
      setPhotoPreview(savedPhoto);
      setPhotoUrl(savedPhoto);
      sessionStorage.removeItem('amtFeedbackPhoto');
    }
  }, [loId]);

  useEffect(() => {
    if (cameraOpen) {
      startCameraStream(cameraFacing);
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [cameraOpen]);

  const fetchLO = async () => {
    try {
      setLoading(true);
      
      // Check if loId is a number (ID) or string (LO number/token)
      const isNumeric = /^\d+$/.test(loId);
      
      let res;
      if (isNumeric) {
        // It's an ID
        res = await api.get(`/lo/${loId}`);
      } else {
        // It's an LO number or token, need to fetch by number/token first
        const isLo = loId?.toUpperCase().startsWith('LO-');
        const apiUrl = isLo ? `/lo/by-no/${loId}` : `/lo/by-token/${loId}`;
        res = await api.get(apiUrl);
      }
      
      setLo(res.data.data);
      
      // Check if AMT already submitted feedback
      const existingFeedback = await api.get(`/amt-feedback/lo/${res.data.data.id}`);
      if (existingFeedback.data.data.length > 0) {
        setError('Anda sudah memberikan feedback untuk Loading Order ini');
      }
    } catch (err) {
      console.error('Error fetching LO:', err);
      setError(err.response?.data?.message || 'Gagal memuat data Loading Order');
    } finally {
      setLoading(false);
    }
  };

  const triggerPhotoUpload = () => {
    photoInputRef.current?.click();
  };

  const triggerCameraCapture = () => {
    setCameraOpen(true);
  };

  const startCameraStream = async (facing = cameraFacing) => {
    setCameraLoading(true);
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera langsung');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      console.log('Camera stream started with facing:', facing);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraLoading(false);
          }).catch((err) => {
            console.error('Video play error:', err);
            setCameraLoading(false);
          });
        };
      } else {
        setCameraLoading(false);
      }
    } catch (err) {
      console.error('Camera stream error:', err);
      setCameraLoading(false);
      const errMsg = err?.name === 'NotAllowedError' 
        ? 'Izin kamera ditolak oleh browser.' 
        : err?.name === 'NotFoundError' 
        ? 'Kamera tidak ditemukan pada perangkat ini.' 
        : (err.message || 'Gagal mengakses kamera.');
      setCameraError(errMsg);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (cameraOpen) {
      await startCameraStream(nextFacing);
    }
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Mirror image if using front camera
      if (cameraFacing === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, width, height);
      const imageData = canvas.toDataURL('image/jpeg', 0.92);
      setPhotoPreview(imageData);
      setPhotoUrl(imageData);
      toast.success('Foto berhasil diambil!');
      closeCameraModal();
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran foto maksimal 5MB');
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all ratings
    if (ratingKeramahan === 0 || ratingKooperasi === 0 || 
        ratingFasilitas === 0 || ratingProses === 0 || ratingKeseluruhan === 0) {
      toast.error('Mohon lengkapi semua rating');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await api.post('/amt-feedback', {
        loId,
        spbuId: lo.spbuId,
        ratingKeramahan,
        ratingKooperasi,
        ratingFasilitas,
        ratingProses,
        ratingKeseluruhan,
        notes,
        photoUrl
      });
      
      toast.success('Feedback berhasil dikirim');
      navigate('/amt-dashboard');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error(err.response?.data?.message || 'Gagal mengirim feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, hover, setRating, setHover, label }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hover || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/amt-dashboard')}
            className="btn-primary"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/amt-dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Feedback SPBU
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Berikan penilaian untuk SPBU {lo?.spbu?.name}
          </p>
        </div>

        {/* LO Info Card */}
        {lo && (
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {lo.noLO}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {lo.product} - {lo.volume.toLocaleString()} Liter
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  SPBU: {lo.spbu.name} ({lo.spbu.code})
                </p>
              </div>
              <div className={`badge ${
                lo.status === 'COMPLETED' ? 'badge-success' : 'badge-info'
              }`}>
                {lo.status}
              </div>
            </div>
          </div>
        )}

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
          <div className="glass-card p-6 space-y-6">
            {/* Keramahan */}
            <StarRating
              rating={ratingKeramahan}
              hover={hoverKeramahan}
              setRating={setRatingKeramahan}
              setHover={setHoverKeramahan}
              label="Keramahan Petugas SPBU"
            />

            {/* Kerjasama */}
            <StarRating
              rating={ratingKooperasi}
              hover={hoverKooperasi}
              setRating={setRatingKooperasi}
              setHover={setHoverKooperasi}
              label="Kerjasama Petugas SPBU"
            />

            {/* Fasilitas */}
            <StarRating
              rating={ratingFasilitas}
              hover={hoverFasilitas}
              setRating={setRatingFasilitas}
              setHover={setHoverFasilitas}
              label="Fasilitas SPBU"
            />

            {/* Proses Bongkar Muat */}
            <StarRating
              rating={ratingProses}
              hover={hoverProses}
              setRating={setRatingProses}
              setHover={setHoverProses}
              label="Proses Bongkar Muat"
            />

            {/* Keseluruhan */}
            <StarRating
              rating={ratingKeseluruhan}
              hover={hoverKeseluruhan}
              setRating={setRatingKeseluruhan}
              setHover={setHoverKeseluruhan}
              label="Penilaian Keseluruhan"
            />

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="input-field"
                placeholder="Tuliskan catatan atau pengalaman tambahan..."
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Foto Bukti (Opsional)
              </label>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={triggerPhotoUpload}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-pertamina-red hover:text-pertamina-red dark:hover:border-pertamina-red dark:hover:text-pertamina-red transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Galeri
                </button>
                <button
                  type="button"
                  onClick={triggerCameraCapture}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-pertamina-red hover:text-pertamina-red dark:hover:border-pertamina-red dark:hover:text-pertamina-red transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Kamera
                </button>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {photoPreview && (
                <div className="relative group">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoUrl('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? 'Mengirim...' : 'Kirim Feedback'}
          </button>
        </form>

        {/* Camera Viewfinder Modal Card - Matching ScanQRPage camera style */}
        {cameraOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl animate-scale-in border border-slate-800 flex flex-col">
              {/* Header with title and Switch Camera button */}
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pertamina-red" />
                  <span className="font-bold text-white text-base">Ambil Foto Bukti</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
                    title="Ganti Kamera (Depan/Belakang)"
                  >
                    <SwitchCamera className="w-4 h-4 text-pertamina-red" />
                    <span>Ganti Kamera</span>
                  </button>
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Viewfinder Video Container */}
              <div className="relative bg-black min-h-[320px] flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-80 object-cover ${
                    cameraFacing === 'user' ? 'scale-x-[-1]' : ''
                  } ${cameraError ? 'hidden' : 'block'}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Loading Overlay */}
                {cameraLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                    <Loader2 className="w-10 h-10 text-pertamina-red animate-spin mb-3" />
                    <p className="text-white text-sm font-semibold">Mengaktifkan kamera...</p>
                  </div>
                )}

                {/* Error Card */}
                {cameraError && (
                  <div className="p-6 text-center text-white space-y-4">
                    <AlertCircle className="w-14 h-14 text-amber-400 mx-auto" />
                    <div>
                      <p className="font-bold text-base mb-1">Akses Kamera Terkendala</p>
                      <p className="text-xs text-slate-300 max-w-xs mx-auto">{cameraError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        closeCameraModal();
                        cameraInputRef.current?.click();
                      }}
                      className="px-5 py-3 bg-pertamina-red hover:bg-pertamina-red-dark text-white rounded-xl text-sm font-bold shadow-lg transition-all"
                    >
                      Buka Perangkat Kamera / Galeri
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
                {!cameraError && (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={cameraLoading}
                    className="flex-1 py-4 bg-gradient-to-r from-pertamina-red via-pertamina-red to-pertamina-red-dark hover:from-pertamina-red-dark hover:to-pertamina-red text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-pertamina-red/30 active:scale-[0.98] disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Ambil Foto</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="px-6 py-4 bg-slate-800 text-slate-300 font-bold rounded-2xl hover:bg-slate-700 transition-all text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  Fuel, ShieldCheck, Droplets, Eye, Gauge, Star, Camera,
  MessageSquare, Send, CheckCircle, AlertTriangle, Loader2, XCircle,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FeedbackPage() {
  const { token } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const spbuId = searchParams.get('spbuId');
  const amtId = searchParams.get('amtId');
  const [lo, setLo] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLoNumber, setIsLoNumber] = useState(false);

  // Redirect AMT to AMTFeedbackPage if accessing via QR/LO number
  // NOTE: This redirect is now handled in ScanQRPage.jsx directly
  // This is kept as a fallback for direct URL access
  useEffect(() => {
    if (user?.role === 'AMT' && token) {
      const isLo = token?.toUpperCase().startsWith('LO-');
      const amtParam = amtId ? `?amtId=${amtId}` : '';
      if (isLo) {
        api.get(`/lo/by-no/${token}${amtParam}`).then(res => {
          navigate(`/amt-feedback/${res.data.data.id}`);
        }).catch(err => {
          toast.error(err.response?.data?.message || 'Loading Order tidak ditemukan');
        });
      } else {
        api.get(`/lo/by-token/${token}${amtParam}`).then(res => {
          navigate(`/amt-feedback/${res.data.data.id}`);
        }).catch(err => {
          toast.error(err.response?.data?.message || 'Loading Order tidak ditemukan');
        });
      }
    }
  }, [user, token, navigate, toast, amtId]);

  // Form state
  const [sealCondition, setSealCondition] = useState('');
  const [volumeStatus, setVolumeStatus] = useState('');
  const [volumeDiff, setVolumeDiff] = useState('');
  const [visualCondition, setVisualCondition] = useState('');
  const [density, setDensity] = useState('');
  const [ratingSOP, setRatingSOP] = useState(0);
  const [ratingKeramahan, setRatingKeramahan] = useState(0);
  const [ratingSeragam, setRatingSeragam] = useState(0);
  const [hoverRatingSOP, setHoverRatingSOP] = useState(0);
  const [hoverRatingKeramahan, setHoverRatingKeramahan] = useState(0);
  const [hoverRatingSeragam, setHoverRatingSeragam] = useState(0);
  const [sealPhoto, setSealPhoto] = useState(null);
  const [sealPhotoPreview, setSealPhotoPreview] = useState(null);
  const [volumePhoto, setVolumePhoto] = useState(null);
  const [volumePhotoPreview, setVolumePhotoPreview] = useState(null);
  const [visualPhoto, setVisualPhoto] = useState(null);
  const [visualPhotoPreview, setVisualPhotoPreview] = useState(null);
  const [densityPhoto, setDensityPhoto] = useState(null);
  const [densityPhotoPreview, setDensityPhotoPreview] = useState(null);
  const [sealNotes, setSealNotes] = useState('');
  const [volumeNotes, setVolumeNotes] = useState('');
  const [visualNotes, setVisualNotes] = useState('');
  const [densityNotes, setDensityNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [currentCameraSection, setCurrentCameraSection] = useState('');
  const [useCameraFallback, setUseCameraFallback] = useState(false);
  const sealPhotoInputRef = useRef(null);
  const volumePhotoInputRef = useRef(null);
  const visualPhotoInputRef = useRef(null);
  const densityPhotoInputRef = useRef(null);
  const sealCameraInputRef = useRef(null);
  const volumeCameraInputRef = useRef(null);
  const visualCameraInputRef = useRef(null);
  const densityCameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const triggerSealPhotoUpload = () => {
    sealPhotoInputRef.current?.click();
  };

  const triggerSealCameraCapture = () => {
    setCurrentCameraSection('seal');
    setUseCameraFallback(false);
    setCameraOpen(true);
  };

  const triggerVolumePhotoUpload = () => {
    volumePhotoInputRef.current?.click();
  };

  const triggerVolumeCameraCapture = () => {
    setCurrentCameraSection('volume');
    setUseCameraFallback(false);
    setCameraOpen(true);
  };

  const triggerVisualPhotoUpload = () => {
    visualPhotoInputRef.current?.click();
  };

  const triggerVisualCameraCapture = () => {
    setCurrentCameraSection('visual');
    setUseCameraFallback(false);
    setCameraOpen(true);
  };

  const triggerDensityPhotoUpload = () => {
    densityPhotoInputRef.current?.click();
  };

  const triggerDensityCameraCapture = () => {
    setCurrentCameraSection('density');
    setUseCameraFallback(false);
    setCameraOpen(true);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      // Fallback to file input if camera fails
      setCameraOpen(false);
      setUseCameraFallback(true);
      
      // Trigger the appropriate file input
      switch (currentCameraSection) {
        case 'seal':
          sealCameraInputRef.current?.click();
          break;
        case 'volume':
          volumeCameraInputRef.current?.click();
          break;
        case 'visual':
          visualCameraInputRef.current?.click();
          break;
        case 'density':
          densityCameraInputRef.current?.click();
          break;
      }
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCurrentCameraSection('');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
          const preview = URL.createObjectURL(blob);
          
          switch (currentCameraSection) {
            case 'seal':
              setSealPhoto(file);
              setSealPhotoPreview(preview);
              break;
            case 'volume':
              setVolumePhoto(file);
              setVolumePhotoPreview(preview);
              break;
            case 'visual':
              setVisualPhoto(file);
              setVisualPhotoPreview(preview);
              break;
            case 'density':
              setDensityPhoto(file);
              setDensityPhotoPreview(preview);
              break;
          }
          closeCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  useEffect(() => {
    if (cameraOpen) {
      openCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraOpen]);

  useEffect(() => {
    const fetchLO = async () => {
      console.log('Fetching LO with token:', token);
      console.log('Token length:', token?.length);
      console.log('Token uppercase:', token?.toUpperCase());
      console.log('SPBU ID filter:', spbuId);
      
      try {
        // Check if token is an LO number (starts with LO-)
        const isLo = token?.toUpperCase().startsWith('LO-');
        setIsLoNumber(isLo);
        
        const endpoint = isLo ? `/lo/by-no/${token}${spbuId ? `?spbuId=${spbuId}` : ''}` : `/lo/by-token/${token}${spbuId ? `?spbuId=${spbuId}` : ''}`;
        console.log('Using endpoint:', endpoint);
        console.log('Is LO number:', isLo);
        
        const res = await api.get(endpoint);
        console.log('LO data received:', res.data.data);
        setLo(res.data.data);
      } catch (err) {
        console.error('Error fetching LO:', err);
        console.error('Error response:', err.response?.data);
        if (err.response?.data?.feedbackExists) {
          setError('Feedback untuk Loading Order ini sudah dikirim sebelumnya.');
        } else {
          setError(err.response?.data?.message || 'Loading Order tidak ditemukan.');
        }
      } finally {
        setPageLoading(false);
      }
    };
    fetchLO();
  }, [token, spbuId]);

  const densityVal = parseFloat(density);
  
  // Density standards per product
  const densityStandards = {
    'Dexlite': { min: 815, max: 880, note: 'Surat Kementrian ESDM Nomor B-1870/EK.05/DJE.B/2026 23 Juni tentang Penyampaian Keputusan Menteri ESDM Nomor 257.K/EK.01/MEM.E/2026 tanggal 17 Juni 2026 tentang Kewajiban Pencampuran Bahan Bakar Nabati Jenis Biodiesel dengan Bahan Bakar Minyak Berupa Minyak Solar Sebesar 50% dalam Kerangka Pembiayaan oleh Badan Pengelola Dana Perkebunan' },
    'Pertamax': { min: 715, max: 770, note: 'Sesuai SK Dirjen Migas No. 110.K/MG.01/DJM/2022 tanggal 29 Juli 2022 tentang Standar dan Mutu (Spesifikasi) Bahan Bakar Minyak Jenis Bensin RON 91 yang Dipasarkan di Dalam Negeri' },
    'Pertamax Turbo': { min: 715, max: 770, note: 'Sesuai SK Dirjen Migas No. 0177.K/10/DJM.T/2018 tanggal 6 Juni 2018 tentang Standar dan Mutu (Spesifikasi) Bahan Bakar Minyak Jenis Bensin (Gasoline) RON 98 yang Dipasarkan di Dalam Negeri' },
    'Solar': { min: 815, max: 870, note: 'Sesuai SK Dirjen Migas No. 447.K/MG.06/DJM/2023 tanggal 27 Desember 2023 tentang Standar dan Mutu (Spesifikasi) Bahan Bakar Minyak Jenis Solar yang Dipasarkan di Dalam Negeri' },
    'Biosolar B50': { min: 815, max: 880, note: 'Surat Kementrian Energi dan Sumber Daya Mineral Nomor B-1870/EK.05/DJE.B/2026 23 Juni tentang Penyampaian Keputusan Menteri ESDM Nomor 257.K/EK.01/MEM.E/2026 tanggal 17 Juni 2026 tentang Kewajiban Pencampuran Bahan Bakar Nabati Jenis Biodiesel dengan Bahan Bakar Minyak Berupa Minyak Solar Sebesar 50% dalam Kerangka Pembiayaan oleh Badan Pengelola Dana Perkebunan' },
    'Pertalite': { min: 715, max: 770, note: 'Sesuai SK Dirjen Migas No. 0486.K/10/DJM.S/2017 tanggal 23 November 2017 tentang Standar dan Mutu (Spesifikasi) Bahan Bakar Minyak Jenis Bensin 90 yang Dipasarkan di Dalam Negeri' },
  };
  
  const currentStandard = densityStandards[lo?.product] || { min: 715, max: 770, note: '' };
  const isDensityOutOfRange = density && (densityVal < currentStandard.min || densityVal > currentStandard.max);

  const handleSealPhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5 MB.');
      return;
    }
    setSealPhoto(file);
    setSealPhotoPreview(URL.createObjectURL(file));
  };

  const handleVolumePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5 MB.');
      return;
    }
    setVolumePhoto(file);
    setVolumePhotoPreview(URL.createObjectURL(file));
  };

  const handleVisualPhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5 MB.');
      return;
    }
    setVisualPhoto(file);
    setVisualPhotoPreview(URL.createObjectURL(file));
  };

  const handleDensityPhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5 MB.');
      return;
    }
    setDensityPhoto(file);
    setDensityPhotoPreview(URL.createObjectURL(file));
  };

  const handleSealCameraCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5 MB.');
      return;
    }
    setSealPhoto(file);
    setSealPhotoPreview(URL.createObjectURL(file));
  };

  const handleVolumeCameraCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5 MB.');
      return;
    }
    setVolumePhoto(file);
    setVolumePhotoPreview(URL.createObjectURL(file));
  };

  const handleVisualCameraCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5 MB.');
      return;
    }
    setVisualPhoto(file);
    setVisualPhotoPreview(URL.createObjectURL(file));
  };

  const handleDensityCameraCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5 MB.');
      return;
    }
    setDensityPhoto(file);
    setDensityPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!sealCondition) { alert('Pilih kondisi segel'); return; }
    if (!volumeStatus) { alert('Pilih status volume'); return; }
    if (volumeStatus === 'SELISIH' && !volumeDiff) { alert('Isi jumlah selisih'); return; }
    if (!visualCondition) { alert('Pilih visual produk'); return; }
    if (!density) { alert('Isi densitas'); return; }
    if (!ratingSOP || !ratingKeramahan || !ratingSeragam) {
      alert('Berikan semua penilaian: SOP, Keramahan, dan Seragam APD');
      return;
    }

    setSubmitting(true);
    try {
      const averageRating = Math.round((ratingSOP + ratingKeramahan + ratingSeragam) / 3);
      const formData = new FormData();
      formData.append('loId', lo.id);
      formData.append('sealCondition', sealCondition);
      formData.append('volumeStatus', volumeStatus);
      if (volumeDiff) formData.append('volumeDiff', volumeDiff);
      formData.append('visualCondition', visualCondition);
      formData.append('density', density);
      formData.append('rating', averageRating);
      // Combine all notes into one
      const allNotes = [
        sealNotes && `Segel: ${sealNotes}`,
        volumeNotes && `Volume: ${volumeNotes}`,
        visualNotes && `Visual: ${visualNotes}`,
        densityNotes && `Densitas: ${densityNotes}`,
        notes && `Umum: ${notes}`
      ].filter(Boolean).join('\n\n');
      formData.append('notes', allNotes);
      // Use seal photo as main photo if available, otherwise try other photos
      if (sealPhoto) formData.append('photo', sealPhoto);
      else if (volumePhoto) formData.append('photo', volumePhoto);
      else if (visualPhoto) formData.append('photo', visualPhoto);
      else if (densityPhoto) formData.append('photo', densityPhoto);

      // Try geolocation
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        formData.append('lat', pos.coords.latitude);
        formData.append('lng', pos.coords.longitude);
      } catch { /* Skip if denied */ }

      await api.post('/feedback', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengirim feedback');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-gray-500">Memuat data Loading Order...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tidak Dapat Dimuat</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="text-center max-w-sm animate-scale-in">
          <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Feedback Terkirim!</h2>
          <p className="text-sm text-gray-500 mb-1">Terima kasih atas feedback Anda.</p>
          <p className="text-xs text-gray-400">LO: {lo.noLO}</p>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-r from-slate-950 via-pertamina-red-dark to-pertamina-red px-4 py-6 text-white shadow-2xl shadow-pertamina-red/30 backdrop-blur-xl">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center ring-2 ring-white/20 shadow-xl backdrop-blur-sm">
            <Fuel className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight">Q-PASS BITUNG</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">Quality & Quantity Feedback</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* LO Info Card */}
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/80 p-6 mb-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-pertamina-red/10 flex items-center justify-center">
              <Fuel className="w-4 h-4 text-pertamina-red" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data Loading Order</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Nomor LO" value={lo.noLO} />
            <InfoItem label="Produk" value={lo.product} />
            <InfoItem label="No polisi" value={lo.truck?.nopol} />
            <InfoItem label="AMT" value={lo.amt?.name ? `${lo.amt.name}${lo.secondaryAmt?.name ? ` / ${lo.secondaryAmt.name}` : ''}` : '-'} />
            <InfoItem label="SPBU" value={lo.spbu?.name} className="col-span-2" />
            <InfoItem label="Alamat" value={lo.spbu?.address} className="col-span-2" />
          </div>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Kondisi Segel */}
          <FormSection icon={ShieldCheck} title="Bagaimana kondisi SEGEL Mobil Tangki?" number={1}>
            <div className="flex gap-3">
              <RadioPill selected={sealCondition === 'UTUH'} onClick={() => setSealCondition('UTUH')} color="green">✓ Utuh</RadioPill>
              <RadioPill selected={sealCondition === 'RUSAK'} onClick={() => setSealCondition('RUSAK')} color="red">✗ Rusak</RadioPill>
            </div>
            <div className="mt-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Catatan (Opsional)</label>
              <textarea
                value={sealNotes}
                onChange={e => setSealNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200 min-h-[80px] resize-none text-sm"
                placeholder="Catatan tentang kondisi segel..."
              />
            </div>
            <div className="mt-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Foto (Opsional)</label>
              <div className="flex gap-3 mb-4">
                <button type="button" onClick={triggerSealPhotoUpload} className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-pertamina-red hover:text-pertamina-red dark:hover:border-pertamina-red dark:hover:text-pertamina-red transition-all duration-200 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Galeri
                </button>
                <button type="button" onClick={triggerSealCameraCapture} className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-pertamina-red hover:text-pertamina-red dark:hover:border-pertamina-red dark:hover:text-pertamina-red transition-all duration-200 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Kamera
                </button>
              </div>
              {sealPhotoPreview && (
                <div className="relative group">
                  <img src={sealPhotoPreview} alt="Preview Segel" className="w-full h-40 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-700" />
                  <button type="button" onClick={() => { setSealPhoto(null); setSealPhotoPreview(null); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
              <input ref={sealPhotoInputRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleSealPhotoChange} className="hidden" />
              <input ref={sealCameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleSealCameraCapture} className="hidden" />
            </div>
          </FormSection>

          {/* 2. Volume */}
          <FormSection icon={Droplets} title="Bagaimana volume KUANTITAS produk?" number={2}>
            <div className="flex gap-3 mb-4">
              <RadioPill selected={volumeStatus === 'SESUAI'} onClick={() => setVolumeStatus('SESUAI')} color="green">Sesuai</RadioPill>
              <RadioPill selected={volumeStatus === 'SELISIH'} onClick={() => setVolumeStatus('SELISIH')} color="red">Ada Selisih</RadioPill>
            </div>
            {volumeStatus === 'SELISIH' && (
              <div className="animate-slide-down mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Jumlah Selisih (Liter)</label>
                <input
                  type="number"
                  value={volumeDiff}
                  onChange={e => setVolumeDiff(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200"
                  placeholder="Contoh: 50"
                  step="0.1"
                />
              </div>
            )}
            <div className="mt-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Catatan (Opsional)</label>
              <textarea
                value={volumeNotes}
                onChange={e => setVolumeNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200 min-h-[80px] resize-none text-sm"
                placeholder="Catatan tentang volume..."
              />
            </div>
            <div className="mt-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Foto (Opsional)</label>
              <div className="flex gap-3 mb-4">
                <button type="button" onClick={triggerVolumePhotoUpload} className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-pertamina-red hover:text-pertamina-red dark:hover:border-pertamina-red dark:hover:text-pertamina-red transition-all duration-200 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Galeri
                </button>
                <button type="button" onClick={triggerVolumeCameraCapture} className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-pertamina-red hover:text-pertamina-red dark:hover:border-pertamina-red dark:hover:text-pertamina-red transition-all duration-200 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Kamera
                </button>
              </div>
              {volumePhotoPreview && (
                <div className="relative group">
                  <img src={volumePhotoPreview} alt="Preview Volume" className="w-full h-40 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-700" />
                  <button type="button" onClick={() => { setVolumePhoto(null); setVolumePhotoPreview(null); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
              <input ref={volumePhotoInputRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleVolumePhotoChange} className="hidden" />
              <input ref={volumeCameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleVolumeCameraCapture} className="hidden" />
            </div>
          </FormSection>

          {/* 3. Visual Produk */}
          <FormSection icon={Eye} title="Bagaimana hasil uji VISUAL KUALITAS?" number={3}>
            <div className="flex flex-wrap gap-3 mb-4">
              <RadioPill selected={visualCondition === 'JERNIH'} onClick={() => setVisualCondition('JERNIH')} color="green">Jernih</RadioPill>
              <RadioPill selected={visualCondition === 'ADA_AIR'} onClick={() => setVisualCondition('ADA_AIR')} color="amber">Ada Air</RadioPill>
              <RadioPill selected={visualCondition === 'ADA_ENDAPAN'} onClick={() => setVisualCondition('ADA_ENDAPAN')} color="red">Ada Endapan</RadioPill>
            </div>
            <div className="mt-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Catatan (Opsional)</label>
              <textarea
                value={visualNotes}
                onChange={e => setVisualNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200 min-h-[80px] resize-none text-sm"
                placeholder="Catatan tentang visual produk..."
              />
            </div>
            <div className="mt-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Foto (Opsional)</label>
              <div className="flex gap-3 mb-4">
                <button type="button" onClick={triggerVisualPhotoUpload} className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-pertamina-red hover:text-pertamina-red dark:hover:border-pertamina-red dark:hover:text-pertamina-red transition-all duration-200 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Galeri
                </button>
                <button type="button" onClick={triggerVisualCameraCapture} className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-pertamina-red hover:text-pertamina-red dark:hover:border-pertamina-red dark:hover:text-pertamina-red transition-all duration-200 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Kamera
                </button>
              </div>
              {visualPhotoPreview && (
                <div className="relative group">
                  <img src={visualPhotoPreview} alt="Preview Visual" className="w-full h-40 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-700" />
                  <button type="button" onClick={() => { setVisualPhoto(null); setVisualPhotoPreview(null); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
              <input ref={visualPhotoInputRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleVisualPhotoChange} className="hidden" />
              <input ref={visualCameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleVisualCameraCapture} className="hidden" />
            </div>
          </FormSection>

          {/* 4. Densitas */}
          <FormSection icon={Gauge} title="Densitas (kg/m³)" number={4}>
            <input
              type="number"
              value={density}
              onChange={e => setDensity(e.target.value)}
              className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200 ${
                isDensityOutOfRange ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200 dark:border-slate-700'
              }`}
              placeholder="Contoh: 745.2"
              step="0.1"
            />
            <p className="text-xs text-slate-400 mt-2">Standar: {currentStandard.min} — {currentStandard.max} kg/m³</p>
            {currentStandard.note && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">{currentStandard.note}</p>
              </div>
            )}
            {isDensityOutOfRange && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 animate-slide-down">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-xs font-bold text-red-600 dark:text-red-400">Densitas di luar standar!</span>
              </div>
            )}
            <div className="mt-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Catatan (Opsional)</label>
              <textarea
                value={densityNotes}
                onChange={e => setDensityNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200 min-h-[80px] resize-none text-sm"
                placeholder="Catatan tentang densitas..."
              />
            </div>
            <div className="mt-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Foto (Opsional)</label>
              <div className="flex gap-3 mb-4">
                <button type="button" onClick={triggerDensityPhotoUpload} className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-pertamina-red hover:text-pertamina-red dark:hover:border-pertamina-red dark:hover:text-pertamina-red transition-all duration-200 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Galeri
                </button>
                <button type="button" onClick={triggerDensityCameraCapture} className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-pertamina-red hover:text-pertamina-red dark:hover:border-pertamina-red dark:hover:text-pertamina-red transition-all duration-200 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Kamera
                </button>
              </div>
              {densityPhotoPreview && (
                <div className="relative group">
                  <img src={densityPhotoPreview} alt="Preview Densitas" className="w-full h-40 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-700" />
                  <button type="button" onClick={() => { setDensityPhoto(null); setDensityPhotoPreview(null); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
              <input ref={densityPhotoInputRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleDensityPhotoChange} className="hidden" />
              <input ref={densityCameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleDensityCameraCapture} className="hidden" />
            </div>
          </FormSection>

          {/* 5. Rating */}
          <FormSection icon={Star} title="Rating Pelayanan & Kepatuhan HSSE AMT" number={5}>
            <div className="grid gap-5">
              {[
                { label: 'SOP', value: ratingSOP, setValue: setRatingSOP, hoverValue: hoverRatingSOP, setHoverValue: setHoverRatingSOP },
                { label: 'Keramahan', value: ratingKeramahan, setValue: setRatingKeramahan, hoverValue: hoverRatingKeramahan, setHoverValue: setHoverRatingKeramahan },
                { label: 'Seragam APD', value: ratingSeragam, setValue: setRatingSeragam, hoverValue: hoverRatingSeragam, setHoverValue: setHoverRatingSeragam },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span>{item.label}</span>
                    <span>{item.value > 0 ? `${item.value}/5` : 'Belum dinilai'}</span>
                  </div>
                  <div className="flex gap-2 justify-center py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => item.setValue(star)}
                        onMouseEnter={() => item.setHoverValue(star)}
                        onMouseLeave={() => item.setHoverValue(0)}
                        className="transition-transform hover:scale-125 active:scale-90"
                      >
                        <Star
                          className={`w-9 h-9 transition-colors ${
                            star <= (item.hoverValue || item.value)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {ratingSOP || ratingKeramahan || ratingSeragam ? (
              <div className="mt-5 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
                <p className="text-center text-sm font-bold text-amber-700 dark:text-amber-400">
                  Rata-rata: {ratingSOP || ratingKeramahan || ratingSeragam ? Math.round((ratingSOP + ratingKeramahan + ratingSeragam) / 3) : 0}/5
                </p>
              </div>
            ) : null}
          </FormSection>

          {/* 6. Catatan Umum */}
          <FormSection icon={MessageSquare} title="Catatan Tambahan (Opsional)" number={6}>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-pertamina-red/20 focus:border-pertamina-red outline-none transition-all duration-200 min-h-[100px] resize-none text-sm"
              placeholder="Catatan tambahan yang tidak spesifik ke salah satu kategori..."
            />
          </FormSection>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-pertamina-red to-pertamina-red-dark hover:from-pertamina-red-dark hover:to-pertamina-red text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-pertamina-red/25 hover:shadow-pertamina-red/35 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Mengirim...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Kirim Feedback</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-8 pb-8 font-medium">
          © 2026 Q-Pass Bitung — Integrated Terminal Bitung
        </p>
      </div>

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-80 object-cover bg-black"
              />
              <canvas ref={canvasRef} className="hidden" />
              <button
                onClick={closeCamera}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 flex gap-4">
              <button
                onClick={capturePhoto}
                className="flex-1 py-4 bg-gradient-to-r from-pertamina-red to-pertamina-red-dark text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:from-pertamina-red-dark hover:to-pertamina-red transition-all duration-300"
              >
                <Camera className="w-5 h-5" />
                Ambil Foto
              </button>
              <button
                onClick={closeCamera}
                className="px-6 py-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-300"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function InfoItem({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value || '-'}</p>
    </div>
  );
}

function FormSection({ icon: Icon, title, number, children }) {
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pertamina-red to-pertamina-red-dark flex items-center justify-center shadow-lg shadow-pertamina-red/20">
          <span className="text-sm font-black text-white">{number}</span>
        </div>
        <Icon className="w-6 h-6 text-pertamina-red" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function RadioPill({ selected, onClick, color, children }) {
  const colors = {
    green: selected 
      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
    red: selected 
      ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-500 text-white shadow-lg shadow-red-500/25' 
      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30',
    amber: selected 
      ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/25' 
      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all duration-300 active:scale-95 ${
        selected ? `${colors[color]} -translate-y-0.5` : colors[color]
      }`}
    >
      {children}
    </button>
  );
}

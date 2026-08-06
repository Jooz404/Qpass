import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Settings, Lock, User, Save, Shield, Camera, Upload } from 'lucide-react';

export default function SettingsPage() {
  const toast = useToast();
  const { user, setUser } = useAuth();
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.avatar || null);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      await api.put('/auth/profile', profileForm);
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.warning('Konfirmasi password tidak cocok');
      return;
    }
    setLoadingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password berhasil diperbarui');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.warning('Hanya file gambar yang diperbolehkan');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Ukuran file maksimal 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) {
      toast.warning('Pilih foto terlebih dahulu');
      return;
    }
    setLoadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      const response = await api.post('/auth/upload-photo', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });
      toast.success('Foto profil berhasil diperbarui');
      setPhotoFile(null);
      if (response.data.data.photoUrl) {
        const updatedUser = { ...user, avatar: response.data.data.photoUrl };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setPhotoPreview(response.data.data.photoUrl);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengupload foto');
    } finally {
      setLoadingPhoto(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-pertamina-red" /> Pengaturan Akun
        </h1>
        <p className="text-sm text-gray-500">Kelola informasi profil dan keamanan akun Anda</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Card */}
        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-pertamina-blue" /> Informasi Profil
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Photo Upload Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pertamina-red/10 to-pertamina-blue/10 border-2 border-pertamina-red/20 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-pertamina-red/50" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-pertamina-red rounded-full flex items-center justify-center cursor-pointer hover:bg-pertamina-red-dark transition-colors shadow-lg">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto Profil</p>
                <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG. Maksimal: 5MB</p>
                {photoFile && (
                  <button
                    type="button"
                    onClick={handleUploadPhoto}
                    disabled={loadingPhoto}
                    className="mt-2 btn-primary flex items-center gap-2 text-xs py-1.5 px-3"
                  >
                    <Upload className="w-3 h-3" /> {loadingPhoto ? 'Mengupload...' : 'Upload Foto'}
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                className="input-field mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                className="input-field mt-1"
                required
                disabled
              />
              <p className="text-[10px] text-gray-400 mt-1">Email login utama tidak dapat diubah secara mandiri</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loadingProfile} className="btn-primary flex items-center gap-2 text-sm py-2 px-5">
                <Save className="w-4 h-4" /> {loadingProfile ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-pertamina-red" /> Ubah Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password Saat Ini</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                className="input-field mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password Baru</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                className="input-field mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="input-field mt-1"
                required
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loadingPassword} className="btn-primary flex items-center gap-2 text-sm py-2 px-5">
                <Shield className="w-4 h-4" /> {loadingPassword ? 'Memproses...' : 'Ubah Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Cloud,
  RotateCcw,
  Trash2,
  Info,
  Key,
  Globe,
  Building,
  Save,
  ShieldCheck,
  Lock,
  LogOut,
  User as UserIcon,
  Check,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/auth/authService';
import { ConfirmModal } from '../common/ConfirmModal';
import { aqualinkApiService, meterinApiService } from '../../services/api/aqualinkApi';

export const SettingsView: React.FC = () => {
  const { devices, resetToDummy, clearAll } = useDevices();
  const { success, error, info } = useToast();
  const { user, logout, changePassword } = useAuth();
  const navigate = useNavigate();

  // Organization Preferences
  const [warehouseName, setWarehouseName] = useState(() => {
    return localStorage.getItem('aqualink_warehouse_name') || 'Gudang Utama AquaLink IoT Hub';
  });
  const [operatorName, setOperatorName] = useState(() => {
    return localStorage.getItem('aqualink_operator_name') || 'Administrator Gudang';
  });
  const [batteryThreshold, setBatteryThreshold] = useState<number>(20);
  const [rssiThreshold, setRssiThreshold] = useState<number>(-110);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Future API Integration Placeholder State
  const [apiProvider, setApiProvider] = useState<'aqualink' | 'meterin'>('aqualink');
  const [apiUrl, setApiUrl] = useState<string>('https://api.aqualinkos.io/v1');
  const [apiKey, setApiKey] = useState<string>('');
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);

  // Confirmation Modals
  const [isResetDummyModalOpen, setIsResetDummyModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isResetAuthModalOpen, setIsResetAuthModalOpen] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('aqualink_warehouse_name', warehouseName);
    localStorage.setItem('aqualink_operator_name', operatorName);
    success('Pengaturan Disimpan', 'Preferensi sistem gudang berhasil diperbarui.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!oldPassword.trim()) {
      setPasswordError('Password lama wajib diisi.');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('Password baru minimal 4 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setIsChangingPassword(true);
    const res = changePassword(oldPassword.trim(), newPassword.trim());
    setIsChangingPassword(false);

    if (res.success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.error || 'Gagal mengubah password.');
    }
  };

  const handleResetAuthToDefault = () => {
    AuthService.resetToDefault();
    success('Kredensial Direset', 'Akun admin telah dikembalikan ke default: admin / admin123');
    setIsResetAuthModalOpen(false);
  };

  const handleTestApiConnection = async () => {
    setIsTestingConnection(true);
    try {
      const service = apiProvider === 'aqualink' ? aqualinkApiService : meterinApiService;
      const res = await service.testConnection();
      if (res.success && res.data) {
        success('Tes Koneksi Berhasil', `Server ${res.data.status.toUpperCase()} (Versi API: ${res.data.version}).`);
      } else {
        info('Hasil Pengujian', 'Server merespons tetapi tidak mengembalikan status valid.');
      }
    } catch {
      error('Koneksi Gagal', 'Tidak dapat menghubungi server API.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Sistem</h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola profil akun administrator, keamanan kata sandi, konfigurasi gudang, dan sinkronisasi data.
        </p>
      </div>

      {/* SECTION 1: KEAMANAN AKUN & PASSWORD ADMINISTRATOR */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-900">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Keamanan Akun & Password Administrator</h2>
              <p className="text-xs text-slate-500">
                Kelola sesi login, ganti kata sandi admin, atau reset ke pengaturan kredensial bawaan.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin keluar dari sesi sistem?')) {
                logout();
                navigate('/login');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>

        {/* Profile Card & Change Password Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active User Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Profil Pengguna Aktif
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center text-2xl shadow-sm">
                  {user?.avatar || '👤'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{user?.name || 'Administrator'}</h3>
                  <span className="inline-block px-2 py-0.5 mt-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                    {user?.roleLabel || 'Super Admin'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 text-xs border-t border-slate-200/60">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Username:</span>
                  <span className="font-mono font-bold text-slate-700">@{user?.username || 'admin'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-700 font-medium">{user?.email || 'admin@laison.com'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Status Sesi:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Terotentikasi
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsResetAuthModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 bg-white text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Kredensial Bawaan</span>
            </button>
          </div>

          {/* Change Password Form */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 bg-white space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Lock className="w-4 h-4 text-blue-900" />
              <span>Ganti Kata Sandi (Password)</span>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Password Lama
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password lama"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 4 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isChangingPassword ? 'Menyimpan...' : 'Perbarui Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SECTION 2: PREFERENSI GUDANG */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Preferensi Operasional Gudang</h2>
            <p className="text-xs text-slate-500">
              Konfigurasi metadata organisasi dan batas ambang parameter deteksi anomali
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Gudang / Fasilitas
              </label>
              <input
                type="text"
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Penanggung Jawab / Operator
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Minimum Baterai Peringatan (%)
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={batteryThreshold}
                onChange={(e) => setBatteryThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Perangkat di bawah ambang ini akan ditandai dengan peringatan baterai lemah.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Ambang Sinyal Lemah (RSSI dBm)
              </label>
              <input
                type="number"
                max="-50"
                min="-140"
                value={rssiThreshold}
                onChange={(e) => setRssiThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Sinyal lebih rendah dari nilai ini ditandai sebagai koneksi buruk.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Gudang</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: INTEGRASI CLOUD API (PERSISTENSI MASA DEPAN) */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Integrasi Server & Sinkronisasi API</h2>
            <p className="text-xs text-slate-500">
              Konfigurasi endpoint untuk sinkronisasi otomatis status online perangkat dari server IoT
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Penyedia Platform IoT</label>
              <select
                value={apiProvider}
                onChange={(e) => setApiProvider(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="aqualink">AquaLink Cloud Platform (Bawaan)</option>
                <option value="meterin">Meterin Platform (Alternatif)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">API Base Endpoint</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">API Access Token / Secret Key</label>
            <input
              type="password"
              placeholder="Masukkan API Key untuk integrasi..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Status Koneksi API: Standalone Offline</span>
            </div>

            <button
              type="button"
              onClick={handleTestApiConnection}
              disabled={isTestingConnection}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              {isTestingConnection ? 'Menguji...' : 'Uji Status Integrasi API'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: MANAJEMEN DATA DUMMY & RESET */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Manajemen Data Dummy & Pembersihan</h2>
            <p className="text-xs text-slate-500">
              Opsi untuk memuat ulang data percontohan resmi (107 unit), atau membersihkan database browser
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Reload Dummy */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-sky-600" /> Muat Ulang Data Asli (107 Unit)
              </h4>
              <p className="text-[11px] text-slate-500">
                Kembalikan 107 unit data perangkat resmi Laison (45 LoRaWAN + 62 NB-IoT) lengkap dengan status dan riwayatnya dari Excel.
              </p>
            </div>
            <button
              onClick={() => setIsResetDummyModalOpen(true)}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Muat Ulang 107 Unit
            </button>
          </div>

          {/* Clear All */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" /> Kosongkan Seluruh Data
              </h4>
              <p className="text-[11px] text-slate-500">
                Hapus seluruh perangkat ({devices.length} unit) dari memori browser untuk memulai dari nol.
              </p>
            </div>
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Kosongkan Database
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isResetDummyModalOpen}
        title="Muat Ulang Data Asli (107 Perangkat)?"
        message="Tindakan ini akan memulihkan 107 data perangkat dari file Excel resmi Enviro LORAWAN & NBIOT. Perubahan manual yang belum dibackup akan tertimpa."
        confirmLabel="Ya, Muat Ulang"
        cancelLabel="Batal"
        variant="warning"
        onClose={() => setIsResetDummyModalOpen(false)}
        onConfirm={() => resetToDummy()}
      />

      <ConfirmModal
        isOpen={isClearAllModalOpen}
        title="Peringatan: Kosongkan Seluruh Database?"
        message={`Apakah Anda yakin ingin MENGHAPUS SEMUA (${devices.length} perangkat) dari penyimpanan browser?\n\nPastikan Anda telah membuat cadangan (Backup JSON) jika data ini masih diperlukan.`}
        confirmLabel="Ya, Hapus Semua Data"
        cancelLabel="Batal"
        variant="danger"
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={() => clearAll()}
      />

      <ConfirmModal
        isOpen={isResetAuthModalOpen}
        title="Reset Kredensial Administrator?"
        message="Tindakan ini akan mengembalikan akun dan password ke pengaturan awal bawaan (Username: admin, Password: admin123). Anda akan dapat masuk kembali dengan akun tersebut."
        confirmLabel="Ya, Reset Kredensial"
        cancelLabel="Batal"
        variant="warning"
        onClose={() => setIsResetAuthModalOpen(false)}
        onConfirm={handleResetAuthToDefault}
      />
    </div>
  );
};
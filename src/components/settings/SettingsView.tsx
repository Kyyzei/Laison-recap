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
} from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { aqualinkApiService, meterinApiService } from '../../services/api/aqualinkApi';

export const SettingsView: React.FC = () => {
  const { devices, resetToDummy, clearAll } = useDevices();
  const { success, error, info } = useToast();

  // Organization Preferences
  const [warehouseName, setWarehouseName] = useState(() => {
    return localStorage.getItem('aqualink_warehouse_name') || 'Gudang Utama AquaLink IoT Hub';
  });
  const [operatorName, setOperatorName] = useState(() => {
    return localStorage.getItem('aqualink_operator_name') || 'Administrator Gudang';
  });
  const [batteryThreshold, setBatteryThreshold] = useState<number>(20);
  const [rssiThreshold, setRssiThreshold] = useState<number>(-110);

  // Future API Integration Placeholder State
  const [apiProvider, setApiProvider] = useState<'aqualink' | 'meterin'>('aqualink');
  const [apiUrl, setApiUrl] = useState<string>('https://api.aqualinkos.io/v1');
  const [apiKey, setApiKey] = useState<string>('');
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);

  // Confirmation Modals
  const [isResetDummyModalOpen, setIsResetDummyModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('aqualink_warehouse_name', warehouseName);
    localStorage.setItem('aqualink_operator_name', operatorName);
    success('Pengaturan Disimpan', 'Preferensi sistem gudang berhasil diperbarui.');
  };

  const handleTestApiConnection = async () => {
    setIsTestingConnection(true);
    try {
      const service = apiProvider === 'aqualink' ? aqualinkApiService : meterinApiService;
      const res = await service.testConnection();

      if (res.success) {
        success('Tes Koneksi', `Koneksi berhasil (${res.data?.status || 'Online'}). Siap integrasi di masa depan.`);
      } else {
        info('Mode Standalone Aktif', res.error || 'Server API belum diaktifkan (berjalan lokal).');
      }
    } catch (err: any) {
      error('Koneksi Gagal', err.message || 'Tidak dapat terhubung.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan Sistem & Database
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola preferensi sistem gudang, reset data dummy, dan arsitektur integrasi API masa depan
        </p>
      </div>

      {/* SECTION 1: PREFERENSI GUDANG */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-900">
            <Building className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Identitas Gudang & Ambang Batas Peringatan</h2>
            <p className="text-xs text-slate-500">Nama unit gudang dan parameter batas deteksi peringatan telemetri</p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nama Unit Gudang / Depot</label>
              <input
                type="text"
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Petugas / Operator Penanggung Jawab</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Batas Peringatan Baterai Kritis (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={batteryThreshold}
                  onChange={(e) => setBatteryThreshold(Number(e.target.value))}
                  className="w-24 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
                <span className="text-xs text-slate-500">
                  Perangkat dengan baterai di bawah {batteryThreshold}% akan ditandai kritis.
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Batas Peringatan Sinyal Lemah RSSI (dBm)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  max="-50"
                  min="-140"
                  value={rssiThreshold}
                  onChange={(e) => setRssiThreshold(Number(e.target.value))}
                  className="w-24 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
                <span className="text-xs text-slate-500">
                  Perangkat dengan sinyal lebih rendah dari {rssiThreshold} dBm akan ditandai lemah.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-950/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Preferensi</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: INTEGRASI API MASA DEPAN (AQUALINKOS / METERIN) */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Integrasi Cloud API (AquaLinkOS / Meterin)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Mode Awal: Nonaktif (Lokal Saja)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Struktur arsitektur service API modular siap pakai ketika layanan cloud hendak diaktifkan
              </p>
            </div>
          </div>
        </div>

        {/* Notice alert */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Kesiapan Integrasi API Cloud</span>
          </div>
          <p className="text-slate-600 leading-relaxed pl-6">
            Aplikasi dirancang dengan pola terpisah (<code>src/services/api/aqualinkApi.ts</code>). Saat ini
            seluruh operasi berjalan 100% offline secara lokal di browser via <code>localStorage</code>. Anda dapat
            mengonfigurasi kunci API dan endpoint di bawah ini untuk persiapan sinkronisasi masa depan.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {/* Provider Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => {
                setApiProvider('aqualink');
                setApiUrl('https://api.aqualinkos.io/v1');
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                apiProvider === 'aqualink'
                  ? 'border-blue-900 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">AquaLinkOS Cloud API</span>
                <span className="text-[10px] font-semibold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full">
                  Official
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Platform IoT terpusat AquaLink</p>
            </div>

            <div
              onClick={() => {
                setApiProvider('meterin');
                setApiUrl('https://api.meterin.id/v2');
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                apiProvider === 'meterin'
                  ? 'border-blue-900 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Meterin IoT Platform</span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Partner
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Portal billing dan telemetri Meterin</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" /> Endpoint Base URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.aqualinkos.io/v1"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" /> Kunci Akses (API Key)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Masukkan API Key (misal: aqlk_live_xxxx)"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
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

      {/* SECTION 3: MANAJEMEN DATA DUMMY & RESET */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Manajemen Data Dummy & Pembersihan</h2>
            <p className="text-xs text-slate-500">
              Opsi untuk memuat ulang data percontohan, menghapus data dummy, atau membersihkan database
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Reload Dummy */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-sky-600" /> Muat Ulang Data Dummy
              </h4>
              <p className="text-[11px] text-slate-500">
                Kembalikan 80 unit data perangkat resmi Laison lengkap dengan status dan riwayatnya.
              </p>
            </div>
            <button
              onClick={() => setIsResetDummyModalOpen(true)}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Muat Ulang Dummy
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
        title="Muat Ulang Data Asli?"
        message="Tindakan ini akan memulihkan 80 data perangkat dari file Excel resmi Enviro LORAWAN & NBIOT. Perubahan manual yang belum dibackup akan tertimpa."
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
    </div>
  );
};


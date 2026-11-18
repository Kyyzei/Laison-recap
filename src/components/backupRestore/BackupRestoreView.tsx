import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  FileJson,
  ShieldCheck,
} from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';
import { useToast } from '../../context/ToastContext';
import { BackupService } from '../../services/backup/backupService';
import { LocalStorageService } from '../../services/storage/localStorageService';
import { ConfirmModal } from '../common/ConfirmModal';
import { BackupData } from '../../types/common';

export const BackupRestoreView: React.FC = () => {
  const { devices, refreshDevices } = useDevices();
  const { success, error } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Storage usage stats derived directly from storage
  const storageStats = LocalStorageService.getStorageStats();

  // Restore state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<BackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);

  // Handle backup download
  const handleDownloadBackup = () => {
    try {
      BackupService.exportBackup();
      success('Cadangan Berhasil Dibuat', 'Berkas JSON cadangan inventaris berhasil diunduh ke komputer.');
    } catch (err: any) {
      error('Gagal Membuat Cadangan', err.message || 'Terjadi kesalahan.');
    }
  };

  // Handle restore file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const result = await BackupService.validateBackupFile(file);

    if (result.isValid && result.data) {
      setParsedBackup(result.data);
      success('Berkas Cadangan Valid', `Ditemukan ${result.data.deviceCount} unit perangkat dalam berkas cadangan.`);
    } else {
      setParsedBackup(null);
      error('Berkas Cadangan Tidak Valid', result.error || 'Format berkas JSON tidak sesuai spesifikasi.');
    }
  };

  // Execute restore
  const handleExecuteRestore = () => {
    if (!parsedBackup) return;

    try {
      const res = BackupService.restore(parsedBackup, restoreMode);
      refreshDevices();
      success(
        'Pemulihan Berhasil',
        restoreMode === 'overwrite'
          ? `Seluruh data berhasil ditimpa dengan ${res.restoredCount} perangkat dari cadangan.`
          : `Berhasil menambahkan ${res.restoredCount} perangkat baru (${res.skippedCount} dilewati karena sudah ada).`
      );
      // Reset state
      setParsedBackup(null);
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      error('Gagal Memulihkan Data', err.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Backup & Restore Database
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Simpan seluruh salinan data inventaris perangkat ke berkas JSON atau pulihkan data sebelumnya
        </p>
      </div>

      {/* Storage Quota Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-100 text-blue-900 shrink-0">
            <HardDrive className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Penyimpanan Lokal Browser (localStorage)</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Offline Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Data tersimpan permanen di memori lokal peramban Anda tanpa ketergantungan server internet
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
          <div className="space-y-1 sm:w-48">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Terpakai:</span>
              <span className="font-bold text-slate-800">
                {storageStats.usedKb} KB / {storageStats.maxKb} KB
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.max(4, storageStats.percentage)}%` }}
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
              />
            </div>
          </div>

          <div className="text-right border-l border-slate-200 pl-4 hidden sm:block">
            <div className="text-2xl font-black text-blue-900">{storageStats.deviceCount}</div>
            <div className="text-[11px] text-slate-400">Total Unit Terdaftar</div>
          </div>
        </div>
      </div>

      {/* Backup & Restore Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: CREATE BACKUP */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-900">
                <Download className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Buat Cadangan (Backup JSON)</h3>
                <p className="text-xs text-slate-500">Unduh seluruh rekaman database perangkat ke dalam satu berkas</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Keuntungan Berkas Cadangan JSON:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
                <li>Menyimpan seluruh spesifikasi, riwayat telemetri, dan catatan teknisi.</li>
                <li>Dapat dipindahkan antar komputer atau disimpan di Google Drive / Flashdisk.</li>
                <li>Pemulihan 100% presisi tanpa resiko format kolom terpotong.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Jumlah Perangkat:</span>
              <span className="font-bold text-slate-900">{devices.length} Unit</span>
            </div>
          </div>

          <button
            onClick={handleDownloadBackup}
            disabled={devices.length === 0}
            className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Cadangan JSON ({devices.length} Unit)</span>
          </button>
        </div>

        {/* SECTION 2: RESTORE BACKUP */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pulihkan Cadangan (Restore JSON)</h3>
                <p className="text-xs text-slate-500">Unggah berkas JSON cadangan untuk memulihkan inventaris</p>
              </div>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl p-6 text-center bg-slate-50/60 hover:bg-emerald-50/20 transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 text-slate-500 group-hover:text-emerald-600 flex items-center justify-center mx-auto mb-2 transition-colors">
                <FileJson className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {uploadedFile ? uploadedFile.name : 'Pilih Berkas Cadangan JSON'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Format berkas harus berekstensi <span className="font-mono font-semibold">.json</span>
              </p>
            </div>

            {/* Parsed backup info */}
            {parsedBackup && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Berkas Cadangan Terverifikasi
                  </span>
                  <span className="font-mono text-emerald-800 font-bold">
                    {parsedBackup.deviceCount} Perangkat
                  </span>
                </div>
                <div className="text-slate-600 text-[11px] space-y-0.5">
                  <p>Tanggal Dibuat: {new Date(parsedBackup.exportedAt).toLocaleString('id-ID')}</p>
                  <p>Aplikasi Sumber: {parsedBackup.appName} (v{parsedBackup.version})</p>
                </div>

                {/* Restore Mode Choice */}
                <div className="pt-2 border-t border-emerald-200/60 space-y-1.5">
                  <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                    Mode Pemulihan:
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="overwrite"
                        checked={restoreMode === 'overwrite'}
                        onChange={() => setRestoreMode('overwrite')}
                        className="accent-blue-900"
                      />
                      <span>Timpa Semua (Overwrite)</span>
                    </label>
                    <label className="flex items-center gap-1.5 font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="accent-blue-900"
                      />
                      <span>Gabungkan (Merge)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsConfirmRestoreOpen(true)}
            disabled={!parsedBackup}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Eksekusi Pemulihan Database</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      <ConfirmModal
        isOpen={isConfirmRestoreOpen}
        title="Konfirmasi Pemulihan Database"
        message={
          restoreMode === 'overwrite'
            ? `Peringatan: Mode "Timpa Semua" akan MENGHAPUS seluruh ${devices.length} perangkat yang ada saat ini dan menggantikannya dengan ${parsedBackup?.deviceCount} perangkat dari berkas cadangan.\n\nApakah Anda yakin ingin melanjutkan?`
            : `Mode "Gabungkan" akan menambahkan ${parsedBackup?.deviceCount} perangkat ke dalam sistem tanpa menghapus data yang sudah ada.\n\nLanjutkan proses pemulihan?`
        }
        confirmLabel="Ya, Pulihkan Sekarang"
        cancelLabel="Batal"
        variant={restoreMode === 'overwrite' ? 'danger' : 'info'}
        onClose={() => setIsConfirmRestoreOpen(false)}
        onConfirm={handleExecuteRestore}
      />
    </div>
  );
};


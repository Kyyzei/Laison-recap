import React, { useState } from 'react';
import { Device, DeviceStatus, getDeviceWarehouseStatus } from '../../types/device';
import { useDevices } from '../../context/DeviceContext';
import { X, LogOut, LogIn, Calendar, MapPin, User, FileText, CheckCircle2 } from 'lucide-react';

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

interface WarehouseMovementModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
  mode: 'KELUAR' | 'KEMBALI';
}

export const WarehouseMovementModal: React.FC<WarehouseMovementModalProps> = ({
  device,
  isOpen,
  onClose,
  mode,
}) => {
  const { updateDevice, uniqueLokasi } = useDevices();

  // Form states
  const [tanggal, setTanggal] = useState<string>(getTodayDateString);
  const [lokasi, setLokasi] = useState<string>('');
  const [penerima, setPenerima] = useState<string>('');
  const [keperluan, setKeperluan] = useState<string>('Pemasangan / Instalasi');
  const [statusPerangkat, setStatusPerangkat] = useState<DeviceStatus>('Terpasang');
  const [catatan, setCatatan] = useState<string>('');
  const [prevKey, setPrevKey] = useState<string>('');

  const currentKey = `${isOpen}-${device?.id}-${mode}`;
  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    setTanggal(getTodayDateString());
    if (device) {
      if (mode === 'KELUAR') {
        setLokasi(device.lokasi || '');
        setPenerima(device.penerimaKeluar || '');
        setKeperluan(device.keperluanKeluar || 'Pemasangan / Instalasi');
        setStatusPerangkat(device.status === 'Stok' ? 'Terpasang' : device.status);
        setCatatan('');
      } else {
        setLokasi('Gudang Utama AquaLink');
        setPenerima('');
        setKeperluan('Pengembalian ke Gudang');
        setStatusPerangkat('Stok');
        setCatatan('');
      }
    }
  }

  if (!isOpen || !device) return null;

  const currentWarehouseStatus = getDeviceWarehouseStatus(device);
  const isKeluar = mode === 'KELUAR';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const movementId = 'mov-' + Date.now();
    const existingHistory = device.riwayatGudang || [];

    if (isKeluar) {
      const newMovement = {
        id: movementId,
        tipe: 'KELUAR' as const,
        tanggal,
        lokasi: lokasi.trim() || device.lokasi || 'Lokasi Lapangan',
        penerima: penerima.trim(),
        keperluan: keperluan.trim(),
        catatan: catatan.trim(),
        createdAt: new Date().toISOString(),
      };

      updateDevice(device.id, {
        tanggalKeluar: tanggal,
        posisiGudang: 'DI_LUAR',
        lokasi: lokasi.trim() || device.lokasi,
        penerimaKeluar: penerima.trim(),
        keperluanKeluar: keperluan.trim(),
        status: statusPerangkat,
        riwayatGudang: [newMovement, ...existingHistory],
      });
    } else {
      const newMovement = {
        id: movementId,
        tipe: 'KEMBALI' as const,
        tanggal,
        lokasi: lokasi.trim() || 'Gudang Utama',
        penerima: penerima.trim(),
        keperluan: keperluan.trim(),
        catatan: catatan.trim(),
        createdAt: new Date().toISOString(),
      };

      updateDevice(device.id, {
        tanggalKembali: tanggal,
        posisiGudang: 'DI_GUDANG',
        lokasi: lokasi.trim() || 'Gudang Utama AquaLink',
        status: statusPerangkat,
        riwayatGudang: [newMovement, ...existingHistory],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 text-white ${
            isKeluar ? 'bg-gradient-to-r from-amber-600 to-amber-700' : 'bg-gradient-to-r from-emerald-600 to-teal-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              {isKeluar ? <LogOut className="w-5 h-5 text-white" /> : <LogIn className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isKeluar ? 'Catat Keluar dari Gudang' : 'Catat Kembali ke Gudang'}
              </h2>
              <p className="text-xs text-white/80 font-mono">
                Seri: {device.seri} ({device.koneksi})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status info strip */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">Posisi saat ini:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
              currentWarehouseStatus === 'DI_GUDANG'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {currentWarehouseStatus === 'DI_GUDANG' ? '🟢 Di Dalam Gudang' : '🟠 Sedang di Luar Gudang'}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-900" />
              <span>{isKeluar ? 'Tanggal Keluar Gudang' : 'Tanggal Kembali ke Gudang'}</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Lokasi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-900" />
              <span>{isKeluar ? 'Lokasi Tujuan Pengiriman / Pemasangan' : 'Lokasi Simpan di Gudang'}</span>
            </label>
            <input
              type="text"
              list="list-lokasi-movement"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder={isKeluar ? 'Contoh: P. Kelapa Dua, Bukit Asam, Site Semarang' : 'Contoh: Gudang Utama Rak B-02'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <datalist id="list-lokasi-movement">
              {uniqueLokasi.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>

          {/* PIC / Teknisi & Keperluan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-900" />
                <span>{isKeluar ? 'Teknisi / PIC Pembawa' : 'Penerima di Gudang'}</span>
              </label>
              <input
                type="text"
                value={penerima}
                onChange={(e) => setPenerima(e.target.value)}
                placeholder="Nama teknisi / staf"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-900" />
                <span>Keperluan / Alasan</span>
              </label>
              {isKeluar ? (
                <select
                  value={keperluan}
                  onChange={(e) => setKeperluan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="Pemasangan / Instalasi">Pemasangan / Instalasi Lapangan</option>
                  <option value="Uji Coba / Lab">Uji Coba / Kalibrasi Lab</option>
                  <option value="Maintenance Lapangan">Perbaikan / Maintenance</option>
                  <option value="Dipinjamkan">Dipinjamkan Sementara</option>
                  <option value="Demo Pelanggan">Demo Presentasi Pelanggan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={keperluan}
                  onChange={(e) => setKeperluan(e.target.value)}
                  placeholder="Keterangan pengembalian"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Update Status Perangkat */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isKeluar ? 'Update Status Perangkat Saat Keluar' : 'Kondisi Perangkat Saat Kembali'}
            </label>
            <select
              value={statusPerangkat}
              onChange={(e) => setStatusPerangkat(e.target.value as DeviceStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {isKeluar ? (
                <>
                  <option value="Terpasang">Terpasang (Di Lokasi)</option>
                  <option value="Dipinjamkan">Dipinjamkan</option>
                  <option value="Maintenance">Maintenance Lapangan</option>
                  <option value="Aktif">Aktif</option>
                </>
              ) : (
                <>
                  <option value="Stok">Stok (Normal & Siap Dipakai Kembali)</option>
                  <option value="Rusak">Rusak (Perlu Servis / Ditarik)</option>
                  <option value="Maintenance">Maintenance (Pemeriksaan Ulang)</option>
                </>
              )}
            </select>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Logistik
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder={isKeluar ? 'Catatan surat jalan / nomor kontak penerima...' : 'Laporan kondisi fisik / nomor baterai...'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isKeluar
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isKeluar ? 'Keluarkan Perangkat' : 'Simpan Masuk Gudang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

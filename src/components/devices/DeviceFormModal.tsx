import React, { useState } from 'react';
import { Device, ConnectionType, DeviceStatus, DEVICE_STATUS_LIST, WarehousePosition, DeviceModel } from '../../types/device';
import { useDevices } from '../../context/DeviceContext';
import { X, Check, Calendar } from 'lucide-react';

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editDevice?: Device | null;
}

export const DeviceFormModal: React.FC<DeviceFormModalProps> = ({
  isOpen,
  onClose,
  editDevice,
}) => {
  const { addDevice, updateDevice, uniqueLokasi, filters } = useDevices();

  const [model, setModel] = useState<DeviceModel>('AquaLink');
  const [koneksi, setKoneksi] = useState<ConnectionType>('LoRaWAN');
  const [seri, setSeri] = useState('');
  const [readAddress, setReadAddress] = useState('');
  // LoRaWAN
  const [devEui, setDevEui] = useState('');
  const [appEui, setAppEui] = useState('');
  const [devAddr, setDevAddr] = useState('');
  // NB-IoT
  const [noSim, setNoSim] = useState('');
  const [apnBand, setApnBand] = useState('');
  const [ip, setIp] = useState('');
  // Common
  const [appKey, setAppKey] = useState('');
  const [status, setStatus] = useState<DeviceStatus>('Stok');
  const [lokasi, setLokasi] = useState('');
  const [catatan, setCatatan] = useState('');
  // Logistik Gudang
  const [tanggalKeluar, setTanggalKeluar] = useState('');
  const [tanggalKembali, setTanggalKembali] = useState('');
  const [penerimaKeluar, setPenerimaKeluar] = useState('');
  const [keperluanKeluar, setKeperluanKeluar] = useState('');

  const [prevTrackKey, setPrevTrackKey] = useState<string>('');

  const currentTrackKey = `${isOpen}-${editDevice?.id || 'new'}`;
  if (prevTrackKey !== currentTrackKey) {
    setPrevTrackKey(currentTrackKey);
    if (editDevice) {
      setModel(editDevice.model || 'AquaLink');
      setKoneksi(editDevice.koneksi);
      setSeri(editDevice.seri);
      setReadAddress(editDevice.readAddress || '');
      setDevEui(editDevice.devEui || '');
      setAppEui(editDevice.appEui || '');
      setDevAddr(editDevice.devAddr || '');
      setNoSim(editDevice.noSim || '');
      setApnBand(editDevice.apnBand || '');
      setIp(editDevice.ip || '');
      setAppKey(editDevice.appKey || '');
      setStatus(editDevice.status);
      setLokasi(editDevice.lokasi || '');
      setCatatan(editDevice.catatan || '');
      setTanggalKeluar(editDevice.tanggalKeluar || '');
      setTanggalKembali(editDevice.tanggalKembali || '');
      setPenerimaKeluar(editDevice.penerimaKeluar || '');
      setKeperluanKeluar(editDevice.keperluanKeluar || '');
    } else {
      setModel(filters.model !== 'ALL' ? filters.model : 'AquaLink');
      setKoneksi('LoRaWAN');
      setSeri('');
      setReadAddress('');
      setDevEui('');
      setAppEui('8CF9572000000000');
      setDevAddr('');
      setNoSim('');
      setApnBand('NBIOT,3,20,28,8');
      setIp('147.93.81.149');
      setAppKey('1AC1EF01E96CAF1BE0D329331A4FC2A8');
      setStatus('Stok');
      setLokasi('');
      setCatatan('');
      setTanggalKeluar('');
      setTanggalKembali('');
      setPenerimaKeluar('');
      setKeperluanKeluar('');
    }
  }

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seri.trim()) {
      alert('Nomor Seri wajib diisi.');
      return;
    }

    const payload = {
      model,
      seri: seri.trim(),
      koneksi,
      readAddress: readAddress.trim(),
      devEui: koneksi === 'LoRaWAN' ? devEui.trim() : '',
      appEui: koneksi === 'LoRaWAN' ? appEui.trim() : '',
      devAddr: koneksi === 'LoRaWAN' ? devAddr.trim() : '',
      noSim: koneksi === 'NB-IoT' ? noSim.trim() : '',
      apnBand: koneksi === 'NB-IoT' ? apnBand.trim() : '',
      ip: koneksi === 'NB-IoT' ? ip.trim() : '',
      appKey: appKey.trim(),
      status,
      lokasi: lokasi.trim(),
      catatan: catatan.trim(),
      tanggalKeluar: tanggalKeluar.trim(),
      tanggalKembali: tanggalKembali.trim(),
      penerimaKeluar: penerimaKeluar.trim(),
      keperluanKeluar: keperluanKeluar.trim(),
      posisiGudang: ((tanggalKeluar.trim() && (!tanggalKembali.trim() || tanggalKeluar.trim() > tanggalKembali.trim())) ? 'DI_LUAR' : 'DI_GUDANG') as WarehousePosition,
    };

    if (editDevice) {
      const ok = updateDevice(editDevice.id, payload);
      if (ok) onClose();
    } else {
      const ok = addDevice(payload);
      if (ok) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-bold text-slate-800">
            {editDevice ? 'Edit Perangkat' : 'Tambah Perangkat Baru'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Model / Kategori Perangkat */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Model / Kategori Perangkat <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setModel('AquaLink')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  model === 'AquaLink'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>💧</span>
                <span>AquaLink</span>
              </button>

              <button
                type="button"
                onClick={() => setModel('Ultrasonic')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  model === 'Ultrasonic'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🔊</span>
                <span>Ultrasonic</span>
              </button>

              <button
                type="button"
                onClick={() => setModel('MIU')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  model === 'MIU'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>📟</span>
                <span>MIU</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Perangkat akan ditempatkan di tab kategori {model === 'AquaLink' ? 'AquaLink' : model === 'Ultrasonic' ? 'Ultrasonic' : 'Meter Interface Unit (MIU)'}
            </p>
          </div>

          {/* Koneksi Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jenis Koneksi
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setKoneksi('LoRaWAN')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border text-center transition-colors cursor-pointer ${
                  koneksi === 'LoRaWAN'
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                LoRaWAN
              </button>
              <button
                type="button"
                onClick={() => setKoneksi('NB-IoT')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border text-center transition-colors cursor-pointer ${
                  koneksi === 'NB-IoT'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                NB-IoT
              </button>
            </div>
          </div>

          {/* Grid 2 cols: Seri & Read Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Seri (SERI) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={seri}
                onChange={(e) => setSeri(e.target.value)}
                placeholder="Contoh: 6604290016"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Read Address
              </label>
              <input
                type="text"
                value={readAddress}
                onChange={(e) => setReadAddress(e.target.value)}
                placeholder="Contoh: AF066604290016"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* LoRaWAN specific fields */}
          {koneksi === 'LoRaWAN' && (
            <div className="space-y-3 p-3 bg-blue-50/40 rounded-xl border border-blue-100">
              <span className="text-[11px] font-bold text-blue-900 uppercase">
                Parameter LoRaWAN
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    DevEUI
                  </label>
                  <input
                    type="text"
                    value={devEui}
                    onChange={(e) => setDevEui(e.target.value)}
                    placeholder="Contoh: 8CF9572000193D62"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    DevAddr
                  </label>
                  <input
                    type="text"
                    value={devAddr}
                    onChange={(e) => setDevAddr(e.target.value)}
                    placeholder="Contoh: 00193D62"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    AppEUI
                  </label>
                  <input
                    type="text"
                    value={appEui}
                    onChange={(e) => setAppEui(e.target.value)}
                    placeholder="8CF9572000000000"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* NB-IoT specific fields */}
          {koneksi === 'NB-IoT' && (
            <div className="space-y-3 p-3 bg-sky-50/40 rounded-xl border border-sky-100">
              <span className="text-[11px] font-bold text-sky-900 uppercase">
                Parameter NB-IoT
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    No SIM
                  </label>
                  <input
                    type="text"
                    value={noSim}
                    onChange={(e) => setNoSim(e.target.value)}
                    placeholder="0851-5378-4819"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    IP Server
                  </label>
                  <input
                    type="text"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    placeholder="147.93.81.149"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    APN & Band
                  </label>
                  <input
                    type="text"
                    value={apnBand}
                    onChange={(e) => setApnBand(e.target.value)}
                    placeholder="NBIOT,3,20,28,8"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AppKey */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              AppKey
            </label>
            <input
              type="text"
              value={appKey}
              onChange={(e) => setAppKey(e.target.value)}
              placeholder="1AC1EF01E96CAF1BE0D329331A4FC2A8"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>

          {/* Status & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Perangkat
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeviceStatus)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs md:text-sm bg-white"
              >
                {DEVICE_STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi
              </label>
              <input
                type="text"
                list="list-lokasi"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="P. Kelapa Dua, Bukit Asam, dll"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs md:text-sm"
              />
              <datalist id="list-lokasi">
                {uniqueLokasi.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Logistik & Riwayat Gudang */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-900" />
              <span>Logistik & Riwayat Gudang</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tanggal Keluar Gudang
                </label>
                <input
                  type="date"
                  value={tanggalKeluar}
                  onChange={(e) => setTanggalKeluar(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tanggal Kembali ke Gudang
                </label>
                <input
                  type="date"
                  value={tanggalKembali}
                  onChange={(e) => setTanggalKembali(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  PIC / Teknisi Pembawa
                </label>
                <input
                  type="text"
                  value={penerimaKeluar}
                  onChange={(e) => setPenerimaKeluar(e.target.value)}
                  placeholder="Nama teknisi / staf"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Keperluan Keluar
                </label>
                <input
                  type="text"
                  value={keperluanKeluar}
                  onChange={(e) => setKeperluanKeluar(e.target.value)}
                  placeholder="Instalasi, perbaikan, demo..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan teknis atau keterangan lokasi..."
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perangkat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

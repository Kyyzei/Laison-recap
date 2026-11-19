import React, { useState, useEffect } from 'react';
import { SimCard, SimCardStatus, SIM_CARD_STATUS_LIST } from '../../types/simcard';
import { useSimCards } from '../../context/SimCardContext';
import { useDevices } from '../../context/DeviceContext';
import { X, CardSim, Check, AlertCircle } from 'lucide-react';

interface SimCardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  simCardToEdit?: SimCard | null;
}

const OPERATOR_LIST = [
  'Telkomsel IoT',
  'Indosat Ooredoo',
  'XL Axiata',
  'Tri (3)',
  'Smartfren',
];

export const SimCardFormModal: React.FC<SimCardFormModalProps> = ({
  isOpen,
  onClose,
  simCardToEdit,
}) => {
  const { addSimCard, updateSimCard } = useSimCards();
  const { devices } = useDevices();

  const isEditing = Boolean(simCardToEdit);

  const [noSim, setNoSim] = useState('');
  const [iccid, setIccid] = useState('');
  const [operator, setOperator] = useState('Telkomsel IoT');
  const [status, setStatus] = useState<SimCardStatus>('Stock');
  const [deviceSeri, setDeviceSeri] = useState('');
  const [lokasi, setLokasi] = useState('Gudang Utama Laison');
  const [ip, setIp] = useState('147.93.81.149');
  const [apnBand, setApnBand] = useState('NBIOT,3,20,28,8');
  const [kuota, setKuota] = useState('500 MB / Bulan');
  const [masaAktif, setMasaAktif] = useState('2027-12-31');
  const [catatan, setCatatan] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (simCardToEdit) {
      setNoSim(simCardToEdit.noSim || '');
      setIccid(simCardToEdit.iccid || '');
      setOperator(simCardToEdit.operator || 'Telkomsel IoT');
      setStatus(simCardToEdit.status || 'Stock');
      setDeviceSeri(simCardToEdit.deviceSeri || '');
      setLokasi(simCardToEdit.lokasi || 'Gudang Utama Laison');
      setIp(simCardToEdit.ip || '147.93.81.149');
      setApnBand(simCardToEdit.apnBand || 'NBIOT,3,20,28,8');
      setKuota(simCardToEdit.kuota || '500 MB / Bulan');
      setMasaAktif(simCardToEdit.masaAktif || '2027-12-31');
      setCatatan(simCardToEdit.catatan || '');
    } else {
      setNoSim('');
      setIccid('');
      setOperator('Telkomsel IoT');
      setStatus('Stock');
      setDeviceSeri('');
      setLokasi('Gudang Utama Laison');
      setIp('147.93.81.149');
      setApnBand('NBIOT,3,20,28,8');
      setKuota('500 MB / Bulan');
      setMasaAktif('2027-12-31');
      setCatatan('');
    }
    setValidationError('');
  }, [simCardToEdit, isOpen]);

  // Handle auto-update status when device is selected
  const handleDeviceChange = (seri: string) => {
    setDeviceSeri(seri);
    if (seri) {
      const dev = devices.find((d) => d.seri === seri);
      if (dev) {
        if (dev.status === 'Aktif') setStatus('Online');
        else if (dev.status === 'Rusak') setStatus('Offline');
        else setStatus('Terpakai');

        if (dev.lokasi) setLokasi(dev.lokasi);
        if (dev.ip) setIp(dev.ip);
        if (dev.apnBand) setApnBand(dev.apnBand);
      }
    } else {
      if (status !== 'Stock') {
        setStatus('Stock');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const cleanNo = noSim.trim();
    if (!cleanNo) {
      setValidationError('Nomor SIM wajib diisi.');
      return;
    }

    try {
      const selectedDev = deviceSeri ? devices.find((d) => d.seri === deviceSeri) : null;

      const dataToSave = {
        noSim: cleanNo,
        iccid: iccid.trim() || `89620100${cleanNo.replace(/[^0-9]/g, '').padEnd(12, '0')}`,
        operator,
        status,
        deviceId: selectedDev?.id || '',
        deviceSeri: selectedDev?.seri || '',
        deviceModel: selectedDev?.model || (selectedDev ? 'AquaLink' : ''),
        ip: ip.trim(),
        apnBand: apnBand.trim(),
        lokasi: lokasi.trim(),
        kuota: kuota.trim(),
        masaAktif: masaAktif.trim(),
        catatan: catatan.trim(),
        tanggalPasang: selectedDev ? (selectedDev.tanggalKeluar || new Date().toISOString().split('T')[0]) : '',
      };

      if (isEditing && simCardToEdit) {
        const ok = updateSimCard(simCardToEdit.id, dataToSave);
        if (ok) onClose();
      } else {
        const ok = addSimCard(dataToSave);
        if (ok) onClose();
      }
    } catch (err: any) {
      setValidationError(err.message || 'Gagal menyimpan kartu SIM.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
              <CardSim className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Data SIM Card' : 'Tambah SIM Card Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Perbarui parameter nomor SIM dan keterhubungan perangkat'
                  : 'Daftarkan nomor SIM baru ke inventaris stok atau pasang ke device'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Row 1: Nomor SIM & Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor SIM (MSISDN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 0851-5378-4819"
                value={noSim}
                onChange={(e) => setNoSim(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Operator / Provider
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 bg-white"
              >
                {OPERATOR_LIST.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Status & Hubungkan ke Device */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status SIM Card <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SimCardStatus)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 bg-white font-semibold"
              >
                {SIM_CARD_STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st === 'Online'
                      ? '🟢 Online (Aktif Terhubung)'
                      : st === 'Terpakai'
                      ? '🔵 Terpakai (Terpasang)'
                      : st === 'Offline'
                      ? '🔴 Offline (Tidak Terhubung)'
                      : '🟡 Stock (Tersedia di Gudang)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hubungkan ke Perangkat AquaLink
              </label>
              <select
                value={deviceSeri}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 bg-white"
              >
                <option value="">-- Tidak Terhubung (Stock) --</option>
                {devices
                  .filter((d) => d.koneksi === 'NB-IoT')
                  .map((d) => (
                    <option key={d.id} value={d.seri}>
                      {d.seri} - {d.lokasi || 'Tanpa Lokasi'} ({d.status})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Row 3: ICCID & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor ICCID Kartu
              </label>
              <input
                type="text"
                placeholder="Contoh: 89620100..."
                value={iccid}
                onChange={(e) => setIccid(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lokasi Perangkat / Penyimpanan
              </label>
              <input
                type="text"
                placeholder="Contoh: P. Kelapa Dua / Gudang Utama"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>
          </div>

          {/* Row 4: IP Server & APN / Band */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                IP Server
              </label>
              <input
                type="text"
                placeholder="147.93.81.149"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                APN & Band
              </label>
              <input
                type="text"
                placeholder="NBIOT,3,20,28,8"
                value={apnBand}
                onChange={(e) => setApnBand(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-mono"
              />
            </div>
          </div>

          {/* Row 5: Kuota & Masa Aktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paket Kuota
              </label>
              <input
                type="text"
                placeholder="500 MB / Bulan"
                value={kuota}
                onChange={(e) => setKuota(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Masa Aktif Kartu
              </label>
              <input
                type="date"
                value={masaAktif}
                onChange={(e) => setMasaAktif(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Operasional
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan teknisi atau info paket..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambah SIM Card'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

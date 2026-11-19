import React, { useState } from 'react';
import {
  Device,
  getDeviceWarehouseStatus,
  getDeviceModel,
  getDeviceFullHistory,
  DeviceHistoryCategory,
} from '../../types/device';
import { StatusBadge } from '../common/StatusBadge';
import { useDevices } from '../../context/DeviceContext';
import { ExcelExportService } from '../../services/excel/excelExportService';
import {
  X,
  Copy,
  Edit2,
  Check,
  LogOut,
  LogIn,
  Calendar,
  User,
  History,
  Plus,
  FileText,
  Sliders,
  Tag,
  Clock,
  ArrowRight,
  Package,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface DeviceDetailModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (device: Device) => void;
  initialTab?: 'info' | 'history';
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  isOpen,
  onClose,
  onEdit,
  initialTab = 'info',
}) => {
  const { openWarehouseModal, addDeviceHistory } = useDevices();

  const [activeTab, setActiveTab] = useState<'info' | 'history'>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string>('ALL');
  const [isAddingManualHistory, setIsAddingManualHistory] = useState(false);

  // Form states for manual history
  const [manualJudul, setManualJudul] = useState('');
  const [manualKategori, setManualKategori] = useState<DeviceHistoryCategory>('MANUAL');
  const [manualPic, setManualPic] = useState('');
  const [manualTanggal, setManualTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualDeskripsi, setManualDeskripsi] = useState('');

  // Sync tab when modal opens or initialTab changes using render state tracking
  const [prevKey, setPrevKey] = useState('');
  const currentKey = `${isOpen}-${device?.id}-${initialTab}`;
  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    if (isOpen) {
      setActiveTab(initialTab);
      setIsAddingManualHistory(false);
      setHistoryFilter('ALL');
    }
  }

  if (!isOpen || !device) return null;

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isLora = device.koneksi === 'LoRaWAN';
  const fullHistory = getDeviceFullHistory(device);

  const filteredHistory = fullHistory.filter((item) => {
    if (historyFilter === 'ALL') return true;
    return item.kategori === historyFilter;
  });

  const handleSaveManualHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualJudul.trim()) {
      alert('Judul riwayat wajib diisi.');
      return;
    }

    addDeviceHistory(device.id, {
      kategori: manualKategori,
      judul: manualJudul.trim(),
      deskripsi: manualDeskripsi.trim() || undefined,
      pic: manualPic.trim() || 'Teknisi',
      timestamp: `${manualTanggal}T${new Date().toTimeString().slice(0, 8)}.000Z`,
    });

    setManualJudul('');
    setManualDeskripsi('');
    setManualPic('');
    setIsAddingManualHistory(false);
  };

  const handleCopyHistory = () => {
    const text = fullHistory
      .map((h, idx) => {
        const time = new Date(h.timestamp).toLocaleString('id-ID');
        let details = `[${idx + 1}] ${time} - ${h.judul} (${h.kategori})\n`;
        if (h.pic) details += `  PIC: ${h.pic}\n`;
        if (h.deskripsi) details += `  Keterangan: ${h.deskripsi}\n`;
        if (h.perubahan && h.perubahan.length > 0) {
          details += `  Perubahan:\n`;
          h.perubahan.forEach((p) => {
            details += `   • ${p.fieldLabel}: ${p.oldValue} ➔ ${p.newValue}\n`;
          });
        }
        return details;
      })
      .join('\n');

    copyToClipboard(text, 'full_history');
  };

  const getCategoryBadge = (kat: DeviceHistoryCategory) => {
    switch (kat) {
      case 'GUDANG':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Package className="w-3 h-3" /> Gudang
          </span>
        );
      case 'PARAMETER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <Sliders className="w-3 h-3" /> Parameter
          </span>
        );
      case 'STATUS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Tag className="w-3 h-3" /> Status
          </span>
        );
      case 'MANUAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <FileText className="w-3 h-3" /> Catatan
          </span>
        );
      case 'SISTEM':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Layers className="w-3 h-3" /> Sistem
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0c2340] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-sky-300 font-mono tracking-wider uppercase font-semibold">
                  {device.koneksi} DEVICE
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {getDeviceModel(device) === 'AquaLink'
                    ? '💧 AquaLink'
                    : getDeviceModel(device) === 'Ultrasonic'
                    ? '🔊 Ultrasonic'
                    : '📟 MIU'}
                </span>
              </div>
              <h2 className="text-xl font-bold font-mono tracking-tight">SERI: {device.seri}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={device.status} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-blue-900 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Informasi Detail Perangkat</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-900 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat & Audit Trail</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'history'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {fullHistory.length}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto text-xs space-y-4 grow">
          {activeTab === 'info' && (
            <>
              {/* Main Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Nomor Seri
                  </span>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{device.seri}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Koneksi
                  </span>
                  <p className="font-semibold text-blue-900 text-sm mt-0.5">{device.koneksi}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Read Address
                  </span>
                  <p className="font-mono text-slate-800 mt-0.5">{device.readAddress || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Lokasi
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">{device.lokasi || 'Belum ditentukan'}</p>
                </div>
              </div>

              {/* Connection Specs */}
              {isLora ? (
                <div className="space-y-2 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
                  <span className="text-[11px] uppercase font-bold text-blue-900 flex items-center gap-1.5">
                    Data Parameter LoRaWAN
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">DevEUI</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono font-semibold text-slate-800 break-all text-[11px]">
                          {device.devEui || '-'}
                        </span>
                        {device.devEui && (
                          <button
                            onClick={() => copyToClipboard(device.devEui, 'devEui')}
                            className="p-1 text-slate-400 hover:text-blue-900"
                            title="Salin DevEUI"
                          >
                            {copiedKey === 'devEui' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">AppEUI</span>
                      <span className="font-mono font-semibold text-slate-800 break-all text-[11px] mt-1">
                        {device.appEui || '-'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">DevAddr</span>
                      <span className="font-mono font-semibold text-slate-800 break-all text-[11px] mt-1">
                        {device.devAddr || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-3.5 bg-sky-50/50 rounded-xl border border-sky-100">
                  <span className="text-[11px] uppercase font-bold text-sky-900 flex items-center gap-1.5">
                    Data Parameter NB-IoT
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="bg-white p-2.5 rounded-lg border border-sky-100 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">No SIM</span>
                      <span className="font-mono font-bold text-emerald-700 text-xs mt-1">
                        {device.noSim || '-'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-sky-100 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">APN & Band</span>
                      <span className="font-mono text-slate-800 text-[11px] mt-1">
                        {device.apnBand || '-'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-sky-100 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">IP Server</span>
                      <span className="font-mono text-slate-800 text-[11px] mt-1">
                        {device.ip || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AppKey */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    AppKey
                  </span>
                  {device.appKey && (
                    <button
                      onClick={() => copyToClipboard(device.appKey, 'appKey')}
                      className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      {copiedKey === 'appKey' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'appKey' ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  )}
                </div>
                <p className="font-mono text-slate-700 break-all bg-white p-2 rounded-lg border border-slate-200 text-xs">
                  {device.appKey || '-'}
                </p>
              </div>

              {/* Logistik Gudang Summary Card */}
              {(() => {
                const whStatus = getDeviceWarehouseStatus(device);
                const isDiLuar = whStatus === 'DI_LUAR';

                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 uppercase font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-900" /> Status Logistik Gudang
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          !isDiLuar
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {!isDiLuar ? '🟢 Di Gudang' : '🟠 Di Luar Gudang'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Tanggal Keluar</span>
                        <span className="font-semibold text-slate-800 text-xs">
                          {device.tanggalKeluar || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Tanggal Kembali</span>
                        <span className="font-semibold text-slate-800 text-xs">
                          {device.tanggalKembali || (device.tanggalKeluar ? (
                            <span className="text-amber-700 font-semibold">Belum Kembali</span>
                          ) : '-')}
                        </span>
                      </div>
                      {(device.penerimaKeluar || device.keperluanKeluar) && (
                        <>
                          <div className="col-span-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" /> PIC / Pembawa:
                            </span>
                            <span className="font-medium text-slate-800">{device.penerimaKeluar || '-'}</span>
                          </div>
                          <div className="col-span-2 text-[11px] flex items-center justify-between">
                            <span className="text-slate-500">Keperluan:</span>
                            <span className="font-medium text-slate-800">{device.keperluanKeluar || '-'}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {!isDiLuar ? (
                        <button
                          onClick={() => {
                            onClose();
                            openWarehouseModal(device, 'KELUAR');
                          }}
                          className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Catat Keluar dari Gudang</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onClose();
                            openWarehouseModal(device, 'KEMBALI');
                          }}
                          className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Catat Kembali ke Gudang</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Catatan Perangkat */}
              {device.catatan && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-900 uppercase font-bold block mb-1">
                    Catatan Perangkat
                  </span>
                  <p className="text-slate-800 whitespace-pre-line leading-relaxed text-xs">
                    {device.catatan}
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* History Top Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'ALL', label: 'Semua' },
                    { id: 'GUDANG', label: '📦 Gudang' },
                    { id: 'PARAMETER', label: '⚙️ Parameter' },
                    { id: 'STATUS', label: '🏷️ Status' },
                    { id: 'MANUAL', label: '📝 Catatan' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setHistoryFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        historyFilter === filter.id
                          ? 'bg-blue-900 text-white font-bold'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => ExcelExportService.exportDeviceHistory(device)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
                    title="Export riwayat perangkat ini ke file Excel"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                    <span>Export Excel</span>
                  </button>

                  <button
                    onClick={handleCopyHistory}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-900 text-xs font-medium flex items-center gap-1 cursor-pointer"
                    title="Salin seluruh riwayat ke clipboard"
                  >
                    {copiedKey === 'full_history' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'full_history' ? 'Disalin' : 'Salin Log'}</span>
                  </button>

                  <button
                    onClick={() => setIsAddingManualHistory(!isAddingManualHistory)}
                    className="px-2.5 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Catatan</span>
                  </button>
                </div>
              </div>

              {/* Form Tambah Catatan Manual (Accordion) */}
              {isAddingManualHistory && (
                <form
                  onSubmit={handleSaveManualHistory}
                  className="p-4 bg-sky-50/60 border border-sky-200 rounded-xl space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200/60">
                    <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-blue-900" /> Tambah Catatan Riwayat Baru
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingManualHistory(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">
                        Judul Aktivitas <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={manualJudul}
                        onChange={(e) => setManualJudul(e.target.value)}
                        placeholder="Contoh: Pengecekan Sinyal, Kalibrasi, Servis Baterai"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">
                        Kategori Riwayat
                      </label>
                      <select
                        value={manualKategori}
                        onChange={(e) => setManualKategori(e.target.value as DeviceHistoryCategory)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                      >
                        <option value="MANUAL">Catatan / Aktivitas Lapangan</option>
                        <option value="GUDANG">Logistik / Mutasi Gudang</option>
                        <option value="PARAMETER">Perubahan Parameter / Teknis</option>
                        <option value="STATUS">Status / Kondisi Fisik</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">
                        PIC / Teknisi
                      </label>
                      <input
                        type="text"
                        value={manualPic}
                        onChange={(e) => setManualPic(e.target.value)}
                        placeholder="Nama Teknisi atau PIC"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={manualTanggal}
                        onChange={(e) => setManualTanggal(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">
                        Keterangan Lengkap / Hasil Pengecekan
                      </label>
                      <textarea
                        rows={2}
                        value={manualDeskripsi}
                        onChange={(e) => setManualDeskripsi(e.target.value)}
                        placeholder="Tuliskan detail pemeriksaan, nomor dokumen berita acara, atau kondisi lapangan..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingManualHistory(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer"
                    >
                      Simpan ke Riwayat
                    </button>
                  </div>
                </form>
              )}

              {/* Timeline Items */}
              {filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">Belum ada riwayat pada kategori ini</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gunakan tombol "+ Tambah Catatan" untuk mencatat aktivitas baru.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-4 my-2">
                  {filteredHistory.map((item) => {
                    const dateObj = new Date(item.timestamp);
                    const formattedDate = dateObj.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div key={item.id} className="relative group">
                        {/* Timeline node icon */}
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-blue-900 flex items-center justify-center group-hover:scale-125 transition-transform" />

                        {/* Card */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs space-y-2 transition-shadow">
                          {/* Card Header */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getCategoryBadge(item.kategori)}
                              <h4 className="font-bold text-slate-900 text-xs">
                                {item.judul}
                              </h4>
                            </div>

                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {formattedDate} {formattedTime}
                            </span>
                          </div>

                          {/* Deskripsi */}
                          {item.deskripsi && (
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {item.deskripsi}
                            </p>
                          )}

                          {/* PIC Tag */}
                          {item.pic && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>Oleh / PIC: <strong className="text-slate-700">{item.pic}</strong></span>
                            </div>
                          )}

                          {/* Perubahan Parameter (Diff Grid) */}
                          {item.perubahan && item.perubahan.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                Rincian Parameter yang Diubah ({item.perubahan.length}):
                              </span>
                              <div className="space-y-1">
                                {item.perubahan.map((diff, dIdx) => (
                                  <div
                                    key={dIdx}
                                    className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between gap-2"
                                  >
                                    <span className="font-semibold text-slate-700">
                                      {diff.fieldLabel}:
                                    </span>
                                    <div className="flex items-center gap-1.5 font-mono text-[10px] overflow-hidden text-right">
                                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 line-through">
                                        {diff.oldValue}
                                      </span>
                                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                        {diff.newValue}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metadata Tambahan (e.g. Lokasi & Keperluan Gudang) */}
                          {item.metadata && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                              {item.metadata.lokasi && (
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                  Lokasi: {item.metadata.lokasi}
                                </span>
                              )}
                              {item.metadata.keperluan && (
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                  Keperluan: {item.metadata.keperluan}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-100 shrink-0">
          <span className="text-[11px] text-slate-400">
            Terakhir diupdate: {new Date(device.updatedAt).toLocaleDateString('id-ID')}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(device);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Data</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

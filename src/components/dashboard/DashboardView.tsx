import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevices } from '../../context/DeviceContext';
import { DeviceStatus, getDeviceWarehouseStatus } from '../../types/device';
import { StatusBadge } from '../common/StatusBadge';
import {
  Cpu,
  CheckCircle2,
  Package,
  AlertTriangle,
  Radio,
  MapPin,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ExternalLink,
  LogOut,
  LogIn,
  Calendar,
} from 'lucide-react';
import { ExcelExportService } from '../../services/excel/excelExportService';

export const DashboardView: React.FC = () => {
  const { devices, stats, setFilters, setIsCreateModalOpen, refreshDevices, openWarehouseModal } = useDevices();
  const navigate = useNavigate();

  const handleNavigateWithStatus = (status: DeviceStatus | 'ALL') => {
    setFilters((prev) => ({
      ...prev,
      status,
      posisiGudang: 'ALL',
      search: '',
    }));
    navigate('/devices');
  };

  const handleNavigateWarehouse = (posisiGudang: 'DI_GUDANG' | 'DI_LUAR') => {
    setFilters((prev) => ({
      ...prev,
      posisiGudang,
      status: 'ALL',
      search: '',
    }));
    navigate('/devices');
  };

  // Location tally
  const locationCounts: Record<string, number> = {};
  for (const d of devices) {
    const loc = d.lokasi || 'Tanpa Lokasi (Gudang/Stok)';
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  }
  const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);

  const recentDevices = devices.slice(0, 8);
  const devicesDiLuar = devices.filter((d) => getDeviceWarehouseStatus(d) === 'DI_LUAR');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0c2340] via-[#11325d] to-[#0c2340] rounded-2xl p-6 text-white shadow-sm border border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
              Sistem Rekap Device
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            AquaLink Device Recap
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
            Sistem pencatatan dan monitoring perangkat IoT AquaLink (LoRaWAN & NB-IoT). Menggantikan pencatatan Excel manual.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => refreshDevices()}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/15 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </button>
          <button
            onClick={() => ExcelExportService.exportDevices(devices, { format: 'xlsx' })}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-blue-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total */}
        <div
          onClick={() => handleNavigateWithStatus('ALL')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Device</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Semua perangkat</div>
        </div>

        {/* Terpasang */}
        <div
          onClick={() => handleNavigateWithStatus('Terpasang')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Terpasang</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{stats.terpasang}</div>
          <div className="text-[11px] text-slate-400 mt-1">Di lokasi pelanggan</div>
        </div>

        {/* Stok */}
        <div
          onClick={() => handleNavigateWithStatus('Stok')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Stok</span>
            <Package className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-700">{stats.stok}</div>
          <div className="text-[11px] text-slate-400 mt-1">Tersedia di gudang</div>
        </div>

        {/* Rusak */}
        <div
          onClick={() => handleNavigateWithStatus('Rusak')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-400 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Rusak</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{stats.rusak}</div>
          <div className="text-[11px] text-slate-400 mt-1">Perlu perbaikan</div>
        </div>

        {/* Koneksi Split */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tipe Koneksi</span>
            <Radio className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-800">LoRa: <span className="font-bold text-blue-900">{stats.lopiwan}</span></span>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold text-slate-800">NB: <span className="font-bold text-sky-600">{stats.nbiot}</span></span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">LoRaWAN & NB-IoT</div>
        </div>
      </div>

      {/* Warehouse Logistics Highlight Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div
          onClick={() => handleNavigateWarehouse('DI_GUDANG')}
          className="bg-white p-4 rounded-xl border border-emerald-200 hover:border-emerald-400 bg-gradient-to-r from-emerald-50/50 to-white transition-all cursor-pointer shadow-2xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Berada di Gudang
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {stats.diGudang} <span className="text-xs font-normal text-slate-500">unit</span>
              </p>
            </div>
          </div>
          <span className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1">
            Lihat Perangkat &rarr;
          </span>
        </div>

        <div
          onClick={() => handleNavigateWarehouse('DI_LUAR')}
          className="bg-white p-4 rounded-xl border border-amber-200 hover:border-amber-400 bg-gradient-to-r from-amber-50/50 to-white transition-all cursor-pointer shadow-2xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
                Sedang di Luar Gudang
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {stats.diLuar} <span className="text-xs font-normal text-slate-500">unit</span>
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1">
            Lihat Perangkat &rarr;
          </span>
        </div>
      </div>

      {/* Main Grid: Location distribution & Recent devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Location Breakdown Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs lg:col-span-1">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">Distribusi Lokasi</h2>
          </div>
          <div className="space-y-2.5">
            {sortedLocations.map(([loc, count]) => {
              const pct = Math.round((count / (devices.length || 1)) * 100);
              return (
                <div key={loc} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate pr-2">{loc}</span>
                    <span className="text-slate-500 font-semibold shrink-0">{count} unit ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-800 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Devices Table Preview */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-800" />
              <h2 className="text-sm font-bold text-slate-900">Data Perangkat Terkini</h2>
            </div>
            <button
              onClick={() => handleNavigateWithStatus('ALL')}
              className="text-xs font-semibold text-blue-800 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Semua ({devices.length})</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-2 px-2 font-semibold">Seri</th>
                  <th className="py-2 px-2 font-semibold">Koneksi</th>
                  <th className="py-2 px-2 font-semibold">Read Address</th>
                  <th className="py-2 px-2 font-semibold">Status</th>
                  <th className="py-2 px-2 font-semibold">Lokasi</th>
                  <th className="py-2 px-2 font-semibold">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {recentDevices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-2 font-bold text-blue-950 font-sans">{d.seri}</td>
                    <td className="py-2.5 px-2 font-sans">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          d.koneksi === 'LoRaWAN'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {d.koneksi}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600">{d.readAddress || '-'}</td>
                    <td className="py-2.5 px-2 font-sans">
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-2 font-sans text-slate-700">{d.lokasi || '-'}</td>
                    <td className="py-2.5 px-2 font-sans text-slate-500 truncate max-w-[150px]">
                      {d.catatan || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Warehouse Outgoing Panel */}
      <div className="bg-white p-5 rounded-xl border border-amber-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Perangkat Sedang di Luar Gudang</h2>
              <p className="text-[11px] text-slate-500">
                Monitoring unit yang dibawa teknisi atau dipasang di lapangan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {devicesDiLuar.length} unit aktif di luar
            </span>
            <button
              onClick={() => handleNavigateWarehouse('DI_LUAR')}
              className="text-xs font-semibold text-blue-800 hover:text-blue-600 flex items-center gap-1 cursor-pointer ml-2"
            >
              <span>Buka di Tabel</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {devicesDiLuar.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 font-medium">
              Semua unit perangkat saat ini berada di dalam gudang. Tidak ada unit yang sedang keluar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">Nomor Seri</th>
                  <th className="py-2.5 px-3 font-semibold">Tipe Koneksi</th>
                  <th className="py-2.5 px-3 font-semibold">Tgl Keluar</th>
                  <th className="py-2.5 px-3 font-semibold">Lokasi Lapangan</th>
                  <th className="py-2.5 px-3 font-semibold">Teknisi / PIC</th>
                  <th className="py-2.5 px-3 font-semibold">Keperluan</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {devicesDiLuar.slice(0, 10).map((d) => (
                  <tr key={d.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-blue-950 font-sans">{d.seri}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          d.koneksi === 'LoRaWAN'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {d.koneksi}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-amber-900">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{d.tanggalKeluar || '-'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{d.lokasi || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {d.penerimaKeluar || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-[160px]">
                      {d.keperluanKeluar || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openWarehouseModal(d, 'KEMBALI')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                        title="Catat perangkat kembali ke gudang"
                      >
                        <LogIn className="w-3 h-3 text-emerald-600" />
                        <span>Kembalikan</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

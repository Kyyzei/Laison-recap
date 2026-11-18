import React from 'react';
import { useDevices } from '../../context/DeviceContext';
import { Search, X, RotateCcw } from 'lucide-react';
import { DEVICE_STATUS_LIST } from '../../types/device';

export const DeviceFilters: React.FC = () => {
  const { filters, setFilters, resetFilters, uniqueLokasi } = useDevices();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((p) => ({ ...p, search: e.target.value }));
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'ALL' ||
    filters.koneksi !== 'ALL' ||
    filters.lokasi !== 'ALL' ||
    filters.posisiGudang !== 'ALL';

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        {/* Search Input */}
        <div className="relative lg:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={handleSearch}
            placeholder="Cari seri, read address, devEUI, no sim, lokasi..."
            className="w-full pl-9 pr-7 py-1.5 border border-slate-300 rounded-lg text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((p) => ({ ...p, search: '' }))}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Gudang Filter */}
        <div>
          <select
            value={filters.posisiGudang}
            onChange={(e) => setFilters((p) => ({ ...p, posisiGudang: e.target.value }))}
            className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs md:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Semua Posisi Gudang</option>
            <option value="DI_GUDANG">🟢 Di Gudang</option>
            <option value="DI_LUAR">🟠 Sedang di Luar Gudang</option>
          </select>
        </div>

        {/* Koneksi Filter */}
        <div>
          <select
            value={filters.koneksi}
            onChange={(e) => setFilters((p) => ({ ...p, koneksi: e.target.value }))}
            className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs md:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Semua Koneksi</option>
            <option value="LoRaWAN">LoRaWAN</option>
            <option value="NB-IoT">NB-IoT</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs md:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            {DEVICE_STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Lokasi Filter */}
        <div className="flex gap-2">
          <select
            value={filters.lokasi}
            onChange={(e) => setFilters((p) => ({ ...p, lokasi: e.target.value }))}
            className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs md:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Semua Lokasi</option>
            {uniqueLokasi.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              title="Reset semua filter"
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 text-xs shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

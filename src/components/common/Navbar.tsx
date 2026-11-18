import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Waves, Search, Plus, Menu, HardDrive } from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
}) => {
  const { filters, setFilters, stats, setIsCreateModalOpen } = useDevices();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-[#0c2340] border-b border-blue-900/60 text-white shadow-sm">
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-blue-900"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-blue-950 font-bold shadow-xs">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  Aqua<span className="text-sky-400">Link</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Recap
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block leading-none mt-0.5">
                Data Perangkat IoT
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              onFocus={() => navigate('/devices')}
              placeholder="Cari seri, read address, devEUI, no sim, lokasi..."
              className="w-full pl-9 pr-3 py-1.5 bg-blue-950/70 hover:bg-blue-950 focus:bg-blue-950 border border-blue-800/80 focus:border-sky-400 rounded-lg text-xs md:text-sm text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((p) => ({ ...p, search: '' }))}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-800/50">
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
            <span>Total:</span>
            <span className="font-bold text-white">{stats.total} device</span>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-blue-950 text-xs md:text-sm font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>
      </div>
    </header>
  );
};

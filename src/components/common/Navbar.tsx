import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Menu, HardDrive, LogOut, User as UserIcon } from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';
import { useAuth } from '../../context/AuthContext';
import { LAISON_LOGO_DATA_URI } from '../../assets/logo';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
}) => {
  const { filters, setFilters, stats, setIsCreateModalOpen } = useDevices();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-[#0c2340] border-b border-blue-900/60 text-white shadow-sm">
      <div className="px-4 lg:px-6 py-2 flex items-center justify-between gap-4">
        {/* Left: Brand with Official Laison Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-blue-900"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex items-center shrink-0 group-hover:opacity-90 transition-opacity">
              <img
                src={LAISON_LOGO_DATA_URI}
                alt="Laison Logo"
                className="h-7 w-auto object-contain drop-shadow-sm"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  Laison <span className="text-sky-400">Recap</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  IoT
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block leading-none mt-0.5">
                Sistem Rekap Perangkat
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
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/30 shadow-2xs" title="Terhubung ke Database Cloud Supabase (Real-Time Sync)">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloud Realtime</span>
          </div>

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
            <span className="hidden sm:inline">Tambah</span>
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-blue-800/60">
            <div
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-blue-900/60 transition-colors cursor-pointer"
              title="Buka profil dan pengaturan akun"
            >
              <div className="w-7 h-7 rounded-full bg-blue-800 border border-sky-400/30 flex items-center justify-center text-xs text-sky-300 font-bold shrink-0">
                {user?.avatar || <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <span className="text-xs font-bold text-white block truncate max-w-[120px]">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-sky-300 font-medium">
                  {user?.roleLabel || 'Admin'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                  logout();
                  navigate('/login');
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Logout / Keluar Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

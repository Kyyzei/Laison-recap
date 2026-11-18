import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  FileSpreadsheet,
  Database,
  Settings,
  X,
  Layers,
} from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';
import { DeviceModel } from '../../types/device';
import { LAISON_LOGO_DATA_URI } from '../../assets/logo';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const { stats, filters, setFilters } = useDevices();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname.replace(/^\//, '') || 'dashboard';
  const isDevicesPage = currentPath === 'devices';

  const handleSelectModel = (model: 'ALL' | DeviceModel) => {
    setFilters((p) => ({ ...p, model }));
    navigate('/devices');
    onCloseMobile();
  };

  const handleSelectPage = (path: string) => {
    navigate(path);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
        <div className="flex items-center">
          <img src={LAISON_LOGO_DATA_URI} alt="Laison" className="h-6 w-auto object-contain" />
        </div>
        <button onClick={onCloseMobile} className="p-1 rounded-md text-slate-400 hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {/* Main: Dashboard */}
        <div className="space-y-1">
          <button
            onClick={() => handleSelectPage('/dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              currentPath === 'dashboard' || currentPath === ''
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={currentPath === 'dashboard' || currentPath === '' ? 'text-sky-300' : 'text-slate-500'}>
                <LayoutDashboard className="w-4 h-4" />
              </span>
              <span>Dashboard</span>
            </div>
          </button>
        </div>

        {/* Section: Kategori Model Perangkat */}
        <div>
          <div className="px-3 pb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Kategori Perangkat</span>
            <Layers className="w-3 h-3 text-slate-400" />
          </div>
          <div className="space-y-1">
            {/* AquaLink */}
            <button
              onClick={() => handleSelectModel('AquaLink')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isDevicesPage && filters.model === 'AquaLink'
                  ? 'bg-blue-900 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">💧</span>
                <span>AquaLink</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isDevicesPage && filters.model === 'AquaLink'
                    ? 'bg-sky-400 text-blue-950'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.aqualink}
              </span>
            </button>

            {/* Ultrasonic */}
            <button
              onClick={() => handleSelectModel('Ultrasonic')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isDevicesPage && filters.model === 'Ultrasonic'
                  ? 'bg-blue-900 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🔊</span>
                <span>Ultrasonic</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isDevicesPage && filters.model === 'Ultrasonic'
                    ? 'bg-sky-400 text-blue-950'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.ultrasonic}
              </span>
            </button>

            {/* Meter Interface Unit (MIU) */}
            <button
              onClick={() => handleSelectModel('MIU')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isDevicesPage && filters.model === 'MIU'
                  ? 'bg-blue-900 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📟</span>
                <span className="truncate">MIU (Interface Unit)</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isDevicesPage && filters.model === 'MIU'
                    ? 'bg-sky-400 text-blue-950'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.miu}
              </span>
            </button>

            {/* Semua Model */}
            <button
              onClick={() => handleSelectModel('ALL')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                isDevicesPage && filters.model === 'ALL'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Semua Perangkat</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {stats.total}
              </span>
            </button>
          </div>
        </div>

        {/* Section: Menu Lainnya */}
        <div>
          <div className="px-3 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Lainnya
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleSelectPage('/import-export')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentPath === 'import-export'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={currentPath === 'import-export' ? 'text-sky-300' : 'text-slate-500'}>
                  <FileSpreadsheet className="w-4 h-4" />
                </span>
                <span>Import & Export</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  currentPath === 'import-export' ? 'bg-sky-400 text-blue-950' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Excel
              </span>
            </button>

            <button
              onClick={() => handleSelectPage('/backup-restore')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentPath === 'backup-restore'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={currentPath === 'backup-restore' ? 'text-sky-300' : 'text-slate-500'}>
                  <Database className="w-4 h-4" />
                </span>
                <span>Backup & Restore</span>
              </div>
            </button>

            <button
              onClick={() => handleSelectPage('/settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentPath === 'settings'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={currentPath === 'settings' ? 'text-sky-300' : 'text-slate-500'}>
                  <Settings className="w-4 h-4" />
                </span>
                <span>Pengaturan</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Pill at bottom */}
      <div className="p-3 m-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center justify-center pb-2 border-b border-slate-200/80">
          <img src={LAISON_LOGO_DATA_URI} alt="Laison" className="h-6 w-auto object-contain opacity-90" />
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">LoRaWAN:</span>
          <span className="font-semibold text-slate-800">{stats.lopiwan} unit</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">NB-IoT:</span>
          <span className="font-semibold text-slate-800">{stats.nbiot} unit</span>
        </div>
        {stats.rusak > 0 && (
          <div className="flex justify-between text-rose-600 pt-1 border-t border-slate-200">
            <span>Rusak:</span>
            <span className="font-bold">{stats.rusak} unit</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 sticky top-[57px] h-[calc(100vh-57px)]">
        {content}
      </aside>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </div>
    </>
  );
};

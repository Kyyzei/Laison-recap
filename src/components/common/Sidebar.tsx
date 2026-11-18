import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  FileSpreadsheet,
  Database,
  Settings,
  X,
  Radio,
} from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';

export type NavTab = 'dashboard' | 'devices' | 'import-export' | 'backup-restore' | 'settings';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const { stats } = useDevices();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname.replace(/^\//, '') || 'dashboard';

  const navItems: Array<{
    id: NavTab;
    path: string;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
  }> = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'devices',
      path: '/devices',
      label: 'Data Device',
      icon: <Cpu className="w-4 h-4" />,
      badge: stats.total,
    },
    {
      id: 'import-export',
      path: '/import-export',
      label: 'Import & Export',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      badge: 'Excel',
    },
    {
      id: 'backup-restore',
      path: '/backup-restore',
      label: 'Backup & Restore',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'settings',
      path: '/settings',
      label: 'Pengaturan',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleSelectTab = (path: string) => {
    navigate(path);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-sky-600" />
          <span className="font-semibold text-slate-800">Menu</span>
        </div>
        <button onClick={onCloseMobile} className="p-1 rounded-md text-slate-400 hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.id || (item.id === 'dashboard' && currentPath === '');
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-sky-300' : 'text-slate-500'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-sky-400 text-blue-950' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Summary Pill at bottom */}
      <div className="p-3 m-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
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

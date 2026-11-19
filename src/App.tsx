import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { DeviceProvider, useDevices } from './context/DeviceContext';
import { SimCardProvider } from './context/SimCardContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { DeviceListView } from './components/devices/DeviceListView';
import { SimCardListView } from './components/simcards/SimCardListView';
import { ImportExportView } from './components/importExport/ImportExportView';
import { BackupRestoreView } from './components/backupRestore/BackupRestoreView';
import { SettingsView } from './components/settings/SettingsView';
import { DeviceFormModal } from './components/devices/DeviceFormModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const AppLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isCreateModalOpen, setIsCreateModalOpen } = useDevices();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full">
        {/* Sidebar Navigation */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Route View Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/devices" element={<DeviceListView />} />
            <Route path="/simcards" element={<SimCardListView />} />
            <Route path="/import-export" element={<ImportExportView />} />
            <Route path="/backup-restore" element={<BackupRestoreView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Add Device Modal Triggered from Navbar */}
      {isCreateModalOpen && (
        <DeviceFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DeviceProvider>
          <SimCardProvider>
            <HashRouter>
              <AppLayout />
            </HashRouter>
          </SimCardProvider>
        </DeviceProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;

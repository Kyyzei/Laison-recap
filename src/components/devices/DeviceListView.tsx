import React, { useState } from 'react';
import { useDevices } from '../../context/DeviceContext';
import { DeviceFilters } from './DeviceFilters';
import { DeviceTable } from './DeviceTable';
import { Pagination } from '../common/Pagination';
import { ConfirmModal } from '../common/ConfirmModal';
import { DeviceDetailModal } from './DeviceDetailModal';
import { DeviceFormModal } from './DeviceFormModal';
import { Device } from '../../types/device';
import {
  Plus,
  FileSpreadsheet,
  Trash2,
  Cpu,
  RotateCcw,
  CardSim,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ExcelExportService } from '../../services/excel/excelExportService';
import { useSimCards } from '../../context/SimCardContext';

export const DeviceListView: React.FC = () => {
  const {
    filteredDevices,
    paginatedDevices,
    currentPage,
    rowsPerPage,
    totalPages,
    setCurrentPage,
    setRowsPerPage,
    selectedDeviceIds,
    duplicateDevice,
    deleteDevice,
    bulkDeleteDevices,
    resetToDummy,
    selectedDeviceForDetail,
    selectedDeviceForEdit,
    setSelectedDeviceForDetail,
    setSelectedDeviceForEdit,
    setIsCreateModalOpen,
    filters,
    setFilters,
    stats,
  } = useDevices();
  const { stats: simStats } = useSimCards();
  const navigate = useNavigate();

  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState<'info' | 'history'>('info');

  const handleExportFiltered = () => {
    ExcelExportService.exportDevices(filteredDevices, {
      format: 'xlsx',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-900" />
            <h1 className="text-base md:text-lg font-bold text-slate-900">
              Data Perangkat Laison
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap perangkat LoRaWAN & NB-IoT ({filteredDevices.length} unit ditemukan)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedDeviceIds.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedDeviceIds.length})</span>
            </button>
          )}

          <button
            onClick={handleExportFiltered}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download Excel dari data saat ini"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs transition-colors cursor-pointer"
            title="Muat ulang 80 data default dari Excel"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Device</span>
          </button>
        </div>
      </div>

      {/* Category Tabs: AquaLink, Ultrasonic, MIU, Semua Model */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* AquaLink */}
            <button
              onClick={() => setFilters((p) => ({ ...p, model: 'AquaLink' }))}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filters.model === 'AquaLink'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-base leading-none">💧</span>
              <span>AquaLink</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  filters.model === 'AquaLink' ? 'bg-sky-400 text-blue-950' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.aqualink}
              </span>
            </button>

            {/* Ultrasonic */}
            <button
              onClick={() => setFilters((p) => ({ ...p, model: 'Ultrasonic' }))}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filters.model === 'Ultrasonic'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-base leading-none">🔊</span>
              <span>Ultrasonic</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  filters.model === 'Ultrasonic' ? 'bg-sky-400 text-blue-950' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.ultrasonic}
              </span>
            </button>

            {/* Hybrid */}
            <button
              onClick={() => setFilters((p) => ({ ...p, model: 'Hybrid' }))}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filters.model === 'Hybrid' || filters.model === 'Smart Meter Hybrid'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-base leading-none">🚰</span>
              <span>Hybrid</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  filters.model === 'Hybrid' || filters.model === 'Smart Meter Hybrid' ? 'bg-cyan-200 text-cyan-950' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.hybrid}
              </span>
            </button>

            {/* Meter Interface Unit (MIU) */}
            <button
              onClick={() => setFilters((p) => ({ ...p, model: 'MIU' }))}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filters.model === 'MIU'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-base leading-none">📟</span>
              <span>Meter Interface Unit (MIU)</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  filters.model === 'MIU' ? 'bg-sky-400 text-blue-950' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.miu}
              </span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden lg:block" />

            {/* Semua Model */}
            <button
              onClick={() => setFilters((p) => ({ ...p, model: 'ALL' }))}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filters.model === 'ALL'
                  ? 'bg-slate-800 text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <span>Semua Model</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  filters.model === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.total}
              </span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden lg:block" />

            {/* Stok SIM Card Quick Tab Button */}
            <button
              onClick={() => navigate('/simcards')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-900 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-2xs group"
              title="Buka kategori & inventaris Stok SIM Card"
            >
              <CardSim className="w-4 h-4 text-blue-900 group-hover:scale-110 transition-transform" />
              <span>Stok SIM Card</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800">
                {simStats.total} ({simStats.stock} Stok)
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 shrink-0 self-start md:self-center">
            {filters.model === 'AquaLink' && 'Kategori: AquaLink (Smart Water Meter)'}
            {filters.model === 'Ultrasonic' && 'Kategori: Ultrasonic Flow Meter'}
            {(filters.model === 'Hybrid' || filters.model === 'Smart Meter Hybrid') && 'Kategori: Hybrid (Smart Water Meter)'}
            {filters.model === 'MIU' && 'Kategori: Meter Interface Unit (Pulse Reader)'}
            {filters.model === 'ALL' && 'Kategori: Seluruh Model Perangkat'}
          </div>
        </div>
      </div>

      {/* Empty State Banner when category has 0 items */}
      {filteredDevices.length === 0 && filters.model !== 'ALL' && (
        <div className="bg-gradient-to-r from-blue-50/70 via-sky-50/50 to-blue-50/70 p-6 md:p-8 rounded-2xl border border-dashed border-blue-300 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-xs border border-blue-200 flex items-center justify-center text-3xl">
            {filters.model === 'Ultrasonic'
              ? '🔊'
              : (filters.model === 'Hybrid' || filters.model === 'Smart Meter Hybrid')
              ? '🚰'
              : filters.model === 'MIU'
              ? '📟'
              : '💧'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Kategori{' '}
              {filters.model === 'Ultrasonic'
                ? 'Ultrasonic'
                : (filters.model === 'Hybrid' || filters.model === 'Smart Meter Hybrid')
                ? 'Hybrid (Smart Water Meter)'
                : filters.model === 'MIU'
                ? 'Meter Interface Unit (MIU)'
                : 'AquaLink'}{' '}
              Siap Digunakan
            </h3>
            <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1">
              Ruang kategori untuk model{' '}
              {filters.model === 'Ultrasonic'
                ? 'Ultrasonic Flow Meter'
                : (filters.model === 'Hybrid' || filters.model === 'Smart Meter Hybrid')
                ? 'Smart Water Meter Hybrid'
                : filters.model === 'MIU'
                ? 'Meter Interface Unit (MIU)'
                : 'AquaLink (Smart Water Meter)'}{' '}
              telah siap. Anda dapat langsung menginput data unit baru atau mengimpor file Excel ke dalam kategori ini.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              Tambah Perangkat{' '}
              {filters.model === 'Ultrasonic'
                ? 'Ultrasonic'
                : (filters.model === 'Hybrid' || filters.model === 'Smart Meter Hybrid')
                ? 'Hybrid'
                : filters.model === 'MIU'
                ? 'MIU'
                : 'AquaLink'}{' '}
              Baru
            </span>
          </button>
        </div>
      )}

      {/* Filter Component */}
      <DeviceFilters />

      {/* Device Table */}
      <DeviceTable
        devices={paginatedDevices}
        onOpenDetail={(d, tab = 'info') => {
          setDetailInitialTab(tab);
          setSelectedDeviceForDetail(d);
        }}
        onOpenEdit={(d) => setSelectedDeviceForEdit(d)}
        onDuplicate={(id) => duplicateDevice(id)}
        onDeleteRequest={(d) => setDeviceToDelete(d)}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredDevices.length}
        rowsPerPage={rowsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
        onRowsPerPageChange={(rows) => setRowsPerPage(rows)}
      />

      {/* Modals */}
      {selectedDeviceForDetail && (
        <DeviceDetailModal
          device={selectedDeviceForDetail}
          isOpen={!!selectedDeviceForDetail}
          initialTab={detailInitialTab}
          onClose={() => setSelectedDeviceForDetail(null)}
          onEdit={(d) => {
            setSelectedDeviceForDetail(null);
            setSelectedDeviceForEdit(d);
          }}
        />
      )}

      {selectedDeviceForEdit && (
        <DeviceFormModal
          isOpen={!!selectedDeviceForEdit}
          onClose={() => setSelectedDeviceForEdit(null)}
          editDevice={selectedDeviceForEdit}
        />
      )}

      {/* Single Delete Confirm */}
      <ConfirmModal
        isOpen={!!deviceToDelete}
        onClose={() => setDeviceToDelete(null)}
        onConfirm={() => {
          if (deviceToDelete) deleteDevice(deviceToDelete.id);
        }}
        title="Hapus Perangkat?"
        message={`Apakah Anda yakin ingin menghapus perangkat dengan Seri "${deviceToDelete?.seri}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        variant="danger"
      />

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={() => {
          bulkDeleteDevices(selectedDeviceIds);
        }}
        title="Hapus Massal Perangkat?"
        message={`Anda akan menghapus ${selectedDeviceIds.length} perangkat yang dipilih. Data yang dihapus tidak dapat dipulihkan.`}
        confirmLabel="Hapus Semua Terpilih"
        variant="danger"
      />

      {/* Reset to Dummy Confirm */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => resetToDummy()}
        title="Muat Ulang Data Asli?"
        message="Ini akan memulihkan 80 data perangkat dari file Excel resmi Enviro LORAWAN & NBIOT. Perubahan manual yang belum dibackup mungkin tertimpa."
        confirmLabel="Ya, Muat Ulang"
        variant="warning"
      />
    </div>
  );
};

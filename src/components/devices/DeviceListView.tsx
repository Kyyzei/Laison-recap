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
} from 'lucide-react';
import { ExcelExportService } from '../../services/excel/excelExportService';

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
  } = useDevices();

  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleExportFiltered = () => {
    ExcelExportService.exportDevices(filteredDevices, {
      filename: `Laison_Device_Export_${filteredDevices.length}units`,
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
              className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedDeviceIds.length})</span>
            </button>
          )}

          <button
            onClick={handleExportFiltered}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download Excel dari data saat ini"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs transition-colors"
            title="Muat ulang 107 data default dari Excel"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Device</span>
          </button>
        </div>
      </div>

      {/* Filter Component */}
      <DeviceFilters />

      {/* Device Table */}
      <DeviceTable
        devices={paginatedDevices}
        onOpenDetail={(d) => setSelectedDeviceForDetail(d)}
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
        message="Ini akan memulihkan 107 data perangkat dari file Excel asli (Laison). Perubahan manual yang belum dibackup mungkin tertimpa."
        confirmLabel="Ya, Muat Ulang"
        variant="warning"
      />
    </div>
  );
};

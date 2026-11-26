import React, { useState } from 'react';
import { useSimCards } from '../../context/SimCardContext';
import { useDevices } from '../../context/DeviceContext';
import { SimCard, SimCardStatus } from '../../types/simcard';
import { SimCardFormModal } from './SimCardFormModal';
import { PairDeviceModal } from './PairDeviceModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { Pagination } from '../common/Pagination';
import { ExcelExportService } from '../../services/excel/excelExportService';
import { ModelIcon } from '../common/ModelIcon';
import {
  CardSim,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Trash2,
  Edit2,
  Link2,
  Unlink,
  Wifi,
  WifiOff,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SimCardListView: React.FC = () => {
  const {
    filteredSimCards,
    paginatedSimCards,
    stats,
    filters,
    setFilters,
    resetFilters,
    currentPage,
    rowsPerPage,
    totalPages,
    setCurrentPage,
    setRowsPerPage,
    selectedSimIds,
    toggleSelectSim,
    toggleSelectAll,
    clearSelection,
    deleteSimCard,
    bulkDeleteSimCards,
    fullSynchronize,
    updateSimCard,
    uniqueOperators,
    uniqueLokasi,
  } = useSimCards();

  const { devices, setSelectedDeviceForDetail, setFilters: setDeviceFilters } = useDevices();
  const navigate = useNavigate();

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSim, setEditingSim] = useState<SimCard | null>(null);
  const [pairingSim, setPairingSim] = useState<SimCard | null>(null);
  const [simToDelete, setSimToDelete] = useState<SimCard | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      fullSynchronize();
      setIsSyncing(false);
    }, 400);
  };

  const handleExportExcel = () => {
    ExcelExportService.exportSimCards(filteredSimCards, {
      filename: `Laison_Stok_SIM_Card_${filteredSimCards.length}unit`,
    });
  };

  const handleOpenDevice = (seri: string) => {
    const dev = devices.find((d) => d.seri === seri);
    if (dev) {
      setSelectedDeviceForDetail(dev);
    } else {
      setDeviceFilters((p) => ({ ...p, search: seri, model: 'ALL' }));
      navigate('/devices');
    }
  };

  const handleQuickToggleStatus = (sim: SimCard, newStatus: SimCardStatus) => {
    updateSimCard(sim.id, { status: newStatus });
  };

  return (
    <div className="space-y-4">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <CardSim className="w-5 h-5 text-blue-900" />
            <h1 className="text-base md:text-lg font-bold text-slate-900">
              Stok & Manajemen SIM Card
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inventaris SIM Card IoT Laison, monitoring status Online/Offline/Stock, dan sinkronisasi real-time dengan AquaLink.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedSimIds.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedSimIds.length})</span>
            </button>
          )}

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sinkronkan data kartu SIM dengan seluruh perangkat AquaLink"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Device'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download Excel stok SIM Card"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah SIM Card</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total SIM */}
        <div
          onClick={() => setFilters((p) => ({ ...p, status: 'ALL' }))}
          className={`p-3.5 rounded-xl border bg-white transition-all cursor-pointer ${
            filters.status === 'ALL'
              ? 'ring-2 ring-blue-900/30 border-blue-900 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total SIM Card</span>
            <CardSim className="w-4 h-4 text-blue-900" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Semua Unit</span>
          </div>
        </div>

        {/* Online */}
        <div
          onClick={() => setFilters((p) => ({ ...p, status: 'Online' }))}
          className={`p-3.5 rounded-xl border bg-white transition-all cursor-pointer ${
            filters.status === 'Online'
              ? 'ring-2 ring-emerald-500/30 border-emerald-500 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online</span>
            </span>
            <Wifi className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-700">{stats.online}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">Aktif Sinyal</span>
          </div>
        </div>

        {/* Offline */}
        <div
          onClick={() => setFilters((p) => ({ ...p, status: 'Offline' }))}
          className={`p-3.5 rounded-xl border bg-white transition-all cursor-pointer ${
            filters.status === 'Offline'
              ? 'ring-2 ring-rose-500/30 border-rose-500 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span>Offline</span>
            <WifiOff className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-rose-700">{stats.offline}</span>
            <span className="text-[10px] text-rose-600 font-semibold">Tanpa Sinyal</span>
          </div>
        </div>

        {/* Stock */}
        <div
          onClick={() => setFilters((p) => ({ ...p, status: 'Stock' }))}
          className={`p-3.5 rounded-xl border bg-white transition-all cursor-pointer ${
            filters.status === 'Stock'
              ? 'ring-2 ring-amber-500/30 border-amber-500 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
            <span>Stock Gudang</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-amber-700">{stats.stock}</span>
            <span className="text-[10px] text-amber-600 font-semibold">Siap Pakai</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
          <button
            onClick={() => setFilters((p) => ({ ...p, status: 'ALL' }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filters.status === 'ALL'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({stats.total})
          </button>

          <button
            onClick={() => setFilters((p) => ({ ...p, status: 'Online' }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filters.status === 'Online'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Online ({stats.online})</span>
          </button>

          <button
            onClick={() => setFilters((p) => ({ ...p, status: 'Offline' }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filters.status === 'Offline'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <span>Offline ({stats.offline})</span>
          </button>

          <button
            onClick={() => setFilters((p) => ({ ...p, status: 'Stock' }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filters.status === 'Stock'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <span>Stock Gudang ({stats.stock})</span>
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no SIM, ICCID, seri perangkat, lokasi..."
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
            />
          </div>

          {/* Operator Filter */}
          <div>
            <select
              value={filters.operator}
              onChange={(e) => setFilters((p) => ({ ...p, operator: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 bg-white"
            >
              <option value="ALL">Semua Operator ({uniqueOperators.length})</option>
              {uniqueOperators.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          {/* Lokasi Filter */}
          <div>
            <select
              value={filters.lokasi}
              onChange={(e) => setFilters((p) => ({ ...p, lokasi: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 bg-white"
            >
              <option value="ALL">Semua Lokasi ({uniqueLokasi.length})</option>
              {uniqueLokasi.map((lok) => (
                <option key={lok} value={lok}>
                  {lok}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SIM Cards Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedSimIds.length === paginatedSimCards.length &&
                      paginatedSimCards.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded-sm border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                  />
                </th>
                <th className="p-3">Nomor SIM & ICCID</th>
                <th className="p-3">Operator</th>
                <th className="p-3">Status</th>
                <th className="p-3">Perangkat Terhubung</th>
                <th className="p-3">Lokasi</th>
                <th className="p-3">APN & IP Server</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSimCards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <CardSim className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada SIM Card yang cocok.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Coba ubah kata kunci pencarian atau reset filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedSimCards.map((sim) => {
                  const isSelected = selectedSimIds.includes(sim.id);
                  const isPaired = Boolean(sim.deviceSeri);

                  return (
                    <tr
                      key={sim.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectSim(sim.id)}
                          className="rounded-sm border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                        />
                      </td>

                      {/* No SIM & ICCID */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                            <CardSim className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              {sim.noSim}
                            </span>
                            {sim.iccid && (
                              <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[150px]">
                                {sim.iccid}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="p-3">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {sim.operator}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        {sim.status === 'Online' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Online
                          </span>
                        )}
                        {sim.status === 'Offline' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Offline
                          </span>
                        )}
                        {sim.status === 'Stock' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Stock Gudang
                          </span>
                        )}
                      </td>

                      {/* Perangkat Terhubung */}
                      <td className="p-3">
                        {isPaired ? (
                          <button
                            onClick={() => handleOpenDevice(sim.deviceSeri!)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 hover:bg-blue-100 text-blue-900 border border-blue-200/80 transition-colors text-xs font-semibold cursor-pointer group"
                            title="Klik untuk membuka detail perangkat AquaLink ini"
                          >
                            <ModelIcon model={sim.deviceModel || 'AquaLink'} size="xs" />
                            <span className="font-mono">{sim.deviceSeri}</span>
                            <ArrowRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Belum Terpasang (Stock)
                          </span>
                        )}
                      </td>

                      {/* Lokasi */}
                      <td className="p-3 text-slate-700 font-medium">
                        {sim.lokasi || '-'}
                      </td>

                      {/* APN & IP */}
                      <td className="p-3">
                        <div className="font-mono text-[11px] text-slate-600">
                          <div>{sim.apnBand || '-'}</div>
                          {sim.ip && <div className="text-slate-400 text-[10px]">{sim.ip}</div>}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Pair / Unpair button */}
                          <button
                            onClick={() => setPairingSim(sim)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                              isPaired
                                ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                            title={isPaired ? 'Kelola keterhubungan perangkat' : 'Pasangkan ke perangkat AquaLink'}
                          >
                            {isPaired ? <Unlink className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingSim(sim)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Edit data SIM Card"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setSimToDelete(sim)}
                            className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus SIM Card"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={setRowsPerPage}
          totalItems={filteredSimCards.length}
        />
      </div>

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || Boolean(editingSim)) && (
        <SimCardFormModal
          isOpen={isCreateModalOpen || Boolean(editingSim)}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingSim(null);
          }}
          simCardToEdit={editingSim}
        />
      )}

      {/* Pair / Unpair Modal */}
      {Boolean(pairingSim) && (
        <PairDeviceModal
          isOpen={Boolean(pairingSim)}
          onClose={() => setPairingSim(null)}
          sim={pairingSim}
        />
      )}

      {/* Delete Single Modal */}
      {Boolean(simToDelete) && (
        <ConfirmModal
          isOpen={Boolean(simToDelete)}
          title="Hapus SIM Card"
          message={`Apakah Anda yakin ingin menghapus nomor SIM ${simToDelete?.noSim}? Jika kartu ini terhubung ke perangkat ${simToDelete?.deviceSeri || ''}, nomor SIM pada perangkat tersebut akan otomatis dikosongkan.`}
          confirmLabel="Hapus SIM"
          variant="danger"
          onConfirm={() => {
            if (simToDelete) {
              deleteSimCard(simToDelete.id);
              setSimToDelete(null);
            }
          }}
          onClose={() => setSimToDelete(null)}
        />
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <ConfirmModal
          isOpen={isBulkDeleteModalOpen}
          title="Hapus Massal SIM Card"
          message={`Apakah Anda yakin ingin menghapus ${selectedSimIds.length} kartu SIM yang dipilih?`}
          confirmLabel={`Hapus ${selectedSimIds.length} SIM`}
          variant="danger"
          onConfirm={() => {
            bulkDeleteSimCards(selectedSimIds);
            setIsBulkDeleteModalOpen(false);
          }}
          onClose={() => setIsBulkDeleteModalOpen(false)}
        />
      )}
    </div>
  );
};

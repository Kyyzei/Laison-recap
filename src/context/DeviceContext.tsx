import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Device, DeviceFilters, DeviceSort, getDeviceWarehouseStatus, getDeviceModel, DeviceHistoryEntry } from '../types/device';
import { DeviceStats } from '../types/common';
import { LocalStorageService } from '../services/storage/localStorageService';
import { useToast } from './ToastContext';
import { WarehouseMovementModal } from '../components/devices/WarehouseMovementModal';

interface DeviceContextValue {
  devices: Device[];
  filteredDevices: Device[];
  paginatedDevices: Device[];
  stats: DeviceStats;
  filters: DeviceFilters;
  sort: DeviceSort;
  currentPage: number;
  rowsPerPage: number;
  totalPages: number;
  selectedDeviceIds: string[];

  // Modals state
  selectedDeviceForDetail: Device | null;
  selectedDeviceForEdit: Device | null;
  isCreateModalOpen: boolean;

  // Warehouse Movement Modal State
  warehouseMovementDevice: Device | null;
  warehouseMovementMode: 'KELUAR' | 'KEMBALI';
  openWarehouseModal: (device: Device, mode: 'KELUAR' | 'KEMBALI') => void;
  closeWarehouseModal: () => void;

  // Setters
  setFilters: React.Dispatch<React.SetStateAction<DeviceFilters>>;
  resetFilters: () => void;
  setSort: React.Dispatch<React.SetStateAction<DeviceSort>>;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  toggleSelectDevice: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;

  setSelectedDeviceForDetail: (device: Device | null) => void;
  setSelectedDeviceForEdit: (device: Device | null) => void;
  setIsCreateModalOpen: (open: boolean) => void;

  // CRUD actions
  addDevice: (data: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => boolean;
  updateDevice: (id: string, updates: Partial<Omit<Device, 'id' | 'createdAt'>>, pic?: string) => boolean;
  addDeviceHistory: (deviceId: string, entry: Omit<DeviceHistoryEntry, 'id' | 'timestamp'> & { timestamp?: string }) => boolean;
  duplicateDevice: (id: string) => boolean;
  deleteDevice: (id: string) => boolean;
  bulkDeleteDevices: (ids: string[]) => boolean;
  resetToDummy: () => void;
  clearAll: () => void;
  refreshDevices: () => void;

  // Dropdown lists
  uniqueLokasi: string[];
}

const DEFAULT_FILTERS: DeviceFilters = {
  search: '',
  status: 'ALL',
  koneksi: 'ALL',
  lokasi: 'ALL',
  posisiGudang: 'ALL',
  model: 'ALL',
};

const DEFAULT_SORT: DeviceSort = {
  field: 'seri',
  order: 'asc',
};

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error, info } = useToast();
  const [devices, setDevices] = useState<Device[]>(() => LocalStorageService.getDevices());
  const [filters, setFiltersState] = useState<DeviceFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<DeviceSort>(DEFAULT_SORT);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

  // Modals
  const [selectedDeviceForDetail, setSelectedDeviceForDetail] = useState<Device | null>(null);
  const [selectedDeviceForEdit, setSelectedDeviceForEdit] = useState<Device | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Warehouse Movement Modal State
  const [warehouseMovementDevice, setWarehouseMovementDevice] = useState<Device | null>(null);
  const [warehouseMovementMode, setWarehouseMovementMode] = useState<'KELUAR' | 'KEMBALI'>('KELUAR');

  const openWarehouseModal = useCallback((device: Device, mode: 'KELUAR' | 'KEMBALI') => {
    setWarehouseMovementDevice(device);
    setWarehouseMovementMode(mode);
  }, []);

  const closeWarehouseModal = useCallback(() => {
    setWarehouseMovementDevice(null);
  }, []);

  const setFilters = useCallback((updater: React.SetStateAction<DeviceFilters>) => {
    setCurrentPage(1);
    setFiltersState(updater);
  }, []);

  const refreshDevices = useCallback(() => {
    setDevices(LocalStorageService.getDevices());
  }, []);

  useEffect(() => {
    const handleStorageChange = () => refreshDevices();
    window.addEventListener('aqualink-devices-changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('aqualink-devices-changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshDevices]);

  const resetFilters = useCallback(() => {
    setCurrentPage(1);
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  // Stats calculation
  const stats: DeviceStats = useMemo(() => {
    const s: DeviceStats = {
      total: devices.length,
      aktif: 0,
      terpasang: 0,
      stok: 0,
      rusak: 0,
      maintenance: 0,
      dipinjamkan: 0,
      lopiwan: 0,
      nbiot: 0,
      gprs: 0,
      cat1: 0,
      diGudang: 0,
      diLuar: 0,
      aqualink: 0,
      ultrasonic: 0,
      miu: 0,
      hybrid: 0,
    };

    for (const d of devices) {
      if (d.status === 'Aktif') s.aktif++;
      else if (d.status === 'Terpasang') s.terpasang++;
      else if (d.status === 'Stok') s.stok++;
      else if (d.status === 'Rusak') s.rusak++;
      else if (d.status === 'Maintenance') s.maintenance++;
      else if (d.status === 'Dipinjamkan') s.dipinjamkan++;

      if (d.koneksi === 'LoRaWAN') s.lopiwan++;
      else if (d.koneksi === 'NB-IoT') s.nbiot++;
      else if (d.koneksi === 'GPRS') s.gprs++;
      else if (d.koneksi === 'Cat 1') s.cat1++;

      const whStatus = getDeviceWarehouseStatus(d);
      if (whStatus === 'DI_LUAR') s.diLuar++;
      else s.diGudang++;

      const devModel = getDeviceModel(d);
      if (devModel === 'AquaLink') s.aqualink++;
      else if (devModel === 'Ultrasonic') s.ultrasonic++;
      else if (devModel === 'MIU') s.miu++;
      else if (devModel === 'Hybrid' || devModel === 'Smart Meter Hybrid') s.hybrid++;
    }

    return s;
  }, [devices]);

  // Unique lokasi list
  const uniqueLokasi = useMemo(() => {
    return Array.from(new Set(devices.map((d) => d.lokasi).filter(Boolean))).sort();
  }, [devices]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matches =
          d.seri.toLowerCase().includes(q) ||
          d.koneksi.toLowerCase().includes(q) ||
          d.readAddress.toLowerCase().includes(q) ||
          d.devEui.toLowerCase().includes(q) ||
          d.appEui.toLowerCase().includes(q) ||
          d.devAddr.toLowerCase().includes(q) ||
          d.noSim.toLowerCase().includes(q) ||
          d.apnBand.toLowerCase().includes(q) ||
          d.ip.toLowerCase().includes(q) ||
          d.appKey.toLowerCase().includes(q) ||
          d.lokasi.toLowerCase().includes(q) ||
          d.catatan.toLowerCase().includes(q) ||
          (d.tanggalKeluar && d.tanggalKeluar.includes(q)) ||
          (d.tanggalKembali && d.tanggalKembali.includes(q)) ||
          (d.penerimaKeluar && d.penerimaKeluar.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (filters.status !== 'ALL' && d.status !== filters.status) return false;
      if (filters.koneksi !== 'ALL' && d.koneksi !== filters.koneksi) return false;
      if (filters.lokasi !== 'ALL' && d.lokasi !== filters.lokasi) return false;
      if (filters.posisiGudang !== 'ALL') {
        const whStatus = getDeviceWarehouseStatus(d);
        if (whStatus !== filters.posisiGudang) return false;
      }
      if (filters.model !== 'ALL') {
        const m = getDeviceModel(d);
        if (filters.model === 'Hybrid' || filters.model === 'Smart Meter Hybrid') {
          if (m !== 'Hybrid' && m !== 'Smart Meter Hybrid') return false;
        } else if (m !== filters.model) {
          return false;
        }
      }

      return true;
    });
  }, [devices, filters]);

  // Sorted devices
  const sortedDevices = useMemo(() => {
    return [...filteredDevices].sort((a, b) => {
      const field = sort.field;
      const valA = (a[field] || '').toLowerCase();
      const valB = (b[field] || '').toLowerCase();
      if (valA < valB) return sort.order === 'asc' ? -1 : 1;
      if (valA > valB) return sort.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDevices, sort]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedDevices.length / rowsPerPage));
  const paginatedDevices = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedDevices.slice(start, start + rowsPerPage);
  }, [sortedDevices, currentPage, rowsPerPage]);

  const toggleSelectDevice = useCallback((id: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedDeviceIds.length === paginatedDevices.length && paginatedDevices.length > 0) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(paginatedDevices.map((d) => d.id));
    }
  }, [paginatedDevices, selectedDeviceIds]);

  const clearSelection = useCallback(() => {
    setSelectedDeviceIds([]);
  }, []);

  // CRUD Implementations
  const addDevice = useCallback(
    (data: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): boolean => {
      try {
        const created = LocalStorageService.addDevice(data);
        refreshDevices();
        success('Perangkat Ditambahkan', `Perangkat seri ${created.seri} berhasil disimpan.`);
        return true;
      } catch (err: any) {
        error('Gagal Menambah Perangkat', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [refreshDevices, success, error]
  );

  const updateDevice = useCallback(
    (id: string, updates: Partial<Omit<Device, 'id' | 'createdAt'>>, pic: string = 'Admin'): boolean => {
      try {
        const updated = LocalStorageService.updateDevice(id, updates, pic);
        refreshDevices();
        success('Perangkat Diperbarui', `Perangkat seri ${updated.seri} berhasil diperbarui.`);
        return true;
      } catch (err: any) {
        error('Gagal Memperbarui', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [refreshDevices, success, error]
  );

  const addDeviceHistory = useCallback(
    (deviceId: string, entry: Omit<DeviceHistoryEntry, 'id' | 'timestamp'> & { timestamp?: string }): boolean => {
      try {
        const updated = LocalStorageService.addDeviceHistory(deviceId, entry);
        refreshDevices();
        success('Riwayat Ditambahkan', `Catatan riwayat untuk perangkat seri ${updated.seri} berhasil disimpan.`);
        return true;
      } catch (err: any) {
        error('Gagal Menambah Riwayat', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [refreshDevices, success, error]
  );

  const duplicateDevice = useCallback(
    (id: string): boolean => {
      try {
        const dup = LocalStorageService.duplicateDevice(id);
        refreshDevices();
        success('Perangkat Diduplikasi', `Dibuat salinan baru: ${dup.seri}.`);
        return true;
      } catch (err: any) {
        error('Gagal Duplikasi', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [refreshDevices, success, error]
  );

  const deleteDevice = useCallback(
    (id: string): boolean => {
      try {
        const target = devices.find((d) => d.id === id);
        LocalStorageService.deleteDevice(id);
        refreshDevices();
        clearSelection();
        success('Perangkat Dihapus', `Perangkat seri ${target?.seri || id} berhasil dihapus.`);
        return true;
      } catch (err: any) {
        error('Gagal Menghapus', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [devices, refreshDevices, clearSelection, success, error]
  );

  const bulkDeleteDevices = useCallback(
    (ids: string[]): boolean => {
      try {
        const count = LocalStorageService.bulkDeleteDevices(ids);
        refreshDevices();
        clearSelection();
        success('Penghapusan Berhasil', `${count} perangkat berhasil dihapus.`);
        return true;
      } catch (err: any) {
        error('Gagal Hapus Massal', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [refreshDevices, clearSelection, success, error]
  );

  const resetToDummy = useCallback(() => {
    LocalStorageService.resetToDummy();
    refreshDevices();
    info('Data Dimuat Ulang', '80 data perangkat dari Excel berhasil dimuat ulang.');
  }, [refreshDevices, info]);

  const clearAll = useCallback(() => {
    LocalStorageService.clearAll();
    refreshDevices();
    clearSelection();
    info('Data Dikosongkan', 'Seluruh data perangkat telah dihapus.');
  }, [refreshDevices, clearSelection, info]);

  return (
    <DeviceContext.Provider
      value={{
        devices,
        filteredDevices,
        paginatedDevices,
        stats,
        filters,
        sort,
        currentPage,
        rowsPerPage,
        totalPages,
        selectedDeviceIds,
        selectedDeviceForDetail,
        selectedDeviceForEdit,
        isCreateModalOpen,
        warehouseMovementDevice,
        warehouseMovementMode,
        openWarehouseModal,
        closeWarehouseModal,
        setFilters,
        resetFilters,
        setSort,
        setCurrentPage,
        setRowsPerPage,
        toggleSelectDevice,
        toggleSelectAll,
        clearSelection,
        setSelectedDeviceForDetail,
        setSelectedDeviceForEdit,
        setIsCreateModalOpen,
        addDevice,
        updateDevice,
        addDeviceHistory,
        duplicateDevice,
        deleteDevice,
        bulkDeleteDevices,
        resetToDummy,
        clearAll,
        refreshDevices,
        uniqueLokasi,
      }}
    >
      {children}
      <WarehouseMovementModal
        device={warehouseMovementDevice}
        isOpen={!!warehouseMovementDevice}
        onClose={closeWarehouseModal}
        mode={warehouseMovementMode}
      />
    </DeviceContext.Provider>
  );
};

export const useDevices = () => {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error('useDevices must be used within DeviceProvider');
  return ctx;
};

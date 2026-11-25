import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { SimCard, SimCardFilters, SimCardStats, SimCardStatus } from '../types/simcard';
import { SimCardStorageService } from '../services/storage/simCardStorageService';
import { useToast } from './ToastContext';
import { useDevices } from './DeviceContext';

interface SimCardContextValue {
  simCards: SimCard[];
  filteredSimCards: SimCard[];
  paginatedSimCards: SimCard[];
  stats: SimCardStats;
  filters: SimCardFilters;
  currentPage: number;
  rowsPerPage: number;
  totalPages: number;
  selectedSimIds: string[];

  // Modals state
  selectedSimForEdit: SimCard | null;
  selectedSimForPair: SimCard | null;
  isCreateModalOpen: boolean;

  // Actions & Setters
  setFilters: React.Dispatch<React.SetStateAction<SimCardFilters>>;
  resetFilters: () => void;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  toggleSelectSim: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;

  setSelectedSimForEdit: (sim: SimCard | null) => void;
  setSelectedSimForPair: (sim: SimCard | null) => void;
  setIsCreateModalOpen: (open: boolean) => void;

  // CRUD
  addSimCard: (data: Omit<SimCard, 'id' | 'createdAt' | 'updatedAt'>) => boolean;
  updateSimCard: (id: string, updates: Partial<SimCard>) => boolean;
  pairSimToDevice: (simId: string, deviceSeri: string) => boolean;
  unpairSim: (simId: string) => boolean;
  deleteSimCard: (id: string) => boolean;
  bulkDeleteSimCards: (ids: string[]) => boolean;
  fullSynchronize: () => void;
  resetToDefault: () => void;
  refreshSimCards: () => void;

  // Dropdowns
  uniqueOperators: string[];
  uniqueLokasi: string[];
}

const DEFAULT_FILTERS: SimCardFilters = {
  search: '',
  status: 'ALL',
  operator: 'ALL',
  lokasi: 'ALL',
};

const SimCardContext = createContext<SimCardContextValue | undefined>(undefined);

export const SimCardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error, info } = useToast();
  const { refreshDevices } = useDevices();
  const [simCards, setSimCards] = useState<SimCard[]>(() => SimCardStorageService.getSimCards());
  const [filters, setFiltersState] = useState<SimCardFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [selectedSimIds, setSelectedSimIds] = useState<string[]>([]);

  // Modals
  const [selectedSimForEdit, setSelectedSimForEdit] = useState<SimCard | null>(null);
  const [selectedSimForPair, setSelectedSimForPair] = useState<SimCard | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const refreshSimCards = useCallback(() => {
    setSimCards(SimCardStorageService.getSimCards());
  }, []);

  useEffect(() => {
    const handleSimChange = () => refreshSimCards();
    window.addEventListener('laison-simcards-changed', handleSimChange);
    window.addEventListener('aqualink-devices-changed', handleSimChange);
    window.addEventListener('storage', handleSimChange);
    return () => {
      window.removeEventListener('laison-simcards-changed', handleSimChange);
      window.removeEventListener('aqualink-devices-changed', handleSimChange);
      window.removeEventListener('storage', handleSimChange);
    };
  }, [refreshSimCards]);

  const setFilters = useCallback((updater: React.SetStateAction<SimCardFilters>) => {
    setCurrentPage(1);
    setFiltersState(updater);
  }, []);

  const resetFilters = useCallback(() => {
    setCurrentPage(1);
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  // Stats calculation
  const stats: SimCardStats = useMemo(() => {
    const s: SimCardStats = {
      total: simCards.length,
      online: 0,
      offline: 0,
      stock: 0,
    };

    simCards.forEach((c) => {
      if (c.status === 'Online') s.online++;
      else if (c.status === 'Offline') s.offline++;
      else if (c.status === 'Stock') s.stock++;
    });

    return s;
  }, [simCards]);

  // Unique lists for filters
  const uniqueOperators = useMemo(() => {
    return Array.from(new Set(simCards.map((s) => s.operator).filter(Boolean))).sort();
  }, [simCards]);

  const uniqueLokasi = useMemo(() => {
    return Array.from(new Set(simCards.map((s) => s.lokasi).filter(Boolean) as string[])).sort();
  }, [simCards]);

  // Filtered SIM cards
  const filteredSimCards = useMemo(() => {
    return simCards.filter((s) => {
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matches =
          s.noSim.toLowerCase().includes(q) ||
          (s.iccid && s.iccid.toLowerCase().includes(q)) ||
          s.operator.toLowerCase().includes(q) ||
          (s.deviceSeri && s.deviceSeri.toLowerCase().includes(q)) ||
          (s.deviceModel && s.deviceModel.toLowerCase().includes(q)) ||
          (s.lokasi && s.lokasi.toLowerCase().includes(q)) ||
          (s.catatan && s.catatan.toLowerCase().includes(q)) ||
          (s.ip && s.ip.toLowerCase().includes(q)) ||
          (s.apnBand && s.apnBand.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (filters.status !== 'ALL' && s.status !== filters.status) return false;
      if (filters.operator !== 'ALL' && s.operator !== filters.operator) return false;
      if (filters.lokasi !== 'ALL' && s.lokasi !== filters.lokasi) return false;

      return true;
    });
  }, [simCards, filters]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSimCards.length / rowsPerPage));
  const paginatedSimCards = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredSimCards.slice(start, start + rowsPerPage);
  }, [filteredSimCards, currentPage, rowsPerPage]);

  const toggleSelectSim = useCallback((id: string) => {
    setSelectedSimIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedSimIds.length === paginatedSimCards.length && paginatedSimCards.length > 0) {
      setSelectedSimIds([]);
    } else {
      setSelectedSimIds(paginatedSimCards.map((s) => s.id));
    }
  }, [paginatedSimCards, selectedSimIds]);

  const clearSelection = useCallback(() => {
    setSelectedSimIds([]);
  }, []);

  // CRUD actions
  const addSimCard = useCallback(
    (data: Omit<SimCard, 'id' | 'createdAt' | 'updatedAt'>): boolean => {
      try {
        const created = SimCardStorageService.addSimCard(data);
        refreshSimCards();
        refreshDevices();
        success('SIM Card Ditambahkan', `Nomor SIM ${created.noSim} (${created.status}) berhasil disimpan.`);
        return true;
      } catch (err: any) {
        error('Gagal Menambah SIM Card', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [refreshSimCards, refreshDevices, success, error]
  );

  const updateSimCard = useCallback(
    (id: string, updates: Partial<SimCard>): boolean => {
      try {
        const updated = SimCardStorageService.updateSimCard(id, updates);
        refreshSimCards();
        refreshDevices();
        success('SIM Card Diperbarui', `SIM Card ${updated.noSim} berhasil diperbarui.`);
        return true;
      } catch (err: any) {
        error('Gagal Memperbarui SIM Card', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [refreshSimCards, refreshDevices, success, error]
  );

  const pairSimToDevice = useCallback(
    (simId: string, deviceSeri: string): boolean => {
      try {
        const result = SimCardStorageService.pairSimToDevice(simId, deviceSeri);
        refreshSimCards();
        refreshDevices();
        success(
          'SIM Card Terhubung',
          `SIM ${result.sim.noSim} berhasil dipasangkan ke perangkat AquaLink seri ${deviceSeri}.`
        );
        return true;
      } catch (err: any) {
        error('Gagal Memasangkan SIM Card', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [refreshSimCards, refreshDevices, success, error]
  );

  const unpairSim = useCallback(
    (simId: string): boolean => {
      try {
        const sim = SimCardStorageService.unpairSim(simId);
        refreshSimCards();
        refreshDevices();
        success('SIM Card Dilepas', `SIM ${sim.noSim} telah dilepas dari perangkat dan kembali ke Stock.`);
        return true;
      } catch (err: any) {
        error('Gagal Melepas SIM Card', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [refreshSimCards, refreshDevices, success, error]
  );

  const deleteSimCard = useCallback(
    (id: string): boolean => {
      try {
        const target = simCards.find((s) => s.id === id);
        SimCardStorageService.deleteSimCard(id);
        refreshSimCards();
        refreshDevices();
        clearSelection();
        success('SIM Card Dihapus', `SIM Card ${target?.noSim || id} berhasil dihapus.`);
        return true;
      } catch (err: any) {
        error('Gagal Menghapus SIM Card', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [simCards, refreshSimCards, refreshDevices, clearSelection, success, error]
  );

  const bulkDeleteSimCards = useCallback(
    (ids: string[]): boolean => {
      try {
        ids.forEach((id) => SimCardStorageService.deleteSimCard(id));
        refreshSimCards();
        refreshDevices();
        clearSelection();
        success('Penghapusan Berhasil', `${ids.length} kartu SIM berhasil dihapus.`);
        return true;
      } catch (err: any) {
        error('Gagal Hapus Massal', err.message || 'Terjadi kesalahan.');
        return false;
      }
    },
    [refreshSimCards, refreshDevices, clearSelection, success, error]
  );

  const fullSynchronize = useCallback(() => {
    try {
      const res = SimCardStorageService.fullSynchronize();
      refreshSimCards();
      refreshDevices();
      info(
        'Sinkronisasi Selesai',
        `Berhasil menyinkronkan data dengan perangkat AquaLink (${res.syncedDevices} perangkat diselaraskan, ${res.addedCards} SIM baru terdaftar).`
      );
    } catch (err: any) {
      error('Gagal Sinkronisasi', err.message || 'Terjadi kesalahan.');
    }
  }, [refreshSimCards, refreshDevices, info, error]);

  const resetToDefault = useCallback(() => {
    SimCardStorageService.resetToDefault();
    refreshSimCards();
    refreshDevices();
    info('Stok SIM Dimuat Ulang', 'Seluruh stok SIM Card telah dimuat ulang sesuai data perangkat.');
  }, [refreshSimCards, refreshDevices, info]);

  return (
    <SimCardContext.Provider
      value={{
        simCards,
        filteredSimCards,
        paginatedSimCards,
        stats,
        filters,
        currentPage,
        rowsPerPage,
        totalPages,
        selectedSimIds,
        selectedSimForEdit,
        selectedSimForPair,
        isCreateModalOpen,
        setFilters,
        resetFilters,
        setCurrentPage,
        setRowsPerPage,
        toggleSelectSim,
        toggleSelectAll,
        clearSelection,
        setSelectedSimForEdit,
        setSelectedSimForPair,
        setIsCreateModalOpen,
        addSimCard,
        updateSimCard,
        pairSimToDevice,
        unpairSim,
        deleteSimCard,
        bulkDeleteSimCards,
        fullSynchronize,
        resetToDefault,
        refreshSimCards,
        uniqueOperators,
        uniqueLokasi,
      }}
    >
      {children}
    </SimCardContext.Provider>
  );
};

export const useSimCards = () => {
  const ctx = useContext(SimCardContext);
  if (!ctx) throw new Error('useSimCards must be used within SimCardProvider');
  return ctx;
};


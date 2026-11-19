export type SimCardStatus = 'Terpakai' | 'Online' | 'Offline' | 'Stock';

export const SIM_CARD_STATUS_LIST: SimCardStatus[] = [
  'Terpakai',
  'Online',
  'Offline',
  'Stock',
];

export interface SimCard {
  id: string;              // Unique ID (e.g. "sim-085153784819")
  noSim: string;           // Nomor SIM / MSISDN (e.g. "0851-5378-4819")
  iccid?: string;          // Serial ICCID (opsional, e.g. "896201001234567890")
  operator: string;        // Provider (e.g. "Telkomsel IoT", "XL Axiata", "Indosat Ooredoo")
  status: SimCardStatus;   // 'Terpakai' | 'Online' | 'Offline' | 'Stock'
  deviceId?: string;       // ID perangkat terhubung
  deviceSeri?: string;     // Nomor seri perangkat terhubung (e.g. "6604290051")
  deviceModel?: string;    // Model perangkat (e.g. "AquaLink")
  ip?: string;             // IP Server (e.g. "147.93.81.149")
  apnBand?: string;        // APN & Band (e.g. "NBIOT,3,20,28,8")
  lokasi?: string;         // Lokasi perangkat / penyimpanan kartu (e.g. "P. Kelapa Dua", "Gudang Utama Laison")
  kuota?: string;          // Paket kuota (e.g. "500 MB/bulan", "Unlimited IoT")
  masaAktif?: string;      // Masa aktif kartu (e.g. "2026-12-31")
  catatan?: string;        // Catatan operasional
  tanggalPasang?: string;  // Kapan dipasangkan ke perangkat (YYYY-MM-DD)
  createdAt: string;
  updatedAt: string;
}

export interface SimCardStats {
  total: number;
  terpakai: number;
  online: number;
  offline: number;
  stock: number;
}

export interface SimCardFilters {
  search: string;
  status: 'ALL' | SimCardStatus;
  operator: 'ALL' | string;
  lokasi: 'ALL' | string;
}

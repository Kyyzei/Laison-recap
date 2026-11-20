export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

export interface DeviceStats {
  total: number;
  aktif: number;
  terpasang: number;
  stok: number;
  rusak: number;
  maintenance: number;
  dipinjamkan: number;
  lopiwan: number;
  nbiot: number;
  gprs: number;
  cat1: number;
  // Logistik Gudang
  diGudang: number;
  diLuar: number;
  // Kategori Model
  aqualink: number;
  ultrasonic: number;
  miu: number;
  hybrid: number;
}

export interface ImportPreviewItem {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  warnings: string[];
  isDuplicateSerial: boolean;
  status: 'valid' | 'duplicate' | 'invalid';
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  items: ImportPreviewItem[];
}

export interface BackupData {
  appName: string;
  version: string;
  exportedAt: string;
  deviceCount: number;
  devices: any[];
  settings?: any;
}

export interface AppSettings {
  appName: string;
  organization: string;
  rowsPerPage: number;
  apiConfig: {
    enabled: boolean;
    provider: 'aqualink_os' | 'meterin';
    baseUrl: string;
    apiKey: string;
  };
}

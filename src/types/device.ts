export type DeviceStatus =
  | 'Aktif'
  | 'Rusak'
  | 'Stok'
  | 'Terpasang'
  | 'Maintenance'
  | 'Dipinjamkan';

export const DEVICE_STATUS_LIST: DeviceStatus[] = [
  'Aktif',
  'Terpasang',
  'Stok',
  'Rusak',
  'Maintenance',
  'Dipinjamkan',
];

export type DeviceModel = 'AquaLink' | 'Ultrasonic' | 'MIU';

export interface DeviceModelInfo {
  id: DeviceModel;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export const DEVICE_MODELS: DeviceModelInfo[] = [
  {
    id: 'AquaLink',
    label: 'AquaLink',
    shortLabel: 'AquaLink',
    icon: '💧',
    description: 'Smart Water Meter & IoT Controller',
  },
  {
    id: 'Ultrasonic',
    label: 'Ultrasonic',
    shortLabel: 'Ultrasonic',
    icon: '🔊',
    description: 'Ultrasonic Flow Meter & Sensor',
  },
  {
    id: 'MIU',
    label: 'Meter Interface Unit (MIU)',
    shortLabel: 'MIU',
    icon: '📟',
    description: 'Pulse Reader & Interface Unit',
  },
];

export type ConnectionType = 'LoRaWAN' | 'NB-IoT';

export const CONNECTION_TYPES: ConnectionType[] = ['LoRaWAN', 'NB-IoT'];

export type WarehousePosition = 'DI_GUDANG' | 'DI_LUAR';

export interface WarehouseMovement {
  id: string;
  tipe: 'KELUAR' | 'KEMBALI';
  tanggal: string; // YYYY-MM-DD
  lokasi?: string; // Lokasi tujuan atau lokasi simpan
  penerima?: string; // PIC / Teknisi
  keperluan?: string; // Keperluan mutasi
  catatan?: string;
  createdAt: string;
}

export interface Device {
  id: string;              // Internal unique ID
  model?: DeviceModel;     // Model/Kategori: AquaLink | Ultrasonic | MIU (default: AquaLink)
  seri: string;            // Serial number (unique, e.g. 6604290016)
  koneksi: ConnectionType; // LoRaWAN or NB-IoT
  readAddress: string;     // e.g. AF066604290016
  // LoRaWAN fields
  devEui: string;          // e.g. 8CF9572000193D62
  appEui: string;          // e.g. 8CF9572000000000
  devAddr: string;         // e.g. 00193D62
  // NB-IoT fields
  noSim: string;           // e.g. 0851-5378-4819
  apnBand: string;         // e.g. NB1,B8
  ip: string;              // e.g. 147.93.81.149
  // Common fields
  appKey: string;          // e.g. 1AC1EF01E96CAF1BE0D329331A4FC2A8
  status: DeviceStatus;
  lokasi: string;
  catatan: string;
  // --- Fitur Keluar / Kembali Gudang ---
  tanggalKeluar?: string;    // Kapan keluar dari gudang (YYYY-MM-DD)
  tanggalKembali?: string;   // Kapan kembali ke gudang (YYYY-MM-DD)
  posisiGudang?: WarehousePosition; // Posisi saat ini: Di Gudang / Di Luar
  penerimaKeluar?: string;   // Teknisi / PIC yang membawa
  keperluanKeluar?: string;  // Keperluan (Instalasi, Maintenance, dll.)
  riwayatGudang?: WarehouseMovement[]; // Log riwayat mutasi
  createdAt: string;
  updatedAt: string;
}

export function getDeviceModel(d: Device): DeviceModel {
  return d.model || 'AquaLink';
}

export function getDeviceWarehouseStatus(d: Device): WarehousePosition {
  if (d.posisiGudang) return d.posisiGudang;
  if (d.tanggalKeluar && (!d.tanggalKembali || d.tanggalKeluar > d.tanggalKembali)) {
    return 'DI_LUAR';
  }
  return 'DI_GUDANG';
}

export interface DeviceFilters {
  search: string;
  status: string;       // 'ALL' or specific DeviceStatus
  koneksi: string;      // 'ALL' or 'LoRaWAN' or 'NB-IoT'
  lokasi: string;       // 'ALL' or specific location
  posisiGudang: string; // 'ALL' or 'DI_GUDANG' or 'DI_LUAR'
  model: 'ALL' | DeviceModel; // 'ALL' or 'AquaLink' | 'Ultrasonic' | 'MIU'
}

export type SortField =
  | 'seri'
  | 'model'
  | 'koneksi'
  | 'status'
  | 'lokasi'
  | 'tanggalKeluar'
  | 'tanggalKembali'
  | 'updatedAt';

export type SortOrder = 'asc' | 'desc';

export interface DeviceSort {
  field: SortField;
  order: SortOrder;
}

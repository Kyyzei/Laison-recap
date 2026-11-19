import { Device, WarehousePosition, DeviceHistoryEntry, ParameterDiff, DeviceHistoryCategory } from '../../types/device';
import { DUMMY_DEVICES } from '../../data/dummyDevices';

const STORAGE_KEY = 'laison_devices_v6';

const FIELD_LABELS: Record<string, string> = {
  model: 'Model Perangkat',
  seri: 'Nomor Seri',
  koneksi: 'Tipe Koneksi',
  readAddress: 'Read Address',
  devEui: 'DevEUI',
  appEui: 'AppEUI',
  devAddr: 'DevAddr',
  noSim: 'No SIM',
  apnBand: 'APN & Band',
  ip: 'IP Server',
  appKey: 'AppKey',
  status: 'Status Perangkat',
  lokasi: 'Lokasi',
  catatan: 'Catatan',
  tanggalKeluar: 'Tanggal Keluar',
  tanggalKembali: 'Tanggal Kembali',
  posisiGudang: 'Posisi Gudang',
  penerimaKeluar: 'PIC / Pembawa',
  keperluanKeluar: 'Keperluan Keluar',
};

export class LocalStorageService {
  /**
   * Get all devices from localStorage.
   */
  static getDevices(): Device[] {
    try {
      // Bersihkan cache versi lama yang menyimpan data 107 atau serial usang
      ['aqualink_devices', 'aqualink_devices_v2', 'aqualink_devices_v3', 'aqualink_devices_v4', 'laison_devices_v5'].forEach((oldKey) => {
        try {
          if (localStorage.getItem(oldKey)) {
            localStorage.removeItem(oldKey);
          }
        } catch {
          // ignore
        }
      });

      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveDevices(DUMMY_DEVICES);
        return DUMMY_DEVICES;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveDevices(DUMMY_DEVICES);
        return DUMMY_DEVICES;
      }

      // Validasi integritas: Jika mengandung serial non-resmi 6508280011 atau draft lama
      const hasObsoleteData = parsed.some((d: any) => d.seri === '6508280011' || d.seri === '6508280012');
      if (hasObsoleteData) {
        console.warn('Terdeteksi data lama/tidak resmi di cache browser, mereset ke 80 perangkat resmi Excel.');
        this.saveDevices(DUMMY_DEVICES);
        return DUMMY_DEVICES;
      }

      // Pastikan seluruh device memiliki model, riwayat, dan device P. Kelapa Dua terisi tanggal keluar
      let needsSave = false;
      const updated = (parsed as Device[]).map((d) => {
        let dev = d;
        if (!dev.model) {
          needsSave = true;
          dev = { ...dev, model: 'AquaLink' };
        }
        if (!dev.riwayat) {
          needsSave = true;
          dev = { ...dev, riwayat: [] };
        }
        if ((dev.lokasi || '').toLowerCase().includes('kelapa')) {
          if (dev.tanggalKeluar !== '2026-07-14' || dev.penerimaKeluar !== 'Enviro') {
            needsSave = true;
            dev = {
              ...dev,
              tanggalKeluar: '2026-07-14',
              penerimaKeluar: 'Enviro',
              posisiGudang: (dev.tanggalKembali ? 'DI_GUDANG' : 'DI_LUAR') as WarehousePosition,
              keperluanKeluar: dev.keperluanKeluar || 'Instalasi Lapangan',
            };
          }
        }
        return dev;
      });

      if (needsSave) {
        this.saveDevices(updated);
      }

      return updated;
    } catch (err) {
      console.error('Error reading devices:', err);
      return DUMMY_DEVICES;
    }
  }

  /**
   * Save array of devices to localStorage.
   */
  static saveDevices(devices: Device[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
      window.dispatchEvent(new CustomEvent('aqualink-devices-changed', { detail: devices }));
    } catch (err) {
      console.error('Error saving devices:', err);
      throw new Error('Gagal menyimpan ke penyimpanan lokal browser.');
    }
  }

  /**
   * Check if Serial Number (seri) already exists.
   */
  static isSeriTaken(seri: string, excludeId?: string): boolean {
    const devices = this.getDevices();
    const clean = seri.trim().toLowerCase();
    return devices.some(
      (d) => d.seri.trim().toLowerCase() === clean && (!excludeId || d.id !== excludeId)
    );
  }

  /**
   * Add a new device.
   */
  static addDevice(data: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Device {
    if (this.isSeriTaken(data.seri)) {
      throw new Error(`Nomor Seri "${data.seri}" sudah terdaftar.`);
    }

    const now = new Date().toISOString();
    const initHistory: DeviceHistoryEntry = {
      id: 'hist-' + Date.now() + '-init',
      timestamp: now,
      kategori: 'SISTEM',
      judul: 'Perangkat Didaftarkan',
      deskripsi: `Perangkat model ${data.model || 'AquaLink'} (${data.koneksi}) seri ${data.seri} didaftarkan ke sistem.`,
      pic: 'Pengguna',
    };

    const newDevice: Device = {
      ...data,
      id: 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      riwayat: data.riwayat && data.riwayat.length > 0 ? data.riwayat : [initHistory],
      createdAt: now,
      updatedAt: now,
    };

    const current = this.getDevices();
    const updated = [newDevice, ...current];
    this.saveDevices(updated);
    return newDevice;
  }

  /**
   * Update device with automated change tracking (audit trail).
   */
  static updateDevice(
    id: string,
    updates: Partial<Omit<Device, 'id' | 'createdAt'>>,
    pic: string = 'Admin'
  ): Device {
    const current = this.getDevices();
    const index = current.findIndex((d) => d.id === id);

    if (index === -1) {
      throw new Error('Perangkat tidak ditemukan.');
    }

    if (updates.seri && this.isSeriTaken(updates.seri, id)) {
      throw new Error(`Nomor Seri "${updates.seri}" sudah digunakan.`);
    }

    const prevDevice = current[index];
    const now = new Date().toISOString();

    // Deteksi perbedaan parameter
    const diffs: ParameterDiff[] = [];
    for (const [key, label] of Object.entries(FIELD_LABELS)) {
      if (key in updates) {
        const oldVal = (prevDevice[key as keyof Device] ?? '').toString().trim();
        const newVal = ((updates as Record<string, any>)[key] ?? '').toString().trim();
        if (oldVal !== newVal) {
          diffs.push({
            field: key,
            fieldLabel: label,
            oldValue: oldVal || '(kosong)',
            newValue: newVal || '(kosong)',
          });
        }
      }
    }

    let existingHistory = prevDevice.riwayat || [];

    // Jika ada parameter yang berubah dan bukan sekadar passing riwayat manual
    if (diffs.length > 0) {
      let kategori: DeviceHistoryCategory = 'PARAMETER';
      let judul = `Perubahan Parameter (${diffs.length} item)`;

      // Cek apakah perubahan terkait gudang
      const hasGudangChange = diffs.some((d) =>
        ['posisiGudang', 'tanggalKeluar', 'tanggalKembali', 'penerimaKeluar', 'keperluanKeluar'].includes(d.field)
      );

      if (hasGudangChange) {
        kategori = 'GUDANG';
        if (updates.posisiGudang === 'DI_GUDANG' || updates.tanggalKembali) {
          judul = 'Kembali ke Gudang';
        } else if (updates.posisiGudang === 'DI_LUAR' || updates.tanggalKeluar) {
          judul = 'Keluar dari Gudang';
        } else {
          judul = 'Mutasi Gudang';
        }
      } else if (diffs.length === 1 && diffs[0].field === 'status') {
        kategori = 'STATUS';
        judul = `Status Diubah ke ${updates.status}`;
      }

      const desc = diffs.map((d) => `${d.fieldLabel}: ${d.oldValue} ➔ ${d.newValue}`).join(' | ');

      const historyEntry: DeviceHistoryEntry = {
        id: 'hist-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        timestamp: now,
        kategori,
        judul,
        deskripsi: desc,
        pic: updates.penerimaKeluar || pic,
        perubahan: diffs,
      };

      existingHistory = [historyEntry, ...existingHistory];
    }

    const updatedDevice: Device = {
      ...prevDevice,
      ...updates,
      riwayat: updates.riwayat || existingHistory,
      updatedAt: now,
    };

    current[index] = updatedDevice;
    this.saveDevices(current);
    return updatedDevice;
  }

  /**
   * Tambahkan entri riwayat manual (misalnya catatan teknisi, pemeliharaan, kalibrasi).
   */
  static addDeviceHistory(
    deviceId: string,
    entry: Omit<DeviceHistoryEntry, 'id' | 'timestamp'> & { timestamp?: string }
  ): Device {
    const current = this.getDevices();
    const index = current.findIndex((d) => d.id === deviceId);
    if (index === -1) throw new Error('Perangkat tidak ditemukan.');

    const now = entry.timestamp || new Date().toISOString();
    const newEntry: DeviceHistoryEntry = {
      ...entry,
      id: 'hist-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: now,
    };

    const prev = current[index];
    const updatedHistory = [newEntry, ...(prev.riwayat || [])];
    const updatedDevice: Device = {
      ...prev,
      riwayat: updatedHistory,
      updatedAt: now,
    };

    current[index] = updatedDevice;
    this.saveDevices(current);
    return updatedDevice;
  }

  /**
   * Duplicate device.
   */
  static duplicateDevice(id: string): Device {
    const current = this.getDevices();
    const src = current.find((d) => d.id === id);
    if (!src) throw new Error('Perangkat sumber tidak ditemukan.');

    let newSeri = `${src.seri}-COPY`;
    let count = 1;
    while (this.isSeriTaken(newSeri)) {
      newSeri = `${src.seri}-COPY-${count++}`;
    }

    const now = new Date().toISOString();
    const dupHistory: DeviceHistoryEntry = {
      id: 'hist-' + Date.now() + '-dup',
      timestamp: now,
      kategori: 'SISTEM',
      judul: 'Perangkat Diduplikasi',
      deskripsi: `Duplikasi dari perangkat sumber seri ${src.seri}.`,
      pic: 'Pengguna',
    };

    const duplicated: Device = {
      ...src,
      id: 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      seri: newSeri,
      status: 'Stok',
      catatan: src.catatan ? `${src.catatan} (Salinan)` : 'Salinan perangkat',
      riwayat: [dupHistory],
      createdAt: now,
      updatedAt: now,
    };

    this.saveDevices([duplicated, ...current]);
    return duplicated;
  }

  /**
   * Delete device.
   */
  static deleteDevice(id: string): void {
    const current = this.getDevices();
    this.saveDevices(current.filter((d) => d.id !== id));
  }

  /**
   * Bulk delete devices.
   */
  static bulkDeleteDevices(ids: string[]): number {
    const current = this.getDevices();
    const set = new Set(ids);
    const updated = current.filter((d) => !set.has(d.id));
    const count = current.length - updated.length;
    this.saveDevices(updated);
    return count;
  }

  /**
   * Reset to dummy devices.
   */
  static resetToDummy(): void {
    this.saveDevices(DUMMY_DEVICES);
  }

  /**
   * Clear all devices.
   */
  static clearAll(): void {
    this.saveDevices([]);
  }

  /**
   * Get storage usage stats in KB.
   */
  static getStorageStats(): { usedKb: number; maxKb: number; percentage: number; deviceCount: number } {
    let totalLength = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalLength += (localStorage.getItem(key) || '').length * 2;
        }
      }
    } catch {
      // ignore
    }
    const usedKb = Math.round((totalLength / 1024) * 100) / 100;
    const maxKb = 5120;
    const percentage = Math.min(100, Math.round((usedKb / maxKb) * 100));
    const devices = this.getDevices();

    return {
      usedKb,
      maxKb,
      percentage,
      deviceCount: devices.length,
    };
  }
}

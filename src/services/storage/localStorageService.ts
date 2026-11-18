import { Device, WarehousePosition } from '../../types/device';
import { DUMMY_DEVICES } from '../../data/dummyDevices';

const STORAGE_KEY = 'aqualink_devices_v4';

export class LocalStorageService {
  /**
   * Get all devices from localStorage.
   */
  static getDevices(): Device[] {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Cek migrasi dari v3 jika ada
        const olderRaw = localStorage.getItem('aqualink_devices_v3');
        if (olderRaw) {
          raw = olderRaw;
        } else {
          this.saveDevices(DUMMY_DEVICES);
          return DUMMY_DEVICES;
        }
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveDevices(DUMMY_DEVICES);
        return DUMMY_DEVICES;
      }

      // Pastikan seluruh device di lokasi P. Kelapa Dua terisi tanggal keluar 14 Juli 2026 dan PIC Enviro
      let needsSave = false;
      const updated = (parsed as Device[]).map((d) => {
        if ((d.lokasi || '').toLowerCase().includes('kelapa')) {
          if (d.tanggalKeluar !== '2026-07-14' || d.penerimaKeluar !== 'Enviro') {
            needsSave = true;
            return {
              ...d,
              tanggalKeluar: '2026-07-14',
              penerimaKeluar: 'Enviro',
              posisiGudang: (d.tanggalKembali ? 'DI_GUDANG' : 'DI_LUAR') as WarehousePosition,
              keperluanKeluar: d.keperluanKeluar || 'Instalasi Lapangan',
              riwayatGudang: d.riwayatGudang && d.riwayatGudang.length > 0 ? d.riwayatGudang : [
                {
                  id: 'mov-kd-' + d.seri,
                  tipe: 'KELUAR' as const,
                  tanggal: '2026-07-14',
                  lokasi: 'P. Kelapa Dua',
                  penerima: 'Enviro',
                  keperluan: 'Instalasi Lapangan',
                  catatan: 'Pengiriman dan instalasi unit di lokasi P. Kelapa Dua',
                  createdAt: '2026-07-14T08:00:00.000Z',
                },
              ],
            };
          }
        }
        return d;
      });

      if (needsSave || !localStorage.getItem(STORAGE_KEY)) {
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
    const newDevice: Device = {
      ...data,
      id: 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: now,
      updatedAt: now,
    };

    const current = this.getDevices();
    const updated = [newDevice, ...current];
    this.saveDevices(updated);
    return newDevice;
  }

  /**
   * Update device.
   */
  static updateDevice(id: string, updates: Partial<Omit<Device, 'id' | 'createdAt'>>): Device {
    const current = this.getDevices();
    const index = current.findIndex((d) => d.id === id);

    if (index === -1) {
      throw new Error('Perangkat tidak ditemukan.');
    }

    if (updates.seri && this.isSeriTaken(updates.seri, id)) {
      throw new Error(`Nomor Seri "${updates.seri}" sudah digunakan.`);
    }

    const updatedDevice: Device = {
      ...current[index],
      ...updates,
      updatedAt: new Date().toISOString(),
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
    const duplicated: Device = {
      ...src,
      id: 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      seri: newSeri,
      status: 'Stok',
      catatan: src.catatan ? `${src.catatan} (Salinan)` : 'Salinan perangkat',
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

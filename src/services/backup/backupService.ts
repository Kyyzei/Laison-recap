import { Device } from '../../types/device';
import { BackupData } from '../../types/common';
import { LocalStorageService } from '../storage/localStorageService';
import { SupabaseDeviceService } from '../supabase/supabaseDeviceService';

export class BackupService {
  static exportBackup(): void {
    const devices = LocalStorageService.getDevices();
    const backup: BackupData = {
      appName: 'Laison Recap',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      deviceCount: devices.length,
      devices,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laison_Backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async validateBackupFile(file: File): Promise<{
    isValid: boolean;
    data?: BackupData;
    error?: string;
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (!parsed || !Array.isArray(parsed.devices)) {
            return resolve({
              isValid: false,
              error: 'File cadangan tidak valid (daftar perangkat tidak ditemukan).',
            });
          }
          resolve({ isValid: true, data: parsed as BackupData });
        } catch {
          resolve({ isValid: false, error: 'Format berkas JSON rusak.' });
        }
      };
      reader.onerror = () => resolve({ isValid: false, error: 'Gagal membaca berkas.' });
      reader.readAsText(file);
    });
  }

  static restore(backup: BackupData, mode: 'overwrite' | 'merge' = 'overwrite'): {
    restoredCount: number;
    skippedCount: number;
  } {
    if (!backup.devices || !Array.isArray(backup.devices)) {
      throw new Error('Data cadangan tidak valid.');
    }

    if (mode === 'overwrite') {
      LocalStorageService.saveDevices(backup.devices);
      SupabaseDeviceService.upsertDevicesBatch(backup.devices);
      return { restoredCount: backup.devices.length, skippedCount: 0 };
    } else {
      const current = LocalStorageService.getDevices();
      const existingSeri = new Set(current.map((d) => d.seri.toLowerCase()));
      const toAdd: Device[] = [];
      let skipped = 0;

      for (const dev of backup.devices) {
        if (dev.seri && !existingSeri.has(dev.seri.toLowerCase())) {
          toAdd.push(dev);
          existingSeri.add(dev.seri.toLowerCase());
        } else {
          skipped++;
        }
      }

      const merged = [...current, ...toAdd];
      LocalStorageService.saveDevices(merged);
      SupabaseDeviceService.upsertDevicesBatch(merged);
      return { restoredCount: toAdd.length, skippedCount: skipped };
    }
  }
}

import { supabase } from './supabaseClient';
import { Device } from '../../types/device';

export interface DeviceRow {
  id: string;
  seri: string;
  model: string;
  koneksi: string;
  status: string;
  data: Device;
  updated_at?: string;
}

export class SupabaseDeviceService {
  /**
   * Fetch all devices from Supabase cloud database.
   */
  static async fetchAllDevices(): Promise<Device[] | null> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id, seri, model, koneksi, status, data')
        .order('seri', { ascending: true })
        .limit(2000);

      if (error) {
        console.warn('Supabase fetchAllDevices error:', error.message);
        return null;
      }

      if (!data) return [];

      return data.map((row: any) => {
        // Ensure row.data contains full fields, augmented with top-level columns
        const dev: Device = {
          ...row.data,
          id: row.id,
          seri: row.seri,
          model: row.model,
          koneksi: row.koneksi,
          status: row.status,
        };
        return dev;
      });
    } catch (err: any) {
      console.warn('Supabase fetchAllDevices exception:', err.message);
      return null;
    }
  }

  /**
   * Upsert a single device to Supabase cloud.
   */
  static async upsertDevice(device: Device): Promise<boolean> {
    try {
      const row: DeviceRow = {
        id: device.id,
        seri: device.seri,
        model: device.model || 'AquaLink',
        koneksi: device.koneksi || 'LoRaWAN',
        status: device.status || 'Stok',
        data: device,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('devices')
        .upsert(row, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase upsertDevice error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn('Supabase upsertDevice exception:', err.message);
      return false;
    }
  }

  /**
   * Batch upsert multiple devices (e.g. initial upload or Excel import).
   */
  static async upsertDevicesBatch(devices: Device[]): Promise<boolean> {
    try {
      if (devices.length === 0) return true;

      const rows: DeviceRow[] = devices.map((d) => ({
        id: d.id,
        seri: d.seri,
        model: d.model || 'AquaLink',
        koneksi: d.koneksi || 'LoRaWAN',
        status: d.status || 'Stok',
        data: d,
        updated_at: new Date().toISOString(),
      }));

      // Chunk in batches of 100
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('devices')
          .upsert(chunk, { onConflict: 'id' });

        if (error) {
          console.warn('Supabase batch upsert error on chunk:', error.message);
          return false;
        }
      }
      return true;
    } catch (err: any) {
      console.warn('Supabase upsertDevicesBatch exception:', err.message);
      return false;
    }
  }

  /**
   * Delete a device from Supabase cloud.
   */
  static async deleteDevice(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase deleteDevice error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn('Supabase deleteDevice exception:', err.message);
      return false;
    }
  }

  /**
   * Subscribe to real-time changes on the devices table.
   */
  static subscribeToChanges(
    onUpsert: (device: Device) => void,
    onDelete: (id: string) => void
  ) {
    const channel = supabase
      .channel('public:devices_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row: any = payload.new;
            if (row && row.data) {
              const dev: Device = {
                ...row.data,
                id: row.id,
                seri: row.seri,
                model: row.model,
                koneksi: row.koneksi,
                status: row.status,
              };
              onUpsert(dev);
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRow: any = payload.old;
            if (oldRow && oldRow.id) {
              onDelete(oldRow.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

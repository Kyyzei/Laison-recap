import * as XLSX from 'xlsx';
import { Device, getDeviceWarehouseStatus, getDeviceFullHistory } from '../../types/device';

export interface ExportOptions {
  filename?: string;
  format?: 'xlsx' | 'csv';
  sheetName?: string;
}

export class ExcelExportService {
  private static formatDevicesForExport(devices: Device[]) {
    return devices.map((d, index) => {
      const posisiGudang = getDeviceWarehouseStatus(d);
      return {
        NO: index + 1,
        MODEL: d.model || 'AquaLink',
        SERI: d.seri,
        KONEKSI: d.koneksi,
        'READ ADDRESS': d.readAddress,
        'DEVEUI / NOSIM': d.koneksi === 'LoRaWAN' ? d.devEui : d.noSim,
        'APPEUI / APN&BAND': d.koneksi === 'LoRaWAN' ? d.appEui : d.apnBand,
        DEVADDR: d.devAddr,
        APPKEY: d.appKey,
        IP: d.ip,
        STATUS: d.status,
        'POSISI GUDANG': posisiGudang === 'DI_GUDANG' ? 'Di Gudang' : 'Di Luar',
        'TGL KELUAR': d.tanggalKeluar || '',
        'TGL KEMBALI': d.tanggalKembali || '',
        'PIC / TEKNISI': d.penerimaKeluar || '',
        KEPERLUAN: d.keperluanKeluar || '',
        LOKASI: d.lokasi,
        CATATAN: d.catatan,
      };
    });
  }

  static exportDevices(devices: Device[], options?: ExportOptions): void {
    const format = options?.format || 'xlsx';
    const timestamp = new Date().toISOString().slice(0, 10);
    const defaultFilename = `Laison_Device_Recap_${timestamp}.${format}`;
    const filename = options?.filename ? `${options.filename}.${format}` : defaultFilename;
    const sheetName = options?.sheetName || 'Data Perangkat';

    const formattedData = this.formatDevicesForExport(devices);
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Column widths
    worksheet['!cols'] = [
      { wch: 6 },  // NO
      { wch: 16 }, // MODEL
      { wch: 14 }, // SERI
      { wch: 12 }, // KONEKSI
      { wch: 18 }, // READ ADDRESS
      { wch: 22 }, // DEVEUI / NOSIM
      { wch: 22 }, // APPEUI / APN&BAND
      { wch: 14 }, // DEVADDR
      { wch: 36 }, // APPKEY
      { wch: 16 }, // IP
      { wch: 14 }, // STATUS
      { wch: 16 }, // POSISI GUDANG
      { wch: 14 }, // TGL KELUAR
      { wch: 14 }, // TGL KEMBALI
      { wch: 20 }, // PIC / TEKNISI
      { wch: 24 }, // KEPERLUAN
      { wch: 20 }, // LOKASI
      { wch: 25 }, // CATATAN
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    if (format === 'csv') {
      XLSX.writeFile(workbook, filename, { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
    }
  }

  /**
   * Ekspor riwayat lengkap sebuah perangkat ke file Excel.
   */
  static exportDeviceHistory(device: Device): void {
    const history = getDeviceFullHistory(device);
    const formatted = history.map((h, idx) => ({
      NO: idx + 1,
      TANGGAL: new Date(h.timestamp).toLocaleDateString('id-ID'),
      WAKTU: new Date(h.timestamp).toLocaleTimeString('id-ID'),
      KATEGORI: h.kategori,
      AKTIVITAS: h.judul,
      'PIC / TEKNISI': h.pic || '-',
      DESKRIPSI: h.deskripsi || '-',
      'RINCIAN PERUBAHAN PARAMETER': h.perubahan && h.perubahan.length > 0
        ? h.perubahan.map((p) => `${p.fieldLabel}: ${p.oldValue} ➔ ${p.newValue}`).join('; ')
        : '-',
      LOKASI: h.metadata?.lokasi || '-',
      KEPERLUAN: h.metadata?.keperluan || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    worksheet['!cols'] = [
      { wch: 6 },  // NO
      { wch: 14 }, // TANGGAL
      { wch: 12 }, // WAKTU
      { wch: 14 }, // KATEGORI
      { wch: 24 }, // AKTIVITAS
      { wch: 18 }, // PIC / TEKNISI
      { wch: 40 }, // DESKRIPSI
      { wch: 45 }, // RINCIAN PERUBAHAN
      { wch: 20 }, // LOKASI
      { wch: 22 }, // KEPERLUAN
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Riwayat Seri ${device.seri}`);
    XLSX.writeFile(workbook, `Laison_Riwayat_${device.seri}.xlsx`, { bookType: 'xlsx' });
  }

  static downloadTemplate(format: 'xlsx' | 'csv' = 'xlsx'): void {
    const templateData = [
      {
        NO: 1,
        MODEL: 'AquaLink',
        SERI: '6604290016',
        KONEKSI: 'LoRaWAN',
        'READ ADDRESS': 'AF066604290016',
        'DEVEUI / NOSIM': '8CF9572000193D62',
        'APPEUI / APN&BAND': '8CF9572000000000',
        DEVADDR: '00193D62',
        APPKEY: '1AC1EF01E96CAF1BE0D329331A4FC2A8',
        IP: '',
        STATUS: 'Terpasang',
        'POSISI GUDANG': 'Di Luar',
        'TGL KELUAR': '2026-11-01',
        'TGL KEMBALI': '',
        'PIC / TEKNISI': 'Budi Santoso',
        KEPERLUAN: 'Instalasi Lapangan',
        LOKASI: 'P. Kelapa Dua',
        CATATAN: '',
      },
      {
        NO: 2,
        MODEL: 'Ultrasonic',
        SERI: '6604290051',
        KONEKSI: 'NB-IoT',
        'READ ADDRESS': 'EA066604290051',
        'DEVEUI / NOSIM': '0851-5378-4819',
        'APPEUI / APN&BAND': 'NBIOT,3,20,28,8',
        DEVADDR: '',
        APPKEY: '1AC1EF01E96CAF1BE0D329331A4FC2A8',
        IP: '147.93.81.149',
        STATUS: 'Stok',
        'POSISI GUDANG': 'Di Gudang',
        'TGL KELUAR': '',
        'TGL KEMBALI': '2026-11-10',
        'PIC / TEKNISI': 'Ahmad Fauzi',
        KEPERLUAN: 'Pengembalian Uji Lab',
        LOKASI: 'Gudang Utama',
        CATATAN: '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Device');

    const filename = `Laison_Template_Device.${format}`;
    if (format === 'csv') {
      XLSX.writeFile(workbook, filename, { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
    }
  }
}

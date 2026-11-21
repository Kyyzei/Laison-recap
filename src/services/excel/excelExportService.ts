import * as XLSX from 'xlsx';
import { Device, getDeviceWarehouseStatus, getDeviceFullHistory } from '../../types/device';
import { SimCard } from '../../types/simcard';

export interface ExportOptions {
  filename?: string;
  format?: 'xlsx' | 'csv';
  sheetName?: string;
}

export class ExcelExportService {
  /**
   * Mengurutkan perangkat secara rapi & alami:
   * 1. Prioritas Model: AquaLink -> Ultrasonic -> Hybrid -> MIU
   * 2. Di dalam setiap model, diurutkan berdasarkan Nomor Seri secara numerik/alfanumerik ascending
   */
  static sortDevices(devices: Device[]): Device[] {
    const modelOrder: Record<string, number> = {
      AquaLink: 1,
      Ultrasonic: 2,
      Hybrid: 3,
      'Smart Meter Hybrid': 3,
      MIU: 4,
    };

    return [...devices].sort((a, b) => {
      const orderA = a.model ? (modelOrder[a.model] || 99) : 1;
      const orderB = b.model ? (modelOrder[b.model] || 99) : 1;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.seri || '').localeCompare(String(b.seri || ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
  }

  /**
   * Lebar kolom standar untuk Sheet Rekap Semua Perangkat
   */
  private static readonly summaryCols = [
    { wch: 6 },  // NO
    { wch: 15 }, // KATEGORI MODEL
    { wch: 18 }, // NOMOR SERI
    { wch: 14 }, // TIPE KONEKSI
    { wch: 18 }, // PROVIDER SIM
    { wch: 18 }, // NO SIM
    { wch: 14 }, // STATUS
    { wch: 15 }, // POSISI GUDANG
    { wch: 22 }, // LOKASI
    { wch: 18 }, // READ ADDRESS
    { wch: 22 }, // DEVEUI
    { wch: 22 }, // APPEUI
    { wch: 14 }, // DEVADDR
    { wch: 36 }, // APPKEY
    { wch: 16 }, // IP SERVER
    { wch: 22 }, // APN & BAND
    { wch: 14 }, // TGL KELUAR
    { wch: 14 }, // TGL KEMBALI
    { wch: 20 }, // PIC / TEKNISI
    { wch: 24 }, // KEPERLUAN
    { wch: 30 }, // CATATAN
  ];

  /**
   * Lebar kolom khusus Sheet AquaLink
   */
  private static readonly aquaLinkCols = [
    { wch: 6 },  // NO
    { wch: 18 }, // NOMOR SERI
    { wch: 14 }, // TIPE KONEKSI
    { wch: 18 }, // READ ADDRESS
    { wch: 22 }, // DEVEUI / NO SIM
    { wch: 22 }, // APPEUI / APN&BAND
    { wch: 14 }, // DEVADDR
    { wch: 36 }, // APPKEY
    { wch: 16 }, // IP SERVER
    { wch: 14 }, // STATUS
    { wch: 15 }, // POSISI GUDANG
    { wch: 22 }, // LOKASI
    { wch: 14 }, // TGL KELUAR
    { wch: 14 }, // TGL KEMBALI
    { wch: 20 }, // PIC / TEKNISI
    { wch: 24 }, // KEPERLUAN
    { wch: 30 }, // CATATAN
  ];

  /**
   * Lebar kolom khusus Non-AquaLink (Ultrasonic, Hybrid, MIU)
   */
  private static readonly categoryCols = [
    { wch: 6 },  // NO
    { wch: 18 }, // NOMOR SERI
    { wch: 14 }, // TIPE KONEKSI
    { wch: 18 }, // PROVIDER SIM
    { wch: 18 }, // NO SIM
    { wch: 14 }, // STATUS
    { wch: 15 }, // POSISI GUDANG
    { wch: 22 }, // LOKASI
    { wch: 14 }, // TGL KELUAR
    { wch: 14 }, // TGL KEMBALI
    { wch: 20 }, // PIC / TEKNISI
    { wch: 24 }, // KEPERLUAN
    { wch: 30 }, // CATATAN
  ];

  /**
   * Format baris untuk Sheet Rekapitulasi Lengkap ("Semua Perangkat")
   */
  private static formatSummaryRow(d: Device, index: number) {
    const posisiGudang = getDeviceWarehouseStatus(d);
    const isAquaLink = !d.model || d.model === 'AquaLink';

    return {
      NO: index + 1,
      'KATEGORI MODEL': d.model || 'AquaLink',
      'NOMOR SERI': d.seri,
      'TIPE KONEKSI': d.koneksi,
      'PROVIDER SIM': d.operatorSim || (d.koneksi === 'LoRaWAN' ? '-' : ''),
      'NO SIM': d.noSim || (d.koneksi === 'LoRaWAN' ? '-' : ''),
      STATUS: d.status,
      'POSISI GUDANG': posisiGudang === 'DI_GUDANG' ? 'Di Gudang' : 'Di Luar',
      LOKASI: d.lokasi || '',
      'READ ADDRESS': isAquaLink ? d.readAddress || '' : '-',
      DEVEUI: isAquaLink && d.koneksi === 'LoRaWAN' ? d.devEui || '' : '-',
      APPEUI: isAquaLink && d.koneksi === 'LoRaWAN' ? d.appEui || '' : '-',
      DEVADDR: isAquaLink && d.koneksi === 'LoRaWAN' ? d.devAddr || '' : '-',
      APPKEY: isAquaLink ? d.appKey || '' : '-',
      'IP SERVER': isAquaLink && d.koneksi !== 'LoRaWAN' ? d.ip || '' : '-',
      'APN & BAND': isAquaLink && d.koneksi !== 'LoRaWAN' ? d.apnBand || '' : '-',
      'TGL KELUAR': d.tanggalKeluar || '',
      'TGL KEMBALI': d.tanggalKembali || '',
      'PIC / TEKNISI': d.penerimaKeluar || '',
      KEPERLUAN: d.keperluanKeluar || '',
      CATATAN: d.catatan || '',
    };
  }

  /**
   * Format baris khusus AquaLink (lengkap parameter teknis)
   */
  private static formatAquaLinkRow(d: Device, index: number) {
    const posisiGudang = getDeviceWarehouseStatus(d);
    return {
      NO: index + 1,
      'NOMOR SERI': d.seri,
      'TIPE KONEKSI': d.koneksi,
      'READ ADDRESS': d.readAddress || '',
      'DEVEUI / NO SIM': d.koneksi === 'LoRaWAN' ? d.devEui || '' : d.noSim || '',
      'APPEUI / APN&BAND': d.koneksi === 'LoRaWAN' ? d.appEui || '' : d.apnBand || '',
      DEVADDR: d.devAddr || '',
      APPKEY: d.appKey || '',
      'IP SERVER': d.ip || '',
      STATUS: d.status,
      'POSISI GUDANG': posisiGudang === 'DI_GUDANG' ? 'Di Gudang' : 'Di Luar',
      LOKASI: d.lokasi || '',
      'TGL KELUAR': d.tanggalKeluar || '',
      'TGL KEMBALI': d.tanggalKembali || '',
      'PIC / TEKNISI': d.penerimaKeluar || '',
      KEPERLUAN: d.keperluanKeluar || '',
      CATATAN: d.catatan || '',
    };
  }

  /**
   * Format baris khusus Non-AquaLink (Ultrasonic, Hybrid, MIU)
   * Hanya Seri, Komunikasi, dan SIM Card sesuai spesifikasi pengguna
   */
  private static formatCategoryRow(d: Device, index: number) {
    const posisiGudang = getDeviceWarehouseStatus(d);
    return {
      NO: index + 1,
      'NOMOR SERI': d.seri,
      'TIPE KONEKSI': d.koneksi,
      'PROVIDER SIM': d.operatorSim || (d.koneksi === 'LoRaWAN' ? '-' : ''),
      'NO SIM': d.noSim || (d.koneksi === 'LoRaWAN' ? '-' : ''),
      STATUS: d.status,
      'POSISI GUDANG': posisiGudang === 'DI_GUDANG' ? 'Di Gudang' : 'Di Luar',
      LOKASI: d.lokasi || '',
      'TGL KELUAR': d.tanggalKeluar || '',
      'TGL KEMBALI': d.tanggalKembali || '',
      'PIC / TEKNISI': d.penerimaKeluar || '',
      KEPERLUAN: d.keperluanKeluar || '',
      CATATAN: d.catatan || '',
    };
  }

  /**
   * Ekspor data perangkat ke file Excel multi-sheet yang rapi, berurutan, dan berkategori.
   */
  static exportDevices(devices: Device[], options?: ExportOptions): void {
    const format = options?.format || 'xlsx';
    const timestamp = new Date().toISOString().slice(0, 10);
    const sorted = this.sortDevices(devices);

    // Filter per kategori
    const aquaList = sorted.filter((d) => !d.model || d.model === 'AquaLink');
    const ultraList = sorted.filter((d) => d.model === 'Ultrasonic');
    const hybridList = sorted.filter((d) => d.model === 'Hybrid' || d.model === 'Smart Meter Hybrid');
    const miuList = sorted.filter((d) => d.model === 'MIU');

    const distinctModels = [aquaList, ultraList, hybridList, miuList].filter((l) => l.length > 0).length;

    const workbook = XLSX.utils.book_new();

    // Penamaan file yang rapi dan informatif
    let defaultName = `Laison_Rekap_Perangkat_${sorted.length}unit_${timestamp}`;
    if (distinctModels === 1) {
      if (aquaList.length > 0) defaultName = `Laison_AquaLink_${aquaList.length}unit_${timestamp}`;
      else if (ultraList.length > 0) defaultName = `Laison_Ultrasonic_${ultraList.length}unit_${timestamp}`;
      else if (hybridList.length > 0) defaultName = `Laison_Hybrid_${hybridList.length}unit_${timestamp}`;
      else if (miuList.length > 0) defaultName = `Laison_MIU_${miuList.length}unit_${timestamp}`;
    }
    const filename = options?.filename ? `${options.filename}.${format}` : `${defaultName}.${format}`;

    // JIKA TERDAPAT LEBIH DARI 1 KATEGORI: Buat Multi-Sheet Berkategori
    if (distinctModels > 1) {
      // Sheet 1: Rekap Semua Perangkat (diurutkan rapi per model lalu nomor seri)
      const summaryRows = sorted.map((d, idx) => this.formatSummaryRow(d, idx));
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary['!cols'] = this.summaryCols;
      XLSX.utils.book_append_sheet(workbook, wsSummary, 'Semua Perangkat');

      // Sheet 2: Kategori AquaLink
      if (aquaList.length > 0) {
        const rows = aquaList.map((d, idx) => this.formatAquaLinkRow(d, idx));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = this.aquaLinkCols;
        XLSX.utils.book_append_sheet(workbook, ws, 'AquaLink');
      }

      // Sheet 3: Kategori Ultrasonic
      if (ultraList.length > 0) {
        const rows = ultraList.map((d, idx) => this.formatCategoryRow(d, idx));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = this.categoryCols;
        XLSX.utils.book_append_sheet(workbook, ws, 'Ultrasonic');
      }

      // Sheet 4: Kategori Hybrid
      if (hybridList.length > 0) {
        const rows = hybridList.map((d, idx) => this.formatCategoryRow(d, idx));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = this.categoryCols;
        XLSX.utils.book_append_sheet(workbook, ws, 'Hybrid');
      }

      // Sheet 5: Kategori MIU
      if (miuList.length > 0) {
        const rows = miuList.map((d, idx) => this.formatCategoryRow(d, idx));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = this.categoryCols;
        XLSX.utils.book_append_sheet(workbook, ws, 'MIU');
      }
    } else {
      // JIKA HANYA 1 KATEGORI: Buat 1 Sheet Spesifik dengan Kolom Presisi
      let sheetName = options?.sheetName || 'Data Perangkat';
      let rows: any[] = [];
      let cols = this.summaryCols;

      if (aquaList.length > 0) {
        sheetName = 'AquaLink';
        rows = aquaList.map((d, idx) => this.formatAquaLinkRow(d, idx));
        cols = this.aquaLinkCols;
      } else if (ultraList.length > 0) {
        sheetName = 'Ultrasonic';
        rows = ultraList.map((d, idx) => this.formatCategoryRow(d, idx));
        cols = this.categoryCols;
      } else if (hybridList.length > 0) {
        sheetName = 'Hybrid';
        rows = hybridList.map((d, idx) => this.formatCategoryRow(d, idx));
        cols = this.categoryCols;
      } else if (miuList.length > 0) {
        sheetName = 'MIU';
        rows = miuList.map((d, idx) => this.formatCategoryRow(d, idx));
        cols = this.categoryCols;
      } else {
        rows = sorted.map((d, idx) => this.formatSummaryRow(d, idx));
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = cols;
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }

    if (format === 'csv') {
      XLSX.writeFile(workbook, filename, { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
    }
  }

  /**
   * Ekspor data stok SIM Card ke file Excel yang rapi, berurutan, dan berkategori.
   */
  static exportSimCards(simCards: SimCard[], options?: ExportOptions): void {
    const format = options?.format || 'xlsx';
    const timestamp = new Date().toISOString().slice(0, 10);
    const defaultFilename = `Laison_Stok_SIM_Card_${simCards.length}unit_${timestamp}.${format}`;
    const filename = options?.filename ? `${options.filename}.${format}` : defaultFilename;

    // Urutkan status: Online -> Offline -> Stock/Stok, lalu noSim ascending
    const statusPriority: Record<string, number> = {
      Online: 1,
      Offline: 2,
      Stock: 3,
      Stok: 3,
    };

    const sortedSimCards = [...simCards].sort((a, b) => {
      const pA = statusPriority[a.status] || 99;
      const pB = statusPriority[b.status] || 99;
      if (pA !== pB) return pA - pB;
      return String(a.noSim || '').localeCompare(String(b.noSim || ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });

    const formatSimRow = (s: SimCard, idx: number) => ({
      NO: idx + 1,
      'NOMOR SIM': s.noSim,
      ICCID: s.iccid || '',
      OPERATOR: s.operator,
      STATUS: s.status,
      'PERANGKAT TERHUBUNG': s.deviceSeri ? `${s.deviceModel || 'AquaLink'} (${s.deviceSeri})` : 'Belum Terpasang (Stok Gudang)',
      'MODEL PERANGKAT': s.deviceModel || '-',
      'NOMOR SERI PERANGKAT': s.deviceSeri || '-',
      'IP SERVER': s.ip || '-',
      'APN & BAND': s.apnBand || '-',
      'LOKASI PENEMPATAN': s.lokasi || '',
      'KUOTA BULANAN': s.kuota || '',
      'MASA AKTIF': s.masaAktif || '',
      'TGL PASANG': s.tanggalPasang || '-',
      CATATAN: s.catatan || '',
    });

    const simCols = [
      { wch: 6 },  // NO
      { wch: 18 }, // NOMOR SIM
      { wch: 24 }, // ICCID
      { wch: 18 }, // OPERATOR
      { wch: 14 }, // STATUS
      { wch: 30 }, // PERANGKAT TERHUBUNG
      { wch: 18 }, // MODEL PERANGKAT
      { wch: 22 }, // NOMOR SERI PERANGKAT
      { wch: 16 }, // IP SERVER
      { wch: 22 }, // APN & BAND
      { wch: 24 }, // LOKASI PENEMPATAN
      { wch: 16 }, // KUOTA BULANAN
      { wch: 14 }, // MASA AKTIF
      { wch: 14 }, // TGL PASANG
      { wch: 30 }, // CATATAN
    ];

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Semua SIM Card
    const allRows = sortedSimCards.map((s, idx) => formatSimRow(s, idx));
    const wsAll = XLSX.utils.json_to_sheet(allRows);
    wsAll['!cols'] = simCols;
    XLSX.utils.book_append_sheet(workbook, wsAll, 'Semua SIM Card');

    // Sheet 2: SIM Terpasang (Online & Offline)
    const terpasangList = sortedSimCards.filter((s) => s.status === 'Online' || s.status === 'Offline');
    if (terpasangList.length > 0) {
      const activeRows = terpasangList.map((s, idx) => formatSimRow(s, idx));
      const wsActive = XLSX.utils.json_to_sheet(activeRows);
      wsActive['!cols'] = simCols;
      XLSX.utils.book_append_sheet(workbook, wsActive, 'SIM Terpasang');
    }

    // Sheet 3: Stok SIM Gudang (Belum Terpasang)
    const stokList = sortedSimCards.filter((s) => s.status === 'Stock');
    if (stokList.length > 0) {
      const stockRows = stokList.map((s, idx) => formatSimRow(s, idx));
      const wsStock = XLSX.utils.json_to_sheet(stockRows);
      wsStock['!cols'] = simCols;
      XLSX.utils.book_append_sheet(workbook, wsStock, 'Stok Gudang');
    }

    if (format === 'csv') {
      XLSX.writeFile(workbook, filename, { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
    }
  }

  /**
   * Ekspor template kosong untuk import SIM Card baru.
   */
  static exportSimCardTemplate(format: 'xlsx' | 'csv' = 'xlsx'): void {
    const templateData = [
      {
        NO: 1,
        'NO SIM': '0851-5378-4850',
        ICCID: '89620100085153784850',
        OPERATOR: 'Telkomsel IoT',
        STATUS: 'Stock',
        'SERI PERANGKAT': '',
        'IP SERVER': '147.93.81.149',
        'APN & BAND': 'NBIOT,3,20,28,8',
        LOKASI: 'Gudang Utama Laison',
        KUOTA: '500 MB / Bulan',
        'MASA AKTIF': '2027-12-31',
        CATATAN: 'Stok baru cadangan',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template SIM Card');

    const filename = `Laison_Template_SIM_Card.${format}`;
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
      'RINCIAN PERUBAHAN PARAMETER':
        h.perubahan && h.perubahan.length > 0
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

  /**
   * Template unduh untuk import perangkat massal dengan sheet terpisah per kategori model.
   */
  static downloadTemplate(format: 'xlsx' | 'csv' = 'xlsx'): void {
    const workbook = XLSX.utils.book_new();

    // Template AquaLink
    const aquaTemplate = [
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
    ];

    // Template Ultrasonic / Hybrid / MIU
    const nonAquaTemplate = [
      {
        NO: 1,
        MODEL: 'Ultrasonic',
        SERI: '0120240708889',
        KONEKSI: 'LoRaWAN',
        'PROVIDER SIM': '',
        'NO SIM': '',
        STATUS: 'Stok',
        'POSISI GUDANG': 'Di Gudang',
        'TGL KELUAR': '',
        'TGL KEMBALI': '',
        'PIC / TEKNISI': '',
        KEPERLUAN: '',
        LOKASI: 'Gudang Utama Laison',
        CATATAN: '',
      },
      {
        NO: 2,
        MODEL: 'Hybrid',
        SERI: '6701240001',
        KONEKSI: 'NB-IoT',
        'PROVIDER SIM': 'Telkomsel IoT',
        'NO SIM': '0851-5378-4899',
        STATUS: 'Stok',
        'POSISI GUDANG': 'Di Gudang',
        'TGL KELUAR': '',
        'TGL KEMBALI': '',
        'PIC / TEKNISI': '',
        KEPERLUAN: '',
        LOKASI: 'Gudang Utama Laison',
        CATATAN: '',
      },
      {
        NO: 3,
        MODEL: 'MIU',
        SERI: '200103010091',
        KONEKSI: 'LoRaWAN',
        'PROVIDER SIM': '',
        'NO SIM': '',
        STATUS: 'Stok',
        'POSISI GUDANG': 'Di Gudang',
        'TGL KELUAR': '',
        'TGL KEMBALI': '',
        'PIC / TEKNISI': '',
        KEPERLUAN: '',
        LOKASI: 'Gudang Utama Laison',
        CATATAN: '',
      },
    ];

    const wsAqua = XLSX.utils.json_to_sheet(aquaTemplate);
    wsAqua['!cols'] = this.aquaLinkCols;
    XLSX.utils.book_append_sheet(workbook, wsAqua, 'Template AquaLink');

    const wsNonAqua = XLSX.utils.json_to_sheet(nonAquaTemplate);
    wsNonAqua['!cols'] = this.categoryCols;
    XLSX.utils.book_append_sheet(workbook, wsNonAqua, 'Template Non-AquaLink');

    const filename = `Laison_Template_Import_Perangkat.${format}`;
    if (format === 'csv') {
      XLSX.writeFile(workbook, filename, { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
    }
  }
}

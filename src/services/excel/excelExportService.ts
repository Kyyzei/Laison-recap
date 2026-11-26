import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { Device, getDeviceWarehouseStatus, getDeviceFullHistory, getDeviceModel } from '../../types/device';
import { SimCard } from '../../types/simcard';

export interface ExportOptions {
  filename?: string;
  format?: 'xlsx' | 'csv';
  sheetName?: string;
}

interface ColumnDef {
  key: string;
  header: string;
  minWidth: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  wrapText?: boolean;
  isMono?: boolean;
}

interface StylePreset {
  fill: string;
  text: string;
  bold?: boolean;
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

  private static getStatusStyle(status: string): StylePreset {
    const s = (status || '').toLowerCase();
    if (s === 'terpasang') return { fill: 'FFDBEAFE', text: 'FF1E40AF', bold: true };
    if (s === 'aktif' || s === 'online') return { fill: 'FFD1FAE5', text: 'FF065F46', bold: true };
    if (s === 'rusak' || s === 'offline') return { fill: 'FFFFE4E6', text: 'FFBE123C', bold: true };
    if (s === 'stok' || s === 'stock') return { fill: 'FFFEF3C7', text: 'FF92400E', bold: true };
    if (s === 'maintenance') return { fill: 'FFFFEDD5', text: 'FFC2410C', bold: true };
    if (s === 'dipinjamkan') return { fill: 'FFEDE9FE', text: 'FF5B21B6', bold: true };
    return { fill: 'FFF1F5F9', text: 'FF334155', bold: true };
  }

  private static getModelStyle(model: string): StylePreset {
    const m = (model || '').toLowerCase();
    if (m === 'aqualink') return { fill: 'FFE0F2FE', text: 'FF0369A1', bold: true };
    if (m === 'ultrasonic') return { fill: 'FFF3E8FF', text: 'FF6B21A8', bold: true };
    if (m.includes('hybrid')) return { fill: 'FFCFFAFE', text: 'FF0E7490', bold: true };
    if (m === 'miu') return { fill: 'FFD1FAE5', text: 'FF047857', bold: true };
    return { fill: 'FFF1F5F9', text: 'FF334155', bold: true };
  }

  private static getWarehouseStyle(posisi: string): StylePreset {
    if ((posisi || '').toLowerCase().includes('luar')) {
      return { fill: 'FFFEF3C7', text: 'FF92400E', bold: true };
    }
    return { fill: 'FFECFDF5', text: 'FF065F46', bold: false };
  }

  private static readonly thinSlateBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  private static readonly headerBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: 'FF0C2340' } },
    left: { style: 'thin', color: { argb: 'FF334155' } },
    bottom: { style: 'medium', color: { argb: 'FF0C2340' } },
    right: { style: 'thin', color: { argb: 'FF334155' } },
  };

  /**
   * Kolom untuk Sheet Rekap Semua Perangkat (prioritas keterbacaan: Identitas & Lokasi dulu, baru Parameter Teknis)
   */
  private static readonly summaryColDefs: ColumnDef[] = [
    { key: 'NO', header: 'NO', minWidth: 8, align: 'center' },
    { key: 'KATEGORI MODEL', header: 'MODEL', minWidth: 16, align: 'center' },
    { key: 'NOMOR SERI', header: 'NOMOR SERI', minWidth: 21, align: 'center', isMono: true },
    { key: 'TIPE KONEKSI', header: 'KONEKSI', minWidth: 15, align: 'center' },
    { key: 'STATUS', header: 'STATUS', minWidth: 16, align: 'center' },
    { key: 'POSISI GUDANG', header: 'POSISI GUDANG', minWidth: 17, align: 'center' },
    { key: 'LOKASI', header: 'LOKASI PENEMPATAN', minWidth: 25, align: 'left' },
    { key: 'PROVIDER SIM', header: 'PROVIDER SIM', minWidth: 18, align: 'left' },
    { key: 'NO SIM', header: 'NOMOR SIM CARD', minWidth: 20, align: 'center', isMono: true },
    { key: 'PIC / TEKNISI', header: 'PIC / TEKNISI', minWidth: 22, align: 'left' },
    { key: 'TGL KELUAR', header: 'TGL KELUAR', minWidth: 15, align: 'center' },
    { key: 'TGL KEMBALI', header: 'TGL KEMBALI', minWidth: 15, align: 'center' },
    { key: 'KEPERLUAN', header: 'KEPERLUAN', minWidth: 25, align: 'left', wrapText: true },
    { key: 'CATATAN', header: 'CATATAN', minWidth: 30, maxWidth: 46, align: 'left', wrapText: true },
    { key: 'READ ADDRESS', header: 'READ ADDRESS', minWidth: 20, align: 'center', isMono: true },
    { key: 'DEVEUI', header: 'DEVEUI', minWidth: 23, align: 'center', isMono: true },
    { key: 'APPEUI', header: 'APPEUI', minWidth: 23, align: 'center', isMono: true },
    { key: 'DEVADDR', header: 'DEVADDR', minWidth: 15, align: 'center', isMono: true },
    { key: 'APPKEY', header: 'APPKEY', minWidth: 38, align: 'center', isMono: true },
    { key: 'IP SERVER', header: 'IP SERVER', minWidth: 18, align: 'center', isMono: true },
    { key: 'APN & BAND', header: 'APN & BAND', minWidth: 22, align: 'center', isMono: true },
  ];

  private static readonly aquaLinkColDefs: ColumnDef[] = [
    { key: 'NO', header: 'NO', minWidth: 8, align: 'center' },
    { key: 'NOMOR SERI', header: 'NOMOR SERI', minWidth: 20, align: 'center', isMono: true },
    { key: 'TIPE KONEKSI', header: 'KONEKSI', minWidth: 15, align: 'center' },
    { key: 'STATUS', header: 'STATUS', minWidth: 16, align: 'center' },
    { key: 'POSISI GUDANG', header: 'POSISI GUDANG', minWidth: 17, align: 'center' },
    { key: 'LOKASI', header: 'LOKASI PENEMPATAN', minWidth: 25, align: 'left' },
    { key: 'READ ADDRESS', header: 'READ ADDRESS', minWidth: 20, align: 'center', isMono: true },
    { key: 'DEVEUI / NO SIM', header: 'DEVEUI / NO SIM', minWidth: 23, align: 'center', isMono: true },
    { key: 'APPEUI / APN&BAND', header: 'APPEUI / APN & BAND', minWidth: 24, align: 'center', isMono: true },
    { key: 'DEVADDR', header: 'DEVADDR', minWidth: 15, align: 'center', isMono: true },
    { key: 'APPKEY', header: 'APPKEY', minWidth: 38, align: 'center', isMono: true },
    { key: 'IP SERVER', header: 'IP SERVER', minWidth: 18, align: 'center', isMono: true },
    { key: 'TGL KELUAR', header: 'TGL KELUAR', minWidth: 15, align: 'center' },
    { key: 'TGL KEMBALI', header: 'TGL KEMBALI', minWidth: 15, align: 'center' },
    { key: 'PIC / TEKNISI', header: 'PIC / TEKNISI', minWidth: 22, align: 'left' },
    { key: 'KEPERLUAN', header: 'KEPERLUAN', minWidth: 25, align: 'left', wrapText: true },
    { key: 'CATATAN', header: 'CATATAN', minWidth: 30, maxWidth: 46, align: 'left', wrapText: true },
  ];

  private static readonly categoryColDefs: ColumnDef[] = [
    { key: 'NO', header: 'NO', minWidth: 8, align: 'center' },
    { key: 'NOMOR SERI', header: 'NOMOR SERI', minWidth: 21, align: 'center', isMono: true },
    { key: 'TIPE KONEKSI', header: 'KONEKSI', minWidth: 15, align: 'center' },
    { key: 'PROVIDER SIM', header: 'PROVIDER SIM', minWidth: 20, align: 'left' },
    { key: 'NO SIM', header: 'NOMOR SIM CARD', minWidth: 20, align: 'center', isMono: true },
    { key: 'STATUS', header: 'STATUS', minWidth: 16, align: 'center' },
    { key: 'POSISI GUDANG', header: 'POSISI GUDANG', minWidth: 17, align: 'center' },
    { key: 'LOKASI', header: 'LOKASI PENEMPATAN', minWidth: 26, align: 'left' },
    { key: 'TGL KELUAR', header: 'TGL KELUAR', minWidth: 15, align: 'center' },
    { key: 'TGL KEMBALI', header: 'TGL KEMBALI', minWidth: 15, align: 'center' },
    { key: 'PIC / TEKNISI', header: 'PIC / TEKNISI', minWidth: 22, align: 'left' },
    { key: 'KEPERLUAN', header: 'KEPERLUAN', minWidth: 25, align: 'left', wrapText: true },
    { key: 'CATATAN', header: 'CATATAN', minWidth: 32, maxWidth: 46, align: 'left', wrapText: true },
  ];

  /**
   * Format baris untuk Sheet Rekapitulasi Lengkap ("Semua Perangkat")
   */
  private static formatSummaryRow(d: Device, index: number): Record<string, any> {
    const posisiGudang = getDeviceWarehouseStatus(d);
    const model = getDeviceModel(d);
    const isAquaLink = model === 'AquaLink';

    return {
      NO: index + 1,
      'KATEGORI MODEL': model,
      'NOMOR SERI': d.seri,
      'TIPE KONEKSI': d.koneksi,
      STATUS: d.status,
      'POSISI GUDANG': posisiGudang === 'DI_GUDANG' ? 'Di Gudang' : 'Di Luar',
      LOKASI: d.lokasi || '-',
      'PROVIDER SIM': d.operatorSim || '-',
      'NO SIM': d.noSim || '-',
      'PIC / TEKNISI': d.penerimaKeluar || '-',
      'TGL KELUAR': d.tanggalKeluar || '-',
      'TGL KEMBALI': d.tanggalKembali || '-',
      KEPERLUAN: d.keperluanKeluar || '-',
      CATATAN: d.catatan || '-',
      'READ ADDRESS': isAquaLink ? d.readAddress || '-' : '-',
      DEVEUI: isAquaLink && d.koneksi === 'LoRaWAN' ? d.devEui || '-' : '-',
      APPEUI: isAquaLink && d.koneksi === 'LoRaWAN' ? d.appEui || '-' : '-',
      DEVADDR: isAquaLink && d.koneksi === 'LoRaWAN' ? d.devAddr || '-' : '-',
      APPKEY: isAquaLink ? d.appKey || '-' : '-',
      'IP SERVER': isAquaLink && d.koneksi !== 'LoRaWAN' ? d.ip || '-' : '-',
      'APN & BAND': isAquaLink && d.koneksi !== 'LoRaWAN' ? d.apnBand || '-' : '-',
    };
  }

  /**
   * Format baris khusus AquaLink (lengkap parameter teknis)
   */
  private static formatAquaLinkRow(d: Device, index: number): Record<string, any> {
    const posisiGudang = getDeviceWarehouseStatus(d);
    return {
      NO: index + 1,
      'NOMOR SERI': d.seri,
      'TIPE KONEKSI': d.koneksi,
      STATUS: d.status,
      'POSISI GUDANG': posisiGudang === 'DI_GUDANG' ? 'Di Gudang' : 'Di Luar',
      LOKASI: d.lokasi || '-',
      'READ ADDRESS': d.readAddress || '-',
      'DEVEUI / NO SIM': d.koneksi === 'LoRaWAN' ? d.devEui || '-' : d.noSim || '-',
      'APPEUI / APN&BAND': d.koneksi === 'LoRaWAN' ? d.appEui || '-' : d.apnBand || '-',
      DEVADDR: d.devAddr || '-',
      APPKEY: d.appKey || '-',
      'IP SERVER': d.ip || '-',
      'TGL KELUAR': d.tanggalKeluar || '-',
      'TGL KEMBALI': d.tanggalKembali || '-',
      'PIC / TEKNISI': d.penerimaKeluar || '-',
      KEPERLUAN: d.keperluanKeluar || '-',
      CATATAN: d.catatan || '-',
    };
  }

  /**
   * Format baris khusus Non-AquaLink (Ultrasonic, Hybrid, MIU)
   */
  private static formatCategoryRow(d: Device, index: number): Record<string, any> {
    const posisiGudang = getDeviceWarehouseStatus(d);
    return {
      NO: index + 1,
      'NOMOR SERI': d.seri,
      'TIPE KONEKSI': d.koneksi,
      'PROVIDER SIM': d.operatorSim || '-',
      'NO SIM': d.noSim || '-',
      STATUS: d.status,
      'POSISI GUDANG': posisiGudang === 'DI_GUDANG' ? 'Di Gudang' : 'Di Luar',
      LOKASI: d.lokasi || '-',
      'TGL KELUAR': d.tanggalKeluar || '-',
      'TGL KEMBALI': d.tanggalKembali || '-',
      'PIC / TEKNISI': d.penerimaKeluar || '-',
      KEPERLUAN: d.keperluanKeluar || '-',
      CATATAN: d.catatan || '-',
    };
  }

  /**
   * Helper untuk menulis buffer ExcelJS dan memicu unduhan di browser.
   */
  private static async triggerDownload(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  /**
   * Helper untuk membuat worksheet berdesain rapi, lega, berwarna, dan tidak berdempet.
   */
  private static buildStyledSheet(
    workbook: ExcelJS.Workbook,
    sheetName: string,
    title: string,
    subtitle: string,
    colDefs: ColumnDef[],
    rows: Array<Record<string, any>>,
    options?: {
      groupByModelSections?: boolean;
      freezeHeader?: boolean;
    }
  ): ExcelJS.Worksheet {
    const ws = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    const colCount = colDefs.length;
    const lastColLetter = this.getExcelColLetter(colCount);

    // 1. Title Banner (Row 1)
    const titleRow = ws.addRow([title]);
    titleRow.height = 38;
    ws.mergeCells(`A1:${lastColLetter}1`);
    const titleCell = titleRow.getCell(1);
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C2340' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    // 2. Subtitle / Info Strip (Row 2)
    const subRow = ws.addRow([subtitle]);
    subRow.height = 24;
    ws.mergeCells(`A2:${lastColLetter}2`);
    const subCell = subRow.getCell(1);
    subCell.font = { name: 'Calibri', size: 10, italic: false, color: { argb: 'FF1E3A8A' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    subCell.border = { bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } } };

    // 3. Breathing Spacer Row (Row 3)
    const spacerRow = ws.addRow([]);
    spacerRow.height = 14;

    // 4. Table Header Row (Row 4)
    const headerRowIndex = 4;
    const headerRow = ws.addRow(colDefs.map((c) => c.header));
    headerRow.height = 34;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = this.headerBorder;
    });

    // Track longest text width per column for generous auto-fit
    const maxLengths = colDefs.map((c) => Math.max(c.minWidth, c.header.length + 5));

    // Helper to append a data row cleanly
    const appendDataRow = (rowObj: Record<string, any>, zebraIdx: number) => {
      const values = colDefs.map((c) => rowObj[c.key] ?? '');
      const dataRow = ws.addRow(values);

      // Calculate generous row height if wrapping is needed
      let maxLines = 1;
      colDefs.forEach((col, cIdx) => {
        const valStr = String(values[cIdx] ?? '');
        const effectiveLen = valStr.length + 5;
        if (effectiveLen > maxLengths[cIdx]) {
          maxLengths[cIdx] = col.maxWidth ? Math.min(col.maxWidth, effectiveLen) : effectiveLen;
        }
        if (col.wrapText && valStr.length > (col.maxWidth || 35)) {
          const lines = Math.ceil(valStr.length / ((col.maxWidth || 35) - 4));
          if (lines > maxLines) maxLines = lines;
        }
      });

      dataRow.height = Math.max(25, 22 + (maxLines - 1) * 14);
      const isEven = zebraIdx % 2 === 1;
      const baseFill = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

      colDefs.forEach((col, cIdx) => {
        const cell = dataRow.getCell(cIdx + 1);
        const val = values[cIdx];
        const valStr = String(val ?? '').trim();

        cell.border = this.thinSlateBorder;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseFill } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: col.align || 'left',
          wrapText: Boolean(col.wrapText),
          indent: col.align === 'left' || !col.align ? 1 : 0,
        };

        const isPlaceholder = valStr === '-' || valStr === '';
        cell.font = {
          name: col.isMono ? 'Consolas' : 'Calibri',
          size: col.isMono ? 9.5 : 10,
          bold:
            col.key === 'NOMOR SERI' ||
            col.key === 'SERI' ||
            col.key === 'NOMOR SIM' ||
            col.key === 'NO SIM' ||
            col.key === 'NOMOR SERI PERANGKAT',
          color: { argb: isPlaceholder ? 'FF94A3B8' : 'FF0F172A' },
        };

        // Special color-coded styling for status, model, warehouse position
        if (col.key === 'STATUS' && valStr && valStr !== '-') {
          const st = this.getStatusStyle(valStr);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: st.fill } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: st.text } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (
          (col.key === 'KATEGORI MODEL' || col.key === 'MODEL PERANGKAT' || col.key === 'MODEL') &&
          valStr &&
          valStr !== '-'
        ) {
          const md = this.getModelStyle(valStr);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: md.fill } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: md.text } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (col.key === 'POSISI GUDANG' && valStr && valStr !== '-') {
          const wh = this.getWarehouseStyle(valStr);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: wh.fill } };
          cell.font = { name: 'Calibri', size: 10, bold: wh.bold, color: { argb: wh.text } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    };

    // 5. Populate Data Rows (with Optional Spacious Category Separators)
    if (options?.groupByModelSections) {
      const modelOrder = ['AquaLink', 'Ultrasonic', 'Hybrid', 'MIU'];
      const groups = new Map<string, Array<Record<string, any>>>();
      for (const m of modelOrder) groups.set(m, []);
      for (const r of rows) {
        const m = String(r['KATEGORI MODEL'] || 'AquaLink');
        if (!groups.has(m)) groups.set(m, []);
        groups.get(m)!.push(r);
      }

      let globalSectionIndex = 0;
      for (const [modelName, groupRows] of groups.entries()) {
        if (groupRows.length === 0) continue;

        // Add blank breathing row between categories (after first category)
        if (globalSectionIndex > 0) {
          const gapRow = ws.addRow([]);
          gapRow.height = 14;
        }
        globalSectionIndex++;

        // Add Category Section Divider Bar
        const sectionRow = ws.addRow([`▸ KATEGORI ${modelName.toUpperCase()} — ${groupRows.length} UNIT`]);
        sectionRow.height = 28;
        const secRowNum = sectionRow.number;
        ws.mergeCells(`A${secRowNum}:${lastColLetter}${secRowNum}`);
        const mdStyle = this.getModelStyle(modelName);
        const secCell = sectionRow.getCell(1);
        secCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: mdStyle.fill } };
        secCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: mdStyle.text } };
        secCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        secCell.border = {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
        };

        groupRows.forEach((rowObj, idx) => {
          appendDataRow(rowObj, idx);
        });
      }
    } else {
      rows.forEach((rowObj, idx) => {
        appendDataRow(rowObj, idx);
      });
    }

    // 6. Apply generous widths to columns
    colDefs.forEach((col, idx) => {
      const width = col.maxWidth ? Math.min(col.maxWidth, Math.max(col.minWidth, maxLengths[idx])) : Math.max(col.minWidth, maxLengths[idx]);
      ws.getColumn(idx + 1).width = width;
    });

    // 7. Freeze header pane & enable AutoFilter
    if (options?.freezeHeader !== false) {
      ws.views = [
        {
          state: 'frozen',
          xSplit: 0,
          ySplit: headerRowIndex,
          activeCell: `A${headerRowIndex + 1}`,
          showGridLines: true,
        },
      ];
    }

    if (rows.length > 0 && !options?.groupByModelSections) {
      ws.autoFilter = {
        from: { row: headerRowIndex, column: 1 },
        to: { row: headerRowIndex + rows.length, column: colCount },
      };
    }

    return ws;
  }

  /**
   * Membangun Sheet Ringkasan & Statistik Eksekutif (enak dilihat di satu halaman).
   */
  private static buildSummaryDashboardSheet(
    workbook: ExcelJS.Workbook,
    devices: Device[],
    timestamp: string
  ): void {
    const ws = workbook.addWorksheet('Ringkasan Inventaris', {
      views: [{ showGridLines: true }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
    });

    const titleRow = ws.addRow(['LAISON RECAP — RINGKASAN STATISTIK INVENTARIS PERANGKAT IOT']);
    titleRow.height = 38;
    ws.mergeCells('A1:G1');
    const titleCell = titleRow.getCell(1);
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C2340' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    const subRow = ws.addRow([`Tanggal Laporan: ${timestamp}   |   Total Seluruh Perangkat: ${devices.length} Unit`]);
    subRow.height = 24;
    ws.mergeCells('A2:G2');
    const subCell = subRow.getCell(1);
    subCell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF1E3A8A' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    ws.addRow([]).height = 16;

    const total = devices.length || 1;
    // Helper to write a clean card table at any starting row & starting column (1 = A, 5 = E)
    const writePanelTable = (
      startRow: number,
      startCol: number,
      heading: string,
      colA: string,
      colB: string,
      items: Array<[string, number]>
    ): number => {
      const cEnd = startCol + 2;
      const startL = this.getExcelColLetter(startCol);
      const endL = this.getExcelColLetter(cEnd);

      const hRow = ws.getRow(startRow);
      hRow.height = 28;
      ws.mergeCells(`${startL}${startRow}:${endL}${startRow}`);
      const hc = hRow.getCell(startCol);
      hc.value = heading;
      hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      hc.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      hc.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      const colHRow = ws.getRow(startRow + 1);
      colHRow.height = 25;
      [colA, colB, 'PERSENTASE'].forEach((label, offset) => {
        const cell = colHRow.getCell(startCol + offset);
        cell.value = label;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = this.thinSlateBorder;
      });

      items.forEach(([label, count], idx) => {
        const rIdx = startRow + 2 + idx;
        const row = ws.getRow(rIdx);
        row.height = Math.max(row.height || 0, 24);
        const pct = `${((count / total) * 100).toFixed(1)}%`;
        const fill = idx % 2 === 1 ? 'FFF8FAFC' : 'FFFFFFFF';

        const c1 = row.getCell(startCol);
        const c2 = row.getCell(startCol + 1);
        const c3 = row.getCell(startCol + 2);
        c1.value = label;
        c2.value = count;
        c3.value = pct;

        c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        c2.alignment = { vertical: 'middle', horizontal: 'center' };
        c3.alignment = { vertical: 'middle', horizontal: 'center' };

        [c1, c2, c3].forEach((c, offset) => {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
          c.font = { name: 'Calibri', size: 10, bold: offset === 1, color: { argb: 'FF0F172A' } };
          c.border = this.thinSlateBorder;
        });
      });

      return startRow + 2 + items.length;
    };

    // Tally breakdowns
    const modelCounts: Record<string, number> = { AquaLink: 0, Ultrasonic: 0, Hybrid: 0, MIU: 0 };
    const statusCounts: Record<string, number> = {};
    const lokasiCounts: Record<string, number> = {};
    const koneksiCounts: Record<string, number> = {};
    let diGudang = 0;
    let diLuar = 0;

    for (const d of devices) {
      const m = getDeviceModel(d);
      modelCounts[m] = (modelCounts[m] || 0) + 1;
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
      koneksiCounts[d.koneksi] = (koneksiCounts[d.koneksi] || 0) + 1;
      const loc = d.lokasi?.trim() || 'Tanpa Lokasi / Gudang Stok';
      lokasiCounts[loc] = (lokasiCounts[loc] || 0) + 1;
      if (getDeviceWarehouseStatus(d) === 'DI_LUAR') diLuar++;
      else diGudang++;
    }

    // Left Panel (Columns A-C)
    let leftCursor = 4;
    leftCursor = writePanelTable(leftCursor, 1, '1. REKAP BERDASARKAN KATEGORI MODEL', 'KATEGORI MODEL', 'JUMLAH (UNIT)', [
      ['AquaLink', modelCounts.AquaLink || 0],
      ['Ultrasonic', modelCounts.Ultrasonic || 0],
      ['Hybrid', modelCounts.Hybrid || 0],
      ['MIU (Meter Interface Unit)', modelCounts.MIU || 0],
    ]);
    ws.getRow(leftCursor).height = 14;
    leftCursor += 1;

    leftCursor = writePanelTable(
      leftCursor,
      1,
      '2. REKAP BERDASARKAN STATUS PERANGKAT',
      'STATUS PERANGKAT',
      'JUMLAH (UNIT)',
      Object.entries(statusCounts).sort((a, b) => b[1] - a[1])
    );
    ws.getRow(leftCursor).height = 14;
    leftCursor += 1;

    writePanelTable(leftCursor, 1, '3. REKAP POSISI GUDANG & KONEKSI', 'KATEGORI', 'JUMLAH (UNIT)', [
      ['Berada di Gudang (DI_GUDANG)', diGudang],
      ['Sedang di Luar Gudang (DI_LUAR)', diLuar],
      ...Object.entries(koneksiCounts).map(([k, v]): [string, number] => [`Koneksi ${k}`, v]),
    ]);

    // Right Panel (Columns E-G, separated by blank Column D)
    writePanelTable(
      4,
      5,
      '4. DISTRIBUSI PERANGKAT PER LOKASI PENEMPATAN',
      'LOKASI',
      'JUMLAH (UNIT)',
      Object.entries(lokasiCounts).sort((a, b) => b[1] - a[1])
    );

    ws.getColumn(1).width = 36;
    ws.getColumn(2).width = 18;
    ws.getColumn(3).width = 16;
    ws.getColumn(4).width = 6; // Gutter spasi pemisah antara panel kiri & kanan
    ws.getColumn(5).width = 36;
    ws.getColumn(6).width = 18;
    ws.getColumn(7).width = 16;
  }

  private static getExcelColLetter(colNum: number): string {
    let temp = colNum;
    let letter = '';
    while (temp > 0) {
      const rem = (temp - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      temp = Math.floor((temp - 1) / 26);
    }
    return letter;
  }

  /**
   * Ekspor data perangkat ke file Excel multi-sheet yang rapi, lega, tidak berdempet, berurutan, dan berkategori.
   */
  static async exportDevices(devices: Device[], options?: ExportOptions): Promise<void> {
    const format = options?.format || 'xlsx';
    const timestamp = new Date().toISOString().slice(0, 10);
    const sorted = this.sortDevices(devices);

    const aquaList = sorted.filter((d) => !d.model || d.model === 'AquaLink');
    const ultraList = sorted.filter((d) => d.model === 'Ultrasonic');
    const hybridList = sorted.filter((d) => d.model === 'Hybrid' || d.model === 'Smart Meter Hybrid');
    const miuList = sorted.filter((d) => d.model === 'MIU');

    const distinctModels = [aquaList, ultraList, hybridList, miuList].filter((l) => l.length > 0).length;

    let defaultName = `Laison_Rekap_Perangkat_${sorted.length}unit_${timestamp}`;
    if (distinctModels === 1) {
      if (aquaList.length > 0) defaultName = `Laison_AquaLink_${aquaList.length}unit_${timestamp}`;
      else if (ultraList.length > 0) defaultName = `Laison_Ultrasonic_${ultraList.length}unit_${timestamp}`;
      else if (hybridList.length > 0) defaultName = `Laison_Hybrid_${hybridList.length}unit_${timestamp}`;
      else if (miuList.length > 0) defaultName = `Laison_MIU_${miuList.length}unit_${timestamp}`;
    }
    const filename = options?.filename ? `${options.filename}.${format}` : `${defaultName}.${format}`;

    // Fallback CSV via SheetJS agar tetap 100% kompatibel untuk format .csv
    if (format === 'csv') {
      const csvRows = sorted.map((d, idx) => this.formatSummaryRow(d, idx));
      const wsCsv = XLSX.utils.json_to_sheet(csvRows);
      const wbCsv = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbCsv, wsCsv, 'Data Perangkat');
      XLSX.writeFile(wbCsv, filename, { bookType: 'csv' });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Laison Recap System';
    workbook.created = new Date();

    if (distinctModels > 1) {
      // Sheet 1: Semua Perangkat (dengan sekat pemisah visual rapi antar kategori model!)
      const summaryRows = sorted.map((d, idx) => this.formatSummaryRow(d, idx));
      this.buildStyledSheet(
        workbook,
        'Semua Perangkat',
        `LAISON RECAP — REKAP INVENTARIS SEMUA PERANGKAT IOT (${sorted.length} UNIT)`,
        `Tanggal Ekspor: ${timestamp}   |   AquaLink: ${aquaList.length} unit   •   Ultrasonic: ${ultraList.length} unit   •   Hybrid: ${hybridList.length} unit   •   MIU: ${miuList.length} unit`,
        this.summaryColDefs,
        summaryRows,
        { groupByModelSections: true, freezeHeader: true }
      );

      // Sheet 2: AquaLink
      if (aquaList.length > 0) {
        const rows = aquaList.map((d, idx) => this.formatAquaLinkRow(d, idx));
        this.buildStyledSheet(
          workbook,
          'AquaLink',
          `DATA PERANGKAT AQUALINK (${aquaList.length} UNIT)`,
          `Tanggal Ekspor: ${timestamp}   |   Parameter Lengkap LoRaWAN & NB-IoT   |   Terurut Berdasarkan Nomor Seri`,
          this.aquaLinkColDefs,
          rows
        );
      }

      // Sheet 3: Ultrasonic
      if (ultraList.length > 0) {
        const rows = ultraList.map((d, idx) => this.formatCategoryRow(d, idx));
        this.buildStyledSheet(
          workbook,
          'Ultrasonic',
          `DATA PERANGKAT ULTRASONIC FLOW METER (${ultraList.length} UNIT)`,
          `Tanggal Ekspor: ${timestamp}   |   Komunikasi & SIM Card   |   Terurut Berdasarkan Nomor Seri`,
          this.categoryColDefs,
          rows
        );
      }

      // Sheet 4: Hybrid
      if (hybridList.length > 0) {
        const rows = hybridList.map((d, idx) => this.formatCategoryRow(d, idx));
        this.buildStyledSheet(
          workbook,
          'Hybrid',
          `DATA PERANGKAT SMART METER HYBRID (${hybridList.length} UNIT)`,
          `Tanggal Ekspor: ${timestamp}   |   Komunikasi & SIM Card   |   Terurut Berdasarkan Nomor Seri`,
          this.categoryColDefs,
          rows
        );
      }

      // Sheet 5: MIU
      if (miuList.length > 0) {
        const rows = miuList.map((d, idx) => this.formatCategoryRow(d, idx));
        this.buildStyledSheet(
          workbook,
          'MIU',
          `DATA PERANGKAT METER INTERFACE UNIT / MIU (${miuList.length} UNIT)`,
          `Tanggal Ekspor: ${timestamp}   |   Komunikasi & SIM Card   |   Terurut Berdasarkan Nomor Seri`,
          this.categoryColDefs,
          rows
        );
      }

      // Sheet 6: Ringkasan Eksekutif
      this.buildSummaryDashboardSheet(workbook, sorted, timestamp);
    } else {
      // Hanya 1 kategori
      let sheetName = options?.sheetName || 'Data Perangkat';
      let rows: Array<Record<string, any>> = [];
      let colDefs = this.summaryColDefs;
      let subtitle = `Tanggal Ekspor: ${timestamp}   |   Total: ${sorted.length} Unit`;

      if (aquaList.length > 0) {
        sheetName = 'AquaLink';
        rows = aquaList.map((d, idx) => this.formatAquaLinkRow(d, idx));
        colDefs = this.aquaLinkColDefs;
        subtitle = `Tanggal Ekspor: ${timestamp}   |   Model AquaLink (${aquaList.length} Unit)`;
      } else if (ultraList.length > 0) {
        sheetName = 'Ultrasonic';
        rows = ultraList.map((d, idx) => this.formatCategoryRow(d, idx));
        colDefs = this.categoryColDefs;
        subtitle = `Tanggal Ekspor: ${timestamp}   |   Model Ultrasonic (${ultraList.length} Unit)`;
      } else if (hybridList.length > 0) {
        sheetName = 'Hybrid';
        rows = hybridList.map((d, idx) => this.formatCategoryRow(d, idx));
        colDefs = this.categoryColDefs;
        subtitle = `Tanggal Ekspor: ${timestamp}   |   Model Hybrid (${hybridList.length} Unit)`;
      } else if (miuList.length > 0) {
        sheetName = 'MIU';
        rows = miuList.map((d, idx) => this.formatCategoryRow(d, idx));
        colDefs = this.categoryColDefs;
        subtitle = `Tanggal Ekspor: ${timestamp}   |   Model MIU (${miuList.length} Unit)`;
      } else {
        rows = sorted.map((d, idx) => this.formatSummaryRow(d, idx));
      }

      this.buildStyledSheet(
        workbook,
        sheetName,
        `LAISON RECAP — DATA ${sheetName.toUpperCase()} (${sorted.length} UNIT)`,
        subtitle,
        colDefs,
        rows
      );
    }

    await this.triggerDownload(workbook, filename);
  }

  /**
   * Ekspor data stok SIM Card ke file Excel yang rapi, lega, berurutan, dan berkategori.
   */
  static async exportSimCards(simCards: SimCard[], options?: ExportOptions): Promise<void> {
    const format = options?.format || 'xlsx';
    const timestamp = new Date().toISOString().slice(0, 10);
    const defaultFilename = `Laison_Stok_SIM_Card_${simCards.length}unit_${timestamp}.${format}`;
    const filename = options?.filename ? `${options.filename}.${format}` : defaultFilename;

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
      ICCID: s.iccid || '-',
      OPERATOR: s.operator || '-',
      STATUS: s.status,
      'MODEL PERANGKAT': s.deviceModel || '-',
      'NOMOR SERI PERANGKAT': s.deviceSeri || '-',
      'LOKASI PENEMPATAN': s.lokasi || '-',
      'IP SERVER': s.ip || '-',
      'APN & BAND': s.apnBand || '-',
      'KUOTA BULANAN': s.kuota || '-',
      'MASA AKTIF': s.masaAktif || '-',
      'TGL PASANG': s.tanggalPasang || '-',
      CATATAN: s.catatan || '-',
    });

    if (format === 'csv') {
      const csvRows = sortedSimCards.map((s, idx) => formatSimRow(s, idx));
      const ws = XLSX.utils.json_to_sheet(csvRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Semua SIM Card');
      XLSX.writeFile(wb, filename, { bookType: 'csv' });
      return;
    }

    const simColDefs: ColumnDef[] = [
      { key: 'NO', header: 'NO', minWidth: 8, align: 'center' },
      { key: 'NOMOR SIM', header: 'NOMOR SIM', minWidth: 20, align: 'center', isMono: true },
      { key: 'ICCID', header: 'ICCID', minWidth: 26, align: 'center', isMono: true },
      { key: 'OPERATOR', header: 'OPERATOR', minWidth: 20, align: 'left' },
      { key: 'STATUS', header: 'STATUS', minWidth: 15, align: 'center' },
      { key: 'MODEL PERANGKAT', header: 'MODEL PERANGKAT', minWidth: 18, align: 'center' },
      { key: 'NOMOR SERI PERANGKAT', header: 'SERI PERANGKAT', minWidth: 22, align: 'center', isMono: true },
      { key: 'LOKASI PENEMPATAN', header: 'LOKASI PENEMPATAN', minWidth: 25, align: 'left' },
      { key: 'IP SERVER', header: 'IP SERVER', minWidth: 18, align: 'center', isMono: true },
      { key: 'APN & BAND', header: 'APN & BAND', minWidth: 24, align: 'center', isMono: true },
      { key: 'KUOTA BULANAN', header: 'KUOTA BULANAN', minWidth: 18, align: 'center' },
      { key: 'MASA AKTIF', header: 'MASA AKTIF', minWidth: 16, align: 'center' },
      { key: 'TGL PASANG', header: 'TGL PASANG', minWidth: 16, align: 'center' },
      { key: 'CATATAN', header: 'CATATAN', minWidth: 30, maxWidth: 46, align: 'left', wrapText: true },
    ];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Laison Recap System';
    workbook.created = new Date();

    const terpasangList = sortedSimCards.filter((s) => s.status === 'Online' || s.status === 'Offline');
    const stokList = sortedSimCards.filter((s) => s.status === 'Stock');

    this.buildStyledSheet(
      workbook,
      'Semua SIM Card',
      `LAISON RECAP — INVENTARIS KARTU SIM IOT (${sortedSimCards.length} KARTU)`,
      `Tanggal Ekspor: ${timestamp}   |   Terpasang: ${terpasangList.length} Kartu   •   Stok Gudang: ${stokList.length} Kartu`,
      simColDefs,
      sortedSimCards.map((s, idx) => formatSimRow(s, idx))
    );

    if (terpasangList.length > 0) {
      this.buildStyledSheet(
        workbook,
        'SIM Terpasang',
        `DAFTAR SIM CARD TERPASANG DI PERANGKAT (${terpasangList.length} KARTU)`,
        `Tanggal Ekspor: ${timestamp}   |   Status Online & Offline`,
        simColDefs,
        terpasangList.map((s, idx) => formatSimRow(s, idx))
      );
    }

    if (stokList.length > 0) {
      this.buildStyledSheet(
        workbook,
        'Stok Gudang',
        `STOK KARTU SIM CADANGAN GUDANG (${stokList.length} KARTU)`,
        `Tanggal Ekspor: ${timestamp}   |   Siap Pasang / Cadangan Teknisi`,
        simColDefs,
        stokList.map((s, idx) => formatSimRow(s, idx))
      );
    }

    await this.triggerDownload(workbook, filename);
  }

  /**
   * Ekspor template kosong untuk import SIM Card baru.
   */
  static async exportSimCardTemplate(format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
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

    const filename = `Laison_Template_SIM_Card.${format}`;
    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template SIM Card');
      XLSX.writeFile(wb, filename, { bookType: 'csv' });
      return;
    }

    const colDefs: ColumnDef[] = [
      { key: 'NO', header: 'NO', minWidth: 8, align: 'center' },
      { key: 'NO SIM', header: 'NO SIM', minWidth: 20, align: 'center', isMono: true },
      { key: 'ICCID', header: 'ICCID', minWidth: 25, align: 'center', isMono: true },
      { key: 'OPERATOR', header: 'OPERATOR', minWidth: 20, align: 'left' },
      { key: 'STATUS', header: 'STATUS', minWidth: 15, align: 'center' },
      { key: 'SERI PERANGKAT', header: 'SERI PERANGKAT', minWidth: 20, align: 'center', isMono: true },
      { key: 'IP SERVER', header: 'IP SERVER', minWidth: 18, align: 'center', isMono: true },
      { key: 'APN & BAND', header: 'APN & BAND', minWidth: 22, align: 'center', isMono: true },
      { key: 'LOKASI', header: 'LOKASI', minWidth: 24, align: 'left' },
      { key: 'KUOTA', header: 'KUOTA', minWidth: 18, align: 'center' },
      { key: 'MASA AKTIF', header: 'MASA AKTIF', minWidth: 16, align: 'center' },
      { key: 'CATATAN', header: 'CATATAN', minWidth: 28, align: 'left', wrapText: true },
    ];

    const workbook = new ExcelJS.Workbook();
    this.buildStyledSheet(
      workbook,
      'Template SIM Card',
      'LAISON RECAP — TEMPLATE IMPORT SIM CARD BARU',
      'Panduan: Isi data mulai baris ke-5. Jangan ubah nama kolom header berwarna biru.',
      colDefs,
      templateData
    );

    await this.triggerDownload(workbook, filename);
  }

  /**
   * Ekspor riwayat lengkap sebuah perangkat ke file Excel.
   */
  static async exportDeviceHistory(device: Device): Promise<void> {
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
          ? h.perubahan.map((p) => `${p.fieldLabel}: ${p.oldValue} -> ${p.newValue}`).join('; ')
          : '-',
      LOKASI: h.metadata?.lokasi || '-',
      KEPERLUAN: h.metadata?.keperluan || '-',
    }));

    const colDefs: ColumnDef[] = [
      { key: 'NO', header: 'NO', minWidth: 8, align: 'center' },
      { key: 'TANGGAL', header: 'TANGGAL', minWidth: 15, align: 'center' },
      { key: 'WAKTU', header: 'WAKTU', minWidth: 14, align: 'center' },
      { key: 'KATEGORI', header: 'KATEGORI', minWidth: 15, align: 'center' },
      { key: 'AKTIVITAS', header: 'AKTIVITAS', minWidth: 26, align: 'left' },
      { key: 'PIC / TEKNISI', header: 'PIC / TEKNISI', minWidth: 20, align: 'left' },
      { key: 'DESKRIPSI', header: 'DESKRIPSI', minWidth: 40, maxWidth: 50, align: 'left', wrapText: true },
      { key: 'RINCIAN PERUBAHAN PARAMETER', header: 'RINCIAN PERUBAHAN', minWidth: 42, maxWidth: 55, align: 'left', wrapText: true },
      { key: 'LOKASI', header: 'LOKASI', minWidth: 22, align: 'left' },
      { key: 'KEPERLUAN', header: 'KEPERLUAN', minWidth: 24, align: 'left', wrapText: true },
    ];

    const workbook = new ExcelJS.Workbook();
    this.buildStyledSheet(
      workbook,
      `Riwayat Seri ${device.seri}`.slice(0, 31),
      `LOG RIWAYAT PERANGKAT SERI ${device.seri} (${device.model || 'AquaLink'})`,
      `Koneksi: ${device.koneksi}   |   Status Terkini: ${device.status}   |   Lokasi: ${device.lokasi || 'Gudang / Belum Ditentukan'}`,
      colDefs,
      formatted
    );

    await this.triggerDownload(workbook, `Laison_Riwayat_${device.seri}.xlsx`);
  }

  /**
   * Template unduh untuk import perangkat massal dengan sheet terpisah per kategori model.
   */
  static async downloadTemplate(format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
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

    const filename = `Laison_Template_Import_Perangkat.${format}`;
    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(aquaTemplate);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template AquaLink');
      XLSX.writeFile(wb, filename, { bookType: 'csv' });
      return;
    }

    const aquaTplCols: ColumnDef[] = [
      { key: 'NO', header: 'NO', minWidth: 8, align: 'center' },
      { key: 'MODEL', header: 'MODEL', minWidth: 15, align: 'center' },
      { key: 'SERI', header: 'SERI', minWidth: 20, align: 'center', isMono: true },
      { key: 'KONEKSI', header: 'KONEKSI', minWidth: 15, align: 'center' },
      { key: 'READ ADDRESS', header: 'READ ADDRESS', minWidth: 20, align: 'center', isMono: true },
      { key: 'DEVEUI / NOSIM', header: 'DEVEUI / NOSIM', minWidth: 23, align: 'center', isMono: true },
      { key: 'APPEUI / APN&BAND', header: 'APPEUI / APN&BAND', minWidth: 23, align: 'center', isMono: true },
      { key: 'DEVADDR', header: 'DEVADDR', minWidth: 15, align: 'center', isMono: true },
      { key: 'APPKEY', header: 'APPKEY', minWidth: 38, align: 'center', isMono: true },
      { key: 'IP', header: 'IP', minWidth: 18, align: 'center', isMono: true },
      { key: 'STATUS', header: 'STATUS', minWidth: 16, align: 'center' },
      { key: 'POSISI GUDANG', header: 'POSISI GUDANG', minWidth: 17, align: 'center' },
      { key: 'TGL KELUAR', header: 'TGL KELUAR', minWidth: 15, align: 'center' },
      { key: 'TGL KEMBALI', header: 'TGL KEMBALI', minWidth: 15, align: 'center' },
      { key: 'PIC / TEKNISI', header: 'PIC / TEKNISI', minWidth: 20, align: 'left' },
      { key: 'KEPERLUAN', header: 'KEPERLUAN', minWidth: 24, align: 'left', wrapText: true },
      { key: 'LOKASI', header: 'LOKASI', minWidth: 24, align: 'left' },
      { key: 'CATATAN', header: 'CATATAN', minWidth: 28, align: 'left', wrapText: true },
    ];

    const nonAquaTplCols: ColumnDef[] = [
      { key: 'NO', header: 'NO', minWidth: 8, align: 'center' },
      { key: 'MODEL', header: 'MODEL', minWidth: 16, align: 'center' },
      { key: 'SERI', header: 'SERI', minWidth: 20, align: 'center', isMono: true },
      { key: 'KONEKSI', header: 'KONEKSI', minWidth: 15, align: 'center' },
      { key: 'PROVIDER SIM', header: 'PROVIDER SIM', minWidth: 20, align: 'left' },
      { key: 'NO SIM', header: 'NO SIM', minWidth: 20, align: 'center', isMono: true },
      { key: 'STATUS', header: 'STATUS', minWidth: 16, align: 'center' },
      { key: 'POSISI GUDANG', header: 'POSISI GUDANG', minWidth: 17, align: 'center' },
      { key: 'TGL KELUAR', header: 'TGL KELUAR', minWidth: 15, align: 'center' },
      { key: 'TGL KEMBALI', header: 'TGL KEMBALI', minWidth: 15, align: 'center' },
      { key: 'PIC / TEKNISI', header: 'PIC / TEKNISI', minWidth: 20, align: 'left' },
      { key: 'KEPERLUAN', header: 'KEPERLUAN', minWidth: 24, align: 'left', wrapText: true },
      { key: 'LOKASI', header: 'LOKASI', minWidth: 24, align: 'left' },
      { key: 'CATATAN', header: 'CATATAN', minWidth: 28, align: 'left', wrapText: true },
    ];

    const workbook = new ExcelJS.Workbook();
    this.buildStyledSheet(
      workbook,
      'Template AquaLink',
      'TEMPLATE IMPORT PERANGKAT AQUALINK',
      'Panduan: Isi data mulai baris ke-5. Pastikan kolom SERI dan KONEKSI terisi benar.',
      aquaTplCols,
      aquaTemplate
    );

    this.buildStyledSheet(
      workbook,
      'Template Non-AquaLink',
      'TEMPLATE IMPORT PERANGKAT ULTRASONIC / HYBRID / MIU',
      'Panduan: Isi kolom MODEL dengan Ultrasonic, Hybrid, atau MIU.',
      nonAquaTplCols,
      nonAquaTemplate
    );

    await this.triggerDownload(workbook, filename);
  }
}

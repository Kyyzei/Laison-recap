import * as XLSX from 'xlsx';
import { Device, DeviceStatus, ConnectionType, DeviceModel } from '../../types/device';
import { ImportPreviewItem, ImportSummary } from '../../types/common';
import { LocalStorageService } from '../storage/localStorageService';
import { SupabaseDeviceService } from '../supabase/supabaseDeviceService';

export class ExcelImportService {
  private static normalizeKey(header: string): string {
    const clean = header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (['no', 'nomor'].includes(clean)) return 'no';
    if (['model', 'modeldevice', 'kategori', 'kategoriperangkat', 'kategorimodel', 'device'].includes(clean)) return 'model';
    if (['seri', 'serial', 'serialnumber', 'noseri', 'nomorseri'].includes(clean)) return 'seri';
    if (['koneksi', 'connection', 'tipe', 'tipekoneksi'].includes(clean)) return 'koneksi';
    if (['readaddress', 'readaddr', 'address'].includes(clean)) return 'readAddress';
    if (['deveui', 'deveuiimei', 'deveuinosim'].includes(clean)) return 'devEuiOrSim';
    if (['nosim', 'sim', 'simcard', 'nomorsim', 'nomorsimcard'].includes(clean)) return 'noSim';
    if (['operatorsim', 'providersim', 'provider', 'operator', 'providersimcard'].includes(clean)) return 'operatorSim';
    if (['appeui', 'appeuiapnband', 'apnband', 'apn'].includes(clean)) return 'appEuiOrApn';
    if (['devaddr'].includes(clean)) return 'devAddr';
    if (['appkey'].includes(clean)) return 'appKey';
    if (['ip', 'ip1ip2', 'serverip', 'ipserver'].includes(clean)) return 'ip';
    if (['status'].includes(clean)) return 'status';
    if (['lokasi', 'location', 'lokasipenempatan'].includes(clean)) return 'lokasi';
    if (['catatan', 'notes', 'keterangan'].includes(clean)) return 'catatan';
    if (['tglkeluar', 'tanggalkeluar', 'outdate'].includes(clean)) return 'tanggalKeluar';
    if (['tglkembali', 'tanggalkembali', 'indate', 'returndate'].includes(clean)) return 'tanggalKembali';
    if (['posisigudang', 'posisi', 'statusgudang'].includes(clean)) return 'posisiGudang';
    if (['pic', 'teknisi', 'picpembawa', 'penerima', 'picteknisi'].includes(clean)) return 'penerimaKeluar';
    if (['keperluan', 'alasan', 'purpose'].includes(clean)) return 'keperluanKeluar';
    return clean;
  }

  private static cleanCellValue(val: any): string {
    const s = typeof val === 'string' ? val.trim() : String(val ?? '').trim();
    return s === '-' ? '' : s;
  }

  static async parseFile(file: File): Promise<ImportSummary> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          const workbook = XLSX.read(buffer, { type: 'binary' });

          const firstSheet = workbook.SheetNames[0];
          if (!firstSheet) throw new Error('File tidak memiliki sheet data.');

          const worksheet = workbook.Sheets[firstSheet];
          const aoa: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          // Auto-detect header row (mendukung file hasil export dengan judul banner di baris atas)
          let headerRowIdx = 0;
          for (let r = 0; r < Math.min(aoa.length, 20); r++) {
            const normHeaders = (aoa[r] || []).map((cell) => this.normalizeKey(String(cell || '')));
            if (normHeaders.includes('seri') && (normHeaders.includes('koneksi') || normHeaders.includes('status') || normHeaders.includes('model'))) {
              headerRowIdx = r;
              break;
            }
          }

          const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
            range: headerRowIdx,
            defval: '',
          });

          if (!rawRows || rawRows.length === 0) {
            throw new Error('File Excel / CSV kosong.');
          }

          const existingDevices = LocalStorageService.getDevices();
          const existingSeri = new Set(existingDevices.map((d) => d.seri.trim().toLowerCase()));
          const seenInFile = new Set<string>();
          const items: ImportPreviewItem[] = [];

          rawRows.forEach((row, idx) => {
            const mapped: Record<string, any> = {};
            for (const [key, val] of Object.entries(row)) {
              const normKey = this.normalizeKey(key);
              mapped[normKey] = this.cleanCellValue(val);
            }

            // Lewati baris kosong atau baris pemisah kategori (misal: "▸ KATEGORI AQUALINK...")
            const firstColRaw = String(Object.values(row)[0] || '').trim();
            if (firstColRaw.startsWith('▸') || (!mapped.seri && !mapped.koneksi && !mapped.status && !mapped.model)) {
              return;
            }

            const rowNumber = headerRowIdx + idx + 2;
            const errors: string[] = [];
            const warnings: string[] = [];

            const seri = String(mapped.seri || '').trim();
            if (!seri) {
              errors.push('Nomor Seri (SERI) wajib diisi.');
            }

            const cleanSeri = seri.toLowerCase();
            let isDuplicateSerial = false;

            if (seri) {
              if (existingSeri.has(cleanSeri)) {
                isDuplicateSerial = true;
                warnings.push(`Nomor Seri "${seri}" sudah ada di database.`);
              }
              if (seenInFile.has(cleanSeri)) {
                isDuplicateSerial = true;
                errors.push(`Nomor Seri "${seri}" duplikat di file ini.`);
              } else {
                seenInFile.add(cleanSeri);
              }
            }

            // Model normalization
            const rawModel = String(mapped.model || '').toLowerCase();
            let model: DeviceModel = 'AquaLink';
            if (rawModel.includes('ultra')) {
              model = 'Ultrasonic';
            } else if (rawModel.includes('hybrid')) {
              model = 'Hybrid';
            } else if (rawModel.includes('miu') || rawModel.includes('interface')) {
              model = 'MIU';
            }

            // Koneksi normalization
            const rawKoneksi = String(mapped.koneksi || '').toUpperCase();
            let koneksi: ConnectionType = 'LoRaWAN';
            if (rawKoneksi.includes('GPRS')) {
              koneksi = 'GPRS';
            } else if (rawKoneksi.includes('CAT') || rawKoneksi.includes('CAT1') || rawKoneksi.includes('CAT 1')) {
              koneksi = 'Cat 1';
            } else if (rawKoneksi.includes('NB')) {
              koneksi = 'NB-IoT';
            } else if (rawKoneksi.includes('LORA')) {
              koneksi = 'LoRaWAN';
            }

            // Status normalization
            let statusVal = String(mapped.status || 'Stok').trim();
            let matchedStatus: DeviceStatus = 'Stok';
            if (statusVal.toLowerCase().includes('rusak')) {
              matchedStatus = 'Rusak';
            } else if (statusVal.toLowerCase().includes('pasang') || statusVal.toLowerCase().includes('terpasang')) {
              matchedStatus = 'Terpasang';
            } else if (statusVal.toLowerCase().includes('aktif')) {
              matchedStatus = 'Aktif';
            } else if (statusVal.toLowerCase().includes('maint')) {
              matchedStatus = 'Maintenance';
            } else if (statusVal.toLowerCase().includes('pinjam')) {
              matchedStatus = 'Dipinjamkan';
            } else if (mapped.lokasi) {
              matchedStatus = 'Terpasang';
            }

            // Posisi gudang normalization
            const rawPosisi = String(mapped.posisiGudang || '').toLowerCase();
            let posisiGudang: 'DI_GUDANG' | 'DI_LUAR' | undefined;
            if (rawPosisi.includes('luar')) {
              posisiGudang = 'DI_LUAR';
            } else if (rawPosisi.includes('gudang')) {
              posisiGudang = 'DI_GUDANG';
            } else if (mapped.tanggalKeluar && !mapped.tanggalKembali) {
              posisiGudang = 'DI_LUAR';
            } else if (mapped.tanggalKembali || matchedStatus === 'Stok') {
              posisiGudang = 'DI_GUDANG';
            }

            let itemStatus: 'valid' | 'duplicate' | 'invalid' = 'valid';
            if (errors.length > 0) itemStatus = 'invalid';
            else if (isDuplicateSerial) itemStatus = 'duplicate';

            const isAquaLink = model === 'AquaLink';
            const isCellular = koneksi !== 'LoRaWAN';

            items.push({
              rowNumber,
              data: {
                model,
                seri,
                koneksi,
                operatorSim: isCellular ? (mapped.operatorSim || '') : '',
                readAddress: isAquaLink ? (mapped.readAddress || '') : '',
                devEui: (isAquaLink && koneksi === 'LoRaWAN') ? (mapped.devEuiOrSim || '') : '',
                appEui: (isAquaLink && koneksi === 'LoRaWAN') ? (mapped.appEuiOrApn || '') : '',
                devAddr: isAquaLink ? (mapped.devAddr || '') : '',
                noSim: isCellular ? (mapped.noSim || mapped.devEuiOrSim || '') : '',
                apnBand: (isAquaLink && isCellular) ? (mapped.appEuiOrApn || (koneksi === 'GPRS' ? 'INTERNET,GPRS' : koneksi === 'Cat 1' ? 'INTERNET,CAT1,BAND3' : 'NBIOT,3,20,28,8')) : '',
                ip: (isAquaLink && isCellular) ? (mapped.ip || '147.93.81.149') : '',
                appKey: isAquaLink ? (mapped.appKey || '1AC1EF01E96CAF1BE0D329331A4FC2A8') : '',
                status: matchedStatus,
                lokasi: mapped.lokasi || '',
                catatan: mapped.catatan || '',
                tanggalKeluar: mapped.tanggalKeluar || '',
                tanggalKembali: mapped.tanggalKembali || '',
                posisiGudang,
                penerimaKeluar: mapped.penerimaKeluar || '',
                keperluanKeluar: mapped.keperluanKeluar || '',
              },
              errors,
              warnings,
              isDuplicateSerial,
              status: itemStatus,
            });
          });

          resolve({
            totalRows: items.length,
            validRows: items.filter((i) => i.status === 'valid').length,
            duplicateRows: items.filter((i) => i.status === 'duplicate').length,
            invalidRows: items.filter((i) => i.status === 'invalid').length,
            items,
          });
        } catch (err: any) {
          reject(new Error(err.message || 'Gagal membaca berkas Excel.'));
        }
      };

      reader.onerror = () => reject(new Error('Gagal membuka file.'));
      reader.readAsBinaryString(file);
    });
  }

  static applyImport(
    items: ImportPreviewItem[],
    strategy: 'skip' | 'overwrite' = 'skip'
  ): { imported: number; updated: number; skipped: number } {
    const current = LocalStorageService.getDevices();
    const map = new Map<string, Device>(current.map((d) => [d.seri.toLowerCase(), d]));

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const now = new Date().toISOString();

    for (const item of items) {
      if (item.status === 'invalid') {
        skipped++;
        continue;
      }

      const d = item.data;
      const cleanSeri = String(d.seri).trim().toLowerCase();
      const existing = map.get(cleanSeri);

      if (existing) {
        if (strategy === 'overwrite') {
          map.set(cleanSeri, {
            ...existing,
            ...d,
            updatedAt: now,
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        const newDev: Device = {
          id: 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          model: d.model || 'AquaLink',
          seri: d.seri,
          koneksi: d.koneksi || 'LoRaWAN',
          readAddress: d.readAddress || '',
          devEui: d.devEui || '',
          appEui: d.appEui || '',
          devAddr: d.devAddr || '',
          noSim: d.noSim || '',
          apnBand: d.apnBand || '',
          ip: d.ip || '',
          appKey: d.appKey || '',
          status: d.status || 'Stok',
          lokasi: d.lokasi || '',
          catatan: d.catatan || '',
          tanggalKeluar: d.tanggalKeluar || '',
          tanggalKembali: d.tanggalKembali || '',
          posisiGudang: d.posisiGudang,
          penerimaKeluar: d.penerimaKeluar || '',
          keperluanKeluar: d.keperluanKeluar || '',
          createdAt: now,
          updatedAt: now,
        };
        map.set(cleanSeri, newDev);
        imported++;
      }
    }

    const allUpdated = Array.from(map.values());
    LocalStorageService.saveDevices(allUpdated);
    SupabaseDeviceService.upsertDevicesBatch(allUpdated);
    return { imported, updated, skipped };
  }
}

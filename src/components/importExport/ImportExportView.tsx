import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';
import { useToast } from '../../context/ToastContext';
import { ExcelImportService } from '../../services/excel/excelImportService';
import { ExcelExportService } from '../../services/excel/excelExportService';
import { ImportSummary } from '../../types/common';
import { StatusBadge } from '../common/StatusBadge';

export const ImportExportView: React.FC = () => {
  const { devices, filteredDevices, refreshDevices } = useDevices();
  const { success, error, warning } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import State
  const [isParsing, setIsParsing] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [importStrategy, setImportStrategy] = useState<'skip' | 'overwrite'>('skip');
  const [isApplying, setIsApplying] = useState(false);

  // Export State
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [customFilename, setCustomFilename] = useState('');

  // Handle file select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsParsing(true);
    setImportSummary(null);

    try {
      const summary = await ExcelImportService.parseFile(file);
      setImportSummary(summary);
      success('File Berhasil Dibaca', `${summary.totalRows} baris data ditemukan dalam ${file.name}.`);
    } catch (err: any) {
      error('Gagal Membaca File', err.message || 'Format file tidak didukung.');
    } finally {
      setIsParsing(false);
    }
  };

  // Apply import to database
  const handleApplyImport = () => {
    if (!importSummary) return;

    setIsApplying(true);
    try {
      const result = ExcelImportService.applyImport(importSummary.items, importStrategy);
      refreshDevices();
      success(
        'Import Selesai',
        `Berhasil menambah ${result.imported} perangkat baru, memperbarui ${result.updated} perangkat, dan melewati ${result.skipped} perangkat.`
      );
      // Reset import state
      setImportSummary(null);
      setUploadedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      error('Gagal Menerapkan Import', err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsApplying(false);
    }
  };

  // Reset import preview
  const handleCancelImport = () => {
    setImportSummary(null);
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Export
  const handleExecuteExport = () => {
    const targetData = exportScope === 'all' ? devices : filteredDevices;

    if (targetData.length === 0) {
      warning('Data Kosong', 'Tidak ada perangkat untuk diexport.');
      return;
    }

    const filename = customFilename.trim() || undefined;
    ExcelExportService.exportDevices(targetData, {
      filename,
      format: exportFormat,
    });
    success(
      'Export Berhasil',
      `${targetData.length} perangkat berhasil diunduh dalam format .${exportFormat}.`
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Import & Export Spreadsheet
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Olah data inventaris perangkat menggunakan berkas Microsoft Excel (.xlsx) atau CSV (.csv)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: IMPORT SPREADSHEET */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Import Data Excel / CSV</h2>
                <p className="text-xs text-slate-500">Unggah berkas untuk memasukkan perangkat massal</p>
              </div>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-2xl p-6 text-center bg-slate-50/60 hover:bg-blue-50/30 transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 text-slate-500 group-hover:text-blue-600 flex items-center justify-center mx-auto mb-3 transition-colors">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {uploadedFileName || 'Pilih atau Tarik Berkas ke Sini'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Mendukung format Microsoft Excel (<span className="font-semibold text-slate-700">.xlsx</span>, .xls) dan{' '}
                <span className="font-semibold text-slate-700">.csv</span>
              </p>
            </div>

            {isParsing && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-blue-900 font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                <span>Membaca dan memverifikasi baris data spreadsheet...</span>
              </div>
            )}

            {/* Template Download Prompt */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">Format Template Baku</span>
                <p className="text-slate-500">Gunakan format kolom resmi agar tidak ada data yang terlewat</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => ExcelExportService.downloadTemplate('xlsx')}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-slate-700 text-xs transition-colors cursor-pointer"
                >
                  Template .XLSX
                </button>
                <button
                  onClick={() => ExcelExportService.downloadTemplate('csv')}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-slate-700 text-xs transition-colors cursor-pointer"
                >
                  Template .CSV
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400">
            * Kolom wajib: <strong>Device ID</strong>, <strong>Nama Device</strong>, dan{' '}
            <strong>Serial Number</strong>. Kolom lainnya opsional dan dapat disesuaikan.
          </div>
        </div>

        {/* SECTION 2: EXPORT SPREADSHEET */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Export Data Rekap</h2>
                <p className="text-xs text-slate-500">Unduh data perangkat ke berkas Excel atau CSV</p>
              </div>
            </div>

            {/* Scope selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Cakupan Data yang Diexport
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setExportScope('all')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    exportScope === 'all'
                      ? 'border-blue-900 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Seluruh Data</span>
                    <span className="text-xs font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full">
                      {devices.length} Unit
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Export seluruh inventaris tanpa terkecuali
                  </p>
                </div>

                <div
                  onClick={() => setExportScope('filtered')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    exportScope === 'filtered'
                      ? 'border-blue-900 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Hasil Filter</span>
                    <span className="text-xs font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full">
                      {filteredDevices.length} Unit
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sesuai pencarian atau filter yang aktif
                  </p>
                </div>
              </div>
            </div>

            {/* Format selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Format Berkas
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="xlsx"
                    checked={exportFormat === 'xlsx'}
                    onChange={() => setExportFormat('xlsx')}
                    className="accent-blue-900"
                  />
                  <span>Microsoft Excel (.xlsx)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="accent-blue-900"
                  />
                  <span>Comma Separated Values (.csv)</span>
                </label>
              </div>
            </div>

            {/* Custom Filename */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nama File (Opsional)</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder="Laison_Device_Recap_Terbaru"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="ml-2 text-xs font-mono font-bold text-slate-400">
                  .{exportFormat}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleExecuteExport}
            className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas Rekap ({(exportScope === 'all' ? devices : filteredDevices).length} Unit)</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: IMPORT PREVIEW & DUPLICATE RESOLUTION */}
      {importSummary && (
        <div className="p-6 bg-white rounded-2xl border border-blue-200 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Pratinjau Data Import: {uploadedFileName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tinjau kelayakan data dan tentukan perlakuan untuk data duplikat sebelum dimasukkan ke database.
              </p>
            </div>

            {/* Quick Summary Pill Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                Total: {importSummary.totalRows}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Valid Baru: {importSummary.validRows}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                Duplikat: {importSummary.duplicateRows}
              </span>
              {importSummary.invalidRows > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800">
                  Tidak Valid: {importSummary.invalidRows}
                </span>
              )}
            </div>
          </div>

          {/* Duplicate Strategy Option */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Strategi Penanganan Data Duplikat
              </span>
              <p className="text-[11px] text-slate-500">
                Tentukan aksi jika ditemukan Device ID atau Serial Number yang telah ada di database
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="importStrategy"
                  value="skip"
                  checked={importStrategy === 'skip'}
                  onChange={() => setImportStrategy('skip')}
                  className="accent-blue-900"
                />
                <span>Lewati Duplikat (Skip)</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="importStrategy"
                  value="overwrite"
                  checked={importStrategy === 'overwrite'}
                  onChange={() => setImportStrategy('overwrite')}
                  className="accent-blue-900"
                />
                <span>Perbarui / Timpa Data yang Ada</span>
              </label>
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 shadow-xs">
                <tr>
                  <th className="py-2.5 px-3 w-14">Baris</th>
                  <th className="py-2.5 px-3">SERI</th>
                  <th className="py-2.5 px-3">KONEKSI</th>
                  <th className="py-2.5 px-3">READ ADDRESS</th>
                  <th className="py-2.5 px-3">LOKASI</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">Validasi</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importSummary.items.map((item) => {
                  let badge = (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  );

                  if (item.status === 'duplicate') {
                    badge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertTriangle className="w-3 h-3" /> Duplikat
                      </span>
                    );
                  } else if (item.status === 'invalid') {
                    badge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <XCircle className="w-3 h-3" /> Tidak Valid
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={item.rowNumber}
                      className={
                        item.status === 'invalid'
                          ? 'bg-rose-50/30'
                          : item.status === 'duplicate'
                          ? 'bg-amber-50/30'
                          : 'bg-white'
                      }
                    >
                      <td className="py-2 px-3 font-mono text-slate-400">#{item.rowNumber}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-900">
                        {item.data.seri || <span className="text-rose-500 font-bold">(Kosong)</span>}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-700">
                        {item.data.koneksi || 'LoRaWAN'}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {item.data.readAddress || '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{item.data.lokasi || '-'}</td>
                      <td className="py-2 px-3">
                        <StatusBadge status={item.data.status} size="sm" />
                      </td>
                      <td className="py-2 px-3">{badge}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {item.errors.length > 0 ? (
                          <span className="text-rose-600 font-medium">{item.errors.join(', ')}</span>
                        ) : item.warnings.length > 0 ? (
                          <span className="text-amber-700">{item.warnings.join(', ')}</span>
                        ) : (
                          <span className="text-slate-400">Siap diimport</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action commit buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleCancelImport}
              disabled={isApplying}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batalkan Import
            </button>
            <button
              onClick={handleApplyImport}
              disabled={isApplying || importSummary.validRows + importSummary.duplicateRows === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-950/20 transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>
                {isApplying
                  ? 'Sedang Memproses...'
                  : `Proses & Simpan ke Database (${
                      importStrategy === 'overwrite'
                        ? importSummary.validRows + importSummary.duplicateRows
                        : importSummary.validRows
                    } Baris)`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


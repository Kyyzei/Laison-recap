import React from 'react';
import { Device, SortField, getDeviceWarehouseStatus, getDeviceModel } from '../../types/device';
import { StatusBadge } from '../common/StatusBadge';
import { ModelIcon } from '../common/ModelIcon';
import { useDevices } from '../../context/DeviceContext';
import {
  ArrowUpDown,
  Eye,
  Edit2,
  Copy,
  Trash2,
  LogOut,
  LogIn,
  History,
  CardSim,
} from 'lucide-react';

interface DeviceTableProps {
  devices: Device[];
  onOpenDetail: (device: Device, tab?: 'info' | 'history') => void;
  onOpenEdit: (device: Device) => void;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (device: Device) => void;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
  onOpenDetail,
  onOpenEdit,
  onDuplicate,
  onDeleteRequest,
}) => {
  const {
    setSort,
    selectedDeviceIds,
    toggleSelectDevice,
    toggleSelectAll,
    currentPage,
    rowsPerPage,
    openWarehouseModal,
    filters,
  } = useDevices();

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const isAllSelected =
    devices.length > 0 && selectedDeviceIds.length === devices.length;

  const isNonAquaLinkTab =
    filters.model === 'Ultrasonic' ||
    filters.model === 'Hybrid' ||
    filters.model === 'Smart Meter Hybrid' ||
    filters.model === 'MIU';

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider select-none">
          <tr>
            <th className="py-3 px-3 w-10 text-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="rounded border-slate-300 text-blue-900 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            <th className="py-3 px-2 w-12 text-center text-slate-400">NO</th>
            <th
              onClick={() => handleSort('seri')}
              className="py-3 px-3 cursor-pointer hover:text-blue-900 font-bold"
            >
              <div className="flex items-center gap-1">
                <span>SERI</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th
              onClick={() => handleSort('koneksi')}
              className="py-3 px-3 cursor-pointer hover:text-blue-900"
            >
              <div className="flex items-center gap-1">
                <span>KOMUNIKASI</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            {isNonAquaLinkTab ? (
              <th className="py-3 px-3">SIM CARD (PROVIDER & NOMOR)</th>
            ) : (
              <>
                <th className="py-3 px-3">READ ADDRESS</th>
                <th className="py-3 px-3">DEVEUI / NO SIM</th>
                <th className="py-3 px-3">APPEUI / APN&BAND</th>
                <th className="py-3 px-3">DEVADDR</th>
                <th className="py-3 px-3">APPKEY</th>
                <th className="py-3 px-3">IP</th>
              </>
            )}
            <th
              onClick={() => handleSort('status')}
              className="py-3 px-3 cursor-pointer hover:text-blue-900"
            >
              <div className="flex items-center gap-1">
                <span>STATUS</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th
              onClick={() => handleSort('lokasi')}
              className="py-3 px-3 cursor-pointer hover:text-blue-900"
            >
              <div className="flex items-center gap-1">
                <span>LOKASI</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th
              onClick={() => handleSort('tanggalKeluar')}
              className="py-3 px-3 cursor-pointer hover:text-blue-900"
            >
              <div className="flex items-center gap-1">
                <span>GUDANG & TANGGAL</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th className="py-3 px-3 text-center w-32">AKSI</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-slate-700">
          {devices.length === 0 ? (
            <tr>
              <td colSpan={isNonAquaLinkTab ? 9 : 14} className="py-12 text-center text-slate-400">
                {filters.model === 'Ultrasonic'
                  ? 'Belum ada data perangkat Ultrasonic. Anda dapat menambahkannya melalui tombol "+ Tambah Device" di atas.'
                  : filters.model === 'Hybrid' || filters.model === 'Smart Meter Hybrid'
                  ? 'Belum ada data perangkat Hybrid (Smart Water Meter). Anda dapat menambahkannya melalui tombol "+ Tambah Device" di atas.'
                  : filters.model === 'MIU'
                  ? 'Belum ada data perangkat Meter Interface Unit (MIU). Anda dapat menambahkannya melalui tombol "+ Tambah Device" di atas.'
                  : 'Tidak ada data perangkat yang cocok dengan pencarian / filter.'}
              </td>
            </tr>
          ) : (
            devices.map((d, index) => {
              const isSelected = selectedDeviceIds.includes(d.id);
              const rowNumber = (currentPage - 1) * rowsPerPage + index + 1;
              const isLora = d.koneksi === 'LoRaWAN';

              return (
                <tr
                  key={d.id}
                  className={`hover:bg-blue-50/40 transition-colors ${
                    isSelected ? 'bg-blue-50/70' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectDevice(d.id)}
                      className="rounded border-slate-300 text-blue-900 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* NO */}
                  <td className="py-2.5 px-2 text-center text-slate-400 font-mono text-[11px]">
                    {rowNumber}
                  </td>

                  {/* SERI */}
                  <td className="py-2.5 px-3 font-bold text-blue-950 font-mono text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => onOpenDetail(d)}
                        className="hover:underline text-left cursor-pointer"
                        title="Klik untuk detail"
                      >
                        {d.seri}
                      </button>
                      {filters.model === 'ALL' && (
                        <span
                          className={`inline-flex items-center gap-1 w-fit text-[9px] font-sans font-bold px-1.5 py-0.5 rounded ${
                            getDeviceModel(d) === 'AquaLink'
                              ? 'bg-blue-100 text-blue-800'
                              : getDeviceModel(d) === 'Ultrasonic'
                              ? 'bg-purple-100 text-purple-800'
                              : getDeviceModel(d) === 'Hybrid' || getDeviceModel(d) === 'Smart Meter Hybrid'
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <ModelIcon model={getDeviceModel(d)} size="xs" />
                          <span>
                            {getDeviceModel(d) === 'AquaLink'
                              ? 'AquaLink'
                              : getDeviceModel(d) === 'Ultrasonic'
                              ? 'Ultrasonic'
                              : getDeviceModel(d) === 'Hybrid' || getDeviceModel(d) === 'Smart Meter Hybrid'
                              ? 'Hybrid'
                              : 'MIU'}
                          </span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* KONEKSI */}
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        d.koneksi === 'LoRaWAN'
                          ? 'bg-blue-100 text-blue-800'
                          : d.koneksi === 'NB-IoT'
                          ? 'bg-sky-100 text-sky-800'
                          : d.koneksi === 'GPRS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {d.koneksi}
                    </span>
                  </td>

                  {isNonAquaLinkTab ? (
                    /* Kolom Khusus Non-AquaLink: SIM Card & Nomor */
                    <td className="py-2.5 px-3">
                      {d.koneksi !== 'LoRaWAN' ? (
                        d.noSim ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 text-xs px-2 py-0.5 rounded-lg font-medium" title="SIM Card Terhubung">
                              <CardSim className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              {d.operatorSim && <span className="font-semibold text-slate-700">{d.operatorSim} :</span>}
                              <span className="font-mono font-bold text-emerald-700">{d.noSim}</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Tanpa SIM Card</span>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px] italic font-medium">
                          Nirkabel (Non-SIM)
                        </span>
                      )}
                    </td>
                  ) : (
                    /* Kolom Lengkap AquaLink / Tab Semua Model */
                    <>
                      {/* READ ADDRESS */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {getDeviceModel(d) === 'AquaLink' ? (d.readAddress || '-') : '-'}
                      </td>

                      {/* DEVEUI / NO SIM */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        {isLora ? (
                          getDeviceModel(d) === 'AquaLink' ? (d.devEui || '-') : '-'
                        ) : d.noSim ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold" title="SIM Card Terhubung & Tersinkronisasi">
                            <CardSim className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{d.operatorSim ? `${d.operatorSim}: ` : ''}{d.noSim}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Tanpa SIM</span>
                        )}
                      </td>

                      {/* APPEUI / APN&BAND */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {getDeviceModel(d) === 'AquaLink'
                          ? (isLora ? d.appEui || '-' : d.apnBand || '-')
                          : '-'}
                      </td>

                      {/* DEVADDR */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {getDeviceModel(d) === 'AquaLink' ? (d.devAddr || '-') : '-'}
                      </td>

                      {/* APPKEY */}
                      <td
                        className="py-2.5 px-3 font-mono text-[10px] text-slate-500 max-w-[120px] truncate cursor-pointer hover:text-slate-900"
                        title={getDeviceModel(d) === 'AquaLink' && d.appKey ? `Klik untuk salin AppKey: ${d.appKey}` : undefined}
                        onClick={() => getDeviceModel(d) === 'AquaLink' && copyToClipboard(d.appKey)}
                      >
                        {getDeviceModel(d) === 'AquaLink' && d.appKey ? `${d.appKey.slice(0, 10)}...` : '-'}
                      </td>

                      {/* IP */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {getDeviceModel(d) === 'AquaLink' ? (d.ip || '-') : '-'}
                      </td>
                    </>
                  )}

                  {/* STATUS */}
                  <td className="py-2.5 px-3">
                    <StatusBadge status={d.status} size="sm" />
                  </td>

                  {/* LOKASI */}
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {d.lokasi || <span className="text-slate-300">-</span>}
                  </td>

                  {/* GUDANG & TANGGAL */}
                  <td className="py-2.5 px-3">
                    {(() => {
                      const whStatus = getDeviceWarehouseStatus(d);
                      const isDiLuar = whStatus === 'DI_LUAR';

                      return (
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${
                              !isDiLuar
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {!isDiLuar ? 'Di Gudang' : 'Di Luar'}
                          </span>
                          {d.tanggalKeluar && (
                            <span className="text-[10px] text-slate-500 font-mono" title={`Tanggal Keluar: ${d.tanggalKeluar}`}>
                              Keluar: {d.tanggalKeluar}
                            </span>
                          )}
                          {d.tanggalKembali && (
                            <span className="text-[10px] text-emerald-600 font-mono" title={`Tanggal Kembali: ${d.tanggalKembali}`}>
                              Kembali: {d.tanggalKembali}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* AKSI */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Tombol Mutasi Keluar/Kembali */}
                      {getDeviceWarehouseStatus(d) === 'DI_GUDANG' ? (
                        <button
                          onClick={() => openWarehouseModal(d, 'KELUAR')}
                          title="Catat Keluar Gudang"
                          className="p-1 rounded text-amber-600 hover:text-amber-800 hover:bg-amber-50 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => openWarehouseModal(d, 'KEMBALI')}
                          title="Catat Kembali ke Gudang"
                          className="p-1 rounded text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenDetail(d, 'info')}
                        title="Lihat Detail Teknis"
                        className="p-1 rounded text-slate-500 hover:text-blue-900 hover:bg-slate-100 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenDetail(d, 'history')}
                        title="Lihat Riwayat & Mutasi"
                        className="p-1 rounded text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenEdit(d)}
                        title="Edit Perangkat"
                        className="p-1 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicate(d.id)}
                        title="Duplikasi"
                        className="p-1 rounded text-slate-500 hover:text-sky-700 hover:bg-sky-50 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRequest(d)}
                        title="Hapus"
                        className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

import React from 'react';
import { Device, getDeviceWarehouseStatus, getDeviceModel } from '../../types/device';
import { StatusBadge } from '../common/StatusBadge';
import { useDevices } from '../../context/DeviceContext';
import { X, Copy, Edit2, Check, LogOut, LogIn, Calendar, User, History } from 'lucide-react';

interface DeviceDetailModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (device: Device) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { openWarehouseModal } = useDevices();
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!isOpen || !device) return null;

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isLora = device.koneksi === 'LoRaWAN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0c2340] text-white">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] text-sky-300 font-mono tracking-wider uppercase">
                  {device.koneksi} DEVICE
                </span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {getDeviceModel(device) === 'AquaLink' ? '💧 AquaLink' : getDeviceModel(device) === 'Ultrasonic' ? '🔊 Ultrasonic' : '📟 MIU'}
                </span>
              </div>
              <h2 className="text-lg font-bold font-mono">SERI: {device.seri}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={device.status} />
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Main Info Box */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                Nomor Seri
              </span>
              <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{device.seri}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                Koneksi
              </span>
              <p className="font-semibold text-blue-900 text-sm mt-0.5">{device.koneksi}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                Read Address
              </span>
              <p className="font-mono text-slate-800 mt-0.5">{device.readAddress || '-'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                Lokasi
              </span>
              <p className="font-semibold text-slate-800 mt-0.5">{device.lokasi || 'Belum ditentukan'}</p>
            </div>
          </div>

          {/* Connection Specific Box */}
          {isLora ? (
            <div className="space-y-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <span className="text-[10px] uppercase font-bold text-blue-900">
                Data LoRaWAN
              </span>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                  <span className="text-slate-500 font-medium">DevEUI:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span>{device.devEui || '-'}</span>
                    {device.devEui && (
                      <button
                        onClick={() => copyToClipboard(device.devEui, 'devEui')}
                        className="text-slate-400 hover:text-blue-900"
                        title="Salin DevEUI"
                      >
                        {copiedKey === 'devEui' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                  <span className="text-slate-500 font-medium">AppEUI:</span>
                  <span className="font-mono">{device.appEui || '-'}</span>
                </div>

                <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                  <span className="text-slate-500 font-medium">DevAddr:</span>
                  <span className="font-mono">{device.devAddr || '-'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-sky-50/50 rounded-xl border border-sky-100">
              <span className="text-[10px] uppercase font-bold text-sky-900">
                Data NB-IoT
              </span>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-white p-2 rounded border border-sky-100">
                  <span className="text-slate-500 font-medium">No SIM:</span>
                  <span className="font-mono font-semibold text-emerald-700">{device.noSim || '-'}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 rounded border border-sky-100">
                  <span className="text-slate-500 font-medium">APN & Band:</span>
                  <span className="font-mono">{device.apnBand || '-'}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 rounded border border-sky-100">
                  <span className="text-slate-500 font-medium">IP Server:</span>
                  <span className="font-mono">{device.ip || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* AppKey */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                AppKey
              </span>
              {device.appKey && (
                <button
                  onClick={() => copyToClipboard(device.appKey, 'appKey')}
                  className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1"
                >
                  {copiedKey === 'appKey' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'appKey' ? 'Tersalin' : 'Salin'}</span>
                </button>
              )}
            </div>
            <p className="font-mono text-slate-700 break-all bg-white p-2 rounded border border-slate-200">
              {device.appKey || '-'}
            </p>
          </div>

          {/* Logistik & Gudang Info Box */}
          {(() => {
            const whStatus = getDeviceWarehouseStatus(device);
            const isDiLuar = whStatus === 'DI_LUAR';

            return (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-900" /> Status Logistik Gudang
                  </span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      !isDiLuar
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {!isDiLuar ? '🟢 Di Gudang' : '🟠 Di Luar Gudang'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Tanggal Keluar</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {device.tanggalKeluar || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Tanggal Kembali</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {device.tanggalKembali || (device.tanggalKeluar ? (
                        <span className="text-amber-700 font-semibold">Belum Kembali</span>
                      ) : '-')}
                    </span>
                  </div>
                  {(device.penerimaKeluar || device.keperluanKeluar) && (
                    <>
                      <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> PIC / Pembawa:
                        </span>
                        <span className="font-medium text-slate-700">{device.penerimaKeluar || '-'}</span>
                      </div>
                      <div className="col-span-2 text-[11px] flex items-center justify-between">
                        <span className="text-slate-400">Keperluan:</span>
                        <span className="font-medium text-slate-700">{device.keperluanKeluar || '-'}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Movement Buttons inside Detail */}
                <div className="flex items-center gap-2 pt-1">
                  {!isDiLuar ? (
                    <button
                      onClick={() => {
                        onClose();
                        openWarehouseModal(device, 'KELUAR');
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Catat Keluar Gudang</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        openWarehouseModal(device, 'KEMBALI');
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Catat Kembali ke Gudang</span>
                    </button>
                  )}
                </div>

                {/* Riwayat Mutasi Gudang */}
                {device.riwayatGudang && device.riwayatGudang.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                      <History className="w-3 h-3" /> Riwayat Pergerakan ({device.riwayatGudang.length})
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {device.riwayatGudang.map((m) => (
                        <div
                          key={m.id}
                          className="bg-white p-2 rounded border border-slate-200 text-[11px] flex items-start justify-between"
                        >
                          <div>
                            <span
                              className={`font-bold mr-1.5 ${
                                m.tipe === 'KELUAR' ? 'text-amber-700' : 'text-emerald-700'
                              }`}
                            >
                              [{m.tipe}]
                            </span>
                            <span className="text-slate-600">{m.lokasi || '-'}</span>
                            {m.penerima && (
                              <span className="text-slate-400 block text-[10px]">
                                PIC: {m.penerima} {m.keperluan ? `• ${m.keperluan}` : ''}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-[10px] shrink-0 font-mono">
                            {m.tanggal}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Catatan */}
          {device.catatan && (
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
              <span className="text-[10px] text-amber-900 uppercase font-bold">
                Catatan
              </span>
              <p className="text-slate-800 mt-1 whitespace-pre-line leading-relaxed">
                {device.catatan}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            Update: {new Date(device.updatedAt).toLocaleDateString('id-ID')}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(device);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Data</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

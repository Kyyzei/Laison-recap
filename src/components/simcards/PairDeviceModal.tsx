import React, { useState } from 'react';
import { SimCard } from '../../types/simcard';
import { useDevices } from '../../context/DeviceContext';
import { useSimCards } from '../../context/SimCardContext';
import { X, CardSim, Link2, Unlink, Search, Cpu, CheckCircle } from 'lucide-react';

interface PairDeviceModalProps {
  sim: SimCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PairDeviceModal: React.FC<PairDeviceModalProps> = ({ sim, isOpen, onClose }) => {
  const { devices, setSelectedDeviceForDetail } = useDevices();
  const { pairSimToDevice, unpairSim } = useSimCards();
  const [search, setSearch] = useState('');
  const [selectedSeri, setSelectedSeri] = useState<string>(sim?.deviceSeri || '');

  if (!isOpen || !sim) return null;

  // Filter AquaLink devices
  const eligibleDevices = devices.filter((d) => {
    if (d.koneksi !== 'NB-IoT') return false; // Biasanya SIM Card dipasangkan ke NB-IoT
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      d.seri.toLowerCase().includes(q) ||
      (d.lokasi && d.lokasi.toLowerCase().includes(q)) ||
      (d.noSim && d.noSim.toLowerCase().includes(q)) ||
      (d.catatan && d.catatan.toLowerCase().includes(q))
    );
  });

  const handlePair = () => {
    if (!selectedSeri) return;
    const ok = pairSimToDevice(sim.id, selectedSeri);
    if (ok) onClose();
  };

  const handleUnpair = () => {
    const ok = unpairSim(sim.id);
    if (ok) onClose();
  };

  const isCurrentPaired = Boolean(sim.deviceSeri);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
              <CardSim className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isCurrentPaired ? 'Kelola Perangkat Terhubung' : 'Pasangkan SIM ke Perangkat'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                No SIM: <span className="font-bold text-slate-800">{sim.noSim}</span> ({sim.operator})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status banner */}
        <div className="px-5 py-3 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Status SIM Saat Ini:</span>{' '}
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                sim.status === 'Online'
                  ? 'bg-emerald-100 text-emerald-800'
                  : sim.status === 'Offline'
                  ? 'bg-rose-100 text-rose-800'
                  : sim.status === 'Terpakai'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {sim.status}
            </span>
          </div>
          {sim.deviceSeri && (
            <div className="flex items-center gap-1.5 text-blue-950 font-semibold">
              <Cpu className="w-3.5 h-3.5 text-blue-700" />
              <span>Terhubung ke {sim.deviceSeri}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Action to unpair if already paired */}
          {isCurrentPaired && (
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-rose-900">Lepaskan Dari Perangkat {sim.deviceSeri}</p>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  Nomor SIM pada perangkat {sim.deviceSeri} akan dikosongkan dan status kartu kembali ke <strong>Stock</strong>.
                </p>
              </div>
              <button
                onClick={handleUnpair}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Lepas (Ke Stok)</span>
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isCurrentPaired ? 'Atau Pindahkan ke Perangkat AquaLink Lain:' : 'Pilih Perangkat AquaLink (NB-IoT):'}
            </label>

            {/* Search */}
            <div className="relative mb-2.5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor seri, lokasi, atau status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>

            {/* Device list */}
            <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
              {eligibleDevices.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Tidak ada perangkat NB-IoT yang cocok.
                </div>
              ) : (
                eligibleDevices.map((d) => {
                  const isSelected = selectedSeri === d.seri;
                  const hasOtherSim = Boolean(d.noSim && d.noSim !== sim.noSim);

                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedSeri(d.seri)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 border-l-4 border-blue-900'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-900 bg-blue-900 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-slate-900">
                              {d.seri}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-semibold">
                              {d.model || 'AquaLink'}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                                d.status === 'Aktif'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : d.status === 'Rusak'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {d.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{d.lokasi || 'Tanpa Lokasi'}</span>
                            {hasOtherSim && (
                              <span className="text-amber-600 font-medium">
                                (Saat ini: {d.noSim})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {d.seri === sim.deviceSeri && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                          Terhubung
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handlePair}
            disabled={!selectedSeri || selectedSeri === sim.deviceSeri}
            className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Pasangkan ke Perangkat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

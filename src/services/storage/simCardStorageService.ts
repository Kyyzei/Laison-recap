import { SimCard, SimCardStatus, SimCardStats } from '../../types/simcard';
import { Device } from '../../types/device';
import { LocalStorageService } from './localStorageService';

const SIM_STORAGE_KEY = 'laison_simcards_v3';

export class SimCardStorageService {
  /**
   * Menghasilkan SIM Card awal dari data perangkat yang sudah ada + stok cadangan di gudang.
   */
  private static generateInitialSimCards(): SimCard[] {
    const devices = LocalStorageService.getDevices();
    const simCards: SimCard[] = [];
    const usedSimSet = new Set<string>();

    // 1. Ambil seluruh SIM yang sudah terpasang di perangkat
    devices.forEach((dev) => {
      if (!dev.noSim || !dev.noSim.trim()) return;
      const noSim = dev.noSim.trim();
      if (usedSimSet.has(noSim)) return; // hindari duplikasi MSISDN
      usedSimSet.add(noSim);

      let status: SimCardStatus = 'Online';
      if (dev.status === 'Rusak') {
        status = 'Offline';
      }

      simCards.push({
        id: `sim-${noSim.replace(/[^0-9]/g, '')}`,
        noSim,
        iccid: `89620100${noSim.replace(/[^0-9]/g, '').padEnd(12, '0')}`,
        operator: 'Telkomsel IoT',
        status,
        deviceId: dev.id,
        deviceSeri: dev.seri,
        deviceModel: dev.model || 'AquaLink',
        ip: dev.ip || '147.93.81.149',
        apnBand: dev.apnBand || 'NBIOT,3,20,28,8',
        lokasi: dev.lokasi || 'Gudang Utama Laison',
        kuota: '500 MB / Bulan',
        masaAktif: '2027-12-31',
        catatan: dev.catatan ? `Device: ${dev.catatan}` : 'Terhubung ke perangkat AquaLink',
        tanggalPasang: dev.tanggalKeluar || '2026-07-14',
        createdAt: dev.createdAt || '2026-10-29T08:00:00.000Z',
        updatedAt: dev.updatedAt || '2026-11-19T10:00:00.000Z',
      });
    });

    // 2. Tandai 2 unit sebagai Offline untuk simulasi pemantauan sinyal lapangan
    if (simCards.length >= 4) {
      simCards[2].status = 'Offline';
      simCards[2].catatan = 'Sinyal lemah di lokasi (Offline)';
      simCards[3].status = 'Offline';
      simCards[3].catatan = 'Tidak ada transmisi sinyal 24 jam (Offline)';
    }

    // 3. Tambahkan 15 unit SIM Card cadangan di Gudang (Status: Stock)
    const stockNumbers = [
      '0851-5378-4830',
      '0851-5378-4831',
      '0851-5378-4832',
      '0851-5378-4833',
      '0851-5378-4834',
      '0851-5378-4835',
      '0851-5378-4836',
      '0851-5378-4837',
      '0851-5378-4838',
      '0851-5378-4839',
      '0851-5378-4840',
      '0851-5378-4841',
      '0851-5378-4842',
      '0851-5378-4843',
      '0851-5378-4844',
    ];

    stockNumbers.forEach((noSim, idx) => {
      if (!usedSimSet.has(noSim)) {
        simCards.push({
          id: `sim-${noSim.replace(/[^0-9]/g, '')}`,
          noSim,
          iccid: `89620100${noSim.replace(/[^0-9]/g, '').padEnd(12, '0')}`,
          operator: idx % 3 === 0 ? 'Indosat Ooredoo' : idx % 3 === 1 ? 'XL Axiata' : 'Telkomsel IoT',
          status: 'Stock',
          deviceId: '',
          deviceSeri: '',
          deviceModel: '',
          ip: '147.93.81.149',
          apnBand: 'NBIOT,3,20,28,8',
          lokasi: 'Gudang Utama Laison',
          kuota: '500 MB / Bulan',
          masaAktif: '2027-12-31',
          catatan: 'Stok baru cadangan teknisi di gudang utama',
          createdAt: '2026-11-01T08:00:00.000Z',
          updatedAt: '2026-11-19T10:00:00.000Z',
        });
      }
    });

    return simCards;
  }

  /**
   * Mengambil seluruh SIM Card dari localStorage dengan auto-sinkronisasi ke perangkat.
   */
  static getSimCards(): SimCard[] {
    try {
      // Bersihkan atau migrasi cache v1 & v2 jika ada
      localStorage.removeItem('laison_simcards_v1');
      localStorage.removeItem('laison_simcards_v2');
      let raw = localStorage.getItem(SIM_STORAGE_KEY);

      let list: SimCard[] = [];

      if (!raw) {
        list = this.generateInitialSimCards();
        this.saveSimCards(list);
        return list;
      }

      list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) {
        list = this.generateInitialSimCards();
        this.saveSimCards(list);
        return list;
      }

      // Pastikan tidak ada status 'Terpakai' yang tersisa di storage
      let hasTerpakai = false;
      const sanitized = list.map((item: any) => {
        if (item.status === 'Terpakai') {
          hasTerpakai = true;
          return { ...item, status: 'Online' as SimCardStatus };
        }
        return item as SimCard;
      });

      if (hasTerpakai) {
        this.saveSimCards(sanitized);
        return sanitized;
      }

      return sanitized;
    } catch (e) {
      console.error('Error reading SIM cards from storage:', e);
      return this.generateInitialSimCards();
    }
  }

  /**
   * Menyimpan SIM Card ke localStorage dan memancarkan event.
   */
  static saveSimCards(cards: SimCard[]): void {
    try {
      localStorage.setItem(SIM_STORAGE_KEY, JSON.stringify(cards));
      window.dispatchEvent(new Event('laison-simcards-changed'));
    } catch (e) {
      console.error('Error saving SIM cards to storage:', e);
    }
  }

  /**
   * Menghitung statistik SIM card (Online, Offline, Stock).
   */
  static getStats(): SimCardStats {
    const list = this.getSimCards();
    const stats: SimCardStats = {
      total: list.length,
      online: 0,
      offline: 0,
      stock: 0,
    };

    list.forEach((s) => {
      if (s.status === 'Online') stats.online++;
      else if (s.status === 'Offline') stats.offline++;
      else if (s.status === 'Stock') stats.stock++;
    });

    return stats;
  }

  /**
   * Menambahkan SIM Card baru.
   */
  static addSimCard(data: Omit<SimCard, 'id' | 'createdAt' | 'updatedAt'>, pic: string = 'Admin'): SimCard {
    const list = this.getSimCards();
    const cleanNo = data.noSim.trim();

    if (!cleanNo) {
      throw new Error('Nomor SIM tidak boleh kosong.');
    }

    if (list.some((s) => s.noSim === cleanNo)) {
      throw new Error(`Nomor SIM ${cleanNo} sudah terdaftar di sistem.`);
    }

    const now = new Date().toISOString();
    const newSim: SimCard = {
      ...data,
      id: `sim-${cleanNo.replace(/[^0-9]/g, '') || Date.now()}`,
      noSim: cleanNo,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };

    // Jika dipasangkan langsung ke perangkat saat dibuat
    if (newSim.deviceSeri && newSim.deviceSeri.trim() !== '') {
      this.syncDeviceSimAssignment(newSim.deviceSeri, newSim.noSim, pic);
      newSim.status = newSim.status === 'Stock' ? 'Online' : newSim.status;
    }

    list.unshift(newSim);
    this.saveSimCards(list);
    return newSim;
  }

  /**
   * Memperbarui data SIM Card dan menyelaraskan dengan perangkat terhubung.
   */
  static updateSimCard(id: string, updates: Partial<SimCard>, pic: string = 'Admin'): SimCard {
    const list = this.getSimCards();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new Error('SIM Card tidak ditemukan.');
    }

    const existing = list[idx];
    const now = new Date().toISOString();

    // Cek perubahan nomor SIM
    if (updates.noSim && updates.noSim.trim() !== existing.noSim) {
      const cleanNew = updates.noSim.trim();
      if (list.some((s) => s.id !== id && s.noSim === cleanNew)) {
        throw new Error(`Nomor SIM ${cleanNew} sudah digunakan kartu lain.`);
      }
      // Jika kartu ini terhubung ke device, update device noSim juga
      if (existing.deviceSeri) {
        this.updateDeviceSimNumber(existing.deviceSeri, cleanNew, pic);
      }
    }

    // Cek perubahan perangkat terhubung
    if (updates.deviceSeri !== undefined && updates.deviceSeri !== existing.deviceSeri) {
      // 1. Lepas dari device lama jika ada
      if (existing.deviceSeri) {
        this.clearDeviceSimNumber(existing.deviceSeri, pic);
      }
      // 2. Hubungkan ke device baru jika ada
      if (updates.deviceSeri) {
        const targetSimNumber = updates.noSim || existing.noSim;
        this.syncDeviceSimAssignment(updates.deviceSeri, targetSimNumber, pic);
        if (updates.status === 'Stock') {
          updates.status = 'Online';
        }
      } else {
        // Dilepas, otomatis kembali ke Stock jika status tidak diubah eksplisit
        if (!updates.status) {
          updates.status = 'Stock';
        }
        updates.deviceId = '';
        updates.deviceModel = '';
      }
    }

    // Jika status diubah menjadi 'Stock', lepas dari perangkat
    if (updates.status === 'Stock' && existing.deviceSeri) {
      this.clearDeviceSimNumber(existing.deviceSeri, pic);
      updates.deviceId = '';
      updates.deviceSeri = '';
      updates.deviceModel = '';
    }

    const updated: SimCard = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    list[idx] = updated;
    this.saveSimCards(list);
    return updated;
  }

  /**
   * Pasangkan SIM Card ke perangkat AquaLink tertentu.
   */
  static pairSimToDevice(simId: string, deviceSeri: string, pic: string = 'Admin'): { sim: SimCard; device: Device } {
    const list = this.getSimCards();
    const simIdx = list.findIndex((s) => s.id === simId);
    if (simIdx === -1) throw new Error('SIM Card tidak ditemukan.');

    const devices = LocalStorageService.getDevices();
    const devIdx = devices.findIndex((d) => d.seri === deviceSeri);
    if (devIdx === -1) throw new Error(`Perangkat dengan nomor seri ${deviceSeri} tidak ditemukan.`);

    const targetDev = devices[devIdx];
    const targetSim = list[simIdx];

    // Jika device sudah punya SIM lain, ubah SIM lama itu jadi Stock
    if (targetDev.noSim && targetDev.noSim !== targetSim.noSim) {
      const oldSimIdx = list.findIndex((s) => s.noSim === targetDev.noSim);
      if (oldSimIdx !== -1) {
        list[oldSimIdx].deviceId = '';
        list[oldSimIdx].deviceSeri = '';
        list[oldSimIdx].deviceModel = '';
        list[oldSimIdx].status = 'Stock';
        list[oldSimIdx].updatedAt = new Date().toISOString();
      }
    }

    // Jika SIM ini sebelumnya terhubung ke device lain, bersihkan device lama
    if (targetSim.deviceSeri && targetSim.deviceSeri !== deviceSeri) {
      this.clearDeviceSimNumber(targetSim.deviceSeri, pic);
    }

    // Update Device
    const oldSimNumber = targetDev.noSim;
    targetDev.noSim = targetSim.noSim;
    targetDev.operatorSim = targetSim.operator;
    targetDev.updatedAt = new Date().toISOString();

    // Catat ke riwayat device
    LocalStorageService.addDeviceHistory(targetDev.id, {
      kategori: 'PARAMETER',
      judul: 'SIM Card Dipasangkan',
      deskripsi: `SIM Card ${targetSim.noSim} (${targetSim.operator}) dipasangkan ke perangkat ini.`,
      pic,
      perubahan: [
        {
          field: 'noSim',
          fieldLabel: 'Nomor SIM',
          oldValue: oldSimNumber || '(Kosong)',
          newValue: targetSim.noSim,
        },
      ],
      metadata: {
        simId: targetSim.id,
        operator: targetSim.operator,
      },
    });

    // Update SIM
    const now = new Date().toISOString();
    targetSim.deviceId = targetDev.id;
    targetSim.deviceSeri = targetDev.seri;
    targetSim.deviceModel = targetDev.model || 'AquaLink';
    targetSim.status = targetDev.status === 'Rusak' ? 'Offline' : 'Online';
    targetSim.lokasi = targetDev.lokasi || targetSim.lokasi;
    targetSim.ip = targetDev.ip || targetSim.ip;
    targetSim.apnBand = targetDev.apnBand || targetSim.apnBand;
    targetSim.tanggalPasang = new Date().toISOString().split('T')[0];
    targetSim.updatedAt = now;

    this.saveSimCards(list);
    LocalStorageService.saveDevices(devices);

    return { sim: targetSim, device: targetDev };
  }

  /**
   * Lepaskan SIM Card dari perangkat (kembalikan ke Stock).
   */
  static unpairSim(simId: string, pic: string = 'Admin'): SimCard {
    const list = this.getSimCards();
    const simIdx = list.findIndex((s) => s.id === simId);
    if (simIdx === -1) throw new Error('SIM Card tidak ditemukan.');

    const targetSim = list[simIdx];
    const prevSeri = targetSim.deviceSeri;

    if (prevSeri) {
      this.clearDeviceSimNumber(prevSeri, pic);
    }

    targetSim.deviceId = '';
    targetSim.deviceSeri = '';
    targetSim.deviceModel = '';
    targetSim.status = 'Stock';
    targetSim.updatedAt = new Date().toISOString();

    this.saveSimCards(list);
    return targetSim;
  }

  /**
   * Hapus SIM Card. Jika terhubung, lepaskan dari device.
   */
  static deleteSimCard(simId: string, pic: string = 'Admin'): void {
    const list = this.getSimCards();
    const sim = list.find((s) => s.id === simId);
    if (sim && sim.deviceSeri) {
      this.clearDeviceSimNumber(sim.deviceSeri, pic);
    }

    const filtered = list.filter((s) => s.id !== simId);
    this.saveSimCards(filtered);
  }

  /**
   * Sinkronisasi menyeluruh: Memastikan setiap device yang memiliki noSim terdaftar di SIM Card inventory,
   * dan setiap SIM Card yang device-nya sudah tidak ada diubah statusnya menjadi Stock.
   */
  static fullSynchronize(): { syncedDevices: number; addedCards: number } {
    const devices = LocalStorageService.getDevices();
    const simCards = this.getSimCards();
    const simByNo = new Map<string, SimCard>();
    simCards.forEach((s) => simByNo.set(s.noSim, s));

    let addedCards = 0;
    let syncedDevices = 0;

    devices.forEach((dev) => {
      if (!dev.noSim || !dev.noSim.trim()) return;
      const noSim = dev.noSim.trim();

      if (simByNo.has(noSim)) {
        // Pastikan ter-link
        const card = simByNo.get(noSim)!;
        if (card.deviceSeri !== dev.seri) {
          card.deviceId = dev.id;
          card.deviceSeri = dev.seri;
          card.deviceModel = dev.model || 'AquaLink';
          if (card.status === 'Stock') {
            card.status = dev.status === 'Rusak' ? 'Offline' : 'Online';
          }
          card.lokasi = dev.lokasi || card.lokasi;
          syncedDevices++;
        }
      } else {
        // Buat kartu baru jika belum ada
        const newCard: SimCard = {
          id: `sim-${noSim.replace(/[^0-9]/g, '') || Date.now()}`,
          noSim,
          iccid: `89620100${noSim.replace(/[^0-9]/g, '').padEnd(12, '0')}`,
          operator: 'Telkomsel IoT',
          status: dev.status === 'Rusak' ? 'Offline' : 'Online',
          deviceId: dev.id,
          deviceSeri: dev.seri,
          deviceModel: dev.model || 'AquaLink',
          ip: dev.ip || '147.93.81.149',
          apnBand: dev.apnBand || 'NBIOT,3,20,28,8',
          lokasi: dev.lokasi || 'Gudang Utama Laison',
          kuota: '500 MB / Bulan',
          masaAktif: '2027-12-31',
          catatan: 'Sinkronisasi otomatis dari perangkat AquaLink',
          tanggalPasang: dev.tanggalKeluar || new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        simCards.push(newCard);
        simByNo.set(noSim, newCard);
        addedCards++;
      }
    });

    this.saveSimCards(simCards);
    return { syncedDevices, addedCards };
  }

  /**
   * Helper internal: update device noSim saat device dipasangkan SIM.
   */
  private static syncDeviceSimAssignment(deviceSeri: string, noSim: string, pic: string): void {
    const devices = LocalStorageService.getDevices();
    const dev = devices.find((d) => d.seri === deviceSeri);
    if (!dev) return;

    const oldSim = dev.noSim;
    dev.noSim = noSim;
    dev.updatedAt = new Date().toISOString();

    LocalStorageService.addDeviceHistory(dev.id, {
      kategori: 'PARAMETER',
      judul: 'SIM Card Dipasangkan',
      deskripsi: `SIM Card ${noSim} dipasangkan ke perangkat ini.`,
      pic,
      perubahan: [
        {
          field: 'noSim',
          fieldLabel: 'Nomor SIM',
          oldValue: oldSim || '(Kosong)',
          newValue: noSim,
        },
      ],
    });

    LocalStorageService.saveDevices(devices);
  }

  /**
   * Helper internal: update nomor SIM pada perangkat.
   */
  private static updateDeviceSimNumber(deviceSeri: string, newNoSim: string, pic: string): void {
    const devices = LocalStorageService.getDevices();
    const dev = devices.find((d) => d.seri === deviceSeri);
    if (!dev) return;

    const oldSim = dev.noSim;
    dev.noSim = newNoSim;
    dev.updatedAt = new Date().toISOString();

    LocalStorageService.addDeviceHistory(dev.id, {
      kategori: 'PARAMETER',
      judul: 'Nomor SIM Diperbarui',
      deskripsi: `Nomor SIM Card diubah dari ${oldSim} menjadi ${newNoSim}.`,
      pic,
      perubahan: [
        {
          field: 'noSim',
          fieldLabel: 'Nomor SIM',
          oldValue: oldSim || '(Kosong)',
          newValue: newNoSim,
        },
      ],
    });

    LocalStorageService.saveDevices(devices);
  }

  /**
   * Helper internal: kosongkan nomor SIM pada perangkat (kartu dilepas).
   */
  private static clearDeviceSimNumber(deviceSeri: string, pic: string): void {
    const devices = LocalStorageService.getDevices();
    const dev = devices.find((d) => d.seri === deviceSeri);
    if (!dev) return;

    const oldSim = dev.noSim;
    dev.noSim = '';
    dev.operatorSim = '';
    dev.updatedAt = new Date().toISOString();

    LocalStorageService.addDeviceHistory(dev.id, {
      kategori: 'PARAMETER',
      judul: 'SIM Card Dilepas',
      deskripsi: `SIM Card ${oldSim} dilepas dari perangkat dan kembali ke status Stock.`,
      pic,
      perubahan: [
        {
          field: 'noSim',
          fieldLabel: 'Nomor SIM',
          oldValue: oldSim || '(Kosong)',
          newValue: '(Dilepas / Kosong)',
        },
      ],
    });

    LocalStorageService.saveDevices(devices);
  }

  /**
   * Hook pemanggilan dari Device Service ketika user mengubah noSim langsung dari form perangkat.
   */
  static handleDeviceSimChange(device: Device, newNoSim: string): void {
    try {
      const list = this.getSimCards();
      const oldNo = (device.noSim || '').trim();
      const newNo = (newNoSim || '').trim();

      if (oldNo === newNo) return;

      // 1. Jika noSim lama ada, lepas SIM lama jadi Stock
      if (oldNo) {
        const oldSim = list.find((s) => s.noSim === oldNo);
        if (oldSim) {
          oldSim.deviceId = '';
          oldSim.deviceSeri = '';
          oldSim.deviceModel = '';
          oldSim.status = 'Stock';
          oldSim.updatedAt = new Date().toISOString();
        }
      }

      // 2. Jika noSim baru ada, pasang ke SIM yang cocok atau buat kartu baru
      if (newNo) {
        const targetSim = list.find((s) => s.noSim === newNo);
        if (targetSim) {
          targetSim.deviceId = device.id;
          targetSim.deviceSeri = device.seri;
          targetSim.deviceModel = device.model || 'AquaLink';
          targetSim.status = device.status === 'Rusak' ? 'Offline' : 'Online';
          targetSim.lokasi = device.lokasi || targetSim.lokasi;
          if (device.operatorSim) targetSim.operator = device.operatorSim;
          targetSim.updatedAt = new Date().toISOString();
        } else {
          // Buat kartu baru
          list.unshift({
            id: `sim-${newNo.replace(/[^0-9]/g, '') || Date.now()}`,
            noSim: newNo,
            iccid: `89620100${newNo.replace(/[^0-9]/g, '').padEnd(12, '0')}`,
            operator: device.operatorSim || 'Telkomsel IoT',
            status: device.status === 'Rusak' ? 'Offline' : 'Online',
            deviceId: device.id,
            deviceSeri: device.seri,
            deviceModel: device.model || 'AquaLink',
            ip: device.ip || '147.93.81.149',
            apnBand: device.apnBand || 'NBIOT,3,20,28,8',
            lokasi: device.lokasi || 'Gudang Utama Laison',
            kuota: '500 MB / Bulan',
            masaAktif: '2027-12-31',
            catatan: 'Didaftarkan dari form perangkat',
            tanggalPasang: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      this.saveSimCards(list);
    } catch (e) {
      console.error('Error handling device SIM change:', e);
    }
  }

  /**
   * Hook pemanggilan dari Device Service ketika perangkat dihapus.
   */
  static handleDeviceDeleted(device: Device): void {
    try {
      if (!device.noSim) return;
      const list = this.getSimCards();
      const sim = list.find((s) => s.noSim === device.noSim);
      if (sim) {
        sim.deviceId = '';
        sim.deviceSeri = '';
        sim.deviceModel = '';
        sim.status = 'Stock';
        sim.updatedAt = new Date().toISOString();
        this.saveSimCards(list);
      }
    } catch (e) {
      console.error('Error handling device deleted in SIM storage:', e);
    }
  }

  /**
   * Reset seluruh SIM Card ke default bawaan.
   */
  static resetToDefault(): SimCard[] {
    const list = this.generateInitialSimCards();
    this.saveSimCards(list);
    return list;
  }
}

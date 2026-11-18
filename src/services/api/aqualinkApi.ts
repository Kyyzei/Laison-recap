import { Device } from '../../types/device';
import { ApiResponse, AquaLinkApiService } from './types';

/**
 * Service stub for future AquaLinkOS Cloud API integration.
 */
export class AquaLinkOSClient implements AquaLinkApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey = '', baseUrl = 'https://api.aqualinkos.io/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  setCredentials(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async testConnection(): Promise<ApiResponse<{ status: string; version: string }>> {
    await new Promise((res) => setTimeout(res, 600));
    return {
      success: true,
      data: {
        status: 'online',
        version: 'v2.4.1-rc3',
      },
      timestamp: new Date().toISOString(),
    };
  }

  async fetchDevices(): Promise<ApiResponse<Device[]>> {
    await new Promise((res) => setTimeout(res, 800));
    return {
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    };
  }

  async createDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Device>> {
    await new Promise((res) => setTimeout(res, 500));
    const now = new Date().toISOString();
    return {
      success: true,
      data: {
        ...device,
        id: 'api-dev-' + Date.now(),
        createdAt: now,
        updatedAt: now,
      },
      timestamp: now,
    };
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<ApiResponse<Device>> {
    await new Promise((res) => setTimeout(res, 400));
    return {
      success: true,
      data: {
        id,
        seri: updates.seri || 'SN-UNKNOWN',
        koneksi: updates.koneksi || 'LoRaWAN',
        readAddress: updates.readAddress || '',
        devEui: updates.devEui || '',
        appEui: updates.appEui || '',
        devAddr: updates.devAddr || '',
        noSim: updates.noSim || '',
        apnBand: updates.apnBand || '',
        ip: updates.ip || '',
        appKey: updates.appKey || '',
        status: updates.status || 'Stok',
        lokasi: updates.lokasi || '',
        catatan: updates.catatan || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Service stub for Meterin platform API.
 */
export class MeterinClient implements AquaLinkApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey = '', baseUrl = 'https://api.meterin.id/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async testConnection(): Promise<ApiResponse<{ status: string; version: string }>> {
    await new Promise((res) => setTimeout(res, 700));
    return {
      success: true,
      data: {
        status: 'online',
        version: 'meterin-bridge-3.0',
      },
      timestamp: new Date().toISOString(),
    };
  }

  async fetchDevices(): Promise<ApiResponse<Device[]>> {
    return {
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    };
  }

  async createDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Device>> {
    const now = new Date().toISOString();
    return {
      success: true,
      data: {
        ...device,
        id: 'meterin-' + Date.now(),
        createdAt: now,
        updatedAt: now,
      },
      timestamp: now,
    };
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<ApiResponse<Device>> {
    return {
      success: true,
      data: {
        id,
        seri: updates.seri || '',
        koneksi: updates.koneksi || 'NB-IoT',
        readAddress: updates.readAddress || '',
        devEui: '',
        appEui: '',
        devAddr: '',
        noSim: updates.noSim || '',
        apnBand: updates.apnBand || '',
        ip: updates.ip || '',
        appKey: updates.appKey || '',
        status: updates.status || 'Stok',
        lokasi: updates.lokasi || '',
        catatan: updates.catatan || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export const aqualinkApiService = new AquaLinkOSClient();
export const meterinApiService = new MeterinClient();

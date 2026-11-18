import { Device } from '../../types/device';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ApiAuthCredentials {
  apiKey: string;
  baseUrl: string;
}

export interface AquaLinkApiService {
  testConnection(): Promise<ApiResponse<{ status: string; version: string }>>;
  fetchDevices(): Promise<ApiResponse<Device[]>>;
  createDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Device>>;
  updateDevice(id: string, updates: Partial<Device>): Promise<ApiResponse<Device>>;
}

import api from './api';

export interface SocialAccount {
  id: string;
  platform: 'linkedin' | 'twitter';
  username: string;
  isActive: boolean;
  needsReconnection: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformLimits {
  characterLimit: number;
  mediaLimit: number;
  videoSizeLimit: number;
  imageSizeLimit: number;
  supportedFormats: string[];
}

export interface ConnectPlatformResponse {
  authUrl: string;
}

class PlatformService {
  async getConnectedAccounts(): Promise<SocialAccount[]> {
    const response = await api.get('/platforms/accounts');
    return response.data.data.accounts;
  }

  async connectPlatform(platform: string): Promise<ConnectPlatformResponse> {
    const response = await api.post(`/platforms/connect/${platform}`);
    return response.data.data;
  }

  async disconnectPlatform(platform: string): Promise<void> {
    await api.delete(`/platforms/disconnect/${platform}`);
  }

  async refreshToken(platform: string): Promise<void> {
    await api.post(`/platforms/refresh/${platform}`);
  }

  async getPlatformProfile(platform: string): Promise<any> {
    const response = await api.get(`/platforms/${platform}/profile`);
    return response.data.data.profile;
  }

  async getPlatformLimits(platform: string): Promise<PlatformLimits> {
    const response = await api.get(`/platforms/${platform}/limits`);
    return response.data.data.limits;
  }
}

export const platformService = new PlatformService();

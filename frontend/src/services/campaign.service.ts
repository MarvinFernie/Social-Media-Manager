import api from './api';

export interface Campaign {
  id: string;
  title: string;
  originalContent: string;
  mediaFiles?: {
    images?: string[];
    videos?: string[];
  };
  links?: Array<{
    url: string;
    title?: string;
    description?: string;
    image?: string;
  }>;
  status: 'draft' | 'published' | 'scheduled' | 'failed';
  platformContents?: PlatformContent[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformContent {
  id: string;
  platform: 'linkedin' | 'twitter';
  variations: Array<{
    tone: string;
    content: string;
  }>;
  selectedContent?: string;
  finalContent?: string;
  status: 'draft' | 'posted' | 'failed';
  postUrl?: string;
  postedAt?: string;
}

export interface CreateCampaignDto {
  title: string;
  originalContent: string;
  mediaFiles?: {
    images?: string[];
    videos?: string[];
  };
  links?: Array<{
    url: string;
    title?: string;
    description?: string;
    image?: string;
  }>;
}

export interface GenerateContentDto {
  platforms: Array<'linkedin' | 'twitter'>;
}

export interface RefineContentDto {
  platformContentId: string;
  prompt: string;
  selectedVariationIndex?: number;
}

class CampaignService {
  async getCampaigns(): Promise<Campaign[]> {
    const response = await api.get('/campaigns');
    return response.data.data.campaigns;
  }

  async getCampaign(id: string): Promise<Campaign> {
    const response = await api.get(`/campaigns/${id}`);
    return response.data.data.campaign;
  }

  async createCampaign(data: CreateCampaignDto): Promise<Campaign> {
    const response = await api.post('/campaigns', data);
    return response.data.data.campaign;
  }

  async updateCampaign(id: string, data: Partial<CreateCampaignDto>): Promise<Campaign> {
    const response = await api.put(`/campaigns/${id}`, data);
    return response.data.data.campaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    await api.delete(`/campaigns/${id}`);
  }

  async generateContent(id: string, data: GenerateContentDto): Promise<Campaign> {
    const response = await api.post(`/campaigns/${id}/generate`, data);
    return response.data.data.campaign;
  }

  async refineContent(id: string, data: RefineContentDto): Promise<PlatformContent> {
    const response = await api.post(`/campaigns/${id}/refine`, data);
    return response.data.data.platformContent;
  }

  async publishCampaign(id: string): Promise<any> {
    const response = await api.post(`/campaigns/${id}/publish`);
    return response.data.data.results;
  }

  async publishToPlatform(id: string, platform: string): Promise<any> {
    const response = await api.post(`/campaigns/${id}/publish/${platform}`);
    return response.data.data.result;
  }
}

export const campaignService = new CampaignService();

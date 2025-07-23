import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  provider: 'google' | 'linkedin' | 'twitter';
  llmProvider?: 'openai' | 'anthropic' | 'gemini';
  llmModel?: string;
  hasApiKey: boolean;
  apiKeyConfigured?: boolean;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini';
  model: string;
  apiKey: string;
}

class AuthService {
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  }

  async updateLLMConfig(config: LLMConfig): Promise<void> {
    await api.put('/auth/llm-config', config);
  }

  async revokeLLMConfig(): Promise<void> {
    await api.delete('/auth/llm-config');
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  handleOAuthCallback(): void {
    // Extract token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/';
    }
  }

  getGoogleAuthUrl(): string {
    return `${process.env.REACT_APP_API_URL}/auth/google`;
  }

  getLinkedInAuthUrl(): string {
    return `${process.env.REACT_APP_API_URL}/auth/linkedin`;
  }

  getTwitterAuthUrl(): string {
    return `${process.env.REACT_APP_API_URL}/auth/twitter`;
  }
}

export const authService = new AuthService();




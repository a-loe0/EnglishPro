import api from './api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'TEACHER' | 'STUDENT';
  avatarUrl?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'TEACHER' | 'STUDENT';
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    const { accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data.user;
  },

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    return response.data;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  async updateProfile(data: { name?: string }): Promise<User> {
    const response = await api.patch<{ user: User }>('/auth/profile', data);
    return response.data.user;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.post('/auth/change-password', data);
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<{ user: User }>('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.user;
  },

  getAvatarUrl(avatarUrl: string | undefined | null): string | null {
    if (!avatarUrl) return null;
    return `${API_BASE}${avatarUrl}`;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },
};

export default authService;

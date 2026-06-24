import { api } from '@/shared/api/client';
import type { AuthResponse, LoginPayload } from '../model/types';

export const authApi = {
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
  logout: (refreshToken: string) =>
    api.post<{ success: true }>('/auth/logout', { refreshToken }),
  refresh: (refreshToken: string) =>
    api.post<Omit<AuthResponse, 'user'>>('/auth/refresh', { refreshToken }),
};

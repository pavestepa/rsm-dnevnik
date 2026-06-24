import { api } from '@/shared/api/client';
import type { UpdateProfilePayload, User } from '@/shared/model/user';
import type { UserSearchResult } from '../model/types';

export const userApi = {
  getMe: () => api.get<User>('/users/me'),
  updateMe: (payload: UpdateProfilePayload) => api.patch<User>('/users/me', payload),
  search: (query: string) =>
    api.get<UserSearchResult[]>('/users/search', { params: { q: query } }),
};

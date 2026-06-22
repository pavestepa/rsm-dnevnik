import { api } from '@/shared/api/client';
import type { UpdateProfilePayload, User } from '@/entities/session';
import type { UserSearchResult } from '../../chat/model/group-types';

export const userApi = {
  getMe: () => api.get<User>('/users/me'),
  updateMe: (payload: UpdateProfilePayload) => api.patch<User>('/users/me', payload),
  search: (query: string) =>
    api.get<UserSearchResult[]>('/users/search', { params: { q: query } }),
};

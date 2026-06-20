import { api } from '@/api/client';
import type {
  AuthResponse,
  LoginPayload,
  MediaResponse,
  PresignUploadPayload,
  PresignUploadResponse,
  UpdateProfilePayload,
  User,
} from '@/types/auth';
import type { ChatListItem } from '@/types/chat';
import type {
  Contact,
  CreateContactPayload,
  SyncContactsPayload,
} from '@/types/contact';
import type {
  CreateGroupPayload,
  UpdateGroupPayload,
  UserSearchResult,
} from '@/types/group';
import type {
  CreateMessagePayload,
  Message,
  PaginatedResult,
} from '@/types/message';

export const authApi = {
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
  logout: (refreshToken: string) =>
    api.post<{ success: true }>('/auth/logout', { refreshToken }),
  refresh: (refreshToken: string) =>
    api.post<Omit<AuthResponse, 'user'>>('/auth/refresh', { refreshToken }),
};

export const userApi = {
  getMe: () => api.get<User>('/users/me'),
  updateMe: (payload: UpdateProfilePayload) => api.patch<User>('/users/me', payload),
  search: (query: string) =>
    api.get<UserSearchResult[]>('/users/search', { params: { q: query } }),
};

export const mediaApi = {
  presign: (payload: PresignUploadPayload) =>
    api.post<PresignUploadResponse>('/media/presign', payload),
  confirm: (mediaId: string) =>
    api.post<MediaResponse>(`/media/${mediaId}/confirm`),
};

export const contactsApi = {
  list: (query?: string) =>
    api.get<Contact[]>('/contacts', {
      params: query ? { q: query } : undefined,
    }),
  create: (payload: CreateContactPayload) =>
    api.post<Contact>('/contacts', payload),
  sync: (payload: SyncContactsPayload) =>
    api.post<{ synced: number }>('/contacts/sync', payload),
  delete: (contactId: string) => api.delete<void>(`/contacts/${contactId}`),
};

export const chatApi = {
  list: (query?: string) =>
    api.get<ChatListItem[]>('/chats', {
      params: query ? { q: query } : undefined,
    }),
  getById: (chatId: string) => api.get<ChatListItem>(`/chats/${chatId}`),
  createDirect: (participantId: string) =>
    api.post<ChatListItem>('/chats/direct', { participantId }),
  createGroup: (payload: CreateGroupPayload) =>
    api.post<ChatListItem>('/chats/group', payload),
  updateGroup: (chatId: string, payload: UpdateGroupPayload) =>
    api.patch<ChatListItem>(`/chats/${chatId}`, payload),
  addParticipant: (chatId: string, userId: string) =>
    api.post<ChatListItem>(`/chats/${chatId}/participants`, { userId }),
  removeParticipant: (chatId: string, targetUserId: string) =>
    api.delete<ChatListItem>(`/chats/${chatId}/participants/${targetUserId}`),
  updateParticipantRole: (
    chatId: string,
    targetUserId: string,
    role: 'admin' | 'member',
  ) =>
    api.patch<ChatListItem>(`/chats/${chatId}/participants/${targetUserId}/role`, {
      role,
    }),
  leaveGroup: (chatId: string) => api.post<ChatListItem>(`/chats/${chatId}/leave`),
  markRead: (chatId: string, messageId?: string) =>
    api.post<{ unreadCount: number }>(`/chats/${chatId}/read`, {
      ...(messageId ? { messageId } : {}),
    }),
  pin: (chatId: string) => api.post<ChatListItem>(`/chats/${chatId}/pin`),
  unpin: (chatId: string) => api.post<ChatListItem>(`/chats/${chatId}/unpin`),
};

export const messageApi = {
  list: (chatId: string, params?: { cursor?: string; limit?: number }) =>
    api.get<PaginatedResult<Message>>(`/chats/${chatId}/messages`, { params }),
  send: (chatId: string, payload: CreateMessagePayload) =>
    api.post<Message>(`/chats/${chatId}/messages`, payload),
};

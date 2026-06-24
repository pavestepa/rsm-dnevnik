import { api } from '@/shared/api/client';
import type { ChatListItem } from '../model/types';
import type { CreateGroupPayload, UpdateGroupPayload } from '../model/group-types';

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
  deleteGroup: (chatId: string) => api.delete<{ success: true }>(`/chats/${chatId}`),
  markRead: (chatId: string, messageId?: string) =>
    api.post<{ unreadCount: number }>(`/chats/${chatId}/read`, {
      ...(messageId ? { messageId } : {}),
    }),
  pin: (chatId: string) => api.post<ChatListItem>(`/chats/${chatId}/pin`),
  unpin: (chatId: string) => api.post<ChatListItem>(`/chats/${chatId}/unpin`),
};

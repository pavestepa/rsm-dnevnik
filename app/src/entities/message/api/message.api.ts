import { api } from '@/shared/api/client';
import type {
  CreateMessagePayload,
  Message,
  PaginatedResult,
} from '../model/types';

export const messageApi = {
  list: (chatId: string, params?: { cursor?: string; limit?: number }) =>
    api.get<PaginatedResult<Message>>(`/chats/${chatId}/messages`, { params }),
  send: (chatId: string, payload: CreateMessagePayload) =>
    api.post<Message>(`/chats/${chatId}/messages`, payload),
  deleteForEveryone: (chatId: string, messageId: string) =>
    api.delete<Message>(`/chats/${chatId}/messages/${messageId}`),
  deleteForMe: (chatId: string, messageId: string) =>
    api.post<{ success: true }>(`/chats/${chatId}/messages/${messageId}/hide`),
};

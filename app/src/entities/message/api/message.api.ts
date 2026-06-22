import { api } from '@/shared/api/client';
import type {
  CreateMessagePayload,
  Message,
  PaginatedResult,
} from '@/entities/message';

export const messageApi = {
  list: (chatId: string, params?: { cursor?: string; limit?: number }) =>
    api.get<PaginatedResult<Message>>(`/chats/${chatId}/messages`, { params }),
  send: (chatId: string, payload: CreateMessagePayload) =>
    api.post<Message>(`/chats/${chatId}/messages`, payload),
};

import { api } from '@/shared/api/client';
import type {
  CreateEventPayload,
  EventDetail,
  EventsPage,
  UpdateEventPayload,
} from '../model/types';

export const eventApi = {
  list: (params?: { cursor?: string; limit?: number }) =>
    api.get<EventsPage>('/events', { params }),
  get: (eventId: string) => api.get<EventDetail>(`/events/${eventId}`),
  create: (payload: CreateEventPayload) => api.post<EventDetail>('/events', payload),
  update: (eventId: string, payload: UpdateEventPayload) =>
    api.patch<EventDetail>(`/events/${eventId}`, payload),
  delete: (eventId: string) => api.delete<{ success: true }>(`/events/${eventId}`),
};

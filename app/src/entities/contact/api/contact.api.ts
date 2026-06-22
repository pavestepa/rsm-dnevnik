import { api } from '@/shared/api/client';
import type {
  Contact,
  CreateContactPayload,
  SyncContactsPayload,
} from '@/entities/contact';

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

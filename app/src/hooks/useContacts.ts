import { contactsApi } from '@/services/api';
import type { CreateContactPayload, SyncContactsPayload } from '@/types/contact';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useContacts(searchQuery?: string) {
  const normalized = searchQuery?.trim() ?? '';

  return useQuery({
    queryKey: ['contacts', normalized],
    queryFn: () => contactsApi.list(normalized || undefined),
    placeholderData: (previousData) => previousData,
  });
}

export function useAddContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateContactPayload) => contactsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => contactsApi.delete(contactId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useSyncDeviceContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SyncContactsPayload) => contactsApi.sync(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

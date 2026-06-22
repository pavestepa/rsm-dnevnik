import { contactsApi } from '@/entities/contact';
import type { SyncContactsPayload } from '@/entities/contact';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSyncDeviceContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SyncContactsPayload) => contactsApi.sync(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

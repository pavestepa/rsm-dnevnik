import { contactsApi } from '@/entities/contact';
import type { CreateContactPayload } from '@/entities/contact';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useAddContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateContactPayload) => contactsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

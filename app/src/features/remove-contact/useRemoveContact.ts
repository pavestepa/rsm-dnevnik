import { contactsApi } from '@/entities/contact';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useRemoveContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => contactsApi.delete(contactId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

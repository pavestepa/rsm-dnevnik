import { eventApi } from '@/entities/event';
import { queryClient } from '@/shared/lib/query-client';
import { useMutation } from '@tanstack/react-query';

export function useDeleteEvent() {
  return useMutation({
    mutationFn: (eventId: string) => eventApi.delete(eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

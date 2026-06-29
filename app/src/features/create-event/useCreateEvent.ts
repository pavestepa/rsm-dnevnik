import { eventApi, type CreateEventPayload } from '@/entities/event';
import { queryClient } from '@/shared/lib/query-client';
import { useMutation } from '@tanstack/react-query';

export function useCreateEvent() {
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => eventApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

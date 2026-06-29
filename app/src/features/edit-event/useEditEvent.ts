import { eventApi, type UpdateEventPayload } from '@/entities/event';
import { queryClient } from '@/shared/lib/query-client';
import { useMutation } from '@tanstack/react-query';

export function useEditEvent(eventId: string) {
  return useMutation({
    mutationFn: (payload: UpdateEventPayload) => eventApi.update(eventId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      void queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
      void queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
}

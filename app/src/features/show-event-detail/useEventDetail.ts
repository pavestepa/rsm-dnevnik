import { eventApi, type EventDetail } from '@/entities/event';
import { useQuery } from '@tanstack/react-query';

export function useEventDetail(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventApi.get(eventId),
    enabled: Boolean(eventId),
  });
}

export type { EventDetail };

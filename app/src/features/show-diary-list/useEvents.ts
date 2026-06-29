import { eventApi, type EventsPage, type EventsQueryData } from '@/entities/event';
import { useInfiniteQuery } from '@tanstack/react-query';

const PAGE_SIZE = 20;

export function useEvents() {
  return useInfiniteQuery<
    EventsPage,
    Error,
    EventsQueryData,
    ['events'],
    string | undefined
  >({
    queryKey: ['events'],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      eventApi.list({
        cursor: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
}

export function flattenEvents(data: EventsQueryData | undefined) {
  return data?.pages.flatMap((page) => page.items) ?? [];
}

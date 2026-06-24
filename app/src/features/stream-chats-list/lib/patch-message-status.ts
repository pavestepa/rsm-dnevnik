import type { MessageStatusEvent } from '@/entities/message';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

type MessagesPage = {
  items: { id: string; status: MessageStatusEvent['status'] | null }[];
  nextCursor: string | null;
  hasMore: boolean;
};

type MessagesInfinite = InfiniteData<MessagesPage, string | undefined>;

export function patchMessageStatus(
  queryClient: QueryClient,
  payload: MessageStatusEvent,
): void {
  queryClient.setQueryData<MessagesInfinite>(['messages', payload.chatId], (current) => {
    if (!current) {
      return current;
    }

    return {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          item.id === payload.messageId ? { ...item, status: payload.status } : item,
        ),
      })),
    };
  });
}

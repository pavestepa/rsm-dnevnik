import type { ChatListItem } from '@/types/chat';
import type { MessageStatusEvent } from '@/types/message';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

type MessagesPage = {
  items: { id: string; status: MessageStatusEvent['status'] | null }[];
  nextCursor: string | null;
  hasMore: boolean;
};

type MessagesInfinite = InfiniteData<MessagesPage, string | undefined>;

export function patchChatUnreadCount(
  queryClient: QueryClient,
  chatId: string,
  unreadCount: number,
): void {
  queryClient.setQueriesData<ChatListItem[]>({ queryKey: ['chats'] }, (current) => {
    if (!current) {
      return current;
    }

    return current.map((chat) =>
      chat.id === chatId ? { ...chat, unreadCount } : chat,
    );
  });

  queryClient.setQueryData<ChatListItem>(['chat', chatId], (current) => {
    if (!current) {
      return current;
    }

    return { ...current, unreadCount };
  });
}

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

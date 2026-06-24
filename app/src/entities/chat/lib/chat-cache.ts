import type { ChatListItem } from '../model/types';
import type { QueryClient } from '@tanstack/react-query';

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

export function invalidateChatListQueries(
  queryClient: QueryClient,
  chatId?: string,
): void {
  void queryClient.invalidateQueries({ queryKey: ['chats'] });

  if (chatId) {
    void queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
  }
}

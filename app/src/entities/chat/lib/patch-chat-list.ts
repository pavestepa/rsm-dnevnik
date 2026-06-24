import type { ChatListItem } from '../model/types';
import type { QueryClient } from '@tanstack/react-query';

export function patchChatPresence(
  queryClient: QueryClient,
  userId: string,
  isOnline: boolean,
): void {
  queryClient.setQueriesData<ChatListItem[]>({ queryKey: ['chats'] }, (current) => {
    if (!current) {
      return current;
    }

    return current.map((chat) =>
      chat.peerUserId === userId ? { ...chat, isOnline } : chat,
    );
  });
}

import type { ChatListItem } from '@/entities/chat';
import type { Message } from '@/entities/message';
import type { QueryClient } from '@tanstack/react-query';

function reorderChats(chats: ChatListItem[], updated: ChatListItem): ChatListItem[] {
  const rest = chats.filter((chat) => chat.id !== updated.id);
  const pinned = rest.filter((chat) => chat.isPinned);
  const unpinned = rest.filter((chat) => !chat.isPinned);

  if (updated.isPinned) {
    return [updated, ...pinned, ...unpinned];
  }

  return [...pinned, updated, ...unpinned];
}

export function patchChatListOnNewMessage(
  queryClient: QueryClient,
  message: Message,
  currentUserId?: string,
): void {
  queryClient.setQueriesData<ChatListItem[]>({ queryKey: ['chats'] }, (current) => {
    if (!current) {
      return current;
    }

    const chat = current.find((item) => item.id === message.chatId);
    if (!chat || chat.type === 'event') {
      return current;
    }

    const isOwnMessage = message.sender.id === currentUserId;
    const updated: ChatListItem = {
      ...chat,
      lastMessage: {
        id: message.id,
        type: message.type,
        text: message.text,
        senderId: message.sender.id,
        createdAt: message.createdAt,
      },
      updatedAt: message.createdAt,
      unreadCount: isOwnMessage ? chat.unreadCount : chat.unreadCount + 1,
    };

    return reorderChats(current, updated);
  });

  queryClient.setQueryData<ChatListItem>(['chat', message.chatId], (current) => {
    if (!current) {
      return current;
    }

    const isOwnMessage = message.sender.id === currentUserId;
    return {
      ...current,
      lastMessage: {
        id: message.id,
        type: message.type,
        text: message.text,
        senderId: message.sender.id,
        createdAt: message.createdAt,
      },
      updatedAt: message.createdAt,
      unreadCount: isOwnMessage ? current.unreadCount : current.unreadCount + 1,
    };
  });
}

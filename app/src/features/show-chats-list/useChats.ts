import { chatApi, isVisibleInChatList } from '@/entities/chat';
import { useQuery } from '@tanstack/react-query';

export function useChats(searchQuery: string) {
  const normalizedQuery = searchQuery.trim();

  return useQuery({
    queryKey: ['chats', normalizedQuery],
    queryFn: async () => {
      const chats = await chatApi.list(normalizedQuery || undefined);
      return chats.filter((chat) => isVisibleInChatList(chat.type));
    },
    placeholderData: (previousData) => previousData,
  });
}

import { chatApi } from '@/entities/chat';
import { useQuery } from '@tanstack/react-query';

export function useChats(searchQuery: string) {
  const normalizedQuery = searchQuery.trim();

  return useQuery({
    queryKey: ['chats', normalizedQuery],
    queryFn: () => chatApi.list(normalizedQuery || undefined),
    placeholderData: (previousData) => previousData,
  });
}

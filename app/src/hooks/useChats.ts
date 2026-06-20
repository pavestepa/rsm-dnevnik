import { chatApi } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useChats(searchQuery: string) {
  const normalizedQuery = searchQuery.trim();

  return useQuery({
    queryKey: ['chats', normalizedQuery],
    queryFn: () => chatApi.list(normalizedQuery || undefined),
    placeholderData: (previousData) => previousData,
  });
}

export function usePinChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatApi.pin(chatId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

export function useUnpinChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatApi.unpin(chatId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteGroupChat(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => chatApi.deleteGroup(chatId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['chat', chatId] });
      queryClient.removeQueries({ queryKey: ['messages', chatId] });
      invalidateChatListQueries(queryClient, chatId);
    },
  });
}

import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useAddUser(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => chatApi.addParticipant(chatId, userId),
    onSuccess: (chat) => {
      queryClient.setQueryData(['chat', chatId], chat);
      invalidateChatListQueries(queryClient, chatId);
    },
  });
}

import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useKickUser(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) =>
      chatApi.removeParticipant(chatId, targetUserId),
    onSuccess: (chat) => {
      queryClient.setQueryData(['chat', chatId], chat);
      invalidateChatListQueries(queryClient, chatId);
    },
  });
}

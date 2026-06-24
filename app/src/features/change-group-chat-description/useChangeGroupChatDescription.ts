import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useChangeGroupChatDescription(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (description: string) =>
      chatApi.updateGroup(chatId, { description }),
    onSuccess: (chat) => {
      queryClient.setQueryData(['chat', chatId], chat);
      invalidateChatListQueries(queryClient, chatId);
    },
  });
}

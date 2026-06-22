import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import type { UpdateGroupPayload } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateGroup(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGroupPayload) =>
      chatApi.updateGroup(chatId, payload),
    onSuccess: (chat) => {
      queryClient.setQueryData(['chat', chatId], chat);
      invalidateChatListQueries(queryClient, chatId);
    },
  });
}

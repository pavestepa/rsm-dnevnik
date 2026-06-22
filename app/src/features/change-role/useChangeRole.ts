import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useChangeRole(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetUserId,
      role,
    }: {
      targetUserId: string;
      role: 'admin' | 'member';
    }) => chatApi.updateParticipantRole(chatId, targetUserId, role),
    onSuccess: (chat) => {
      queryClient.setQueryData(['chat', chatId], chat);
      invalidateChatListQueries(queryClient, chatId);
    },
  });
}

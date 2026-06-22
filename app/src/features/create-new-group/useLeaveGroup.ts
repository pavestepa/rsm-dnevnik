import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useLeaveGroup(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => chatApi.leaveGroup(chatId),
    onSuccess: () => {
      invalidateChatListQueries(queryClient, chatId);
    },
  });
}

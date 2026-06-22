import { patchChatUnreadCount } from '@/entities/chat';
import { chatApi } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useMarkChatRead(chatId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId?: string) => chatApi.markRead(chatId!, messageId),
    onSuccess: (data) => {
      if (chatId) {
        patchChatUnreadCount(queryClient, chatId, data.unreadCount);
      }
    },
  });
}

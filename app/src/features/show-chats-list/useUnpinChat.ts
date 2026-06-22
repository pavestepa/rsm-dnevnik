import { chatApi } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUnpinChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatApi.unpin(chatId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

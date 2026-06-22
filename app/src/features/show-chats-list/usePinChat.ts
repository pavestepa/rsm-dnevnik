import { chatApi } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function usePinChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatApi.pin(chatId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

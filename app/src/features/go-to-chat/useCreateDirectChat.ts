import { chatApi } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateDirectChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) => chatApi.createDirect(participantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

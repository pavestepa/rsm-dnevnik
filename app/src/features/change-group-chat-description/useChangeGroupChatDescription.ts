import { useMutation } from '@tanstack/react-query';

export function useChangeGroupChatDescription() {
  return useMutation({
    mutationFn: async (_payload: { chatId: string; description: string }) => {
      throw new Error('changeGroupChatDescription is not implemented');
    },
  });
}

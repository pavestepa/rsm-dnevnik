import { useMutation } from '@tanstack/react-query';

export function useChangeGroupChatMainImage() {
  return useMutation({
    mutationFn: async (_payload: { chatId: string; mediaId: string }) => {
      throw new Error('changeGroupChatMainImage is not implemented');
    },
  });
}

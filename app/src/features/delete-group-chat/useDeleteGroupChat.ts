import { useMutation } from '@tanstack/react-query';

export function useDeleteGroupChat() {
  return useMutation({
    mutationFn: async (_chatId: string) => {
      throw new Error('deleteGroupChat is not implemented');
    },
  });
}

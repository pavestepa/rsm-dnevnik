import { useMutation } from '@tanstack/react-query';

export function useDeleteMessageForMe() {
  return useMutation({
    mutationFn: async (_messageId: string) => {
      throw new Error('deleteMessageForMe is not implemented');
    },
  });
}

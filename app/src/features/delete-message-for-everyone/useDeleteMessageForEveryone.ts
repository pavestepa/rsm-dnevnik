import { useMutation } from '@tanstack/react-query';

export function useDeleteMessageForEveryone() {
  return useMutation({
    mutationFn: async (_messageId: string) => {
      throw new Error('deleteMessageForEveryone is not implemented');
    },
  });
}

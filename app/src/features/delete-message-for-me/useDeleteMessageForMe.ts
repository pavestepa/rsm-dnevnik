import { messageApi, type MessagesQueryData } from '@/entities/message';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteMessageForMe(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messageApi.deleteForMe(chatId, messageId),
    onSuccess: (_result, messageId) => {
      queryClient.setQueryData<MessagesQueryData>(
        ['messages', chatId],
        (current: MessagesQueryData | undefined) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.id !== messageId),
            })),
          };
        },
      );
    },
  });
}

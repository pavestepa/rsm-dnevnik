import { messageApi, type Message, type MessagesQueryData } from '@/entities/message';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteMessageForEveryone(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      messageApi.deleteForEveryone(chatId, messageId),
    onSuccess: (message: Message) => {
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
              items: page.items.map((item) => (item.id === message.id ? message : item)),
            })),
          };
        },
      );
    },
  });
}

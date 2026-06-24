import { patchChatListOnNewMessage } from '@/features/stream-chats-list/lib/patch-chat-list-on-message';
import { messageApi, type MessagesQueryData } from '@/entities/message';
import { useAuthStore } from '@/entities/session';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSendMessage(chatId: string | undefined) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (text: string) =>
      messageApi.send(chatId!, {
        type: 'text',
        text: text.trim(),
      }),
    onSuccess: (message) => {
      if (!chatId) {
        return;
      }

      queryClient.setQueryData<MessagesQueryData>(
        ['messages', chatId],
        (current: MessagesQueryData | undefined) => {
        if (!current) {
          return current;
        }

        const exists = current.pages.some((page) =>
          page.items.some((item) => item.id === message.id),
        );
        if (exists) {
          return current;
        }

        const pages = [...current.pages];
        const lastPage = pages[pages.length - 1];
        pages[pages.length - 1] = {
          ...lastPage,
          items: [...lastPage.items, message],
        };

        return { ...current, pages };
      },
      );

      patchChatListOnNewMessage(queryClient, message, currentUserId);
    },
  });
}

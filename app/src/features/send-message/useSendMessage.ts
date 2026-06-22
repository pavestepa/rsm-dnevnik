import { patchChatListOnNewMessage } from '@/entities/chat';
import { messageApi } from '@/entities/message';
import { useAuthStore } from '@/entities/session';
import type { InfiniteData } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type MessagesPage = Awaited<ReturnType<typeof messageApi.list>>;
type MessagesInfinite = InfiniteData<MessagesPage, string | undefined>;

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

      queryClient.setQueryData<MessagesInfinite>(['messages', chatId], (current) => {
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
      });

      patchChatListOnNewMessage(queryClient, message, currentUserId);
    },
  });
}

import { patchChatListOnNewMessage } from '@/entities/chat';
import { getSharedChatSocket } from '@/shared/lib/socket/chat-socket';
import { messageApi } from '@/entities/message';
import { useAuthStore } from '@/entities/session';
import type { Message, MessageDeletedEvent, MessageStatusEvent } from '@/entities/message';
import { type InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const PAGE_SIZE = 40;

type MessagesPage = Awaited<ReturnType<typeof messageApi.list>>;
type MessagesInfinite = InfiniteData<MessagesPage, string | undefined>;

export function useMessages(chatId: string | undefined) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const query = useInfiniteQuery<
    MessagesPage,
    Error,
    InfiniteData<MessagesPage, string | undefined>,
    (string | undefined)[],
    string | undefined
  >({
    queryKey: ['messages', chatId],
    enabled: Boolean(chatId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      messageApi.list(chatId!, {
        cursor: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });

  useEffect(() => {
    if (!chatId) {
      return;
    }

    const socket = getSharedChatSocket();
    if (!socket) {
      return;
    }

    const appendMessage = (message: Message) => {
      if (message.chatId !== chatId) {
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
    };

    const updateMessage = (message: Message) => {
      if (message.chatId !== chatId) {
        return;
      }

      queryClient.setQueryData<MessagesInfinite>(['messages', chatId], (current) => {
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
      });
    };

    const updateStatus = (payload: MessageStatusEvent) => {
      if (payload.chatId !== chatId) {
        return;
      }

      queryClient.setQueryData<MessagesInfinite>(['messages', chatId], (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === payload.messageId ? { ...item, status: payload.status } : item,
            ),
          })),
        };
      });
    };

    const removeMessage = (payload: MessageDeletedEvent) => {
      if (payload.chatId !== chatId) {
        return;
      }

      queryClient.setQueryData<MessagesInfinite>(['messages', chatId], (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== payload.messageId),
          })),
        };
      });
    };

    socket.on('message:new', appendMessage);
    socket.on('message:updated', updateMessage);
    socket.on('message:status', updateStatus);
    socket.on('message:deleted', removeMessage);

    return () => {
      socket.off('message:new', appendMessage);
      socket.off('message:updated', updateMessage);
      socket.off('message:status', updateStatus);
      socket.off('message:deleted', removeMessage);
    };
  }, [chatId, currentUserId, queryClient, query.data]);

  return query;
}

export function flattenMessages(
  data: InfiniteData<MessagesPage, string | undefined> | undefined,
): Message[] {
  if (!data) {
    return [];
  }

  return data.pages
    .slice()
    .reverse()
    .flatMap((page) => page.items);
}

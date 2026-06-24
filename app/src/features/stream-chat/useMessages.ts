import { patchChatListOnNewMessage } from '@/features/stream-chats-list/lib/patch-chat-list-on-message';
import { getSharedChatSocket } from '@/shared/lib/socket/chat-socket';
import {
  messageApi,
  type Message,
  type MessageDeletedEvent,
  type MessageHiddenEvent,
  type MessageStatusEvent,
  type MessagesQueryData,
  type MessagesQueryPage,
} from '@/entities/message';
import { useAuthStore } from '@/entities/session';
import {
  type QueryClient,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';

const PAGE_SIZE = 40;

function patchMessagesCache(
  queryClient: QueryClient,
  chatId: string,
  updater: (current: MessagesQueryData) => MessagesQueryData,
): void {
  queryClient.setQueryData<MessagesQueryData>(
    ['messages', chatId],
    (current: MessagesQueryData | undefined) => {
      if (!current) {
        return current;
      }

      return updater(current);
    },
  );
}

export function useMessages(chatId: string | undefined) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const query = useInfiniteQuery<
    MessagesQueryPage,
    Error,
    MessagesQueryData,
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

      patchMessagesCache(queryClient, chatId, (current) => {
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

      patchMessagesCache(queryClient, chatId, (current) => ({
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.id === message.id ? message : item)),
        })),
      }));
    };

    const updateStatus = (payload: MessageStatusEvent) => {
      if (payload.chatId !== chatId) {
        return;
      }

      patchMessagesCache(queryClient, chatId, (current) => ({
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            item.id === payload.messageId ? { ...item, status: payload.status } : item,
          ),
        })),
      }));
    };

    const patchDeletedMessage = (message: MessageDeletedEvent) => {
      if (message.chatId !== chatId) {
        return;
      }

      updateMessage(message);
    };

    const hideMessage = (payload: MessageHiddenEvent) => {
      if (payload.chatId !== chatId) {
        return;
      }

      patchMessagesCache(queryClient, chatId, (current) => ({
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.id !== payload.messageId),
        })),
      }));
    };

    socket.on('message:new', appendMessage);
    socket.on('message:updated', updateMessage);
    socket.on('message:status', updateStatus);
    socket.on('message:deleted', patchDeletedMessage);
    socket.on('message:hidden', hideMessage);

    return () => {
      socket.off('message:new', appendMessage);
      socket.off('message:updated', updateMessage);
      socket.off('message:status', updateStatus);
      socket.off('message:deleted', patchDeletedMessage);
      socket.off('message:hidden', hideMessage);
    };
  }, [chatId, currentUserId, queryClient, query.data]);

  return query;
}

export function flattenMessages(
  data: MessagesQueryData | undefined,
): Message[] {
  if (!data) {
    return [];
  }

  return data.pages
    .slice()
    .reverse()
    .flatMap((page) => page.items);
}

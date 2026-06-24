import { patchChatListOnNewMessage } from '@/features/stream-chats-list/lib/patch-chat-list-on-message';
import { messageApi } from '@/entities/message';
import { useAuthStore } from '@/entities/session';
import { flattenMessages, useMessages } from '@/features/stream-chat/useMessages';
import { getSharedChatSocket } from '@/shared/lib/socket/chat-socket';
import { makeMessage, renderHookWithProviders } from '@/shared/test';

jest.mock('@/features/stream-chats-list/lib/patch-chat-list-on-message', () => ({
  patchChatListOnNewMessage: jest.fn(),
}));

jest.mock('@/entities/message', () => ({
  messageApi: {
    list: jest.fn(),
  },
}));

jest.mock('@/entities/session', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/shared/lib/socket/chat-socket', () => ({
  getSharedChatSocket: jest.fn(),
}));

const mockedMessageApi = messageApi as jest.Mocked<typeof messageApi>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockedGetSharedChatSocket = getSharedChatSocket as jest.Mock;

describe('useMessages', () => {
  let handlers: Record<string, (...args: unknown[]) => void>;
  let socket: { on: jest.Mock; off: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {};
    socket = {
      on: jest.fn((event, handler) => {
        handlers[event] = handler;
      }),
      off: jest.fn(),
    };
    mockedGetSharedChatSocket.mockReturnValue(socket);
    mockedUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ user: { id: 'user-1' } }),
    );
    mockedMessageApi.list.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
    });
  });

  it('patches tombstone on message:deleted instead of removing item', () => {
    const { queryClient } = renderHookWithProviders(() => useMessages('chat-1'));

    queryClient.setQueryData(['messages', 'chat-1'], {
      pages: [
        {
          items: [makeMessage({ id: 'msg-1', text: 'secret' })],
          nextCursor: null,
          hasMore: false,
        },
      ],
      pageParams: [undefined],
    });

    handlers['message:deleted']?.(
      makeMessage({
        id: 'msg-1',
        chatId: 'chat-1',
        text: null,
        isDeleted: true,
        deletedForEveryone: true,
      }),
    );

    const cached = queryClient.getQueryData(['messages', 'chat-1']) as {
      pages: { items: { id: string; isDeleted?: boolean; text: string | null }[] }[];
    };

    expect(cached.pages[0].items).toHaveLength(1);
    expect(cached.pages[0].items[0].isDeleted).toBe(true);
    expect(cached.pages[0].items[0].text).toBeNull();
  });

  it('removes message from cache on message:hidden', () => {
    const { queryClient } = renderHookWithProviders(() => useMessages('chat-1'));

    queryClient.setQueryData(['messages', 'chat-1'], {
      pages: [
        {
          items: [
            makeMessage({ id: 'msg-1' }),
            makeMessage({ id: 'msg-2' }),
          ],
          nextCursor: null,
          hasMore: false,
        },
      ],
      pageParams: [undefined],
    });

    handlers['message:hidden']?.({ chatId: 'chat-1', messageId: 'msg-1' });

    const cached = queryClient.getQueryData(['messages', 'chat-1']) as {
      pages: { items: { id: string }[] }[];
    };

    expect(cached.pages[0].items).toHaveLength(1);
    expect(cached.pages[0].items[0].id).toBe('msg-2');
  });

  it('ignores socket events for other chats', () => {
    const { queryClient } = renderHookWithProviders(() => useMessages('chat-1'));

    queryClient.setQueryData(['messages', 'chat-1'], {
      pages: [{ items: [makeMessage({ id: 'msg-1' })], nextCursor: null, hasMore: false }],
      pageParams: [undefined],
    });

    handlers['message:hidden']?.({ chatId: 'chat-2', messageId: 'msg-1' });

    const cached = queryClient.getQueryData(['messages', 'chat-1']) as {
      pages: { items: unknown[] }[];
    };

    expect(cached.pages[0].items).toHaveLength(1);
  });
});

describe('flattenMessages', () => {
  it('returns messages in chronological order across pages', () => {
    const data = {
      pages: [
        {
          items: [makeMessage({ id: 'msg-2', createdAt: '2026-01-02T10:00:00.000Z' })],
          nextCursor: null,
          hasMore: false,
        },
        {
          items: [makeMessage({ id: 'msg-1', createdAt: '2026-01-01T10:00:00.000Z' })],
          nextCursor: 'msg-2',
          hasMore: true,
        },
      ],
      pageParams: [undefined, 'msg-2'],
    };

    expect(flattenMessages(data).map((message) => message.id)).toEqual(['msg-1', 'msg-2']);
  });
});

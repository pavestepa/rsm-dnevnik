import { patchChatListOnNewMessage } from '@/features/stream-chats-list/lib/patch-chat-list-on-message';
import { patchChatUnreadCount } from '@/entities/chat';
import { getChatSocket } from '@/shared/lib/socket/chat-socket';
import { queryClient } from '@/shared/lib/query-client';
import { useAuthStore } from '@/entities/session';
import { useStreamChatsList } from '@/features/stream-chats-list/useStreamChatsList';
import { makeMessage, renderHookWithProviders } from '@/shared/test';

jest.mock('@/features/stream-chats-list/lib/patch-chat-list-on-message', () => ({
  patchChatListOnNewMessage: jest.fn(),
}));

jest.mock('@/features/stream-chats-list/lib/patch-message-status', () => ({
  patchMessageStatus: jest.fn(),
}));

jest.mock('@/entities/chat', () => ({
  patchChatUnreadCount: jest.fn(),
  patchChatPresence: jest.fn(),
}));

jest.mock('@/shared/lib/query-client', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
}));

jest.mock('@/shared/lib/socket/chat-socket', () => ({
  getChatSocket: jest.fn(),
}));

jest.mock('@/entities/session', () => ({
  useAuthStore: jest.fn(),
}));

const mockedGetChatSocket = getChatSocket as jest.Mock;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('useStreamChatsList', () => {
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
    mockedGetChatSocket.mockReturnValue(socket);
    mockedUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        accessToken: 'token',
        isAuthenticated: true,
        user: { id: 'user-1' },
      }),
    );
  });

  it('patches cache on message:new instead of full invalidate', () => {
    renderHookWithProviders(() => useStreamChatsList());

    const message = makeMessage();

    handlers['message:new']?.(message);

    expect(patchChatListOnNewMessage).toHaveBeenCalledWith(
      queryClient,
      message,
      'user-1',
    );
  });

  it('patches unread count on chat:updated payload', () => {
    renderHookWithProviders(() => useStreamChatsList());

    handlers['chat:updated']?.({ chatId: 'chat-1', unreadCount: 0 });

    expect(patchChatUnreadCount).toHaveBeenCalledWith(queryClient, 'chat-1', 0);
  });

  it('invalidates chats on chat:deleted', () => {
    renderHookWithProviders(() => useStreamChatsList());

    handlers['chat:deleted']?.({ chatId: 'chat-1' });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['chats'] });
  });
});

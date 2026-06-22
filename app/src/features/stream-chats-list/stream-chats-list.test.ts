import { patchChatListOnNewMessage, patchChatUnreadCount } from '@/entities/chat';
import { getChatSocket } from '@/shared/lib/socket/chat-socket';
import { useAuthStore } from '@/entities/session';
import { useStreamChatsList } from '@/features/stream-chats-list/useStreamChatsList';
import { makeChatListItem, makeMessage, renderHookWithProviders } from '@/shared/test';

jest.mock('@/entities/chat', () => ({
  patchChatListOnNewMessage: jest.fn(),
  patchChatUnreadCount: jest.fn(),
  patchChatPresence: jest.fn(),
  patchMessageStatus: jest.fn(),
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
    const { queryClient } = renderHookWithProviders(() => useStreamChatsList());

    queryClient.setQueryData(['chats'], [makeChatListItem()]);
    const message = makeMessage();

    handlers['message:new']?.(message);

    expect(patchChatListOnNewMessage).toHaveBeenCalledWith(
      queryClient,
      message,
      'user-1',
    );
  });

  it('patches unread count on chat:updated payload', () => {
    const { queryClient } = renderHookWithProviders(() => useStreamChatsList());

    handlers['chat:updated']?.({ chatId: 'chat-1', unreadCount: 0 });

    expect(patchChatUnreadCount).toHaveBeenCalledWith(queryClient, 'chat-1', 0);
  });
});

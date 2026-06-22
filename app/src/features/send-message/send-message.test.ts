import { patchChatListOnNewMessage } from '@/entities/chat';
import { messageApi } from '@/entities/message';
import { useAuthStore } from '@/entities/session';
import { useSendMessage } from '@/features/send-message/useSendMessage';
import { makeMessage, renderHookWithProviders, waitFor } from '@/shared/test';

jest.mock('@/entities/chat', () => ({
  patchChatListOnNewMessage: jest.fn(),
}));

jest.mock('@/entities/message', () => ({
  messageApi: {
    send: jest.fn(),
  },
}));

jest.mock('@/entities/session', () => ({
  useAuthStore: jest.fn(),
}));

const mockedMessageApi = messageApi as jest.Mocked<typeof messageApi>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('useSendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ user: { id: 'user-1' } }),
    );
  });

  it('optimistically updates messages cache and chat list', async () => {
    const message = makeMessage({ id: 'msg-new', text: 'Hi' });
    mockedMessageApi.send.mockResolvedValue(message);

    const { result, queryClient } = renderHookWithProviders(() =>
      useSendMessage('chat-1'),
    );

    queryClient.setQueryData(['messages', 'chat-1'], {
      pages: [{ items: [], nextCursor: null }],
      pageParams: [undefined],
    });

    await result.current.mutateAsync('Hi');

    const cache = queryClient.getQueryData<{ pages: Array<{ items: unknown[] }> }>([
      'messages',
      'chat-1',
    ]);
    expect(cache?.pages[0].items).toHaveLength(1);
    expect(patchChatListOnNewMessage).toHaveBeenCalledWith(
      queryClient,
      message,
      'user-1',
    );
  });
});

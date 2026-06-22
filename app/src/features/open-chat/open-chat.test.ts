import { chatApi, patchChatUnreadCount } from '@/entities/chat';
import { useMarkChatRead } from '@/features/open-chat/useMarkChatRead';
import { renderHookWithProviders, waitFor } from '@/shared/test';

jest.mock('@/entities/chat', () => ({
  chatApi: {
    markRead: jest.fn(),
  },
  patchChatUnreadCount: jest.fn(),
}));

const mockedChatApi = chatApi as jest.Mocked<typeof chatApi>;

describe('useMarkChatRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('patches unread count after mark read succeeds', async () => {
    mockedChatApi.markRead.mockResolvedValue({ unreadCount: 0 });

    const { result, queryClient } = renderHookWithProviders(() =>
      useMarkChatRead('chat-1'),
    );

    await result.current.mutateAsync(undefined);

    expect(mockedChatApi.markRead).toHaveBeenCalledWith('chat-1', undefined);
    expect(patchChatUnreadCount).toHaveBeenCalledWith(queryClient, 'chat-1', 0);
  });
});

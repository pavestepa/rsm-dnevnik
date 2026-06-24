import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import { useDeleteGroupChat } from '@/features/delete-group-chat/useDeleteGroupChat';
import { renderHookWithProviders } from '@/shared/test';

jest.mock('@/entities/chat', () => ({
  chatApi: {
    deleteGroup: jest.fn(),
  },
  invalidateChatListQueries: jest.fn(),
}));

const mockedChatApi = chatApi as jest.Mocked<typeof chatApi>;

describe('useDeleteGroupChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes group and clears related cache', async () => {
    mockedChatApi.deleteGroup.mockResolvedValue({ success: true });

    const { result, queryClient } = renderHookWithProviders(() =>
      useDeleteGroupChat('chat-1'),
    );

    queryClient.setQueryData(['chat', 'chat-1'], { id: 'chat-1' });
    queryClient.setQueryData(['messages', 'chat-1'], { pages: [] });

    await result.current.mutateAsync();

    expect(mockedChatApi.deleteGroup).toHaveBeenCalledWith('chat-1');
    expect(queryClient.getQueryData(['chat', 'chat-1'])).toBeUndefined();
    expect(invalidateChatListQueries).toHaveBeenCalledWith(queryClient, 'chat-1');
  });
});

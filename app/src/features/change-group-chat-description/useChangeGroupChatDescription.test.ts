import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import { useChangeGroupChatDescription } from '@/features/change-group-chat-description/useChangeGroupChatDescription';
import { renderHookWithProviders } from '@/shared/test';

jest.mock('@/entities/chat', () => ({
  chatApi: {
    updateGroup: jest.fn(),
  },
  invalidateChatListQueries: jest.fn(),
}));

const mockedChatApi = chatApi as jest.Mocked<typeof chatApi>;

describe('useChangeGroupChatDescription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates group description and refreshes cache', async () => {
    const updatedChat = { id: 'chat-1', description: 'New description' };
    mockedChatApi.updateGroup.mockResolvedValue(updatedChat as never);

    const { result, queryClient } = renderHookWithProviders(() =>
      useChangeGroupChatDescription('chat-1'),
    );

    await result.current.mutateAsync('New description');

    expect(mockedChatApi.updateGroup).toHaveBeenCalledWith('chat-1', {
      description: 'New description',
    });
    expect(queryClient.getQueryData(['chat', 'chat-1'])).toEqual(updatedChat);
    expect(invalidateChatListQueries).toHaveBeenCalledWith(queryClient, 'chat-1');
  });
});

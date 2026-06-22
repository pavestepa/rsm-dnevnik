import { chatApi } from '@/entities/chat';
import { useChats } from '@/features/show-chats-list/useChats';
import { usePinChat } from '@/features/show-chats-list/usePinChat';
import { makeChatListItem, renderHookWithProviders, waitFor } from '@/shared/test';

jest.mock('@/entities/chat', () => ({
  chatApi: {
    list: jest.fn(),
    pin: jest.fn(),
  },
  patchChatUnreadCount: jest.fn(),
  patchChatListOnNewMessage: jest.fn(),
  patchChatPresence: jest.fn(),
  patchMessageStatus: jest.fn(),
}));

const mockedChatApi = chatApi as jest.Mocked<typeof chatApi>;

describe('show-chats-list hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('useChats uses query key with normalized search', async () => {
    mockedChatApi.list.mockResolvedValue([makeChatListItem()]);

    const { result } = renderHookWithProviders(() => useChats('  alice  '));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedChatApi.list).toHaveBeenCalledWith('alice');
  });

  it('usePinChat invalidates chats query on success', async () => {
    mockedChatApi.pin.mockResolvedValue(makeChatListItem({ isPinned: true }));

    const { result, queryClient } = renderHookWithProviders(() => usePinChat());
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await result.current.mutateAsync('chat-1');

    expect(mockedChatApi.pin).toHaveBeenCalledWith('chat-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chats'] });
  });
});

import { messageApi } from '@/entities/message';
import { useDeleteMessageForMe } from '@/features/delete-message-for-me/useDeleteMessageForMe';
import { renderHookWithProviders } from '@/shared/test';

jest.mock('@/entities/message', () => ({
  messageApi: {
    deleteForMe: jest.fn(),
  },
}));

const mockedMessageApi = messageApi as jest.Mocked<typeof messageApi>;

describe('useDeleteMessageForMe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('removes message from cache', async () => {
    mockedMessageApi.deleteForMe.mockResolvedValue({ success: true });

    const { result, queryClient } = renderHookWithProviders(() =>
      useDeleteMessageForMe('chat-1'),
    );

    queryClient.setQueryData(['messages', 'chat-1'], {
      pages: [
        {
          items: [
            { id: 'msg-1', text: 'hello' },
            { id: 'msg-2', text: 'world' },
          ],
          nextCursor: null,
          hasMore: false,
        },
      ],
      pageParams: [undefined],
    });

    await result.current.mutateAsync('msg-1');

    const cached = queryClient.getQueryData(['messages', 'chat-1']) as {
      pages: { items: { id: string }[] }[];
    };
    expect(cached.pages[0].items).toHaveLength(1);
    expect(cached.pages[0].items[0].id).toBe('msg-2');
  });
});

import { messageApi } from '@/entities/message';
import { useDeleteMessageForEveryone } from '@/features/delete-message-for-everyone/useDeleteMessageForEveryone';
import { renderHookWithProviders } from '@/shared/test';

jest.mock('@/entities/message', () => ({
  messageApi: {
    deleteForEveryone: jest.fn(),
  },
}));

const mockedMessageApi = messageApi as jest.Mocked<typeof messageApi>;

describe('useDeleteMessageForEveryone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('patches message tombstone in cache', async () => {
    const tombstone = {
      id: 'msg-1',
      chatId: 'chat-1',
      isDeleted: true,
      text: null,
    };
    mockedMessageApi.deleteForEveryone.mockResolvedValue(tombstone as never);

    const { result, queryClient } = renderHookWithProviders(() =>
      useDeleteMessageForEveryone('chat-1'),
    );

    queryClient.setQueryData(['messages', 'chat-1'], {
      pages: [{ items: [{ id: 'msg-1', text: 'hello' }], nextCursor: null, hasMore: false }],
      pageParams: [undefined],
    });

    await result.current.mutateAsync('msg-1');

    const cached = queryClient.getQueryData(['messages', 'chat-1']) as {
      pages: { items: { id: string; isDeleted?: boolean }[] }[];
    };
    expect(cached.pages[0].items[0].isDeleted).toBe(true);
  });
});

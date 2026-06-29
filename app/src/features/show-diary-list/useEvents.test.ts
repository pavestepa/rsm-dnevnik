import { eventApi } from '@/entities/event';
import { useEvents } from '@/features/show-diary-list/useEvents';
import { renderHookWithProviders, waitFor } from '@/shared/test';

jest.mock('@/entities/event', () => ({
  eventApi: {
    list: jest.fn(),
  },
}));

const mockedEventApi = eventApi as jest.Mocked<typeof eventApi>;

describe('useEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads paginated events', async () => {
    mockedEventApi.list.mockResolvedValue({
      items: [
        {
          id: 'event-1',
          title: 'Meetup',
          bodyPreview: 'Hello',
          createdAt: '2026-06-20T10:00:00.000Z',
          updatedAt: '2026-06-20T10:00:00.000Z',
          author: { id: 'u1', name: 'Alice', avatarUrl: null },
          group: { id: 'g1', title: 'Team', avatarUrl: null },
          images: [],
          totalImages: 0,
          filesCount: 0,
          chatId: 'c1',
          chatPreview: { lastMessage: null, writerAvatars: [] },
          canEdit: true,
          canDelete: true,
        },
      ],
      nextCursor: null,
      hasMore: false,
    });

    const { result } = renderHookWithProviders(() => useEvents());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedEventApi.list).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 20,
    });
    expect(result.current.data?.pages[0].items).toHaveLength(1);
  });
});

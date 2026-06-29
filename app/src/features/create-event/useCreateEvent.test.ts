import { eventApi } from '@/entities/event';
import { queryClient } from '@/shared/lib/query-client';
import { useCreateEvent } from '@/features/create-event/useCreateEvent';
import { renderHookWithProviders, waitFor } from '@/shared/test';

jest.mock('@/entities/event', () => ({
  eventApi: {
    create: jest.fn(),
  },
}));

jest.mock('@/shared/lib/query-client', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
}));

const mockedEventApi = eventApi as jest.Mocked<typeof eventApi>;

describe('useCreateEvent', () => {
  it('creates event and invalidates list', async () => {
    mockedEventApi.create.mockResolvedValue({
      id: 'event-1',
      title: 'Meetup',
      body: 'Body',
      bodyPreview: 'Body',
      createdAt: '2026-06-20T10:00:00.000Z',
      updatedAt: '2026-06-20T10:00:00.000Z',
      author: { id: 'u1', name: 'Alice', avatarUrl: null },
      group: { id: 'g1', title: 'Team', avatarUrl: null },
      images: [],
      totalImages: 0,
      filesCount: 0,
      files: [],
      chatId: 'c1',
      chatPreview: { lastMessage: null, writerAvatars: [] },
      canEdit: true,
      canDelete: true,
    });

    const { result } = renderHookWithProviders(() => useCreateEvent());
    const invalidateSpy = jest.mocked(queryClient.invalidateQueries);

    await result.current.mutateAsync({
      groupChatId: 'g1',
      title: 'Meetup',
      body: 'Body',
    });

    expect(mockedEventApi.create).toHaveBeenCalled();
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['events'] }),
    );
  });
});

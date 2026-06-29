import { eventApi } from '@/entities/event';
import { queryClient } from '@/shared/lib/query-client';
import { useDeleteEvent } from '@/features/delete-event/useDeleteEvent';
import { renderHookWithProviders, waitFor } from '@/shared/test';

jest.mock('@/entities/event', () => ({
  eventApi: {
    delete: jest.fn(),
  },
}));

jest.mock('@/shared/lib/query-client', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
}));

const mockedEventApi = eventApi as jest.Mocked<typeof eventApi>;

describe('useDeleteEvent', () => {
  it('deletes event and invalidates list', async () => {
    mockedEventApi.delete.mockResolvedValue({ success: true });

    const { result } = renderHookWithProviders(() => useDeleteEvent());
    const invalidateSpy = jest.mocked(queryClient.invalidateQueries);

    await result.current.mutateAsync('event-1');

    expect(mockedEventApi.delete).toHaveBeenCalledWith('event-1');
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['events'] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chats'] });
  });
});

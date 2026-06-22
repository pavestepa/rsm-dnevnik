import { contactsApi } from '@/entities/contact';
import { useAddContact } from '@/features/add-new-contact/useAddContact';
import { makeContact, renderHookWithProviders, waitFor } from '@/shared/test';

jest.mock('@/entities/contact', () => ({
  contactsApi: {
    create: jest.fn(),
  },
}));

const mockedContactsApi = contactsApi as jest.Mocked<typeof contactsApi>;

describe('useAddContact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invalidates contacts query after create', async () => {
    mockedContactsApi.create.mockResolvedValue(makeContact());

    const { result, queryClient } = renderHookWithProviders(() => useAddContact());
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await result.current.mutateAsync({
      phone: '+79003333333',
      displayName: 'Charlie',
    });

    expect(mockedContactsApi.create).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['contacts'] });
  });
});

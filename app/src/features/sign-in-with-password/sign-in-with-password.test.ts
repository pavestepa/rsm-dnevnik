import { useAuthStore } from '@/entities/session';
import { useSignInWithPassword } from '@/features/sign-in-with-password/useSignInWithPassword';
import { renderHookWithProviders, waitFor } from '@/shared/test';

jest.mock('@/entities/session', () => ({
  useAuthStore: jest.fn(),
}));

const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('useSignInWithPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls auth store login mutation', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    mockedUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ login }),
    );

    const { result } = renderHookWithProviders(() => useSignInWithPassword());

    await result.current.mutateAsync({
      phoneE164: '+79001111111',
      password: 'password123',
    });

    expect(login).toHaveBeenCalledWith('+79001111111', 'password123');
  });
});

import axios from 'axios';
import {
  getAccessToken,
  refreshAccessToken,
  registerRefreshHandler,
  setAccessToken,
  setRefreshToken,
} from '@/shared/lib/auth-token';

jest.mock('@/shared/config/env', () => ({
  env: { apiUrl: 'http://localhost:3000' },
}));

describe('refreshAccessToken', () => {
  beforeEach(() => {
    setAccessToken(null);
    setRefreshToken(null);
    jest.restoreAllMocks();
  });

  it('returns new access token when refresh succeeds', async () => {
    setRefreshToken('refresh-token');

    registerRefreshHandler(async () => {
      const response = await axios.post<{ accessToken: string; refreshToken: string }>(
        'http://localhost:3000/auth/refresh',
        { refreshToken: 'refresh-token' },
      );
      setRefreshToken(response.data.refreshToken);
      return response.data.accessToken;
    });

    jest.spyOn(axios, 'post').mockResolvedValue({
      data: { accessToken: 'new-token', refreshToken: 'new-refresh' },
    });

    const token = await refreshAccessToken();

    expect(token).toBe('new-token');
    expect(getAccessToken()).toBe('new-token');
  });

  it('returns null when refresh handler is not registered', async () => {
    registerRefreshHandler(async () => null);

    await expect(refreshAccessToken()).resolves.toBeNull();
  });
});

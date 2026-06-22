import { env } from '@/shared/config/env';
import {
  getAccessToken,
  getRefreshToken,
  refreshAccessToken,
  registerRefreshHandler,
  setRefreshToken,
} from '@/shared/lib/auth-token';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

registerRefreshHandler(async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const response = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${env.apiUrl}/auth/refresh`,
    { refreshToken },
  );

  setRefreshToken(response.data.refreshToken);
  return response.data.accessToken;
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetryConfig | undefined;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const nextToken = await refreshAccessToken();

      if (nextToken) {
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return apiClient(originalRequest);
      }
    }

    const payload = error.response?.data;
    const message =
      (Array.isArray(payload?.message)
        ? payload.message.join(', ')
        : payload?.message) ??
      error.message ??
      'Request failed';

    throw new ApiError(message, status, payload);
  },
);

export const api = {
  get: <T>(url: string, config?: Parameters<typeof apiClient.get>[1]) =>
    apiClient.get<T>(url, config).then((response) => response.data),
  post: <T>(
    url: string,
    body?: unknown,
    config?: Parameters<typeof apiClient.post>[2],
  ) => apiClient.post<T>(url, body, config).then((response) => response.data),
  patch: <T>(
    url: string,
    body?: unknown,
    config?: Parameters<typeof apiClient.patch>[2],
  ) => apiClient.patch<T>(url, body, config).then((response) => response.data),
  delete: <T>(url: string, config?: Parameters<typeof apiClient.delete>[1]) =>
    apiClient.delete<T>(url, config).then((response) => response.data),
};

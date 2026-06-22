import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createTestQueryClient } from './createTestQueryClient';

export function renderHookWithProviders<T>(
  callback: () => T,
  options?: { queryClient?: QueryClient },
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return {
    queryClient,
    ...renderHook(callback, { wrapper }),
  };
}

export { waitFor };

import { userApi } from '@/entities/user';
import { useQuery } from '@tanstack/react-query';

export function useUserSearch(query: string) {
  const normalized = query.trim();

  return useQuery({
    queryKey: ['users', 'search', normalized],
    queryFn: () => userApi.search(normalized),
    enabled: normalized.length >= 2,
  });
}

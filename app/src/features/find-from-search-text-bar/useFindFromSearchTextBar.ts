import { useDebouncedValue } from '@/shared/lib/hooks/useDebouncedValue';
import { useMemo, useState } from 'react';

export function useFindFromSearchTextBar(delayMs = 300) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, delayMs);

  const isSearching = useMemo(
    () => debouncedQuery.trim().length > 0,
    [debouncedQuery],
  );

  return {
    query,
    setQuery,
    debouncedQuery,
    isSearching,
  };
}

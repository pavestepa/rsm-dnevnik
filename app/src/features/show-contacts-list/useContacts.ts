import { contactsApi } from '@/entities/contact';
import { useQuery } from '@tanstack/react-query';

export function useContacts(searchQuery?: string) {
  const normalized = searchQuery?.trim() ?? '';

  return useQuery({
    queryKey: ['contacts', normalized],
    queryFn: () => contactsApi.list(normalized || undefined),
    placeholderData: (previousData) => previousData,
  });
}

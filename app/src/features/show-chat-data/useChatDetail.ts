import { chatApi } from '@/entities/chat';
import { useQuery } from '@tanstack/react-query';

export function useChatDetail(chatId: string | undefined) {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatApi.getById(chatId!),
    enabled: Boolean(chatId),
  });
}

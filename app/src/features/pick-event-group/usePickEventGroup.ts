import { chatApi } from '@/entities/chat';
import { useQuery } from '@tanstack/react-query';

export function usePickEventGroup() {
  return useQuery({
    queryKey: ['chats', 'groups'],
    queryFn: async () => {
      const chats = await chatApi.list();
      return chats.filter((chat) => chat.type === 'group');
    },
  });
}

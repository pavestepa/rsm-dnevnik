import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import type { CreateGroupPayload } from '@/entities/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => chatApi.createGroup(payload),
    onSuccess: () => {
      invalidateChatListQueries(queryClient);
    },
  });
}

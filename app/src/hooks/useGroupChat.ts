import { chatApi } from '@/services/api';
import type { CreateGroupPayload, UpdateGroupPayload } from '@/types/group';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function invalidateChatQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  chatId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ['chats'] });

  if (chatId) {
    void queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
  }
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => chatApi.createGroup(payload),
    onSuccess: () => {
      invalidateChatQueries(queryClient);
    },
  });
}

export function useUpdateGroup(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGroupPayload) =>
      chatApi.updateGroup(chatId, payload),
    onSuccess: (chat) => {
      queryClient.setQueryData(['chat', chatId], chat);
      invalidateChatQueries(queryClient, chatId);
    },
  });
}

export function useAddParticipant(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => chatApi.addParticipant(chatId, userId),
    onSuccess: (chat) => {
      queryClient.setQueryData(['chat', chatId], chat);
      invalidateChatQueries(queryClient, chatId);
    },
  });
}

export function useRemoveParticipant(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) =>
      chatApi.removeParticipant(chatId, targetUserId),
    onSuccess: (chat) => {
      queryClient.setQueryData(['chat', chatId], chat);
      invalidateChatQueries(queryClient, chatId);
    },
  });
}

export function useUpdateParticipantRole(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetUserId,
      role,
    }: {
      targetUserId: string;
      role: 'admin' | 'member';
    }) => chatApi.updateParticipantRole(chatId, targetUserId, role),
    onSuccess: (chat) => {
      queryClient.setQueryData(['chat', chatId], chat);
      invalidateChatQueries(queryClient, chatId);
    },
  });
}

export function useLeaveGroup(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => chatApi.leaveGroup(chatId),
    onSuccess: () => {
      invalidateChatQueries(queryClient, chatId);
    },
  });
}

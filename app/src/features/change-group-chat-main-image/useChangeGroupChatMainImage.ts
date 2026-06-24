import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import { uploadAvatarImage } from '@/entities/media';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useChangeGroupChatMainImage(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: ImagePickerAsset) => {
      const avatarMediaId = await uploadAvatarImage(asset);
      return chatApi.updateGroup(chatId, { avatarMediaId });
    },
    onSuccess: (chat) => {
      queryClient.setQueryData(['chat', chatId], chat);
      invalidateChatListQueries(queryClient, chatId);
    },
  });
}

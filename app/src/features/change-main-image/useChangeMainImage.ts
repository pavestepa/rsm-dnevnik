import { uploadAvatarImage, formatUploadError } from '@/entities/media';
import { userApi } from '@/entities/user';
import { useAuthStore } from '@/entities/session';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';

export function useChangeMainImage() {
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (asset: ImagePickerAsset) => {
      const avatarMediaId = await uploadAvatarImage(asset);
      return userApi.updateMe({ avatarMediaId });
    },
    onSuccess: (user) => {
      void updateUser(user);
    },
  });
}

export { formatUploadError };

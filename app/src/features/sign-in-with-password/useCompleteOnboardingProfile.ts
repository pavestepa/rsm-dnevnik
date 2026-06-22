import { userApi } from '@/entities/user';
import { uploadAvatarImage } from '@/entities/media';
import { useAuthStore } from '@/entities/session';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';

type CompleteOnboardingProfilePayload = {
  name: string;
  bio?: string;
  avatarAsset?: ImagePickerAsset | null;
};

export function useCompleteOnboardingProfile() {
  const completeProfile = useAuthStore((state) => state.completeProfile);

  return useMutation({
    mutationFn: async ({
      name,
      bio,
      avatarAsset,
    }: CompleteOnboardingProfilePayload) => {
      let avatarMediaId: string | undefined;

      if (avatarAsset) {
        avatarMediaId = await uploadAvatarImage(avatarAsset);
      }

      const user = await userApi.updateMe({
        name,
        bio: bio || undefined,
        ...(avatarMediaId ? { avatarMediaId } : {}),
      });

      await completeProfile(user);
      return user;
    },
  });
}

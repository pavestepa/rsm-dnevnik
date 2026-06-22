import { userApi } from '@/entities/user';
import { useAuthStore } from '@/entities/session';
import { useMutation } from '@tanstack/react-query';

export function useChangeDescription() {
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (bio: string) =>
      userApi.updateMe({ bio: bio.trim() || undefined }),
    onSuccess: (user) => {
      void updateUser(user);
    },
  });
}

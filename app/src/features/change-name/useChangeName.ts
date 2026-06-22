import { userApi } from '@/entities/user';
import { useAuthStore } from '@/entities/session';
import { useMutation } from '@tanstack/react-query';

export function useChangeName() {
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (name: string) => userApi.updateMe({ name: name.trim() }),
    onSuccess: (user) => {
      void updateUser(user);
    },
  });
}

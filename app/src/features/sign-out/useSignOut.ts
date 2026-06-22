import { useAuthStore } from '@/entities/session';
import { useMutation } from '@tanstack/react-query';

export function useSignOut() {
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: () => logout(),
  });
}

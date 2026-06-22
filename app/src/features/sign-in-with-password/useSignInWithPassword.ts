import { useAuthStore } from '@/entities/session';
import { useMutation } from '@tanstack/react-query';

type SignInPayload = {
  phoneE164: string;
  password: string;
};

export function useSignInWithPassword() {
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: ({ phoneE164, password }: SignInPayload) =>
      login(phoneE164, password),
  });
}

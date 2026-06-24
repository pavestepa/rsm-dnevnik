import { useAuthStore } from '@/entities/session';
import { userApi } from '@/entities/user';
import type { User } from '@/shared/model/user';

export async function refreshSessionUser(): Promise<User> {
  const freshUser = await userApi.getMe();
  await useAuthStore.getState().updateUser(freshUser);
  return freshUser;
}

export function useRefreshSessionUser() {
  return refreshSessionUser;
}

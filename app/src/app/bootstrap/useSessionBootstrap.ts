import { refreshSessionUser } from '@/features/refresh-session-user';
import { useAuthStore } from '@/entities/session';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

export function useSessionBootstrap(): boolean {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    void hydrate()
      .then(async () => {
        const { isAuthenticated, logout } = useAuthStore.getState();

        if (!isAuthenticated) {
          return;
        }

        try {
          await refreshSessionUser();
        } catch {
          await logout();
        }
      })
      .finally(() => {
        void SplashScreen.hideAsync();
      });
  }, [hydrate]);

  return isHydrated;
}

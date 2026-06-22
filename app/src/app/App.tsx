import * as Sentry from '@sentry/react-native';
import { AppProviders } from '@/app/providers/AppProviders';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import { useAuthStore } from '@/entities/session';
import { env } from '@/shared/config/env';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    tracesSampleRate: __DEV__ ? 1 : 0.2,
  });
}

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    void hydrate().finally(() => {
      void SplashScreen.hideAsync();
    });
  }, [hydrate]);

  if (!isHydrated) {
    return null;
  }

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

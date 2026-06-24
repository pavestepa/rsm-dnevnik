import * as Sentry from '@sentry/react-native';
import { AppProviders } from '@/app/providers/AppProviders';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import { useSessionBootstrap } from '@/app/bootstrap/useSessionBootstrap';
import { env } from '@/shared/config/env';
import * as SplashScreen from 'expo-splash-screen';

if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    tracesSampleRate: __DEV__ ? 1 : 0.2,
  });
}

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const isHydrated = useSessionBootstrap();

  if (!isHydrated) {
    return null;
  }

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

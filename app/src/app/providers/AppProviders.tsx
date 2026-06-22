import { AppErrorBoundary } from '@/app/providers/AppErrorBoundary';
import { queryClient } from '@/shared/lib/query-client';
import '@/shared/i18n';
import { getNavigationTheme } from '@/shared/theme';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppShell({ children }: PropsWithChildren) {
  const { isDark } = useAppTheme();

  return (
    <NavigationContainer theme={getNavigationTheme(isDark)}>
      {Platform.OS === 'android' ? (
        <StatusBar style={isDark ? 'light' : 'dark'} />
      ) : null}
      {children}
    </NavigationContainer>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppShell>{children}</AppShell>
        </QueryClientProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

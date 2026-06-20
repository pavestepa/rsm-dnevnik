import { queryClient } from '@/lib/query-client';
import '@/i18n';
import { getNavigationTheme } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
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
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppShell>{children}</AppShell>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

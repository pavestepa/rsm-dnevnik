import { AuthNavigator } from '@/navigation/AuthNavigator';
import { MainNavigator } from '@/navigation/MainNavigator';
import { ProfileNavigator } from '@/navigation/ProfileNavigator';
import { AppLogo } from '@/components/branding/AppLogo';
import { useAuthStore } from '@/stores/auth.store';
import { brandBlue } from '@/theme/colors';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function RootNavigator() {
  const { t } = useTranslation();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const profileCompleted = useAuthStore((state) => state.profileCompleted);

  if (!isHydrated) {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <AppLogo width={120} color="#FFFFFF" />
        <Text style={styles.title}>{t('app.name')}</Text>
        <ActivityIndicator color="#FFFFFF" style={styles.loader} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (!profileCompleted) {
    return <ProfileNavigator />;
  }

  return <MainNavigator />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
  },
  loader: {
    marginTop: 8,
  },
});

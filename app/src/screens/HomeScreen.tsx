import { env } from '@/config/env';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import type { AppLocale } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ThemeMode } from '@/theme';

type HealthResponse = {
  status: string;
};

const themeOptions: ThemeMode[] = ['light', 'dark', 'system'];
const localeOptions: AppLocale[] = ['ru', 'en'];

export function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<HealthResponse>('/health'),
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
            <Text style={styles.avatarLetter}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {t('home.loggedInAs', { name: user?.name ?? '—' })}
          </Text>
          {user?.phone ? (
            <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>
              {t('home.phone', { phone: user.phone })}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('home.subtitle')}
      </Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {t('home.apiUrl', { url: env.apiUrl })}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {t('home.theme')}
        </Text>
        <View style={styles.row}>
          {themeOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => setMode(option)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    mode === option ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: mode === option ? '#FFFFFF' : colors.text,
                }}
              >
                {option === 'light'
                  ? t('home.themeLight')
                  : option === 'dark'
                    ? t('home.themeDark')
                    : t('home.themeSystem')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {t('home.language')}
        </Text>
        <View style={styles.row}>
          {localeOptions.map((locale) => (
            <Pressable
              key={locale}
              onPress={() => void i18n.changeLanguage(locale)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    i18n.language === locale ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: i18n.language === locale ? '#FFFFFF' : colors.text,
                }}
              >
                {locale.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {healthQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : healthQuery.isError ? (
          <Text style={{ color: colors.danger }}>{t('common.error')}</Text>
        ) : (
          <Text style={{ color: colors.success }}>
            Backend: {healthQuery.data?.status}
          </Text>
        )}
      </View>

      <Pressable
        onPress={() => void handleLogout()}
        disabled={loggingOut}
        style={[styles.logoutButton, { borderColor: colors.danger }]}
      >
        {loggingOut ? (
          <ActivityIndicator color={colors.danger} />
        ) : (
          <Text style={[styles.logoutText, { color: colors.danger }]}>
            {t('home.logout')}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
  },
  profilePhone: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
  },
  meta: {
    fontSize: 13,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutButton: {
    marginTop: 'auto',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

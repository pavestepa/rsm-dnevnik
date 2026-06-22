import {
  AuthFooter,
  AuthScreen,
  AuthSubtitle,
  AuthTitle,
  PrimaryButton,
} from '@/shared/ui/layout/AuthLayout';
import { AppLogo } from '@/shared/ui/logo/AppLogo';
import { brandBlue } from '@/shared/theme/colors';
import type { AuthStackScreenProps } from '@/app/navigation/types';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function WelcomeScreen({ navigation }: AuthStackScreenProps<'Welcome'>) {
  const { t } = useTranslation();

  return (
    <AuthScreen style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <AppLogo width={88} color="#FFFFFF" />
        </View>
        <AuthTitle>{t('auth.welcomeTitle')}</AuthTitle>
        <AuthSubtitle>{t('auth.welcomeSubtitle')}</AuthSubtitle>
      </View>

      <AuthFooter>
        <PrimaryButton
          label={t('auth.agreeAndContinue')}
          onPress={() => navigation.navigate('Phone')}
        />
        <Text style={styles.legal}>{t('auth.welcomeLegal')}</Text>
      </AuthFooter>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    alignSelf: 'center',
  },
  legal: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    opacity: 0.7,
  },
});

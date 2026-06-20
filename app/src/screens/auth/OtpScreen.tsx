import {
  AuthInput,
  AuthScreen,
  AuthSubtitle,
  LinkButton,
  PrimaryButton,
} from '@/components/auth/AuthLayout';
import { ApiError } from '@/api/client';
import type { AuthStackScreenProps } from '@/navigation/types';
import { useAuthStore } from '@/stores/auth.store';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

export function OtpScreen({ navigation, route }: AuthStackScreenProps<'Otp'>) {
  const { t } = useTranslation();
  const { phoneE164, formattedPhone } = route.params;
  const login = useAuthStore((state) => state.login);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (password.length < 6) {
      Alert.alert(t('auth.invalidPasswordTitle'), t('auth.invalidPasswordMessage'));
      return;
    }

    setLoading(true);
    try {
      await login(phoneE164, password);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('auth.loginFailed');
      Alert.alert(t('auth.loginFailedTitle'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <AuthSubtitle>
        {t('auth.otpSubtitle', { phone: formattedPhone })}
      </AuthSubtitle>

      <AuthInput
        value={password}
        onChangeText={setPassword}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={() => void handleLogin()}
      />

      <View style={styles.actions}>
        <LinkButton
          label={t('auth.changeNumber')}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.spacer} />
        <PrimaryButton
          label={t('auth.signIn')}
          onPress={() => void handleLogin()}
          loading={loading}
          disabled={password.length < 6}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
});

import {
  AuthScreen,
  AuthSubtitle,
  PrimaryButton,
} from '@/shared/ui/layout/AuthLayout';
import { CountryPicker } from '@/shared/ui/auth/CountryPicker';
import {
  formatPhoneDisplay,
  formatPhoneE164,
  getCountryByCode,
} from '@/shared/lib/countries';
import type { AuthStackScreenProps } from '@/app/navigation/types';
import { useOnboardingStore } from '@/entities/session';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

export function PhoneScreen({ navigation }: AuthStackScreenProps<'Phone'>) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const countryCode = useOnboardingStore((state) => state.countryCode);
  const phoneNational = useOnboardingStore((state) => state.phoneNational);
  const setCountryCode = useOnboardingStore((state) => state.setCountryCode);
  const setPhoneNational = useOnboardingStore((state) => state.setPhoneNational);
  const [submitting, setSubmitting] = useState(false);

  const country = getCountryByCode(countryCode);
  const digits = phoneNational.replace(/\D/g, '');

  const handleContinue = () => {
    if (digits.length < 10) {
      Alert.alert(t('auth.invalidPhoneTitle'), t('auth.invalidPhoneMessage'));
      return;
    }

    setSubmitting(true);
    const phoneE164 = formatPhoneE164(country.dialCode, digits);
    const formattedPhone = formatPhoneDisplay(country.dialCode, digits);

    navigation.navigate('Otp', { phoneE164, formattedPhone });
    setSubmitting(false);
  };

  return (
    <AuthScreen>
      <AuthSubtitle>{t('auth.phoneSubtitle')}</AuthSubtitle>

      <View style={styles.row}>
        <CountryPicker
          selectedCode={countryCode}
          onSelect={(selected) => setCountryCode(selected.code)}
        />
        <TextInput
          value={phoneNational}
          onChangeText={setPhoneNational}
          keyboardType="phone-pad"
          placeholder={t('auth.phonePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.phoneInput,
            {
              color: colors.text,
              borderBottomColor: colors.border,
            },
          ]}
        />
      </View>

      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {t('auth.phoneHint')}
      </Text>

      <View style={styles.actions}>
        <PrimaryButton
          label={t('auth.next')}
          onPress={handleContinue}
          loading={submitting}
          disabled={digits.length < 10}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    marginTop: 32,
    alignItems: 'flex-end',
  },
});

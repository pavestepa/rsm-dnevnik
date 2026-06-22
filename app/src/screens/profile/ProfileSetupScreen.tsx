import {
  AuthInput,
  AuthScreen,
  AuthSubtitle,
  PrimaryButton,
} from '@/shared/ui/layout/AuthLayout';
import type { ProfileStackScreenProps } from '@/app/navigation/types';
import { useOnboardingStore } from '@/entities/session';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

export function ProfileSetupScreen({
  navigation,
}: ProfileStackScreenProps<'ProfileSetup'>) {
  const { t } = useTranslation();
  const setProfileDraft = useOnboardingStore((state) => state.setProfileDraft);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  const handleContinue = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      Alert.alert(t('auth.invalidNameTitle'), t('auth.invalidNameMessage'));
      return;
    }

    setProfileDraft(trimmedName, bio.trim());
    navigation.navigate('AvatarUpload');
  };

  return (
    <AuthScreen>
      <AuthSubtitle>{t('auth.profileSubtitle')}</AuthSubtitle>

      <AuthInput
        value={name}
        onChangeText={setName}
        placeholder={t('auth.namePlaceholder')}
        autoCapitalize="words"
        maxLength={64}
      />
      <AuthInput
        value={bio}
        onChangeText={setBio}
        placeholder={t('auth.bioPlaceholder')}
        maxLength={140}
        multiline
        style={styles.bio}
      />

      <View style={styles.actions}>
        <PrimaryButton
          label={t('auth.next')}
          onPress={handleContinue}
          disabled={name.trim().length < 2}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  bio: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 32,
    alignItems: 'flex-end',
  },
});

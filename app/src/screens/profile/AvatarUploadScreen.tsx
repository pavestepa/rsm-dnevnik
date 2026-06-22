import { ApiError } from '@/shared/api/client';
import {
  AuthScreen,
  AuthSubtitle,
  LinkButton,
  PrimaryButton,
} from '@/shared/ui/layout/AuthLayout';
import { useCompleteOnboardingProfile } from '@/features/sign-in-with-password';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import type { ProfileStackScreenProps } from '@/app/navigation/types';
import { useOnboardingStore } from '@/entities/session';
import { whatsAppTeal } from '@/shared/theme/colors';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export function AvatarUploadScreen(_props: ProfileStackScreenProps<'AvatarUpload'>) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const profileName = useOnboardingStore((state) => state.profileName);
  const profileBio = useOnboardingStore((state) => state.profileBio);
  const resetOnboarding = useOnboardingStore((state) => state.reset);
  const completeProfile = useCompleteOnboardingProfile();
  const [pickedAsset, setPickedAsset] = useState<ImagePickerAsset | null>(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('auth.photoPermissionTitle'), t('auth.photoPermissionMessage'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    if (!result.canceled && result.assets[0]) {
      setPickedAsset(result.assets[0]);
    }
  };

  const finishProfile = async (avatarAsset?: ImagePickerAsset | null) => {
    try {
      await completeProfile.mutateAsync({
        name: profileName,
        bio: profileBio,
        avatarAsset,
      });
      resetOnboarding();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('auth.profileSaveFailed');
      Alert.alert(t('common.error'), message);
    }
  };

  return (
    <AuthScreen>
      <AuthSubtitle>{t('auth.avatarSubtitle')}</AuthSubtitle>

      <Pressable onPress={() => void pickImage()} style={styles.avatarWrap}>
        {pickedAsset ? (
          <Image source={{ uri: pickedAsset.uri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
            <Text style={styles.avatarIcon}>📷</Text>
            <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
              {t('auth.addPhoto')}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.actions}>
        <LinkButton
          label={t('auth.skipPhoto')}
          onPress={() => void finishProfile()}
        />
        <PrimaryButton
          label={t('auth.finish')}
          onPress={() => void finishProfile(pickedAsset)}
          loading={completeProfile.isPending}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    alignSelf: 'center',
    marginVertical: 32,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  avatarPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: whatsAppTeal,
    borderStyle: 'dashed',
  },
  avatarIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  avatarHint: {
    fontSize: 14,
  },
  actions: {
    marginTop: 'auto',
    gap: 16,
    alignItems: 'center',
    paddingBottom: 24,
  },
});

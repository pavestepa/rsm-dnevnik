import { ApiError } from '@/shared/api/client';
import { ProfileEditModal } from '@/widgets/profile-card';
import { ProfileSettingsRow } from '@/widgets/profile-card';
import { formatUploadError, useChangeMainImage } from '@/features/change-main-image';
import { useChangeDescription } from '@/features/change-description';
import { useChangeName } from '@/features/change-name';
import { useSignOut } from '@/features/sign-out';
import { useRefreshSessionUser } from '@/features/refresh-session-user';
import { resolveMediaUrl } from '@/entities/media';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { getScrollContentProps } from '@/app/navigation/nativeHeaderOptions';
import type { SettingsStackScreenProps } from '@/app/navigation/types';
import { useAuthStore } from '@/entities/session';
import { brandBlue } from '@/shared/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const APP_VERSION = '1.0.0';
const DEVELOPER_NAME = 'Разработчик: Степанов П. П.';

type EditField = 'name' | 'bio' | null;

export function SettingsScreen(_props: SettingsStackScreenProps<'Settings'>) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useRefreshSessionUser();
  const changeName = useChangeName();
  const changeDescription = useChangeDescription();
  const changeMainImage = useChangeMainImage();
  const signOut = useSignOut();

  const [editField, setEditField] = useState<EditField>(null);
  const [refreshing, setRefreshing] = useState(false);

  const displayAvatarUri = resolveMediaUrl(user?.avatarUrl ?? null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('auth.profileSaveFailed');
      Alert.alert(t('common.error'), message);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, t]);

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

    if (result.canceled || !result.assets[0]) {
      return;
    }

    try {
      await changeMainImage.mutateAsync(result.assets[0]);
      Alert.alert(t('settings.savedTitle'), t('settings.avatarSavedMessage'));
    } catch (error) {
      if (__DEV__) {
        console.error('[avatar upload]', error);
      }

      const message =
        error instanceof ApiError ? error.message : formatUploadError(error);
      Alert.alert(t('common.error'), message);
    }
  };

  const handleSaveField = async (value: string) => {
    const trimmed = value.trim();

    if (editField === 'name' && trimmed.length < 2) {
      Alert.alert(t('auth.invalidNameTitle'), t('auth.invalidNameMessage'));
      return;
    }

    try {
      if (editField === 'name') {
        await changeName.mutateAsync(trimmed);
      } else {
        await changeDescription.mutateAsync(trimmed);
      }
      setEditField(null);
      Alert.alert(t('settings.savedTitle'), t('settings.savedMessage'));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('auth.profileSaveFailed');
      Alert.alert(t('common.error'), message);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logoutTitle'), t('settings.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('home.logout'),
        style: 'destructive',
        onPress: () => {
          void signOut.mutateAsync();
        },
      },
    ]);
  };

  const scrollProps = getScrollContentProps();
  const aboutMutedColor = colors.textSecondary;
  const saving = changeName.isPending || changeDescription.isPending;
  const uploadingAvatar = changeMainImage.isPending;

  const avatarLeading = uploadingAvatar ? (
    <View style={[styles.avatarThumb, { backgroundColor: colors.card }]}>
      <ActivityIndicator color={brandBlue} size="small" />
    </View>
  ) : displayAvatarUri ? (
    <Image source={{ uri: displayAvatarUri }} style={styles.avatarThumb} />
  ) : (
    <View style={[styles.avatarThumb, { backgroundColor: colors.card }]}>
      <Text style={styles.avatarLetter}>{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
    </View>
  );

  return (
    <>
      <ScrollView
        {...scrollProps}
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <ProfileSettingsRow
            label={t('settings.photoLabel')}
            value={displayAvatarUri ? t('settings.photoSet') : undefined}
            hint={!displayAvatarUri ? t('settings.photoEmpty') : undefined}
            editable
            onEdit={() => void pickImage()}
            leading={avatarLeading}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ProfileSettingsRow
            label={t('auth.namePlaceholder')}
            value={user?.name}
            editable
            onEdit={() => setEditField('name')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ProfileSettingsRow
            label={t('auth.bioPlaceholder')}
            value={user?.bio || undefined}
            hint={!user?.bio ? t('settings.bioEmpty') : undefined}
            editable
            onEdit={() => setEditField('bio')}
          />
          {user?.phone ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <ProfileSettingsRow
                label={t('settings.phoneLabel')}
                value={user.phone}
              />
            </>
          ) : null}
        </View>

        <View style={styles.aboutBlock}>
          <Text style={[styles.aboutCaption, { color: aboutMutedColor }]}>
            {t('settings.aboutSection')}
          </Text>
          <Text style={[styles.aboutLine, { color: aboutMutedColor }]}>
            {t('app.name')} · {APP_VERSION}
          </Text>
          <Text style={[styles.aboutLine, { color: aboutMutedColor }]}>{DEVELOPER_NAME}</Text>
        </View>

        <Pressable
          onPress={handleLogout}
          disabled={signOut.isPending}
          style={[styles.logoutButton, { backgroundColor: colors.surface }]}
        >
          {signOut.isPending ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <>
              <MaterialCommunityIcons name="logout" size={22} color={colors.danger} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>
                {t('home.logout')}
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      <ProfileEditModal
        visible={editField === 'name'}
        title={t('settings.editName')}
        value={user?.name ?? ''}
        placeholder={t('auth.namePlaceholder')}
        maxLength={64}
        saving={saving}
        onClose={() => setEditField(null)}
        onSave={(value) => void handleSaveField(value)}
      />

      <ProfileEditModal
        visible={editField === 'bio'}
        title={t('settings.editBio')}
        value={user?.bio ?? ''}
        placeholder={t('auth.bioPlaceholder')}
        multiline
        maxLength={140}
        saving={saving}
        onClose={() => setEditField(null)}
        onSave={(value) => void handleSaveField(value)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    gap: 12,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  avatarThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '600',
    color: brandBlue,
  },
  aboutBlock: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 1,
  },
  aboutCaption: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.75,
    marginBottom: 2,
  },
  aboutLine: {
    fontSize: 11,
    lineHeight: 14,
    opacity: 0.65,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

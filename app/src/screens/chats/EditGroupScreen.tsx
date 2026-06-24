import { ChatAvatar } from '@/entities/chat';
import { formatUploadError } from '@/entities/media';
import { useChangeGroupChatMainImage } from '@/features/change-group-chat-main-image';
import { useDeleteGroupChat } from '@/features/delete-group-chat';
import { useUpdateGroup } from '@/features/create-new-group';
import { useChatDetail } from '@/features/show-chat-data';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import type { ChatsStackScreenProps } from '@/app/navigation/types';
import { useAuthStore } from '@/entities/session';
import { canChangeRoles } from '@/entities/chat';
import { ApiError } from '@/shared/api/client';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export function EditGroupScreen({ navigation, route }: ChatsStackScreenProps<'EditGroup'>) {
  const { chatId } = route.params;
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const chatQuery = useChatDetail(chatId);
  const updateGroup = useUpdateGroup(chatId);
  const changeMainImage = useChangeGroupChatMainImage(chatId);
  const deleteGroup = useDeleteGroupChat(chatId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (chatQuery.data) {
      setTitle(chatQuery.data.title ?? chatQuery.data.displayName);
      setDescription(chatQuery.data.description ?? '');
    }
  }, [chatQuery.data]);

  if (chatQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (chatQuery.isError || !chatQuery.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.danger }}>{t('chats.loadError')}</Text>
      </View>
    );
  }

  const chat = chatQuery.data;
  const isOwner = canChangeRoles(chat, currentUserId);
  const saving = updateGroup.isPending || changeMainImage.isPending;

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
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : formatUploadError(error);
      Alert.alert(t('common.error'), message);
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    try {
      await updateGroup.mutateAsync({
        title: trimmedTitle,
        description: description.trim() || null,
      });
      navigation.goBack();
    } catch {
      Alert.alert(t('groups.updateFailedTitle'), t('groups.updateFailedMessage'));
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(t('groups.deleteGroup'), t('groups.deleteGroupConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('groups.deleteGroup'),
        style: 'destructive',
        onPress: () => {
          void deleteGroup.mutateAsync().then(() => {
            navigation.popToTop();
          });
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => void pickImage()} style={styles.avatarWrap}>
        <ChatAvatar
          name={chat.displayName}
          avatarUrl={chat.avatarUrl}
          size={112}
        />
        {changeMainImage.isPending ? (
          <View style={styles.avatarOverlay}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : null}
      </Pressable>

      <View style={[styles.fieldCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {t('groups.titleLabel')}
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('groups.titlePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }]}
        />
      </View>

      <View style={[styles.fieldCard, { backgroundColor: colors.card, marginTop: 12 }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {t('groups.description')}
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t('groups.descriptionPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.textArea, { color: colors.text }]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <Pressable
        onPress={() => void handleSave()}
        disabled={saving || !title.trim()}
        style={({ pressed }) => [
          styles.saveButton,
          {
            backgroundColor: colors.primary,
            opacity: saving || !title.trim() ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        )}
      </Pressable>

      {isOwner ? (
        <Pressable
          onPress={handleDeleteGroup}
          disabled={deleteGroup.isPending}
          style={({ pressed }) => [
            styles.deleteButton,
            { backgroundColor: pressed ? colors.surface : colors.background },
          ]}
        >
          <Text style={[styles.deleteText, { color: colors.danger }]}>
            {t('groups.deleteGroup')}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 56,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  fieldCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    fontSize: 17,
    paddingVertical: 4,
  },
  textArea: {
    fontSize: 16,
    minHeight: 88,
    lineHeight: 22,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 16,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

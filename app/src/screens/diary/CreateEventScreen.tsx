import { EventGroupPickerModal } from '@/widgets/event-group-picker';
import { ChatAvatar } from '@/entities/chat';
import type { EventMediaInput } from '@/entities/event';
import { formatUploadError, uploadEventDocument, uploadEventImage } from '@/entities/media';
import { useCreateEvent } from '@/features/create-event';
import { usePickEventGroup } from '@/features/pick-event-group';
import type { DiaryStackScreenProps } from '@/app/navigation/types';
import { ApiError } from '@/shared/api/client';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type PendingFile = {
  uri: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
};

type DocumentPickerAsset = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

async function pickDocuments(): Promise<PendingFile[] | null> {
  try {
    const moduleName = 'expo-document-picker';
    const DocumentPicker = (await import(moduleName)) as {
      getDocumentAsync: (options: {
        copyToCacheDirectory: boolean;
        multiple: boolean;
      }) => Promise<{
        canceled: boolean;
        assets: DocumentPickerAsset[];
      }>;
    };
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (result.canceled) {
      return [];
    }

    return result.assets.map((asset) => ({
      uri: asset.uri,
      fileName: asset.name,
      mimeType: asset.mimeType,
      fileSize: asset.size,
    }));
  } catch {
    return null;
  }
}

export function CreateEventScreen({ navigation }: DiaryStackScreenProps<'CreateEvent'>) {
  const { colors } = useAppTheme();
  const groupsQuery = usePickEventGroup();
  const createEvent = useCreateEvent();

  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupTitle, setGroupTitle] = useState<string | null>(null);
  const [groupAvatarUrl, setGroupAvatarUrl] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<ImagePickerAsset[]>([]);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedGroupLabel = groupTitle ?? 'Выберите группу';

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее в настройках.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    if (result.canceled) {
      return;
    }

    setImages((current) => [...current, ...result.assets]);
  };

  const pickFiles = async () => {
    const picked = await pickDocuments();
    if (picked === null) {
      Alert.alert(
        'Документы недоступны',
        'Установите expo-document-picker для прикрепления файлов.',
      );
      return;
    }

    if (picked.length === 0) {
      return;
    }

    setFiles((current) => [...current, ...picked]);
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!groupId || !trimmedTitle || !trimmedBody) {
      return;
    }

    setSaving(true);

    try {
      const media: EventMediaInput[] = [];

      for (const image of images) {
        const mediaId = await uploadEventImage(image);
        media.push({ mediaId, kind: 'image' });
      }

      for (const file of files) {
        const mediaId = await uploadEventDocument({
          uri: file.uri,
          fileName: file.fileName,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
        });
        media.push({ mediaId, kind: 'file', fileName: file.fileName });
      }

      const event = await createEvent.mutateAsync({
        groupChatId: groupId,
        title: trimmedTitle,
        body: trimmedBody,
        media: media.length > 0 ? media : undefined,
      });

      navigation.replace('Event', { eventId: event.id });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : formatUploadError(error);
      Alert.alert('Ошибка', message);
    } finally {
      setSaving(false);
    }
  };

  const canSave = Boolean(groupId && title.trim() && body.trim()) && !saving;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => setPickerVisible(true)}
          style={[styles.fieldCard, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Группа</Text>
          <View style={styles.groupPickerRow}>
            {groupId ? (
              <ChatAvatar
                name={groupTitle ?? ''}
                avatarUrl={groupAvatarUrl}
                size={32}
              />
            ) : null}
            <Text style={[styles.groupPickerText, { color: colors.text }]}>
              {selectedGroupLabel}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={22}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>

        <View style={[styles.fieldCard, { backgroundColor: colors.card, marginTop: 12 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Заголовок</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Название записи"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text }]}
            maxLength={200}
          />
        </View>

        <View style={[styles.fieldCard, { backgroundColor: colors.card, marginTop: 12 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Фото</Text>
          <Pressable onPress={() => void pickImages()} style={styles.attachRow}>
            <MaterialCommunityIcons name="image-plus" size={22} color={colors.primary} />
            <Text style={[styles.attachText, { color: colors.primary }]}>Добавить фото</Text>
          </Pressable>
          {images.length > 0 ? (
            <View style={styles.thumbRow}>
              {images.map((image, index) => (
                <View key={`${image.uri}-${index}`} style={styles.thumbWrap}>
                  <Image source={{ uri: image.uri }} style={styles.thumb} />
                  <Pressable
                    onPress={() =>
                      setImages((current) => current.filter((_, i) => i !== index))
                    }
                    style={styles.removeThumb}
                  >
                    <MaterialCommunityIcons name="close-circle" size={20} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.fieldCard, { backgroundColor: colors.card, marginTop: 12 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Текст</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Описание записи"
            placeholderTextColor={colors.textSecondary}
            style={[styles.textArea, { color: colors.text }]}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.fieldCard, { backgroundColor: colors.card, marginTop: 12 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Файлы</Text>
          <Pressable onPress={() => void pickFiles()} style={styles.attachRow}>
            <MaterialCommunityIcons name="paperclip" size={22} color={colors.primary} />
            <Text style={[styles.attachText, { color: colors.primary }]}>Прикрепить файл</Text>
          </Pressable>
          {files.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.fileRow}>
              <MaterialCommunityIcons name="file-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                {file.fileName}
              </Text>
              <Pressable onPress={() => setFiles((current) => current.filter((_, i) => i !== index))}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => void handleSave()}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              opacity: !canSave ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Сохранить</Text>
          )}
        </Pressable>
      </ScrollView>

      <EventGroupPickerModal
        visible={pickerVisible}
        groups={groupsQuery.data ?? []}
        loading={groupsQuery.isLoading}
        onClose={() => setPickerVisible(false)}
        onSelect={(id) => {
          const group = groupsQuery.data?.find((item) => item.id === id);
          setGroupId(id);
          setGroupTitle(group?.displayName ?? null);
          setGroupAvatarUrl(group?.avatarUrl ?? null);
          setPickerVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
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
  groupPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupPickerText: {
    flex: 1,
    fontSize: 17,
  },
  input: {
    fontSize: 17,
    paddingVertical: 4,
  },
  textArea: {
    fontSize: 16,
    minHeight: 120,
    lineHeight: 22,
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  attachText: {
    fontSize: 15,
    fontWeight: '500',
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  removeThumb: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
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
});

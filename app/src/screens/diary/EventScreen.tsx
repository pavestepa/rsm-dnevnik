import { EventChatCard } from '@/widgets/event-chat-card';
import { EventFileList } from '@/widgets/event-file-list';
import { EventImageGrid } from '@/widgets/event-image-grid';
import { ChatAvatar } from '@/entities/chat';
import { formatEventDate } from '@/entities/event';
import { useDeleteEvent } from '@/features/delete-event';
import { useEventDetail } from '@/features/show-event-detail';
import type { DiaryStackScreenProps } from '@/app/navigation/types';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function EventScreen({ navigation, route }: DiaryStackScreenProps<'Event'>) {
  const { eventId } = route.params;
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const eventQuery = useEventDetail(eventId);
  const deleteEvent = useDeleteEvent();

  useLayoutEffect(() => {
    const event = eventQuery.data;
    if (!event) {
      return;
    }

    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          {event.canEdit ? (
            <Pressable
              onPress={() => navigation.navigate('EditEvent', { eventId: event.id })}
              hitSlop={12}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
            </Pressable>
          ) : null}
          {event.canDelete ? (
            <Pressable
              onPress={() => {
                Alert.alert('Удалить запись', 'Запись будет удалена безвозвратно.', [
                  { text: 'Отмена', style: 'cancel' },
                  {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: () => {
                      void deleteEvent.mutateAsync(event.id).then(() => {
                        navigation.goBack();
                      });
                    },
                  },
                ]);
              }}
              hitSlop={12}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons name="delete-outline" size={22} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }, [colors.danger, colors.primary, deleteEvent, eventQuery.data, eventId, navigation]);

  if (eventQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.danger }}>Не удалось загрузить запись</Text>
      </View>
    );
  }

  const event = eventQuery.data;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 88 + insets.bottom }]}
      >
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatEventDate(event.createdAt)}
        </Text>

        <View style={styles.groupRow}>
          <ChatAvatar
            name={event.group.title}
            avatarUrl={event.group.avatarUrl}
            size={32}
          />
          <Text style={[styles.groupTitle, { color: colors.text }]}>{event.group.title}</Text>
        </View>

        <Pressable onPress={() => {}} style={styles.authorRow}>
          <ChatAvatar name={event.author.name} avatarUrl={event.author.avatarUrl} size={36} />
          <Text style={[styles.authorName, { color: colors.text }]}>{event.author.name}</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

        {event.images.length > 0 ? (
          <EventImageGrid
            images={event.images}
            totalImages={event.totalImages}
            onImagePress={(index) =>
              navigation.navigate('EventGallery', {
                images: event.images,
                initialIndex: index,
              })
            }
          />
        ) : null}

        <Text style={[styles.body, { color: colors.text }]}>{event.body}</Text>

        <EventFileList
          files={event.files}
          onFilePress={(file) => {
            if (file.downloadUrl) {
              void Linking.openURL(file.downloadUrl);
            }
          }}
        />
      </ScrollView>

      <View
        style={[
          styles.chatBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom || 8,
          },
        ]}
      >
        <EventChatCard
          chatPreview={event.chatPreview}
          onPress={() => navigation.navigate('EventChat', { chatId: event.chatId })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  chatBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerButton: {
    padding: 4,
    marginLeft: 8,
  },
});

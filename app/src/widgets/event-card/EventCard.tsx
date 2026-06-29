import type { EventListItem } from '@/entities/event';
import { formatEventDate, truncateEventBody } from '@/entities/event';
import { ChatAvatar } from '@/entities/chat';
import { EventChatCard } from '@/widgets/event-chat-card';
import { EventImageGrid } from '@/widgets/event-image-grid';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type EventCardProps = {
  event: EventListItem;
  showDate?: boolean;
  onPressCard: () => void;
  onPressAuthor: () => void;
  onPressChat: () => void;
};

export function EventCard({
  event,
  showDate = false,
  onPressCard,
  onPressAuthor,
  onPressChat,
}: EventCardProps) {
  const { colors } = useAppTheme();
  const bodySource = event.body ?? event.bodyPreview;
  const { text, hasMore } = truncateEventBody(bodySource);

  return (
    <Pressable
      onPress={onPressCard}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {showDate ? (
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatEventDate(event.createdAt)}
        </Text>
      ) : null}

      <Pressable onPress={onPressAuthor} style={styles.groupRow}>
        <ChatAvatar
          name={event.group.title}
          avatarUrl={event.group.avatarUrl}
          size={24}
        />
        <Text style={[styles.groupTitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {event.group.title}
        </Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {event.title}
      </Text>

      {event.images.length > 0 ? (
        <EventImageGrid
          images={event.images}
          totalImages={event.totalImages}
          onImagePress={() => onPressCard()}
        />
      ) : null}

      {text ? (
        <Text style={[styles.body, { color: colors.text }]}>
          {text}
          {hasMore ? (
            <Text style={{ color: colors.primary }}> Еще</Text>
          ) : null}
        </Text>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <EventChatCard chatPreview={event.chatPreview} onPress={onPressChat} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 10,
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
    gap: 8,
  },
  groupTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
});

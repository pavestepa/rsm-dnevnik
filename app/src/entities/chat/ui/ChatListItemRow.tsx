import { ChatAvatar } from '@/entities/chat';
import { formatChatTime, formatLastMessagePreview, isGroupLikeChatType } from '@/entities/chat';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import type { ChatListItem } from '@/entities/chat';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ChatListItemRowProps = {
  chat: ChatListItem;
  currentUserId?: string;
  onPress: () => void;
  onLongPress: () => void;
};

export function ChatListItemRow({
  chat,
  currentUserId,
  onPress,
  onLongPress,
}: ChatListItemRowProps) {
  const { colors } = useAppTheme();
  const hasUnread = chat.unreadCount > 0;
  const lastMessageTime = chat.lastMessage?.createdAt ?? chat.updatedAt;
  const senderName =
    isGroupLikeChatType(chat.type) && chat.lastMessage
      ? chat.participants.find((participant) => participant.userId === chat.lastMessage?.senderId)
          ?.name
      : undefined;

  const preview = formatLastMessagePreview(
    chat.lastMessage,
    currentUserId,
    senderName,
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surface : colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <ChatAvatar
        name={chat.displayName}
        avatarUrl={chat.avatarUrl}
        isOnline={chat.type === 'direct' && chat.isOnline}
      />

      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: colors.text,
                fontWeight: hasUnread ? '700' : '600',
              },
            ]}
          >
            {chat.displayName}
          </Text>
          <View style={styles.meta}>
            {chat.isPinned ? (
              <MaterialCommunityIcons
                name="pin"
                size={14}
                color={colors.textSecondary}
                style={styles.pinIcon}
              />
            ) : null}
            <Text
              style={[
                styles.time,
                {
                  color: hasUnread ? colors.primary : colors.textSecondary,
                  fontWeight: hasUnread ? '600' : '400',
                },
              ]}
            >
              {formatChatTime(lastMessageTime)}
            </Text>
          </View>
        </View>

        <View style={styles.bottomLine}>
          <Text
            numberOfLines={1}
            style={[
              styles.preview,
              {
                color: colors.textSecondary,
                fontWeight: hasUnread ? '500' : '400',
              },
            ]}
          >
            {preview || ' '}
          </Text>
          {hasUnread ? (
            <View style={[styles.badge, { backgroundColor: colors.unreadBadge }]}>
              <Text style={[styles.badgeText, { color: colors.white }]}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinIcon: {
    transform: [{ rotate: '45deg' }],
  },
  time: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
});

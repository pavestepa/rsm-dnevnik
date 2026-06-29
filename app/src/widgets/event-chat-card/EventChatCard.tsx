import { ChatAvatar } from '@/entities/chat';
import type { EventChatPreview } from '@/entities/event';
import { truncateChatPreview } from '@/entities/event';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type EventChatCardProps = {
  chatPreview: EventChatPreview;
  onPress: () => void;
};

export function EventChatCard({ chatPreview, onPress }: EventChatCardProps) {
  const { colors } = useAppTheme();
  const avatars = chatPreview.writerAvatars.slice(0, 3);
  const previewText = truncateChatPreview(chatPreview.lastMessage?.text);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.surface : colors.card,
        },
      ]}
    >
      <View style={styles.avatars}>
        {avatars.map((author, index) => (
          <View
            key={author.id}
            style={[styles.avatarWrap, index > 0 && styles.avatarOverlap]}
          >
            <ChatAvatar name={author.name} avatarUrl={author.avatarUrl} size={28} />
          </View>
        ))}
      </View>

      <Text
        style={[styles.preview, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {previewText || 'Нет сообщений'}
      </Text>

      <MaterialCommunityIcons name="send" size={20} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOverlap: {
    marginLeft: -10,
  },
  preview: {
    flex: 1,
    fontSize: 14,
  },
});

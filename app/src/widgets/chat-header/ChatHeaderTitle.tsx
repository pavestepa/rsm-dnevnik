import { ChatAvatar } from '@/entities/chat';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import type { ChatListItem } from '@/entities/chat';
import { StyleSheet, Text, View } from 'react-native';

type ChatHeaderTitleProps = {
  chat: ChatListItem;
  subtitle?: string;
};

export function ChatHeaderTitle({ chat, subtitle }: ChatHeaderTitleProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <ChatAvatar
        name={chat.displayName}
        avatarUrl={chat.avatarUrl}
        isOnline={chat.type === 'direct' && chat.isOnline}
        size={36}
      />
      <View style={styles.textWrap}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {chat.displayName}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.chatTyping }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  textWrap: {
    flexShrink: 1,
    gap: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
});

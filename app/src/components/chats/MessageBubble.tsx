import { MessageStatusIcon } from '@/components/chats/MessageStatusIcon';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatMessageTime } from '@/lib/message-format';
import { resolveMediaUrl } from '@/lib/media-url';
import type { Message } from '@/types/message';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, View } from 'react-native';

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
  showSenderName?: boolean;
};

export function MessageBubble({ message, isOwn, showSenderName = false }: MessageBubbleProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const mediaUrl = resolveMediaUrl(message.media?.url ?? null);

  const bubbleColor = isOwn ? colors.chatBubbleOutgoing : colors.chatBubbleIncoming;
  const textColor = isOwn ? colors.chatBubbleOutgoingText : colors.chatBubbleIncomingText;
  const metaColor = isOwn ? colors.chatBubbleMetaOwn : colors.chatBubbleMeta;

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleColor,
            borderTopLeftRadius: isOwn ? 16 : 4,
            borderTopRightRadius: isOwn ? 4 : 16,
          },
        ]}
      >
        {showSenderName ? (
          <Text style={[styles.senderName, { color: colors.primary }]}>
            {message.sender.name}
          </Text>
        ) : null}

        {message.type === 'image' && mediaUrl ? (
          <Image source={{ uri: mediaUrl }} style={styles.image} resizeMode="cover" />
        ) : null}

        {message.text ? (
          <Text style={[styles.text, { color: textColor }]}>{message.text}</Text>
        ) : null}

        {message.type !== 'text' && !message.text && message.type !== 'image' ? (
          <Text style={[styles.text, { color: textColor }]}>
            {message.type === 'video' ? '🎥' : message.type === 'audio' ? '🎤' : ''}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {message.editedAt ? (
            <Text style={[styles.meta, { color: metaColor }]}>
              {`${t('chats.edited')} `}
            </Text>
          ) : null}
          <Text style={[styles.meta, { color: metaColor }]}>
            {formatMessageTime(message.createdAt)}
          </Text>
          <MessageStatusIcon status={message.status} isOwn={isOwn} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    paddingBottom: 2,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 10,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    gap: 2,
    marginTop: -2,
  },
  meta: {
    fontSize: 11,
    lineHeight: 16,
  },
});

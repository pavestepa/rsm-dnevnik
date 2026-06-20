import { useAppTheme } from '@/hooks/useAppTheme';
import { flattenMessages, useMessages } from '@/hooks/useMessages';
import { resolveMediaUrl } from '@/lib/media-url';
import type { ChatsStackScreenProps } from '@/navigation/types';
import type { Message } from '@/types/message';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function isMediaMessage(message: Message): boolean {
  return message.media !== null && (message.type === 'image' || message.type === 'video');
}

export function ChatMediaScreen({ route }: ChatsStackScreenProps<'ChatMedia'>) {
  const { chatId } = route.params;
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const messagesQuery = useMessages(chatId);

  const mediaMessages = useMemo(() => {
    return flattenMessages(messagesQuery.data).filter(isMediaMessage).reverse();
  }, [messagesQuery.data]);

  if (messagesQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={mediaMessages}
      keyExtractor={(item) => item.id}
      numColumns={3}
      contentContainerStyle={styles.grid}
      style={{ backgroundColor: colors.background }}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>{t('chats.noMedia')}</Text>
        </View>
      }
      renderItem={({ item }) => {
        const url = resolveMediaUrl(item.media?.url ?? null);

        return (
          <View style={styles.cell}>
            {url ? (
              <Image source={{ uri: url }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, { backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.textSecondary }}>
                  {item.type === 'video' ? '🎥' : '📷'}
                </Text>
              </View>
            )}
          </View>
        );
      }}
      onEndReached={() => {
        if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
          void messagesQuery.fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        messagesQuery.isFetchingNextPage ? (
          <ActivityIndicator style={styles.footer} color={colors.primary} />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  grid: {
    padding: 2,
  },
  cell: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 2,
  },
  thumb: {
    flex: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 16,
  },
});

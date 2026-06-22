import { MessageBubble } from '@/entities/message';
import { MessageComposer } from '@/entities/message';
import { MessageDateSeparator } from '@/entities/message';
import { useChatDetail } from '@/features/show-chat-data';
import { useChatRoom, useMarkChatRead } from '@/features/open-chat';
import { useSendMessage } from '@/features/send-message';
import { flattenMessages, useMessages } from '@/features/stream-chat';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { emitMessageDelivered, getSharedChatSocket } from '@/shared/lib/socket/chat-socket';
import { buildInvertedMessageListRows, type MessageListRow } from '@/entities/message';
import type { ChatsStackScreenProps } from '@/app/navigation/types';
import { useAuthStore } from '@/entities/session';
import type { TypingUpdateEvent } from '@/entities/message';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ChatScreen({ navigation, route }: ChatsStackScreenProps<'Chat'>) {
  const { chatId } = route.params;
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [draft, setDraft] = useState('');
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const markedReadRef = useRef<string | null>(null);

  const chatQuery = useChatDetail(chatId);
  useChatRoom(chatId);

  const messagesQuery = useMessages(chatId);
  const sendMessage = useSendMessage(chatId);
  const { mutateAsync: markReadAsync } = useMarkChatRead(chatId);

  const deliveredRef = useRef<Set<string>>(new Set());
  const markingReadRef = useRef<string | null>(null);

  const messages = useMemo(
    () => flattenMessages(messagesQuery.data),
    [messagesQuery.data],
  );

  const rows = useMemo(() => buildInvertedMessageListRows(messages), [messages]);

  const readCursorMessageId =
    messages.at(-1)?.id ?? chatQuery.data?.lastMessage?.id ?? null;

  const tryMarkRead = useCallback(
    async (messageId: string) => {
      if (
        markedReadRef.current === messageId ||
        markingReadRef.current === messageId
      ) {
        return;
      }

      markingReadRef.current = messageId;

      try {
        await markReadAsync(messageId);
        markedReadRef.current = messageId;
      } catch {
        // Allow retry when the screen is focused again or a new message arrives.
      } finally {
        if (markingReadRef.current === messageId) {
          markingReadRef.current = null;
        }
      }
    },
    [markReadAsync],
  );

  useFocusEffect(
    useCallback(() => {
      if (readCursorMessageId) {
        void tryMarkRead(readCursorMessageId);
      }
    }, [readCursorMessageId, tryMarkRead]),
  );

  useEffect(() => {
    if (readCursorMessageId) {
      void tryMarkRead(readCursorMessageId);
    }
  }, [readCursorMessageId, tryMarkRead]);

  useEffect(() => {
    for (const message of messages) {
      if (
        message.sender.id !== currentUserId &&
        message.status !== 'read' &&
        !deliveredRef.current.has(message.id)
      ) {
        deliveredRef.current.add(message.id);
        emitMessageDelivered(message.id);
      }
    }
  }, [currentUserId, messages]);

  useEffect(() => {
    const socket = getSharedChatSocket();
    if (!socket || !chatQuery.data) {
      return;
    }

    const chat = chatQuery.data;

    const onTyping = (payload: TypingUpdateEvent) => {
      if (payload.chatId !== chatId || payload.userId === currentUserId) {
        return;
      }

      const participant = chat.participants.find(
        (item) => item.userId === payload.userId,
      );
      const name = participant?.name ?? '';

      setTypingNames((current) => {
        if (payload.isTyping) {
          if (current.includes(name)) {
            return current;
          }
          return [...current, name];
        }

        return current.filter((item) => item !== name);
      });
    };

    socket.on('typing:update', onTyping);

    return () => {
      socket.off('typing:update', onTyping);
    };
  }, [chatId, chatQuery.data, currentUserId]);

  const typingSubtitle = useMemo(() => {
    if (typingNames.length === 0) {
      return undefined;
    }

    if (typingNames.length === 1) {
      return t('chats.typingOne', { name: typingNames[0] });
    }

    return t('chats.typingMany');
  }, [t, typingNames]);

  useEffect(() => {
    navigation.setParams({
      typingSubtitle: typingSubtitle ?? undefined,
    });
  }, [navigation, typingSubtitle]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    setDraft('');
    sendMessage.mutate(text);
  }, [draft, sendMessage]);

  const handleLoadOlder = () => {
    if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      void messagesQuery.fetchNextPage();
    }
  };

  const renderItem = ({ item }: { item: MessageListRow }) => {
    if (item.type === 'date') {
      return <MessageDateSeparator date={item.date} />;
    }

    const isOwn = item.message.sender.id === currentUserId;
    const showSenderName =
      chatQuery.data?.type === 'group' && !isOwn;

    return (
      <MessageBubble
        message={item.message}
        isOwn={isOwn}
        showSenderName={showSenderName}
      />
    );
  };

  const listFooter = messagesQuery.isFetchingNextPage ? (
    <View style={styles.loader}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  ) : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.chatWallpaper }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {messagesQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : messagesQuery.isError ? (
        <View style={styles.center}>
          <Text style={{ color: colors.danger }}>{t('chats.messagesLoadError')}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted
          onEndReached={handleLoadOlder}
          onEndReachedThreshold={0.2}
          ListFooterComponent={listFooter}
          contentContainerStyle={[
            styles.listContent,
            rows.length === 0 ? styles.emptyList : undefined,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      )}

      <View style={{ paddingBottom: insets.bottom > 0 ? 0 : 4 }}>
        <MessageComposer
          chatId={chatId}
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          sending={sendMessage.isPending}
        />
      </View>
    </KeyboardAvoidingView>
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
  listContent: {
    paddingVertical: 8,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loader: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});

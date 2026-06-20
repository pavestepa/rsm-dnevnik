import { ContactListRow } from '@/components/contacts/ContactListRow';
import { ChatListItemRow } from '@/components/chats/ChatListItem';
import { useContacts } from '@/hooks/useContacts';
import { useCreateDirectChat } from '@/hooks/useCreateDirectChat';
import { useChats, usePinChat, useUnpinChat } from '@/hooks/useChats';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAppTheme } from '@/hooks/useAppTheme';
import { contactMatchesQuery } from '@/lib/phone-normalize';
import { getScrollContentProps } from '@/navigation/nativeHeaderOptions';
import type { ChatsStackScreenProps } from '@/navigation/types';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatListItem } from '@/types/chat';
import type { Contact } from '@/types/contact';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ListItem =
  | { kind: 'chat'; id: string; chat: ChatListItem }
  | { kind: 'contact'; id: string; contact: Contact };

type ListSection = {
  title: string;
  data: ListItem[];
};

export function ChatListScreen({ navigation }: ChatsStackScreenProps<'ChatList'>) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const isSearching = debouncedQuery.trim().length > 0;

  const chatsQuery = useChats(debouncedQuery);
  const allChatsQuery = useChats('');
  const contactsQuery = useContacts(isSearching ? debouncedQuery : undefined);
  const createDirect = useCreateDirectChat();
  const pinChat = usePinChat();
  const unpinChat = useUnpinChat();

  const existingDirectPeerIds = useMemo(() => {
    const peers = new Set<string>();
    for (const chat of allChatsQuery.data ?? []) {
      if (chat.type === 'direct' && chat.peerUserId) {
        peers.add(chat.peerUserId);
      }
    }
    return peers;
  }, [allChatsQuery.data]);

  const chatSections = useMemo((): ListSection[] => {
    const chats = chatsQuery.data ?? [];
    const pinned = chats.filter((chat) => chat.isPinned);
    const recent = chats.filter((chat) => !chat.isPinned);

    const result: ListSection[] = [];

    if (pinned.length > 0) {
      result.push({
        title: t('chats.pinned'),
        data: pinned.map((chat) => ({ kind: 'chat', id: chat.id, chat })),
      });
    }

    if (recent.length > 0) {
      result.push({
        title: pinned.length > 0 ? t('chats.allChats') : '',
        data: recent.map((chat) => ({ kind: 'chat', id: chat.id, chat })),
      });
    }

    return result;
  }, [chatsQuery.data, t]);

  const searchSections = useMemo((): ListSection[] => {
    if (!isSearching) {
      return [];
    }

    const chatItems: ListItem[] = (chatsQuery.data ?? []).map((chat) => ({
      kind: 'chat',
      id: chat.id,
      chat,
    }));

    const contactItems: ListItem[] = (contactsQuery.data ?? [])
      .filter((contact) => {
        if (!contact.matchedUserId || !contact.isRegistered) {
          return false;
        }

        if (existingDirectPeerIds.has(contact.matchedUserId)) {
          return false;
        }

        return contactMatchesQuery(contact, debouncedQuery);
      })
      .map((contact) => ({
        kind: 'contact',
        id: contact.id,
        contact,
      }));

    const sections: ListSection[] = [];

    if (chatItems.length > 0) {
      sections.push({ title: t('contacts.searchChatsSection'), data: chatItems });
    }

    if (contactItems.length > 0) {
      sections.push({ title: t('contacts.searchContactsSection'), data: contactItems });
    }

    return sections;
  }, [
    chatsQuery.data,
    contactsQuery.data,
    debouncedQuery,
    existingDirectPeerIds,
    isSearching,
    t,
  ]);

  const handleLongPress = (chat: ChatListItem) => {
    Alert.alert(chat.displayName, undefined, [
      {
        text: chat.isPinned ? t('chats.unpin') : t('chats.pin'),
        onPress: () => {
          if (chat.isPinned) {
            unpinChat.mutate(chat.id);
          } else {
            pinChat.mutate(chat.id);
          }
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const openContactChat = async (contact: Contact) => {
    if (!contact.matchedUserId) {
      return;
    }

    try {
      const chat = await createDirect.mutateAsync(contact.matchedUserId);
      setSearchQuery('');
      navigation.navigate('Chat', { chatId: chat.id });
    } catch {
      Alert.alert(t('contacts.chatFailedTitle'), t('contacts.chatFailedMessage'));
    }
  };

  const scrollProps = getScrollContentProps();

  const searchHeader = (
    <View style={[styles.searchWrap, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('chats.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );

  const sections = isSearching ? searchSections : chatSections;
  const isLoading =
    (chatsQuery.isLoading && !chatsQuery.data) ||
    (isSearching && contactsQuery.isLoading && !contactsQuery.data);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : chatsQuery.isError && !chatsQuery.data ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {t('chats.loadError')}
          </Text>
        </View>
      ) : (
        <SectionList
          {...scrollProps}
          sections={sections}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          ListHeaderComponent={searchHeader}
          renderItem={({ item }) => {
            if (item.kind === 'contact') {
              return (
                <ContactListRow
                  contact={item.contact}
                  mode="single"
                  onPress={() => void openContactChat(item.contact)}
                />
              );
            }

            return (
              <ChatListItemRow
                chat={item.chat}
                currentUserId={user?.id}
                onPress={() => navigation.navigate('Chat', { chatId: item.chat.id })}
                onLongPress={() => handleLongPress(item.chat)}
              />
            );
          }}
          renderSectionHeader={({ section: { title } }) =>
            title ? (
              <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  {title}
                </Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={chatsQuery.isFetching && !chatsQuery.isLoading}
              onRefresh={() => {
                void chatsQuery.refetch();
                if (isSearching) {
                  void contactsQuery.refetch();
                }
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {isSearching ? t('chats.noResults') : t('chats.emptyTitle')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {isSearching ? t('chats.noResultsHint') : t('chats.emptySubtitle')}
              </Text>
            </View>
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

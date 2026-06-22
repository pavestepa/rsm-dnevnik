import { ContactListRow } from '@/entities/contact';
import { ChatListItemRow, type ChatListItem } from '@/entities/chat';
import type { Contact } from '@/entities/contact';
import { useContacts } from '@/features/show-contacts-list';
import { useCreateDirectChat } from '@/features/go-to-chat';
import { useChats, usePinChat, useUnpinChat } from '@/features/show-chats-list';
import { useFindFromSearchTextBar } from '@/features/find-from-search-text-bar';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { contactMatchesQuery } from '@/shared/lib/phone-normalize';
import { getScrollContentProps } from '@/app/navigation/nativeHeaderOptions';
import { useAuthStore } from '@/entities/session';
import { SearchBar } from '@/widgets/search-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type ListItem =
  | { kind: 'chat'; id: string; chat: ChatListItem }
  | { kind: 'contact'; id: string; contact: Contact };

type ListSection = {
  title: string;
  data: ListItem[];
};

type ChatListProps = {
  onOpenChat: (chatId: string) => void;
};

export function ChatList({ onOpenChat }: ChatListProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const { query: searchQuery, setQuery: setSearchQuery, debouncedQuery, isSearching } =
    useFindFromSearchTextBar();

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
      onOpenChat(chat.id);
    } catch {
      Alert.alert(t('contacts.chatFailedTitle'), t('contacts.chatFailedMessage'));
    }
  };

  const scrollProps = getScrollContentProps();
  const sections = isSearching ? searchSections : chatSections;
  const isLoading =
    (chatsQuery.isLoading && !chatsQuery.data) ||
    (isSearching && contactsQuery.isLoading && !contactsQuery.data);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (chatsQuery.isError && !chatsQuery.data) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{t('chats.loadError')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        {...scrollProps}
        sections={sections}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        ListHeaderComponent={
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('chats.searchPlaceholder')}
          />
        }
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
              onPress={() => onOpenChat(item.chat.id)}
              onLongPress={() => handleLongPress(item.chat)}
            />
          );
        }}
        renderSectionHeader={({ section: { title } }) =>
          title ? (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
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

import { AddContactModal } from '@/widgets/contact-modals';
import { ContactListRow } from '@/entities/contact';
import { useContacts } from '@/features/show-contacts-list';
import { useAddContact } from '@/features/add-new-contact';
import { useRemoveContact } from '@/features/remove-contact';
import { useSyncDeviceContacts } from '@/features/sync-device-contacts';
import { useFindFromSearchTextBar } from '@/features/find-from-search-text-bar';
import { useCreateDirectChat } from '@/features/go-to-chat';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { readDeviceContactsForSync, requestContactsPermission } from '@/entities/contact';
import { contactMatchesQuery, phonesEqual } from '@/shared/lib/phone-normalize';
import { ApiError } from '@/shared/api/client';
import { getScrollContentProps } from '@/app/navigation/nativeHeaderOptions';
import { useAuthStore } from '@/entities/session';
import type { ContactsStackScreenProps } from '@/app/navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export function ContactsScreen({ navigation }: ContactsStackScreenProps<'ContactsList'>) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const { query: searchQuery, setQuery: setSearchQuery, debouncedQuery } =
    useFindFromSearchTextBar();
  const contactsQuery = useContacts(debouncedQuery);
  const currentUserPhone = useAuthStore((state) => state.user?.phone);
  const addContact = useAddContact();
  const deleteContact = useRemoveContact();
  const syncContacts = useSyncDeviceContacts();
  const createDirect = useCreateDirectChat();

  const filteredContacts = useMemo(() => {
    const items = contactsQuery.data ?? [];
    if (!debouncedQuery.trim()) {
      return items;
    }

    return items.filter((contact) => contactMatchesQuery(contact, debouncedQuery));
  }, [contactsQuery.data, debouncedQuery]);

  const handleAddContact = async (phone: string, displayName?: string) => {
    if (currentUserPhone && phonesEqual(phone, currentUserPhone)) {
      Alert.alert(t('contacts.addSelfTitle'), t('contacts.addSelfMessage'));
      return;
    }

    const alreadyInList = (contactsQuery.data ?? []).some((contact) =>
      phonesEqual(contact.phone, phone),
    );

    if (alreadyInList) {
      Alert.alert(t('contacts.alreadyExistsTitle'), t('contacts.alreadyExistsMessage'));
      setAddModalVisible(false);
      return;
    }

    try {
      await addContact.mutateAsync({ phone, displayName });
      setAddModalVisible(false);
    } catch (error) {
      if (error instanceof ApiError) {
        const code =
          typeof error.data === 'object' &&
          error.data !== null &&
          'code' in error.data
            ? String((error.data as { code?: string }).code)
            : undefined;

        if (code === 'CONTACT_SELF' || error.message.includes('yourself')) {
          Alert.alert(t('contacts.addSelfTitle'), t('contacts.addSelfMessage'));
          return;
        }
      }

      Alert.alert(t('contacts.addFailedTitle'), t('contacts.addFailedMessage'));
    }
  };

  const handleSync = async () => {
    const granted = await requestContactsPermission();
    if (!granted) {
      Alert.alert(t('contacts.permissionTitle'), t('contacts.permissionMessage'));
      return;
    }

    try {
      const deviceContacts = await readDeviceContactsForSync();
      if (deviceContacts.length === 0) {
        Alert.alert(t('contacts.syncEmptyTitle'), t('contacts.syncEmptyMessage'));
        return;
      }

      const result = await syncContacts.mutateAsync({ contacts: deviceContacts });
      Alert.alert(
        t('contacts.syncDoneTitle'),
        t('contacts.syncDoneMessage', { count: result.synced }),
      );
    } catch {
      Alert.alert(t('contacts.syncFailedTitle'), t('contacts.syncFailedMessage'));
    }
  };

  const openChat = async (matchedUserId: string) => {
    try {
      const chat = await createDirect.mutateAsync(matchedUserId);
      navigation.getParent()?.navigate('ChatsTab', {
        screen: 'Chat',
        params: { chatId: chat.id },
      });
    } catch {
      Alert.alert(t('contacts.chatFailedTitle'), t('contacts.chatFailedMessage'));
    }
  };

  const handleContactPress = (contact: (typeof filteredContacts)[number]) => {
    if (contact.isRegistered && contact.matchedUserId) {
      void openChat(contact.matchedUserId);
      return;
    }

    Alert.alert(
      contact.displayName,
      t('contacts.notRegisteredMessage'),
      [
        {
          text: t('contacts.deleteContact'),
          style: 'destructive',
          onPress: () => void deleteContact.mutate(contact.id),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  };

  const searchHeader = (
    <View style={styles.headerBlock}>
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('contacts.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => setAddModalVisible(true)}
          style={[styles.actionChip, { backgroundColor: colors.surface }]}
        >
          <MaterialCommunityIcons name="phone-plus" size={18} color={colors.primary} />
          <Text style={[styles.actionChipText, { color: colors.primary }]}>
            {t('contacts.addButton')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void handleSync()}
          disabled={syncContacts.isPending}
          style={[styles.actionChip, { backgroundColor: colors.surface }]}
        >
          {syncContacts.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <MaterialCommunityIcons name="contacts" size={18} color={colors.primary} />
              <Text style={[styles.actionChipText, { color: colors.primary }]}>
                {t('contacts.syncButton')}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );

  const scrollProps = getScrollContentProps();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {contactsQuery.isLoading && !contactsQuery.data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          {...scrollProps}
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={searchHeader}
          renderItem={({ item }) => (
            <ContactListRow
              contact={item}
              mode="list"
              onPress={() => handleContactPress(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={contactsQuery.isFetching && !contactsQuery.isLoading}
              onRefresh={() => void contactsQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="account-multiple-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t('contacts.emptyTitle')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {t('contacts.emptySubtitle')}
              </Text>
            </View>
          }
          contentContainerStyle={filteredContacts.length === 0 ? styles.emptyContainer : undefined}
        />
      )}

      <AddContactModal
        visible={addModalVisible}
        saving={addContact.isPending}
        onClose={() => setAddModalVisible(false)}
        onSubmit={(phone, displayName) => void handleAddContact(phone, displayName)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
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
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  actionChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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

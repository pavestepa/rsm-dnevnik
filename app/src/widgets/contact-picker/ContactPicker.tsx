import { ContactListRow } from '@/entities/contact';
import { useContacts } from '@/features/show-contacts-list';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { contactMatchesQuery } from '@/shared/lib/phone-normalize';
import type { Contact } from '@/entities/contact';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

type ContactPickerProps = {
  mode: 'single' | 'multi';
  query: string;
  selectedUserIds: Set<string>;
  excludeUserIds?: string[];
  excludeChatPeerUserIds?: Set<string>;
  registeredOnly?: boolean;
  onToggle?: (contact: Contact) => void;
  onPress?: (contact: Contact) => void;
  listEmptyHint?: string;
};

export function ContactPicker({
  mode,
  query,
  selectedUserIds,
  excludeUserIds = [],
  excludeChatPeerUserIds,
  registeredOnly = mode === 'multi',
  onToggle,
  onPress,
  listEmptyHint,
}: ContactPickerProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const contactsQuery = useContacts(query);

  const excludeSet = useMemo(() => new Set(excludeUserIds), [excludeUserIds]);

  const filteredContacts = useMemo(() => {
    const items = contactsQuery.data ?? [];

    return items.filter((contact) => {
      if (registeredOnly && !contact.matchedUserId) {
        return false;
      }

      if (contact.matchedUserId && excludeSet.has(contact.matchedUserId)) {
        return false;
      }

      if (
        contact.matchedUserId &&
        excludeChatPeerUserIds?.has(contact.matchedUserId)
      ) {
        return false;
      }

      if (query.trim() && !contactMatchesQuery(contact, query)) {
        return false;
      }

      return true;
    });
  }, [
    contactsQuery.data,
    excludeChatPeerUserIds,
    excludeSet,
    query,
    registeredOnly,
  ]);

  if (contactsQuery.isLoading && !contactsQuery.data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={filteredContacts}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => {
        const isSelected = item.matchedUserId
          ? selectedUserIds.has(item.matchedUserId)
          : false;

        const handlePress = () => {
          if (mode === 'multi') {
            onToggle?.(item);
            return;
          }

          onPress?.(item);
        };

        return (
          <ContactListRow
            contact={item}
            mode={mode}
            selected={isSelected}
            onPress={handlePress}
          />
        );
      }}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {listEmptyHint ?? t('contacts.emptySearch')}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hint: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

import { ContactPicker } from '@/components/contacts/ContactPicker';
import { useAddParticipant } from '@/hooks/useGroupChat';
import { useChatDetail } from '@/hooks/useChatDetail';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ChatsStackScreenProps } from '@/navigation/types';
import type { Contact } from '@/types/contact';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AddParticipantsScreen({
  navigation,
  route,
}: ChatsStackScreenProps<'AddParticipants'>) {
  const { chatId } = route.params;
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);

  const chatQuery = useChatDetail(chatId);
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const addParticipant = useAddParticipant(chatId);

  const existingUserIds = useMemo(
    () => chatQuery.data?.participants.map((participant) => participant.userId) ?? [],
    [chatQuery.data?.participants],
  );

  const selectedUserIds = useMemo(
    () =>
      new Set(
        selectedContacts
          .map((contact) => contact.matchedUserId)
          .filter((id): id is string => Boolean(id)),
      ),
    [selectedContacts],
  );

  const toggleContact = (contact: Contact) => {
    if (!contact.matchedUserId || existingUserIds.includes(contact.matchedUserId)) {
      return;
    }

    setSelectedContacts((current) => {
      if (current.some((item) => item.matchedUserId === contact.matchedUserId)) {
        return current.filter((item) => item.matchedUserId !== contact.matchedUserId);
      }

      return [...current, contact];
    });
  };

  const handleAdd = async () => {
    const userIds = selectedContacts
      .map((contact) => contact.matchedUserId)
      .filter((id): id is string => Boolean(id));

    if (userIds.length === 0) {
      return;
    }

    try {
      for (const userId of userIds) {
        await addParticipant.mutateAsync(userId);
      }

      navigation.goBack();
    } catch {
      Alert.alert(t('groups.addFailedTitle'), t('groups.addFailedMessage'));
    }
  };

  const canAdd = selectedContacts.length > 0 && !addParticipant.isPending;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.summary, { borderBottomColor: colors.border }]}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {t('groups.selectedCount', { count: selectedContacts.length })}
        </Text>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.background }]}>
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
      </View>

      <ContactPicker
        mode="multi"
        query={debouncedQuery}
        selectedUserIds={selectedUserIds}
        excludeUserIds={existingUserIds}
        onToggle={toggleContact}
        listEmptyHint={t('contacts.emptySearch')}
      />

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => void handleAdd()}
          disabled={!canAdd}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: canAdd ? colors.primary : colors.surface,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          {addParticipant.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text
              style={[
                styles.addButtonText,
                { color: canAdd ? colors.white : colors.textSecondary },
              ]}
            >
              {t('groups.addButton')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryText: {
    fontSize: 14,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addButton: {
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

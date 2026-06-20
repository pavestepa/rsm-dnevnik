import { ContactPicker } from '@/components/contacts/ContactPicker';
import { useCreateGroup } from '@/hooks/useGroupChat';
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

export function CreateGroupScreen({
  navigation,
}: ChatsStackScreenProps<'CreateGroup'>) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const createGroup = useCreateGroup();

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
    if (!contact.matchedUserId) {
      return;
    }

    setSelectedContacts((current) => {
      if (current.some((item) => item.matchedUserId === contact.matchedUserId)) {
        return current.filter((item) => item.matchedUserId !== contact.matchedUserId);
      }

      return [...current, contact];
    });
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    const participantIds = selectedContacts
      .map((contact) => contact.matchedUserId)
      .filter((id): id is string => Boolean(id));

    if (!trimmedTitle || participantIds.length === 0) {
      return;
    }

    try {
      const chat = await createGroup.mutateAsync({
        title: trimmedTitle,
        participantIds,
      });

      navigation.replace('Chat', { chatId: chat.id });
    } catch {
      Alert.alert(t('groups.createFailedTitle'), t('groups.createFailedMessage'));
    }
  };

  const canCreate =
    title.trim().length > 0 && selectedContacts.length > 0 && !createGroup.isPending;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.formSection, { borderBottomColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {t('groups.titleLabel')}
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('groups.titlePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.titleInput, { color: colors.text, backgroundColor: colors.surface }]}
          maxLength={128}
        />
        <Text style={[styles.selectedHint, { color: colors.textSecondary }]}>
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
          onPress={() => void handleCreate()}
          disabled={!canCreate}
          style={({ pressed }) => [
            styles.createButton,
            {
              backgroundColor: canCreate ? colors.primary : colors.surface,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          {createGroup.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text
              style={[
                styles.createButtonText,
                { color: canCreate ? colors.white : colors.textSecondary },
              ]}
            >
              {t('groups.createButton')}
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
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  titleInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
  },
  selectedHint: {
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
  createButton: {
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

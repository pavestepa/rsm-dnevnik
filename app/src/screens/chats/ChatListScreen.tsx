import { ChatList } from '@/widgets/chat-list';
import { SearchBar } from '@/widgets/search-bar';
import { useFindFromSearchTextBar } from '@/features/find-from-search-text-bar';
import type { ChatsStackScreenProps } from '@/app/navigation/types';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function ChatListScreen({ navigation }: ChatsStackScreenProps<'ChatList'>) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { query, setQuery, debouncedQuery, isSearching } = useFindFromSearchTextBar();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChatList
        onOpenChat={(chatId) => navigation.navigate('Chat', { chatId })}
        searchQuery={query}
        setSearchQuery={setQuery}
        debouncedQuery={debouncedQuery}
        isSearching={isSearching}
        listHeaderComponent={
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('chats.searchPlaceholder')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

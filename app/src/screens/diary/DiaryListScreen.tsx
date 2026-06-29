import { DiaryList } from '@/widgets/diary-list';
import { SearchBar } from '@/widgets/search-bar';
import type { DiaryStackScreenProps } from '@/app/navigation/types';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export function DiaryListScreen({ navigation }: DiaryStackScreenProps<'DiaryList'>) {
  const { colors } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.chatWallpaper }]}>
      <DiaryList
        onPressEvent={(event) => navigation.navigate('Event', { eventId: event.id })}
        onPressAuthor={() => {
          // Author profile navigation can be added later.
        }}
        onPressChat={(event) =>
          navigation.navigate('EventChat', { chatId: event.chatId })
        }
        listHeaderComponent={
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Поиск записей"
            backgroundColor={colors.white}
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

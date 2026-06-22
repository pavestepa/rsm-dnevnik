import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.searchWrap, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});

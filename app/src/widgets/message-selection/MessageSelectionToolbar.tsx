import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MessageSelectionToolbarProps = {
  selectedCount: number;
  onCancel: () => void;
  onDelete: () => void;
  labels: {
    selected: string;
  };
};

export function MessageSelectionToolbar({
  selectedCount,
  onCancel,
  onDelete,
  labels,
}: MessageSelectionToolbarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Pressable onPress={onCancel} style={styles.backButton} hitSlop={12}>
          <MaterialCommunityIcons
            name={Platform.OS === 'ios' ? 'chevron-left' : 'arrow-left'}
            size={Platform.OS === 'ios' ? 32 : 24}
            color={colors.primary}
          />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>
          {labels.selected}
        </Text>
        <TouchableOpacity
          onPress={onDelete}
          disabled={selectedCount === 0}
          hitSlop={8}
          style={styles.deleteButton}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={24}
            color={selectedCount > 0 ? colors.danger : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingRight: 16,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: Platform.OS === 'ios' ? 4 : 12,
    paddingRight: 4,
    minWidth: 44,
    minHeight: 44,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
});

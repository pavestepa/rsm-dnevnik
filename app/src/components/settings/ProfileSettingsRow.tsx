import { useAppTheme } from '@/hooks/useAppTheme';
import { brandBlue } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

type ProfileSettingsRowProps = {
  label: string;
  value?: string | null;
  hint?: string;
  editable?: boolean;
  onEdit?: () => void;
  leading?: React.ReactNode;
  style?: ViewStyle;
};

export function ProfileSettingsRow({
  label,
  value,
  hint,
  editable = false,
  onEdit,
  leading,
  style,
}: ProfileSettingsRowProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.row, style]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        {value ? (
          <Text style={[styles.value, { color: colors.text }]} numberOfLines={3}>
            {value}
          </Text>
        ) : hint ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>
        ) : null}
      </View>
      {editable ? (
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          style={[styles.editButton, { backgroundColor: colors.card }]}
        >
          <MaterialCommunityIcons name="pencil-outline" size={18} color={brandBlue} />
        </Pressable>
      ) : (
        <View style={styles.editPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leading: {
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    lineHeight: 22,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  editPlaceholder: {
    width: 36,
    flexShrink: 0,
  },
});

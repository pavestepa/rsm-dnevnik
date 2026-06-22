import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { formatDateSeparator } from '@/entities/message';
import { StyleSheet, Text, View } from 'react-native';

type MessageDateSeparatorProps = {
  date: string;
};

export function MessageDateSeparator({ date }: MessageDateSeparatorProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.pill, { backgroundColor: colors.chatDatePill }]}>
        <Text style={[styles.text, { color: colors.chatDatePillText }]}>
          {formatDateSeparator(date)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

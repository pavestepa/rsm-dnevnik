import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

type CreateEventButtonProps = {
  onPress: () => void;
};

export function CreateEventButton({ onPress }: CreateEventButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 12,
    padding: 4,
  },
});

import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackHeaderBackProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Platform, Pressable, StyleSheet } from 'react-native';

export function HeaderBackButton({ canGoBack }: NativeStackHeaderBackProps) {
  const navigation = useNavigation();
  const { colors } = useAppTheme();

  if (canGoBack === false) {
    return null;
  }

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      style={styles.button}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <MaterialCommunityIcons
        name={Platform.OS === 'ios' ? 'chevron-left' : 'arrow-left'}
        size={Platform.OS === 'ios' ? 32 : 24}
        color={colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: Platform.OS === 'ios' ? 4 : 12,
    paddingRight: 4,
    minWidth: 44,
    minHeight: 44,
  },
});

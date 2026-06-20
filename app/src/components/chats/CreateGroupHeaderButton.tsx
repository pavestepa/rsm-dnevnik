import { useAppTheme } from '@/hooks/useAppTheme';
import type { ChatsStackParamList } from '@/navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet } from 'react-native';

type CreateGroupHeaderButtonProps = {
  navigation: NativeStackNavigationProp<ChatsStackParamList, 'ChatList'>;
};

export function CreateGroupHeaderButton({ navigation }: CreateGroupHeaderButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() => navigation.navigate('CreateGroup')}
      style={styles.button}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <MaterialCommunityIcons
        name="account-multiple-plus-outline"
        size={24}
        color={colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 12,
    padding: 4,
  },
});

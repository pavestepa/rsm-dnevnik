import { ChatAvatar } from '@/components/chats/ChatAvatar';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { UserSearchResult } from '@/types/group';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type UserSearchRowProps = {
  user: UserSearchResult;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function UserSearchRow({
  user,
  selected = false,
  disabled = false,
  onPress,
}: UserSearchRowProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surface : colors.background,
          borderBottomColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <ChatAvatar name={user.name} avatarUrl={user.avatarUrl} size={48} />
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
        {user.phone ? (
          <Text style={[styles.phone, { color: colors.textSecondary }]}>
            {user.phone}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
      ) : (
        <MaterialCommunityIcons
          name="checkbox-blank-circle-outline"
          size={24}
          color={colors.textSecondary}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '500',
  },
  phone: {
    fontSize: 14,
  },
});

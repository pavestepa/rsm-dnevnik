import { ChatList } from '@/widgets/chat-list';
import type { ChatsStackScreenProps } from '@/app/navigation/types';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { StyleSheet, View } from 'react-native';

export function ChatListScreen({ navigation }: ChatsStackScreenProps<'ChatList'>) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChatList onOpenChat={(chatId) => navigation.navigate('Chat', { chatId })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

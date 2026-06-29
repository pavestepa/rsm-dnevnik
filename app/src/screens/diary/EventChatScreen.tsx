import { ChatScreen } from '@/screens/chats/ChatScreen';
import type { ChatsStackScreenProps } from '@/app/navigation/types';
import type { DiaryStackScreenProps } from '@/app/navigation/types';

export function EventChatScreen(props: DiaryStackScreenProps<'EventChat'>) {
  return (
    <ChatScreen
      {...(props as unknown as ChatsStackScreenProps<'Chat'>)}
    />
  );
}

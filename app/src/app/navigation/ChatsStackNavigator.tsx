import { ChatConversationHeader } from '@/widgets/chat-header';
import { CreateGroupHeaderButton } from '@/widgets/chat-header';
import { AddParticipantsScreen } from '@/screens/chats/AddParticipantsScreen';
import { CreateGroupScreen } from '@/screens/chats/CreateGroupScreen';
import { ChatInfoScreen } from '@/screens/chats/ChatInfoScreen';
import { EditGroupScreen } from '@/screens/chats/EditGroupScreen';
import { ChatListScreen } from '@/screens/chats/ChatListScreen';
import { ChatMediaScreen } from '@/screens/chats/ChatMediaScreen';
import { ChatScreen } from '@/screens/chats/ChatScreen';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import {
  getHeaderLeadingOptions,
  getNativeStackScreenOptions,
} from '@/app/navigation/nativeHeaderOptions';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { ChatsStackParamList } from './types';

const Stack = createNativeStackNavigator<ChatsStackParamList>();

export function ChatsStackNavigator() {
  const { t } = useTranslation();
  const { isDark } = useAppTheme();

  const chatDetailOptions = getNativeStackScreenOptions({
    isDark,
    variant: 'chat',
  });

  return (
    <Stack.Navigator
      screenOptions={getNativeStackScreenOptions({ isDark, variant: 'plain' })}
    >
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={({ navigation }) => ({
          title: t('chats.title'),
          ...getHeaderLeadingOptions('logo'),
          headerRight: () => <CreateGroupHeaderButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{
          ...chatDetailOptions,
          ...getHeaderLeadingOptions('back'),
          title: t('groups.createTitle'),
        }}
      />
      <Stack.Screen
        name="AddParticipants"
        component={AddParticipantsScreen}
        options={{
          ...chatDetailOptions,
          ...getHeaderLeadingOptions('back'),
          title: t('groups.addParticipants'),
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          ...chatDetailOptions,
          header: (props) => <ChatConversationHeader {...props} />,
        }}
      />
      <Stack.Screen
        name="ChatInfo"
        component={ChatInfoScreen}
        options={{
          ...chatDetailOptions,
          ...getHeaderLeadingOptions('back'),
          title: t('chats.infoTitle'),
        }}
      />
      <Stack.Screen
        name="EditGroup"
        component={EditGroupScreen}
        options={{
          ...chatDetailOptions,
          ...getHeaderLeadingOptions('back'),
          title: t('groups.editGroup'),
        }}
      />
      <Stack.Screen
        name="ChatMedia"
        component={ChatMediaScreen}
        options={{
          ...chatDetailOptions,
          ...getHeaderLeadingOptions('back'),
          title: t('chats.mediaTitle'),
        }}
      />
    </Stack.Navigator>
  );
}

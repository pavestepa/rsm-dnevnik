import { ChatConversationHeader } from '@/widgets/chat-header';
import { CreateEventButton, DiaryFilterButton } from '@/widgets/diary-header-actions';
import { CreateEventScreen } from '@/screens/diary/CreateEventScreen';
import { DiaryListScreen } from '@/screens/diary/DiaryListScreen';
import { EditEventScreen } from '@/screens/diary/EditEventScreen';
import { EventChatScreen } from '@/screens/diary/EventChatScreen';
import { EventGalleryScreen } from '@/screens/diary/EventGalleryScreen';
import { EventScreen } from '@/screens/diary/EventScreen';
import {
  getHeaderLeadingOptions,
  getNativeStackScreenOptions,
} from '@/app/navigation/nativeHeaderOptions';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import type { DiaryStackParamList } from './types';

const Stack = createNativeStackNavigator<DiaryStackParamList>();

export function DiaryStackNavigator() {
  const { isDark } = useAppTheme();

  const detailOptions = getNativeStackScreenOptions({
    isDark,
    variant: 'chat',
  });

  return (
    <Stack.Navigator
      screenOptions={getNativeStackScreenOptions({ isDark, variant: 'plain' })}
    >
      <Stack.Screen
        name="DiaryList"
        component={DiaryListScreen}
        options={({ navigation }) => ({
          title: 'Дневник',
          headerLeft: () => (
            <DiaryFilterButton
              onPress={() => {
                Alert.alert('Фильтр', 'Фильтрация будет доступна позже.');
              }}
            />
          ),
          headerRight: () => (
            <CreateEventButton onPress={() => navigation.navigate('CreateEvent')} />
          ),
        })}
      />
      <Stack.Screen
        name="Event"
        component={EventScreen}
        options={{
          ...detailOptions,
          ...getHeaderLeadingOptions('back'),
          title: 'Запись',
        }}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{
          ...detailOptions,
          ...getHeaderLeadingOptions('back'),
          title: 'Новая запись',
        }}
      />
      <Stack.Screen
        name="EditEvent"
        component={EditEventScreen}
        options={{
          ...detailOptions,
          ...getHeaderLeadingOptions('back'),
          title: 'Редактирование',
        }}
      />
      <Stack.Screen
        name="EventChat"
        component={EventChatScreen}
        options={{
          ...detailOptions,
          header: (props) => <ChatConversationHeader {...props} />,
        }}
      />
      <Stack.Screen
        name="EventGallery"
        component={EventGalleryScreen}
        options={{
          ...detailOptions,
          ...getHeaderLeadingOptions('back'),
          title: 'Фото',
        }}
      />
    </Stack.Navigator>
  );
}

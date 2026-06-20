import { ChatsStackNavigator } from '@/navigation/ChatsStackNavigator';
import { ContactsStackNavigator } from '@/navigation/ContactsStackNavigator';
import { SettingsStackNavigator } from '@/navigation/SettingsStackNavigator';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useAppTheme } from '@/hooks/useAppTheme';
import { brandBlue } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  useChatSocket();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brandBlue,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        tabBarVariant: Platform.OS === 'ios' ? 'uikit' : undefined,
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tab.Screen
        name="ChatsTab"
        component={ChatsStackNavigator}
        options={{
          title: t('tabs.chats'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ContactsTab"
        component={ContactsStackNavigator}
        options={{
          title: t('tabs.contacts'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={SettingsStackNavigator}
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

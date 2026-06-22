import { ContactsScreen } from '@/screens/contacts/ContactsScreen';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import {
  getHeaderLeadingOptions,
  getNativeStackScreenOptions,
} from '@/app/navigation/nativeHeaderOptions';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { ContactsStackParamList } from './types';

const Stack = createNativeStackNavigator<ContactsStackParamList>();

export function ContactsStackNavigator() {
  const { t } = useTranslation();
  const { isDark } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={getNativeStackScreenOptions({ isDark, variant: 'plain' })}
    >
      <Stack.Screen
        name="ContactsList"
        component={ContactsScreen}
        options={{
          title: t('contacts.title'),
          ...getHeaderLeadingOptions('logo'),
        }}
      />
    </Stack.Navigator>
  );
}

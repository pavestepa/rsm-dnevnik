import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import {
  getHeaderLeadingOptions,
  getNativeStackScreenOptions,
} from '@/app/navigation/nativeHeaderOptions';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  const { t } = useTranslation();
  const { isDark } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={getNativeStackScreenOptions({ isDark, variant: 'plain' })}
    >
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings.title'),
          ...getHeaderLeadingOptions('logo'),
        }}
      />
    </Stack.Navigator>
  );
}

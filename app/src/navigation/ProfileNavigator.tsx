import { AvatarUploadScreen } from '@/screens/profile/AvatarUploadScreen';
import { ProfileSetupScreen } from '@/screens/profile/ProfileSetupScreen';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  getHeaderLeadingOptions,
  getNativeStackScreenOptions,
} from '@/navigation/nativeHeaderOptions';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  const { t } = useTranslation();
  const { isDark } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getNativeStackScreenOptions({ isDark, variant: 'auth' }),
        ...getHeaderLeadingOptions('back'),
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{ title: t('auth.profileTitle') }}
      />
      <Stack.Screen
        name="AvatarUpload"
        component={AvatarUploadScreen}
        options={{ title: t('auth.avatarTitle') }}
      />
    </Stack.Navigator>
  );
}

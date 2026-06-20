import { OtpScreen } from '@/screens/auth/OtpScreen';
import { PhoneScreen } from '@/screens/auth/PhoneScreen';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  getHeaderLeadingOptions,
  getNativeStackScreenOptions,
  getWelcomeScreenOptions,
} from '@/navigation/nativeHeaderOptions';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
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
        name="Welcome"
        component={WelcomeScreen}
        options={getWelcomeScreenOptions()}
      />
      <Stack.Screen
        name="Phone"
        component={PhoneScreen}
        options={{ title: t('auth.phoneTitle') }}
      />
      <Stack.Screen
        name="Otp"
        component={OtpScreen}
        options={{ title: t('auth.otpTitle') }}
      />
    </Stack.Navigator>
  );
}

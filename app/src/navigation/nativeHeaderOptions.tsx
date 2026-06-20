import { HeaderBackButton } from '@/components/branding/HeaderBackButton';
import { HeaderLogo } from '@/components/branding/HeaderLogo';
import { getAppColors } from '@/theme';
import { brandBlue } from '@/theme/colors';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

export type NativeHeaderVariant = 'chat' | 'auth' | 'plain';

type NativeHeaderParams = {
  isDark: boolean;
  variant?: NativeHeaderVariant;
};

export function getHeaderLeadingOptions(
  leading: 'logo' | 'back',
): NativeStackNavigationOptions {
  if (leading === 'logo') {
    return {
      headerBackVisible: false,
      headerLeft: () => <HeaderLogo />,
    };
  }

  return {
    headerBackVisible: false,
    headerLeft: (props) => <HeaderBackButton {...props} />,
  };
}

export function getNativeStackScreenOptions({
  isDark,
  variant = 'plain',
}: NativeHeaderParams): NativeStackNavigationOptions {
  const colors = getAppColors(isDark);

  if (Platform.OS === 'ios') {
    return getIOSNativeHeaderOptions(colors, isDark);
  }

  return getAndroidNativeHeaderOptions(colors, variant, isDark);
}

function getIOSNativeHeaderOptions(
  colors: ReturnType<typeof getAppColors>,
  isDark: boolean,
): NativeStackNavigationOptions {
  return {
    headerShown: true,
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    headerTintColor: brandBlue,
    headerTitleStyle: {
      color: colors.text,
      fontWeight: '600',
    },
    headerLargeTitle: false,
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTransparent: false,
    contentStyle: {
      backgroundColor: colors.background,
    },
    statusBarStyle: isDark ? 'light' : 'dark',
  };
}

function getAndroidNativeHeaderOptions(
  colors: ReturnType<typeof getAppColors>,
  _variant: NativeHeaderVariant,
  isDark: boolean,
): NativeStackNavigationOptions {
  return {
    headerShown: true,
    headerShadowVisible: true,
    headerTitleAlign: 'left',
    headerTintColor: brandBlue,
    headerTitleStyle: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 20,
    },
    headerStyle: {
      backgroundColor: colors.background,
    },
    contentStyle: {
      backgroundColor: colors.background,
    },
    statusBarStyle: isDark ? 'light' : 'dark',
    statusBarBackgroundColor: colors.background,
    navigationBarColor: colors.background,
  };
}

export function getWelcomeScreenOptions(): NativeStackNavigationOptions {
  return {
    headerShown: false,
    animation: 'fade',
    statusBarStyle: 'dark',
  };
}

export function getScrollContentProps() {
  return Platform.OS === 'ios'
    ? ({ contentInsetAdjustmentBehavior: 'automatic' as const })
    : {};
}

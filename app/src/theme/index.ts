import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { darkColors, lightColors, type AppColors } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

export function getAppColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export function getNavigationTheme(isDark: boolean): NavigationTheme {
  const colors = getAppColors(isDark);

  const base = isDark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };
}

export { darkColors, lightColors, palette } from './colors';
export type { AppColors } from './colors';

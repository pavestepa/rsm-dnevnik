import { useThemeStore } from '@/shared/theme/theme.store';
import { getAppColors, type AppColors } from '@/shared/theme';
import { useColorScheme } from 'react-native';

export function useAppTheme(): {
  isDark: boolean;
  colors: AppColors;
} {
  const mode = useThemeStore((state) => state.mode);
  const systemScheme = useColorScheme();

  const isDark =
    mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  return {
    isDark,
    colors: getAppColors(isDark),
  };
}

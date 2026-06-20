const requireEnv = (value: string | undefined, key: string, fallback: string): string => {
  if (value && value.length > 0) {
    return value;
  }

  if (__DEV__) {
    console.warn(`[env] ${key} is not set, using fallback: ${fallback}`);
  }

  return fallback;
};

export const env = {
  apiUrl: requireEnv(
    process.env.EXPO_PUBLIC_API_URL,
    'EXPO_PUBLIC_API_URL',
    'http://localhost:3000',
  ),
  wsUrl: requireEnv(
    process.env.EXPO_PUBLIC_WS_URL,
    'EXPO_PUBLIC_WS_URL',
    'http://localhost:3000',
  ),
  defaultLocale: requireEnv(
    process.env.EXPO_PUBLIC_DEFAULT_LOCALE,
    'EXPO_PUBLIC_DEFAULT_LOCALE',
    'ru',
  ) as 'ru' | 'en',
} as const;

export type Env = typeof env;

import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url().optional(),
  EXPO_PUBLIC_WS_URL: z.string().url().optional(),
  EXPO_PUBLIC_DEFAULT_LOCALE: z.enum(['ru', 'en']).optional(),
  EXPO_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success && !__DEV__) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

const requireEnv = (value: string | undefined, key: string, fallback: string): string => {
  if (value && value.length > 0) {
    return value;
  }

  if (__DEV__) {
    console.warn(`[env] ${key} is not set, using fallback: ${fallback}`);
    return fallback;
  }

  throw new Error(`${key} must be set in production`);
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
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? null,
} as const;

export type Env = typeof env;

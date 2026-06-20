export function getCorsOrigin(): string | string[] | boolean {
  if (process.env.NODE_ENV === 'production') {
    const origins =
      process.env.CORS_ORIGINS?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean) ?? [];

    return origins.length > 0 ? origins : [];
  }

  return true;
}

export function getWebSocketCorsOptions(): {
  origin: string | string[] | boolean;
  credentials: boolean;
} {
  return {
    origin: getCorsOrigin(),
    credentials: true,
  };
}

export const UNSAFE_JWT_SECRETS = [
  'dev-access-secret-change-me',
  'change-me-in-production',
];

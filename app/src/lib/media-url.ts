import { env } from '@/config/env';

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  if (!__DEV__) {
    return url;
  }

  try {
    const apiHost = new URL(env.apiUrl).hostname;

    if (apiHost === 'localhost' || apiHost === '127.0.0.1') {
      return url;
    }

    return url
      .replace('://localhost:', `://${apiHost}:`)
      .replace('://127.0.0.1:', `://${apiHost}:`);
  } catch {
    return url;
  }
}

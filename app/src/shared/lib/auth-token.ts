let refreshToken: string | null = null;
type RefreshHandler = () => Promise<string | null>;

let refreshHandler: RefreshHandler | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

let accessToken: string | null = null;

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setRefreshToken(token: string | null): void {
  refreshToken = token;
}

export function registerRefreshHandler(handler: RefreshHandler): void {
  refreshHandler = handler;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshHandler) {
    return null;
  }

  const nextToken = await refreshHandler();
  if (nextToken) {
    setAccessToken(nextToken);
  }

  return nextToken;
}

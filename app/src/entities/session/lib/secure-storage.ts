import * as SecureStore from 'expo-secure-store';

const accessTokenKey = 'auth.accessToken';
const refreshTokenKey = 'auth.refreshToken';
const userKey = 'auth.user';

const profileCompletedKey = (userId: string) => `auth.profileCompleted.${userId}`;

export async function saveSecureItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function deleteSecureItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export async function saveAuthSession(data: {
  accessToken: string;
  refreshToken: string;
  user: { id: string };
}): Promise<void> {
  await Promise.all([
    saveSecureItem(accessTokenKey, data.accessToken),
    saveSecureItem(refreshTokenKey, data.refreshToken),
    saveSecureItem(userKey, JSON.stringify(data.user)),
  ]);
}

export async function markProfileCompleted(userId: string): Promise<void> {
  await saveSecureItem(profileCompletedKey(userId), '1');
}

export async function isProfileCompleted(userId: string): Promise<boolean> {
  return (await getSecureItem(profileCompletedKey(userId))) === '1';
}

export async function loadAuthSession(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  user: unknown | null;
}> {
  const [accessToken, refreshToken, userRaw] = await Promise.all([
    getSecureItem(accessTokenKey),
    getSecureItem(refreshTokenKey),
    getSecureItem(userKey),
  ]);

  return {
    accessToken,
    refreshToken,
    user: userRaw ? JSON.parse(userRaw) : null,
  };
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([
    deleteSecureItem(accessTokenKey),
    deleteSecureItem(refreshTokenKey),
    deleteSecureItem(userKey),
  ]);
}

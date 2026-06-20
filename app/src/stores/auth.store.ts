import { create } from 'zustand';
import { setAccessToken } from '@/lib/auth-token';
import { disconnectChatSocket } from '@/lib/chat-socket';
import {
  clearAuthSession,
  isProfileCompleted,
  loadAuthSession,
  markProfileCompleted,
  saveAuthSession,
} from '@/lib/secure-storage';
import { authApi, userApi } from '@/services/api';
import type { User } from '@/types/auth';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  profileCompleted: boolean;
  hydrate: () => Promise<void>;
  login: (phoneE164: string, password: string) => Promise<void>;
  completeProfile: (user: User) => Promise<void>;
  setUser: (user: User) => void;
  updateUser: (user: User) => Promise<void>;
  refreshUser: () => Promise<User>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isHydrated: false,
  isAuthenticated: false,
  profileCompleted: false,

  hydrate: async () => {
    const session = await loadAuthSession();

    if (!session.accessToken || !session.refreshToken || !session.user) {
      setAccessToken(null);
      set({
        isHydrated: true,
        isAuthenticated: false,
        profileCompleted: false,
      });
      return;
    }

    const user = session.user as User;
    const profileDone = await isProfileCompleted(user.id);

    setAccessToken(session.accessToken);
    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user,
      isAuthenticated: true,
      profileCompleted: profileDone,
      isHydrated: true,
    });

    try {
      const freshUser = await userApi.getMe();
      const { accessToken, refreshToken } = get();

      if (accessToken && refreshToken) {
        await saveAuthSession({
          accessToken,
          refreshToken,
          user: freshUser,
        });
      }

      set({ user: freshUser });
    } catch {
      await get().logout();
    }
  },

  login: async (phoneE164, password) => {
    const response = await authApi.login({
      login: phoneE164,
      password,
    });

    const profileDone = await isProfileCompleted(response.user.id);

    await saveAuthSession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    });

    setAccessToken(response.accessToken);
    set({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
      isAuthenticated: true,
      profileCompleted: profileDone,
      isHydrated: true,
    });
  },

  completeProfile: async (user) => {
    await markProfileCompleted(user.id);

    const { accessToken, refreshToken } = get();
    if (accessToken && refreshToken) {
      await saveAuthSession({
        accessToken,
        refreshToken,
        user,
      });
    }

    set({ user, profileCompleted: true });
  },

  setUser: (user) => set({ user }),

  updateUser: async (user) => {
    const { accessToken, refreshToken } = get();

    if (accessToken && refreshToken) {
      await saveAuthSession({
        accessToken,
        refreshToken,
        user,
      });
    }

    set({ user });
  },

  refreshUser: async () => {
    const freshUser = await userApi.getMe();
    await get().updateUser(freshUser);
    return freshUser;
  },

  logout: async () => {
    const refreshToken = get().refreshToken;

    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // ignore
      }
    }

    await clearAuthSession();

    disconnectChatSocket();
    setAccessToken(null);
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      profileCompleted: false,
      isHydrated: true,
    });
  },
}));

import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** Primary setter used by login/register pages */
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;

  /** Convenience helpers */
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const ACCESS_KEY = 'huum_access_token';
const REFRESH_KEY = 'huum_refresh_token';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_KEY, accessToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_KEY, res.accessToken);
      localStorage.setItem(REFRESH_KEY, res.refreshToken);
    }
    set({
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      isAuthenticated: true,
    });
  },

  register: async (username, email, password, displayName) => {
    const res = await authApi.register({
      username,
      email,
      password,
      displayName,
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_KEY, res.accessToken);
      localStorage.setItem(REFRESH_KEY, res.refreshToken);
    }
    set({
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      const user = await authApi.me();
      set({
        user,
        accessToken: token,
        refreshToken:
          typeof window !== 'undefined'
            ? localStorage.getItem(REFRESH_KEY)
            : null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

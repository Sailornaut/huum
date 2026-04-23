import apiClient from './client';
import {
  AuthResponse,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  User,
} from '../types';

// ---------------------------------------------
// Namespace API used by pages (authApi.login)
// ---------------------------------------------
export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post('/auth/login', payload);
    return data as AuthResponse;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post('/auth/register', payload);
    return data as AuthResponse;
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    return data;
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  getGoogleAuthUrl(): string {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    return `${baseUrl}/api/auth/google`;
  },
};

// ---------------------------------------------
// Legacy individual exports (retained for compat)
// ---------------------------------------------
export async function login(
  payload: LoginPayload,
): Promise<{ user: User; tokens: AuthTokens }> {
  const res = await authApi.login(payload);
  return {
    user: res.user,
    tokens: { accessToken: res.accessToken, refreshToken: res.refreshToken },
  };
}

export async function register(
  payload: RegisterPayload,
): Promise<{ user: User; tokens: AuthTokens }> {
  const res = await authApi.register(payload);
  return {
    user: res.user,
    tokens: { accessToken: res.accessToken, refreshToken: res.refreshToken },
  };
}

export async function refreshToken(token: string): Promise<AuthTokens> {
  return authApi.refresh(token);
}

export async function googleAuth(
  idToken: string,
): Promise<{ user: User; tokens: AuthTokens }> {
  const { data } = await apiClient.post('/auth/google', { idToken });
  if (data?.tokens) return data;
  return {
    user: data.user,
    tokens: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    },
  };
}

export async function getMe(): Promise<User> {
  return authApi.me();
}

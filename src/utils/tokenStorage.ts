import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '../types';

const TOKEN_KEY = 'lima_segura_token';
const USER_KEY = 'lima_segura_user';

export const tokenStorage = {
  getToken: async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  getUser: async (): Promise<AuthUser | null> => {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },

  save: async (token: string, user: AuthUser): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  clear: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
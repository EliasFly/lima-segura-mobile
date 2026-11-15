import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../types';
import { authService } from '../services/authService';
import { AUTH_LOGOUT_EVENT } from '../services/api';
import { tokenStorage } from '../utils/tokenStorage';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restaurar sesión desde SecureStore al abrir la app
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUser = await tokenStorage.getUser();
        const savedToken = await tokenStorage.getToken();
        if (savedUser && savedToken) {
          setUser(savedUser);
        }
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const saveSession = useCallback(async (response: AuthResponse) => {
    const { token, ...authUser } = response;
    await tokenStorage.save(token, authUser);
    setUser(authUser);
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      const res = await authService.login(data);
      await saveSession(res);
    },
    [saveSession],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const res = await authService.register(data);
      await saveSession(res);
    },
    [saveSession],
  );

  const logout = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(AUTH_LOGOUT_EVENT, logout);
    return () => subscription.remove();
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'ADMIN',
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
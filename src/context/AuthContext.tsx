/**
 * Global auth state. Wraps the entire app so any screen can read/mutate auth.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../api/auth';
import { tokenManager } from '../utils/tokenManager';
import { secureStorage } from '../utils/secureStorage';
import {
  SECURE_KEYS,
  HIVEMQ_ADMIN_DEFAULTS,
} from '../constants/config';

interface AuthState {
  token: string | null;
  username: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (userName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Bootstraps HiveMQ admin credentials in the keystore on first install */
  initAdminCredentials: () => Promise<void>;
  getAdminCredentials: () => Promise<{ username: string; password: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    username: null,
    isLoading: true,
  });

  // Restore session on mount; auto-login with admin credentials if no valid token exists
  useEffect(() => {
    (async () => {
      const token = await tokenManager.get();
      if (token && !tokenManager.isExpired(token)) {
        setState({
          token,
          username: tokenManager.getSubject(token),
          isLoading: false,
        });
        return;
      }

      await tokenManager.clear();
      try {
        const adminUsername =
          (await secureStorage.get(SECURE_KEYS.HIVEMQ_ADMIN_USERNAME)) ??
          HIVEMQ_ADMIN_DEFAULTS.USERNAME;
        const adminPassword =
          (await secureStorage.get(SECURE_KEYS.HIVEMQ_ADMIN_PASSWORD)) ??
          HIVEMQ_ADMIN_DEFAULTS.PASSWORD;
        const newToken = await authApi.login(adminUsername, adminPassword);
        await tokenManager.save(newToken);
        setState({
          token: newToken,
          username: tokenManager.getSubject(newToken) ?? adminUsername,
          isLoading: false,
        });
      } catch {
        // Backend unavailable or wrong credentials — fall back to login screen
        setState({ token: null, username: null, isLoading: false });
      }
    })();
  }, []);

  const initAdminCredentials = useCallback(async () => {
    // Only seed if not already stored (first install)
    const existing = await secureStorage.get(SECURE_KEYS.HIVEMQ_ADMIN_USERNAME);
    if (!existing) {
      await secureStorage.set(
        SECURE_KEYS.HIVEMQ_ADMIN_USERNAME,
        HIVEMQ_ADMIN_DEFAULTS.USERNAME
      );
      await secureStorage.set(
        SECURE_KEYS.HIVEMQ_ADMIN_PASSWORD,
        HIVEMQ_ADMIN_DEFAULTS.PASSWORD
      );
    }
  }, []);

  const getAdminCredentials = useCallback(async () => {
    const username =
      (await secureStorage.get(SECURE_KEYS.HIVEMQ_ADMIN_USERNAME)) ??
      HIVEMQ_ADMIN_DEFAULTS.USERNAME;
    const password =
      (await secureStorage.get(SECURE_KEYS.HIVEMQ_ADMIN_PASSWORD)) ??
      HIVEMQ_ADMIN_DEFAULTS.PASSWORD;
    return { username, password };
  }, []);

  const login = useCallback(async (userName: string, password: string) => {
    const token = await authApi.login(userName, password);
    await tokenManager.save(token);
    setState({
      token,
      username: tokenManager.getSubject(token) ?? userName,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    await secureStorage.clear([SECURE_KEYS.AUTH_TOKEN]);
    setState({ token: null, username: null, isLoading: false });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, initAdminCredentials, getAdminCredentials }),
    [state, login, logout, initAdminCredentials, getAdminCredentials]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

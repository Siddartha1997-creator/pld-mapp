/**
 * Global auth state.
 *
 * Primary auth: Appwrite (email/password sessions).
 * Secondary:    HiveMQ JWT (admin-only, kept for MQTT credential management).
 *
 * The auth gate in RootNavigator is driven by `appwriteUser !== null`.
 * The HiveMQ token is kept in state for backward-compat with HomeScreen / hivemqApi.
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
import { appwriteAuth, userProfilesApi, type AppwriteUser } from '../api/appwrite';
import { tokenManager } from '../utils/tokenManager';
import { secureStorage } from '../utils/secureStorage';
import {
  SECURE_KEYS,
  HIVEMQ_ADMIN_DEFAULTS,
} from '../constants/config';

interface AuthState {
  /** Appwrite user — drives the auth gate */
  appwriteUser: AppwriteUser | null;
  /** HiveMQ JWT — kept for MQTT API calls */
  token: string | null;
  username: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  initAdminCredentials: () => Promise<void>;
  getAdminCredentials: () => Promise<{ username: string; password: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    appwriteUser: null,
    token: null,
    username: null,
    isLoading: true,
  });

  // Restore session on mount
  useEffect(() => {
    (async () => {
      // 1. Try to restore Appwrite session
      const appwriteUser = await appwriteAuth.restoreSession();

      // 2. Always ensure HiveMQ admin JWT is available (used for MQTT API calls)
      let adminToken: string | null = null;
      const storedToken = await tokenManager.get();
      if (storedToken && !tokenManager.isExpired(storedToken)) {
        adminToken = storedToken;
      } else {
        await tokenManager.clear();
        try {
          const adminUser =
            (await secureStorage.get(SECURE_KEYS.HIVEMQ_ADMIN_USERNAME)) ??
            HIVEMQ_ADMIN_DEFAULTS.USERNAME;
          const adminPass =
            (await secureStorage.get(SECURE_KEYS.HIVEMQ_ADMIN_PASSWORD)) ??
            HIVEMQ_ADMIN_DEFAULTS.PASSWORD;
          adminToken = await authApi.login(adminUser, adminPass);
          await tokenManager.save(adminToken);
        } catch {
          // HiveMQ unavailable — non-fatal, MQTT features will be degraded
        }
      }

      setState({
        appwriteUser,
        token: adminToken,
        username: appwriteUser?.name ?? tokenManager.getSubject(adminToken ?? '') ?? null,
        isLoading: false,
      });
    })();
  }, []);

  const initAdminCredentials = useCallback(async () => {
    const existing = await secureStorage.get(SECURE_KEYS.HIVEMQ_ADMIN_USERNAME);
    if (!existing) {
      await secureStorage.set(SECURE_KEYS.HIVEMQ_ADMIN_USERNAME, HIVEMQ_ADMIN_DEFAULTS.USERNAME);
      await secureStorage.set(SECURE_KEYS.HIVEMQ_ADMIN_PASSWORD, HIVEMQ_ADMIN_DEFAULTS.PASSWORD);
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

  const login = useCallback(async (email: string, password: string) => {
    await appwriteAuth.login(email, password);
    const appwriteUser = await appwriteAuth.restoreSession();
    if (!appwriteUser) throw new Error('Login succeeded but failed to get user.');
    setState((prev) => ({
      ...prev,
      appwriteUser,
      username: appwriteUser.name || email,
    }));
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    // 0. Clear any stale session so login() won't be blocked by "session already active"
    try { await appwriteAuth.logout(); } catch { /* ignore — no session is fine */ }

    // 1. Create Appwrite account
    await appwriteAuth.createAccount(email, password, name);

    // 2. Create session explicitly (createAccount does NOT auto-create one)
    await appwriteAuth.login(email, password);
    const appwriteUser = await appwriteAuth.restoreSession();
    if (!appwriteUser) throw new Error('Signup succeeded but session could not be created.');

    // 3. Store user profile in Appwrite
    try {
      await userProfilesApi.create(appwriteUser.$id, {
        displayName: name,
        email,
      });
    } catch {
      // Non-fatal: profile can be created on next login
    }

    setState((prev) => ({
      ...prev,
      appwriteUser,
      username: name || email,
    }));
  }, []);

  const logout = useCallback(async () => {
    try {
      await appwriteAuth.logout();
    } catch {
      // Session may already be expired — still clear local state
    }
    await secureStorage.clear([SECURE_KEYS.AUTH_TOKEN]);
    await tokenManager.clear();
    setState({ appwriteUser: null, token: null, username: null, isLoading: false });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, signup, logout, initAdminCredentials, getAdminCredentials }),
    [state, login, signup, logout, initAdminCredentials, getAdminCredentials],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

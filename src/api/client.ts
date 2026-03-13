/**
 * Axios instances for each backend.
 * The authClient interceptor automatically attaches the JWT and refreshes it
 * when it is about to expire.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AUTH_BASE_URL, HIVEMQ_BASE_URL } from '../constants/config';
import { tokenManager } from '../utils/tokenManager';
import { authApi } from './auth';

// ── Raw auth client (no token injection — used for login/refresh itself) ──
export const rawAuthClient = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15_000,
});

// ── Auth-protected client (auto token attach + refresh) ──
export const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15_000,
});

authClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  let token = await tokenManager.get();

  if (token && tokenManager.isExpired(token)) {
    try {
      const refreshed = await authApi.refreshToken(token);
      await tokenManager.save(refreshed);
      token = refreshed;
    } catch {
      await tokenManager.clear();
      token = null;
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── HiveMQ Cloud client (uses the same JWT) ──
export const hivemqClient = axios.create({
  baseURL: HIVEMQ_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15_000,
});

hivemqClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenManager.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Generic error extractor
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    return (
      axiosError.response?.data?.message ??
      axiosError.response?.data?.error ??
      axiosError.message
    );
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}

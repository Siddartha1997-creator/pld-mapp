/**
 * Manages JWT lifecycle: decode, expiry check, and secure persistence.
 */
import { secureStorage } from './secureStorage';
import { SECURE_KEYS, TOKEN_EXPIRY_BUFFER_MS } from '../constants/config';

interface JwtPayload {
  exp?: number;
  sub?: string;
  roles?: string[];
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export const tokenManager = {
  async save(token: string): Promise<void> {
    await secureStorage.set(SECURE_KEYS.AUTH_TOKEN, token);
  },

  async get(): Promise<string | null> {
    return secureStorage.get(SECURE_KEYS.AUTH_TOKEN);
  },

  async clear(): Promise<void> {
    await secureStorage.delete(SECURE_KEYS.AUTH_TOKEN);
  },

  isExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return true;
    const expiryMs = payload.exp * 1000;
    return Date.now() >= expiryMs - TOKEN_EXPIRY_BUFFER_MS;
  },

  getSubject(token: string): string | null {
    return decodeJwtPayload(token)?.sub ?? null;
  },
};

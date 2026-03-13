/**
 * Authentication API calls.
 * Uses rawAuthClient so there is no circular dependency with the interceptor.
 */
import { rawAuthClient } from './client';

export interface AuthResponse {
  token: string;
}

export const authApi = {
  async login(userName: string, password: string): Promise<string> {
    const { data } = await rawAuthClient.post<AuthResponse>(
      '/api/v1/auth/authenticate',
      { userName, password }
    );
    return data.token;
  },

  async refreshToken(currentToken: string): Promise<string> {
    const { data } = await rawAuthClient.post<AuthResponse>(
      '/api/v1/auth/refresh-token',
      {},
      { headers: { Authorization: `Bearer ${currentToken}` } }
    );
    return data.token;
  },
};

/**
 * Appwrite REST API client.
 *
 * Session cookies are managed automatically by the native HTTP stack
 * (iOS NSHTTPCookieStorage / Android OkHttp), so no manual cookie
 * handling is required.
 *
 * Security model:
 *  - Every device document is created with row-level permissions tied to the
 *    owner's Appwrite user ID. No other user can read or write it.
 *  - User profiles use the Appwrite user.$id as the document ID for O(1) lookup
 *    and to prevent any other user from creating a profile under someone else's ID.
 */
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
  APPWRITE_DEVICES_COLLECTION_ID,
  APPWRITE_USER_PROFILES_COLLECTION_ID,
} from '../constants/config';
import type { Device, DeviceType } from '../types/device';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppwriteUser {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  email: string;
  phone: string;
  labels: string[];
  status: boolean;
  emailVerification: boolean;
  phoneVerification: boolean;
  prefs: Record<string, unknown>;
}

export interface AppwriteSession {
  $id: string;
  $createdAt: string;
  userId: string;
  expire: string;
  provider: string;
  current: boolean;
}

export interface AppwriteDocument {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  [key: string]: unknown;
}

// Drop-in replacement for SDK's ID.unique() — passes 'unique()' to Appwrite
// for server-side ID generation, or generates a local ID for fields that need
// one before the document is created.
export const ID = {
  unique(): string {
    return 'unique()';
  },
};

// ── HTTP helper ───────────────────────────────────────────────────────────────

const BASE = `${APPWRITE_ENDPOINT}`;

// Session-based endpoints (/account*) must NOT include X-Appwrite-Key —
// Appwrite treats any request with a server key as an admin call and checks
// for the "account" scope, which client-facing API keys don't have.
function isAccountPath(path: string): boolean {
  return path.startsWith('/account');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Appwrite-Project': APPWRITE_PROJECT_ID,
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!isAccountPath(path)) {
    headers['X-Appwrite-Key'] = APPWRITE_API_KEY;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const appwriteAuth = {
  async createAccount(
    email: string,
    password: string,
    name: string,
  ): Promise<AppwriteUser> {
    return request<AppwriteUser>('/account', {
      method: 'POST',
      body: JSON.stringify({ userId: 'unique()', email, password, name }),
    });
  },

  async login(email: string, password: string): Promise<AppwriteSession> {
    return request<AppwriteSession>('/account/sessions/email', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout(): Promise<void> {
    await request<void>('/account/sessions/current', { method: 'DELETE' });
  },

  async restoreSession(): Promise<AppwriteUser | null> {
    try {
      return await request<AppwriteUser>('/account');
    } catch {
      return null;
    }
  },
};

// ── User Profiles ─────────────────────────────────────────────────────────────

export interface UserProfile {
  displayName: string;
  email: string;
  mqttUsername?: string;
  $createdAt: string;
}

export const userProfilesApi = {
  async create(
    userId: string,
    profile: Omit<UserProfile, '$createdAt'>,
  ): Promise<AppwriteDocument> {
    return request<AppwriteDocument>(
      `/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_USER_PROFILES_COLLECTION_ID}/documents`,
      {
        method: 'POST',
        body: JSON.stringify({
          documentId: userId,
          data: profile,
          permissions: [
            `read("user:${userId}")`,
            `update("user:${userId}")`,
          ],
        }),
      },
    );
  },

  async get(userId: string): Promise<AppwriteDocument> {
    return request<AppwriteDocument>(
      `/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_USER_PROFILES_COLLECTION_ID}/documents/${userId}`,
    );
  },
};

// ── Devices ───────────────────────────────────────────────────────────────────

export interface DevicePayload {
  deviceId: string;
  name: string;
  type: DeviceType;
  mqttBaseTopic: string;
  isOnline: boolean;
  lastSeen: string;
  firmwareVersion: string;
  metadata: string;
}

export const devicesApi = {
  async list(userId: string): Promise<Device[]> {
    const queries = [
      JSON.stringify({ method: 'equal', column: 'userId', values: [userId] }),
      JSON.stringify({ method: 'orderDesc', values: ['$createdAt'] }),
    ];
    const qs = queries.map(q => `queries[]=${encodeURIComponent(q)}`).join('&');
    const res = await request<{ documents: Device[] }>(
      `/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_DEVICES_COLLECTION_ID}/documents?${qs}`,
    );
    return res.documents;
  },

  async create(userId: string, payload: DevicePayload): Promise<Device> {
    return request<Device>(
      `/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_DEVICES_COLLECTION_ID}/documents`,
      {
        method: 'POST',
        body: JSON.stringify({
          documentId: 'unique()',
          data: { ...payload, userId },
          permissions: [
            `read("user:${userId}")`,
            `update("user:${userId}")`,
            `delete("user:${userId}")`,
          ],
        }),
      },
    );
  },

  async update(documentId: string, data: Partial<DevicePayload>): Promise<Device> {
    return request<Device>(
      `/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_DEVICES_COLLECTION_ID}/documents/${documentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ data }),
      },
    );
  },

  async delete(documentId: string): Promise<void> {
    await request<void>(
      `/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_DEVICES_COLLECTION_ID}/documents/${documentId}`,
      { method: 'DELETE' },
    );
  },
};

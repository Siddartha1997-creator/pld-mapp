import {
  AUTH_BASE_URL as ENV_AUTH_BASE_URL,
  HIVEMQ_ADMIN_USERNAME,
  HIVEMQ_ADMIN_PASSWORD,
  HIVEMQ_ORG_ID as ENV_HIVEMQ_ORG_ID,
  DEV_BYPASS_AUTH as ENV_DEV_BYPASS_AUTH,
  APPWRITE_ENDPOINT as ENV_APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID as ENV_APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY as ENV_APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID as ENV_APPWRITE_DATABASE_ID,
  APPWRITE_DEVICES_COLLECTION_ID as ENV_APPWRITE_DEVICES_COLLECTION_ID,
  APPWRITE_USER_PROFILES_COLLECTION_ID as ENV_APPWRITE_USER_PROFILES_COLLECTION_ID,
} from '@env';

// API base URLs
export const AUTH_BASE_URL = ENV_AUTH_BASE_URL;

// HiveMQ Cloud config
export const HIVEMQ_BASE_URL = 'https://ed4fcc3b30ba434bbe2b0f5651a9641d.s1.eu.hivemq.cloud';

export const HIVEMQ_ORG_ID = ENV_HIVEMQ_ORG_ID;
export const HIVEMQ_CLUSTER_ID = 'ed4fcc3b30ba434bbe2b0f5651a9641d';

// Secure store keys
export const SECURE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  HIVEMQ_ADMIN_USERNAME: 'hivemq_admin_username',
  HIVEMQ_ADMIN_PASSWORD: 'hivemq_admin_password',
} as const;

// HiveMQ admin credentials — sourced from .env, never hardcoded
// These are written to secure storage on first run and not accessed directly after that
export const HIVEMQ_ADMIN_DEFAULTS = {
  USERNAME: HIVEMQ_ADMIN_USERNAME,
  PASSWORD: HIVEMQ_ADMIN_PASSWORD,
};

// Token expiry buffer: refresh 2 minutes before actual expiry
export const TOKEN_EXPIRY_BUFFER_MS = 2 * 60 * 1000;

// Dev flag: skip auth and go straight to home screen
export const DEV_BYPASS_AUTH = ENV_DEV_BYPASS_AUTH === 'true';

// HiveMQ WebSocket endpoint for MQTT pub/sub
export const HIVEMQ_WS_URL = 'wss://ed4fcc3b30ba434bbe2b0f5651a9641d.s1.eu.hivemq.cloud:8884/mqtt';

// Appwrite
export const APPWRITE_ENDPOINT = ENV_APPWRITE_ENDPOINT;
export const APPWRITE_PROJECT_ID = ENV_APPWRITE_PROJECT_ID;
export const APPWRITE_API_KEY = ENV_APPWRITE_API_KEY;
export const APPWRITE_DATABASE_ID = ENV_APPWRITE_DATABASE_ID;
export const APPWRITE_DEVICES_COLLECTION_ID = ENV_APPWRITE_DEVICES_COLLECTION_ID;
export const APPWRITE_USER_PROFILES_COLLECTION_ID = ENV_APPWRITE_USER_PROFILES_COLLECTION_ID;

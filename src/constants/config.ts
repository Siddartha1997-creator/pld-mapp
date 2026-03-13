// API base URLs
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const AUTH_BASE_URL = extra.AUTH_BASE_URL || 'http://localhost:8080';

// HiveMQ Cloud config
export const HIVEMQ_BASE_URL = 'https://ed4fcc3b30ba434bbe2b0f5651a9641d.s1.eu.hivemq.cloud';

// Replace with your actual HiveMQ org and cluster IDs
export const HIVEMQ_ORG_ID = extra.HIVEMQ_ORG_ID || 'YOUR_ORG_ID';
export const HIVEMQ_CLUSTER_ID = 'ed4fcc3b30ba434bbe2b0f5651a9641d';

// Secure store keys
export const SECURE_KEYS = {
  AUTH_TOKEN: '',
  REFRESH_TOKEN: '',
  HIVEMQ_ADMIN_USERNAME: '',
  HIVEMQ_ADMIN_PASSWORD: '',
} as const;

// HiveMQ admin credentials (loaded from app.json extra config on first run,
// stored in secure storage - never hardcoded in production)
export const HIVEMQ_ADMIN_DEFAULTS = {
  USERNAME: extra.HIVEMQ_ADMIN_USERNAME || 'admin',
  PASSWORD: extra.HIVEMQ_ADMIN_PASSWORD || 'hivemq',
};

// Token expiry buffer: refresh 2 minutes before actual expiry
export const TOKEN_EXPIRY_BUFFER_MS = 2 * 60 * 1000;

// Dev flag: skip auth and go straight to home screen
export const DEV_BYPASS_AUTH = extra.DEV_BYPASS_AUTH === 'true';

// HiveMQ WebSocket endpoint for MQTT pub/sub
export const HIVEMQ_WS_URL = 'wss://ed4fcc3b30ba434bbe2b0f5651a9641d.s1.eu.hivemq.cloud:8884/mqtt';

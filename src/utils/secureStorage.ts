/**
 * Secure storage utility wrapping expo-secure-store.
 * All sensitive values (tokens, credentials) must go through here.
 * expo-secure-store uses iOS Keychain and Android Keystore under the hood.
 */
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async delete(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  async clear(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => SecureStore.deleteItemAsync(k)));
  },
};

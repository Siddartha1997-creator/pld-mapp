/**
 * Secure storage utility wrapping react-native-keychain.
 * All sensitive values (tokens, credentials) must go through here.
 * react-native-keychain uses iOS Keychain and Android Keystore under the hood.
 */
import * as Keychain from 'react-native-keychain';

export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    await Keychain.setGenericPassword('value', value, { service: key });
  },

  async get(key: string): Promise<string | null> {
    const result = await Keychain.getGenericPassword({ service: key });
    return result ? result.password : null;
  },

  async delete(key: string): Promise<void> {
    await Keychain.resetGenericPassword({ service: key });
  },

  async clear(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => Keychain.resetGenericPassword({ service: k })));
  },
};

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Native: Keychain / Keystore. Web: localStorage.
export const tokenStore = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return globalThis.localStorage?.getItem('fm_token') ?? null; } catch { return null; }
    }
    return SecureStore.getItemAsync('fm_token');
  },
  async set(token: string | null) {
    if (Platform.OS === 'web') {
      try {
        if (token) globalThis.localStorage?.setItem('fm_token', token);
        else globalThis.localStorage?.removeItem('fm_token');
      } catch {}
      return;
    }
    if (token) await SecureStore.setItemAsync('fm_token', token);
    else await SecureStore.deleteItemAsync('fm_token');
  },
};

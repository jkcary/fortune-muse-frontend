import { Platform } from 'react-native';

/**
 * API base URL. Set EXPO_PUBLIC_API_URL in frontend/.env for real devices
 * (use your computer's LAN IP, e.g. http://192.168.1.20:4000).
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000');

export const SUPPORT_EMAIL = 'support@fortunemuse.app';

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}

import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { API_URL } from './config';

export type OAuthProvider = 'google' | 'microsoft' | 'apple';

/**
 * Sends the user to the provider. The API brings them back to /oauth?ticket=… (see app/oauth.tsx).
 * Web: full-page redirect. Native: system auth browser, then we route to /oauth ourselves.
 */
export async function startOAuth(provider: OAuthProvider): Promise<void> {
  const redirect = Platform.OS === 'web' ? `${window.location.origin}/oauth` : Linking.createURL('oauth');
  const url = `${API_URL}/auth/oauth/${provider}/start?redirect=${encodeURIComponent(redirect)}`;
  if (Platform.OS === 'web') {
    window.location.assign(url);
    return;
  }
  const res = await WebBrowser.openAuthSessionAsync(url, redirect);
  if (res.type !== 'success') return;
  const { queryParams } = Linking.parse(res.url);
  router.push({ pathname: '/oauth', params: { ticket: String(queryParams?.ticket ?? ''), error: String(queryParams?.error ?? '') } });
}

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { P } from '@/components/ui';
import { api } from '@/lib/api';
import { startOAuth, type OAuthProvider } from '@/lib/oauth';
import { colors, space } from '@/lib/theme';

// Wording and colors follow each provider's sign-in button guidelines.
const LABEL: Record<OAuthProvider, string> = {
  google: 'Continue with Google',
  microsoft: 'Continue with Microsoft',
  apple: 'Continue with Apple',
};

function Logo({ provider }: { provider: OAuthProvider }) {
  if (provider === 'google') {
    return (
      <Svg width={18} height={18} viewBox="0 0 48 48">
        <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </Svg>
    );
  }
  if (provider === 'microsoft') {
    return (
      <Svg width={17} height={17} viewBox="0 0 21 21">
        <Rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <Rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <Rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <Rect x="11" y="11" width="9" height="9" fill="#FFB900" />
      </Svg>
    );
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path fill="#fff" d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
    </Svg>
  );
}

/** Google / Microsoft / Apple buttons for the providers the API has enabled, plus the "or" divider. Renders nothing if none are. */
export function OAuthButtons() {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  useEffect(() => {
    api<{ providers: { id: OAuthProvider }[] }>('/auth/oauth/providers')
      .then((r) => setProviders(r.providers.map((p) => p.id)))
      .catch(() => setProviders([]));
  }, []);
  if (!providers.length) return null;

  return (
    <View>
      {providers.map((p) => (
        <Pressable key={p} accessibilityRole="button" accessibilityLabel={LABEL[p]} onPress={() => startOAuth(p)}
          style={({ pressed }) => [s.btn, p === 'apple' ? s.apple : s.light, pressed && { opacity: 0.8 }]}>
          <View style={s.logo}><Logo provider={p} /></View>
          <Text style={[s.text, p === 'apple' && { color: '#fff' }]}>{LABEL[p]}</Text>
        </Pressable>
      ))}
      <P muted style={{ textAlign: 'center', fontSize: 13, marginBottom: space(1) }}>Works with Gmail, Outlook, Hotmail and iCloud addresses.</P>
      <View style={s.or}>
        <View style={s.line} />
        <P muted style={{ fontSize: 13 }}>or</P>
        <View style={s.line} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(5), marginBottom: space(2) },
  light: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#747775' },
  apple: { backgroundColor: '#000' },
  logo: { width: 20, alignItems: 'center', marginRight: space(3) },
  text: { fontSize: 16, fontWeight: '600', color: '#1F1F1F' },
  or: { flexDirection: 'row', alignItems: 'center', gap: space(3), marginVertical: space(2) },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
});

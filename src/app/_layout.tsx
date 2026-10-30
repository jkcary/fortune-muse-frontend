import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { api, getApiToken } from '@/lib/api';
import { isLang, LanguageProvider, useI18n, type Lang } from '@/lib/i18n';
import { SessionProvider, useSession } from '@/lib/session';
import { colors } from '@/lib/theme';

// A signed-in user's choice is saved to their account so it follows them to other devices.
const saveLanguage = (language: Lang) => {
  if (getApiToken()) api('/me', { method: 'PATCH', body: { language } }).catch(() => {});
};

/** Applies the account's language after sign-in. */
function LanguageSync() {
  const { me } = useSession();
  const { setLang } = useI18n();
  useEffect(() => { if (isLang(me?.language)) setLang(me.language); }, [me?.language, setLang]);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider onChange={saveLanguage}>
        <SessionProvider>
          <LanguageSync />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
        </SessionProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

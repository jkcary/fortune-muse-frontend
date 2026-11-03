import { Stack } from "expo-router";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { api, getApiToken } from "@/lib/api";
import { isLang, LanguageProvider, useI18n, type Lang } from "@/lib/i18n";
import { SessionProvider, useSession } from "@/lib/session";
import { colors } from "@/lib/theme";

// A signed-in user's choice is saved to their account so it follows them to other devices.
const saveLanguage = (language: Lang) => {
  if (getApiToken())
    return api("/me", { method: "PATCH", body: { language } }).then(() => {});
};

/** Applies the account's language after sign-in. */
function LanguageSync() {
  const { me } = useSession();
  const { adoptAccountLanguage } = useI18n();
  useEffect(() => {
    adoptAccountLanguage(
      isLang(me?.language) ? me.language : null,
      me?.id ?? null,
    );
  }, [me?.id, me?.language, adoptAccountLanguage]);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider onChange={saveLanguage}>
        <SessionProvider>
          <LanguageSync />
          <Head>
            <title>ORACLE ONE · I Ching readings for love & money</title>
            <meta
              name="description"
              content="Explore love and money through the I Ching. Cast your coins, discover your hexagram and explore a personalized interpretation. For adults 18+."
            />
          </Head>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          />
        </SessionProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

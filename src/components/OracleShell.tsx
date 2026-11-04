import { LocalizedText as Text } from "@/components/LocalizedText";
import { router, usePathname } from "expo-router";
import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CelestialBackdrop, PearlSurface } from "./CelestialSurface";
import { LanguageSelect } from "./LanguageSelect";
import { Button, ErrorText } from "./ui";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

export function OracleShell({
  children,
  wide = true,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  const { width } = useWindowDimensions();
  const mobile = width < 1000;
  const { me } = useSession();
  const { lang, setLang, languageError } = useI18n();
  const path = usePathname();
  const accountLink = (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(me ? "/profile" : "/sign-in")}
      style={[s.signIn, mobile && { paddingHorizontal: 12 }]}
    >
      <Text style={s.signInText}>{me ? "My account" : "Sign in"}</Text>
      <Text style={[s.signInText, { color: colors.gold }]}>↗</Text>
    </Pressable>
  );
  const navigationLinks = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: mobile ? 14 : 24,
        flexWrap: "wrap",
        width: mobile ? "100%" : undefined,
        rowGap: 12,
      }}
    >
      <Pressable accessibilityRole="link" onPress={() => router.push("/home")}>
        <Text
          style={[
            s.navText,
            (path === "/home" || path === "/welcome") && { color: colors.ink },
          ]}
        >
          Explore
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/journal")}
      >
        <Text style={[s.navText, path === "/journal" && { color: colors.ink }]}>
          Journal
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/garden")}
      >
        <Text style={[s.navText, path === "/garden" && { color: colors.ink }]}>
          Garden
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/calendar")}
      >
        <Text
          style={[s.navText, path === "/calendar" && { color: colors.ink }]}
        >
          Calendar
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/collection")}
      >
        <Text
          style={[s.navText, path === "/collection" && { color: colors.ink }]}
        >
          Collection
        </Text>
      </Pressable>
    </View>
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg, overflow: "hidden" }}
    >
      <CelestialBackdrop />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            s.nav,
            { paddingHorizontal: mobile ? 20 : 40 },
            mobile && { flexWrap: "wrap", paddingVertical: 18, rowGap: 16 },
          ]}
        >
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="ORACLE ONE home"
            onPress={() => router.push("/home")}
            style={s.logo}
          >
            <Text style={[s.mark, mobile && { fontSize: 24 }]}>✳</Text>
            <Text
              style={[
                s.wordmark,
                mobile && { fontSize: 11, letterSpacing: 1.3 },
              ]}
            >
              ORACLE<Text style={{ fontWeight: "400" }}> ONE</Text>
            </Text>
          </Pressable>
          {mobile && navigationLinks}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: mobile ? 24 : 32,
              width: mobile ? "100%" : undefined,
              justifyContent: "flex-end",
            }}
          >
            {!mobile && navigationLinks}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              {accountLink}
              <LanguageSelect compact={mobile} />
            </View>
          </View>
        </View>
        {languageError && (
          <View
            style={{
              padding: 20,
              maxWidth: 1180,
              width: "100%",
              alignSelf: "center",
              gap: 8,
            }}
          >
            <ErrorText>{languageError}</ErrorText>
            <Button
              title="Retry language sync"
              kind="secondary"
              onPress={() => void setLang(lang)}
            />
          </View>
        )}
        <View
          style={{
            width: "100%",
            maxWidth: wide ? 1180 : 740,
            alignSelf: "center",
            paddingHorizontal: mobile ? 22 : 40,
            flexGrow: 1,
          }}
        >
          {children}
        </View>
        <View style={[s.footer, { paddingHorizontal: mobile ? 22 : 40 }]}>
          <View style={{ flex: 1, minWidth: 220, gap: 8 }}>
            <Text style={s.footerBrand}>ANCIENT WISDOM. AN OPEN MIND.</Text>
            <Text style={s.fine}>
              For adults 18+. Entertainment and personal reflection.
            </Text>
            <Text style={s.fine}>
              AI interpretations explore possibilities, not factual predictions.
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 22,
              alignItems: "center",
            }}
          >
            {[
              ["Language", "/profile"],
              ["Our method", "/method"],
              ["Privacy", "/legal/privacy"],
              ["Terms", "/legal/terms"],
            ].map(([label, href]) => (
              <Pressable
                key={label}
                accessibilityRole="link"
                onPress={() => router.push(href as any)}
              >
                <Text style={s.fine}>{label} ↗</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
export function Eyebrow({
  children,
  love = false,
}: {
  children: ReactNode;
  love?: boolean;
}) {
  return (
    <Text
      style={{
        color: love ? colors.love : colors.gold,
        fontSize: 10,
        letterSpacing: 2.4,
        fontWeight: "600",
        marginBottom: 18,
      }}
    >
      {children}
    </Text>
  );
}
export function Display({
  children,
  size = 56,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: fonts.display,
        fontSize: size,
        lineHeight: size * 1.1,
        color: colors.ink,
        fontWeight: "400",
        letterSpacing: -1.6,
      }}
    >
      {children}
    </Text>
  );
}
export function Copy({
  children,
  muted = false,
  localize = true,
}: {
  children: ReactNode;
  muted?: boolean;
  localize?: boolean;
}) {
  return (
    <Text
      localize={localize}
      style={{
        fontSize: 15,
        lineHeight: 26,
        color: muted ? colors.muted : colors.ink,
      }}
    >
      {children}
    </Text>
  );
}
export function Panel({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: 20,
        padding: 24,
        gap: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <PearlSurface />
      {children}
    </View>
  );
}
export const oracleStyles = StyleSheet.create({
  section: { paddingVertical: 32, gap: 18 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  subheading: {
    fontFamily: fonts.display,
    fontSize: 27,
    color: colors.ink,
    fontWeight: "400",
  },
  label: { fontSize: 11, letterSpacing: 1.8, color: colors.gold },
  small: { fontSize: 12, lineHeight: 20, color: colors.muted },
  link: { color: colors.gold, fontSize: 13 },
});
const s = StyleSheet.create({
  nav: {
    width: "100%",
    maxWidth: 1260,
    alignSelf: "center",
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#45324F",
    gap: 12,
  },
  logo: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: { fontSize: 29, color: colors.gold },
  wordmark: {
    fontSize: 15,
    letterSpacing: 2,
    color: colors.ink,
    fontWeight: "700",
  },
  navText: { fontSize: 13, color: colors.muted },
  signIn: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 18,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#70516F",
    borderRadius: 999,
  },
  signInText: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    color: colors.ink,
  },
  footer: {
    maxWidth: 1260,
    width: "100%",
    alignSelf: "center",
    borderTopWidth: 1,
    borderColor: colors.line,
    marginTop: 60,
    paddingVertical: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
  },
  footerBrand: { fontSize: 9, color: colors.gold, letterSpacing: 1.6 },
  fine: { fontSize: 10, lineHeight: 17, color: colors.muted },
});

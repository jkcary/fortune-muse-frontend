import { router } from "expo-router";
import { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
} from "react-native";
import { LocalizedText as Text } from "./LocalizedText";
import { Avatar } from "./Avatar";
import { LanguageSelect } from "./LanguageSelect";
import { SettingsDisclosure } from "./SettingsDisclosure";
import {
  Copy,
  Display,
  Eyebrow,
  OracleShell,
  Panel,
  oracleStyles as shared,
} from "./OracleShell";
import { Button, ErrorText, Field } from "./ui";
import { api } from "@/lib/api";
import { SUPPORT_EMAIL } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { latestCast, pendingCast } from "@/lib/oracle";
import { useSession } from "@/lib/session";
import { colors } from "@/lib/theme";

function SettingLink({
  label,
  onPress,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.link, pressed && { opacity: 0.65 }]}
    >
      <Text
        style={{
          color: danger ? "#F2ADBE" : colors.ink,
          fontSize: 14,
          flex: 1,
          lineHeight: 23,
        }}
      >
        {label}
      </Text>
      <Text style={{ color: colors.gold }}>↗</Text>
    </Pressable>
  );
}
export default function AccountSettings() {
  const { me, refresh, signOut } = useSession();
  const { lang, setLang, t, languageSaving, languageError } = useI18n();
  const { width } = useWindowDimensions();
  const narrow = width < 820;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await action();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function toggle(path: string, enabled: boolean) {
    await act(async () => {
      await api(path, { method: "PATCH", body: { enabled } });
      await refresh();
    });
  }
  async function exportData() {
    await act(async () => {
      const json = JSON.stringify(
        await api("/account/export", { body: {} }),
        null,
        2,
      );
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(
          new Blob([json], { type: "application/json" }),
        );
        try {
          const a = document.createElement("a");
          a.href = url;
          a.download = "oracle-one-data.json";
          a.click();
        } finally {
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      } else router.push({ pathname: "/export", params: { json } });
    });
  }
  async function privacy(type: "do_not_sell" | "access" | "correct") {
    await act(async () => {
      await api("/privacy-requests", { body: { email: me!.email, type } });
      setInfo("Your request has been received.");
    });
  }
  const languageSection = (
    <SettingsDisclosure title="LANGUAGE & REGION">
      <View
        style={{
          flexDirection: width < 600 ? "column" : "row",
          alignItems: width < 600 ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <View style={{ gap: 8, flex: width < 600 ? undefined : 1 }}>
          <Text style={shared.small}>
            Choose the language for the interface and new readings.
          </Text>
        </View>
        <LanguageSelect />
      </View>
      {languageSaving && (
        <Text accessibilityLiveRegion="polite" style={shared.small}>
          Saving your language…
        </Text>
      )}
      {Boolean(languageError) && (
        <>
          <ErrorText>{languageError}</ErrorText>
          <Button
            title="Retry language sync"
            kind="secondary"
            onPress={() => void setLang(lang)}
          />
        </>
      )}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          columnGap: 18,
          rowGap: 4,
        }}
      >
        <Text style={shared.small}>
          {me
            ? "Your language is saved to your account and follows you across devices."
            : "Your language is saved on this device."}
        </Text>
        <Text style={shared.small}>All purchases are charged in USD.</Text>
      </View>
    </SettingsDisclosure>
  );
  return (
    <OracleShell>
      <View style={{ paddingTop: 42, paddingBottom: 30, gap: 15 }}>
        <Eyebrow>YOUR PERSONAL UNIVERSE</Eyebrow>
        <Display size={narrow ? 42 : 58}>Your space. Your choices.</Display>
        <Copy muted>A little more personal. Entirely in your hands.</Copy>
      </View>
      {me && (
        <View
          style={[
            s.identity,
            width < 600 && { flexDirection: "column", alignItems: "stretch" },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 18,
              flex: width < 600 ? undefined : 1,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Edit avatar")}
              onPress={() => router.push("/avatar")}
              style={s.avatar}
            >
              <Avatar avatar={me.avatar} size={66} />
            </Pressable>
            <View style={{ flex: 1, gap: 7 }}>
              <Text
                style={[shared.subheading, width < 600 && { fontSize: 22 }]}
                localize={false}
              >
                {me.handle}
              </Text>
              <Text style={shared.small} localize={false}>
                {me.email}
              </Text>
              <Text style={shared.small}>
                {me.email_verified
                  ? "Email confirmed"
                  : "Email confirmation pending"}
              </Text>
            </View>
          </View>
          <Button
            title="Edit avatar"
            kind="secondary"
            onPress={() => router.push("/avatar")}
          />
        </View>
      )}
      <View style={{ gap: 22 }}>
        {!me ? (
          <>
            {languageSection}
            <Panel>
              <Text style={shared.subheading}>A space for your story.</Text>
              <Copy muted>
                Sign in to manage your journal, purchases and privacy settings.
              </Copy>
              <Button title="Sign in" onPress={() => router.push("/sign-in")} />
            </Panel>
          </>
        ) : (
          <>
            <View
              style={{
                flexDirection: narrow ? "column" : "row",
                alignItems: narrow ? "stretch" : "flex-start",
                gap: 22,
              }}
            >
              <View style={{ flex: 1, gap: 22 }}>
                <SettingsDisclosure title="YOUR ACCOUNT">
                  <SettingLink
                    label="Edit avatar"
                    onPress={() => router.push("/avatar")}
                  />
                  <SettingLink
                    label="Readings & receipts"
                    onPress={() => router.push("/history")}
                  />
                  <SettingLink
                    label="Your oracle journal"
                    onPress={() => router.push("/journal")}
                  />
                  <Copy muted>
                    {t("You have {n} reading vouchers.", {
                      n: me.freeReadings,
                    })}
                  </Copy>
                  <Text style={shared.small} localize={false}>
                    {me.timezone} · {me.country}
                  </Text>
                </SettingsDisclosure>
                {languageSection}
                <SettingsDisclosure title="PRIVACY & DATA">
                  <Copy muted>
                    Temporary readings stay out of your journal and expire after
                    24 hours. Necessary purchase records are retained
                    separately.
                  </Copy>
                  <SettingLink
                    label="Download my data (JSON)"
                    onPress={() => void exportData()}
                  />
                  <SettingLink
                    label="Do not sell or share my personal information"
                    onPress={() => void privacy("do_not_sell")}
                  />
                  <SettingLink
                    label="Request a copy of my information"
                    onPress={() => void privacy("access")}
                  />
                  <SettingLink
                    label="Request a correction"
                    onPress={() => void privacy("correct")}
                  />
                </SettingsDisclosure>
                <SettingsDisclosure title="HELP & LEGAL">
                  <SettingLink
                    label="Terms of Use"
                    onPress={() => router.push("/legal/terms")}
                  />
                  <SettingLink
                    label="Privacy Policy"
                    onPress={() => router.push("/legal/privacy")}
                  />
                  <SettingLink
                    label="Contact support"
                    onPress={() =>
                      void Linking.openURL("mailto:" + SUPPORT_EMAIL)
                    }
                  />
                  {me.role === "admin" && (
                    <SettingLink
                      label="Delivery operations"
                      onPress={() => router.push("/operations")}
                    />
                  )}
                </SettingsDisclosure>
                <SettingsDisclosure title="ACCOUNT CONTROLS">
                  <SettingLink
                    label="Sign out"
                    onPress={() =>
                      void act(async () => {
                        await pendingCast.set(null);
                        await latestCast.set(null);
                        await signOut();
                        router.replace("/home");
                      })
                    }
                  />
                  <SettingLink
                    label="Delete my account"
                    danger
                    onPress={() => setDeleting(true)}
                  />
                </SettingsDisclosure>
              </View>
              <View style={{ flex: 1, gap: 22 }}>
                <Panel>
                  <Eyebrow>PERSONALIZATION</Eyebrow>
                  <View style={s.switchRow}>
                    <View style={{ flex: 1, gap: 9 }}>
                      <Text style={shared.subheading}>
                        Your spirit’s memory
                      </Text>
                      <Copy muted>
                        Use only the reflections you explicitly share as memory
                        in future readings. Your journal remains separate.
                      </Copy>
                    </View>
                    <Switch
                      disabled={busy}
                      value={me.memory_enabled}
                      accessibilityLabel={t("Memory")}
                      trackColor={{ true: "#B795C4", false: "#52415F" }}
                      onValueChange={(value) =>
                        void toggle("/settings/memory", value)
                      }
                    />
                  </View>
                  <SettingLink
                    label="View or delete remembered reflections"
                    onPress={() => router.push("/memories")}
                  />
                </Panel>
                <Panel>
                  <Eyebrow>CONNECTIONS</Eyebrow>
                  <View style={s.switchRow}>
                    <View style={{ flex: 1, gap: 9 }}>
                      <Text style={shared.subheading}>Same-question rooms</Text>
                      <Copy muted>
                        Choose whether to join temporary conversations with
                        people exploring a similar question.
                      </Copy>
                    </View>
                    <Switch
                      disabled={busy}
                      value={me.rooms_enabled}
                      accessibilityLabel={t("Join same-question rooms")}
                      trackColor={{ true: "#B795C4", false: "#52415F" }}
                      onValueChange={(value) =>
                        void toggle("/settings/rooms", value)
                      }
                    />
                  </View>
                  <Text style={shared.small}>
                    You can report, block or leave a room at any time.
                  </Text>
                </Panel>
              </View>
            </View>
            {deleting && (
              <Panel>
                <Text style={shared.subheading}>Delete account</Text>
                <Copy>
                  This permanently deletes your profile, readings, memories,
                  rooms and rewards. Receipts are kept without your name for tax
                  records.
                </Copy>
                <Field
                  label="Type DELETE to confirm"
                  value={confirm}
                  onChangeText={setConfirm}
                  autoCapitalize="characters"
                />
                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                />
                <Text style={shared.small}>
                  For accounts with a password, enter it to confirm. Social
                  sign-in accounts can leave this blank.
                </Text>
                <Button
                  title="Delete everything"
                  kind="danger"
                  loading={busy}
                  disabled={confirm !== "DELETE"}
                  onPress={() =>
                    void act(async () => {
                      await api("/account", {
                        method: "DELETE",
                        body: {
                          confirm: "DELETE",
                          password: password || undefined,
                        },
                      });
                      await pendingCast.set(null);
                      await latestCast.set(null);
                      await signOut();
                      router.replace("/home");
                    })
                  }
                />
                <Button
                  title="Cancel"
                  kind="ghost"
                  onPress={() => {
                    setDeleting(false);
                    setConfirm("");
                    setPassword("");
                  }}
                />
              </Panel>
            )}
          </>
        )}
        {Boolean(error) && <ErrorText>{error}</ErrorText>}
        {Boolean(info) && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.green }}
          >
            {info}
          </Text>
        )}
      </View>
    </OracleShell>
  );
}
const s = StyleSheet.create({
  identity: {
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 18,
    backgroundColor: "#281C33",
  },
  avatar: {
    borderWidth: 1,
    borderColor: "#C5A0C8",
    padding: 5,
    borderRadius: 999,
    backgroundColor: "#48354F",
  },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  link: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
});

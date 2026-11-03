import { LocalizedText as Text } from "@/components/LocalizedText";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { OAuthButtons } from "@/components/OAuthButtons";
import {
  Copy,
  Display,
  Eyebrow,
  OracleShell,
  Panel,
} from "@/components/OracleShell";
import { Button, Check, ErrorText, Field } from "@/components/ui";
import { api } from "@/lib/api";
import { deviceTimeZone } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { pendingCast } from "@/lib/oracle";
import { useSession } from "@/lib/session";

export default function SignIn() {
  const { signIn } = useSession();
  const { lang } = useI18n();
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function submit() {
    setErr("");
    if (creating && (!adult || !terms)) {
      setErr("Confirm your age and accept the terms to create an account.");
      return;
    }
    setBusy(true);
    try {
      const r = await api(creating ? "/auth/register" : "/auth/login", {
        body: creating
          ? {
              email,
              password,
              ageConfirmed: true,
              acceptTerms: true,
              timezone: deviceTimeZone(),
              language: lang,
              country: "US",
            }
          : { email, password },
      });
      await signIn(r.token);
      const pending = await pendingCast.get();
      await pendingCast.set(null);
      router.replace(pending ? "/oracle/" + pending : "/journal");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <OracleShell wide={false}>
      <View style={{ paddingTop: 50, paddingBottom: 30, gap: 22 }}>
        <Eyebrow>A SPACE FOR YOUR PERSPECTIVE</Eyebrow>
        <Display size={46}>
          {creating ? "Begin your journal." : "Welcome back."}
        </Display>
        <Copy muted>
          {creating
            ? "Save your readings and return whenever you need a different perspective. Memory is off until you choose to enable it."
            : "Your questions, reflections and readings are waiting for you."}
        </Copy>
        <Panel>
          <OAuthButtons />
          <Copy muted>Or continue with your email.</Copy>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={creating ? "new-password" : "current-password"}
            onSubmitEditing={() => void submit()}
          />
          {creating && (
            <>
              <Check checked={adult} onChange={setAdult}>
                I am 18 or older and located in the United States.
              </Check>
              <Check checked={terms} onChange={setTerms}>
                I agree to the Terms of Use and Privacy Policy linked below.
              </Check>
            </>
          )}
          <ErrorText>{err}</ErrorText>
          <Button
            title={creating ? "Create account" : "Sign in"}
            loading={busy}
            onPress={() => void submit()}
          />
          <Button
            title={
              creating
                ? "Already have an account? Sign in"
                : "New here? Create an account"
            }
            kind="secondary"
            onPress={() => {
              setCreating(!creating);
              setErr("");
            }}
          />
          {!creating && (
            <Button
              title="Password help or email sign-in ↗"
              kind="ghost"
              onPress={() => router.push("/login")}
            />
          )}
        </Panel>
      </View>
    </OracleShell>
  );
}

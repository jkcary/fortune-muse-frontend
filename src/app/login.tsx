import { router } from 'expo-router';
import { useState } from 'react';
import { Button, ErrorText, Field, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useSession } from '@/lib/session';

export default function Login() {
  const { signIn } = useSession();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const { token } = await api<{ token: string }>('/auth/login', { body: { email, password } });
      await signIn(token);
      router.replace('/home');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function magic() {
    setErr(null);
    if (!email) return setErr(t('Enter your email first.'));
    await api('/auth/magic-link', { body: { email } }).catch(() => {});
    setInfo(t('If that email has an account, a sign-in link is on its way.'));
  }

  return (
    <Screen title={t('Welcome back')} back>
      <Field label={t('Email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label={t('Password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
      <ErrorText>{err}</ErrorText>
      {info && <P muted style={{ marginBottom: 12 }}>{info}</P>}
      <Button title={t('Sign in')} onPress={submit} loading={busy} />
      <Button title={t('Email me a sign-in link instead')} kind="secondary" onPress={magic} />
      <Button title={t('Forgot password?')} kind="ghost" onPress={() => router.push('/forgot')} />
    </Screen>
  );
}

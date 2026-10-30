import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Check, ErrorText, Field, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { deviceTimeZone } from '@/lib/config';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';

export default function Register() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(null);
    if (!adult) return setErr('You must be 18 or older to use Fortune Muse.');
    if (!terms) return setErr('Please accept the Terms and Privacy Policy.');
    if (password.length < 8) return setErr('Use at least 8 characters for your password.');
    setBusy(true);
    try {
      const { token } = await api<{ token: string }>('/auth/register', {
        body: { email, password, ageConfirmed: true, acceptTerms: true, timezone: deviceTimeZone(), country: 'US' },
      });
      await signIn(token);
      router.replace('/home');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Create your account" back>
      <P muted style={{ marginBottom: 16 }}>We’ll give you a lucky name and a little avatar. You can change the avatar any time.</P>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" inputMode="email" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="At least 8 characters" />
      <Check checked={adult} onChange={setAdult}>I am 18 years of age or older.</Check>
      <Check checked={terms} onChange={setTerms}>
        I agree to the <Link href="/legal/terms"><Text style={{ color: colors.goldDeep }}>Terms of Use</Text></Link> and{' '}
        <Link href="/legal/privacy"><Text style={{ color: colors.goldDeep }}>Privacy Policy</Text></Link>.
      </Check>
      <ErrorText>{err}</ErrorText>
      <Button title="Create account" onPress={submit} loading={busy} />
    </Screen>
  );
}

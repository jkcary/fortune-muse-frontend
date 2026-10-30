import { router } from 'expo-router';
import { useState } from 'react';
import { TermsCheck } from '@/components/TermsCheck';
import { Button, Check, ErrorText, Field, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { deviceTimeZone } from '@/lib/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';

export default function Register() {
  const { signIn } = useSession();
  const { t, lang } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(null);
    if (!adult) return setErr(t('You must be 18 or older to use Fortune Muse.'));
    if (!terms) return setErr(t('Please accept the Terms and Privacy Policy.'));
    if (password.length < 8) return setErr(t('Use at least 8 characters for your password.'));
    setBusy(true);
    try {
      const { token } = await api<{ token: string }>('/auth/register', {
        body: { email, password, ageConfirmed: true, acceptTerms: true, timezone: deviceTimeZone(), country: 'US', language: lang },
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
    <Screen title={t('Create your account')} back>
      <P muted style={{ marginBottom: 16 }}>{t('We’ll give you a lucky name and a little avatar. You can change the avatar any time.')}</P>
      <Field label={t('Email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" inputMode="email" />
      <Field label={t('Password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder={t('At least 8 characters')} />
      <Check checked={adult} onChange={setAdult}>{t('I am 18 years of age or older.')}</Check>
      <TermsCheck checked={terms} onChange={setTerms} />
      <ErrorText>{err}</ErrorText>
      <Button title={t('Create account')} onPress={submit} loading={busy} />
    </Screen>
  );
}

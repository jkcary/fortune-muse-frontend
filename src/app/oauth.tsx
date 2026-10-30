import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { TermsCheck } from '@/components/TermsCheck';
import { Button, Check, ErrorText, Loading, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { deviceTimeZone } from '@/lib/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';

type Exchange = { token: string } | { needsSignup: true; email: string; provider: string };

const PROVIDER_NAME: Record<string, string> = { google: 'Google', microsoft: 'Microsoft', apple: 'Apple' };

/** Return address after Google / Microsoft / Apple: /oauth?ticket=… or /oauth?error=… */
export default function OAuthReturn() {
  const { ticket, error } = useLocalSearchParams<{ ticket?: string; error?: string }>();
  const { signIn } = useSession();
  const { t, lang } = useI18n();
  const [signup, setSignup] = useState<{ email: string; provider: string } | null>(null);
  const [err, setErr] = useState<string | null>(
    error === 'cancelled' ? t('Sign-in was cancelled.') : error ? t('We couldn’t sign you in with that account. Please try again.') : null,
  );
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef(false); // tickets are single use; don't trade one twice

  async function finish(r: Exchange) {
    if ('token' in r) {
      await signIn(r.token);
      router.replace('/home');
    } else {
      setSignup({ email: r.email, provider: r.provider });
    }
  }

  useEffect(() => {
    if (error || !ticket) {
      if (!error) setErr(t('This sign-in link is incomplete. Please try again.'));
      return;
    }
    if (started.current) return;
    started.current = true;
    api<Exchange>('/auth/oauth/exchange', { body: { ticket } }).then(finish).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket, error]);

  async function createAccount() {
    setErr(null);
    if (!adult) return setErr(t('You must be 18 or older to use Fortune Muse.'));
    if (!terms) return setErr(t('Please accept the Terms and Privacy Policy.'));
    setBusy(true);
    try {
      await finish(await api<Exchange>('/auth/oauth/exchange', {
        body: { ticket, ageConfirmed: true, acceptTerms: true, timezone: deviceTimeZone(), country: 'US', language: lang },
      }));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (signup) {
    return (
      <Screen title={t('Almost there')}>
        <P muted style={{ marginBottom: 16 }}>
          {t('You’re signing up with {provider} as {email}. We’ll give you a lucky name and a little avatar.', { provider: PROVIDER_NAME[signup.provider] ?? signup.provider, email: signup.email })}
        </P>
        <Check checked={adult} onChange={setAdult}>{t('I am 18 years of age or older.')}</Check>
        <TermsCheck checked={terms} onChange={setTerms} />
        <ErrorText>{err}</ErrorText>
        <Button title={t('Create account')} onPress={createAccount} loading={busy} />
        <Button title={t('Cancel')} kind="ghost" onPress={() => router.replace('/welcome')} />
      </Screen>
    );
  }

  return (
    <Screen title={t('Signing you in')}>
      {err ? <><P style={{ marginBottom: 16 }}>{err}</P><Button title={t('Back')} onPress={() => router.replace('/welcome')} /></> : <Loading />}
    </Screen>
  );
}

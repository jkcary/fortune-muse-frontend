import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { Button, Check, ErrorText, Loading, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { deviceTimeZone } from '@/lib/config';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';

type Exchange = { token: string } | { needsSignup: true; email: string; provider: string };

const PROVIDER_NAME: Record<string, string> = { google: 'Google', microsoft: 'Microsoft', apple: 'Apple' };

/** Return address after Google / Microsoft / Apple: /oauth?ticket=… or /oauth?error=… */
export default function OAuthReturn() {
  const { ticket, error } = useLocalSearchParams<{ ticket?: string; error?: string }>();
  const { signIn } = useSession();
  const [signup, setSignup] = useState<{ email: string; provider: string } | null>(null);
  const [err, setErr] = useState<string | null>(
    error === 'cancelled' ? 'Sign-in was cancelled.' : error ? 'We couldn’t sign you in with that account. Please try again.' : null,
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
      if (!error) setErr('This sign-in link is incomplete. Please try again.');
      return;
    }
    if (started.current) return;
    started.current = true;
    api<Exchange>('/auth/oauth/exchange', { body: { ticket } }).then(finish).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket, error]);

  async function createAccount() {
    setErr(null);
    if (!adult) return setErr('You must be 18 or older to use Fortune Muse.');
    if (!terms) return setErr('Please accept the Terms and Privacy Policy.');
    setBusy(true);
    try {
      await finish(await api<Exchange>('/auth/oauth/exchange', {
        body: { ticket, ageConfirmed: true, acceptTerms: true, timezone: deviceTimeZone(), country: 'US' },
      }));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (signup) {
    return (
      <Screen title="Almost there">
        <P muted style={{ marginBottom: 16 }}>
          You’re signing up with {PROVIDER_NAME[signup.provider] ?? signup.provider} as {signup.email}. We’ll give you a lucky name and a little avatar.
        </P>
        <Check checked={adult} onChange={setAdult}>I am 18 years of age or older.</Check>
        <Check checked={terms} onChange={setTerms}>
          I agree to the <Link href="/legal/terms"><Text style={{ color: colors.goldDeep }}>Terms of Use</Text></Link> and{' '}
          <Link href="/legal/privacy"><Text style={{ color: colors.goldDeep }}>Privacy Policy</Text></Link>.
        </Check>
        <ErrorText>{err}</ErrorText>
        <Button title="Create account" onPress={createAccount} loading={busy} />
        <Button title="Cancel" kind="ghost" onPress={() => router.replace('/welcome')} />
      </Screen>
    );
  }

  return (
    <Screen title="Signing you in">
      {err ? <><P style={{ marginBottom: 16 }}>{err}</P><Button title="Back" onPress={() => router.replace('/welcome')} /></> : <Loading />}
    </Screen>
  );
}

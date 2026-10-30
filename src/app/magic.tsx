import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Loading, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useSession } from '@/lib/session';

/** Opened from the sign-in email: /magic?token=… */
export default function Magic() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { signIn } = useSession();
  const t = useT();
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api<{ token: string }>('/auth/magic/verify', { body: { token } })
      .then(async (r) => { await signIn(r.token); router.replace('/home'); })
      .catch((e) => setErr(e.message));
  }, [token, signIn]);
  return (
    <Screen title={t('Signing you in')}>
      {err ? <><P>{err}</P><Button title={t('Back to sign in')} onPress={() => router.replace('/login')} /></> : <Loading />}
    </Screen>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Loading, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useSession } from '@/lib/session';

/** Opened from the verification email: /verify?token=… */
export default function Verify() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { refresh, me } = useSession();
  const t = useT();
  const [state, setState] = useState<'working' | 'ok' | 'error'>('working');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    api('/auth/verify-email', { body: { token } })
      .then(() => { setState('ok'); return refresh(); })
      .catch((e) => { setState('error'); setMsg(e.message); });
  }, [token, refresh]);
  return (
    <Screen title={t('Email confirmation')}>
      {state === 'working' && <Loading />}
      {state === 'ok' && <><P>{t('Your email is confirmed. Your first fortune awaits!')}</P><Button title={t('Continue')} onPress={() => router.replace(me ? '/home' : '/login')} /></>}
      {state === 'error' && <><P>{msg}</P><Button title={t('Back to the app')} onPress={() => router.replace('/')} /></>}
    </Screen>
  );
}

import { useState } from 'react';
import { Button, Field, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';

export default function Forgot() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <Screen title={t('Reset your password')} back>
      {sent ? (
        <P>{t('If an account exists for {email}, we sent a link to reset your password. It expires in 1 hour.', { email })}</P>
      ) : (
        <>
          <Field label={t('Email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Button title={t('Send reset link')} onPress={async () => { await api('/auth/forgot', { body: { email } }).catch(() => {}); setSent(true); }} />
        </>
      )}
    </Screen>
  );
}

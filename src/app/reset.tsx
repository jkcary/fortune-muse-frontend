import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button, ErrorText, Field, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';

/** Opened from the reset email: /reset?token=… */
export default function Reset() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { signIn } = useSession();
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Screen title="Choose a new password">
      <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <ErrorText>{err}</ErrorText>
      <Button title="Save password" onPress={async () => {
        try {
          const r = await api<{ token: string }>('/auth/reset', { body: { token, password } });
          await signIn(r.token);
          router.replace('/home');
        } catch (e: any) { setErr(e.message); }
      }} />
    </Screen>
  );
}

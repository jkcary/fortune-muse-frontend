import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Card, ErrorText, Field, H2, Loading, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { SUPPORT_EMAIL } from '@/lib/config';
import { useSession } from '@/lib/session';
import { colors, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

function Item({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={s.item}>
      <Text style={s.itemText}>{label}</Text><Text style={{ color: colors.muted }}>›</Text>
    </Pressable>
  );
}

export default function Settings() {
  const me = useAuthed();
  const { refresh, signOut } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  if (!me) return <Screen back><Loading /></Screen>;

  async function toggle(path: string, enabled: boolean) {
    await api(path, { method: 'PATCH', body: { enabled } });
    refresh();
  }

  async function exportData() {
    const data = await api('/account/export', { body: {} });
    const json = JSON.stringify(data, null, 2);
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = `fortune-muse-data-${me!.handle}.json`;
      a.click();
    } else {
      // Native: email-free export — show it so the user can copy or share it.
      router.push({ pathname: '/export', params: { json } });
    }
  }

  async function privacyRequest(type: 'do_not_sell' | 'access' | 'delete' | 'correct') {
    const r = await api('/privacy-requests', { body: { email: me!.email, type } });
    setInfo(r.message);
  }

  return (
    <Screen back title="Settings">
      <Card>
        <H2>Your spirit’s memory</H2>
        <View style={s.switchRow}>
          <P style={{ flex: 1 }}>Let fortune spirits remember what I tell them</P>
          <Switch value={me.memory_enabled} onValueChange={(v) => toggle('/settings/memory', v)} trackColor={{ true: colors.gold }} accessibilityLabel="Memory" />
        </View>
        <P muted style={{ fontSize: 13 }}>Spirits only remember what you write in “How are you feeling today?”. When off, nothing is read or saved.</P>
        <Item label="What I remember" onPress={() => router.push('/memories')} />
      </Card>

      <Card>
        <H2>Rooms</H2>
        <View style={s.switchRow}>
          <P style={{ flex: 1 }}>Join same-question rooms</P>
          <Switch value={me.rooms_enabled} onValueChange={(v) => toggle('/settings/rooms', v)} trackColor={{ true: colors.gold }} accessibilityLabel="Rooms" />
        </View>
      </Card>

      <Card>
        <H2>Account</H2>
        <P muted>{me.email} · {me.handle}</P>
        <Item label="Edit avatar" onPress={() => router.push('/avatar')} />
        <Item label="Readings & receipts" onPress={() => router.push('/history')} />
        <Item label="Download my data (JSON)" onPress={exportData} />
        <Item label="Terms of Use" onPress={() => router.push('/legal/terms')} />
        <Item label="Privacy Policy" onPress={() => router.push('/legal/privacy')} />
        <Item label="Contact support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
      </Card>

      <Card>
        <H2>Your US privacy choices</H2>
        <Item label="Do not sell or share my personal information" onPress={() => privacyRequest('do_not_sell')} />
        <Item label="Request a copy of my information" onPress={() => privacyRequest('access')} />
        <Item label="Request a correction" onPress={() => privacyRequest('correct')} />
        {info && <P style={{ color: colors.green, marginTop: space(2) }}>{info}</P>}
      </Card>

      <Button kind="secondary" title="Sign out" onPress={async () => { await signOut(); router.replace('/welcome'); }} />

      {!deleting ? (
        <Button kind="ghost" title="Delete my account" onPress={() => setDeleting(true)} />
      ) : (
        <Card style={{ borderColor: colors.red }}>
          <H2>Delete account</H2>
          <P style={{ marginBottom: space(3) }}>This permanently deletes your profile, readings, memories, rooms and rewards. Receipts are kept without your name for tax records.</P>
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <ErrorText>{err}</ErrorText>
          <Button kind="danger" title="Delete everything" onPress={async () => {
            try {
              await api('/account', { method: 'DELETE', body: { confirm: 'DELETE', password } });
              await signOut();
              router.replace('/welcome');
            } catch (e: any) { setErr(e.message); }
          }} />
          <Button kind="ghost" title="Cancel" onPress={() => setDeleting(false)} />
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space(3), marginBottom: space(2) },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space(3), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  itemText: { fontSize: 15, color: colors.ink },
});

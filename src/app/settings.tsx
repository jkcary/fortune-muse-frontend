import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Card, ErrorText, Field, H2, Loading, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { SUPPORT_EMAIL } from '@/lib/config';
import { LANGUAGES, useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { colors, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

function Item({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={s.item}>
      <Text style={s.itemText}>{label}</Text>
      <Text style={{ color: colors.muted }}>{value ? `${value}  ` : ''}›</Text>
    </Pressable>
  );
}

/** Language picker. Each option is written in its own language. Switching applies at once and is saved to the account. */
function LanguagePicker() {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.id === lang)!;
  return (
    <>
      <Item label={t('Language')} value={current.label} onPress={() => setOpen((o) => !o)} />
      {open && LANGUAGES.map((l) => (
        <Pressable key={l.id} onPress={() => { setLang(l.id); setOpen(false); }} accessibilityRole="radio"
          accessibilityState={{ checked: l.id === lang }} style={s.option}>
          <Text style={[s.itemText, l.id === lang && { fontWeight: '700', color: colors.red }]}>{l.label}</Text>
          {l.id === lang && <Text style={{ color: colors.red, fontWeight: '700' }}>✓</Text>}
        </Pressable>
      ))}
    </>
  );
}

export default function Settings() {
  const me = useAuthed();
  const { refresh, signOut } = useSession();
  const { t } = useI18n();
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
    <Screen back title={t('Settings')}>
      <Card>
        <H2>{t('Your spirit’s memory')}</H2>
        <View style={s.switchRow}>
          <P style={{ flex: 1 }}>{t('Let fortune spirits remember what I tell them')}</P>
          <Switch value={me.memory_enabled} onValueChange={(v) => toggle('/settings/memory', v)} trackColor={{ true: colors.gold }} accessibilityLabel={t('Memory')} />
        </View>
        <P muted style={{ fontSize: 13 }}>{t('Spirits only remember what you write in “How are you feeling today?”. When off, nothing is read or saved.')}</P>
        <Item label={t('What I remember')} onPress={() => router.push('/memories')} />
      </Card>

      <Card>
        <H2>{t('Rooms')}</H2>
        <View style={s.switchRow}>
          <P style={{ flex: 1 }}>{t('Join same-question rooms')}</P>
          <Switch value={me.rooms_enabled} onValueChange={(v) => toggle('/settings/rooms', v)} trackColor={{ true: colors.gold }} accessibilityLabel={t('Rooms')} />
        </View>
      </Card>

      <Card>
        <H2>{t('Account')}</H2>
        <P muted>{me.email} · {me.handle}</P>
        <LanguagePicker />
        <Item label={t('Edit avatar')} onPress={() => router.push('/avatar')} />
        <Item label={t('Readings & receipts')} onPress={() => router.push('/history')} />
        <Item label={t('Download my data (JSON)')} onPress={exportData} />
        <Item label={t('Terms of Use')} onPress={() => router.push('/legal/terms')} />
        <Item label={t('Privacy Policy')} onPress={() => router.push('/legal/privacy')} />
        <Item label={t('Contact support')} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
      </Card>

      <Card>
        <H2>{t('Your US privacy choices')}</H2>
        <Item label={t('Do not sell or share my personal information')} onPress={() => privacyRequest('do_not_sell')} />
        <Item label={t('Request a copy of my information')} onPress={() => privacyRequest('access')} />
        <Item label={t('Request a correction')} onPress={() => privacyRequest('correct')} />
        {info && <P style={{ color: colors.green, marginTop: space(2) }}>{info}</P>}
      </Card>

      <Button kind="secondary" title={t('Sign out')} onPress={async () => { await signOut(); router.replace('/welcome'); }} />

      {!deleting ? (
        <Button kind="ghost" title={t('Delete my account')} onPress={() => setDeleting(true)} />
      ) : (
        <Card style={{ borderColor: colors.red }}>
          <H2>{t('Delete account')}</H2>
          <P style={{ marginBottom: space(3) }}>{t('This permanently deletes your profile, readings, memories, rooms and rewards. Receipts are kept without your name for tax records.')}</P>
          <Field label={t('Password')} value={password} onChangeText={setPassword} secureTextEntry />
          <ErrorText>{err}</ErrorText>
          <Button kind="danger" title={t('Delete everything')} onPress={async () => {
            try {
              await api('/account', { method: 'DELETE', body: { confirm: 'DELETE', password } });
              await signOut();
              router.replace('/welcome');
            } catch (e: any) { setErr(e.message); }
          }} />
          <Button kind="ghost" title={t('Cancel')} onPress={() => setDeleting(false)} />
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space(3), marginBottom: space(2) },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space(3), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  itemText: { fontSize: 15, color: colors.ink },
  option: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space(3), paddingLeft: space(4), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});

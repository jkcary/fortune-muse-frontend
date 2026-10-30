import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button, Chip, ErrorText, H2, Loading, P, Screen } from '@/components/ui';
import { api, type AvatarData, type Mood } from '@/lib/api';
import { useSession } from '@/lib/session';
import { space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

interface Options { base: string[]; palette: string[]; accessory: string[]; background: string[]; moods: Mood[]; unlockable: { accessory: string[]; background: string[] } }
const nice = (s: string) => s.replace(/^bg-/, '').replace(/-/g, ' ');

export default function AvatarEditor() {
  const me = useAuthed();
  const { refresh } = useSession();
  const [opts, setOpts] = useState<Options | null>(null);
  const [draft, setDraft] = useState<AvatarData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/avatar/options').then(setOpts); }, []);
  useEffect(() => { if (me && !draft) setDraft(me.avatar); }, [me, draft]);
  if (!me || !opts || !draft) return <Screen back><Loading /></Screen>;

  const owned = new Set(me.inventory.map((i) => i.asset));
  const accessories = [...opts.accessory, ...opts.unlockable.accessory.filter((a) => owned.has(a))];
  const backgrounds = [...opts.background, ...opts.unlockable.background.filter((b) => owned.has(b))];
  const set = (patch: Partial<AvatarData['customization']>) => setDraft({ ...draft, customization: { ...draft.customization, ...patch } });

  const group = (title: string, items: string[], current: string, onPick: (v: string) => void) => (
    <View style={{ marginBottom: space(3) }}>
      <H2>{title}</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.map((x) => <Chip key={x} label={nice(x)} selected={current === x} onPress={() => onPick(x)} />)}
      </View>
    </View>
  );

  return (
    <Screen back title="Your avatar">
      <View style={{ alignItems: 'center', marginVertical: space(4) }}><Avatar avatar={draft} size={160} /></View>
      <P muted style={{ textAlign: 'center', marginBottom: space(4) }}>Your avatar’s face follows the mood you share after a reading. Win extra items from the daily draw.</P>
      {group('Character', opts.base, draft.baseId, (v) => setDraft({ ...draft, baseId: v }))}
      {group('Colors', opts.palette, draft.customization.palette, (v) => set({ palette: v }))}
      {group('Accessory', accessories, draft.customization.accessory, (v) => set({ accessory: v }))}
      {group('Background', backgrounds, draft.customization.background, (v) => set({ background: v }))}
      {group('Mood', opts.moods, draft.mood, (v) => setDraft({ ...draft, mood: v as Mood }))}
      <ErrorText>{err}</ErrorText>
      <Button title="Save avatar" loading={busy} onPress={async () => {
        setBusy(true);
        try {
          await api('/me/avatar', { method: 'PATCH', body: { baseId: draft.baseId, ...draft.customization, mood: draft.mood } });
          await refresh();
          setErr(null);
        } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
      }} />
    </Screen>
  );
}

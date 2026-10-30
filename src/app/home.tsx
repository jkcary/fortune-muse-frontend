import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { DeityArt } from '@/components/DeityArt';
import { Button, Card, Chip, EntertainmentNote, H2, Loading, P, Screen } from '@/components/ui';
import { api, type Deity, type Topic } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, fonts, radius, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

export default function Home() {
  const me = useAuthed();
  const { refresh } = useSession();
  const [deities, setDeities] = useState<Deity[]>([]);
  const [deityId, setDeityId] = useState<string>('master-bao');
  const [topic, setTopic] = useState<Topic>('wealth');
  const [greeting, setGreeting] = useState<{ text: string; memoryRef: unknown } | null>(null);
  const [drawn, setDrawn] = useState<boolean | null>(null);
  const [rooms, setRooms] = useState<{ id: string; label: string }[]>([]);
  const [resent, setResent] = useState(false);

  useEffect(() => { api('/deities').then((d) => setDeities(d.deities)).catch(() => {}); }, []);
  useEffect(() => {
    if (!me) return;
    setGreeting(null);
    api(`/greeting?deityId=${deityId}`).then(setGreeting).catch(() => {});
  }, [deityId, me]);
  useFocusEffect(useCallback(() => {
    refresh();
    api('/draws/today').then((d) => setDrawn(d.drawn)).catch(() => {});
    api('/rooms/current').then((r) => setRooms(r.rooms)).catch(() => {});
  }, [refresh]));

  if (!me) return <Screen><Loading /></Screen>;
  const deity = deities.find((d) => d.id === deityId);

  return (
    <Screen>
      <View style={s.top}>
        <Pressable onPress={() => router.push('/avatar')} accessibilityLabel="Edit avatar" style={s.me}>
          <Avatar avatar={me.avatar} size={56} />
          <View>
            <Text style={s.handle}>{me.handle}</Text>
            <Text style={s.small}>Tap to dress up your avatar</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => router.push('/settings')} accessibilityLabel="Settings" hitSlop={12}>
          <Text style={{ fontSize: 24 }}>⚙️</Text>
        </Pressable>
      </View>

      {!me.email_verified && (
        <Card style={{ backgroundColor: '#FFF1C9', borderColor: '#F0D58A' }}>
          <P>Confirm your email to unlock readings and rooms. We sent a link to {me.email}.</P>
          <Button kind="secondary" title={resent ? 'Sent! Check your inbox' : 'Resend the link'} disabled={resent}
            onPress={() => api('/auth/resend-verification', { body: {} }).then(() => setResent(true))} style={{ marginTop: space(2) }} />
        </Card>
      )}

      <H2>Choose your fortune spirit</H2>
      <View style={s.deities}>
        {deities.map((d) => (
          <Pressable key={d.id} onPress={() => setDeityId(d.id)} accessibilityRole="button" accessibilityState={{ selected: d.id === deityId }}
            style={[s.deity, d.id === deityId && { borderColor: d.image_assets.primary, backgroundColor: '#FFFBF1' }]}>
            <DeityArt theme={d.theme} size={64} />
            <Text style={s.deityName} numberOfLines={1}>{d.name}</Text>
          </Pressable>
        ))}
      </View>

      {deity && (
        <Card>
          <Text style={s.deityTitle}>{deity.name} · {deity.title}</Text>
          <View style={s.bubble}>
            <P>{greeting?.text ?? deity.greeting}</P>
          </View>
          {Boolean(greeting?.memoryRef) && <Text style={s.small}>Based on what you told me. Manage this in Settings › What I remember.</Text>}
        </Card>
      )}

      <H2>What’s on your mind?</H2>
      <View style={{ flexDirection: 'row', marginBottom: space(3) }}>
        <Chip label="💰 Wealth" selected={topic === 'wealth'} onPress={() => setTopic('wealth')} color={colors.wealth} />
        <Chip label="❤️ Love" selected={topic === 'love'} onPress={() => setTopic('love')} color={colors.love} />
      </View>
      <Button title="Ask for a fortune" onPress={() => router.push({ pathname: '/ask', params: { deityId, topic } })} disabled={!me.email_verified} />

      <Card style={{ marginTop: space(4) }}>
        <H2>🎴 Daily free draw</H2>
        <P muted>One free card every day. No purchase needed.</P>
        <Button kind="secondary" style={{ marginTop: space(3) }} title={drawn ? 'See today’s card' : 'Draw today’s card'} onPress={() => router.push('/draw')} />
        {me.freeReadings > 0 && <P style={{ color: colors.green }}>You have {me.freeReadings} free reading voucher{me.freeReadings > 1 ? 's' : ''}.</P>}
      </Card>

      {rooms.length > 0 && (
        <Card>
          <H2>💬 Your rooms today</H2>
          {rooms.map((r) => <Button key={r.id} kind="secondary" title={r.label} onPress={() => router.push(`/room/${r.id}`)} />)}
        </Card>
      )}

      <Button kind="ghost" title="My past readings" onPress={() => router.push('/history')} />
      <EntertainmentNote />
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space(3) },
  me: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  handle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  small: { fontSize: 12, color: colors.muted },
  deities: { flexDirection: 'row', gap: space(2), marginBottom: space(3) },
  deity: { flex: 1, alignItems: 'center', padding: space(2), borderRadius: radius, borderWidth: 2, borderColor: colors.line, backgroundColor: '#fff' },
  deityName: { fontSize: 13, fontWeight: '600', color: colors.ink, marginTop: space(1) },
  deityTitle: { fontFamily: fonts.display, fontSize: 16, fontWeight: '700', color: colors.goldDeep, marginBottom: space(2) },
  bubble: { backgroundColor: '#FFF8EC', borderRadius: 12, padding: space(3), marginBottom: space(2) },
});

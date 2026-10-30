import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DeityArt } from '@/components/DeityArt';
import { Button, Card, Chip, EntertainmentNote, ErrorText, Field, H1, H2, Loading, P, Screen } from '@/components/ui';
import { api, type Deity, type Mood, type Reading } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, fonts, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

const MOODS: { key: Mood; label: string }[] = [
  { key: 'happy', label: '😊 Happy' }, { key: 'calm', label: '😌 Calm' }, { key: 'hopeful', label: '🤞 Hopeful' },
  { key: 'surprised', label: '😮 Surprised' }, { key: 'low', label: '😔 Low' },
];

function Shaking({ theme }: { theme: string }) {
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(r, { toValue: 1, duration: 140, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(r, { toValue: -1, duration: 280, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(r, { toValue: 0, duration: 140, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
      Animated.delay(400),
    ]));
    loop.start();
    return () => loop.stop();
  }, [r]);
  const rotate = r.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });
  return <Animated.View style={{ transform: [{ rotate }], alignSelf: 'center' }}><DeityArt theme={theme} size={140} /></Animated.View>;
}

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <View style={s.row}>
      <Text style={s.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        {typeof children === 'string' ? <P>{children}</P> : children}
      </View>
    </View>
  );
}

export default function ReadingScreen() {
  const me = useAuthed();
  const { refresh } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reading, setReading] = useState<Reading | null>(null);
  const [deity, setDeity] = useState<Deity | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [fbState, setFbState] = useState<'idle' | 'saved' | 'not_saved'>('idle');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async (n = 0) => {
      try {
        const { reading: r } = await api<{ reading: Reading }>(`/readings/${id}`);
        if (!alive) return;
        setReading(r);
        // Payment webhooks can take a few seconds; keep polling while we wait.
        if ((r.status === 'generating' || r.status === 'awaiting_payment') && n < 90) timer = setTimeout(() => poll(n + 1), 1500);
      } catch (e: any) { setErr(e.message); }
    };
    poll();
    return () => { alive = false; clearTimeout(timer); };
  }, [id]);

  useEffect(() => {
    if (reading) api('/deities').then((d) => setDeity(d.deities.find((x: Deity) => x.id === reading.deityId) ?? null));
  }, [reading?.deityId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!me || !reading) return <Screen back>{err ? <ErrorText>{err}</ErrorText> : <Loading />}</Screen>;
  const res = reading.result;

  if (reading.status === 'awaiting_payment' || reading.status === 'generating') {
    return (
      <Screen back>
        <View style={{ paddingTop: space(16) }}>
          <Shaking theme={deity?.theme ?? 'ingot'} />
          <H2 style={{ textAlign: 'center', marginTop: space(6) }}>{reading.status === 'awaiting_payment' ? 'Waiting for your payment…' : `${deity?.name ?? 'Your spirit'} is drawing your fortune…`}</H2>
          <P muted style={{ textAlign: 'center' }}>“{reading.question}”</P>
        </View>
      </Screen>
    );
  }

  if (!res) {
    return (
      <Screen back title="Fortune unavailable">
        <P>We couldn’t draw this fortune. {reading.status === 'refunded' ? 'Your payment has been refunded automatically.' : 'Please try again.'}</P>
        <Button title="Back home" onPress={() => router.replace('/home')} />
      </Screen>
    );
  }

  async function sendFeedback() {
    if (!mood && !note.trim()) return;
    const r = await api('/feedback', { body: { readingId: reading!.id, content: note.trim(), mood: mood ?? undefined } });
    setFbState(r.saved ? 'saved' : 'not_saved');
    refresh();
  }

  async function joinRoom() {
    setJoining(true);
    try {
      const r = await api('/rooms/join', { body: { readingId: reading!.id } });
      router.push(`/room/${r.room.id}`);
    } catch (e: any) { setErr(e.message); } finally { setJoining(false); }
  }

  return (
    <Screen back>
      <EntertainmentNote ai />
      <View style={{ alignItems: 'center', marginBottom: space(2) }}>
        <DeityArt theme={deity?.theme ?? 'ingot'} size={96} />
        <H1 style={{ textAlign: 'center', fontSize: 24 }}>{reading.topic === 'wealth' ? '💰 Your wealth fortune' : '❤️ Your love fortune'}</H1>
        <P muted style={{ textAlign: 'center' }}>“{reading.question}”</P>
      </View>

      <Card style={{ backgroundColor: '#FFFBF1' }}>
        <Text style={s.deityMsg}>{res.deityMessage}</Text>
        <P>{res.answer}</P>
      </Card>

      <Card>
        <Row icon="🧭" label="Lucky direction"><P><Text style={{ fontWeight: '700' }}>{res.direction.value}</Text> — {res.direction.note}</P></Row>
        <Row icon="✅" label="Today’s lucky action">{res.luckyAction}</Row>
        {res.luckyHour ? <Row icon="⏰" label="Lucky hour">{res.luckyHour}</Row> : null}
        <Row icon="👔" label="Lucky outfit">{`${res.outfit.color} ${res.outfit.style.toLowerCase()}`}</Row>
        <Row icon="👟" label="Lucky shoes">{`${res.shoes.color} ${res.shoes.style.toLowerCase()}`}</Row>
        <Row icon="🚫" label="Color to skip today">{res.avoidColor}</Row>
        <Row icon="🎵" label="Lucky song">
          <P>{res.song.title} — {res.song.artist}</P>
          <View style={{ flexDirection: 'row', gap: space(4), marginTop: space(1) }}>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(res.song.spotifyUrl)}><Text style={s.link}>Spotify ↗</Text></Pressable>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(res.song.appleMusicUrl)}><Text style={s.link}>Apple Music ↗</Text></Pressable>
          </View>
        </Row>
        <Row icon="🍵" label="Lucky drink">{res.drink}</Row>
        <Row icon="🥟" label="Lucky food">{res.food}</Row>
      </Card>

      <View style={{ flexDirection: 'row', gap: space(3) }}>
        <Card style={{ flex: 1 }}>
          <Text style={[s.label, { color: colors.green }]}>DO TODAY</Text>
          {res.dos.map((d) => <P key={d}>• {d}</P>)}
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={[s.label, { color: colors.red }]}>AVOID TODAY</Text>
          {res.donts.map((d) => <P key={d}>• {d}</P>)}
        </Card>
      </View>

      {res.reflections?.length ? (
        <Card><H2>Reflect on this</H2>{res.reflections.map((q) => <P key={q}>• {q}</P>)}</Card>
      ) : null}

      <Card style={{ backgroundColor: '#F4F9F5', borderColor: '#D5E8DB' }}>
        <P>💛 {res.gentleReminder}</P>
      </Card>

      <Card>
        <H2>How are you feeling today?</H2>
        {fbState === 'idle' ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {MOODS.map((m) => <Chip key={m.key} label={m.label} selected={mood === m.key} onPress={() => setMood(m.key)} />)}
            </View>
            <Field label="Anything you want me to remember? (optional)" value={note} onChangeText={setNote} multiline maxLength={500} />
            <P muted style={{ fontSize: 12, marginBottom: space(2) }}>
              {me.memory_enabled
                ? 'Your spirit will only remember what you write here, and you can view or delete it in Settings.'
                : 'Memory is off, so this only updates your avatar’s mood.'}
            </P>
            <Button kind="secondary" title="Save" onPress={sendFeedback} disabled={!mood && !note.trim()} />
          </>
        ) : (
          <P>{fbState === 'saved' ? 'Thank you. I’ll remember this tomorrow. 🙏' : 'Thanks! Your avatar’s mood is updated.'}</P>
        )}
      </Card>

      <ErrorText>{err}</ErrorText>
      {me.rooms_enabled && <Button title="💬 Chat with people who asked the same" onPress={joinRoom} loading={joining} />}
      <Button kind="secondary" title="🎴 Get my free daily card" onPress={() => router.push('/draw')} />
      <Button kind="ghost" title="Back home" onPress={() => router.replace('/home')} />
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space(3), paddingVertical: space(2), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  icon: { fontSize: 22, width: 28, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase' },
  link: { color: colors.goldDeep, fontWeight: '600' },
  deityMsg: { fontFamily: fonts.display, fontSize: 17, fontStyle: 'italic', color: colors.goldDeep, marginBottom: space(2) },
});

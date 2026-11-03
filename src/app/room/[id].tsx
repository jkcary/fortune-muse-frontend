import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button, Card, ErrorText, H2, Loading, P, Screen } from '@/components/ui';
import { api, wsUrl, type AvatarData } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { colors, radius, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

interface Msg { id: string; text: string; created_at: string; user_id: string | null; handle: string | null }
interface Member { id: string; handle: string; avatar: AvatarData }
const REASONS = [['harassment', 'Harassment'], ['hate', 'Hate'], ['sexual', 'Sexual content'], ['spam', 'Spam'], ['scam', 'Scam'], ['underage', 'Under 18'], ['other', 'Other']];

export default function Room() {
  const me = useAuthed();
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState<{ label: string; expiresAt: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [target, setTarget] = useState<Msg | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const list = useRef<FlatList<Msg>>(null);

  const load = () => api(`/rooms/${id}`).then((r) => { setRoom(r.room); setMembers(r.members); setMessages(r.messages); }).catch((e) => { setErr(e.message); setClosed(true); });

  useEffect(() => {
    load();
    const sock = new WebSocket(wsUrl(`/rooms/${id}/ws`));
    ws.current = sock;
    sock.onmessage = (ev) => {
      const m = JSON.parse(String(ev.data));
      if (m.type === 'message') setMessages((xs) => (xs.some((x) => x.id === m.message.id) ? xs : [...xs, m.message]));
      if (m.type === 'presence') load();
      if (m.type === 'error') setErr(m.message);
      if (m.type === 'closed') setClosed(true);
    };
    return () => sock.close();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!me) return <Screen back><Loading /></Screen>;

  function send() {
    const t = text.trim();
    if (!t) return;
    setErr(null);
    if (ws.current?.readyState === 1) ws.current.send(JSON.stringify({ type: 'message', text: t }));
    else api(`/rooms/${id}/messages`, { body: { text: t } }).catch((e) => setErr(e.message));
    setText('');
  }

  const hoursLeft = room ? Math.max(0, Math.round((Date.parse(room.expiresAt) - Date.now()) / 3_600_000)) : 0;

  if (closed) return <Screen back title={t('Room closed')}><P>{err ?? t('This room has closed. Rooms disappear 24 hours after they open.')}</P></Screen>;

  return (
    <Screen back scroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={s.title}>{room ? t(room.label) : '…'}</Text>
        <P muted style={{ fontSize: 12 }}>{t('People who asked a similar question today · closes in about {h}h and all messages are deleted', { h: hoursLeft })}</P>
        <FlatList horizontal data={members} keyExtractor={(m) => m.id} style={{ flexGrow: 0, marginVertical: space(2) }}
          renderItem={({ item }) => (
            <View style={{ alignItems: 'center', marginRight: space(3), width: 64 }}>
              <Avatar avatar={item.avatar} size={44} />
              <Text numberOfLines={1} style={{ fontSize: 10, color: colors.muted }}>{item.id === me.id ? t('You') : item.handle}</Text>
            </View>
          )} />
        <FlatList ref={list} data={messages} keyExtractor={(m) => m.id} style={{ flex: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<P muted style={{ textAlign: 'center', marginTop: space(8) }}>{t('Say hi and share a little luck 🍀')}</P>}
          renderItem={({ item }) => {
            const mine = item.user_id === me.id;
            return (
              <Pressable onLongPress={() => !mine && setTarget(item)} accessibilityHint={mine ? undefined : t('Long press to report or block')}
                style={[s.bubble, mine ? s.mine : s.theirs]}>
                {!mine && <Text style={s.who}>{item.handle ?? t('Someone')}</Text>}
                <Text style={{ color: mine ? '#171A20' : colors.ink, fontSize: 15 }}>{item.text}</Text>
                {!mine && <Pressable onPress={() => setTarget(item)} hitSlop={8}><Text style={s.more}>•••</Text></Pressable>}
              </Pressable>
            );
          }} />
        {target && (
          <Card style={{ borderColor: colors.red }}>
            <H2>{target.handle}</H2>
            <P muted style={{ marginBottom: space(2) }}>{t('Report this message or block this person. Blocked people can’t see you and you won’t see them.')}</P>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginBottom: space(2) }}>
              {REASONS.map(([k, label]) => (
                <Pressable key={k} style={s.reason} onPress={async () => {
                  await api('/reports', { body: { messageId: target.id, reason: k } }).catch((e) => setErr(e.message));
                  setTarget(null); setErr(t('Thanks — our team will review this.'));
                }}><Text>{t(label)}</Text></Pressable>
              ))}
            </View>
            <Button kind="danger" title={t('Block {name}', { name: target.handle ?? '' })} onPress={async () => {
              if (target.user_id) await api('/blocks', { body: { userId: target.user_id } });
              setTarget(null); load();
            }} />
            <Button kind="ghost" title={t('Cancel')} onPress={() => setTarget(null)} />
          </Card>
        )}
        <ErrorText>{err}</ErrorText>
        <View style={s.composer}>
          <TextInput value={text} onChangeText={setText} placeholder={t('Message (no links or contact info)')} placeholderTextColor="#B0A390"
            style={s.input} maxLength={500} onSubmitEditing={send} returnKeyType="send" accessibilityLabel={t('Message')} />
          <Pressable onPress={send} style={s.send} accessibilityRole="button" accessibilityLabel={t('Send')}><Text style={{ color: '#171A20', fontWeight: '700' }}>{t('Send')}</Text></Pressable>
        </View>
        <Button kind="ghost" title={t('Leave room')} onPress={async () => { await api(`/rooms/${id}/leave`, { body: {} }); router.replace('/home'); }} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: space(1) },
  bubble: { maxWidth: '80%', borderRadius: radius, padding: space(3), marginVertical: space(1) },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.red },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  who: { fontSize: 11, fontWeight: '700', color: colors.goldDeep, marginBottom: 2 },
  more: { color: colors.muted, fontSize: 12, alignSelf: 'flex-end' },
  composer: { flexDirection: 'row', gap: space(2), paddingVertical: space(2) },
  input: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: space(4), paddingVertical: space(3), fontSize: 15, color: colors.ink },
  send: { backgroundColor: colors.red, borderRadius: 999, paddingHorizontal: space(5), justifyContent: 'center' },
  reason: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: space(3), paddingVertical: space(2), backgroundColor: colors.card },
});

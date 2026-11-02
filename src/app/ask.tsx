import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { DeityArt } from '@/components/DeityArt';
import { SafetyCard } from '@/components/SafetyCard';
import { Button, Card, Check, Chip, EntertainmentNote, ErrorText, H2, Loading, P, Screen } from '@/components/ui';
import { api, money, type Deity, type IntakeSummary, type SafetyResponse, type Tier, type Topic, type Turn } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { colors, radius, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';
import { useVoiceInput } from '@/lib/voice';

type Prices = Record<Tier, { amount: number; label: string; description: string }>;
type IntakeResponse = { reply: string; ready: boolean; summary: IntakeSummary } | { safety: SafetyResponse };

const MAX_LEN = 200;

function MicIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="11" rx="3" fill={color} />
      <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function SendIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12l16-8-6 16-2.5-6.5L4 12z" fill="#fff" />
    </Svg>
  );
}

function Bubble({ turn, deity }: { turn: Turn; deity: Deity }) {
  if (turn.role === 'user') return <View style={[s.bubble, s.mine]}><Text style={s.mineText}>{turn.text}</Text></View>;
  return (
    <View style={s.deityRow}>
      <DeityArt theme={deity.theme} size={32} />
      <View style={[s.bubble, s.theirs]}><Text style={s.theirsText}>{turn.text}</Text></View>
    </View>
  );
}

/**
 * Ask: a short conversation with the spirit before the reading (POST /readings/intake), typed or spoken.
 * Chatting is free; once the spirit has what it needs the user picks a tier and pays as before.
 */
export default function Ask() {
  const me = useAuthed();
  const { t, lang } = useI18n();
  const params = useLocalSearchParams<{ deityId: string; topic: Topic }>();
  const topic: Topic = params.topic === 'love' ? 'love' : 'wealth';
  const [catalog, setCatalog] = useState<{ deities: Deity[]; prices: Prices; questionTemplates: Record<Topic, string[]> } | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [summary, setSummary] = useState<IntakeSummary | null>(null);
  const [readyLine, setReadyLine] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier>('standard');
  const [useVoucher, setUseVoucher] = useState(false);
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [safety, setSafety] = useState<SafetyResponse | null>(null);
  const [devOrder, setDevOrder] = useState<{ orderId: string; readingId: string; amount: number } | null>(null);

  // Speech is added to whatever was already typed.
  const typedBefore = useRef('');
  const voice = useVoiceInput(lang, (heard) => setInput(`${typedBefore.current}${heard}`.slice(0, MAX_LEN)));

  useEffect(() => { api('/deities').then(setCatalog).catch((e) => setErr(e.message)); }, []);
  if (!me || !catalog) return <Screen back><Loading /></Screen>;
  const deity = catalog.deities.find((d) => d.id === params.deityId) ?? catalog.deities[0];
  const name = t(deity.name);
  const voucher = !me.super && useVoucher && me.freeReadings > 0;
  const asked = turns.some((x) => x.role === 'user');

  async function talk(next: Turn[], start: boolean) {
    setErr(null);
    setThinking(true);
    try {
      const r = await api<IntakeResponse>('/readings/intake', { body: { deityId: deity.id, topic, turns: next, start } });
      if ('safety' in r) { setSafety(r.safety); return; }
      // The transcript alternates user/spirit; after "Start now" on a spirit turn, the closing line is shown on its own.
      if (next.at(-1)?.role === 'user') setTurns([...next, { role: 'assistant', text: r.reply }]);
      else setReadyLine(r.reply);
      if (r.ready) setSummary(r.summary);
    } catch (e: any) {
      setTurns(turns);
      if (next.at(-1)?.role === 'user' && next !== turns) setInput(next.at(-1)!.text);
      setErr(e.message);
    } finally {
      setThinking(false);
    }
  }

  function send(text = input) {
    const msg = text.trim().slice(0, MAX_LEN);
    if (!msg || thinking) return;
    if (!asked && msg.length < 3) return setErr(t('Please write a few more words.'));
    voice.stop();
    voice.clearError();
    const next: Turn[] = [...turns, { role: 'user', text: msg }];
    setTurns(next);
    setInput('');
    void talk(next, false);
  }

  function startNow() {
    if (!asked) return setErr(t('Tell me your question first.'));
    voice.stop();
    void talk(turns, true);
  }

  function startOver() {
    setTurns([]); setSummary(null); setReadyLine(null); setInput(''); setErr(null); setConsent(false);
  }

  function toggleMic() {
    if (voice.listening) return voice.stop();
    typedBefore.current = input ? `${input.trimEnd()} ` : '';
    void voice.start();
  }

  async function submit() {
    if (!summary) return;
    setErr(null);
    if (!consent) return setErr(t('Please confirm the box above to continue.'));
    setBusy(true);
    try {
      const res = await api('/readings', { body: {
        deityId: deity.id, topic, tier: voucher ? 'standard' : tier, question: summary.question,
        intake: { turns, summary }, useVoucher: voucher, digitalContentConsent: true,
      } });
      if (res.safety) { setSafety(res.safety); return; }
      const id = res.reading.id;
      if (res.payment.type === 'none') router.replace(`/reading/${id}`);
      else if (res.payment.type === 'dev') setDevOrder({ orderId: res.payment.orderId, readingId: id, amount: res.payment.amount });
      else if (Platform.OS === 'web') window.location.href = res.payment.checkoutUrl;
      else {
        await WebBrowser.openBrowserAsync(res.payment.checkoutUrl);
        router.replace(`/reading/${id}`);
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (safety) return <Screen back title={t('Let’s pause')}><SafetyCard safety={safety} /><Button kind="secondary" title={t('Back home')} onPress={() => router.replace('/home')} /></Screen>;

  if (devOrder) {
    return (
      <Screen back title={t('Test checkout')}>
        <Card>
          <P>{t('Development mode: Stripe is not connected, so this button stands in for checkout. No real money moves.')}</P>
          <H2 style={{ marginTop: space(3) }}>{money(devOrder.amount)}</H2>
        </Card>
        <Button title={t('Pay (test)')} loading={busy} onPress={async () => {
          setBusy(true);
          await api('/payments/dev/confirm', { body: { orderId: devOrder.orderId } }).catch((e) => setErr(e.message));
          router.replace(`/reading/${devOrder.readingId}`);
        }} />
        <ErrorText>{err}</ErrorText>
      </Screen>
    );
  }

  const voiceError = voice.error === 'denied' ? t('Microphone access is needed for voice input.')
    : voice.error ? t('Voice input didn’t catch that. Please try again or type.') : null;

  return (
    <Screen back title={t(topic === 'wealth' ? '💰 Ask about wealth' : '❤️ Ask about love')}>
      <Bubble deity={deity} turn={{ role: 'assistant', text: t(deity.greeting) }} />
      <Bubble deity={deity} turn={{ role: 'assistant', text: t(topic === 'wealth'
        ? 'What would you like to ask about money today? Tell me in your own words.'
        : 'What would you like to ask about love today? Tell me in your own words.') }} />

      {!asked && (
        <>
          <P muted style={{ fontSize: 13, marginTop: space(2), marginBottom: space(1) }}>{t('Or start with one of these:')}</P>
          <View style={s.wrap}>
            {catalog.questionTemplates[topic].map((q) => <Chip key={q} label={t(q)} onPress={() => send(t(q))} />)}
          </View>
        </>
      )}

      {turns.map((turn, i) => <Bubble key={i} deity={deity} turn={turn} />)}
      {readyLine && <Bubble deity={deity} turn={{ role: 'assistant', text: readyLine }} />}
      {thinking && (
        <View style={s.deityRow} accessibilityLiveRegion="polite">
          <DeityArt theme={deity.theme} size={32} />
          <View style={[s.bubble, s.theirs]}><Text style={s.dots}>•••</Text></View>
          <Text style={s.typing}>{t('{name} is typing…', { name })}</Text>
        </View>
      )}

      {!summary ? (
        <>
          <View style={s.composer}>
            <TextInput value={input} onChangeText={(v) => setInput(v.slice(0, MAX_LEN))} onSubmitEditing={() => send()}
              placeholder={voice.listening ? t('Listening…') : t('Type or tap the mic…')} placeholderTextColor="#B0A390"
              style={s.input} returnKeyType="send" maxLength={MAX_LEN} editable={!thinking} accessibilityLabel={t('Your question')} />
            {voice.supported && (
              <Pressable onPress={toggleMic} accessibilityRole="button" accessibilityLabel={t(voice.listening ? 'Stop listening' : 'Speak')}
                accessibilityState={{ selected: voice.listening }} style={[s.iconBtn, voice.listening ? s.micOn : s.micOff]} hitSlop={6}>
                <MicIcon color={voice.listening ? '#fff' : colors.red} />
              </Pressable>
            )}
            <Pressable onPress={() => send()} accessibilityRole="button" accessibilityLabel={t('Send')} disabled={!input.trim() || thinking}
              style={[s.iconBtn, s.send, (!input.trim() || thinking) && { opacity: 0.4 }]} hitSlop={6}>
              <SendIcon />
            </Pressable>
          </View>
          <Text style={s.count}>{input.length}/{MAX_LEN}</Text>
          <ErrorText>{voiceError}</ErrorText>
          <ErrorText>{err}</ErrorText>
          {asked && <Button kind="secondary" title={t('Start the reading now')} onPress={startNow} disabled={thinking} />}
        </>
      ) : (
        <>
          <Card style={{ marginTop: space(3), backgroundColor: '#FFFBF1' }}>
            <H2>{t('Here’s what I’ll read for you')}</H2>
            <P style={{ fontWeight: '700', marginBottom: space(2) }}>“{summary.question}”</P>
            {([['Situation', summary.context], ['Timeframe', summary.timeframe], ['Hoping for', summary.goal]] as const)
              .filter(([, v]) => v.trim())
              .map(([label, v]) => <P key={label} muted style={{ fontSize: 13 }}>{t(label)}: {v}</P>)}
            <Pressable onPress={startOver} accessibilityRole="button" style={{ marginTop: space(2) }}>
              <Text style={{ color: colors.goldDeep, fontWeight: '600' }}>{t('Start over')}</Text>
            </Pressable>
          </Card>

          <H2 style={{ marginTop: space(3) }}>{t('Choose your reading')}</H2>
          {me.super && <P muted style={{ fontSize: 13, marginBottom: space(2) }}>{t('Super account: every reading is free.')}</P>}
          {!me.super && me.freeReadings > 0 && (
            <Check checked={useVoucher} onChange={setUseVoucher}>{t('Use a free reading voucher (Standard reading)')}</Check>
          )}
          {!voucher && (Object.keys(catalog.prices) as Tier[]).map((tier_) => (
            <Pressable key={tier_} onPress={() => setTier(tier_)} accessibilityRole="radio" accessibilityState={{ checked: tier === tier_ }}
              style={[s.tier, tier === tier_ && { borderColor: colors.red, backgroundColor: '#FFF4F2' }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.tierName}>{t(catalog.prices[tier_].label)}</Text>
                <P muted style={{ fontSize: 13 }}>{t(catalog.prices[tier_].description)}</P>
              </View>
              <Text style={s.price}>{me.super ? t('Free') : money(catalog.prices[tier_].amount)}</Text>
            </Pressable>
          ))}
          {!voucher && !me.super && <P muted style={{ fontSize: 12, marginBottom: space(3) }}>{t('Prices in USD. Sales tax is added at checkout where it applies.')}</P>}

          <Check checked={consent} onChange={setConsent}>
            {t('I understand this reading is digital content for entertainment, delivered right after payment. If it fails to generate I’m refunded automatically.')}
          </Check>
          <ErrorText>{err}</ErrorText>
          <Button title={voucher || me.super ? t('Draw my fortune (free)') : t('Continue to payment · {price}', { price: money(catalog.prices[tier].amount) })} onPress={submit} loading={busy} />
        </>
      )}
      <EntertainmentNote ai />
    </Screen>
  );
}

const s = StyleSheet.create({
  deityRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space(2), marginVertical: space(1) },
  bubble: { maxWidth: '82%', borderRadius: radius, paddingHorizontal: space(3), paddingVertical: space(2) + 2 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.red, marginVertical: space(1) },
  mineText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  theirs: { flexShrink: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  theirsText: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  dots: { color: colors.muted, fontSize: 16, letterSpacing: 2 },
  typing: { color: colors.muted, fontSize: 12, marginBottom: space(2) },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: space(2), marginTop: space(3) },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: space(4), paddingVertical: space(3), fontSize: 15, color: colors.ink },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  micOff: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  micOn: { backgroundColor: colors.red },
  send: { backgroundColor: colors.red },
  count: { alignSelf: 'flex-end', color: colors.muted, fontSize: 12, marginTop: space(1) },
  tier: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: colors.line, borderRadius: radius, padding: space(3), marginBottom: space(2), backgroundColor: '#fff' },
  tierName: { fontWeight: '700', fontSize: 16, color: colors.ink },
  price: { fontWeight: '700', fontSize: 17, color: colors.ink },
});

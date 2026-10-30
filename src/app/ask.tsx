import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DeityArt } from '@/components/DeityArt';
import { SafetyCard } from '@/components/SafetyCard';
import { Button, Card, Check, Chip, EntertainmentNote, ErrorText, Field, H2, Loading, P, Screen } from '@/components/ui';
import { api, money, type Deity, type SafetyResponse, type Tier, type Topic } from '@/lib/api';
import { colors, radius, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

type Prices = Record<Tier, { amount: number; label: string; description: string }>;

export default function Ask() {
  const me = useAuthed();
  const params = useLocalSearchParams<{ deityId: string; topic: Topic }>();
  const topic: Topic = params.topic === 'love' ? 'love' : 'wealth';
  const [catalog, setCatalog] = useState<{ deities: Deity[]; prices: Prices; questionTemplates: Record<Topic, string[]> } | null>(null);
  const [question, setQuestion] = useState('');
  const [tier, setTier] = useState<Tier>('standard');
  const [useVoucher, setUseVoucher] = useState(false);
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [safety, setSafety] = useState<SafetyResponse | null>(null);
  const [devOrder, setDevOrder] = useState<{ orderId: string; readingId: string; amount: number } | null>(null);

  useEffect(() => { api('/deities').then(setCatalog).catch((e) => setErr(e.message)); }, []);
  if (!me || !catalog) return <Screen back><Loading /></Screen>;
  const deity = catalog.deities.find((d) => d.id === params.deityId) ?? catalog.deities[0];
  const voucher = useVoucher && me.freeReadings > 0;

  async function submit() {
    setErr(null);
    if (question.trim().length < 3) return setErr('Type your question first.');
    if (!consent) return setErr('Please confirm the box above to continue.');
    setBusy(true);
    try {
      const res = await api('/readings', { body: { deityId: deity.id, topic, tier: voucher ? 'standard' : tier, question: question.trim(), useVoucher: voucher, digitalContentConsent: true } });
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

  if (safety) return <Screen back title="Let’s pause"><SafetyCard safety={safety} /><Button kind="secondary" title="Back home" onPress={() => router.replace('/home')} /></Screen>;

  if (devOrder) {
    return (
      <Screen back title="Test checkout">
        <Card>
          <P>Development mode: Stripe is not connected, so this button stands in for checkout. No real money moves.</P>
          <H2 style={{ marginTop: space(3) }}>{money(devOrder.amount)}</H2>
        </Card>
        <Button title="Pay (test)" loading={busy} onPress={async () => {
          setBusy(true);
          await api('/payments/dev/confirm', { body: { orderId: devOrder.orderId } }).catch((e) => setErr(e.message));
          router.replace(`/reading/${devOrder.readingId}`);
        }} />
        <ErrorText>{err}</ErrorText>
      </Screen>
    );
  }

  return (
    <Screen back title={topic === 'wealth' ? '💰 Ask about wealth' : '❤️ Ask about love'}>
      <View style={s.deity}>
        <DeityArt theme={deity.theme} size={56} />
        <P style={{ flex: 1 }}><Text style={{ fontWeight: '700' }}>{deity.name}</Text> is listening. Ask one clear question.</P>
      </View>
      <Field label="Your question" value={question} onChangeText={(t) => setQuestion(t.slice(0, 200))} multiline placeholder="Type your question…" />
      <Text style={s.count}>{question.length}/200</Text>
      <View style={s.wrap}>
        {catalog.questionTemplates[topic].map((q) => <Chip key={q} label={q} onPress={() => setQuestion(q)} />)}
      </View>

      <H2 style={{ marginTop: space(3) }}>Choose your reading</H2>
      {me.freeReadings > 0 && (
        <Check checked={useVoucher} onChange={setUseVoucher}>Use a free reading voucher (Standard reading)</Check>
      )}
      {!voucher && (Object.keys(catalog.prices) as Tier[]).map((t) => (
        <Pressable key={t} onPress={() => setTier(t)} accessibilityRole="radio" accessibilityState={{ checked: tier === t }}
          style={[s.tier, tier === t && { borderColor: colors.red, backgroundColor: '#FFF4F2' }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.tierName}>{catalog.prices[t].label}</Text>
            <P muted style={{ fontSize: 13 }}>{catalog.prices[t].description}</P>
          </View>
          <Text style={s.price}>{money(catalog.prices[t].amount)}</Text>
        </Pressable>
      ))}
      {!voucher && <P muted style={{ fontSize: 12, marginBottom: space(3) }}>Prices in USD. Sales tax is added at checkout where it applies.</P>}

      <Check checked={consent} onChange={setConsent}>
        I understand this reading is digital content for entertainment, delivered right after payment. If it fails to generate I’m refunded automatically.
      </Check>
      <ErrorText>{err}</ErrorText>
      <Button title={voucher ? 'Draw my fortune (free)' : `Continue to payment · ${money(catalog.prices[tier].amount)}`} onPress={submit} loading={busy} />
      <EntertainmentNote ai />
    </Screen>
  );
}

const s = StyleSheet.create({
  deity: { flexDirection: 'row', alignItems: 'center', gap: space(3), marginBottom: space(3) },
  count: { alignSelf: 'flex-end', color: colors.muted, fontSize: 12, marginTop: -space(2), marginBottom: space(2) },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  tier: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: colors.line, borderRadius: radius, padding: space(3), marginBottom: space(2), backgroundColor: '#fff' },
  tierName: { fontWeight: '700', fontSize: 16, color: colors.ink },
  price: { fontWeight: '700', fontSize: 17, color: colors.ink },
});

import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DeityArt } from '@/components/DeityArt';
import { SafetyCard } from '@/components/SafetyCard';
import { Button, Card, Check, Chip, EntertainmentNote, ErrorText, Field, H2, Loading, P, Screen } from '@/components/ui';
import { api, money, type Deity, type SafetyResponse, type Tier, type Topic } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { colors, radius, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

type Prices = Record<Tier, { amount: number; label: string; description: string }>;

export default function Ask() {
  const me = useAuthed();
  const t = useT();
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
  const voucher = !me.super && useVoucher && me.freeReadings > 0;

  async function submit() {
    setErr(null);
    if (question.trim().length < 3) return setErr(t('Type your question first.'));
    if (!consent) return setErr(t('Please confirm the box above to continue.'));
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

  return (
    <Screen back title={t(topic === 'wealth' ? '💰 Ask about wealth' : '❤️ Ask about love')}>
      <View style={s.deity}>
        <DeityArt theme={deity.theme} size={56} />
        <P style={{ flex: 1 }}><Text style={{ fontWeight: '700' }}>{t(deity.name)}</Text>{t(' is listening. Ask one clear question.')}</P>
      </View>
      <Field label={t('Your question')} value={question} onChangeText={(t) => setQuestion(t.slice(0, 200))} multiline placeholder={t('Type your question…')} />
      <Text style={s.count}>{question.length}/200</Text>
      <View style={s.wrap}>
        {catalog.questionTemplates[topic].map((q) => <Chip key={q} label={t(q)} onPress={() => setQuestion(t(q))} />)}
      </View>

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

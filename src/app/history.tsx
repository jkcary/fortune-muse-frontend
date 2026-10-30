import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, ErrorText, Field, H2, Loading, P, Screen } from '@/components/ui';
import { api, money, type Reading } from '@/lib/api';
import { colors, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

interface Order { id: string; amount: number; tax: number; status: string; provider: string; created_at: string; reading_id: string | null; tier: string | null }

export default function History() {
  const me = useAuthed();
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refundFor, setRefundFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const load = () => {
    api('/readings').then((r) => setReadings(r.readings));
    api('/orders').then((r) => setOrders(r.orders));
  };
  useEffect(load, []);
  if (!me || !readings) return <Screen back><Loading /></Screen>;

  return (
    <Screen back title="Readings & receipts">
      {readings.length === 0 && <P muted>No readings yet.</P>}
      {readings.map((r) => (
        <Pressable key={r.id} onPress={() => router.push(`/reading/${r.id}`)}>
          <Card>
            <P muted style={{ fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()} · {r.topic === 'wealth' ? '💰' : '❤️'} {r.tier}</P>
            <P>“{r.question}”</P>
          </Card>
        </Pressable>
      ))}
      <H2 style={{ marginTop: space(4) }}>Receipts</H2>
      {orders.map((o) => (
        <Card key={o.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <P>{new Date(o.created_at).toLocaleDateString()} · {o.tier ?? 'reading'}</P>
            <Text style={{ fontWeight: '700' }}>{o.provider === 'voucher' ? 'Voucher' : o.provider === 'comp' ? 'Free' : money(o.amount + o.tax)}</Text>
          </View>
          <P muted style={{ fontSize: 12 }}>Status: {o.status.replace('_', ' ')}{o.tax ? ` · includes ${money(o.tax)} tax` : ''}</P>
          {o.status === 'paid' && o.provider !== 'voucher' && o.provider !== 'comp' && refundFor !== o.id && (
            <Pressable onPress={() => setRefundFor(o.id)}><Text style={{ color: colors.goldDeep, marginTop: space(2) }}>Request a refund</Text></Pressable>
          )}
          {refundFor === o.id && (
            <View style={{ marginTop: space(2) }}>
              <Field label="What went wrong?" value={reason} onChangeText={setReason} multiline />
              <ErrorText>{err}</ErrorText>
              <Button kind="secondary" title="Send request" onPress={async () => {
                try { await api(`/orders/${o.id}/refund-request`, { body: { reason } }); setRefundFor(null); load(); } catch (e: any) { setErr(e.message); }
              }} />
            </View>
          )}
        </Card>
      ))}
    </Screen>
  );
}

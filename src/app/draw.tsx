import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Button, Card, H2, Loading, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { colors, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

interface Reward { id: string; type: string; name: string; description: string; asset: string; probability?: number }

const ICON: Record<string, string> = { free_reading: '🎟️', avatar_item: '🎩', deity_skin: '✨', sticker: '🍀' };

export default function Draw() {
  const me = useAuthed();
  const { refresh } = useSession();
  const t = useT();
  const [state, setState] = useState<{ drawn: boolean; reward: Reward | null; odds: Reward[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const flip = useRef(new Animated.Value(0)).current;

  useEffect(() => { api('/draws/today').then(setState).catch(() => {}); }, []);
  if (!me || !state) return <Screen back><Loading /></Screen>;

  async function draw() {
    setBusy(true);
    try {
      const r = await api('/draws/today', { body: {} });
      Animated.sequence([
        Animated.timing(flip, { toValue: 1, duration: 350, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(flip, { toValue: 0, duration: 350, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
      setState((s) => s && { ...s, drawn: true, reward: r.reward });
      refresh();
    } finally { setBusy(false); }
  }

  const scaleX = flip.interpolate({ inputRange: [0, 1], outputRange: [1, 0.05] });
  return (
    <Screen back title={t('🎴 Daily free draw')}>
      <P muted>{t('One free card a day, reset at midnight your time. Rewards are virtual and never need a purchase.')}</P>
      <Animated.View style={[s.card, { transform: [{ scaleX }] }]}>
        {state.reward ? (
          <>
            <Text style={{ fontSize: 56 }}>{ICON[state.reward.type] ?? '🎁'}</Text>
            <Text style={s.name}>{t(state.reward.name)}</Text>
            <P style={{ textAlign: 'center', color: '#FFF3D6' }}>{t(state.reward.description)}</P>
          </>
        ) : (
          <Text style={{ fontSize: 64 }}>🧧</Text>
        )}
      </Animated.View>
      {state.drawn
        ? <P style={{ textAlign: 'center', marginBottom: space(4) }}>{t('Come back tomorrow for another card!')}</P>
        : <Button title={t('Draw my card')} onPress={draw} loading={busy} />}

      <Card>
        <H2>{t('Odds')}</H2>
        {state.odds.map((o) => (
          <View key={o.id} style={s.odd}>
            <P style={{ flex: 1 }}>{ICON[o.type]} {t(o.name)}</P>
            <P style={{ fontWeight: '700' }}>{o.probability}%</P>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { alignSelf: 'center', width: 220, height: 300, borderRadius: 18, backgroundColor: colors.red, borderWidth: 6, borderColor: colors.gold,
    alignItems: 'center', justifyContent: 'center', padding: space(4), marginVertical: space(6) },
  name: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center', marginVertical: space(2) },
  odd: { flexDirection: 'row', paddingVertical: space(1) },
});

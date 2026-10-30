import { Linking, Pressable, Text } from 'react-native';
import type { SafetyResponse } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { colors, space } from '@/lib/theme';
import { Card, H2, P } from './ui';

export function SafetyCard({ safety }: { safety: SafetyResponse }) {
  const t = useT();
  return (
    <Card style={{ borderColor: colors.red }}>
      <H2>{t('We’re here for you 💛')}</H2>
      <P style={{ marginBottom: space(3) }}>{t(safety.message)}</P>
      {safety.resources.map((r) => (
        <Pressable key={r.name} accessibilityRole="link" onPress={() => Linking.openURL(r.url)} style={{ marginBottom: space(3) }}>
          <Text style={{ fontWeight: '700', color: colors.red, fontSize: 16 }}>{t(r.name)}</Text>
          <P>{t(r.detail)}</P>
        </Pressable>
      ))}
    </Card>
  );
}

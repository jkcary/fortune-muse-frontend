import { useLocalSearchParams } from 'expo-router';
import { Card, H2, P, Screen } from '@/components/ui';
import { LEGAL, LEGAL_VERSION } from '@/lib/legal';

export default function LegalDoc() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const d = LEGAL[doc] ?? LEGAL.terms;
  return (
    <Screen back title={d.title}>
      <P muted style={{ marginBottom: 12 }}>Last updated {LEGAL_VERSION}</P>
      {d.sections.map(([h, body]) => (
        <Card key={h}><H2>{h}</H2><P>{body}</P></Card>
      ))}
    </Screen>
  );
}

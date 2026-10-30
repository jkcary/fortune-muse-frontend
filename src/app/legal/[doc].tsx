import { useLocalSearchParams } from 'expo-router';
import { Card, H2, P, Screen } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { LEGAL, LEGAL_VERSION } from '@/lib/legal';

export default function LegalDoc() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const d = LEGAL[doc] ?? LEGAL.terms;
  const { t, lang } = useI18n();
  return (
    <Screen back title={t(d.title)}>
      <P muted style={{ marginBottom: 12 }}>{t('Last updated {date}', { date: LEGAL_VERSION })}</P>
      {lang.startsWith('zh') && <P muted style={{ marginBottom: 12 }}>{t('This translation covers the headings only. The English text is the governing version.')}</P>}
      {d.sections.map(([h, body]) => (
        <Card key={h}><H2>{t(h)}</H2><P>{body}</P></Card>
      ))}
    </Screen>
  );
}

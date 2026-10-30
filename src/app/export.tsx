import { useLocalSearchParams } from 'expo-router';
import { Share, Text } from 'react-native';
import { Button, Card, Screen } from '@/components/ui';
import { useT } from '@/lib/i18n';

export default function ExportScreen() {
  const { json } = useLocalSearchParams<{ json: string }>();
  const t = useT();
  return (
    <Screen back title={t('Your data')}>
      <Button title={t('Share / save')} onPress={() => Share.share({ message: json, title: 'Fortune Muse data' })} />
      <Card><Text selectable style={{ fontFamily: 'monospace', fontSize: 11 }}>{json}</Text></Card>
    </Screen>
  );
}

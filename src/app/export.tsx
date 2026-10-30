import { useLocalSearchParams } from 'expo-router';
import { Share, Text } from 'react-native';
import { Button, Card, Screen } from '@/components/ui';

export default function ExportScreen() {
  const { json } = useLocalSearchParams<{ json: string }>();
  return (
    <Screen back title="Your data">
      <Button title="Share / save" onPress={() => Share.share({ message: json, title: 'Fortune Muse data' })} />
      <Card><Text selectable style={{ fontFamily: 'monospace', fontSize: 11 }}>{json}</Text></Card>
    </Screen>
  );
}

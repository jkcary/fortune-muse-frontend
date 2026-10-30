import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { DeityArt } from '@/components/DeityArt';
import { Button, EntertainmentNote, H1, P, Screen } from '@/components/ui';
import { space } from '@/lib/theme';

export default function Welcome() {
  return (
    <Screen>
      <View style={s.hero}>
        <View style={s.row}>
          <DeityArt theme="nugget" size={84} />
          <DeityArt theme="ingot" size={110} />
          <DeityArt theme="greenback" size={84} />
        </View>
        <H1 style={{ textAlign: 'center' }}>Fortune Muse</H1>
        <P muted style={{ textAlign: 'center', marginBottom: space(6) }}>
          Draw a fortune with a friendly money spirit, get a lucky plan you can use today, and chat with people who asked the same question.
        </P>
        <Button title="Create account" onPress={() => router.push('/register')} />
        <Button title="I already have an account" kind="secondary" onPress={() => router.push('/login')} />
        <EntertainmentNote />
        <P muted style={{ textAlign: 'center', fontSize: 13 }}>For adults 18+ in the United States.</P>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', paddingTop: space(10) },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: space(4) },
});

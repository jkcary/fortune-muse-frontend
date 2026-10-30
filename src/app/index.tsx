import { Redirect } from 'expo-router';
import { Loading, Screen } from '@/components/ui';
import { useSession } from '@/lib/session';

export default function Index() {
  const { ready, me } = useSession();
  if (!ready) return <Screen><Loading /></Screen>;
  return <Redirect href={me ? '/home' : '/welcome'} />;
}

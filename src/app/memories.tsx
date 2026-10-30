import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Loading, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { colors, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

interface Memory { id: string; content: string; mood_tag: string | null; created_at: string }

export default function Memories() {
  const me = useAuthed();
  const [data, setData] = useState<{ enabled: boolean; items: Memory[] } | null>(null);
  const load = () => api('/memories').then(setData);
  useEffect(() => { load(); }, []);
  if (!me || !data) return <Screen back><Loading /></Screen>;

  return (
    <Screen back title="What I remember">
      <P muted style={{ marginBottom: space(3) }}>
        This is everything your fortune spirits remember — only what you wrote yourself. {data.enabled ? '' : 'Memory is currently off.'}
      </P>
      {data.items.length === 0 && <Card><P>Nothing yet. Spirits don’t pretend to remember anything you haven’t told them.</P></Card>}
      {data.items.map((m) => (
        <Card key={m.id}>
          <P muted style={{ fontSize: 12 }}>{new Date(m.created_at).toLocaleDateString()}{m.mood_tag ? ` · mood: ${m.mood_tag}` : ''}</P>
          {m.content ? <P>“{m.content}”</P> : null}
          <View style={{ alignItems: 'flex-start', marginTop: space(2) }}>
            <Button kind="secondary" title="Delete" onPress={() => api(`/memories/${m.id}`, { method: 'DELETE' }).then(load)} />
          </View>
        </Card>
      ))}
      {data.items.length > 0 && (
        <Button kind="danger" title="Delete all memories" onPress={() => api('/memories', { method: 'DELETE' }).then(load)} style={{ backgroundColor: colors.red }} />
      )}
    </Screen>
  );
}

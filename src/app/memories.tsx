import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Loading, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate, useT } from '@/lib/i18n';
import { colors, space } from '@/lib/theme';
import { useAuthed } from '@/lib/useAuthed';

interface Memory { id: string; content: string; mood_tag: string | null; created_at: string }

export default function Memories() {
  const me = useAuthed();
  const t = useT();
  const [data, setData] = useState<{ enabled: boolean; items: Memory[] } | null>(null);
  const load = () => api('/memories').then(setData);
  useEffect(() => { load(); }, []);
  if (!me || !data) return <Screen back><Loading /></Screen>;

  return (
    <Screen back title={t('What I remember')}>
      <P muted style={{ marginBottom: space(3) }}>
        {t('This is everything your fortune spirits remember — only what you wrote yourself.')} {data.enabled ? '' : t('Memory is currently off.')}
      </P>
      {data.items.length === 0 && <Card><P>{t('Nothing yet. Spirits don’t pretend to remember anything you haven’t told them.')}</P></Card>}
      {data.items.map((m) => (
        <Card key={m.id}>
          <P muted style={{ fontSize: 12 }}>{formatDate(m.created_at)}{m.mood_tag ? ` · ${t('mood: {mood}', { mood: t(m.mood_tag) })}` : ''}</P>
          {m.content ? <P>“{m.content}”</P> : null}
          <View style={{ alignItems: 'flex-start', marginTop: space(2) }}>
            <Button kind="secondary" title={t('Delete')} onPress={() => api(`/memories/${m.id}`, { method: 'DELETE' }).then(load)} />
          </View>
        </Card>
      ))}
      {data.items.length > 0 && (
        <Button kind="danger" title={t('Delete all memories')} onPress={() => api('/memories', { method: 'DELETE' }).then(load)} style={{ backgroundColor: colors.red }} />
      )}
    </Screen>
  );
}

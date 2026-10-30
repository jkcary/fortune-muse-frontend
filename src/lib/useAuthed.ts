import { router } from 'expo-router';
import { useEffect } from 'react';
import { useSession } from './session';

/** Sends signed-out visitors to the welcome screen. Returns the signed-in user (or null while loading). */
export function useAuthed() {
  const { ready, me } = useSession();
  useEffect(() => {
    if (ready && !me) router.replace('/welcome');
  }, [ready, me]);
  return me;
}

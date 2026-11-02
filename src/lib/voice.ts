import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from './i18n';
import { getSpeechRecognition, requestSpeechPermission } from './speech';

const SPEECH_LANG: Record<Lang, string> = { 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW', 'en-GB': 'en-GB', 'en-US': 'en-US' };

export type VoiceError = 'denied' | 'failed';

/**
 * Voice input in the app language. `onText` gets the words heard so far (interim) and once more when
 * the phrase is final. `supported` is false where there is no recognizer; hide the mic then.
 */
export function useVoiceInput(lang: Lang, onText: (text: string, final: boolean) => void) {
  const [supported] = useState(() => getSpeechRecognition() !== null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<VoiceError | null>(null);
  const rec = useRef<any>(null);
  const cb = useRef(onText);
  cb.current = onText;

  const stop = useCallback(() => { rec.current?.stop(); }, []);
  const clearError = useCallback(() => setError(null), []);

  const start = useCallback(async () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor || rec.current) return;
    setError(null);
    if (!(await requestSpeechPermission())) { setError('denied'); return; }
    const r = new Ctor();
    r.lang = SPEECH_LANG[lang];
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    r.onresult = (ev: any) => {
      let text = '';
      let final = false;
      for (let i = 0; i < ev.results.length; i++) {
        text += ev.results[i][0]?.transcript ?? '';
        final = final || ev.results[i].isFinal;
      }
      cb.current(text, final);
    };
    r.onerror = (ev: any) => setError(ev?.error === 'not-allowed' || ev?.error === 'service-not-allowed' ? 'denied' : 'failed');
    r.onend = () => { rec.current = null; setListening(false); };
    rec.current = r;
    setListening(true);
    try { r.start(); } catch { rec.current = null; setListening(false); setError('failed'); }
  }, [lang]);

  useEffect(() => () => rec.current?.abort?.(), []);
  return { supported, listening, error, start, stop, clearError };
}

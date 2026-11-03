import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "./i18n";
import { getSpeechRecognition, requestSpeechPermission } from "./speech";

const SPEECH_LANG: Record<Lang, string> = {
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  "en-GB": "en-GB",
  "en-US": "en-US",
};

export type VoiceError = "denied" | "failed";

/**
 * Voice input in the app language. `onText` gets the words heard so far (interim) and once more when
 * the phrase is final. `supported` is false where there is no recognizer; hide the mic then.
 */
export function useVoiceInput(
  lang: Lang,
  onText: (text: string, final: boolean) => void,
) {
  const [supported] = useState(() => getSpeechRecognition() !== null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<VoiceError | null>(null);
  const rec = useRef<any>(null);
  const acquiring = useRef(false);
  const generation = useRef(0);
  const alive = useRef(true);
  const cb = useRef(onText);
  cb.current = onText;

  const stop = useCallback(() => {
    try {
      rec.current?.stop();
    } catch {
      rec.current = null;
      setListening(false);
    }
  }, []);
  const cancel = useCallback(() => {
    generation.current++;
    const current = rec.current;
    if (current) {
      current.onresult = null;
      current.abort?.();
    }
    rec.current = null;
    setListening(false);
  }, []);
  const clearError = useCallback(() => setError(null), []);

  const start = useCallback(async () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor || rec.current || acquiring.current) return;
    setError(null);
    const version = generation.current;
    acquiring.current = true;
    try {
      if (!(await requestSpeechPermission())) {
        if (alive.current && version === generation.current) setError("denied");
        return;
      }
    } catch {
      if (alive.current && version === generation.current) setError("denied");
      return;
    } finally {
      acquiring.current = false;
    }
    if (!alive.current || version !== generation.current) return;
    const r = new Ctor();
    r.lang = SPEECH_LANG[lang];
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    r.onresult = (ev: any) => {
      if (!alive.current || rec.current !== r || version !== generation.current)
        return;
      let text = "";
      let final = false;
      for (let i = 0; i < ev.results.length; i++) {
        text += ev.results[i][0]?.transcript ?? "";
        final = final || ev.results[i].isFinal;
      }
      cb.current(text, final);
    };
    r.onerror = (ev: any) => {
      if (!alive.current || version !== generation.current) return;
      setError(
        ev?.error === "not-allowed" || ev?.error === "service-not-allowed"
          ? "denied"
          : "failed",
      );
    };
    r.onend = () => {
      if (!alive.current || rec.current !== r) return;
      rec.current = null;
      setListening(false);
    };
    rec.current = r;
    setListening(true);
    try {
      r.start();
    } catch {
      rec.current = null;
      setListening(false);
      setError("failed");
    }
  }, [lang]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      generation.current++;
      if (rec.current) {
        rec.current.onresult = null;
        rec.current.abort?.();
      }
    };
  }, []);
  return { supported, listening, error, start, stop, cancel, clearError };
}

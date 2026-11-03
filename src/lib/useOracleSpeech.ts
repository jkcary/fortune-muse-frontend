import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import * as Speech from "expo-speech";
import type { Lang } from "./i18n";
const tags: Record<Lang, string> = {
  "en-US": "en-US",
  "en-GB": "en-GB",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
};
// Keep the explicit voice choice across question, casting and reading routes in this session.
let voiceEnabled = false;
const voiceListeners = new Set<() => void>();
const subscribeVoice = (listener: () => void) => {
  voiceListeners.add(listener);
  return () => {
    voiceListeners.delete(listener);
  };
};
const setVoiceEnabled = (enabled: boolean) => {
  voiceEnabled = enabled;
  voiceListeners.forEach((listener) => listener());
};
export function useOracleSpeech(lang: Lang) {
  const enabled = useSyncExternalStore(
    subscribeVoice,
    () => voiceEnabled,
    () => false,
  );
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(false);
  const revision = useRef(0);
  const alive = useRef(true);
  const stop = useCallback(() => {
    revision.current++;
    setSpeaking(false);
    void Speech.stop().catch(() => {});
  }, []);
  const speak = useCallback(
    async (text: string) => {
      const current = ++revision.current;
      setError(false);
      await Speech.stop().catch(() => {});
      if (!alive.current || current !== revision.current) return;
      try {
        Speech.speak(text, {
          language: tags[lang],
          rate: 0.94,
          pitch: 1.02,
          onStart: () => {
            if (alive.current && current === revision.current)
              setSpeaking(true);
          },
          onDone: () => {
            if (alive.current && current === revision.current)
              setSpeaking(false);
          },
          onStopped: () => {
            if (alive.current && current === revision.current)
              setSpeaking(false);
          },
          onError: () => {
            if (alive.current && current === revision.current) {
              setSpeaking(false);
              setError(true);
            }
          },
        });
      } catch {
        if (alive.current && current === revision.current) {
          setSpeaking(false);
          setError(true);
        }
      }
    },
    [lang],
  );
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      revision.current++;
      void Speech.stop().catch(() => {});
    };
  }, []);
  useEffect(() => {
    stop();
  }, [lang, stop]);
  return { enabled, setEnabled: setVoiceEnabled, speaking, error, speak, stop };
}

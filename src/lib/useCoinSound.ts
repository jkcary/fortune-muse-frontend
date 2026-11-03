import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { coinSoundStore } from "./storage";

export const COIN_TOSS_MS = 1000;
const source = require("@/assets/audio/coin-toss.wav");

export function useCoinSound() {
  const player = useAudioPlayer(source, {
    updateInterval: 100,
    keepAudioSessionActive: false,
  });
  const status = useAudioPlayerStatus(player);
  const [enabled, setEnabled] = useState(true);
  const [failed, setFailed] = useState(false);
  const ready = useRef(false);
  const alive = useRef(true);
  const playback = useRef(0);
  const preference = useRef(true);
  const revision = useRef(0);
  const queue = useRef(Promise.resolve());
  const stop = useCallback(() => {
    playback.current++;
    try {
      player.pause();
      void player.seekTo(0).catch(() => {});
    } catch {
      /* The player may already be released. */
    }
  }, [player]);
  useEffect(() => {
    alive.current = true;
    const version = revision.current;
    void coinSoundStore.get().then((value) => {
      if (!alive.current || revision.current !== version) return;
      preference.current = value;
      ready.current = true;
      setEnabled(value);
    });
    player.volume = 0.58;
    player.loop = false;
    void setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") stop();
    });
    return () => {
      alive.current = false;
      sub.remove();
      stop();
    };
  }, [player, stop]);
  const toggle = useCallback(() => {
    revision.current++;
    const next = !preference.current;
    ready.current = true;
    preference.current = next;
    setEnabled(next);
    setFailed(false);
    if (!next) stop();
    queue.current = queue.current
      .catch(() => {})
      .then(() => coinSoundStore.set(next));
  }, [stop]);
  const play = useCallback(() => {
    if (
      !ready.current ||
      !preference.current ||
      AppState.currentState !== "active"
    )
      return;
    setFailed(false);
    const version = ++playback.current;
    try {
      // Call play in the original click gesture, including on browsers with autoplay restrictions.
      void player.seekTo(0).catch(() => {
        if (alive.current && playback.current === version) setFailed(true);
      });
      player.play();
    } catch {
      setFailed(true);
    }
  }, [player]);
  return {
    enabled,
    toggle,
    play,
    stop,
    unavailable: enabled && (failed || Boolean(status.error)),
  };
}

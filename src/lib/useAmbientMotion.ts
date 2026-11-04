import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, AppState, Easing, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCalmMotion } from "@/components/OracleArt";

/** Decorative motion pauses off screen, in the background, and for reduced motion. */
export function useAmbientMotion(duration = 3000) {
  const reduced = useCalmMotion();
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  const phase = useRef(new Animated.Value(0)).current;
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) =>
      setForeground(s === "active"),
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (reduced || !focused || !foreground) {
      phase.setValue(0.4);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(phase, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(phase, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [phase, reduced, focused, foreground, duration]);
  return { phase, reduced };
}

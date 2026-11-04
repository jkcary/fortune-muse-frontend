import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useFocusEffect } from "expo-router";
import { GardenVector } from "./GardenVector";
import type { GardenScene } from "@/lib/garden-scene.web";

/** SVG first paint and WebGL fallback; the enhancement never owns game state. */
export function GardenArt({
  decor = [],
  lights = 0,
}: {
  decor?: string[];
  lights?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<GardenScene | null>(null);
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const motion = useRef({ active: focused, reduced });
  motion.current = { active: focused, reduced };
  const decorKey = [...decor].sort().join(",");

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    let cancelled = false;
    let current: GardenScene | null = null;
    setReady(false);
    import("@/lib/garden-scene.web")
      .then(({ createGardenScene }) => {
        if (cancelled || !host.current) return;
        current = createGardenScene(host.current, {
          decor: decorKey.split(","),
          lights,
          ...motion.current,
          onReady: () => {
            if (!cancelled) setReady(true);
          },
          onUnavailable: () => {
            if (!cancelled) setReady(false);
          },
        });
        scene.current = current;
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
      current?.dispose();
      if (scene.current === current) scene.current = null;
    };
  }, [decorKey, lights]);

  useEffect(
    () => scene.current?.setMotion({ active: focused, reduced }),
    [focused, reduced],
  );

  return (
    <View style={{ height: 240, width: "100%" }}>
      <GardenVector decor={decor} lights={lights} enhanced={ready} />
      <div
        ref={host}
        data-garden-renderer={ready ? "three" : "vector"}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
    </View>
  );
}

import { LocalizedText as Text } from "@/components/LocalizedText";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Copy,
  Display,
  Eyebrow,
  OracleShell,
  Panel,
} from "@/components/OracleShell";
import { useCalmMotion } from "@/components/OracleArt";
import { Button, ErrorText, Loading } from "@/components/ui";
import { oracle } from "@/lib/oracle";
import { useOracleCast } from "@/lib/useOracleCast";
import { COIN_TOSS_MS, useCoinSound } from "@/lib/useCoinSound";
import { useT } from "@/lib/i18n";
import { colors, fonts } from "@/lib/theme";
import Svg, { Path } from "react-native-svg";

export default function Ritual() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cast, setCast, error, setError, reload } = useOracleCast(id);
  const [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const rotation = useRef(new Animated.Value(0)).current;
  const reduced = useCalmMotion();
  const sound = useCoinSound();
  const t = useT();
  const alive = useRef(true);
  const lock = useRef(false);
  const request = useRef<AbortController | null>(null);
  const activeAnimation = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    alive.current = true;
    setBusy(false);
    return () => {
      alive.current = false;
      request.current?.abort();
      request.current = null;
      lock.current = false;
      activeAnimation.current?.stop();
      sound.stop();
    };
  }, [id, sound.stop]);
  async function toss(complete = false) {
    if (!cast || lock.current || cast.rounds.length >= 6) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const started = Date.now();
    sound.play();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    const animation = Animated.timing(rotation, {
      toValue: 1,
      duration: COIN_TOSS_MS,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== "web",
    });
    activeAnimation.current = animation;
    if (!reduced) {
      rotation.setValue(0);
      animation.start();
    }
    try {
      const result = await oracle("/oracle/casts/" + id + "/rounds", {
        body: complete ? { complete: true } : { index: cast.rounds.length },
        signal: controller.signal,
      });
      const remaining =
        Math.max(!reduced ? COIN_TOSS_MS : 0, sound.enabled ? 1180 : 0) -
        (Date.now() - started);
      if (remaining > 0 && !controller.signal.aborted)
        await new Promise<void>((resolve) => {
          const finish = () => {
            clearTimeout(timer);
            controller.signal.removeEventListener("abort", finish);
            resolve();
          };
          const timer = setTimeout(finish, remaining);
          controller.signal.addEventListener("abort", finish, { once: true });
        });
      if (
        !alive.current ||
        controller.signal.aborted ||
        request.current !== controller
      )
        return;
      setCast(result.cast);
      if (complete) router.replace("/oracle/" + id);
    } catch (e: any) {
      if (alive.current && request.current === controller) {
        sound.stop();
        setError(e.message);
      }
    } finally {
      clearTimeout(timeout);
      animation.stop();
      if (request.current === controller) {
        lock.current = false;
        request.current = null;
        if (alive.current) {
          rotation.setValue(0);
          setBusy(false);
        }
      }
    }
  }
  if (!cast)
    return (
      <OracleShell>
        <View style={{ paddingVertical: 70 }}>
          {error ? (
            <Panel>
              <Copy>{error}</Copy>
              <Button title="Try again" onPress={() => void reload()} />
              <Button
                title="Begin a new reading"
                kind="secondary"
                onPress={() => router.push("/ask")}
              />
            </Panel>
          ) : (
            <Loading label="Returning to your ritual…" />
          )}
        </View>
      </OracleShell>
    );
  const n = cast.rounds.length;
  const last = cast.rounds.at(-1);
  return (
    <OracleShell>
      <View style={{ paddingTop: 42, paddingBottom: 35 }}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <Eyebrow love={cast.topic === "love"}>02 / THE COIN RITUAL</Eyebrow>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(
              sound.enabled ? "Mute coin sounds" : "Unmute coin sounds",
            )}
            accessibilityState={{ checked: sound.enabled }}
            aria-pressed={sound.enabled}
            onPress={sound.toggle}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              minHeight: 42,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 999,
            }}
          >
            <Svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden={true}
            >
              <Path
                d="M4 9h4l5-4v14l-5-4H4Z"
                stroke={colors.gold}
                strokeWidth={1.4}
                strokeLinejoin="round"
              />
              <Path
                d={
                  sound.enabled
                    ? "M17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14"
                    : "m17 9 5 6m0-6-5 6"
                }
                stroke={colors.gold}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              {sound.enabled ? "Coin sounds on" : "Coin sounds off"}
            </Text>
          </Pressable>
        </View>
        <View
          style={{
            flexDirection: mobile ? "column" : "row",
            gap: mobile ? 30 : 70,
          }}
        >
          <View style={{ flex: 1.3 }}>
            <Display size={mobile ? 42 : 58}>
              {n === 6 ? "A pattern emerges." : "Let the moment"}
              {n < 6 && "\n"}
              {n < 6 && (
                <Text style={{ fontStyle: "italic", color: colors.gold }}>
                  take shape.
                </Text>
              )}
            </Display>
            <View style={{ marginTop: 20, maxWidth: 460 }}>
              <Copy muted localize={false}>
                “{cast.question}”
              </Copy>
            </View>
            <View
              style={{
                alignItems: "center",
                paddingTop: mobile ? 38 : 65,
                paddingBottom: 28,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: mobile ? 16 : 30,
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <Animated.View
                    key={i}
                    style={[
                      s.coin,
                      {
                        width: mobile ? 78 : 100,
                        height: mobile ? 78 : 100,
                        transform: [
                          {
                            rotateY: rotation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                          {
                            translateY: rotation.interpolate({
                              inputRange: [0, 0.45, 0.72, 0.83, 0.9, 1],
                              outputRange: [0, -24, 0, -7, 0, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={s.coinInset}>
                      <View style={s.coinHole} />
                    </View>
                    <Text style={s.coinValue}>
                      {busy ? "·" : last ? last.coins[i] : "✧"}
                    </Text>
                  </Animated.View>
                ))}
              </View>
              <Text
                accessibilityLiveRegion="polite"
                style={{ fontSize: 12, color: colors.muted, marginTop: 28 }}
              >
                {busy
                  ? "Casting your coins…"
                  : n === 6
                    ? "Your six lines are complete."
                    : last
                      ? "Line " +
                        n +
                        " · " +
                        last.coins.join(" + ") +
                        " = " +
                        last.value
                      : "Three coins. One intention."}
              </Text>
            </View>
            <View
              style={{
                maxWidth: 420,
                alignSelf: "center",
                width: "100%",
                gap: 8,
              }}
            >
              <ErrorText>{error}</ErrorText>
              {sound.unavailable && (
                <Text
                  accessibilityLiveRegion="polite"
                  style={{
                    color: colors.muted,
                    fontSize: 11,
                    lineHeight: 19,
                    textAlign: "center",
                  }}
                >
                  Coin sounds are unavailable here. You can still cast.
                </Text>
              )}
              <Button
                title={
                  n === 6
                    ? "Reveal your reading  ↗"
                    : busy
                      ? "Casting…"
                      : "Cast line " + (n + 1) + " of 6  ↗"
                }
                loading={busy}
                onPress={() =>
                  n === 6 ? router.replace("/oracle/" + id) : void toss()
                }
                style={{ borderRadius: 6 }}
              />
              {n < 6 && (
                <Button
                  title="Complete all lines now"
                  kind="ghost"
                  disabled={busy}
                  onPress={() => void toss(true)}
                />
              )}
              <Text
                style={{
                  fontSize: 10,
                  color: colors.muted,
                  textAlign: "center",
                  lineHeight: 19,
                }}
              >
                Each cast is saved as it happens. You can pause or refresh.
                {"\n"}Skipping the animation never changes a recorded result.
              </Text>
            </View>
          </View>
          <View style={{ flex: 0.8 }}>
            <Panel>
              <Eyebrow>YOUR HEXAGRAM</Eyebrow>
              <View
                style={{ gap: 19, alignItems: "center", paddingVertical: 20 }}
              >
                {[5, 4, 3, 2, 1, 0].map((index) => {
                  const value = cast.rounds[index]?.value;
                  const moving = value === 6 || value === 9;
                  return (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 18,
                      }}
                    >
                      <Text
                        style={{ color: colors.muted, fontSize: 10, width: 12 }}
                      >
                        {index + 1}
                      </Text>
                      <View
                        style={{
                          width: 150,
                          height: 7,
                          flexDirection: "row",
                          gap: 18,
                        }}
                      >
                        {!value ? (
                          <View
                            style={{
                              width: "100%",
                              borderTopWidth: 1,
                              borderStyle: "dashed",
                              borderColor: "#414754",
                              marginTop: 3,
                            }}
                          />
                        ) : value % 2 ? (
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: moving
                                ? colors.love
                                : colors.gold,
                              borderRadius: 1,
                            }}
                          />
                        ) : (
                          <>
                            <View
                              style={{
                                flex: 1,
                                backgroundColor: moving
                                  ? colors.love
                                  : colors.gold,
                                borderRadius: 1,
                              }}
                            />
                            <View
                              style={{
                                flex: 1,
                                backgroundColor: moving
                                  ? colors.love
                                  : colors.gold,
                                borderRadius: 1,
                              }}
                            />
                          </>
                        )}
                      </View>
                      <Text
                        style={{ color: colors.love, width: 12, fontSize: 12 }}
                      >
                        {moving ? "◦" : ""}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Text style={s.progress}>{n} OF 6 LINES</Text>
              <Copy muted>
                Built from the bottom up. Rose-colored lines are moving lines —
                they turn into their opposite.
              </Copy>
              <Button
                title="How does this work? ↗"
                kind="ghost"
                onPress={() => router.push("/method")}
              />
            </Panel>
          </View>
        </View>
      </View>
    </OracleShell>
  );
}
const s = StyleSheet.create({
  coin: {
    borderRadius: 100,
    backgroundColor: "#B79A60",
    borderWidth: 3,
    borderColor: "#E8D19B",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "5px 8px 0 #584224, 0 20px 60px #00000066",
  },
  coinInset: {
    width: "80%",
    height: "80%",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#6E5429",
    alignItems: "center",
    justifyContent: "center",
  },
  coinHole: {
    width: 21,
    height: 21,
    backgroundColor: "#0A0D14",
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "#E8CD8E",
  },
  coinValue: {
    position: "absolute",
    bottom: 7,
    fontSize: 10,
    color: "#45341D",
    fontWeight: "700",
  },
  progress: {
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 10,
  },
});

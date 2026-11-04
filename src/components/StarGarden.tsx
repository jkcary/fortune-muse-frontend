import { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { useAudioPlayer } from "expo-audio";
import { router } from "expo-router";
import { LocalizedText as Text } from "./LocalizedText";
import { Copy, Display, Eyebrow, OracleShell } from "./OracleShell";
import { Button, ErrorText } from "./ui";
import { GardenArt } from "./GardenArt";
import { OracleGuidePortrait } from "./OracleGuidePortrait";
import { useCalmMotion } from "./OracleArt";
import { useGarden, gardenStore } from "@/lib/garden";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import {
  GARDEN_LEVELS,
  DECOR,
  earnedDecor,
  lightState,
  rotateMask,
  hintTile,
} from "@/lib/garden-engine";
import { colors, fonts } from "@/lib/theme";

export default function StarGarden() {
  const { me, ready } = useSession();
  return (
    <OracleShell>{ready && <GardenGame key={me?.id ?? "guest"} />}</OracleShell>
  );
}
function GardenGame() {
  const {
    state,
    loading: loadingProgress,
    available,
    busy,
    error,
    reload,
    resetGuest,
    complete,
    decorate,
  } = useGarden();
  const loading = loadingProgress || !available;
  const { me } = useSession();
  const t = useT();
  const [confirmReset, setConfirmReset] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [rotations, setRotations] = useState<number[]>([]),
    [moves, setMoves] = useState(0),
    [hints, setHints] = useState(0);
  const [hydratedLevel, setHydratedLevel] = useState<number | null>(null);
  const [draftError, setDraftError] = useState("");
  const [sound, setSound] = useState(false),
    [soundError, setSoundError] = useState("");
  const { width } = useWindowDimensions();
  const [boardWidth, setBoardWidth] = useState(400);
  const reduced = useCalmMotion(),
    pulse = useRef(new Animated.Value(1)).current;
  const player = useAudioPlayer(require("../../assets/audio/garden-light.wav"));
  const level =
    GARDEN_LEVELS[(selected ?? Math.min(state.completed.length + 1, 12)) - 1];
  const hydrated = hydratedLevel === level.id;
  const lit = lightState(level, rotations),
    solved = hydrated && lit.solved;
  const litSet = new Set(lit.lit),
    saved = state.completed.includes(level.id);
  const epoch = useRef(0),
    queue = useRef<Promise<void>>(Promise.resolve());
  const owner = me?.id ?? "guest";
  const draftKey = `oracle_garden_draft_${owner}`;
  useEffect(() => {
    void gardenStore
      .get("oracle_garden_sound")
      .then((v) => setSound(v === "on"))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (loading) return;
    const revision = ++epoch.current;
    setHydratedLevel(null);
    setDraftError("");
    void queue.current
      .then(() => gardenStore.get(draftKey))
      .then((raw) => {
        if (revision !== epoch.current) return;
        let draft: any = null;
        try {
          draft = raw ? JSON.parse(raw) : null;
        } catch {}
        if (
          selected === null &&
          draft?.version === 1 &&
          Number.isInteger(draft.level) &&
          GARDEN_LEVELS[draft.level - 1] &&
          draft.level <= state.completed.length + 1 &&
          draft.level !== level.id
        ) {
          setSelected(draft.level);
          return;
        }
        if (
          draft?.level === level.id &&
          draft.version === 1 &&
          Array.isArray(draft.rotations) &&
          draft.rotations.length === level.tiles.length &&
          draft.rotations.every(
            (v: unknown, i: number) =>
              Number.isInteger(v) &&
              Number(v) >= 0 &&
              Number(v) <= 3 &&
              (!level.tiles[i].fixed || v === 0),
          )
        ) {
          setRotations(draft.rotations);
          setMoves(
            Number.isInteger(draft.moves) ? Math.max(0, draft.moves) : 0,
          );
          setHints(
            Number.isInteger(draft.hints) ? Math.max(0, draft.hints) : 0,
          );
        } else {
          setRotations([...level.initial]);
          setMoves(0);
          setHints(0);
        }
        setHydratedLevel(level.id);
      })
      .catch(() => {
        if (revision === epoch.current) {
          setRotations([...level.initial]);
          setMoves(0);
          setHints(0);
          setHydratedLevel(level.id);
          setDraftError("Your unfinished puzzle could not be restored.");
        }
      });
    return () => {
      epoch.current++;
    };
  }, [level.id, loading, draftKey]);
  useEffect(() => {
    if (!hydrated) return;
    const value = JSON.stringify({
      version: 1,
      level: level.id,
      rotations,
      moves,
      hints,
    });
    let active = true;
    queue.current = queue.current
      .catch(() => {})
      .then(() => gardenStore.set(draftKey, value))
      .catch(() => {
        if (active)
          setDraftError(
            "Your unfinished puzzle could not be saved on this device.",
          );
      });
    return () => {
      active = false;
    };
  }, [hydrated, rotations, moves, hints, level.id, draftKey]);
  useEffect(() => {
    pulse.setValue(1);
    if (!solved || reduced) return;
    const animation = Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1.025,
        duration: 220,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [solved, reduced, pulse]);
  useEffect(
    () => () => {
      player.pause();
    },
    [player],
  );
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") player.pause();
    });
    return () => listener.remove();
  }, [player]);
  async function chime() {
    if (!sound) return;
    try {
      await player.seekTo(0);
      player.play();
    } catch {
      setSoundError("Sound is unavailable. You can keep playing.");
    }
  }
  function turn(index: number) {
    if (
      !hydrated ||
      busy ||
      solved ||
      !level.tiles[index].mask ||
      level.tiles[index].fixed
    )
      return;
    const next = rotations.map((r, i) => (i === index ? (r + 1) % 4 : r));
    const after = lightState(level, next);
    if (after.stars > lit.stars || after.solved) void chime();
    setRotations(next);
    setMoves((n) => n + 1);
  }
  const cell = Math.min(76, (boardWidth - (level.size - 1) * 5) / level.size);
  const stars = level.tiles.filter((tile) => tile.star).length;
  const nextReward = DECOR.find((d) => d.at > state.completed.length);
  const selene = solved
    ? "You found a way through. Take a moment to enjoy the light."
    : level.id >= 8
      ? "The side lantern needs light too. Look for the three-way junction."
      : level.id >= 5
        ? "Some paths are fixed. Let them help you find your way."
        : "Start at the sun. Turn a path and watch where the light goes.";
  return (
    <View style={{ paddingVertical: 28, gap: 24 }}>
      <View style={{ gap: 10 }}>
        <Eyebrow>A LITTLE PLAY. A PLACE OF YOUR OWN.</Eyebrow>
        <Display size={width < 700 ? 40 : 58}>Star Lantern Garden</Display>
        <Copy muted>
          Turn the paths. Light every star. Bring the pearl to life.
        </Copy>
      </View>
      <View
        style={{
          flexDirection: width >= 900 ? "row" : "column",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            flex: width >= 900 ? 1.15 : undefined,
            width: width >= 900 ? undefined : "100%",
            gap: 18,
            minWidth: 0,
          }}
        >
          <View
            style={{
              backgroundColor: "#211D33",
              borderRadius: 24,
              padding: width < 360 ? 8 : 16,
              borderWidth: 1,
              borderColor: "#65516D",
              gap: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 25,
                  color: colors.ink,
                }}
              >
                {t("Lantern {number}", { number: level.id })}
              </Text>
              <Text style={{ color: colors.gold, fontSize: 12 }}>
                {t(level.theme)} · {t("{count} turns", { count: moves })}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 14, flexWrap: "wrap" }}>
              <Text style={{ color: colors.gold, fontSize: 12 }}>
                {t("Stars {lit}/{total}", { lit: lit.stars, total: stars })}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                ◆ {t("Fixed path")} · ✧ {t("Star to light")}
              </Text>
            </View>
            {loading || !hydrated ? (
              <Copy muted>Opening your garden…</Copy>
            ) : (
              <Animated.View
                onLayout={(e) => setBoardWidth(e.nativeEvent.layout.width)}
                style={{ gap: 5, transform: [{ scale: pulse }] }}
              >
                {Array.from({ length: level.size }, (_, row) => (
                  <View
                    key={row}
                    style={{
                      flexDirection: "row",
                      gap: 5,
                      justifyContent: "center",
                    }}
                  >
                    {Array.from({ length: level.size }, (_, col) => {
                      const index = row * level.size + col,
                        tile = level.tiles[index],
                        mask = rotateMask(tile.mask, rotations[index] ?? 0),
                        on = litSet.has(index),
                        endpoints = [
                          [50, 0],
                          [100, 50],
                          [50, 100],
                          [0, 50],
                        ];
                      const directions = ["North", "East", "South", "West"]
                        .filter((_, d) => mask & (1 << d))
                        .map((d) => t(d))
                        .join(", ");
                      const label =
                        t("Row {row}, column {column}", {
                          row: row + 1,
                          column: col + 1,
                        }) +
                        ": " +
                        (tile.mask ? directions : t("Empty space")) +
                        (index === level.source
                          ? ", " + t("Light source")
                          : "") +
                        (index === level.goal ? ", " + t("Pearl") : "") +
                        (tile.fixed ? ", " + t("Fixed path") : "") +
                        (tile.star ? ", " + t("Star to light") : "") +
                        (on ? ", " + t("Lit") : "");
                      return (
                        <Pressable
                          key={index}
                          accessibilityRole="button"
                          accessibilityLabel={label}
                          disabled={!tile.mask || tile.fixed || solved || busy}
                          accessibilityState={{
                            disabled:
                              !tile.mask || tile.fixed || solved || busy,
                          }}
                          onPress={() => turn(index)}
                          style={({ pressed }) => ({
                            width: cell,
                            height: cell,
                            minHeight: 44,
                            borderRadius: 12,
                            backgroundColor: on
                              ? "#4B3A4E"
                              : tile.mask
                                ? "#302A40"
                                : "#242136",
                            borderWidth: 1,
                            borderColor: on ? "#C3A479" : "#484057",
                            opacity: pressed ? 0.75 : 1,
                          })}
                        >
                          <Svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 100 100"
                            aria-hidden={true}
                          >
                            {endpoints.map(([x, y], d) =>
                              mask & (1 << d) ? (
                                <Line
                                  key={d}
                                  x1="50"
                                  y1="50"
                                  x2={x}
                                  y2={y}
                                  stroke={on ? "#F1D9A9" : "#877B98"}
                                  strokeWidth={on ? 9 : 7}
                                  strokeLinecap="round"
                                />
                              ) : null,
                            )}
                            {tile.mask > 0 && (
                              <Circle
                                cx="50"
                                cy="50"
                                r={on ? 12 : 9}
                                fill={on ? "#FFEACA" : "#B2A0BD"}
                              />
                            )}
                            {tile.star && (
                              <Path
                                d="M50 29 L56 43 L71 50 L56 57 L50 71 L44 57 L29 50 L44 43Z"
                                fill={on ? "#FFF4DB" : "#251F35"}
                                stroke={on ? "#FFF8E5" : "#D7B9DF"}
                                strokeWidth="2"
                              />
                            )}
                            {tile.fixed && (
                              <Path
                                d="M83 8 L89 14 L83 20 L77 14Z"
                                fill="#DAC4A0"
                              />
                            )}
                            {index === level.source && (
                              <Circle
                                cx="50"
                                cy="50"
                                r="18"
                                fill="#EDCB81"
                                stroke="#FFF0CB"
                                strokeWidth="3"
                              />
                            )}
                            {index === level.goal && (
                              <Circle
                                cx="50"
                                cy="50"
                                r="19"
                                fill={on ? "#F6E2EE" : "#756D8A"}
                                stroke="#D8BFD8"
                                strokeWidth="3"
                              />
                            )}
                          </Svg>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </Animated.View>
            )}
            <View accessibilityLiveRegion="polite" style={{ gap: 10 }}>
              {solved ? (
                <>
                  <Text
                    style={{
                      color: colors.gold,
                      fontFamily: fonts.display,
                      fontSize: 27,
                    }}
                  >
                    The pearl is glowing.
                  </Text>
                  <Copy muted>
                    {saved
                      ? "This light is kept in your garden."
                      : "Keep this light to unlock your next lantern."}
                  </Copy>
                  {!saved ? (
                    <Button
                      title="Keep this light"
                      loading={busy}
                      onPress={() => {
                        setSelected(level.id);
                        void complete(level.id, rotations);
                      }}
                    />
                  ) : level.id < 12 ? (
                    <Button
                      title="Next lantern ↗"
                      onPress={() => setSelected(level.id + 1)}
                      disabled={busy}
                    />
                  ) : (
                    <Copy>
                      All twelve lanterns are lit. Your garden is yours to
                      arrange.
                    </Copy>
                  )}
                  {saved &&
                    DECOR.filter((d) => d.at === level.id).map((reward) => (
                      <View
                        key={reward.id}
                        style={{
                          padding: 14,
                          gap: 8,
                          borderWidth: 1,
                          borderColor: colors.gold,
                          borderRadius: 16,
                        }}
                      >
                        <Text style={{ color: colors.gold, fontSize: 14 }}>
                          {t("Unlocked: {reward}", { reward: t(reward.label) })}
                        </Text>
                        {!state.decor.includes(reward.id) && (
                          <Button
                            title="Place it in my garden"
                            kind="secondary"
                            loading={busy}
                            onPress={() =>
                              void decorate([...state.decor, reward.id])
                            }
                          />
                        )}
                      </View>
                    ))}
                  <Button
                    title="Play this lantern again"
                    kind="ghost"
                    disabled={busy}
                    onPress={() => {
                      setRotations([...level.initial]);
                      setMoves(0);
                      setHints(0);
                    }}
                  />
                </>
              ) : (
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  <Button
                    title="Show me one turn"
                    kind="secondary"
                    disabled={loading || !hydrated || busy}
                    onPress={() => {
                      const index = hintTile(level, rotations);
                      if (index >= 0) {
                        const next = rotations.map((r, i) =>
                          i === index ? 0 : r,
                        );
                        if (lightState(level, next).solved) void chime();
                        setRotations(next);
                        setHints((n) => n + 1);
                        setMoves((n) => n + 1);
                      }
                    }}
                  />
                  <Button
                    title="Start over"
                    kind="ghost"
                    disabled={loading || !hydrated || busy}
                    onPress={() => {
                      setRotations([...level.initial]);
                      setMoves(0);
                      setHints(0);
                    }}
                  />
                </View>
              )}
              {!!hints && (
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  {t("{count} guiding turns used", { count: hints })}
                </Text>
              )}
            </View>
            <Button
              title={sound ? "Garden sound: on" : "Garden sound: off"}
              kind="ghost"
              onPress={() =>
                void (async () => {
                  const next = !sound;
                  setSound(next);
                  if (!next) player.pause();
                  try {
                    await gardenStore.set(
                      "oracle_garden_sound",
                      next ? "on" : "off",
                    );
                  } catch {
                    setSoundError("Your sound preference could not be saved.");
                  }
                })()
              }
            />
            <ErrorText>{draftError || soundError}</ErrorText>
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
              padding: 8,
            }}
          >
            <OracleGuidePortrait size={48} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: colors.gold, fontSize: 11 }}>SELENE</Text>
              <Text
                style={{ color: colors.muted, fontSize: 13, lineHeight: 22 }}
              >
                {selene}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            flex: width >= 900 ? 1 : undefined,
            width: width >= 900 ? undefined : "100%",
            gap: 20,
            minWidth: 0,
          }}
        >
          <View style={{ gap: 10 }}>
            <Eyebrow>YOUR GARDEN</Eyebrow>
            <GardenArt decor={state.decor} lights={state.completed.length} />
            <Text style={{ color: colors.ink, fontSize: 14 }}>
              {t("{count} of 12 lanterns kept", {
                count: state.completed.length,
              })}
            </Text>
            <Copy muted>
              {me
                ? "Your kept lights and decorations follow your account."
                : "Your guest garden is saved on this device. Account gardens are separate."}
            </Copy>
          </View>
          {nextReward && (
            <View
              style={{
                borderLeftWidth: 2,
                borderColor: colors.gold,
                paddingLeft: 14,
                gap: 6,
              }}
            >
              <Text style={{ color: colors.gold, fontSize: 12 }}>
                {t("Next: {reward}", { reward: t(nextReward.label) })}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {t("{count} more lanterns to unlock", {
                  count: nextReward.at - state.completed.length,
                })}
              </Text>
            </View>
          )}
          <View style={{ gap: 10 }}>
            <Text
              style={{
                fontFamily: fonts.display,
                color: colors.ink,
                fontSize: 23,
              }}
            >
              Arrange your garden
            </Text>
            <Copy muted>Choose the pieces you want to display.</Copy>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {DECOR.map((item) => {
                const unlocked = earnedDecor(state.completed).some(
                    (d) => d.id === item.id,
                  ),
                  active = state.decor.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="checkbox"
                    aria-checked={active}
                    accessibilityState={{
                      checked: active,
                      disabled: !unlocked || busy || loading,
                    }}
                    disabled={!unlocked || busy || loading}
                    onPress={() =>
                      void decorate(
                        active
                          ? state.decor.filter((d) => d !== item.id)
                          : [...state.decor, item.id],
                      )
                    }
                    style={{
                      minHeight: 44,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: active ? colors.gold : colors.line,
                      borderRadius: 14,
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? colors.gold : colors.muted,
                        fontSize: 12,
                      }}
                    >
                      {active ? "✦ " : ""}
                      {t(item.label)}
                      {!unlocked ? ` · ${item.at}` : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={{ gap: 10 }}>
            <Text
              style={{
                fontFamily: fonts.display,
                color: colors.ink,
                fontSize: 23,
              }}
            >
              Choose a lantern
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {GARDEN_LEVELS.map((puzzle) => {
                const locked = puzzle.id > state.completed.length + 1;
                return (
                  <Pressable
                    key={puzzle.id}
                    accessibilityRole="button"
                    accessibilityLabel={t("Lantern {number}", {
                      number: puzzle.id,
                    })}
                    aria-pressed={level.id === puzzle.id}
                    accessibilityState={{
                      selected: level.id === puzzle.id,
                      disabled: locked || busy || loading,
                    }}
                    disabled={locked || busy || loading}
                    onPress={() => setSelected(puzzle.id)}
                    style={{
                      width: 44,
                      height: 44,
                      borderWidth: 1,
                      borderRadius: 12,
                      borderColor:
                        level.id === puzzle.id ? colors.gold : colors.line,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: locked ? 0.35 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: state.completed.includes(puzzle.id)
                          ? colors.gold
                          : colors.ink,
                      }}
                    >
                      {puzzle.id}
                      {state.completed.includes(puzzle.id) ? " ✧" : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <ErrorText>{error}</ErrorText>
          {!available && !me && !!error && (
            <View style={{ gap: 10 }}>
              {confirmReset ? (
                <>
                  <Copy muted>
                    This removes this device’s guest game progress and
                    decorations.
                  </Copy>
                  <Button
                    title="Reset this guest garden"
                    disabled={busy}
                    onPress={() => void resetGuest()}
                  />
                  <Button
                    title="Cancel"
                    kind="ghost"
                    disabled={busy}
                    onPress={() => setConfirmReset(false)}
                  />
                </>
              ) : (
                <Button
                  title="Reset guest garden"
                  kind="ghost"
                  onPress={() => setConfirmReset(true)}
                />
              )}
            </View>
          )}
          {!!error && (
            <Button
              title="Reload garden"
              kind="secondary"
              onPress={reload}
              disabled={busy}
            />
          )}
          <View
            style={{
              borderTopWidth: 1,
              borderColor: colors.line,
              paddingTop: 16,
              gap: 8,
            }}
          >
            <Copy muted>Stay a little longer, or take the light with you.</Copy>
            <Button
              title="A quiet moment with Selene"
              kind="ghost"
              onPress={() => router.push("/companion")}
            />
            <Button
              title="Explore a question ↗"
              kind="ghost"
              onPress={() => router.push("/ask")}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

import { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, View } from "react-native";
import Svg, { Circle, Line, Path, G } from "react-native-svg";
import { router } from "expo-router";
import { LocalizedText as Text } from "./LocalizedText";
import { Copy, Eyebrow } from "./OracleShell";
import { Button } from "./ui";
import { useCalmMotion } from "./OracleArt";
import { STORY_STATUS, isKeptStory, updateLabel } from "@/lib/storyReturn";
import type { OracleCast } from "@/lib/oracle";
import { colors, fonts } from "@/lib/theme";
import { currentLang, useT } from "@/lib/i18n";

const positions = [
  [36, 82],
  [100, 44],
  [166, 93],
  [236, 53],
  [303, 83],
  [370, 31],
  [430, 68],
];
export function OracleStorySky({
  casts,
  highlightedId,
  highlightKey,
  compact = false,
}: {
  casts: OracleCast[];
  highlightedId?: string;
  highlightKey?: string;
  compact?: boolean;
}) {
  const t = useT();
  const reduced = useCalmMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [mapWidth, setMapWidth] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const mapHeight = compact ? 64 : 150;
  const kept = casts.filter((c) => isKeptStory(c));
  const stories = kept.slice(0, 7);
  // Keep an older story visible when its chapter was just updated.
  const highlighted = kept.find((c) => c.id === highlightedId);
  if (highlighted && !stories.some((c) => c.id === highlightedId))
    stories.splice(6, 1, highlighted);
  const chosen = stories.find((c) => c.id === selected);
  useEffect(() => {
    if (!highlightKey || reduced) {
      pulse.setValue(1);
      return;
    }
    pulse.setValue(0.65);
    const animation = Animated.timing(pulse, {
      toValue: 1,
      duration: 1100,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [highlightKey, reduced, pulse]);
  if (!stories.length) return null;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#79607F",
        borderRadius: compact ? 20 : 26,
        padding: compact ? 12 : 24,
        backgroundColor: "#271C35",
        gap: compact ? 4 : 16,
        marginVertical: compact ? 0 : 18,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {compact ? (
          <Text
            style={{
              color: colors.gold,
              fontSize: 9,
              letterSpacing: 1.6,
              fontWeight: "600",
            }}
          >
            MY CONSTELLATION
          </Text>
        ) : (
          <Eyebrow>MY CONSTELLATION</Eyebrow>
        )}
        {compact && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("View all stories")}
            onPress={() => router.push("/journal")}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: colors.gold, fontSize: 12 }}>
              View all stories ↗
            </Text>
          </Pressable>
        )}
      </View>
      {!compact && (
        <Text
          accessibilityRole="header"
          style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 30 }}
        >
          Your own small constellation.
        </Text>
      )}
      {!compact && (
        <Copy muted>One star for each story. A new node for each update.</Copy>
      )}
      <Animated.View
        onLayout={(event) => setMapWidth(event.nativeEvent.layout.width)}
        style={{ opacity: pulse, position: "relative" }}
      >
        <Svg
          width="100%"
          height={mapHeight}
          viewBox="0 0 465 140"
          accessibilityLabel={t("Your recent saved stories")}
        >
          {stories.length > 1 && (
            <Path
              d={stories
                .map(
                  (_, i) =>
                    `${i ? "L" : "M"}${positions[i][0]} ${positions[i][1]}`,
                )
                .join(" ")}
              stroke="#BD9ABB"
              strokeWidth=".8"
              strokeDasharray="3 6"
              fill="none"
            />
          )}
          {stories.map((c, i) => {
            const [x, y] = positions[i];
            const updates = c.journey!.updates;
            const color =
              c.journey!.status === "paused" ? "#B8A5C6" : colors.gold;
            return (
              <G key={c.id} transform={`translate(${x}, ${y})`}>
                {(selected === c.id || highlightedId === c.id) && (
                  <Circle
                    r={22}
                    stroke={colors.gold}
                    strokeWidth={1}
                    fill="none"
                  />
                )}
                <Circle
                  r={updates.length ? 6 : 4}
                  fill={color}
                  stroke="#F4DBF4"
                  strokeWidth={1}
                />
                {updates.map((u, n) => {
                  const angle =
                    (n * Math.PI * 2) / Math.max(updates.length, 1) -
                    Math.PI / 2;
                  const nx = Math.cos(angle) * 16,
                    ny = Math.sin(angle) * 16;
                  return (
                    <G key={u.id}>
                      <Line
                        x1={0}
                        y1={0}
                        x2={nx}
                        y2={ny}
                        stroke={color}
                        strokeWidth={0.65}
                      />
                      <Circle cx={nx} cy={ny} r={1.8} fill={color} />
                    </G>
                  );
                })}
              </G>
            );
          })}
        </Svg>
        {mapWidth > 0 &&
          stories.map((c, i) => {
            const scale = Math.min(mapWidth / 465, mapHeight / 140);
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={t("Open star {number}", { number: i + 1 })}
                accessibilityState={{ expanded: selected === c.id }}
                onPress={() => {
                  setSelected(selected === c.id ? null : c.id);
                  setRevealed(false);
                }}
                style={{
                  position: "absolute",
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  left:
                    (mapWidth - 465 * scale) / 2 + positions[i][0] * scale - 22,
                  top:
                    (mapHeight - 140 * scale) / 2 +
                    positions[i][1] * scale -
                    22,
                }}
              />
            );
          })}
      </Animated.View>
      {compact ? (
        <Text
          localize={false}
          style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}
        >
          {t("{count} stories", { count: kept.length })} ·{" "}
          {t("{count} updates", {
            count: kept.reduce((sum, c) => sum + c.journey!.updates.length, 0),
          })}
        </Text>
      ) : (
        <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 19 }}>
          Each light is a story you chose to keep.
        </Text>
      )}
      {!compact && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {stories.map((c, i) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={t("Story {number}", { number: i + 1 })}
              accessibilityState={{ expanded: selected === c.id }}
              onPress={() => {
                setSelected(selected === c.id ? null : c.id);
                setRevealed(false);
              }}
              style={{
                borderColor: selected === c.id ? colors.gold : colors.line,
                borderWidth: 1,
                borderRadius: 14,
                padding: 13,
                minHeight: 44,
                gap: 6,
              }}
            >
              <Text
                localize={false}
                style={{ color: colors.ink, fontSize: 12 }}
              >
                {t("Story {number}", { number: i + 1 })} ·{" "}
                {new Date(c.createdAt).toLocaleDateString(currentLang(), {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              <Text
                localize={false}
                style={{ color: colors.gold, fontSize: 11 }}
              >
                {t(STORY_STATUS[c.journey!.status])} ·{" "}
                {t("{count} updates", { count: c.journey!.updates.length })}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {chosen && (
        <View
          style={{
            gap: 12,
            borderTopWidth: 1,
            borderColor: colors.line,
            paddingTop: 16,
          }}
        >
          <Button
            title={revealed ? "Hide story details" : "Show story details"}
            kind="ghost"
            onPress={() => setRevealed(!revealed)}
          />
          {revealed && (
            <>
              <Copy localize={false}>{chosen.question}</Copy>
              <Copy localize={false}>{chosen.journey!.action}</Copy>
              {chosen
                .journey!.updates.slice()
                .reverse()
                .map((update) => (
                  <View
                    key={update.id}
                    style={{
                      borderLeftWidth: 1,
                      borderColor: colors.gold,
                      paddingLeft: 14,
                      gap: 5,
                    }}
                  >
                    <Text
                      localize={false}
                      style={{ color: colors.gold, fontSize: 12 }}
                    >
                      {t(updateLabel(update))} ·{" "}
                      {new Date(update.createdAt).toLocaleDateString(
                        currentLang(),
                      )}
                    </Text>
                    {!!update.text && (
                      <Copy localize={false}>{update.text}</Copy>
                    )}
                  </View>
                ))}
            </>
          )}
          <Button
            title="Open this story"
            kind="secondary"
            onPress={() => router.push(`/oracle/${chosen.id}`)}
          />
        </View>
      )}
      {!compact && (
        <Button
          title="View all stories"
          kind="ghost"
          onPress={() => router.push("/journal")}
        />
      )}
    </View>
  );
}

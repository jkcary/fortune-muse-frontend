import { useRef, useState, useEffect } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { LocalizedText as Text } from "./LocalizedText";
import { Copy, Eyebrow } from "./OracleShell";
import { OracleStoryUpdate } from "./OracleStoryUpdate";
import { OracleJourneyProgress } from "./OracleJourneyProgress";
import { Button, ErrorText } from "./ui";
import { oracle, type OracleCast } from "@/lib/oracle";
import { currentLang, useT } from "@/lib/i18n";
import {
  isFollowing,
  isKeptStory,
  isSavedReading,
  selectReturnStory,
} from "@/lib/storyReturn";
import { colors, fonts } from "@/lib/theme";

export function OracleReturnHome({
  casts,
  currentId,
  onPreference,
  onUpdated,
}: {
  casts: OracleCast[];
  currentId: string | null;
  onPreference: (id: string | null) => void;
  onUpdated: (cast: OracleCast) => void;
}) {
  const t = useT();
  const [hidden, setHidden] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [managing, setManaging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [updatedId, setUpdatedId] = useState<string | null>(null);
  const lock = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const kept = casts.filter((c) => isKeptStory(c) && !hidden.includes(c.id));
  const saved = casts.filter(
    (c) => isSavedReading(c) && !hidden.includes(c.id),
  );
  const selected =
    kept.find((c) => c.id === picked) ??
    selectReturnStory(casts, currentId, hidden);
  const story = selected ?? saved[0];
  if (!story) return null;
  const following = isFollowing(story);
  const candidates = kept.filter(isFollowing);
  function choose(id: string) {
    setPicked(id);
    setRevealed(false);
    setSwitching(false);
    setError("");
  }
  async function prefer(id: string | null) {
    if (lock.current || busy) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await oracle<{ currentCastId: string | null }>(
        "/oracle/return-preferences",
        { method: "PATCH", body: { currentCastId: id } },
      );
      if (alive.current) onPreference(result.currentCastId);
    } catch {
      if (alive.current)
        setError("Your current story could not be changed. Please try again.");
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 20,
        padding: 14,
        gap: 8,
        backgroundColor: "#281D34",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#403044",
            marginTop: 3,
          }}
        >
          <Text style={{ color: colors.gold, fontSize: 20 }}>✧</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text
            style={{
              color: colors.gold,
              fontSize: 9,
              letterSpacing: 1.6,
              fontWeight: "600",
              lineHeight: 13,
            }}
          >
            {following ? "YOUR NEXT CHAPTER" : "A STORY YOU KEPT"}
          </Text>
          <Text
            accessibilityRole="header"
            style={{
              color: colors.ink,
              fontFamily: fonts.display,
              fontSize: 20,
              lineHeight: 25,
            }}
          >
            {following
              ? "How did your small step go?"
              : "Your story is here, at your pace."}
          </Text>
          <Text
            localize={false}
            style={{ color: colors.muted, fontSize: 11, lineHeight: 16 }}
          >
            {t(
              story.topic === "love" ? "Love & connection" : "Work & resources",
            )}{" "}
            ·{" "}
            {new Date(story.createdAt).toLocaleDateString(currentLang(), {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Story options")}
          accessibilityState={{ expanded: managing, disabled: busy }}
          disabled={busy}
          onPress={() => setManaging(!managing)}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.gold, fontSize: 24, lineHeight: 26 }}>
            ···
          </Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(
          revealed ? "Hide my question & step" : "Show my question & step",
        )}
        accessibilityState={{ expanded: revealed, disabled: busy }}
        disabled={busy}
        onPress={() => setRevealed(!revealed)}
        style={{
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          borderTopWidth: 1,
          borderColor: colors.line,
          paddingTop: 5,
        }}
      >
        <Text style={{ color: colors.gold, fontSize: 12, flex: 1 }}>
          {revealed ? "Hide my question & step" : "Show my question & step"}
        </Text>
        <Text style={{ color: colors.gold, fontSize: 17 }}>
          {revealed ? "−" : "+"}
        </Text>
      </Pressable>
      <OracleJourneyProgress key={story.id} cast={story} compact/>
      {revealed && (
        <View
          style={{
            borderLeftWidth: 1,
            borderColor: colors.gold,
            paddingLeft: 12,
            gap: 10,
          }}
        >
          <Copy localize={false}>{story.question}</Copy>
          {!!story.journey?.action && (
            <>
              <Eyebrow>YOUR SMALL STEP</Eyebrow>
              <Copy localize={false}>{story.journey.action}</Copy>
            </>
          )}
          {(following || updatedId === story.id) && (
            <OracleStoryUpdate
              key={story.id}
              cast={story}
              onBusyChange={setBusy}
              onUpdated={(next) => {
                setPicked(next.id);
                setUpdatedId(next.id);
                onUpdated(next);
              }}
            />
          )}
          <Button
            title="Open this story"
            kind="ghost"
            disabled={busy}
            onPress={() => router.push(`/oracle/${story.id}`)}
          />
        </View>
      )}
      {managing && (
        <View
          style={{
            gap: 4,
            borderTopWidth: 1,
            borderColor: colors.line,
            paddingTop: 8,
          }}
        >
          <Button
            title="Open this story"
            kind="ghost"
            disabled={busy}
            onPress={() => router.push(`/oracle/${story.id}`)}
          />
          {following && currentId !== story.id && (
            <Button
              title="Make this my current story"
              kind="ghost"
              disabled={busy}
              onPress={() => void prefer(story.id)}
            />
          )}
          {currentId === story.id && (
            <Button
              title="Use automatic story order"
              kind="ghost"
              disabled={busy}
              onPress={() => void prefer(null)}
            />
          )}
          {candidates.length > 1 && (
            <Button
              title={switching ? "Close story choices" : "Choose another story"}
              kind="ghost"
              disabled={busy}
              onPress={() => setSwitching(!switching)}
            />
          )}
          <Button
            title="Hide for this visit"
            kind="ghost"
            disabled={busy}
            onPress={() => {
              setHidden([...hidden, story.id]);
              setPicked(null);
              setRevealed(false);
              setManaging(false);
            }}
          />
          {switching && (
            <View style={{ gap: 6 }}>
              {candidates.map((c, i) => (
                <Button
                  key={c.id}
                  title={`${t("Story {number}", { number: i + 1 })} · ${new Date(c.createdAt).toLocaleDateString(currentLang())}`}
                  kind="secondary"
                  disabled={busy}
                  onPress={() => {
                    choose(c.id);
                    setManaging(false);
                  }}
                />
              ))}
            </View>
          )}
        </View>
      )}
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

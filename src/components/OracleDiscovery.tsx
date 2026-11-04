import { useEffect, useRef, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { LocalizedText as Text } from "./LocalizedText";
import { Copy, Eyebrow, Panel } from "./OracleShell";
import { Button, ErrorText, Loading } from "./ui";
import { OracleGuidePortrait } from "./OracleGuidePortrait";
import { OracleDoorArt } from "./OracleDoorArt";
import { OracleStory } from "./OracleStory";
import { OracleDoorExercise } from "./OracleDoorExercise";
import { OracleJourneyProgress } from "./OracleJourneyProgress";
import { ApiError } from "@/lib/api";
import { oracle, type OracleCast } from "@/lib/oracle";
import { useI18n } from "@/lib/i18n";
import { colors, fonts } from "@/lib/theme";

export function OracleDiscovery({
  cast,
  onUpdated,
}: {
  cast: OracleCast;
  onUpdated: (cast: OracleCast) => void;
}) {
  const { lang, t } = useI18n();
  const { width } = useWindowDimensions();
  const [glimpse, setGlimpse] = useState(cast.glimpse);
  const [loading, setLoading] = useState(!cast.glimpse);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<"a" | "b" | null>(
    cast.journey?.selectedDoor ?? null,
  );
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const choiceLock = useRef(false);
  useEffect(() => {
    if (cast.journey?.selectedDoor) setSelected(cast.journey.selectedDoor);
  }, [cast.journey?.selectedDoor]);
  async function load() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 75000);
    setLoading(true);
    setError("");
    try {
      const result = await oracle<{ cast: OracleCast }>(
        `/oracle/casts/${cast.id}/glimpse`,
        { body: { language: lang }, signal: controller.signal },
      );
      if (!mounted.current || controller.signal.aborted) return;
      setGlimpse(result.cast.glimpse);
      onUpdated(result.cast);
    } catch {
      if (mounted.current && request.current === controller)
        setError(
          "Your reflection could not load. Your recorded coins are safe. Try again, or explore the symbolism below.",
        );
    } finally {
      clearTimeout(timeout);
      if (mounted.current && request.current === controller) setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    if (!cast.glimpse) void load();
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, [cast.id]);
  async function choose(patch: {
    selectedDoor?: "a" | "b" | null;
    feedback?: "fits" | "misses";
  }) {
    if (choiceLock.current) return;
    if (patch.selectedDoor !== undefined && selected) return;
    choiceLock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await oracle<{ cast: OracleCast }>(
        `/oracle/casts/${cast.id}/journey`,
        { method: "PATCH", body: patch },
      );
      if (!mounted.current) return;
      if (result.cast.journey?.selectedDoor)
        setSelected(result.cast.journey.selectedDoor);
      onUpdated(result.cast);
    } catch (e) {
      // Recover a committed choice after a lost response or another device's choice.
      if (patch.selectedDoor !== undefined) {
        try {
          const fresh = await oracle<{ cast: OracleCast }>(
            `/oracle/casts/${cast.id}`,
          );
          if (mounted.current && fresh.cast.journey?.selectedDoor) {
            setSelected(fresh.cast.journey.selectedDoor);
            onUpdated(fresh.cast);
            setError(
              e instanceof ApiError && e.code === "door_locked"
                ? "Your path is already chosen. The other door stays closed."
                : "",
            );
            return;
          }
        } catch {
          /* Retain the retry message if the reading cannot be reloaded. */
        }
      }
      if (mounted.current)
        setError("Your choice could not be saved. Please try again.");
    } finally {
      choiceLock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const door = glimpse?.doors.find((d) => d.id === selected);
  return (
    <View style={{ gap: 22 }}>
      <OracleJourneyProgress cast={cast} />
      <Panel>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <OracleGuidePortrait size={48} />
          <View style={{ flex: 1 }}>
            <Eyebrow>A MOMENT OF CLARITY</Eyebrow>
            <Text
              style={{
                color: colors.ink,
                fontFamily: fonts.display,
                fontSize: 26,
              }}
            >
              Let’s bring this back to you.
            </Text>
          </View>
        </View>
        {loading && (
          <Loading label="Connecting your question with your six lines…" />
        )}
        {glimpse && (
          <>
            {!glimpse.aiGenerated && (
              <Text
                style={{ color: colors.gold, fontSize: 12, lineHeight: 21 }}
              >
                AI is unavailable. These are editorial exploration prompts; you
                can retry for a personal reflection.
              </Text>
            )}
            <Copy localize={false}>{glimpse.reflection}</Copy>
            <Text
              localize={false}
              style={{ color: colors.gold, fontSize: 16, lineHeight: 26 }}
            >
              {glimpse.question}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              {glimpse.aiGenerated
                ? "A short AI reflection on your question. You decide what fits."
                : "Editorial prompts · not a personalized AI reading."}
            </Text>
            {glimpse.language !== lang && (
              <Text style={{ color: colors.muted, fontSize: 11 }}>
                Saved reflections keep their original language.
              </Text>
            )}
            {glimpse.aiGenerated && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {(
                  [
                    ["fits", "That resonates"],
                    ["misses", "Not quite me"],
                  ] as const
                ).map(([value, label]) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    aria-pressed={cast.journey?.feedback === value}
                    accessibilityState={{
                      selected: cast.journey?.feedback === value,
                      disabled: busy,
                    }}
                    disabled={busy}
                    onPress={() => void choose({ feedback: value })}
                    style={{
                      borderWidth: 1,
                      borderColor:
                        cast.journey?.feedback === value
                          ? colors.gold
                          : colors.line,
                      borderRadius: 99,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {cast.journey?.feedback === "misses" && (
              <Copy muted>You can write your own small step below.</Copy>
            )}
            {!glimpse.aiGenerated && (
              <Button
                title="Retry personal reflection"
                onPress={() => void load()}
                kind="ghost"
                disabled={loading || busy}
              />
            )}
          </>
        )}
        <ErrorText>{error}</ErrorText>
        {!glimpse && !loading && (
          <Button
            title="Try my reflection again"
            onPress={() => void load()}
            kind="secondary"
          />
        )}
      </Panel>
      {glimpse && (
        <>
          <View style={{ gap: 9 }}>
            <Eyebrow>TWO DOORS. YOUR OWN WAY.</Eyebrow>
            <Text
              style={{
                color: colors.ink,
                fontFamily: fonts.display,
                fontSize: 30,
              }}
            >
              Which would you like to explore?
            </Text>
            <Copy muted>
              {selected
                ? "Your path is chosen. The other door stays closed for this reading."
                : "Choose one door. Once opened, your choice stays with this reading."}
            </Copy>
          </View>
          <View
            style={{ flexDirection: width < 360 ? "column" : "row", gap: 12 }}
          >
            {glimpse.doors.map((d, i) => (
              <Pressable
                key={d.id}
                accessibilityRole="button"
                accessibilityLabel={`${t("Explore path")} ${i + 1}: ${d.title}`}
                aria-expanded={selected === d.id}
                accessibilityState={{
                  expanded: selected === d.id,
                  disabled: busy || Boolean(selected),
                }}
                disabled={busy || Boolean(selected)}
                onPress={() => void choose({ selectedDoor: d.id })}
                style={({ pressed }) => ({
                  flex: 1,
                  minWidth: 0,
                  borderRadius: 24,
                  padding: 20,
                  borderWidth: 1,
                  borderColor:
                    selected === d.id
                      ? i
                        ? colors.love
                        : colors.gold
                      : colors.line,
                  backgroundColor: selected === d.id ? "#35263F" : "#21192D",
                  opacity:
                    selected && selected !== d.id ? 0.45 : pressed ? 0.85 : 1,
                })}
              >
                <Text
                  style={{
                    color: i ? colors.love : colors.gold,
                    fontSize: 10,
                    letterSpacing: 2,
                  }}
                >
                  {i ? "PATH B" : "PATH A"}
                </Text>
                <OracleDoorArt
                  open={selected === d.id}
                  rose={Boolean(i)}
                  bits={cast.basis!.primary.bits}
                />
                <Text
                  localize={false}
                  style={{
                    fontFamily: fonts.display,
                    color: colors.ink,
                    fontSize: width < 640 ? 20 : 25,
                    lineHeight: width < 640 ? 27 : 32,
                    textAlign: "center",
                  }}
                >
                  {d.title}
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    textAlign: "center",
                    marginTop: 12,
                    fontSize: 12,
                  }}
                >
                  {selected === d.id
                    ? "Your chosen path · door open"
                    : selected
                      ? "This door is now closed"
                      : "Open this door ↗"}
                </Text>
              </Pressable>
            ))}
          </View>
          {door && (
            <Panel>
              <Text
                localize={false}
                style={{
                  color: colors.ink,
                  fontFamily: fonts.display,
                  fontSize: 26,
                }}
              >
                {door.title}
              </Text>
              <Eyebrow>WHAT THIS OPENS UP</Eyebrow>
              <Copy localize={false}>{door.perspective}</Copy>
              <Eyebrow>THE TRADEOFF</Eyebrow>
              <Copy localize={false} muted>
                {door.tradeoff}
              </Copy>
              <Eyebrow>A SMALL EXPERIMENT</Eyebrow>
              <Copy localize={false}>{door.experiment}</Copy>
              <OracleDoorExercise
                key={`${cast.id}-${door.id}`}
                cast={cast}
                door={door.id}
                onUpdated={onUpdated}
              />
            </Panel>
          )}
          {!selected && (
            <Button
              title="Neither path — I’ll write my own"
              kind="ghost"
              onPress={() =>
                void choose({ selectedDoor: null, feedback: "misses" })
              }
              disabled={busy}
            />
          )}
          <OracleStory
            key={cast.id}
            cast={cast}
            suggestion={door?.experiment ?? ""}
            onUpdated={onUpdated}
          />
        </>
      )}
    </View>
  );
}

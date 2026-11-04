import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, View, type PressableProps } from "react-native";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { LocalizedText as Text } from "./LocalizedText";
import { Button, ErrorText, Field } from "./ui";
import { OracleChapterFeedback } from "./OracleChapterFeedback";
import { ApiError } from "@/lib/api";
import { oracle, type OracleCast } from "@/lib/oracle";
import { useT } from "@/lib/i18n";
import { colors } from "@/lib/theme";

type RadioKeyEvent = Parameters<NonNullable<PressableProps["onKeyDown"]>>[0];

const OPTIONS = [
  { id: "tried", label: "I tried it", status: "tried", kind: "status" },
  {
    id: "waiting",
    label: "Still considering",
    status: "waiting",
    kind: "status",
  },
  {
    id: "changed",
    label: "Something changed",
    status: "waiting",
    kind: "changed",
  },
  { id: "paused", label: "Taking a pause", status: "paused", kind: "status" },
] as const;
export function OracleStoryUpdate({
  cast,
  onUpdated,
  disabled = false,
  onBusyChange,
}: {
  cast: OracleCast;
  onUpdated: (cast: OracleCast) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const t = useT();
  const [choice, setChoice] = useState<(typeof OPTIONS)[number] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [chapter, setChapter] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const alive = useRef(true);
  const lock = useRef(false);
  const requestId = useRef<{ signature: string; id: string } | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const full = limitReached || (cast.journey?.updates.length ?? 0) >= 20;
  function selectChoice(option: (typeof OPTIONS)[number]) {
    setChoice(option);
    setChapter("");
    setError("");
  }
  async function save() {
    if (!choice || lock.current || full || unavailable || disabled) return;
    const signature = JSON.stringify([choice.id, text.trim()]);
    if (requestId.current?.signature !== signature)
      requestId.current = { signature, id: randomUUID() };
    lock.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      const result = await oracle<{ cast: OracleCast }>(
        `/oracle/casts/${cast.id}/journey`,
        {
          method: "PATCH",
          body: {
            update: {
              id: requestId.current.id,
              text: text.trim(),
              status: choice.status,
              kind: choice.kind,
            },
          },
        },
      );
      if (!alive.current) return;
      const savedId = requestId.current.id;
      onUpdated(result.cast);
      setChapter(savedId);
      setText("");
      setChoice(null);
      requestId.current = null;
    } catch (e) {
      if (!alive.current) return;
      if (e instanceof ApiError && e.code === "story_full") {
        setLimitReached(true);
        setError("");
      } else if (e instanceof ApiError && e.status === 404) {
        setUnavailable(true);
        setError("This story is no longer available. Return to your journal.");
      } else
        setError(
          "Your story could not be saved. Your words are still here. Please try again.",
        );
    } finally {
      lock.current = false;
      if (alive.current) {
        setBusy(false);
        onBusyChange?.(false);
      }
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 22 }}>
        A status is enough. Add words only if you want to.
      </Text>
      {!full && !unavailable && (
        <>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t("How did your small step go?")}
            style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
          >
            {OPTIONS.map((option, index) => (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                aria-checked={choice?.id === option.id}
                accessibilityState={{
                  checked: choice?.id === option.id,
                  disabled: busy || disabled,
                }}
                disabled={busy || disabled}
                onPress={() => selectChoice(option)}
                {...(Platform.OS === "web"
                  ? {
                      tabIndex:
                        choice?.id === option.id || (!choice && index === 0)
                          ? 0
                          : -1,
                      onKeyDown: (event: RadioKeyEvent) => {
                        if (busy || disabled) return;
                        const key = event.nativeEvent.key;
                        // React Native Web handles Enter; radio Space and arrows need their own behaviour.
                        if (key === " " || key === "Spacebar") {
                          event.preventDefault();
                          selectChoice(option);
                        } else if (
                          [
                            "ArrowRight",
                            "ArrowDown",
                            "ArrowLeft",
                            "ArrowUp",
                          ].includes(key)
                        ) {
                          event.preventDefault();
                          const next =
                            (index +
                              (["ArrowRight", "ArrowDown"].includes(key)
                                ? 1
                                : -1) +
                              OPTIONS.length) %
                            OPTIONS.length;
                          selectChoice(OPTIONS[next]);
                          (
                            event.currentTarget as unknown as HTMLElement
                          ).parentElement
                            ?.querySelectorAll<HTMLElement>('[role="radio"]')
                            [next]?.focus();
                        }
                      },
                    }
                  : {})}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor:
                    choice?.id === option.id ? colors.gold : colors.line,
                  backgroundColor:
                    choice?.id === option.id ? "#3B2A43" : "transparent",
                }}
              >
                <Text style={{ color: colors.ink, fontSize: 12 }}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {choice && (
            <View style={{ gap: 8 }}>
              <Field
                label="Add a little detail (optional)"
                value={text}
                onChangeText={setText}
                editable={!busy && !disabled}
                multiline
                maxLength={600}
                placeholder="A new fact, a feeling, or something still unanswered…"
              />
              {choice.id === "paused" && (
                <Text
                  style={{ color: colors.muted, fontSize: 12, lineHeight: 20 }}
                >
                  This stops return invitations. Your story stays in your
                  journal.
                </Text>
              )}
              <Button
                title="Save my update"
                onPress={() => void save()}
                loading={busy}
                disabled={disabled}
                kind="secondary"
              />
              <Button
                title="Cancel update"
                kind="ghost"
                disabled={busy || disabled}
                onPress={() => {
                  setChoice(null);
                  setText("");
                  setError("");
                }}
              />
            </View>
          )}
        </>
      )}
      {full && (
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 21 }}>
          This story has 20 updates. You can keep writing in your journal notes.
        </Text>
      )}
      {(full || unavailable) && (
        <Button
          title="Open my journal"
          kind="secondary"
          onPress={() => router.push("/journal")}
        />
      )}
      <ErrorText>{error}</ErrorText>
      {(full || unavailable) && !!text && (
        <Field
          label="Your unsaved detail"
          value={text}
          multiline
          editable={false}
        />
      )}
      {!!chapter && (
        <OracleChapterFeedback
          chapterId={chapter}
          temporary={!cast.saved || cast.privateMode}
        />
      )}
    </View>
  );
}

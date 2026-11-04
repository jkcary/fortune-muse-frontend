import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { LocalizedText as Text } from "./LocalizedText";
import { Button, ErrorText, Loading } from "./ui";
import { Copy } from "./OracleShell";
import { oracle, type OracleCast } from "@/lib/oracle";
import { useI18n } from "@/lib/i18n";
import type { OracleDoorExerciseContent } from "@/lib/oracle-contract";
import { colors } from "@/lib/theme";

export function OracleDoorExercise({
  cast,
  door,
  onUpdated,
}: {
  cast: OracleCast;
  door: "a" | "b";
  onUpdated: (cast: OracleCast) => void;
}) {
  const { lang } = useI18n();
  const [content, setContent] = useState<OracleDoorExerciseContent | null>(
    cast.doorExerciseContent ?? null,
  );
  const saved =
    cast.journey?.doorExercise?.version === 1 &&
    cast.journey.doorExercise.door === door
      ? cast.journey.doorExercise
      : null;
  const [priority, setPriority] = useState(saved?.priority ?? ""),
    [cost, setCost] = useState(saved?.cost ?? "");
  const [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const alive = useRef(true),
    sequence = useRef(0),
    saveLock = useRef(false);
  const reflection = content?.reflections.find(
    (r) => r.priority === priority && r.cost === cost,
  );
  const kept = Boolean(
    saved && saved.priority === priority && saved.cost === cost,
  );
  async function generate(selection?: { priority: string; cost: string }) {
    const revision = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const result = await oracle<{ cast: OracleCast }>(
        `/oracle/casts/${cast.id}/door-exercise`,
        {
          body: { language: lang, ...(selection ? { selection } : {}) },
          signal: AbortSignal.timeout(145000),
        },
      );
      if (!alive.current || revision !== sequence.current) return;
      setContent(result.cast.doorExerciseContent ?? null);
      onUpdated(result.cast);
    } catch {
      if (alive.current && revision === sequence.current)
        setError(
          selection
            ? "Your personal reflection could not be generated. Please retry."
            : "Your personal options could not be generated. Please retry.",
        );
    } finally {
      if (alive.current && revision === sequence.current) setLoading(false);
    }
  }
  useEffect(() => {
    alive.current = true;
    if (!cast.doorExerciseContent) void generate();
    return () => {
      alive.current = false;
      sequence.current++;
    };
  }, [cast.id, door]);
  useEffect(() => {
    if (cast.doorExerciseContent) setContent(cast.doorExerciseContent);
  }, [cast.doorExerciseContent]);
  useEffect(() => {
    if (!content || !priority || !cost || reflection) return;
    void generate({ priority, cost });
    // Changing options supersedes the preceding response; failed requests retry explicitly.
  }, [priority, cost, Boolean(content), Boolean(reflection)]);
  function pick(id: string, kind: "priority" | "cost") {
    if ((kind === "priority" ? priority : cost) === id) return;
    sequence.current++;
    setLoading(false);
    setError("");
    if (kind === "priority") setPriority(id);
    else setCost(id);
  }
  async function save() {
    if (!priority || !cost || saveLock.current) return;
    saveLock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await oracle<{ cast: OracleCast }>(
        `/oracle/casts/${cast.id}/journey`,
        {
          method: "PATCH",
          body: { doorExercise: { version: 1, door, priority, cost } },
        },
      );
      if (alive.current) onUpdated(result.cast);
    } catch {
      if (alive.current)
        setError("Your choices could not be saved. Please retry.");
    } finally {
      saveLock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  function choices(
    items: { id: string; label: string }[],
    kind: "priority" | "cost",
  ) {
    const selected = kind === "priority" ? priority : cost;
    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            aria-pressed={selected === item.id}
            accessibilityState={{
              selected: selected === item.id,
              disabled: busy || loading,
            }}
            disabled={busy || loading}
            onPress={() => pick(item.id, kind)}
            style={{
              minHeight: 44,
              maxWidth: "100%",
              padding: 12,
              borderWidth: 1,
              borderColor:
                selected === item.id
                  ? kind === "priority"
                    ? colors.gold
                    : colors.love
                  : colors.line,
              borderRadius: 14,
            }}
          >
            <Text
              localize={false}
              style={{
                color: selected === item.id ? colors.gold : colors.ink,
                fontSize: 13,
                lineHeight: 20,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }
  return (
    <View
      style={{
        gap: 14,
        borderTopWidth: 1,
        borderColor: colors.line,
        paddingTop: 18,
      }}
    >
      <Text style={{ color: colors.gold, fontSize: 12 }}>
        TRY THIS POSSIBILITY ON
      </Text>
      {content && (
        <>
          <Copy localize={false}>{content.priorityQuestion}</Copy>
          {choices(content.priorities, "priority")}
          {priority && (
            <>
              <Copy localize={false}>{content.costQuestion}</Copy>
              {choices(content.costs, "cost")}
            </>
          )}
          {reflection && (
            <View
              style={{
                gap: 12,
                padding: 16,
                borderRadius: 16,
                backgroundColor: "#3A2D46",
              }}
            >
              <Text
                localize={false}
                style={{ color: colors.gold, fontSize: 13, lineHeight: 22 }}
              >
                {reflection.summary}
              </Text>
              <Copy localize={false}>{reflection.prompt}</Copy>
              <Text style={{ color: colors.muted, fontSize: 11 }}>
                AI-generated for your question and choices.
              </Text>
              <Button
                title={kept ? "Choices kept" : "Keep these choices"}
                kind="secondary"
                disabled={kept}
                loading={busy}
                onPress={() => void save()}
              />
            </View>
          )}
          {content.language !== lang && (
            <Copy muted>Saved reflections keep their original language.</Copy>
          )}
        </>
      )}
      {loading && (
        <Loading
          label={
            content
              ? "Connecting your choices with your situation…"
              : "Creating personal options from your question…"
          }
        />
      )}
      <ErrorText>{error}</ErrorText>
      {!!error && !loading && (
        <Button
          title="Retry personal options"
          kind="secondary"
          onPress={() =>
            void generate(priority && cost ? { priority, cost } : undefined)
          }
        />
      )}
      <Copy muted>
        You can skip this exercise or change your choices. Your next step is
        yours to write.
      </Copy>
    </View>
  );
}

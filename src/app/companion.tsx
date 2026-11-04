import { useEffect, useRef, useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LocalizedText as Text } from "@/components/LocalizedText";
import {
  OracleShell,
  Display,
  Eyebrow,
  Copy,
  Panel,
} from "@/components/OracleShell";
import { OracleGuidePortrait } from "@/components/OracleGuidePortrait";
import { Button, ErrorText, Field, Loading } from "@/components/ui";
import { useGarden, todayOnDevice } from "@/lib/garden";
import { useSession } from "@/lib/session";
import { oracle, type OracleCast } from "@/lib/oracle";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";

export default function Companion() {
  const { me } = useSession();
  const params = useLocalSearchParams<{ castId?: string }>();
  return (
    <OracleShell wide={false}>
      <CompanionContent
        key={`${me?.id ?? "guest"}-${params.castId ?? "quiet"}`}
        castId={params.castId}
      />
    </OracleShell>
  );
}
function CompanionContent({ castId }: { castId?: string }) {
  const { state, loading, busy, error, moment, reload } = useGarden();
  const { t, lang } = useI18n();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<"quiet" | "rehearse">(
    castId ? "rehearse" : "quiet",
  );
  const [kind, setKind] = useState<string | null>(null),
    [thought, setThought] = useState(""),
    [fact, setFact] = useState(""),
    [concern, setConcern] = useState("");
  const [step, setStep] = useState(""),
    [sentence, setSentence] = useState(""),
    [observation, setObservation] = useState(""),
    [request, setRequest] = useState(""),
    [preview, setPreview] = useState(false);
  const [cast, setCast] = useState<OracleCast | null>(null),
    [castError, setCastError] = useState(""),
    [retry, setRetry] = useState(0);
  type Reflection = {
    points: string[];
    language: string;
    aiGenerated: true;
    generator: string;
  };
  const [questionBusy, setQuestionBusy] = useState(false),
    [questionError, setQuestionError] = useState("");
  const [reflection, setReflection] = useState<{
    signature: string;
    data: Reflection;
  } | null>(null);
  const reflectionCache = useRef<{
      signature: string;
      data: Reflection;
    } | null>(null),
    questionLock = useRef(false);
  const inputSignature = JSON.stringify([
    lang,
    thought.trim(),
    fact.trim(),
    concern.trim(),
  ]);
  const activeReflection =
    reflection?.signature === inputSignature ? reflection.data : null;
  const hasQuestionInput = [thought, fact, concern].join("").trim().length >= 3;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!castId) return;
    let active = true;
    setCastError("");
    void oracle<{ cast: OracleCast }>(`/oracle/casts/${castId}`)
      .then((r) => {
        if (active) {
          setCast(r.cast);
          setStep(r.cast.journey?.action ?? "");
        }
      })
      .catch(() => {
        if (active)
          setCastError(
            "This step could not load. You can retry or write a practice step.",
          );
      });
    return () => {
      active = false;
    };
  }, [castId, retry]);
  const keptToday = Boolean(state.todayKind && state.today === todayOnDevice());
  async function keepOpenQuestion() {
    if (questionLock.current || !hasQuestionInput) return;
    questionLock.current = true;
    setQuestionBusy(true);
    setQuestionError("");
    try {
      let value =
        reflectionCache.current?.signature === inputSignature
          ? reflectionCache.current.data
          : null;
      if (!value) {
        value = await api<Reflection>("/garden/question-reflection", {
          body: { thought, fact, concern, language: lang },
          signal: AbortSignal.timeout(145000),
        });
        if (
          !value.aiGenerated ||
          !Array.isArray(value.points) ||
          value.points.length !== 3 ||
          value.points.some((p) => typeof p !== "string") ||
          [...value.points.map((p, i) => `${i + 1}. ${p}`).join("\n")].length >
            200
        )
          throw new Error("Invalid reflection");
        if (!alive.current) return;
        reflectionCache.current = { signature: inputSignature, data: value };
      }
      if (!alive.current) return;
      setReflection({ signature: inputSignature, data: value });
      if (!(state.todayKind && state.today === todayOnDevice()))
        await moment("question");
    } catch {
      if (alive.current)
        setQuestionError(
          "Your key-point reflection could not be generated. Please retry.",
        );
    } finally {
      questionLock.current = false;
      if (alive.current) setQuestionBusy(false);
    }
  }

  return (
    <View style={{ paddingVertical: 32, gap: 22 }}>
      <View style={{ alignItems: "center", gap: 14 }}>
        <OracleGuidePortrait size={width < 500 ? 110 : 150} />
        <Eyebrow>A MOMENT WITH SELENE</Eyebrow>
        <Display size={width < 500 ? 36 : 48}>There is room to pause.</Display>
        <Copy muted>
          A quiet reflection or a little practice before your next step.
        </Copy>
      </View>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        {(
          [
            ["quiet", "A quiet moment"],
            ["rehearse", "Rehearse a small step"],
          ] as const
        ).map(([id, label]) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            aria-pressed={tab === id}
            accessibilityState={{ selected: tab === id }}
            onPress={() => setTab(id)}
            style={{
              minHeight: 44,
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: tab === id ? colors.gold : colors.line,
            }}
          >
            <Text style={{ color: tab === id ? colors.gold : colors.ink }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === "quiet" ? (
        <Panel>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 27,
              color: colors.ink,
            }}
          >
            What would you like to notice today?
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              ["joy", "A small joy"],
              ["discovery", "A new discovery"],
              ["question", "An open question"],
            ].map(([id, label]) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                aria-pressed={kind === id}
                accessibilityState={{
                  selected: kind === id,
                  disabled: busy || questionBusy,
                }}
                disabled={busy || questionBusy}
                onPress={() => {
                  setKind(id);
                  setQuestionError("");
                }}
                style={{
                  padding: 12,
                  minHeight: 44,
                  borderWidth: 1,
                  borderColor: kind === id ? colors.gold : colors.line,
                  borderRadius: 14,
                }}
              >
                <Text style={{ color: kind === id ? colors.gold : colors.ink }}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          {kind && (
            <>
              <Field
                label="One thought, if you like"
                value={thought}
                onChangeText={(value) => {
                  setThought(value);
                  setQuestionError("");
                }}
                editable={!busy && !questionBusy}
                maxLength={400}
                multiline
                placeholder="A few words are enough…"
              />
              <Copy>
                {kind === "joy"
                  ? "What made that moment feel good? Let yourself notice it."
                  : kind === "discovery"
                    ? "What do you see a little differently now?"
                    : "You do not have to answer it today. What part is a fact, and what part is still a possibility?"}
              </Copy>
              {kind === "question" && (
                <>
                  <Field
                    label="One fact I know"
                    value={fact}
                    onChangeText={(value) => {
                      setFact(value);
                      setQuestionError("");
                    }}
                    editable={!busy && !questionBusy}
                    maxLength={300}
                    multiline
                  />
                  <Field
                    label="One possibility I am worrying about"
                    value={concern}
                    onChangeText={(value) => {
                      setConcern(value);
                      setQuestionError("");
                    }}
                    editable={!busy && !questionBusy}
                    maxLength={300}
                    multiline
                  />
                </>
              )}
              <Copy muted>
                {kind === "question"
                  ? "Your question text is sent to AI for this reflection. It is not saved in your garden."
                  : "Only your chosen category is saved. These words stay on this screen."}
              </Copy>
              <Button
                title={
                  kind === "question"
                    ? activeReflection && keptToday
                      ? "Key points ready"
                      : keptToday
                        ? "Read this open question"
                        : "Keep today’s light"
                    : keptToday
                      ? "Today’s moment is kept"
                      : "Keep today’s light"
                }
                loading={busy || questionBusy}
                disabled={
                  loading ||
                  questionBusy ||
                  (kind === "question"
                    ? !hasQuestionInput ||
                      Boolean(activeReflection && keptToday)
                    : keptToday)
                }
                onPress={() =>
                  kind === "question"
                    ? void keepOpenQuestion()
                    : void (async () => {
                        if (await moment(kind)) {
                          if (alive.current) {
                            setThought("");
                            setFact("");
                            setConcern("");
                          }
                        }
                      })()
                }
              />
            </>
          )}
          {kind === "question" && questionBusy && (
            <Loading label="Separating evidence from assumptions…" />
          )}
          {kind === "question" && !!questionError && (
            <ErrorText>{questionError}</ErrorText>
          )}
          {kind === "question" && activeReflection && (
            <View
              accessibilityLiveRegion="polite"
              style={{
                gap: 12,
                padding: 18,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.gold,
                backgroundColor: "#33273F",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 24,
                  color: colors.gold,
                }}
              >
                Scientific thinking · key points
              </Text>
              {activeReflection.points.map((point, i) => (
                <Text
                  key={i}
                  localize={false}
                  style={{ fontSize: 14, lineHeight: 24, color: colors.ink }}
                >
                  {i + 1}. {point}
                </Text>
              ))}
              <Text style={{ fontSize: 11, color: colors.muted }}>
                {t("AI-generated · {count}/200 characters", {
                  count: [
                    ...activeReflection.points
                      .map((p, i) => `${i + 1}. ${p}`)
                      .join("\n"),
                  ].length,
                })}
              </Text>
              <Copy muted>This reflection stays on this screen.</Copy>
            </View>
          )}
          {keptToday && (
            <View
              accessibilityLiveRegion="polite"
              style={{
                gap: 8,
                padding: 16,
                backgroundColor: "#3B2D46",
                borderRadius: 16,
              }}
            >
              <Text style={{ color: colors.gold, fontSize: 20 }}>
                ✦ {t("A small light for today.")}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                {t("{count} moments noticed. Come back at your own pace.", {
                  count: state.momentCount,
                })}
              </Text>
              {(!kind || kind === state.todayKind) && (
                <Copy>
                  {state.todayKind === "joy"
                    ? "A small joy is worth noticing."
                    : state.todayKind === "discovery"
                      ? "There is room for a new perspective."
                      : "Some questions can stay open for a while."}
                </Copy>
              )}
            </View>
          )}
          <ErrorText>{error}</ErrorText>
          {!!error && (
            <Button
              title="Reload garden"
              kind="ghost"
              onPress={reload}
              disabled={busy}
            />
          )}
        </Panel>
      ) : (
        <Panel>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 27,
              color: colors.ink,
            }}
          >
            Try the words here first.
          </Text>
          <Copy muted>
            You can practise without sending a message to anyone.
          </Copy>
          <ErrorText>{castError}</ErrorText>
          {!!castError && (
            <Button
              title="Try loading my step again"
              kind="ghost"
              onPress={() => setRetry((n) => n + 1)}
            />
          )}
          <Field
            label="The small step I want to try"
            value={step}
            onChangeText={(v) => {
              setStep(v);
              setPreview(false);
            }}
            multiline
            maxLength={400}
          />
          <Field
            label="What I have actually noticed"
            value={observation}
            onChangeText={(v) => {
              setObservation(v);
              setPreview(false);
            }}
            multiline
            maxLength={300}
          />
          <Field
            label="One clear thing I want to ask"
            value={request}
            onChangeText={(v) => {
              setRequest(v);
              setPreview(false);
            }}
            multiline
            maxLength={300}
          />
          <Button
            title="Build a practice sentence"
            kind="secondary"
            disabled={!observation.trim() || !request.trim()}
            onPress={() => {
              setSentence(
                t("I noticed {fact}. Could we {request}?", {
                  fact: observation.trim().replace(/[.!?。！？]+$/, ""),
                  request: request.trim().replace(/[.!?。！？]+$/, ""),
                }),
              );
              setPreview(true);
            }}
          />
          {preview && (
            <View
              style={{
                gap: 12,
                padding: 16,
                backgroundColor: "#3B2D46",
                borderRadius: 16,
              }}
            >
              <Copy>
                Read it once. Does it sound like you? Change anything you want.
              </Copy>
              <Field
                label="My practice sentence"
                value={sentence}
                onChangeText={setSentence}
                multiline
                maxLength={700}
              />
              <Copy muted>
                A starting template for practice. Your words are not saved or
                sent.
              </Copy>
              <Copy>
                One clear question can be enough. You can choose when, or
                whether, to say it.
              </Copy>
            </View>
          )}
          {cast && (
            <Button
              title="Return to my story ↗"
              kind="ghost"
              onPress={() => router.push(`/oracle/${cast.id}`)}
            />
          )}
        </Panel>
      )}
      <Button
        title="Play a little in the garden ↗"
        kind="ghost"
        onPress={() => router.push("/garden")}
      />
    </View>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useLocalSearchParams } from "expo-router";
import { LocalizedText as Text } from "./LocalizedText";
import { DigitalOracleStage, type OraclePresence } from "./DigitalOracleStage";
import { OracleReviewCard } from "./OracleReviewCard";
import { OracleShell, Panel } from "./OracleShell";
import { SettingsDisclosure } from "./SettingsDisclosure";
import { Button, Check, ErrorText, Field } from "./ui";
import { useCalmMotion } from "./OracleArt";
import { useOracleEncounter } from "@/lib/useOracleEncounter";
import { useOracleSpeech } from "@/lib/useOracleSpeech";
import { useVoiceInput } from "@/lib/voice";
import { useI18n } from "@/lib/i18n";
import { colors, fonts } from "@/lib/theme";

function EncounterIcon({
  mic = false,
  muted = false,
}: {
  mic?: boolean;
  muted?: boolean;
}) {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={true}
    >
      {mic ? (
        <>
          <Path
            d="M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0Z M5 11v1a7 7 0 0 0 14 0v-1 M12 19v3 M8 22h8"
            stroke={colors.gold}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <Path
            d="M4 9h4l5-4v14l-5-4H4Z"
            stroke={colors.gold}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {muted ? (
            <Path
              d="m17 9 5 6m0-6-5 6"
              stroke={colors.gold}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          ) : (
            <Path
              d="M17 8c3 2 3 6 0 8 M20 5c5 4 5 10 0 14"
              stroke={colors.gold}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          )}
        </>
      )}
    </Svg>
  );
}

function Encounter({ topic }: { topic: "wealth" | "love" }) {
  const session = useOracleEncounter(topic);
  const params = useLocalSearchParams<{ starter?: string }>();
  const { lang, t } = useI18n();
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current && params.starter === "curiosity") {
      seeded.current = true;
      session.setDraft(
        t("What small change could make this week feel different?"),
      );
    }
  }, [params.starter, t]);
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const reducedByDevice = useCalmMotion();
  const [lessMotion, setLessMotion] = useState(false);
  const [typing, setTyping] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const speech = useOracleSpeech(lang);
  const voiceBase = useRef("");
  const voice = useVoiceInput(lang, (text) => {
    if (session.phase !== "conversation" || session.sending) return;
    const value = [voiceBase.current, text].filter(Boolean).join(" ");
    session.setDraft(value.slice(0, session.maxLength));
  });
  const spoken = useRef("");
  useEffect(() => {
    if (!session.latest) return;
    setAnnouncing(true);
    const timer = setTimeout(() => setAnnouncing(false), 2600);
    return () => clearTimeout(timer);
  }, [session.latest]);
  useEffect(() => {
    if (!session.latest || spoken.current === session.latest.text) return;
    spoken.current = session.latest.text;
    if (speech.enabled) void speech.speak(session.latest.text);
  }, [session.latest, speech.enabled, speech.speak]);
  useEffect(() => {
    if (session.sending || session.phase === "review") {
      voice.cancel();
      setTyping(false);
    }
  }, [session.sending, session.phase, voice.cancel]);
  useEffect(() => {
    voice.cancel();
  }, [lang, voice.cancel]);
  useEffect(() => {
    if (!voice.listening) return;
    setSeconds(0);
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [voice.listening]);
  useEffect(() => {
    if (voice.listening && seconds >= 60) voice.stop();
  }, [voice.listening, seconds, voice.stop]);
  const subtitle =
    session.phase === "review"
      ? t(
          "Please review your information. You can edit it before confirming and saving.",
        )
      : (session.latest?.text ?? t(session.greeting));
  const presence: OraclePresence =
    session.sending || session.organizing
      ? "thinking"
      : speech.speaking || announcing
        ? "speaking"
        : session.phase === "review"
          ? "review"
          : voice.listening || typing
            ? "listening"
            : "idle";
  async function microphone() {
    if (voice.listening) {
      voice.stop();
      return;
    }
    if (!session.adult) {
      session.setError("Please confirm you are 18 or older.");
      return;
    }
    speech.stop();
    voiceBase.current = session.draft;
    session.setError("");
    await voice.start();
  }
  function review() {
    if (voice.listening) return;
    speech.stop();
    session.review();
  }
  if (session.safety)
    return (
      <Panel>
        <Text style={s.heading}>Let’s pause.</Text>
        <Text style={s.body}>{session.safety.message}</Text>
        {session.safety.resources.map((resource: any) => (
          <Button
            key={resource.name}
            title={resource.name + " ↗"}
            kind="secondary"
            onPress={() => void Linking.openURL(resource.url)}
          />
        ))}
        <Button
          title="Start a different question"
          onPress={() => {
            voice.cancel();
            speech.stop();
            session.reset();
          }}
        />
      </Panel>
    );
  return (
    <View style={{ gap: 18 }}>
      <View style={s.tools}>
        <Text style={s.small}>A private moment with your AI oracle guide.</Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(
              speech.enabled
                ? "Turn voice replies off"
                : "Turn voice replies on",
            )}
            onPress={() => {
              const next = !speech.enabled;
              speech.setEnabled(next);
              if (next) void speech.speak(subtitle);
              else speech.stop();
            }}
            style={s.tool}
          >
            <EncounterIcon muted={!speech.enabled} />
            <Text style={s.small}>
              {speech.enabled ? "Voice on" : "Voice off"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ checked: lessMotion }}
            onPress={() => setLessMotion((value) => !value)}
            style={s.tool}
          >
            <Text style={s.small}>
              {lessMotion ? "Motion reduced" : "Reduce motion"}
            </Text>
          </Pressable>
        </View>
      </View>
      <View
        style={{
          flexDirection:
            !compact && session.phase === "review" ? "row" : "column",
          alignItems: "stretch",
          gap: 22,
        }}
      >
        <View style={{ flex: compact ? undefined : 1, minWidth: 0 }}>
          <DigitalOracleStage
            presence={presence}
            words={
              (session.phase === "review" ? session.question : session.draft) ||
              session.turns.filter((turn) => turn.role === "user").at(-1)
                ?.text ||
              ""
            }
            subtitle={subtitle}
            compact={compact}
            reduced={lessMotion || reducedByDevice}
            microphone={voice.listening}
          />
          {session.latest?.aiGenerated === false && (
            <Text style={s.small}>Guided prompt — not an AI response.</Text>
          )}
        </View>
        {session.phase === "review" && (
          <View style={{ flex: compact ? undefined : 1, minWidth: 0 }}>
            <OracleReviewCard
              topic={topic}
              question={session.question}
              context={session.context}
              fields={session.fields}
              organizing={session.organizing}
              reviewError={session.reviewError}
              aiOrganized={session.aiOrganized}
              contextLength={session.contextLength}
              privateMode={session.privateMode}
              saving={session.saving}
              error={session.error}
              onQuestion={(text) => {
                session.setQuestion(text);
                session.setError("");
              }}
              onField={session.setReviewField}
              onRetry={session.retryOrganization}
              onPrivate={session.setPrivateMode}
              onSave={() => {
                speech.stop();
                void session.confirmAndSave();
              }}
              onBack={session.resume}
            />
          </View>
        )}
      </View>
      {session.phase === "conversation" && (
        <View style={s.composer}>
          {!session.adult && (
            <Check checked={session.adult} onChange={session.setAdult}>
              I am 18 or older and understand this is for entertainment and
              personal reflection.
            </Check>
          )}
          {!session.ready ? (
            <>
              <Field
                label={
                  session.question
                    ? "Your reply to Selene"
                    : "What would you like to explore?"
                }
                value={session.draft}
                onChangeText={(text) => {
                  session.setDraft(text);
                  session.setError("");
                }}
                onFocus={() => {
                  speech.stop();
                  setTyping(true);
                }}
                onBlur={() => setTyping(false)}
                editable={!session.sending && !voice.listening}
                multiline
                maxLength={session.maxLength}
                placeholder="Type your thoughts, or use the microphone…"
                style={{ minHeight: 80, borderRadius: 16 }}
              />
              <View style={s.controls}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t(
                      voice.listening
                        ? "Stop voice input"
                        : "Start voice input",
                    )}
                    accessibilityState={{
                      disabled: !voice.supported || session.sending,
                    }}
                    disabled={!voice.supported || session.sending}
                    onPress={() => void microphone()}
                    style={[
                      s.mic,
                      voice.listening && {
                        backgroundColor: "#62445F",
                        borderColor: colors.love,
                      },
                      !voice.supported && { opacity: 0.45 },
                    ]}
                  >
                    <EncounterIcon mic />
                    <Text style={s.small}>
                      {voice.listening ? "Stop recording" : "Speak"}
                    </Text>
                  </Pressable>
                  {voice.listening && (
                    <>
                      <Text accessibilityLiveRegion="polite" style={s.small}>
                        {seconds}s / 60s
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          voice.cancel();
                          session.setDraft(voiceBase.current);
                        }}
                      >
                        <Text style={s.small}>Cancel recording</Text>
                      </Pressable>
                    </>
                  )}
                </View>
                <Button
                  title={
                    session.error
                      ? "Try again with Selene"
                      : "Send to Selene  ↗"
                  }
                  onPress={() => {
                    speech.stop();
                    setTyping(false);
                    void session.send();
                  }}
                  loading={session.sending}
                  disabled={voice.listening || !session.draft.trim()}
                  style={{ borderRadius: 999 }}
                />
              </View>
              {!voice.supported && (
                <Text style={s.small}>
                  Voice input is unavailable here. You can still type.
                </Text>
              )}
              {voice.error && (
                <ErrorText>
                  {voice.error === "denied"
                    ? "Microphone access was denied. Allow access or continue typing."
                    : "Voice input stopped. Your text is still editable."}
                </ErrorText>
              )}
            </>
          ) : (
            <Text style={s.body}>
              We have enough context. Review your information before you cast.
            </Text>
          )}
          <ErrorText>{session.error}</ErrorText>
          <View style={s.controls}>
            <Text style={[s.small, { flex: 1, minWidth: 180 }]}>
              Your words will be shown for review before anything is saved.
            </Text>
            <Button
              title="Review my information  ↗"
              kind="secondary"
              disabled={session.sending || voice.listening}
              onPress={review}
              style={{ borderRadius: 999 }}
            />
          </View>
          <Text style={s.small}>
            Leave out names and account details. Review voice transcription
            before sending.
          </Text>
        </View>
      )}
      {speech.error && (
        <Text style={s.small}>
          Voice playback is unavailable. Your subtitles are still here.
        </Text>
      )}
      {session.turns.length > 0 && (
        <SettingsDisclosure title="CONVERSATION TRANSCRIPT">
          {session.turns.map((turn, index) => (
            <View key={index} style={{ gap: 4 }}>
              <Text style={s.small}>
                {turn.role === "user" ? "YOU" : "SELENE"}
              </Text>
              <Text localize={false} style={s.body}>
                {turn.text}
              </Text>
            </View>
          ))}
        </SettingsDisclosure>
      )}
      <Text style={s.small}>
        Your short personal reflection and two paths are free. Optional deep
        reading: $2.99 + applicable tax.
      </Text>
    </View>
  );
}
export default function OracleQuestion() {
  const params = useLocalSearchParams<{ topic?: string }>();
  const [topic, setTopic] = useState<"wealth" | "love">(
    params.topic === "love" ? "love" : "wealth",
  );
  const { width } = useWindowDimensions();
  return (
    <OracleShell>
      <View style={{ paddingTop: 26, paddingBottom: 22, gap: 12 }}>
        <Text style={{ color: colors.gold, fontSize: 10, letterSpacing: 1.8 }}>
          01 / A MOMENT WITH SELENE
        </Text>
        <Text
          accessibilityRole="header"
          style={[s.heading, { fontSize: width < 760 ? 32 : 42 }]}
        >
          What feels unresolved today?
        </Text>
      </View>
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}
      >
        {(["wealth", "love"] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            aria-checked={topic === value}
            accessibilityState={{ checked: topic === value }}
            onPress={() => setTopic(value)}
            style={[
              s.tab,
              topic === value && {
                borderColor: value === "love" ? colors.love : colors.gold,
                backgroundColor: "#302239",
              },
            ]}
          >
            <Text style={{ color: colors.ink, fontSize: 12 }}>
              {value === "love" ? "Love & Connection" : "Wealth & Career"}
            </Text>
          </Pressable>
        ))}
      </View>
      <Encounter key={topic} topic={topic} />
    </OracleShell>
  );
}
const s = StyleSheet.create({
  heading: { color: colors.ink, fontFamily: fonts.display, fontSize: 32 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 24 },
  small: { color: colors.muted, fontSize: 11, lineHeight: 19 },
  tools: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  tool: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
  },
  composer: {
    backgroundColor: "#241B31",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    padding: 20,
    gap: 10,
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  mic: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 15,
    minHeight: 44,
  },
});

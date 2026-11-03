import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { LocalizedText as Text } from "./LocalizedText";
import { OracleGuidePortrait } from "./OracleGuidePortrait";
import { useCalmMotion } from "./OracleArt";
import { Button, Check, ErrorText, Field } from "./ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { colors, fonts } from "@/lib/theme";

type Turn = { role: "user" | "assistant"; text: string; aiGenerated?: boolean };
export function OracleConversation({
  topic,
  question,
  context,
  adult,
  onQuestion,
  onContext,
  onAdult,
  onSafety,
  onBusy,
}: {
  topic: "wealth" | "love";
  question: string;
  context: string;
  adult: boolean;
  onQuestion: (text: string) => void;
  onContext: (text: string) => void;
  onAdult: (value: boolean) => void;
  onSafety: (value: any) => void;
  onBusy: (value: boolean) => void;
}) {
  const { lang } = useI18n();
  const reducedMotion = useCalmMotion();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      request.current?.abort();
      onBusy(false);
    };
  }, [onBusy]);
  const first = turns.length === 0;
  const maxLength = first
    ? 600
    : Math.min(300, Math.max(0, 1200 - context.length - (context ? 2 : 0)));
  const finished =
    ready ||
    turns.filter((turn) => turn.role === "user").length >= 4 ||
    maxLength === 0;
  const message = first ? question : reply;
  async function send() {
    if (sending || finished) return;
    if (!adult) return setError("Please confirm you are 18 or older.");
    const text = message.trim();
    if (text.length < (first ? 3 : 1))
      return setError("Write a little about what is on your mind.");
    const next: Turn[] = [...turns, { role: "user", text }];
    const nextContext = first
      ? context
      : [context, text].filter(Boolean).join("\n\n");
    if (nextContext.length > 1200)
      return setError("Your context is full. You can cast your coins now.");
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    setSending(true);
    onBusy(true);
    setError("");
    try {
      const response = await api<{
        reply: string;
        ready: boolean;
        aiGenerated: boolean;
        safety?: any;
      }>("/oracle/prepare", {
        body: {
          topic,
          language: lang,
          ageConfirmed: true,
          context: nextContext,
          turns: next.map(({ role, text }) => ({ role, text })),
        },
        signal: controller.signal,
      });
      if (!alive.current || controller.signal.aborted) return;
      if (response.safety) {
        onSafety(response.safety);
        return;
      }
      if (!first) onContext(nextContext);
      setTurns([
        ...next,
        {
          role: "assistant",
          text: response.reply,
          aiGenerated: response.aiGenerated,
        },
      ]);
      setReady(response.ready);
      setReply("");
    } catch (cause: any) {
      if (alive.current) setError(cause.message);
    } finally {
      clearTimeout(timeout);
      if (alive.current) {
        setSending(false);
        onBusy(false);
      }
    }
  }
  return (
    <View style={s.card}>
      <View style={s.header}>
        <OracleGuidePortrait size={60} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.name}>Selene</Text>
          <Text style={s.caption}>YOUR AI ORACLE GUIDE</Text>
        </View>
        {!first && (
          <Pressable
            accessibilityRole="button"
            disabled={sending}
            onPress={() => {
              setTurns([]);
              setReady(false);
              setError("");
              setReply("");
            }}
            style={{ paddingVertical: 10 }}
          >
            <Text style={s.edit}>Edit question</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: 330 }}
        contentContainerStyle={{ gap: 14, padding: 20 }}
        onContentSizeChange={() =>
          scroll.current?.scrollToEnd({ animated: !reducedMotion })
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.guideBubble}>
          <Text style={s.message}>
            {topic === "love"
              ? "Welcome. I’m Selene. What would you like to understand about your relationships or your heart today?"
              : "Welcome. I’m Selene. What is on your mind about your work, ambitions, or relationship with money?"}
          </Text>
        </View>
        {turns.map((turn, index) => (
          <View
            key={index}
            accessibilityLiveRegion={
              turn.role === "assistant" ? "polite" : "none"
            }
            style={[
              s.bubble,
              turn.role === "user" ? s.userBubble : s.guideBubble,
            ]}
          >
            <Text style={s.speaker}>
              {turn.role === "user" ? "YOU" : "SELENE"}
            </Text>
            <Text localize={false} style={s.message}>
              {turn.text}
            </Text>
            {turn.role === "assistant" && turn.aiGenerated === false && (
              <Text style={s.note}>Guided prompt — not an AI response.</Text>
            )}
          </View>
        ))}
        {sending && (
          <View
            accessibilityLiveRegion="polite"
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <ActivityIndicator size="small" color={colors.love} />
            <Text style={s.note}>Selene is reflecting on your words…</Text>
          </View>
        )}
      </ScrollView>
      <View style={s.composer}>
        {finished ? (
          <View style={{ gap: 8 }}>
            <Text style={s.ready}>Your intention is taking shape.</Text>
            <Text style={s.note}>
              When you feel ready, cast your coins below. Your own words will
              accompany the reading.
            </Text>
          </View>
        ) : (
          <>
            <Field
              label={
                first
                  ? "What would you like to explore?"
                  : "Your reply to Selene"
              }
              placeholder={
                first
                  ? topic === "love"
                    ? "What would help me understand this connection?"
                    : "What should I consider about my next career move?"
                  : "Share a little more, in your own words…"
              }
              value={message}
              onChangeText={(value) => {
                if (first) onQuestion(value);
                else setReply(value);
                setError("");
              }}
              editable={!sending}
              multiline
              maxLength={maxLength}
              style={{
                minHeight: first ? 100 : 80,
                padding: 15,
                lineHeight: 23,
                borderRadius: 14,
              }}
            />
            <Text style={[s.note, { textAlign: "right", marginTop: -8 }]}>
              {message.length}/{maxLength}
            </Text>
          </>
        )}
        {!adult && (
          <Check checked={adult} onChange={onAdult}>
            I am 18 or older and understand this is for entertainment and
            personal reflection.
          </Check>
        )}
        <ErrorText>{error}</ErrorText>
        {!finished && (
          <Button
            title={error ? "Try again with Selene" : "Talk with Selene  ↗"}
            onPress={() => void send()}
            loading={sending}
            style={{ borderRadius: 999 }}
          />
        )}
        <Text style={s.note}>
          You can cast now, or talk it through first. Leave out names and
          account details.
        </Text>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#6C506E",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#251B31",
  },
  header: {
    padding: 20,
    gap: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#2D2038",
  },
  name: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 30,
  },
  caption: {
    color: colors.gold,
    fontSize: 9,
    lineHeight: 16,
    letterSpacing: 1.4,
  },
  edit: { color: colors.gold, fontSize: 11 },
  bubble: { gap: 7, padding: 15, borderRadius: 16, maxWidth: "94%" },
  guideBubble: {
    backgroundColor: "#35273F",
    padding: 15,
    borderRadius: 16,
    alignSelf: "flex-start",
    maxWidth: "94%",
    gap: 7,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#4A3451",
    borderBottomRightRadius: 4,
  },
  speaker: { color: colors.gold, fontSize: 9, letterSpacing: 1.1 },
  message: { color: colors.ink, fontSize: 14, lineHeight: 24 },
  composer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.line,
    gap: 8,
  },
  note: { color: colors.muted, fontSize: 11, lineHeight: 19 },
  ready: { color: colors.gold, fontFamily: fonts.display, fontSize: 23 },
});

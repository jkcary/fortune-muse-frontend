import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg from "react-native-svg";
import { LocalizedText as Text } from "./LocalizedText";
import { OracleSeal } from "./OracleSeal";
import { OracleCardPreview } from "./OracleCardPreview";
import { useCalmMotion } from "./OracleArt";
import { Copy, Display, Eyebrow, Panel } from "./OracleShell";
import { Button, Check, ErrorText, Field } from "./ui";
import { useI18n } from "@/lib/i18n";
import { useOracleSpeech } from "@/lib/useOracleSpeech";
import { oracleCardSvg, shareOracle } from "@/lib/shareOracle";
import type { OracleCast } from "@/lib/oracle";
import { colors, fonts } from "@/lib/theme";

type Props = {
  cast: OracleCast;
  note: string;
  onNote: (text: string) => void;
  signedIn: boolean;
  waiting: boolean;
  onSave: () => Promise<void>;
  onSignIn: () => Promise<void>;
};

export function OracleClosingRitual(props: Props) {
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const reduced = useCalmMotion();
  return (
    <>
      <Panel>
        <Image
          source={require("@/assets/images/selene-speaking.png")}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
        />
        <Eyebrow>THE RETURNING LIGHT</Eyebrow>
        <Display size={30}>A moment to make it yours.</Display>
        <Copy muted>
          Let your six lines settle into a keepsake. Take what resonates, and
          leave with a little space for yourself.
        </Copy>
        <Button
          title={
            completed ? "Revisit your closing ritual" : "Seal This Reading"
          }
          disabled={props.waiting}
          onPress={() => setOpen(true)}
          style={{ borderRadius: 999 }}
        />
        {props.waiting && (
          <Copy muted>
            Your interpretation is still being prepared. You can close the
            reading when it is ready.
          </Copy>
        )}
      </Panel>
      <Modal
        visible={open}
        transparent={false}
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        {open && (
          <ClosingExperience
            {...props}
            reducedByDevice={reduced}
            onClose={() => {
              setOpen(false);
              setCompleted(true);
            }}
          />
        )}
      </Modal>
    </>
  );
}

function ClosingExperience({
  cast,
  note,
  onNote,
  signedIn,
  onSave,
  onSignIn,
  reducedByDevice,
  onClose,
}: Props & { reducedByDevice: boolean; onClose: () => void }) {
  const { lang, t } = useI18n();
  const { width, height } = useWindowDimensions();
  const compact = width < 760;
  const [phase, setPhase] = useState<"ritual" | "keepsake">("ritual");
  const [lessMotion, setLessMotion] = useState(false);
  const [thought, setThought] = useState(false);
  const [personalQuote, setPersonalQuote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const progress = useRef(new Animated.Value(reducedByDevice ? 1 : 0)).current;
  const nod = useRef(new Animated.Value(0)).current;
  const imageRef = useRef<Svg | null>(null);
  const alive = useRef(true);
  const operation = useRef(false);
  const speech = useOracleSpeech(lang);
  const reduced = reducedByDevice || lessMotion;
  const farewell = t("Take a moment. Your next step belongs to you.");
  const h = cast.basis!.primary;
  const complete = useCallback(() => {
    progress.stopAnimation();
    progress.setValue(1);
    setPhase("keepsake");
  }, [progress]);
  useEffect(() => {
    if (phase !== "ritual") return;
    if (reduced) {
      complete();
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 7000,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start(({ finished }) => {
      if (finished) complete();
    });
    return () => animation.stop();
  }, [phase, reduced, complete, progress]);
  useEffect(() => {
    if (phase !== "keepsake" || reduced) {
      nod.setValue(0);
      return;
    }
    const animation = Animated.sequence([
      Animated.timing(nod, {
        toValue: 1,
        duration: 750,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(nod, {
        toValue: 0,
        duration: 950,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: Platform.OS !== "web",
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [phase, reduced, nod]);
  useEffect(() => {
    if (phase === "keepsake" && speech.enabled) void speech.speak(farewell);
    else speech.stop();
  }, [phase, speech.enabled, farewell, speech.speak, speech.stop]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const dismiss = () => {
    speech.stop();
    onClose();
  };
  const options = { closing: true, includePersonalQuote: personalQuote };
  const svg = oracleCardSvg(cast, options);
  const nativePng = () =>
    new Promise<string>((resolve, reject) => {
      if (!imageRef.current)
        return reject(
          new Error("Your card is not ready yet. Please try again."),
        );
      const timer = setTimeout(
        () => reject(new Error("Image export timed out. Please try again.")),
        8000,
      );
      imageRef.current.toDataURL(
        (data) => {
          clearTimeout(timer);
          resolve(data);
        },
        { width: 1080, height: 1920 },
      );
    });
  async function act(fn: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (cause: any) {
      if (alive.current) setError(cause.message);
    } finally {
      operation.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.toolbar}>
        <Text style={styles.brand}>ORACLE ONE</Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "flex-end",
            flex: 1,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(
              speech.enabled
                ? "Turn voice replies off"
                : "Turn voice replies on",
            )}
            style={styles.control}
            onPress={() => speech.setEnabled(!speech.enabled)}
          >
            <Text style={styles.small}>
              {speech.enabled ? "Voice on" : "Voice off"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ checked: reduced }}
            style={styles.control}
            onPress={() => setLessMotion(!lessMotion)}
          >
            <Text style={styles.small}>
              {reduced ? "Motion reduced" : "Reduce motion"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Close ritual")}
            style={styles.control}
            onPress={dismiss}
          >
            <Text style={styles.small}>Close ritual</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: compact ? 22 : 36,
          paddingBottom: 60,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {phase === "ritual" ? (
          <View
            style={{
              flex: 1,
              minHeight: Math.max(450, height - 180),
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <Eyebrow>THE RETURNING LIGHT</Eyebrow>
            <Text
              accessibilityRole="header"
              style={[
                styles.title,
                { fontSize: compact ? 33 : 50, textAlign: "center" },
              ]}
            >
              Let this moment take shape.
            </Text>
            <OracleSeal
              bits={h.bits}
              love={cast.topic === "love"}
              size={Math.min(width - 52, 390, height * 0.43)}
              progress={progress}
            />
            <Text style={[styles.body, { textAlign: "center", maxWidth: 460 }]}>
              Six lines. One moment. Yours to carry.
            </Text>
            <Text accessibilityLiveRegion="polite" style={styles.small}>
              Your hexagram is settling into its seal.
            </Text>
            <Button
              title="Skip to my keepsake"
              kind="ghost"
              onPress={complete}
            />
          </View>
        ) : (
          <View
            style={{
              maxWidth: 1050,
              width: "100%",
              alignSelf: "center",
              gap: 28,
            }}
          >
            <View style={{ alignItems: "center", gap: 14 }}>
              <Eyebrow>YOUR READING IS COMPLETE</Eyebrow>
              <Text
                accessibilityRole="header"
                accessibilityLiveRegion="polite"
                style={[
                  styles.title,
                  { fontSize: compact ? 35 : 48, textAlign: "center" },
                ]}
              >
                The next step is yours.
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  maxWidth: 570,
                }}
              >
                <Animated.View
                  style={{
                    width: 82,
                    height: 98,
                    borderRadius: 42,
                    overflow: "hidden",
                    backgroundColor: "#382441",
                    borderWidth: 1,
                    borderColor: colors.line,
                    transform: [
                      {
                        translateY: nod.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 4],
                        }),
                      },
                      {
                        rotate: nod.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "2deg"],
                        }),
                      },
                    ],
                  }}
                >
                  <Image
                    source={require("@/assets/images/selene-speaking.png")}
                    accessibilityLabel={t(
                      "Selene, your fictional AI oracle guide",
                    )}
                    resizeMode="cover"
                    style={{ width: 82, height: 112 }}
                  />
                </Animated.View>
                <View style={{ flex: 1, gap: 7 }}>
                  <Text style={{ color: colors.gold, fontSize: 12 }}>
                    Selene
                  </Text>
                  <Text localize={false} style={styles.body}>
                    {farewell}
                  </Text>
                </View>
              </View>
              {speech.error && (
                <Text style={styles.small}>
                  Voice playback is unavailable. Your subtitles are still here.
                </Text>
              )}
            </View>
            <View
              style={{
                flexDirection: compact ? "column" : "row",
                gap: 30,
                alignItems: compact ? "center" : "flex-start",
              }}
            >
              <View
                style={{
                  width: compact ? Math.min(width - 48, 330) : 310,
                  gap: 12,
                }}
              >
                <View
                  accessibilityRole="image"
                  accessibilityLabel={t("Your closing card preview")}
                  style={{
                    borderRadius: 24,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: colors.line,
                    aspectRatio: 9 / 16,
                  }}
                >
                  <OracleCardPreview xml={svg} />
                </View>
                <Text style={[styles.small, { textAlign: "center" }]}>
                  A keepsake of this reading, in your own time.
                </Text>
              </View>
              <View
                style={{
                  flex: compact ? undefined : 1,
                  width: compact ? "100%" : undefined,
                  minWidth: 0,
                  gap: 18,
                }}
              >
                <Text style={[styles.title, { fontSize: 28 }]}>
                  Your Oracle Card
                </Text>
                <Text style={styles.body}>
                  Keep what resonates. Leave the rest.
                </Text>
                {cast.premium && (
                  <View style={{ gap: 10 }}>
                    <Check
                      checked={personalQuote}
                      onChange={(value) => {
                        if (!busy) setPersonalQuote(value);
                      }}
                    >
                      Include the personal reflection prompt from my reading.
                    </Check>
                    <Text style={styles.small}>
                      This may include details about your situation. Check the
                      preview before sharing.
                    </Text>
                  </View>
                )}
                <Button
                  title={
                    Platform.OS === "web"
                      ? "Download my oracle card"
                      : "Share my oracle card"
                  }
                  loading={busy}
                  onPress={() =>
                    void act(() => shareOracle(cast, nativePng, options))
                  }
                  style={{ borderRadius: 999 }}
                />
                <Text style={styles.small}>
                  Your question, background and journal notes are excluded. Only
                  the words shown in this preview are shared.
                </Text>
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.line,
                    marginVertical: 6,
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: thought }}
                  aria-expanded={thought}
                  style={styles.thought}
                  onPress={() => setThought(!thought)}
                >
                  <Text style={{ color: colors.gold, fontSize: 13 }}>
                    Keep a thought
                  </Text>
                  <Text style={{ color: colors.gold }}>
                    {thought ? "−" : "＋"}
                  </Text>
                </Pressable>
                {thought && (
                  <View style={{ gap: 10 }}>
                    {signedIn || cast.privateMode ? (
                      <>
                        <Field
                          label="What would you like to carry with you?"
                          placeholder="A thought, a feeling, or one small next step…"
                          value={note}
                          onChangeText={(value) => {
                            onNote(value);
                            setSaved(false);
                          }}
                          editable={!busy}
                          multiline
                          maxLength={2000}
                        />
                        {cast.privateMode ? (
                          <Text style={styles.small}>
                            For this visit only. Temporary readings stay out of
                            your journal.
                          </Text>
                        ) : (
                          <Button
                            title="Save reflection"
                            kind="secondary"
                            disabled={busy}
                            onPress={() =>
                              void act(async () => {
                                await onSave();
                                if (alive.current) setSaved(true);
                              })
                            }
                          />
                        )}
                        {saved && (
                          <Text
                            accessibilityLiveRegion="polite"
                            style={{ color: colors.green, fontSize: 12 }}
                          >
                            Your reflection is saved.
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={styles.body}>
                          Sign in to keep this reading and a thought in your
                          journal.
                        </Text>
                        <Button
                          title="Sign in to keep a thought"
                          kind="secondary"
                          disabled={busy}
                          onPress={() =>
                            void act(async () => {
                              await onSignIn();
                              dismiss();
                            })
                          }
                        />
                      </>
                    )}
                  </View>
                )}
                <ErrorText>{error}</ErrorText>
                <Button
                  title="Return to your day"
                  onPress={() => {
                    dismiss();
                    router.push("/home");
                  }}
                  style={{ borderRadius: 999, marginTop: 8 }}
                />
                <Button
                  title="Back to my reading"
                  kind="ghost"
                  onPress={dismiss}
                />
                {signedIn && !cast.privateMode && (
                  <Button
                    title="View my journal"
                    kind="ghost"
                    onPress={() => {
                      dismiss();
                      router.push("/journal");
                    }}
                  />
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      {Platform.OS !== "web" && (
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={{ position: "absolute", left: -3000, width: 270, height: 480 }}
        >
          <OracleCardPreview
            xml={svg}
            svgRef={imageRef}
            width={270}
            height={480}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#160F22" },
  toolbar: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  brand: { color: colors.gold, fontSize: 11, letterSpacing: 2 },
  control: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
  },
  title: { fontFamily: fonts.display, color: colors.ink },
  body: { fontSize: 15, lineHeight: 25, color: colors.ink },
  small: { fontSize: 11, lineHeight: 19, color: colors.muted },
  thought: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 52,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
});

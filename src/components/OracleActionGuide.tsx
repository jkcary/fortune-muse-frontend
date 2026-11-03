import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "./LocalizedText";
import { Copy } from "./OracleShell";
import { Button, ErrorText } from "./ui";
import { oracle, type OracleCast } from "@/lib/oracle";
import { colors } from "@/lib/theme";

export function OracleActionGuide({
  cast,
  onUpdated,
}: {
  cast: OracleCast;
  onUpdated: (cast: OracleCast) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      request.current?.abort();
    };
  }, []);
  const current = cast.premium?.actionGuideVersion === "crystal-1";
  async function refine() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 70000);
    setBusy(true);
    setError("");
    try {
      const result = await oracle<{ cast: OracleCast }>(
        `/oracle/casts/${cast.id}/action-guide`,
        { body: {}, signal: controller.signal },
      );
      if (alive.current && !controller.signal.aborted) onUpdated(result.cast);
    } catch {
      if (alive.current)
        setError(
          "Your action guide could not be refined right now. Your original reading is safe. Please try again.",
        );
    } finally {
      clearTimeout(timer);
      request.current = null;
      if (alive.current) setBusy(false);
    }
  }
  const parts = current
    ? cast
        .premium!.action.split(/\n\s*(?=[1-4][.)]\s)/)
        .map((part) => part.trim())
        .filter(Boolean)
    : [];
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: colors.gold, fontSize: 11, letterSpacing: 1.3 }}>
        YOUR NEXT CLEAR STEP
      </Text>
      {current ? (
        <>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 21 }}>
            One small experiment. A clear way to check it.
          </Text>
          <View style={{ gap: 12 }}>
            {parts.map((part, index) => {
              const section = part.match(
                /^([1-4][.)]\s[^:\n：]{1,48})[:：\n]\s*([\s\S]*)$/,
              );
              return (
                <View
                  key={index}
                  style={{
                    borderLeftWidth: 2,
                    borderColor: index === 3 ? colors.love : colors.line,
                    paddingLeft: 15,
                    gap: 7,
                  }}
                >
                  {section ? (
                    <>
                      <Text
                        localize={false}
                        style={{
                          color: colors.gold,
                          fontSize: 13,
                          fontWeight: "600",
                          lineHeight: 22,
                        }}
                      >
                        {section[1]}
                      </Text>
                      <Copy localize={false}>{section[2].trim()}</Copy>
                    </>
                  ) : (
                    <Copy localize={false}>{part}</Copy>
                  )}
                </View>
              );
            })}
          </View>
          {cast.premium?.actionGuideAiGenerated === false && (
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              Editorial action guide · AI is not connected.
            </Text>
          )}
        </>
      ) : (
        <>
          <Copy localize={false}>{cast.premium?.action}</Copy>
          <Button
            title="Make this actionable"
            kind="secondary"
            loading={busy}
            onPress={() => void refine()}
          />
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.muted, fontSize: 12, lineHeight: 21 }}
          >
            {busy
              ? "Turning this reading into clear steps…"
              : "Clarify the facts, choose one small action, and know what to check. This updates only the action guide."}
          </Text>
        </>
      )}
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

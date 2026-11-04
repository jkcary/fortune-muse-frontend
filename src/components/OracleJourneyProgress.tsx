import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { LocalizedText as Text } from "./LocalizedText";
import { Button } from "./ui";
import { Copy } from "./OracleShell";
import { useT, currentLang } from "@/lib/i18n";
import { chapterSteps } from "@/lib/storyReturn";
import type { OracleCast } from "@/lib/oracle-contract";
import { colors, fonts } from "@/lib/theme";

export function OracleJourneyProgress({
  cast,
  compact = false,
}: {
  cast: OracleCast;
  compact?: boolean;
}) {
  const [show, setShow] = useState(false);
  const t = useT();
  const steps = chapterSteps(cast),
    finished = steps.every(Boolean);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {["See a possibility", "Choose a small step", "Look back"].map(
          (label, i) => (
            <View
              key={label}
              style={{
                flex: 1,
                gap: 6,
                borderTopWidth: 2,
                borderColor: steps[i] ? colors.gold : colors.line,
                paddingTop: 8,
              }}
            >
              <Text
                style={{
                  fontSize: compact ? 10 : 12,
                  lineHeight: 18,
                  color: steps[i] ? colors.gold : colors.muted,
                }}
              >
                {steps[i] ? "✦" : "○"} {t(label)}
              </Text>
            </View>
          ),
        )}
      </View>
      {!compact && (
        <Copy muted>
          {finished
            ? "You have explored, chosen and looked back. A chapter worth keeping."
            : "Three moments, at your pace. Waiting or changing direction counts too."}
        </Copy>
      )}
      {finished && (
        <Button
          title={show ? "Close chapter keepsake" : "Open chapter keepsake"}
          kind="ghost"
          onPress={() => setShow((v) => !v)}
        />
      )}
      {show && (
        <View
          style={{
            padding: 22,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.gold,
            backgroundColor: "#33253F",
            gap: 12,
          }}
        >
          <Text style={{ color: colors.gold, fontSize: 11, letterSpacing: 2 }}>
            A CHAPTER OF YOUR OWN
          </Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 30,
              color: colors.ink,
            }}
            localize={false}
          >
            {cast.basis?.primary.chinese} ·{" "}
            {t(
              cast.topic === "love" ? "Love & connection" : "Work & resources",
            )}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }} localize={false}>
            {new Date(cast.createdAt).toLocaleDateString(currentLang())}
          </Text>
          <Copy>
            One possibility seen. One step chosen. One moment of looking back.
          </Copy>
          <Copy muted>
            This keepsake marks your exploration. Your story can keep growing.
          </Copy>
          <Button
            title="Visit my star garden ↗"
            kind="secondary"
            onPress={() => router.push("/garden")}
          />
        </View>
      )}
    </View>
  );
}

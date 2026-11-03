import { LocalizedText as Text } from "@/components/LocalizedText";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { OracleArt } from "./PearlOracleArt";
import { Copy, Display, Eyebrow, OracleShell } from "./OracleShell";
import { Button } from "./ui";
import { latestCast, pendingCast } from "@/lib/oracle";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";

export default function Explore() {
  const t = useT();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const { me } = useSession();
  const [recent, setRecent] = useState<string | null>(null);
  useEffect(() => {
    void latestCast.get().then(setRecent);
    if (me)
      void pendingCast.get().then((id) => {
        if (id) {
          void pendingCast.set(null);
          router.replace("/oracle/" + id);
        }
      });
  }, [me]);
  return (
    <OracleShell>
      <View
        style={[
          s.hero,
          {
            flexDirection: mobile ? "column" : "row",
            paddingTop: mobile ? 34 : 44,
            paddingBottom: mobile ? 28 : 42,
          },
        ]}
      >
        <View style={{ flex: 1, zIndex: 1, paddingTop: mobile ? 0 : 20 }}>
          <Eyebrow>A LITTLE MYSTERY. A LITTLE MORE YOU.</Eyebrow>
          <Display size={mobile ? 48 : 76}>
            Your universe.{"\n"}Your{" "}
            <Text style={{ fontStyle: "italic", color: "#E2C4EE" }}>
              becoming.
            </Text>
          </Display>
          <Text style={[s.intro, { maxWidth: 420, marginTop: 26 }]}>
            A cosmic moment for love, ambition, and everything unfolding.
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 14,
              marginTop: 30,
            }}
          >
            <Button
              title="Begin your reading  ↗"
              onPress={() => router.push("/ask")}
              style={{ borderRadius: 2099, paddingHorizontal: 26 }}
            />
            <Button
              title="Explore the method"
              kind="ghost"
              onPress={() => router.push("/method")}
              style={{ paddingHorizontal: 10 }}
            />
          </View>
          <Text style={s.micro}>FREE TO BEGIN / NO ACCOUNT NEEDED</Text>
        </View>
        <View
          style={{
            width: mobile ? "100%" : 450,
            alignItems: "center",
            justifyContent: "center",
            marginTop: mobile ? 10 : -20,
            marginBottom: mobile ? -16 : 0,
          }}
        >
          <OracleArt size={mobile ? Math.min(width - 44, 360) : 480} />
          <Text style={[s.orbitLabel, { bottom: mobile ? 8 : 26 }]}>
            THREE COINS. SIX LINES. ONE MOMENT.
          </Text>
        </View>
      </View>
      <View style={s.rule}>
        <Text style={s.strip}>ROOTED IN THE I CHING</Text>
        <Text style={s.strip}>64 HEXAGRAMS</Text>
        <Text style={s.strip}>YOUR QUESTION. YOUR PERSPECTIVE.</Text>
      </View>
      <View
        style={{
          paddingTop: 44,
          paddingBottom: 24,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
        }}
      >
        <View>
          <Eyebrow>CHOOSE YOUR PATH</Eyebrow>
          <Text style={s.sectionTitle}>What’s on your mind?</Text>
        </View>
        {!mobile && (
          <Text style={s.aside}>A little mystery. A clearer next step.</Text>
        )}
      </View>
      <View style={{ flexDirection: mobile ? "column" : "row", gap: 20 }}>
        {(
          [
            {
              topic: "wealth",
              title: "Wealth & Career",
              subtitle: "Make room for possibility.",
              description:
                "Explore work, ambition, resources, and your next meaningful move.",
              label: "Explore wealth",
              number: "01",
            },
            {
              topic: "love",
              title: "Love & Connection",
              subtitle: "Understand what connects you.",
              description:
                "Reflect on relationships, communication, and matters of the heart.",
              label: "Explore love",
              number: "02",
            },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.topic}
            accessibilityRole="link"
            accessibilityLabel={t(item.title)}
            onPress={() =>
              router.push({ pathname: "/ask", params: { topic: item.topic } })
            }
            style={({ pressed }) => [
              s.portal,
              {
                minHeight: mobile ? 330 : 370,
                flex: mobile ? undefined : 1,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View
              style={{
                position: "absolute",
                right: mobile ? -22 : -10,
                top: mobile ? -24 : -8,
                opacity: 0.72,
              }}
            >
              <OracleArt
                love={item.topic === "love"}
                size={mobile ? 255 : 290}
                animate={false}
              />
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                style={[
                  s.pathLabel,
                  item.topic === "love" && { color: colors.love },
                ]}
              >
                {item.topic === "love"
                  ? "THE CONNECTION PORTAL"
                  : "THE ABUNDANCE PORTAL"}
              </Text>
              <Text style={s.pathNumber}>{item.number}</Text>
            </View>
            <View style={{ flex: 1, minHeight: 100 }} />
            <Text style={s.portalTitle}>{item.title}</Text>
            <Text
              style={[
                s.portalSub,
                item.topic === "love" && { color: colors.love },
              ]}
            >
              {item.subtitle}
            </Text>
            <Text style={s.portalDescription}>{item.description}</Text>
            <Text
              style={[
                s.portalLink,
                item.topic === "love" && { color: colors.love },
              ]}
            >
              {item.label} ↗
            </Text>
          </Pressable>
        ))}
      </View>
      {recent && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/oracle/" + recent)}
          style={s.resume}
        >
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            Your last question is waiting.
          </Text>
          <Text style={{ color: colors.gold, fontSize: 12 }}>
            Continue your reading ↗
          </Text>
        </Pressable>
      )}
      <View style={{ paddingTop: 64, paddingBottom: 20 }}>
        <Eyebrow>A MOMENT TO PAUSE</Eyebrow>
        <View
          style={{
            flexDirection: mobile ? "column" : "row",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <Text
            style={[
              s.sectionTitle,
              { maxWidth: 340, fontSize: mobile ? 32 : 38 },
            ]}
          >
            An old ritual.{"\n"}A fresh way to see.
          </Text>
          <Text style={[s.intro, { maxWidth: 420 }]}>
            You bring the question. The coins offer a symbolic starting point.
            Discover an interpretation that leaves room for your own judgment.
          </Text>
        </View>
        <View
          style={{
            flexDirection: mobile ? "column" : "row",
            gap: 30,
            marginTop: 32,
          }}
        >
          {[
            [
              "01",
              "Ask a question",
              "Choose love or wealth. Share as much or as little context as you like.",
            ],
            [
              "02",
              "Cast your coins",
              "Build your hexagram, one line at a time. See exactly how it is formed.",
            ],
            [
              "03",
              "Find your perspective",
              "Read the symbolism. Explore a personal interpretation. Take one thoughtful step.",
            ],
          ].map(([n, title, copy]) => (
            <View
              key={n}
              style={{
                flex: 1,
                borderTopWidth: 1,
                borderColor: colors.line,
                paddingTop: 22,
                gap: 12,
              }}
            >
              <Text style={s.pathLabel}>{n} /</Text>
              <Text
                style={{
                  color: colors.ink,
                  fontSize: 17,
                  fontFamily: fonts.display,
                }}
              >
                {title}
              </Text>
              <Copy muted>{copy}</Copy>
            </View>
          ))}
        </View>
      </View>
      <View style={s.closing}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: mobile ? 25 : 34,
            color: colors.ink,
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          Discover your patterns. Explore your possibilities.
        </Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/sample")}
        >
          <Text style={{ color: colors.gold, fontSize: 12, marginTop: 20 }}>
            See a sample reading ↗
          </Text>
        </Pressable>
      </View>
    </OracleShell>
  );
}
const s = StyleSheet.create({
  hero: { alignItems: "center" },
  intro: { color: colors.muted, fontSize: 15, lineHeight: 27 },
  micro: { color: "#C6B4D0", fontSize: 10, letterSpacing: 1.4, marginTop: 12 },
  orbitLabel: {
    position: "absolute",
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 2,
  },
  rule: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingVertical: 19,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
  strip: { color: "#C6B4D0", fontSize: 10, letterSpacing: 1.9 },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: "400",
    letterSpacing: -0.5,
  },
  aside: { color: colors.muted, fontSize: 12, paddingBottom: 5 },
  portal: {
    backgroundColor: "#261B32",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 26,
    overflow: "hidden",
  },
  pathLabel: { fontSize: 10, letterSpacing: 2, color: colors.gold },
  pathNumber: { fontSize: 10, color: "#747B88" },
  portalTitle: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  portalSub: { fontSize: 12, color: colors.gold, marginTop: 10 },
  portalDescription: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 23,
    maxWidth: 300,
    marginTop: 10,
  },
  portalLink: {
    color: colors.gold,
    fontSize: 11,
    marginTop: 26,
    letterSpacing: 0.3,
  },
  resume: {
    paddingVertical: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  closing: { alignItems: "center", paddingTop: 58, paddingBottom: 14 },
});

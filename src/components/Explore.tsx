import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { LocalizedText as Text } from "./LocalizedText";
import { OracleArt } from "./PearlOracleArt";
import { Copy, Display, Eyebrow, OracleShell } from "./OracleShell";
import { OracleGuidePortrait } from "./OracleGuidePortrait";
import { OracleStorySky } from "./OracleStorySky";
import { OracleReturnHome } from "./OracleReturnHome";
import { GardenInvitation } from "./GardenInvitation";
import { OracleGlowButton } from "./OracleGlowButton";
import { isKeptStory, isSavedReading, mergeStory } from "@/lib/storyReturn";
import type { OracleReturnPreferences } from "@/lib/oracle-contract";
import { Button, ErrorText } from "./ui";
import { latestCast, oracle, pendingCast, type OracleCast } from "@/lib/oracle";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

export default function Explore() {
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const { me } = useSession();
  const [recent, setRecent] = useState<OracleCast | null>(null);
  const [casts, setCasts] = useState<OracleCast[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<{
    id: string;
    chapter: string;
  } | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setCasts([]);
      setOwnerId(null);
      setRecent(null);
      setCurrentId(null);
      setHighlight(null);
      setError("");
      void (async () => {
        if (me) {
          const pending = await pendingCast.get();
          if (!active) return;
          if (pending) {
            await pendingCast.set(null);
            if (active) router.replace(`/oracle/${pending}`);
            return;
          }
          try {
            const result = await oracle<{
              casts: OracleCast[];
              returnPreferences?: OracleReturnPreferences;
            }>("/oracle/journal");
            if (active) {
              setCasts(result.casts);
              setOwnerId(me.id);
              setCurrentId(result.returnPreferences?.currentCastId ?? null);
            }
          } catch {
            if (active)
              setError(
                "Your stories could not load. Try again when you’re ready.",
              );
          }
        } else {
          const id = await latestCast.get();
          if (!id || !active) return;
          try {
            const result = await oracle<{ cast: OracleCast }>(
              `/oracle/casts/${id}`,
            );
            if (active && !result.cast.privateMode) setRecent(result.cast);
          } catch {
            /* Expired guest stories are not return invitations. */
          }
        }
      })();
      return () => {
        active = false;
      };
    }, [me?.id, reload]),
  );
  const visibleCasts = ownerId === me?.id ? casts : [];
  const hasStory = visibleCasts.some((c) => isSavedReading(c));
  const hasConstellation = visibleCasts.some((c) => isKeptStory(c));
  function updateStory(next: OracleCast) {
    setCasts((previous) =>
      previous.map((c) => (c.id === next.id ? mergeStory(c, next) : c)),
    );
    const chapter = next.journey?.updates.at(-1)?.id;
    if (chapter) setHighlight({ id: next.id, chapter });
  }
  return (
    <OracleShell>
      {me && hasStory && (
        <>
          <View
            style={{
              flexDirection: width >= 900 ? "row" : "column",
              alignItems: "flex-start",
              gap: 12,
              marginTop: 20,
            }}
          >
            <View
              style={
                width >= 900 && hasConstellation
                  ? { flex: 1, minWidth: 0 }
                  : { width: "100%" }
              }
            >
              <OracleReturnHome
                key={me.id}
                casts={visibleCasts}
                currentId={currentId}
                onPreference={setCurrentId}
                onUpdated={updateStory}
              />
            </View>
            {hasConstellation && (
              <View
                style={
                  width >= 900 ? { flex: 1, minWidth: 0 } : { width: "100%" }
                }
              >
                <OracleStorySky
                  compact
                  casts={visibleCasts}
                  highlightedId={highlight?.id}
                  highlightKey={highlight?.chapter}
                />
              </View>
            )}
          </View>
          <View style={{ gap: 10, paddingVertical: 18 }}>
            <Eyebrow>A NEW POSSIBILITY</Eyebrow>
            <Copy muted>Have something else on your mind?</Copy>
            <OracleGlowButton
              title="Explore a new question"
              onPress={() => router.push("/ask")}
            />
          </View>
        </>
      )}
      {!!error && (
        <View style={{ paddingTop: 20 }}>
          <ErrorText>{error}</ErrorText>
          <Button
            title="Try loading my stories again"
            kind="ghost"
            onPress={() => setReload((n) => n + 1)}
          />
        </View>
      )}
      {!hasStory && (
        <View
          style={[
            s.hero,
            {
              flexDirection: mobile ? "column" : "row",
              paddingTop: mobile ? 30 : 50,
            },
          ]}
        >
          <View style={{ flex: 1, zIndex: 1, gap: 18 }}>
            <Eyebrow>A SMALL RITUAL. A NEW POSSIBILITY.</Eyebrow>
            <Display size={mobile ? 47 : 72}>
              Which way{"\n"}
              <Text style={{ fontStyle: "italic", color: "#E2C4EE" }}>
                feels like you?
              </Text>
            </Display>
            <Copy muted>
              Bring a choice, a feeling, or a little curiosity. Find a fresh
              perspective, explore two paths, and take one small step.
            </Copy>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Button
                title="Meet my possibilities ↗"
                onPress={() => router.push("/ask")}
                style={{ borderRadius: 999, paddingHorizontal: 25 }}
              />
              <Text style={s.micro}>FREE TO EXPLORE · NO ACCOUNT NEEDED</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingTop: 8,
              }}
            >
              <OracleGuidePortrait size={42} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: colors.gold, fontSize: 12 }}>
                  Meet Selene
                </Text>
                <Text style={s.small}>
                  Your AI guide for the question that’s yours.
                </Text>
              </View>
            </View>
          </View>
          <View
            style={{
              width: mobile ? "100%" : 420,
              alignItems: "center",
              marginTop: mobile ? 12 : -10,
              height: mobile ? 230 : 405,
            }}
          >
            <OracleArt size={mobile ? 250 : 430} />
            <Text
              style={[
                s.micro,
                { position: "absolute", bottom: mobile ? 0 : 5 },
              ]}
            >
              THREE COINS. TWO PATHS. YOUR NEXT CHAPTER.
            </Text>
          </View>
        </View>
      )}
      <GardenInvitation/>
      <View style={{ paddingTop: 34, paddingBottom: 20, gap: 10 }}>
        <Eyebrow>START WHERE YOU ARE</Eyebrow>
        <Text style={s.title}>What’s taking up space in your mind?</Text>
      </View>
      <View style={{ flexDirection: mobile ? "column" : "row", gap: 14 }}>
        {(
          [
            [
              "wealth",
              "01",
              "A choice at work",
              "Two opportunities. A new direction. A question about what comes next.",
              "Find my next step ↗",
            ],
            [
              "love",
              "02",
              "Someone on my mind",
              "A conversation to have. A connection to understand. Space for your own needs.",
              "Explore my connection ↗",
            ],
            [
              "wealth",
              "03",
              "A little curiosity",
              "You don’t need a big dilemma. Explore one small change for the week ahead.",
              "See what opens up ↗",
            ],
          ] as const
        ).map(([topic, n, title, copy, label]) => (
          <Pressable
            key={n}
            accessibilityRole="link"
            onPress={() =>
              router.push({
                pathname: "/ask",
                params: {
                  topic,
                  ...(n === "03" ? { starter: "curiosity" } : {}),
                },
              })
            }
            style={({ pressed }) => [
              s.path,
              { opacity: pressed ? 0.8 : 1, flex: mobile ? undefined : 1 },
            ]}
          >
            <Text
              style={{
                color: n === "02" ? colors.love : colors.gold,
                fontSize: 11,
                letterSpacing: 2,
              }}
            >
              {n} /
            </Text>
            <Text style={s.pathTitle}>{title}</Text>
            <Text style={s.description}>{copy}</Text>
            <Text style={{ color: colors.gold, fontSize: 12, marginTop: 13 }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      {recent && (
        <View style={s.resume}>
          <Text style={s.small}>
            {recent.journey?.action
              ? "Your small step is waiting here."
              : "Your last question is waiting."}
          </Text>
          <Button
            title="Continue my story ↗"
            kind="ghost"
            onPress={() =>
              router.push((recent.basis ? "/oracle/" : "/cast/") + recent.id)
            }
          />
        </View>
      )}
      <View style={{ paddingTop: 48, gap: 25 }}>
        <Eyebrow>A LITTLE MYSTERY. SOMETHING YOU CAN USE.</Eyebrow>
        <View style={{ flexDirection: mobile ? "column" : "row", gap: 26 }}>
          {[
            [
              "01",
              "A question, in your words",
              "Talk it through with Selene. Review your words before the coins.",
            ],
            [
              "02",
              "Two doors to open",
              "See a fresh angle on your actual question. Explore possibilities at your own pace.",
            ],
            [
              "03",
              "A story to come back to",
              "Keep a small step. Return with what happened, and see your story take shape.",
            ],
          ].map(([n, title, copy]) => (
            <View
              key={n}
              style={{
                flex: 1,
                gap: 12,
                borderTopWidth: 1,
                borderColor: colors.line,
                paddingTop: 20,
              }}
            >
              <Text style={s.micro}>{n} /</Text>
              <Text
                style={{
                  color: colors.ink,
                  fontFamily: fonts.display,
                  fontSize: 23,
                }}
              >
                {title}
              </Text>
              <Copy muted>{copy}</Copy>
            </View>
          ))}
        </View>
      </View>
      <View style={{ paddingVertical: 42, gap: 12, alignItems: "center" }}>
        <Text style={s.small}>
          Rooted in the I Ching. Made for your own judgment.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          <Button
            title="Explore the method"
            kind="ghost"
            onPress={() => router.push("/method")}
          />
          <Button
            title="See a sample reading ↗"
            kind="ghost"
            onPress={() => router.push("/sample")}
          />
        </View>
      </View>
    </OracleShell>
  );
}
const s = StyleSheet.create({
  hero: { alignItems: "center", gap: 18 },
  micro: { color: "#C6B4D0", fontSize: 9, letterSpacing: 1.2, lineHeight: 18 },
  small: { color: colors.muted, fontSize: 12, lineHeight: 21 },
  title: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 31,
    lineHeight: 39,
  },
  path: {
    backgroundColor: "#281D34",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    padding: 24,
    gap: 14,
  },
  pathTitle: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 27,
    lineHeight: 33,
  },
  description: { color: colors.muted, fontSize: 13, lineHeight: 23, flex: 1 },
  resume: {
    paddingTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
});

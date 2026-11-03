import { LocalizedText as Text } from "@/components/LocalizedText";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { HexagramGlyph } from "@/components/OracleArt";
import {
  Copy,
  Display,
  Eyebrow,
  OracleShell,
  Panel,
  oracleStyles as s,
} from "@/components/OracleShell";
import { Button, ErrorText, Loading } from "@/components/ui";
import { oracle, type Catalog } from "@/lib/oracle";
import { colors } from "@/lib/theme";

export default function Method() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [err, setErr] = useState("");
  const load = () => {
    setErr("");
    void oracle<Catalog>("/oracle/catalog")
      .then(setCatalog)
      .catch((e) => setErr(e.message));
  };
  useEffect(load, []);
  return (
    <OracleShell wide={false}>
      <View style={{ paddingTop: 45, gap: 26 }}>
        <Eyebrow>THE METHOD BEHIND THE MOMENT</Eyebrow>
        <Display size={50}>Ancient roots.{"\n"}An open interpretation.</Display>
        <Copy muted>
          The I Ching, or Book of Changes, is a Chinese tradition of working
          with patterns and change. Our experience uses its three-coin casting
          method as a symbolic starting point for personal reflection.
        </Copy>
        <Panel>
          <Text style={s.subheading}>Three coins. Six lines.</Text>
          <Copy>
            One face of each coin counts as 2; the other as 3. We cast three
            independent virtual coins six times, building your hexagram from the
            bottom upward.
          </Copy>
          {[
            [6, "Moving yin · changes to yang", "1 in 8"],
            [7, "Yang · stays yang", "3 in 8"],
            [8, "Yin · stays yin", "3 in 8"],
            [9, "Moving yang · changes to yin", "1 in 8"],
          ].map(([n, label, odds]) => (
            <View
              key={n}
              style={{
                flexDirection: "row",
                gap: 14,
                borderTopWidth: 1,
                borderColor: colors.line,
                paddingTop: 13,
              }}
            >
              <Text style={s.link}>{n}</Text>
              <Text style={[s.small, { flex: 1 }]}>{label}</Text>
              <Text style={s.small}>{odds}</Text>
            </View>
          ))}
          <Copy muted>
            The server records every cast. Refreshing or skipping the animation
            preserves that result. Starting another reading creates a separate
            record.
          </Copy>
        </Panel>
        <Panel>
          <Text style={s.subheading}>What your reading means.</Text>
          <Copy>
            The primary hexagram provides a theme. Moving lines turn into their
            opposite to form a transformed hexagram. When no lines move, there
            is no separate transformation.
          </Copy>
          <Copy muted>
            Our free meanings are original modern editorial reflections.
            Personalized interpretations are written by AI using the cast and
            the context you choose to share. We do not present this writing as a
            literal translation of ancient line texts or as a full Na Jia
            divination system.
          </Copy>
          <Copy muted>
            This experience does not know the future or another person’s
            thoughts. It does not provide investment, medical or legal advice.
          </Copy>
        </Panel>
        <Panel>
          <Text style={s.subheading}>A tradition you can explore.</Text>
          <ErrorText>{err}</ErrorText>
          {Boolean(err) && (
            <Button title="Reload sources" kind="secondary" onPress={load} />
          )}
          {catalog
            ? catalog.method.sources.map((source) => (
                <Button
                  key={source.url}
                  title={source.title + " ↗"}
                  kind="ghost"
                  onPress={() => Linking.openURL(source.url)}
                />
              ))
            : !err && <Loading />}
        </Panel>
        {catalog && (
          <>
            <Text style={s.subheading}>The 64 hexagrams.</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {catalog.hexagrams.map((h) => (
                <View
                  key={h.number}
                  style={{
                    width: "30%",
                    minWidth: 90,
                    flexGrow: 1,
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderRadius: 6,
                    padding: 15,
                    alignItems: "center",
                    gap: 9,
                  }}
                >
                  <HexagramGlyph bits={h.bits} size={58} />
                  <Text style={s.small}>
                    {h.number} · {h.name}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
        <Button
          title="Begin your reading  ↗"
          onPress={() => router.push("/ask")}
        />
      </View>
    </OracleShell>
  );
}

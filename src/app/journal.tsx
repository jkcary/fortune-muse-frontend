import { LocalizedText as Text } from "@/components/LocalizedText";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { HexagramGlyph } from "@/components/OracleArt";
import { OracleStorySky } from "@/components/OracleStorySky";
import {
  Copy,
  Display,
  Eyebrow,
  OracleShell,
  Panel,
  oracleStyles as s,
} from "@/components/OracleShell";
import { Button, ErrorText, Field, Loading } from "@/components/ui";
import { latestCast, oracle, type OracleCast } from "@/lib/oracle";
import { currentLang, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

export default function Journal() {
  const { me } = useSession();
  const t = useT();
  const [casts, setCasts] = useState<OracleCast[] | null>(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [latest, setLatest] = useState<string | null>(null);
  const load = useCallback(() => {
    void latestCast.get().then(setLatest);
    if (me)
      void oracle("/oracle/journal")
        .then((r) => {
          setCasts(r.casts);
          setErr("");
        })
        .catch((e) => setErr(e.message));
  }, [me]);
  useFocusEffect(load);
  const wealth = casts?.filter((c) => c.topic === "wealth").length ?? 0;
  const love = casts?.filter((c) => c.topic === "love").length ?? 0;
  const visible = casts?.filter(
    (c) =>
      (filter === "all" ||
        (filter === "favorites" && c.favorite) ||
        filter === c.topic) &&
      (!search ||
        (c.question + " " + (c.basis?.primary.name ?? ""))
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  return (
    <OracleShell>
      <View style={{ paddingTop: 45, paddingBottom: 35, gap: 20 }}>
        <Eyebrow>YOUR PRIVATE COLLECTION</Eyebrow>
        <Display>Your oracle journal.</Display>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}><Button title="My hexagram calendar" kind="secondary" onPress={()=>router.push('/calendar')}/><Button title="My hexagram collection" kind="secondary" onPress={()=>router.push('/collection')}/></View>
        <Copy muted>
          A record of your questions, the patterns you notice, and the
          perspective you bring.
        </Copy>
      </View>
      {me && casts && <OracleStorySky casts={casts} />}
      {!me ? (
        <Panel>
          <Display size={30}>Make space for your story.</Display>
          <Copy muted>
            Sign in to keep readings across devices and add your own notes.
            Temporary readings never appear here.
          </Copy>
          <Button
            title="Sign in to your journal"
            onPress={() => router.push("/sign-in")}
          />
          {latest && (
            <Button
              title="Return to your current reading"
              kind="secondary"
              onPress={() => router.push("/oracle/" + latest)}
            />
          )}
        </Panel>
      ) : (
        <>
          <View style={[s.row, { marginBottom: 30 }]}>
            {[
              ["RECENT READINGS", String(casts?.length ?? 0)],
              ["WEALTH & CAREER", String(wealth)],
              ["LOVE & CONNECTION", String(love)],
            ].map(([label, value]) => (
              <View
                key={label}
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 8,
                  gap: 14,
                }}
              >
                <Text style={s.label}>{label}</Text>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 38,
                    color: colors.ink,
                  }}
                >
                  {value}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ gap: 18, marginBottom: 24 }}>
            <View style={s.row}>
              {[
                ["all", "All readings"],
                ["wealth", "Wealth"],
                ["love", "Love"],
                ["favorites", "Favorites"],
              ].map(([value, label]) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === value }}
                  onPress={() => setFilter(value)}
                  style={{
                    borderBottomWidth: 1,
                    borderColor: filter === value ? colors.gold : "transparent",
                    paddingVertical: 12,
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: filter === value ? colors.ink : colors.muted,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Field
              label="Find a reading"
              placeholder="Search your questions or hexagram names"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <ErrorText>{err}</ErrorText>
          {Boolean(err) && (
            <Button title="Try loading again" kind="secondary" onPress={load} />
          )}
          {!casts && !err ? (
            <Loading />
          ) : visible?.length === 0 ? (
            <Panel>
              <Text style={s.subheading}>
                {casts?.length
                  ? "No matching readings."
                  : "Your story starts with a question."}
              </Text>
              <Copy muted>
                {casts?.length
                  ? "Try another search or filter."
                  : "Your saved readings and reflections will appear here."}
              </Copy>
              <Button
                title="Begin a reading  ↗"
                onPress={() => router.push("/ask")}
              />
            </Panel>
          ) : (
            <View style={{ gap: 14 }}>
              {visible?.map((c) => (
                <View
                  key={c.id}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderRadius: 9,
                    padding: 22,
                    flexDirection: "row",
                    gap: 22,
                    alignItems: "center",
                  }}
                >
                  <HexagramGlyph
                    bits={c.basis?.primary.bits ?? "000000"}
                    size={65}
                    color={c.topic === "love" ? colors.love : colors.gold}
                  />
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={s.small}>
                      {new Date(c.createdAt).toLocaleDateString(currentLang(), {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      ·{" "}
                      {c.topic === "love"
                        ? "Love & Connection"
                        : "Wealth & Career"}
                      {c.favorite ? " · ★" : ""}
                    </Text>
                    <Pressable
                      accessibilityRole="link"
                      onPress={() =>
                        router.push((c.basis ? "/oracle/" : "/cast/") + c.id)
                      }
                    >
                      <Text
                        style={{
                          fontFamily: fonts.display,
                          fontSize: 22,
                          color: colors.ink,
                        }}
                      >
                        {c.basis?.primary.name ?? "An unfinished ritual"} ↗
                      </Text>
                    </Pressable>
                    <Text localize={false} numberOfLines={2} style={s.small}>
                      {c.question}
                    </Text>
                    {!!c.journey?.action && (
                      <Text
                        localize={false}
                        numberOfLines={2}
                        style={{
                          color: colors.gold,
                          fontSize: 12,
                          lineHeight: 21,
                        }}
                      >
                        {c.journey.action}
                      </Text>
                    )}
                    {Boolean(c.note) && (
                      <Text
                        numberOfLines={2}
                        style={[s.small, { fontStyle: "italic" }]}
                      >
                        {t("Your reflection:")}{" "}
                        <Text localize={false}>{c.note}</Text>
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={{ paddingTop: 30, gap: 12 }}>
            <Text style={s.small}>
              Showing up to 100 recent readings. These counts describe your
              activity, not predictions or personality traits.
            </Text>
            <Button
              title="Legacy readings & purchase receipts ↗"
              kind="ghost"
              onPress={() => router.push("/history")}
            />
          </View>
        </>
      )}
    </OracleShell>
  );
}

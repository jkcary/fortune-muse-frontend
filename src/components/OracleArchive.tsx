import { useCallback, useRef, useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LocalizedText as Text } from "./LocalizedText";
import { Copy, Display, Eyebrow, OracleShell, Panel } from "./OracleShell";
import { Button, ErrorText, Loading } from "./ui";
import { OracleCardPreview } from "./OracleCardPreview";
import { HexagramGlyph } from "./OracleArt";
import { OracleCalendarPopup } from "./OracleCalendarPopup";
import { oracleCardSvg } from "@/lib/shareOracle";
import { oracle, type OracleCast } from "@/lib/oracle";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { colors, fonts } from "@/lib/theme";

type Result = {
  casts: OracleCast[];
  days: { date: string; count: number; bits?: string; number?: number }[];
  total: number;
  distinctHexagrams: number;
  page: number;
  hasMore: boolean;
  timezone: string;
};
const localMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
export function OracleArchive({ mode }: { mode: "calendar" | "collection" }) {
  const { me, ready } = useSession();
  return (
    <OracleShell>
      {ready && (
        <ArchiveContent key={`${me?.id ?? "guest"}-${mode}`} mode={mode} />
      )}
    </OracleShell>
  );
}
function ArchiveContent({ mode }: { mode: "calendar" | "collection" }) {
  const { me } = useSession(),
    { lang, t } = useI18n(),
    { width } = useWindowDimensions();
  const [month, setMonth] = useState(localMonth),
    [day, setDay] = useState<string | null>(null),
    [favorites, setFavorites] = useState(true);
  const [previewDay, setPreviewDay] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState<string | null>(null);
  const request = useRef(0),
    mutation = useRef(false);
  const query = (page: number) => {
    const parts = [`page=${page}`];
    if (mode === "calendar") {
      parts.push(`month=${month}`);
    } else parts.push(`favorites=${favorites}`);
    return "/oracle/archive?" + parts.join("&");
  };
  async function load(page = 0) {
    if (!me) return;
    const revision = ++request.current;
    setLoading(true);
    setError("");
    try {
      const next = await oracle<Result>(query(page));
      if (revision !== request.current) return;
      setData((prev) =>
        page > 0 && prev
          ? {
              ...next,
              casts: [
                ...prev.casts,
                ...next.casts.filter(
                  (c) => !prev.casts.some((p) => p.id === c.id),
                ),
              ],
            }
          : next,
      );
    } catch {
      if (revision === request.current)
        setError("Your saved readings could not load. Please retry.");
    } finally {
      if (revision === request.current) setLoading(false);
    }
  }
  useFocusEffect(
    useCallback(() => {
      setData(null);
      void load();
      return () => {
        request.current++;
      };
    }, [me?.id, mode, month, favorites]),
  );
  async function favorite(cast: OracleCast) {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(cast.id);
    setError("");
    try {
      const result = await oracle<{ cast: OracleCast }>(
        `/oracle/casts/${cast.id}`,
        { method: "PATCH", body: { favorite: !cast.favorite } },
      );
      setData((previous) =>
        previous
          ? {
              ...previous,
              casts: previous.casts.map((c) =>
                c.id === cast.id ? result.cast : c,
              ),
            }
          : previous,
      );
      if (mode === "collection" && favorites) await load();
    } catch {
      setError("Your collection could not be updated. Please retry.");
    } finally {
      mutation.current = false;
      setBusy(null);
    }
  }
  const [year, monthNumber] = month.split("-").map(Number),
    first = new Date(year, monthNumber - 1, 1),
    count = new Date(year, monthNumber, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((first.getDay() + count) / 7) * 7 },
    (_, i) => i - first.getDay() + 1,
  );
  function shiftMonth(amount: number) {
    const date = new Date(year, monthNumber - 1 + amount, 1);
    setMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
    setDay(null);
  }
  const today = new Date().toLocaleDateString("en-CA");
  return (
    <View style={{ paddingVertical: 30, gap: 22 }}>
      <Eyebrow>YOUR SAVED MOMENTS</Eyebrow>
      <Display size={width < 400 ? 32 : width < 700 ? 38 : 54}>
        {mode === "calendar"
          ? "Your hexagram calendar."
          : "Your hexagram collection."}
      </Display>
      <Copy muted>
        {mode === "calendar"
          ? "Return to a date and revisit the reading you kept."
          : "Keep the cards that matter to you, and revisit them whenever you like."}
      </Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Button
          title="My hexagram calendar"
          kind={mode === "calendar" ? "primary" : "secondary"}
          onPress={() => router.replace("/calendar")}
        />
        <Button
          title="My hexagram collection"
          kind={mode === "collection" ? "primary" : "secondary"}
          onPress={() => router.replace("/collection")}
        />
      </View>
      {!me ? (
        <Panel>
          <Copy>
            Sign in to see your saved calendar and collection. Temporary
            readings stay in their own session.
          </Copy>
          <Button title="Sign in" onPress={() => router.push("/sign-in")} />
        </Panel>
      ) : (
        <>
          {mode === "calendar" ? (
            <View
              style={{
                gap: 18,
                padding: width < 400 ? 2 : 24,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 24,
                backgroundColor: "#251D34",
                maxWidth: 760,
                width: width < 400 ? width - 24 : "100%",
                alignSelf: "center",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("Previous month")}
                  disabled={
                    busy !== null || (year <= 1900 && monthNumber === 1)
                  }
                  onPress={() => shiftMonth(-1)}
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.gold, fontSize: 28 }}>‹</Text>
                </Pressable>
                <Text
                  localize={false}
                  style={{
                    fontFamily: fonts.display,
                    fontSize: width < 400 ? 18 : 27,
                    color: colors.ink,
                  }}
                >
                  {first.toLocaleDateString(lang, {
                    year: "numeric",
                    month: "long",
                  })}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("Next month")}
                  disabled={
                    busy !== null || (year >= 2199 && monthNumber === 12)
                  }
                  onPress={() => shiftMonth(1)}
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.gold, fontSize: 28 }}>›</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: "row" }}>
                {Array.from({ length: 7 }, (_, i) => (
                  <Text
                    key={i}
                    localize={false}
                    style={{
                      width: "14.2857%",
                      textAlign: "center",
                      color: colors.muted,
                      fontSize: 12,
                    }}
                  >
                    {new Date(2023, 0, 1 + i).toLocaleDateString(lang, {
                      weekday: "short",
                    })}
                  </Text>
                ))}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {cells.map((n, i) => {
                  const date = `${month}-${String(n).padStart(2, "0")}`,
                    entry = data?.days.find((d) => d.date === date),
                    valid = n > 0 && n <= count;
                  return (
                    <View
                      key={i}
                      style={{
                        width: "14.2857%",
                        padding: width < 400 ? 0 : 2,
                      }}
                    >
                      {valid ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t("{date}, {count} readings", {
                            date,
                            count: entry?.count ?? 0,
                          })}
                          aria-pressed={day === date}
                          disabled={busy !== null}
                          onPress={() => {
                            setDay(date);
                            setPreviewDay(date);
                          }}
                          style={{
                            minHeight: 86,
                            borderWidth: 1,
                            borderRadius: 12,
                            borderColor:
                              day === date
                                ? colors.gold
                                : date === today
                                  ? "#95788F"
                                  : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                            backgroundColor:
                              day === date
                                ? "#49334C"
                                : entry
                                  ? "#34283F"
                                  : "transparent",
                          }}
                        >
                          <View
                            pointerEvents="none"
                            aria-hidden={true}
                            style={{
                              height: 32,
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {entry?.bits && (
                              <HexagramGlyph
                                bits={entry.bits}
                                size={30}
                                color={day === date ? colors.gold : "#DABBD8"}
                              />
                            )}
                          </View>
                          <Text
                            style={{
                              fontSize: 15,
                              color: day === date ? colors.gold : colors.ink,
                            }}
                            localize={false}
                          >
                            {n}
                          </Text>
                          <Text
                            style={{ fontSize: 10, color: colors.gold }}
                            localize={false}
                          >
                            {entry ? `✦ ${entry.count}` : " "}
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={{ minHeight: 86 }} />
                      )}
                    </View>
                  );
                })}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Button
                  title="Clear date selection"
                  kind="ghost"
                  disabled={busy !== null}
                  onPress={() => setDay(null)}
                />
                <Button
                  title="Back to this month"
                  kind="ghost"
                  disabled={busy !== null}
                  onPress={() => {
                    setMonth(localMonth());
                    setDay(null);
                  }}
                />
              </View>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Button
                  title="My favorites"
                  kind={favorites ? "primary" : "secondary"}
                  disabled={busy !== null}
                  onPress={() => setFavorites(true)}
                />
                <Button
                  title="All saved cards"
                  kind={favorites ? "secondary" : "primary"}
                  disabled={busy !== null}
                  onPress={() => setFavorites(false)}
                />
              </View>
              {data && (
                <Text style={{ color: colors.gold, fontSize: 13 }}>
                  {t("{count} cards · {unique} different hexagrams", {
                    count: data.total,
                    unique: data.distinctHexagrams,
                  })}
                </Text>
              )}
            </View>
          )}
          <ErrorText>{error}</ErrorText>
          {!!error && (
            <Button
              title="Try loading again"
              kind="secondary"
              onPress={() => void load()}
            />
          )}
          {mode === "calendar" ? (
            <Copy muted>Tap a date or hexagram to open its keepsake.</Copy>
          ) : loading && !data ? (
            <Loading label="Opening your saved moments…" />
          ) : data?.casts.length === 0 ? (
            <Panel>
              <Copy>
                {mode === "collection" && favorites
                  ? "No favorite cards yet. Add a saved reading to your collection."
                  : "No saved readings for this date. Your next story can begin whenever you like."}
              </Copy>
              <Button
                title="Explore a new question"
                onPress={() => router.push("/ask")}
              />
              {mode === "collection" && favorites && (
                <Button
                  title="All saved cards"
                  kind="secondary"
                  disabled={busy !== null}
                  onPress={() => setFavorites(false)}
                />
              )}
            </Panel>
          ) : (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 18,
                justifyContent: "center",
              }}
            >
              {data?.casts.map((cast) => (
                <View
                  key={cast.id}
                  style={{
                    width: width < 600 ? "100%" : width < 1000 ? "46%" : "30%",
                    maxWidth: 360,
                    minWidth: 0,
                    borderWidth: 1,
                    borderColor: cast.favorite ? "#A78A9A" : colors.line,
                    borderRadius: 22,
                    padding: 16,
                    gap: 12,
                    backgroundColor: "#261D33",
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("Open reading {number}", {
                      number: cast.basis!.primary.number,
                    })}
                    onPress={() => router.push(`/oracle/${cast.id}`)}
                    style={{
                      alignSelf: "center",
                      width: "100%",
                      maxWidth: 220,
                      aspectRatio: 9 / 16,
                    }}
                  >
                    <View
                      pointerEvents="none"
                      aria-hidden={true}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <OracleCardPreview
                        xml={oracleCardSvg(cast, { closing: true })}
                      />
                    </View>
                  </Pressable>
                  <Text
                    localize={false}
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 23,
                      color: colors.ink,
                      textAlign: "center",
                    }}
                  >
                    #{cast.basis!.primary.number} ·{" "}
                    {cast.basis!.primary.chinese}
                  </Text>
                  <Text
                    localize={false}
                    style={{
                      fontSize: 12,
                      color: colors.muted,
                      textAlign: "center",
                    }}
                  >
                    {new Date(cast.createdAt).toLocaleString(lang, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Text>
                  <Button
                    title={
                      cast.favorite
                        ? "Remove from collection"
                        : "Add to my collection"
                    }
                    kind="secondary"
                    disabled={busy !== null}
                    loading={busy === cast.id}
                    onPress={() => void favorite(cast)}
                  />
                  <Button
                    title="Open this reading"
                    kind="ghost"
                    onPress={() => router.push(`/oracle/${cast.id}`)}
                  />
                </View>
              ))}
            </View>
          )}
          {mode === "collection" && data?.hasMore && (
            <Button
              title="Load more saved cards"
              kind="secondary"
              loading={loading}
              onPress={() => void load(data.page + 1)}
            />
          )}
        </>
      )}
      {me && previewDay && (
        <OracleCalendarPopup
          key={previewDay}
          date={previewDay}
          onClose={() => setPreviewDay(null)}
        />
      )}
    </View>
  );
}

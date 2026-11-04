import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LocalizedText as Text } from "./LocalizedText";
import { Button, ErrorText, Loading } from "./ui";
import { Copy } from "./OracleShell";
import { OracleCardPreview } from "./OracleCardPreview";
import { useCalmMotion } from "./OracleArt";
import { oracleCardSvg } from "@/lib/shareOracle";
import { oracle, type OracleCast } from "@/lib/oracle";
import { useI18n } from "@/lib/i18n";
import { colors, fonts } from "@/lib/theme";

type Page = {
  casts: OracleCast[];
  total: number;
  page: number;
  hasMore: boolean;
};
export function OracleCalendarPopup({
  date,
  onClose,
}: {
  date: string;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions(),
    { lang, t } = useI18n(),
    reduced = useCalmMotion();
  const insets = useSafeAreaInsets();
  const availableHeight = height - insets.top - insets.bottom;
  const [data, setData] = useState<Page | null>(null),
    [index, setIndex] = useState(0),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [retryPage, setRetryPage] = useState<number | null>(null);
  const alive = useRef(true),
    lock = useRef(false);
  const current = data?.casts[index];
  async function load(page = 0) {
    if (lock.current) return;
    lock.current = true;
    setLoading(true);
    setError("");
    setRetryPage(null);
    try {
      const result = await oracle<Page>(
        `/oracle/archive?month=${date.slice(0, 7)}&day=${date}&page=${page}`,
      );
      if (!alive.current) return;
      setData((prev) =>
        page && prev
          ? { ...result, casts: [...prev.casts, ...result.casts] }
          : result,
      );
      if (page && result.casts.length) setIndex((i) => i + 1);
    } catch {
      if (alive.current) {
        setError("Your saved readings could not load. Please retry.");
        setRetryPage(page);
      }
    } finally {
      lock.current = false;
      if (alive.current) setLoading(false);
    }
  }
  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
    };
  }, []);
  async function toggleFavorite() {
    if (!current || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setRetryPage(null);
    try {
      const result = await oracle<{ cast: OracleCast }>(
        `/oracle/casts/${current.id}`,
        { method: "PATCH", body: { favorite: !current.favorite } },
      );
      if (alive.current)
        setData((prev) =>
          prev
            ? {
                ...prev,
                casts: prev.casts.map((c) =>
                  c.id === current.id ? result.cast : c,
                ),
              }
            : prev,
        );
    } catch {
      if (alive.current)
        setError("Your collection could not be updated. Please retry.");
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const cardHeight = Math.max(
      180,
      Math.min(
        520,
        availableHeight - 300,
        ((width - insets.left - insets.right - 72) * 16) / 9,
      ),
    ),
    cardWidth = (cardHeight * 9) / 16;
  return (
    <Modal
      visible
      transparent
      animationType={reduced ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(8,5,17,0.74)" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Close card preview backdrop")}
          onPress={onClose}
          style={{ position: "absolute", inset: 0 }}
        />
        <SafeAreaView
          pointerEvents="box-none"
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              width: "100%",
              maxWidth: 450,
              maxHeight: availableHeight - 32,
              borderRadius: 26,
              borderWidth: 1,
              borderColor: "#96728F",
              backgroundColor: "#241A32",
              shadowColor: "#CCA2D7",
              shadowOpacity: 0.3,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 0 },
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 18,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderColor: colors.line,
              }}
            >
              <Text
                accessibilityRole="header"
                localize={false}
                style={{
                  fontFamily: fonts.display,
                  fontSize: 23,
                  color: colors.gold,
                }}
              >
                {date}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Close card preview")}
                onPress={onClose}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 22,
                }}
              >
                <Text style={{ color: colors.ink, fontSize: 27 }}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={{
                padding: 18,
                gap: 12,
                alignItems: "center",
              }}
              keyboardShouldPersistTaps="handled"
            >
              {loading && !data ? (
                <Loading label="Opening your saved moments…" />
              ) : current ? (
                <>
                  <View
                    accessibilityRole="image"
                    accessibilityLabel={t("Your closing card preview")}
                    style={{
                      width: cardWidth,
                      height: cardHeight,
                      borderRadius: 18,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: colors.line,
                    }}
                  >
                    <OracleCardPreview
                      xml={oracleCardSvg(current, { closing: true })}
                    />
                  </View>
                  <Text
                    localize={false}
                    style={{ fontSize: 11, color: colors.muted }}
                  >
                    {new Date(current.createdAt).toLocaleTimeString(lang, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {data && data.total > 1 && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 18,
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("Previous card")}
                        disabled={index === 0 || loading || busy}
                        onPress={() => setIndex((i) => i - 1)}
                        style={{
                          width: 44,
                          height: 44,
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: index === 0 || loading || busy ? 0.4 : 1,
                        }}
                      >
                        <Text style={{ color: colors.gold, fontSize: 28 }}>
                          ‹
                        </Text>
                      </Pressable>
                      <Text
                        localize={false}
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          color: colors.gold,
                          minWidth: 50,
                          textAlign: "center",
                        }}
                      >
                        {index + 1} / {data.total}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("Next card")}
                        disabled={
                          loading ||
                          busy ||
                          (index + 1 >= data.casts.length && !data.hasMore)
                        }
                        onPress={() => {
                          if (index + 1 < data.casts.length)
                            setIndex((i) => i + 1);
                          else void load(data.page + 1);
                        }}
                        style={{
                          width: 44,
                          height: 44,
                          alignItems: "center",
                          justifyContent: "center",
                          opacity:
                            loading ||
                            busy ||
                            (index + 1 >= data.casts.length && !data.hasMore)
                              ? 0.4
                              : 1,
                        }}
                      >
                        <Text style={{ color: colors.gold, fontSize: 28 }}>
                          ›
                        </Text>
                      </Pressable>
                    </View>
                  )}
                  <View style={{ width: "100%", gap: 8 }}>
                    <Button
                      title={
                        current.favorite
                          ? "Remove from collection"
                          : "Add to my collection"
                      }
                      kind="secondary"
                      loading={busy}
                      disabled={loading}
                      onPress={() => void toggleFavorite()}
                    />
                    <Button
                      title="Open this reading"
                      kind="ghost"
                      disabled={busy}
                      onPress={() => {
                        onClose();
                        router.push(`/oracle/${current.id}`);
                      }}
                    />
                  </View>
                </>
              ) : !loading && !error ? (
                <Copy muted>
                  No saved readings for this date. Your next story can begin
                  whenever you like.
                </Copy>
              ) : null}
              <ErrorText>{error}</ErrorText>
              {retryPage !== null && (
                <Button
                  title="Try loading again"
                  kind="secondary"
                  disabled={loading}
                  onPress={() => void load(retryPage)}
                />
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

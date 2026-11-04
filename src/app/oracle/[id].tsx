import { LocalizedText as Text } from "@/components/LocalizedText";
import { randomUUID } from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { HexagramGlyph } from "@/components/OracleArt";
import { OracleClosingRitual } from "@/components/OracleClosingRitual";
import { OracleActionGuide } from "@/components/OracleActionGuide";
import { OracleDiscovery } from "@/components/OracleDiscovery";
import {
  Copy,
  Display,
  Eyebrow,
  OracleShell,
  Panel,
  oracleStyles as s,
} from "@/components/OracleShell";
import { Button, Check, ErrorText, Field, Loading } from "@/components/ui";
import { OracleGenerationSky } from "@/components/OracleGenerationSky";
import { api, money } from "@/lib/api";
import { latestCast, oracle, pendingCast } from "@/lib/oracle";
import Svg, { SvgXml } from "react-native-svg";
import { oracleCardSvg, shareOracle } from "@/lib/shareOracle";
import { useOracleCast } from "@/lib/useOracleCast";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

export default function Reading() {
  const { id, canceled } = useLocalSearchParams<{
    id: string;
    canceled?: string;
  }>();
  const { cast, setCast, error, setError, reload } = useOracleCast(id);
  const { me, refresh } = useSession();
  const { width } = useWindowDimensions();
  const mobile = width < 800;
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [voucher, setVoucher] = useState(false);
  const [note, setNote] = useState("");
  const [remember, setRemember] = useState(false);
  const [info, setInfo] = useState("");
  const [raw, setRaw] = useState(false);
  const [follow, setFollow] = useState("");
  const [safety, setSafety] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const followRequest = useRef<{ id: string; question: string } | null>(null);
  const initialized = useRef(false);
  const imageRef = useRef<Svg | null>(null);
  const nativePng = () =>
    new Promise<string>((resolve, reject) => {
      if (!imageRef.current) {
        reject(new Error("Your card is not ready yet. Please try again."));
        return;
      }
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
  useEffect(() => {
    if (cast && !initialized.current) {
      setNote(cast.note);
      initialized.current = true;
    }
  }, [cast]);
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function signIn() {
    await pendingCast.set(id);
    router.push("/sign-in");
  }
  async function upgrade() {
    if (!me) return signIn();
    if (!me.email_verified) {
      setError("Confirm your email before purchasing a deep reading.");
      return;
    }
    if (!consent) {
      setError("Please confirm the digital reading terms below.");
      return;
    }
    await act(async () => {
      const res = await oracle("/oracle/casts/" + id + "/upgrade", {
        body: { digitalContentConsent: true, useVoucher: voucher },
      });
      setCast(res.cast);
      if (res.payment.type === "stripe") {
        if (Platform.OS === "web")
          window.location.assign(res.payment.checkoutUrl);
        else {
          await WebBrowser.openBrowserAsync(res.payment.checkoutUrl);
          await reload();
        }
      } else if (res.payment.type === "none") await reload();
    });
  }
  if (!cast)
    return (
      <OracleShell>
        <View style={{ paddingVertical: 60 }}>
          {error ? (
            <Panel>
              <Display size={34}>Let’s reconnect.</Display>
              <Copy>{error}</Copy>
              <Button title="Try again" onPress={() => void reload()} />
              <Button
                title="Start a new reading"
                kind="secondary"
                onPress={() => router.push("/ask")}
              />
            </Panel>
          ) : (
            <Loading label="Opening your reading…" />
          )}
        </View>
      </OracleShell>
    );
  if (!cast.basis)
    return (
      <OracleShell>
        <View style={s.section}>
          <Display size={40}>Your ritual is waiting.</Display>
          <Copy muted>
            Your recorded lines are safe. Continue where you left off.
          </Copy>
          <Button
            title="Continue casting"
            onPress={() => router.replace("/cast/" + id)}
          />
        </View>
      </OracleShell>
    );
  const { primary, transformation, moving } = cast.basis;
  const premium = cast.premium;
  const paidWaiting = ["queued", "generating"].includes(cast.premiumStatus);
  return (
    <OracleShell>
      {Platform.OS !== "web" && (
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={{
            position: "absolute",
            left: -3000,
            top: 0,
            width: 270,
            height: 480,
          }}
        >
          <SvgXml
            xml={oracleCardSvg(cast)}
            override={{ ref: imageRef, width: 270, height: 480 }}
          />
        </View>
      )}
      <View style={{ paddingTop: 40, paddingBottom: 25 }}>
        <Eyebrow love={cast.topic === "love"}>
          03 / YOUR READING ·{" "}
          {cast.topic === "love" ? "LOVE & CONNECTION" : "WEALTH & CAREER"}
        </Eyebrow>
        <Display size={mobile ? 42 : 58}>
          Your next{" "}
          <Text style={{ fontStyle: "italic", color: colors.gold }}>
            possibility.
          </Text>
        </Display>
        <View style={{ marginTop: 20, maxWidth: 750 }}>
          <Copy muted localize={false}>
            “{cast.question}”
          </Copy>
        </View>
      </View>
      <View style={{ paddingBottom: 38 }}>
        <OracleDiscovery
          key={cast.id}
          cast={cast}
          onUpdated={(next) =>
            setCast((previous) =>
              previous
                ? previous.updatedAt &&
                  next.updatedAt &&
                  previous.updatedAt > next.updatedAt
                  ? previous
                  : {
                      ...previous,
                      updatedAt: next.updatedAt,
                      glimpse: next.glimpse ?? previous.glimpse,
                      journey: next.journey,
                    }
                : next,
            )
          }
        />
      </View>
      <View style={{ flexDirection: mobile ? "column" : "row", gap: 30 }}>
        <View style={{ width: mobile ? "100%" : 310, gap: 18 }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: "#5F5037",
              borderRadius: 10,
              padding: 30,
              alignItems: "center",
              gap: 20,
              backgroundColor: "#12151B",
            }}
          >
            <Text
              style={{ color: colors.gold, fontSize: 9, letterSpacing: 2.5 }}
            >
              ORACLE ONE
            </Text>
            <Text
              style={{ color: colors.muted, fontSize: 10, letterSpacing: 2 }}
            >
              HEXAGRAM {String(primary.number).padStart(2, "0")}
            </Text>
            <View style={{ paddingVertical: 16 }}>
              <HexagramGlyph size={150} bits={primary.bits} moving={moving} />
            </View>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 32,
                color: colors.ink,
                textAlign: "center",
              }}
            >
              {primary.name}
            </Text>
            <Text
              style={{ color: colors.gold, fontSize: 11, letterSpacing: 2 }}
            >
              {primary.keyword.toUpperCase()}
            </Text>
            <View
              style={{
                height: 1,
                width: 50,
                backgroundColor: "#66563A",
                marginVertical: 6,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                color: colors.muted,
                textAlign: "center",
                lineHeight: 21,
              }}
            >
              Discover your patterns.{"\n"}Explore your possibilities.
            </Text>
          </View>
          <Button
            title="Export your card  ↗"
            kind="secondary"
            disabled={busy}
            onPress={() => void act(() => shareOracle(cast, nativePng))}
          />
          <Text style={[s.small, { textAlign: "center" }]}>
            {Platform.OS === "web" ? "1080 × 1920 PNG." : "1080 × 1920 PNG."}{" "}
            Your private question and notes are excluded.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: raw }}
            onPress={() => setRaw(!raw)}
          >
            <Text style={[s.link, { textAlign: "center", marginTop: 8 }]}>
              {raw ? "Hide" : "View"} your original cast {raw ? "−" : "＋"}
            </Text>
          </Pressable>
          {raw && (
            <Panel>
              <Text style={s.label}>CAST RECORD</Text>
              {cast.rounds.map((r, i) => (
                <Text key={i} style={s.small}>
                  Line {i + 1} · {r.coins.join(" + ")} = {r.value}
                </Text>
              ))}
              <Text style={s.small}>
                Bottom to top · {cast.basis.ruleVersion}
              </Text>
              <Text style={s.small}>Content: {cast.basis.contentVersion}</Text>
            </Panel>
          )}
        </View>
        <View style={{ flex: 1, gap: 24 }}>
          <Panel>
            <Eyebrow>THE SYMBOLIC STARTING POINT</Eyebrow>
            <Text style={s.subheading}>{primary.keyword}, in this moment.</Text>
            <Copy>{primary.meaning}</Copy>
            <Text style={s.small}>
              Original editorial reflection on Hexagram {primary.number}. This
              basic meaning is shared by everyone who receives this hexagram.
            </Text>
          </Panel>
          <Panel>
            <Eyebrow>WHAT IS CHANGING</Eyebrow>
            {transformation ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 18,
                  }}
                >
                  <HexagramGlyph bits={transformation.bits} size={65} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.subheading}>{transformation.name}</Text>
                    <Text style={s.small}>
                      Transformed hexagram {transformation.number}
                    </Text>
                  </View>
                </View>
                <Copy muted>
                  Moving {moving.length === 1 ? "line" : "lines"}{" "}
                  {moving.join(", ")} change into their opposite.
                </Copy>
                <Copy>{transformation.meaning}</Copy>
              </>
            ) : (
              <Copy>
                No moving lines appeared in your cast. There is no separate
                transformed hexagram. Stay with the primary theme and consider
                what it brings into focus.
              </Copy>
            )}
          </Panel>
          {premium ? (
            <Panel>
              <Eyebrow>YOUR PERSONAL INTERPRETATION</Eyebrow>
              <Text localize={false} style={s.subheading}>
                {premium.headline}
              </Text>
              <Copy localize={false}>{premium.interpretation}</Copy>
              <Text style={s.label}>A CLOSER LOOK AT CHANGE</Text>
              <Copy localize={false}>{premium.changing}</Copy>
              <OracleActionGuide
                key={cast.id}
                cast={cast}
                onUpdated={setCast}
              />
              <Text style={s.label}>CARRY THIS QUESTION WITH YOU</Text>
              <Copy localize={false}>{premium.reflection}</Copy>
              <Text style={s.small}>
                {premium.aiGenerated
                  ? "AI-generated interpretation."
                  : "Development sample · AI is not connected."}{" "}
                Symbolic guidance for reflection; not financial, medical, or
                legal advice.
              </Text>
            </Panel>
          ) : paidWaiting ? (
            <Panel>
              <Eyebrow>YOUR DEEP READING</Eyebrow>
              <OracleGenerationSky status={cast.premiumStatus === "queued" ? "queued" : "generating"} bits={primary.bits}/>
              <Copy muted>
                You can leave this page. Your reading will continue in the
                background and appear here when ready.
              </Copy>
              <Button
                title="Check for an update"
                kind="secondary"
                onPress={() => void reload()}
              />
            </Panel>
          ) : cast.premiumStatus === "refunding" ||
            cast.premiumStatus === "refunded" ? (
            <Panel>
              <Text style={s.subheading}>
                {cast.premiumStatus === "refunded"
                  ? "Your payment was refunded."
                  : "Your refund is being processed."}
              </Text>
              <Copy muted>
                The deep reading could not be delivered. Your free hexagram
                remains available.
              </Copy>
              <Button
                title="Check status"
                kind="secondary"
                onPress={() => void reload()}
              />
            </Panel>
          ) : (
            <Panel>
              <Eyebrow>GO A LITTLE DEEPER</Eyebrow>
              <Text style={s.subheading}>What does this mean for you?</Text>
              <Copy muted>
                A personal interpretation connecting your question, your context
                and this exact hexagram. Includes one practical next step and
                two follow-up questions.
              </Copy>
              <Text
                style={{
                  fontSize: 28,
                  color: colors.ink,
                  fontFamily: fonts.display,
                }}
              >
                {me?.super
                  ? "Complimentary"
                  : voucher
                    ? "Use your voucher"
                    : money(299)}
                <Text style={s.small}> / one reading · no subscription</Text>
              </Text>
              <Text style={s.small}>
                Sales tax is added at checkout where applicable.
              </Text>
              {me && !me.email_verified && (
                <View style={{ gap: 12 }}>
                  <Copy>
                    Check your email to confirm your account before purchasing.
                  </Copy>
                  <Button
                    title="Resend confirmation email"
                    kind="secondary"
                    onPress={() =>
                      void act(async () => {
                        await api("/auth/resend-verification", { body: {} });
                        setInfo("Confirmation email sent.");
                      })
                    }
                  />
                  <Button
                    title="I’ve confirmed my email"
                    kind="ghost"
                    onPress={() =>
                      void act(async () => {
                        await refresh();
                      })
                    }
                  />
                </View>
              )}
              {me && me.freeReadings > 0 && !me.super && (
                <Check checked={voucher} onChange={setVoucher}>
                  Use one of my free reading vouchers.
                </Check>
              )}
              {me && (
                <Check checked={consent} onChange={setConsent}>
                  I understand this is digital content for entertainment,
                  delivered after payment. Delivery failures are refunded.
                </Check>
              )}
              {cast.order?.status === "pending" &&
              cast.order.provider === "dev" ? (
                <>
                  <Copy muted>
                    Local test checkout — no real charge will be made.
                  </Copy>
                  <Button
                    title="Confirm test payment"
                    loading={busy}
                    onPress={() =>
                      void act(async () => {
                        await api("/payments/dev/confirm", {
                          body: { orderId: cast.order!.id },
                        });
                        await reload();
                      })
                    }
                  />
                </>
              ) : (
                <Button
                  title={
                    me
                      ? "Get your deep reading  ↗"
                      : "Sign in to explore deeper  ↗"
                  }
                  loading={busy}
                  onPress={() => void upgrade()}
                />
              )}
              {(cast.order?.status === "pending" || canceled) && me && (
                <Button
                  title="Cancel checkout and return to your free reading"
                  kind="ghost"
                  disabled={busy}
                  onPress={() =>
                    void act(async () => {
                      const r = await oracle(
                        "/oracle/casts/" + id + "/cancel-checkout",
                        { body: {} },
                      );
                      setCast(r.cast);
                    })
                  }
                />
              )}
            </Panel>
          )}
          {premium && (
            <Panel>
              <Eyebrow>ASK THE ORACLE</Eyebrow>
              <Copy muted>
                Explore the same reading from another angle.{" "}
                {2 - cast.followups.length} of 2 included questions remaining.
              </Copy>
              {cast.followups.map((f) => (
                <View
                  key={f.id}
                  style={{
                    borderTopWidth: 1,
                    borderColor: colors.line,
                    paddingTop: 16,
                    gap: 10,
                  }}
                >
                  <Copy localize={false}>“{f.question}”</Copy>
                  <Copy muted localize={!f.answer}>
                    {f.answer ??
                      (f.status === "failed"
                        ? "This question could not be answered. Contact support for help."
                        : "Reflecting on your question…")}
                  </Copy>
                </View>
              ))}
              {safety && (
                <>
                  <Copy>{safety.message}</Copy>
                  {safety.resources.map((r: any) => (
                    <Button
                      key={r.name}
                      kind="secondary"
                      title={r.name + " ↗"}
                      onPress={() => Linking.openURL(r.url)}
                    />
                  ))}
                </>
              )}
              {cast.followups.length < 2 && (
                <>
                  <Field
                    label="Your follow-up question"
                    value={follow}
                    onChangeText={(v) => {
                      setFollow(v);
                      followRequest.current = null;
                    }}
                    multiline
                    maxLength={600}
                  />
                  <Button
                    title="Explore this question"
                    kind="secondary"
                    disabled={busy || follow.trim().length < 3}
                    onPress={() =>
                      void act(async () => {
                        followRequest.current ??= {
                          id: randomUUID(),
                          question: follow.trim(),
                        };
                        const r = await oracle(
                          "/oracle/casts/" + id + "/followups",
                          { body: followRequest.current },
                        );
                        if (r.safety) {
                          setSafety(r.safety);
                          return;
                        }
                        setCast(r.cast);
                        setFollow("");
                        followRequest.current = null;
                      })
                    }
                  />
                </>
              )}
            </Panel>
          )}
          <OracleClosingRitual
            key={cast.id}
            cast={cast}
            note={note}
            onNote={setNote}
            signedIn={Boolean(me)}
            waiting={paidWaiting}
            reflectionBusy={busy}
            reflectionForm={!cast.privateMode ? (dismiss) => (
              <>
            <Panel>
              <Eyebrow>YOUR ORACLE JOURNAL</Eyebrow>
              {me ? (
                <>
                  <Field
                    label="What does this bring up for you?"
                    placeholder="Your own words. Your own perspective."
                    value={note}
                    onChangeText={setNote}
                    multiline
                    maxLength={2000}
                  />
                  <Check checked={remember} onChange={setRemember}>
                    Use this reflection as memory in future readings.
                  </Check>
                  <Text style={s.small}>
                    Memory is separate from your journal and can be viewed or
                    deleted in your account. Only the words you choose to share
                    are remembered.
                  </Text>
                  <View style={s.row}>
                    <Button
                      title="Save reflection"
                      loading={busy}
                      onPress={() =>
                        void act(async () => {
                          if (remember && note.trim().length > 500)
                            throw new Error(
                              "Shared memory is limited to 500 characters. Shorten your reflection or save without memory.",
                            );
                          const r = await oracle("/oracle/casts/" + id, {
                            method: "PATCH",
                            body: { note, save: true },
                          });
                          setCast(r.cast);
                          if (remember && note.trim()) {
                            await api("/settings/memory", {
                              method: "PATCH",
                              body: { enabled: true },
                            });
                            await api("/feedback", {
                              body: { content: note.trim() },
                            });
                            await refresh();
                          }
                          setInfo("Your reflection is saved.");
                        })
                      }
                    />
                    <Button
                      title={
                        cast.favorite
                          ? "★ Saved to favorites"
                          : "☆ Add to favorites"
                      }
                      kind="secondary"
                      disabled={busy}
                      onPress={() =>
                        void act(async () => {
                          const r = await oracle("/oracle/casts/" + id, {
                            method: "PATCH",
                            body: { favorite: !cast.favorite },
                          });
                          setCast(r.cast);
                        })
                      }
                    />
                  </View>
                </>
              ) : (
                <>
                  <Copy muted>
                    Keep your reading and add your own reflections in a private
                    journal.
                  </Copy>
                  <Button
                    title="Sign in to save your reading"
                    kind="secondary"
                    onPress={() => { dismiss(); void signIn(); }}
                  />
                </>
              )}
            </Panel>
                <ErrorText>{error}</ErrorText>
                {!!info && <Text accessibilityLiveRegion="polite" style={{color:colors.green,fontSize:13}}>{info}</Text>}
              </>
            ) : undefined}
            onSignIn={signIn}
            onSave={async () => {
              const result = await oracle("/oracle/casts/" + id, {
                method: "PATCH",
                body: { note, save: true },
              });
              setCast(result.cast);
            }}
          />
          {cast.privateMode && (
            <Text style={s.small}>
              Temporary reading. It stays out of your journal and expires after
              24 hours.
            </Text>
          )}
          <ErrorText>{error}</ErrorText>
          {Boolean(info) && (
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: colors.green, fontSize: 13 }}
            >
              {info}
            </Text>
          )}
          <View style={s.row}>
            <Button
              title="Begin another reading  ↗"
              kind="secondary"
              onPress={() => router.push("/ask")}
            />
            <Button
              title="Our method & sources"
              kind="ghost"
              onPress={() => router.push("/method")}
            />
          </View>
          {!deleting ? (
            <Button
              title="Delete this reading"
              kind="ghost"
              onPress={() => setDeleting(true)}
            />
          ) : (
            <Panel>
              <Copy>
                Delete this reading and its follow-ups permanently? Necessary
                purchase records remain.
              </Copy>
              <Button
                title="Permanently delete reading"
                kind="danger"
                loading={busy}
                onPress={() =>
                  void act(async () => {
                    await oracle("/oracle/casts/" + id, { method: "DELETE" });
                    await latestCast.set(null);
                    router.replace("/journal");
                  })
                }
              />
              <Button
                title="Keep reading"
                kind="ghost"
                onPress={() => setDeleting(false)}
              />
            </Panel>
          )}
        </View>
      </View>
    </OracleShell>
  );
}

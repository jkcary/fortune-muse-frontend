import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { LocalizedText as Text } from "./LocalizedText";
import { Copy, Eyebrow, Panel } from "./OracleShell";
import { Button, ErrorText, Field } from "./ui";
import { useSession } from "@/lib/session";
import { currentLang } from "@/lib/i18n";
import { oracle, pendingCast, type OracleCast } from "@/lib/oracle";
import { updateLabel } from "@/lib/storyReturn";
import { OracleStoryUpdate } from "./OracleStoryUpdate";
import { colors, fonts } from "@/lib/theme";

export { STORY_STATUS } from "@/lib/storyReturn";
export function OracleStory({
  cast,
  suggestion,
  onUpdated,
}: {
  cast: OracleCast;
  suggestion: string;
  onUpdated: (cast: OracleCast) => void;
}) {
  const { me } = useSession();
  const [action, setAction] = useState(cast.journey?.action || suggestion);
  const [actionNotes, setActionNotes] = useState(
    cast.journey?.actionNotes ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const lock = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!cast.journey?.action) setAction(suggestion);
  }, [suggestion, cast.journey?.action]);
  async function save(body: object, message: string) {
    if (lock.current || updating) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const result = await oracle<{ cast: OracleCast }>(
        `/oracle/casts/${cast.id}/journey`,
        { method: "PATCH", body },
      );
      if (!alive.current) return;
      onUpdated(result.cast);
      setInfo(message);
    } catch {
      if (alive.current)
        setError(
          "Your story could not be saved. Your words are still here. Please try again.",
        );
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <Panel>
      <Eyebrow>YOUR NEXT CHAPTER</Eyebrow>
      <Text
        style={{ fontFamily: fonts.display, color: colors.ink, fontSize: 28 }}
      >
        {cast.journey?.followUpEnabled
          ? "How did your small step go?"
          : "Take one small possibility with you."}
      </Text>
      <Field
        label="My small next step"
        placeholder="Something I can try in ten minutes…"
        value={action}
        onChangeText={setAction}
        maxLength={400}
        multiline
        editable={!busy && !updating}
        style={{ minHeight: 92 }}
      />
      <Copy muted>
        {cast.privateMode
          ? "This temporary story expires after 24 hours and cannot be kept in your journal."
          : me
            ? "Keeping this step saves your question and action in your journal and shows it when you return. You can pause at any time."
            : "Keep this step for this guest session, up to 24 hours. Sign in to keep a non-temporary story across visits."}
      </Copy>
      <View
        style={{
          gap: 12,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.line,
        }}
      >
        <Text
          style={{ fontFamily: fonts.display, color: colors.ink, fontSize: 23 }}
        >
          Make room for the actual work.
        </Text>
        <Copy muted>
          Keep the instruction above. Write your list, draft, or answers here.
        </Copy>
        <Field
          label="My next-step work"
          value={actionNotes}
          onChangeText={setActionNotes}
          maxLength={6000}
          multiline
          editable={!busy && !updating}
          placeholder="Write names and the problem you could help each person solve, a message draft, or your own checklist…"
          style={{ minHeight: 190 }}
        />
        <Button
          title="Save my next-step work"
          kind="secondary"
          loading={busy}
          disabled={
            updating || actionNotes === (cast.journey?.actionNotes ?? "")
          }
          onPress={() =>
            void save(
              {
                actionNotes,
                ...(action.trim().length >= 3 ? { action: action.trim() } : {}),
              },
              cast.expiresAt || !cast.saved
                ? "Your work is saved with this temporary story, until it expires."
                : "Your next-step work is saved in this story.",
            )
          }
        />
      </View>
      <Button
        title={
          me && !cast.privateMode
            ? cast.journey?.followUpEnabled && cast.journey.status !== "paused"
              ? "Save my step"
              : "Keep this step & follow my story"
            : "Keep this step for now"
        }
        onPress={() =>
          void save(
            {
              action: action.trim(),
              followUpEnabled: Boolean(me && !cast.privateMode),
              ...(cast.journey?.status === "paused"
                ? { status: "planned" }
                : {}),
            },
            me && !cast.privateMode
              ? "Your story will be here when you return."
              : "Your step is saved for this temporary session.",
          )
        }
        loading={busy}
        disabled={updating || action.trim().length < 3}
      />
      {!me && !cast.privateMode && (
        <Button
          title="Sign in to keep this story"
          kind="ghost"
          disabled={busy || updating}
          onPress={() =>
            void (async () => {
              await pendingCast.set(cast.id);
              router.push("/sign-in");
            })()
          }
        />
      )}
      {!!cast.journey?.action && (
        <Button
          title="Rehearse this step with Selene"
          kind="secondary"
          onPress={() =>
            router.push({ pathname: "/companion", params: { castId: cast.id } })
          }
        />
      )}
      {!!cast.journey?.action && (
        <OracleStoryUpdate
          cast={cast}
          onUpdated={onUpdated}
          disabled={busy}
          onBusyChange={setUpdating}
        />
      )}
      {!!cast.journey?.updates.length && (
        <View style={{ gap: 18, paddingTop: 15 }}>
          {cast.journey.updates
            .slice()
            .reverse()
            .map((update) => (
              <View
                key={update.id}
                style={{
                  borderLeftWidth: 1,
                  borderColor: colors.gold,
                  paddingLeft: 16,
                  gap: 8,
                }}
              >
                <Text style={{ color: colors.gold, fontSize: 11 }}>
                  {updateLabel(update)} ·{" "}
                  <Text localize={false}>
                    {new Date(update.createdAt).toLocaleDateString(
                      currentLang(),
                      { month: "short", day: "numeric" },
                    )}
                  </Text>
                </Text>
                {!!update.text && <Copy localize={false}>{update.text}</Copy>}
              </View>
            ))}
        </View>
      )}
      {cast.journey?.followUpEnabled && (
        <Button
          title="Pause following this story"
          kind="ghost"
          disabled={busy || updating}
          onPress={() =>
            void save(
              { followUpEnabled: false, status: "paused" },
              "Story paused. Your journal still keeps your words.",
            )
          }
        />
      )}
      <ErrorText>{error}</ErrorText>
      {!!info && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.green, fontSize: 12, lineHeight: 21 }}
        >
          {info}
        </Text>
      )}
    </Panel>
  );
}

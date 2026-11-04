import type { OracleCast, OracleJourney } from "./oracle-contract";

export const STORY_STATUS = {
  planned: "A step to try",
  tried: "I tried it",
  waiting: "Still exploring",
  paused: "Taking a pause",
} as const;
/** Milestones come only from recorded choices, never from page visits or outcomes. */
export function chapterSteps(cast: OracleCast): [boolean, boolean, boolean] {
  const j=cast.journey;
  return [Boolean(j?.selectedDoor || j?.doorExercise || j?.feedback==='misses' || j?.action), Boolean(j?.action), Boolean(j?.action && j.updates.length)];
}
export function updateLabel(update: OracleJourney["updates"][number]) {
  return update.kind === "changed"
    ? "Something changed"
    : STORY_STATUS[update.status];
}
export function isSavedReading(cast: OracleCast, now = Date.now()) {
  return Boolean(
    cast.saved &&
    !cast.privateMode &&
    cast.basis &&
    (!cast.expiresAt || new Date(cast.expiresAt).getTime() > now),
  );
}
export function isKeptStory(cast: OracleCast, now = Date.now()) {
  return isSavedReading(cast, now) && Boolean(cast.journey?.action);
}
export function isFollowing(cast: OracleCast) {
  return (
    isKeptStory(cast) &&
    cast.journey!.followUpEnabled &&
    cast.journey!.status !== "paused"
  );
}
export function lastChapterAt(cast: OracleCast) {
  return Math.max(
    new Date(cast.createdAt).getTime(),
    ...(cast.journey?.updates ?? []).map((u) =>
      new Date(u.createdAt).getTime(),
    ),
  );
}
export function selectReturnStory(
  casts: OracleCast[],
  currentId: string | null,
  hidden: string[] = [],
) {
  const active = casts.filter((c) => isFollowing(c) && !hidden.includes(c.id));
  return (
    active.find((c) => c.id === currentId) ??
    active.sort(
      (a, b) => lastChapterAt(a) - lastChapterAt(b) || a.id.localeCompare(b.id),
    )[0] ??
    null
  );
}
/** Ignore late responses so a saved chapter never disappears from the current view. */
export function mergeStory(previous: OracleCast, next: OracleCast) {
  return new Date(previous.updatedAt ?? previous.createdAt).getTime() >
    new Date(next.updatedAt ?? next.createdAt).getTime()
    ? previous
    : next;
}

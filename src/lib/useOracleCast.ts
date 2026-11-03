import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { oracle, type OracleCast } from "./oracle";

export function useOracleCast(id: string) {
  const [cast, setCast] = useState<OracleCast | null>(null);
  const [error, setError] = useState("");
  const alive = useRef(true);
  const reload = useCallback(async () => {
    try {
      const data = await oracle<{ cast: OracleCast }>("/oracle/casts/" + id);
      if (alive.current) {
        setCast(data.cast);
        setError("");
      }
      return data.cast;
    } catch (e: any) {
      if (alive.current) setError(e.message);
      return null;
    }
  }, [id]);
  useEffect(() => {
    alive.current = true;
    setCast(null);
    void reload();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void reload();
    });
    return () => {
      alive.current = false;
      sub.remove();
    };
  }, [reload]);
  const waiting = Boolean(
    cast &&
    (["awaiting_payment", "queued", "generating", "refunding"].includes(
      cast.premiumStatus,
    ) ||
      cast.followups.some((f) => f.status === "pending")),
  );
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => void reload(), 4000);
    return () => clearInterval(timer);
  }, [waiting, reload]);
  useEffect(() => {
    if (!cast?.expiresAt) return;
    const remaining = new Date(cast.expiresAt).getTime() - Date.now();
    const expire = () => {
      setCast(null);
      setError(
        "This temporary reading has expired. Begin a new reading to continue.",
      );
    };
    if (remaining <= 0) {
      expire();
      return;
    }
    const timer = setTimeout(expire, Math.min(remaining, 2147483647));
    return () => clearTimeout(timer);
  }, [cast?.expiresAt]);
  return { cast, setCast, error, setError, reload };
}

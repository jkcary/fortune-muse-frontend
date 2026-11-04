import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { api } from "./api";
import { useSession } from "./session";
import {
  GARDEN_LEVELS,
  earnedDecor,
  lightState,
  type GardenState,
} from "./garden-engine";

export const gardenStore = {
  async get(key: string) {
    return Platform.OS === "web"
      ? (globalThis.localStorage?.getItem(key) ?? null)
      : SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === "web") {
      if (!globalThis.localStorage) throw new Error("Storage unavailable");
      globalThis.localStorage.setItem(key, value);
    } else await SecureStore.setItemAsync(key, value);
  },
};
export function todayOnDevice() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const empty = (): GardenState => ({
  completed: [],
  decor: [],
  momentCount: 0,
  todayKind: null,
  today: todayOnDevice(),
});
function guestState(raw: string | null): GardenState {
  if (!raw) return empty();
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.completed) || !Array.isArray(parsed.decor))
    throw new Error("Invalid saved garden");
  const completed: number[] = [];
  for (
    let i = 1;
    i <= GARDEN_LEVELS.length && parsed.completed.includes(i);
    i++
  )
    completed.push(i);
  const earned = earnedDecor(completed).map((d) => d.id as string);
  return {
    ...empty(),
    completed,
    decor: [
      ...new Set<string>(
        parsed.decor.filter(
          (d: unknown) => typeof d === "string" && earned.includes(d),
        ),
      ),
    ],
    momentCount: Number.isInteger(parsed.momentCount)
      ? Math.max(0, parsed.momentCount)
      : 0,
    todayKind:
      parsed.today === todayOnDevice() &&
      ["joy", "discovery", "question"].includes(parsed.todayKind)
        ? parsed.todayKind
        : null,
  };
}
interface GardenContext {
  state: GardenState;
  available: boolean;
  loading: boolean;
  busy: boolean;
  error: string;
  reload: () => void;
  resetGuest: () => Promise<void>;
  complete: (level: number, rotations: number[]) => Promise<boolean>;
  decorate: (decor: string[]) => Promise<boolean>;
  moment: (kind: string) => Promise<boolean>;
}
const Context = createContext<GardenContext | null>(null);
export function GardenProvider({ children }: { children: ReactNode }) {
  const { me, ready } = useSession();
  const [state, setState] = useState<GardenState>(empty);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const identity = me?.id ?? "guest";
  const owner = useRef(identity);
  owner.current = identity;
  const current = useRef(state);
  current.current = state;
  const lock = useRef(false);
  const loadedOwner = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    loadedOwner.current = null;
    setLoading(true);
    setError("");
    setState(empty());
    void (async () => {
      try {
        const next = me
          ? await api<GardenState>("/garden")
          : guestState(await gardenStore.get("oracle_garden_guest_v1"));
        if (alive) {
          current.current = next;
          setState(next);
          loadedOwner.current = identity;
        }
      } catch {
        if (alive) setError("Your garden could not load. Please retry.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [identity, ready, revision]);
  async function mutate(
    path: string,
    body: object,
    update: (s: GardenState) => GardenState,
    method = "POST",
  ) {
    if (lock.current || loading || loadedOwner.current !== identity)
      return false;
    const requestOwner = identity;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const next = me
        ? await api<GardenState>(path, { method, body })
        : update(current.current);
      if (!me)
        await gardenStore.set("oracle_garden_guest_v1", JSON.stringify(next));
      if (owner.current !== requestOwner) return false;
      current.current = next;
      setState(next);
      return true;
    } catch {
      if (owner.current === requestOwner)
        setError("Your progress could not be saved. Please retry.");
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        state: loadedOwner.current === identity ? state : empty(),
        available: loadedOwner.current === identity,
        loading,
        busy,
        error,
        reload: () => setRevision((n) => n + 1),
        resetGuest: async () => {
          if (me || lock.current) return;
          lock.current = true;
          setBusy(true);
          try {
            await gardenStore.set("oracle_garden_draft_guest", "");
            await gardenStore.set(
              "oracle_garden_guest_v1",
              JSON.stringify(empty()),
            );
            setRevision((n) => n + 1);
          } catch {
            setError("Your progress could not be saved. Please retry.");
          } finally {
            lock.current = false;
            setBusy(false);
          }
        },
        complete: (level, rotations) => {
          const puzzle = GARDEN_LEVELS[level - 1];
          if (
            !puzzle ||
            level > current.current.completed.length + 1 ||
            !lightState(puzzle, rotations).solved
          )
            return Promise.resolve(false);
          return mutate("/garden/complete", { level, rotations }, (s) => ({
            ...s,
            completed: [...new Set([...s.completed, level])].sort(
              (a, b) => a - b,
            ),
          }));
        },
        decorate: (decor) =>
          mutate(
            "/garden/decor",
            { decor },
            (s) => ({
              ...s,
              decor: [...new Set(decor)].filter((d) =>
                earnedDecor(s.completed).some((e) => e.id === d),
              ),
            }),
            "PATCH",
          ),
        moment: (kind) =>
          mutate("/garden/moment", { kind }, (s) =>
            s.today === todayOnDevice() && s.todayKind
              ? s
              : {
                  ...s,
                  today: todayOnDevice(),
                  todayKind: kind,
                  momentCount: s.momentCount + 1,
                },
          ),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useGarden() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing GardenProvider");
  return context;
}

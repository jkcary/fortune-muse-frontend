import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api, setApiToken, type Me } from "./api";
import { tokenStore } from "./storage";

interface Session {
  ready: boolean;
  me: Me | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<Me | null>;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const refresh = useCallback(async () => {
    try {
      const m = await api<Me>("/me");
      setMe(m);
      return m;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setMe(null);
        setApiToken(null);
        await tokenStore.set(null);
        return null;
      }
      throw e;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const t = await tokenStore.get();
      if (t) {
        setApiToken(t);
        const m = await refresh().catch(() => undefined);
        if (m === null) {
          setApiToken(null);
          await tokenStore.set(null);
        }
      }
      setReady(true);
    })();
  }, [refresh]);

  const signIn = useCallback(
    async (token: string) => {
      setApiToken(token);
      await tokenStore.set(token);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    setApiToken(null);
    await tokenStore.set(null);
    setMe(null);
  }, []);

  // Screens mount only after the saved token is restored, so their first API calls are authenticated.
  return (
    <Ctx.Provider value={{ ready, me, signIn, signOut, refresh }}>
      {ready ? children : null}
    </Ctx.Provider>
  );
}

export function useSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useSession outside SessionProvider");
  return s;
}

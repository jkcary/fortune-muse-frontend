import { randomUUID } from "expo-crypto";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { api } from "./api";

import type { OracleCast } from "./oracle-contract";
export type { Hexagram, Basis, OracleCast, Catalog } from "./oracle-contract";
async function get(key: string) {
  if (Platform.OS === "web") {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}
async function set(key: string, value: string | null) {
  if (Platform.OS === "web") {
    try {
      if (value) sessionStorage.setItem(key, value);
      else sessionStorage.removeItem(key);
    } catch {}
    return;
  }
  if (value) await SecureStore.setItemAsync(key, value);
  else await SecureStore.deleteItemAsync(key);
}
export const pendingCast = {
  get: () => get("oracle_pending"),
  set: (id: string | null) => set("oracle_pending", id),
};
export const latestCast = {
  get: () => get("oracle_latest"),
  set: (id: string | null) => set("oracle_latest", id),
};
// Browser tokens stay in this tab's session storage; private questions are never stored here.
export async function oracle<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; signal?: AbortSignal } = {},
) {
  const id = path.match(/^\/oracle\/casts\/([^/]+)/)?.[1];
  const token = id ? await get(`oracle_${id}`) : null;
  return api<T>(path, {
    ...opts,
    headers: token ? { "X-Oracle-Token": token } : {},
  });
}
export async function newCast(
  body: {
    topic: "wealth" | "love";
    question: string;
    context: string;
    privateMode: boolean;
    ageConfirmed: boolean;
    informationConfirmed: true;
  },
  retry?: { id: string; token: string },
) {
  const credentials = retry ?? {
    id: randomUUID(),
    token: randomUUID() + randomUUID(),
  };
  await set(`oracle_${credentials.id}`, credentials.token);
  const response = await oracle<{ cast: OracleCast; safety?: any }>(
    "/oracle/casts",
    { body: { ...body, ...credentials } },
  );
  if (response.cast) await latestCast.set(response.cast.id);
  return response;
}

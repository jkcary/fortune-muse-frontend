import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Native: Keychain / Keystore. Web: localStorage.
export const tokenStore = {
  async get(): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return globalThis.localStorage?.getItem("fm_token") ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync("fm_token");
  },
  async set(token: string | null) {
    if (Platform.OS === "web") {
      try {
        if (token) globalThis.localStorage?.setItem("fm_token", token);
        else globalThis.localStorage?.removeItem("fm_token");
      } catch {}
      return;
    }
    if (token) await SecureStore.setItemAsync("fm_token", token);
    else await SecureStore.deleteItemAsync("fm_token");
  },
};

/** The app language picked on this device (not secret, so plain storage on web). */
export const langStore = {
  async get(): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return globalThis.localStorage?.getItem("fm_lang") ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync("fm_lang");
  },
  async set(lang: string) {
    if (Platform.OS === "web") {
      if (!globalThis.localStorage)
        throw new Error("Language storage unavailable");
      globalThis.localStorage.setItem("fm_lang", lang);
      return;
    }
    await SecureStore.setItemAsync("fm_lang", lang);
  },
};

/** Local sound choice; never synced to a reading or an account. */
export const coinSoundStore = {
  async get(): Promise<boolean> {
    try {
      const value =
        Platform.OS === "web"
          ? globalThis.localStorage?.getItem("oracle_coin_sound")
          : await SecureStore.getItemAsync("oracle_coin_sound");
      return value !== "off";
    } catch {
      return true;
    }
  },
  async set(enabled: boolean) {
    try {
      const value = enabled ? "on" : "off";
      if (Platform.OS === "web")
        globalThis.localStorage?.setItem("oracle_coin_sound", value);
      else await SecureStore.setItemAsync("oracle_coin_sound", value);
    } catch {
      /* The in-session toggle still works when local persistence is blocked. */
    }
  },
};

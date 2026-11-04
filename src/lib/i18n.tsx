import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { EN_GB, KEYED, ZH } from "./strings";
import { ZH_CHAT } from "./strings.chat";
import { ORACLE_ZH, ORACLE_GB } from "./strings.oracle";
import { STORY_ZH } from "./strings.story";
import { GARDEN_ZH } from "./strings.garden";
import { ARCHIVE_ZH } from "./strings.archive";
import { langStore } from "./storage";

export type Lang = "en-US" | "en-GB" | "zh-Hans" | "zh-Hant";
export const DEFAULT_LANGUAGE: Lang = "en-US";

/** Shown in each language's own name, so people can find theirs whatever the current language is. */
export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: "en-US", label: "English US" },
  { id: "en-GB", label: "English UK" },
  { id: "zh-Hans", label: "简体中文" },
  { id: "zh-Hant", label: "繁體中文" },
];

export const isLang = (v: unknown): v is Lang =>
  LANGUAGES.some((l) => l.id === v);

const zhIndex = { "zh-Hans": 1, "zh-Hant": 2 } as const;
const TABLE: Record<"zh-Hans" | "zh-Hant", Map<string, string>> = {
  "zh-Hans": new Map(),
  "zh-Hant": new Map(),
};
for (const row of [...ZH, ...ZH_CHAT, ...ORACLE_ZH, ...STORY_ZH, ...GARDEN_ZH, ...ARCHIVE_ZH]) {
  TABLE["zh-Hans"].set(row[0], row[1]);
  TABLE["zh-Hant"].set(row[0], row[2]);
}

export type Vars = Record<string, string | number>;

export function translate(lang: Lang, text: string, vars?: Vars): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const prefix = clean.match(/^[★☆✓＋−]\s*/)?.[0] ?? "";
  const suffix = clean.match(/\s*[↗＋−]$/)?.[0] ?? "";
  const core = clean
    .slice(prefix.length, suffix ? clean.length - suffix.length : undefined)
    .trim();
  const find = (key: string): string | undefined => {
    const keyed = KEYED[key];
    if (lang === "zh-Hans" || lang === "zh-Hant")
      return keyed ? keyed[zhIndex[lang]] : TABLE[lang].get(key);
    return keyed
      ? keyed[0]
      : lang === "en-GB"
        ? (ORACLE_GB[key] ?? EN_GB[key])
        : undefined;
  };
  const exact = find(text) ?? find(clean);
  let out =
    exact ??
    ((prefix || suffix) && find(core) !== undefined
      ? prefix + find(core) + suffix
      : text);
  return vars
    ? out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
    : out;
}

// Current language for code outside React (money formatting, API calls).
let current: Lang = DEFAULT_LANGUAGE;
export const currentLang = () => current;

/** USD prices in the user's locale, e.g. $3.00 / US$3.00. */
export const formatMoney = (cents: number) =>
  new Intl.NumberFormat(current, { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString(current);
export const formatDateTime = (d: string | Date) =>
  new Date(d).toLocaleString(current);

interface I18n {
  lang: Lang;
  t: (text: string, vars?: Vars) => string;
  setLang: (language: Lang) => Promise<void>;
  adoptAccountLanguage: (
    language: Lang | null,
    accountId: string | null,
  ) => void;
  languageSaving: boolean;
  languageError: string | null;
}
const Ctx = createContext<I18n | null>(null);
export function LanguageProvider({
  children,
  onChange,
}: {
  children: ReactNode;
  onChange?: (language: Lang) => void | Promise<void>;
}) {
  const [lang, setLangState] = useState<Lang>(current);
  const [languageSaving, setSaving] = useState(false);
  const [languageError, setError] = useState<string | null>(null);
  const revision = useRef(0);
  const account = useRef<string | null>(null);
  const picked = useRef<Lang | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    const initial = revision.current;
    void langStore
      .get()
      .then((saved) => {
        if (initial === revision.current && isLang(saved)) {
          current = saved;
          setLangState(saved);
        }
      })
      .catch(() => {});
  }, []);
  const adoptAccountLanguage = useCallback(
    (language: Lang | null, id: string | null) => {
      if (id === null) {
        account.current = null;
        picked.current = null;
        return;
      }
      if (!language) return;
      const differentAccount = account.current !== id;
      account.current = id;
      if (!differentAccount && picked.current) return;
      if (differentAccount) {
        picked.current = null;
        setSaving(false);
      }
      revision.current++;
      current = language;
      setLangState(language);
      void langStore.set(language).catch(() => {});
    },
    [],
  );
  const setLang = useCallback(
    (language: Lang) => {
      const version = ++revision.current;
      const owner = account.current;
      picked.current = language;
      current = language;
      setLangState(language);
      setError(null);
      setSaving(true);
      const operation = queue.current
        .catch(() => {})
        .then(async () => {
          await langStore.set(language);
          if (owner === account.current) await onChange?.(language);
        });
      queue.current = operation;
      return operation
        .catch(() => {
          if (version === revision.current)
            setError(
              "Your language could not be synced. Check your connection and try again.",
            );
        })
        .finally(() => {
          if (version === revision.current) setSaving(false);
        });
    },
    [onChange],
  );
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      adoptAccountLanguage,
      languageSaving,
      languageError,
      t: (text, vars) => translate(lang, text, vars),
    }),
    [lang, setLang, adoptAccountLanguage, languageSaving, languageError],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useI18n(): I18n {
  const value = useContext(Ctx);
  if (!value) throw new Error("useI18n outside LanguageProvider");
  return value;
}
export const useT = () => useI18n().t;

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EN_GB, KEYED, ZH } from './strings';
import { langStore } from './storage';

export type Lang = 'en-US' | 'en-GB' | 'zh-Hans' | 'zh-Hant';

/** Shown in each language's own name, so people can find theirs whatever the current language is. */
export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'zh-Hans', label: '简体中文' },
  { id: 'zh-Hant', label: '繁體中文' },
  { id: 'en-GB', label: 'English (UK)' },
  { id: 'en-US', label: 'English (US)' },
];

export const isLang = (v: unknown): v is Lang => LANGUAGES.some((l) => l.id === v);

/** Device locale → app language: zh-TW / HK / MO / Hant → zh-Hant, other zh → zh-Hans, en-GB → en-GB, else en-US. */
export function deviceLanguage(): Lang {
  let tag = '';
  try { tag = (globalThis.navigator?.language || Intl.DateTimeFormat().resolvedOptions().locale || '').toLowerCase(); } catch {}
  if (tag.startsWith('zh')) return /hant|-tw|-hk|-mo/.test(tag) ? 'zh-Hant' : 'zh-Hans';
  if (tag === 'en-gb' || tag.startsWith('en-gb-')) return 'en-GB';
  return 'en-US';
}

const zhIndex = { 'zh-Hans': 1, 'zh-Hant': 2 } as const;
const TABLE: Record<'zh-Hans' | 'zh-Hant', Map<string, string>> = { 'zh-Hans': new Map(), 'zh-Hant': new Map() };
for (const row of ZH) {
  TABLE['zh-Hans'].set(row[0], row[1]);
  TABLE['zh-Hant'].set(row[0], row[2]);
}

export type Vars = Record<string, string | number>;

export function translate(lang: Lang, text: string, vars?: Vars): string {
  let out: string;
  const keyed = KEYED[text];
  if (lang === 'zh-Hans' || lang === 'zh-Hant') out = keyed ? keyed[zhIndex[lang]] : TABLE[lang].get(text) ?? text;
  else out = keyed ? keyed[0] : lang === 'en-GB' ? EN_GB[text] ?? text : text;
  return vars ? out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : out;
}

// Current language for code outside React (money formatting, API calls).
let current: Lang = deviceLanguage();
export const currentLang = () => current;

/** USD prices in the user's locale, e.g. $3.00 / US$3.00. */
export const formatMoney = (cents: number) =>
  new Intl.NumberFormat(current, { style: 'currency', currency: 'USD' }).format(cents / 100);
export const formatDate = (d: string | Date) => new Date(d).toLocaleDateString(current);
export const formatDateTime = (d: string | Date) => new Date(d).toLocaleString(current);

interface I18n {
  lang: Lang;
  t: (text: string, vars?: Vars) => string;
  /** Changes the language now and remembers it on this device; `onChange` saves it to the account. */
  setLang: (l: Lang) => void;
}

const Ctx = createContext<I18n | null>(null);

export function LanguageProvider({ children, onChange }: { children: ReactNode; onChange?: (l: Lang) => void }) {
  const [lang, setLangState] = useState<Lang>(current);
  useEffect(() => {
    langStore.get().then((saved) => { if (isLang(saved) && saved !== current) { current = saved; setLangState(saved); } });
  }, []);

  const setLang = useCallback((l: Lang) => {
    if (l === current) return;
    current = l;
    setLangState(l);
    void langStore.set(l);
    onChange?.(l);
  }, [onChange]);

  const value = useMemo<I18n>(() => ({ lang, setLang, t: (text, vars) => translate(lang, text, vars) }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const c = useContext(Ctx);
  if (!c) throw new Error('useI18n outside LanguageProvider');
  return c;
}
export const useT = () => useI18n().t;

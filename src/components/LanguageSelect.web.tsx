import { useState } from "react";
import { isLang, LANGUAGES, useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";

/** An intrinsic-width pill keeps the label and chevron together; the native select handles input. */
export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t, languageSaving } = useI18n();
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        height: 40,
        boxSizing: "border-box",
        padding: compact ? "0 12px" : "0 18px",
        border: "1px solid #70516F",
        borderRadius: 999,
        backgroundColor: "transparent",
        outline: focused ? `2px solid ${colors.gold}` : undefined,
        outlineOffset: 3,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          whiteSpace: "nowrap",
          fontSize: 12,
          fontWeight: 400,
          lineHeight: "16px",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          color: colors.ink,
        }}
      >
        <span>{LANGUAGES.find((language) => language.id === lang)?.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{ color: colors.gold, flexShrink: 0 }}
        >
          <path
            d="M2 3.5 5 6.5 8 3.5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <select
        aria-label={t("Language")}
        aria-busy={languageSaving}
        value={lang}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          if (isLang(event.target.value)) void setLang(event.target.value);
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "pointer",
          colorScheme: "dark",
        }}
      >
        {LANGUAGES.map((language) => (
          <option key={language.id} value={language.id} lang={language.id}>
            {language.label}
          </option>
        ))}
      </select>
    </div>
  );
}

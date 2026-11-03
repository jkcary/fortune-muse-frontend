import { Platform, Share } from "react-native";
import { currentLang, translate } from "./i18n";
import type { OracleCast } from "./oracle";
export type OracleCardOptions = {
  closing?: boolean;
  includePersonalQuote?: boolean;
};
const esc = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
/** Only approved public fields enter the export; questions, notes and context are excluded. */
export function oracleCardSvg(
  cast: OracleCast,
  options: OracleCardOptions = {},
): string {
  if (!cast.basis) return "";
  if (options.closing) return closingCardSvg(cast, options);
  const source = cast.basis.primary;
  const language = currentLang();
  const h = {
    ...source,
    name: translate(language, source.name),
    keyword: translate(language, source.keyword),
    meaning: translate(language, source.meaning),
  };
  const lines = [...h.bits]
    .map((b, i) => {
      const y = 770 - i * 52;
      return b === "1"
        ? '<rect x="340" y="' + y + '" width="400" height="18" fill="#E8C8A0"/>'
        : '<rect x="340" y="' +
            y +
            '" width="170" height="18" fill="#E8C8A0"/><rect x="570" y="' +
            y +
            '" width="170" height="18" fill="#E8C8A0"/>';
    })
    .join("");
  const chinese = /[\u3400-\u9FFF]/.test(h.meaning);
  const words = chinese ? Array.from(h.meaning) : h.meaning.split(" ");
  const rows: string[] = [];
  let line = "";
  const separator = chinese ? "" : " ";
  for (const word of words) {
    const next = line + (line ? separator : "") + word;
    if (line && next.length > (chinese ? 26 : 43)) {
      rows.push(line);
      line = word;
    } else line = next;
  }
  if (line) rows.push(line);
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="#15101F"/><rect x="55" y="55" width="970" height="1810" rx="18" stroke="#71536F" fill="none"/><circle cx="540" cy="640" r="330" fill="none" stroke="#71536F"/><circle cx="540" cy="640" r="380" fill="none" stroke="#46314F"/><text x="540" y="190" text-anchor="middle" fill="#E8C8A0" font-family="Georgia" font-size="34" letter-spacing="9">ORACLE ONE</text>' +
    lines +
    '<text x="540" y="1070" text-anchor="middle" fill="#C1B5CF" font-family="sans-serif" font-size="24" letter-spacing="7">' +
    translate(language, "HEXAGRAM") +
    " " +
    h.number +
    '</text><text x="540" y="1180" text-anchor="middle" fill="#FAF1FA" font-family="Georgia" font-size="64">' +
    esc(h.name) +
    '</text><text x="540" y="1250" text-anchor="middle" fill="#E8C8A0" font-family="Georgia" font-size="35">' +
    esc(h.keyword) +
    "</text>" +
    rows
      .map(
        (r, i) =>
          '<text x="540" y="' +
          (1390 + i * 46) +
          '" text-anchor="middle" fill="#C1B5CF" font-family="sans-serif" font-size="28">' +
          esc(r) +
          "</text>",
      )
      .join("") +
    '<text x="540" y="1750" text-anchor="middle" fill="#C1B5CF" font-family="sans-serif" font-size="19">' +
    translate(
      language,
      "For adults 18+. Entertainment and personal reflection.",
    ) +
    "</text></svg>";
  return svg;
}
export async function shareOracle(
  cast: OracleCast,
  nativePng?: () => Promise<string>,
  options: OracleCardOptions = {},
) {
  if (!cast.basis) return;
  const h = cast.basis.primary;
  if (Platform.OS !== "web") {
    if (!nativePng) {
      await Share.share({
        message: "ORACLE ONE · " + h.name + "\n" + h.meaning,
      });
      return;
    }
    const FileSystem = await import("expo-file-system/legacy");
    const Sharing = await import("expo-sharing");
    if (!(await Sharing.isAvailableAsync()))
      throw new Error("Sharing is not available on this device.");
    if (!FileSystem.cacheDirectory)
      throw new Error("Image storage is not available on this device.");
    const uri = FileSystem.cacheDirectory + "oracle-one-" + h.number + ".png";
    await FileSystem.writeAsStringAsync(uri, await nativePng(), {
      encoding: FileSystem.EncodingType.Base64,
    });
    try {
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: "Share your oracle card",
      });
    } finally {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
    return;
  }
  const svg = oracleCardSvg(cast, options);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error("Image export failed. Please try again."));
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser does not support image export.");
    ctx.drawImage(img, 0, 0);
    const png = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.download = "oracle-one-" + h.number + ".png";
    a.href = png;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Closing cards use public editorial words unless the user explicitly includes the personal prompt. */
function closingCardSvg(cast: OracleCast, options: OracleCardOptions) {
  const h = cast.basis!.primary;
  const lang = currentLang();
  const t = (text: string) => esc(translate(lang, text));
  const accent = cast.topic === "love" ? "#EAC3D9" : "#EBD3AA";
  const quote =
    options.includePersonalQuote && cast.premium
      ? cast.premium.reflection
      : translate(lang, h.meaning);
  const chinese = /[\u3400-\u9FFF]/.test(quote);
  const rows: string[] = [];
  let line = "";
  for (const word of chinese
    ? Array.from(quote)
    : quote
        .split(/\s+/)
        .flatMap((w) => (w.length > 40 ? w.match(/.{1,40}/gu)! : [w]))) {
    const next = line + (line && !chinese ? " " : "") + word;
    if (line && next.length > (chinese ? 24 : 43)) {
      rows.push(line);
      line = word;
    } else line = next;
  }
  if (line) rows.push(line);
  const lines = [...h.bits]
    .map((b, i) => {
      const y = 764 - i * 47;
      return b === "1"
        ? `<rect x="383" y="${y}" width="314" height="13" rx="2" fill="${accent}"/>`
        : `<rect x="383" y="${y}" width="132" height="13" rx="2" fill="${accent}"/><rect x="565" y="${y}" width="132" height="13" rx="2" fill="${accent}"/>`;
    })
    .join("");
  const date = new Date(cast.createdAt).toLocaleDateString(lang, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const lineStep = Math.min(37, Math.floor(365 / Math.max(rows.length, 1)));
  const quoteSize = Math.min(27, lineStep * 0.8);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><radialGradient id="sky"><stop stop-color="#4A315A"/><stop offset="1" stop-color="#160F23"/></radialGradient><radialGradient id="pearl" cx="30%" cy="22%" r="82%"><stop stop-color="#FFF9E9"/><stop offset=".3" stop-color="#DDCEE7"/><stop offset=".65" stop-color="#8C78A0"/><stop offset="1" stop-color="#382743"/></radialGradient></defs>
  <rect width="1080" height="1920" fill="url(#sky)"/><rect x="44" y="44" width="992" height="1832" rx="45" stroke="${accent}" stroke-opacity=".32" fill="none"/>
  <text x="540" y="169" text-anchor="middle" fill="${accent}" font-family="Georgia" font-size="31" letter-spacing="9">ORACLE ONE</text>
  <text x="540" y="236" text-anchor="middle" fill="#CDBED7" font-family="sans-serif" font-size="23">${t("THE RETURNING LIGHT")}</text>
  <circle cx="540" cy="646" r="343" fill="none" stroke="${accent}" stroke-opacity=".22"/><circle cx="540" cy="646" r="317" fill="none" stroke="${accent}" stroke-opacity=".6"/>
  <ellipse cx="540" cy="646" rx="377" ry="123" transform="rotate(-28 540 646)" fill="none" stroke="${accent}" stroke-opacity=".3"/>
  <circle cx="540" cy="646" r="267" fill="url(#pearl)" stroke="${accent}" stroke-width="2"/><circle cx="540" cy="646" r="191" fill="#271A38" fill-opacity=".77" stroke="${accent}" stroke-opacity=".5"/>${lines}
  <path d="M540 284 546 300 540 316 534 300Z M540 976 546 992 540 1008 534 992Z" fill="${accent}"/>
  <text x="540" y="1085" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-size="23">${t("HEXAGRAM")} ${h.number.toString().padStart(2, "0")}</text>
  <text x="540" y="1173" text-anchor="middle" fill="#FFF5F5" font-family="Georgia" font-size="61">${t(h.name)}</text>
  <text x="540" y="1237" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-size="24">${t(cast.topic === "love" ? "Love & Connection" : "Wealth & Career")} · ${esc(date)}</text>
  ${rows
    .map(
      (row, i) =>
        `<text x="540" y="${1340 + i * lineStep}" text-anchor="middle" fill="#E4D8E9" font-family="sans-serif" font-size="${quoteSize}">${esc(row)}</text>`,
    )
    .join("")}
  <text x="540" y="1785" text-anchor="middle" fill="${accent}" font-family="Georgia" font-size="26">${t("The next step is yours.")}</text>
  <text x="540" y="1830" text-anchor="middle" fill="#B9A8C6" font-family="sans-serif" font-size="16">${t("For adults 18+. Entertainment and personal reflection.")}</text></svg>`;
}

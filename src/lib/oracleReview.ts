import { translate, type Lang } from "./i18n";

export const REVIEW_FIELDS = [
  ["situation", "Current situation"],
  ["focus", "Main concern"],
  ["goal", "Desired outcome"],
  ["timeframe", "Time frame"],
  ["notes", "Notes"],
  ["additionalInformation", "Additional information"],
] as const;
export type ReviewKey = (typeof REVIEW_FIELDS)[number][0];
export type ReviewFields = Record<ReviewKey, string>;
export const emptyReview = (): ReviewFields => ({
  situation: "",
  focus: "",
  goal: "",
  timeframe: "",
  notes: "",
  additionalInformation: "",
});
export function reviewContext(fields: ReviewFields, lang: Lang) {
  return REVIEW_FIELDS.filter(([key]) => fields[key].trim())
    .map(([key, label]) => `${translate(lang, label)}: ${fields[key].trim()}`)
    .join("\n");
}

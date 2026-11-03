import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { randomUUID } from "expo-crypto";
import { api } from "./api";
import { useI18n } from "./i18n";
import { newCast } from "./oracle";
import {
  emptyReview,
  reviewContext,
  type ReviewFields,
  type ReviewKey,
} from "./oracleReview";

export type EncounterTurn = {
  role: "user" | "assistant";
  text: string;
  aiGenerated?: boolean;
};
export function useOracleEncounter(topic: "wealth" | "love") {
  const { lang } = useI18n();
  const [phase, setPhase] = useState<"conversation" | "review">("conversation");
  const [turns, setTurns] = useState<EncounterTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [fields, setFields] = useState<ReviewFields>(emptyReview);
  const [organizing, setOrganizing] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [aiOrganized, setAiOrganized] = useState(false);
  const reviewRequest = useRef<AbortController | null>(null);
  const reviewCache = useRef<{
    signature: string;
    fields: ReviewFields;
    ai: boolean;
  } | null>(null);
  const [adult, setAdult] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [safety, setSafety] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const request = useRef<AbortController | null>(null);
  const active = useRef(true);
  const lock = useRef(false);
  const saveLock = useRef(false);
  const retry = useRef<{ signature: string; id: string; token: string } | null>(
    null,
  );
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      request.current?.abort();
      reviewRequest.current?.abort();
    };
  }, []);
  const maxLength = question
    ? Math.min(300, Math.max(0, 1200 - context.length - (context ? 2 : 0)))
    : 600;
  const greeting =
    topic === "love"
      ? "Welcome. I’m Selene. What would you like to understand about your relationships or your heart today?"
      : "Welcome. I’m Selene. What is on your mind about your work, ambitions, or relationship with money?";
  const latest = turns.filter((turn) => turn.role === "assistant").at(-1);
  async function organize(q: string, c: string, force = false) {
    reviewRequest.current?.abort();
    reviewRequest.current = null;
    const signature = JSON.stringify([topic, q, c, lang]);
    setPhase("review");
    setReviewError("");
    setError("");
    if (!force && reviewCache.current?.signature === signature) {
      setFields(reviewCache.current.fields);
      setAiOrganized(reviewCache.current.ai);
      setOrganizing(false);
      return;
    }
    const controller = new AbortController();
    reviewRequest.current = controller;
    const timer = setTimeout(() => controller.abort(), 70000);
    setOrganizing(true);
    setAiOrganized(false);
    const original = { ...emptyReview(), additionalInformation: c };
    setFields(original);
    try {
      const result = await api<{
        fields: ReviewFields | null;
        aiGenerated: boolean;
        safety?: any;
      }>("/oracle/review", {
        body: {
          topic,
          question: q,
          context: c,
          language: lang,
          ageConfirmed: true,
        },
        signal: controller.signal,
      });
      if (
        !active.current ||
        controller.signal.aborted ||
        reviewRequest.current !== controller
      )
        return;
      if (result.safety) {
        setSafety(result.safety);
        return;
      }
      if (!result.aiGenerated || !result.fields)
        throw new Error("review_unavailable");
      setFields(result.fields);
      setAiOrganized(true);
      reviewCache.current = { signature, fields: result.fields, ai: true };
    } catch {
      if (active.current && reviewRequest.current === controller) {
        setReviewError(
          "AI organization is unavailable. Your original words are still here; you can edit the fields yourself or try again.",
        );
      }
    } finally {
      clearTimeout(timer);
      if (active.current && reviewRequest.current === controller)
        setOrganizing(false);
    }
  }
  function review() {
    if (lock.current) return;
    if (!adult) return setError("Please confirm you are 18 or older.");
    const firstQuestion = question || draft.trim();
    if (firstQuestion.length < 3)
      return setError("Write a little about what is on your mind.");
    const nextContext =
      question && draft.trim()
        ? [context, draft.trim()].filter(Boolean).join("\n\n")
        : context;
    if (nextContext.length > 1200)
      return setError("Your context is full. Please shorten it before saving.");
    setQuestion(firstQuestion);
    setContext(nextContext);
    setDraft("");
    setError("");
    void organize(firstQuestion, nextContext);
  }
  async function send() {
    if (lock.current || ready || phase !== "conversation") return;
    if (!adult) return setError("Please confirm you are 18 or older.");
    const text = draft.trim();
    if (text.length < (question ? 1 : 3))
      return setError("Write a little about what is on your mind.");
    if (text.length > maxLength)
      return setError("Your context is full. Please shorten it before saving.");
    const nextContext = question
      ? [context, text].filter(Boolean).join("\n\n")
      : context;
    const next: EncounterTurn[] = [...turns, { role: "user", text }];
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 45000);
    lock.current = true;
    setSending(true);
    setError("");
    try {
      const result = await api<{
        reply: string;
        ready: boolean;
        aiGenerated: boolean;
        safety?: any;
      }>("/oracle/prepare", {
        body: {
          topic,
          language: lang,
          context: nextContext,
          ageConfirmed: true,
          turns: next.map(({ role, text }) => ({ role, text })),
        },
        signal: controller.signal,
      });
      if (!active.current || controller.signal.aborted) return;
      if (result.safety) {
        setSafety(result.safety);
        return;
      }
      setQuestion(question || text);
      setContext(nextContext);
      setDraft("");
      setTurns([
        ...next,
        {
          role: "assistant",
          text: result.reply,
          aiGenerated: result.aiGenerated,
        },
      ]);
      const complete =
        result.ready ||
        next.filter((turn) => turn.role === "user").length >= 4 ||
        nextContext.length >= 1200;
      setReady(complete);
      if (complete) void organize(question || text, nextContext);
    } catch (cause: any) {
      if (active.current) setError(cause.message);
    } finally {
      clearTimeout(timer);
      lock.current = false;
      if (active.current) setSending(false);
    }
  }
  async function confirmAndSave() {
    if (phase !== "review" || saveLock.current || organizing) return;
    if (!adult) return setError("Please confirm you are 18 or older.");
    const q = question.trim(),
      c = reviewContext(fields, lang);
    if (q.length < 3 || q.length > 600)
      return setError("Your question must contain 3 to 600 characters.");
    if (c.length > 1200)
      return setError("Your context is full. Please shorten it before saving.");
    const signature = JSON.stringify([topic, q, c, privateMode]);
    if (retry.current?.signature !== signature)
      retry.current = {
        signature,
        id: randomUUID(),
        token: randomUUID() + randomUUID(),
      };
    saveLock.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await newCast(
        {
          topic,
          question: q,
          context: c,
          privateMode,
          ageConfirmed: true,
          informationConfirmed: true,
        },
        retry.current,
      );
      if (!active.current) return;
      if (result.safety) {
        setSafety(result.safety);
        return;
      }
      router.push("/cast/" + result.cast.id);
    } catch (cause: any) {
      if (active.current) setError(cause.message);
    } finally {
      saveLock.current = false;
      if (active.current) setSaving(false);
    }
  }
  return {
    reset: () => {
      request.current?.abort();
      reviewRequest.current?.abort();
      reviewRequest.current = null;
      reviewCache.current = null;
      setFields(emptyReview());
      setOrganizing(false);
      setReviewError("");
      setAiOrganized(false);
      lock.current = false;
      retry.current = null;
      setSending(false);
      setSafety(null);
      setTurns([]);
      setDraft("");
      setQuestion("");
      setContext("");
      setReady(false);
      setError("");
      setPhase("conversation");
    },
    phase,
    turns,
    draft,
    setDraft,
    question,
    setQuestion,
    context,
    fields,
    organizing,
    reviewError,
    aiOrganized,
    contextLength: reviewContext(fields, lang).length,
    retryOrganization: () => void organize(question, context, true),
    setReviewField: (key: ReviewKey, value: string) => {
      if (organizing || saving) return;
      setFields((previous) => {
        const next = { ...previous, [key]: value };
        reviewCache.current = {
          signature: JSON.stringify([topic, question, context, lang]),
          fields: next,
          ai: aiOrganized,
        };
        return next;
      });
      setReviewError("");
      setError("");
    },
    adult,
    setAdult,
    privateMode,
    setPrivateMode,
    sending,
    saving,
    error,
    setError,
    safety,
    ready,
    maxLength,
    greeting,
    latest,
    review,
    send,
    confirmAndSave,
    resume: () => {
      reviewRequest.current?.abort();
      reviewRequest.current = null;
      setOrganizing(false);
      setError("");
      setPhase("conversation");
    },
  };
}

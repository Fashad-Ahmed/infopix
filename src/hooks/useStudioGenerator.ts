"use client";

import { useCallback, useRef, useState } from "react";
import { postStudioGenerate, GenerateError, type StudioGenerateRequest } from "../lib/api-client";
import { pickInfographicPayload, normalizeInfographicContent } from "../lib/infographic-payload";
import type { InfographicViewModel, StudioFinalPayload, SlotAssignment } from "../types/infographic";

const PROGRESS_TICK_MS = 400;
const PROGRESS_CAP = 90;

export type StudioViewModel = InfographicViewModel & {
  slotAssignment: SlotAssignment;
  studioConfig: StudioFinalPayload["studioConfig"];
};

type Status = "idle" | "loading" | "success" | "error";

type State = {
  status: Status;
  progress: number;
  data: StudioViewModel | null;
  error: string | null;
  errorCode: string | null;
};

const INITIAL: State = { status: "idle", progress: 0, data: null, error: null, errorCode: null };

export function useStudioGenerator() {
  const [state, setState] = useState<State>(INITIAL);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastParamsRef = useRef<StudioGenerateRequest | null>(null);

  const clearProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const generate = useCallback(
    async (params: StudioGenerateRequest): Promise<StudioViewModel | null> => {
      lastParamsRef.current = params;
      setState({ status: "loading", progress: 0, data: null, error: null, errorCode: null });

      intervalRef.current = setInterval(() => {
        setState((prev) =>
          prev.status === "loading"
            ? { ...prev, progress: Math.min(PROGRESS_CAP, prev.progress + Math.random() * 20) }
            : prev,
        );
      }, PROGRESS_TICK_MS);

      try {
        const raw = await postStudioGenerate(params);
        const view = toStudioViewModel(raw);
        if (!view) throw new Error("Studio response format unexpected.");

        setState({ status: "success", progress: 100, data: view, error: null, errorCode: null });
        return view;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed.";
        const code = err instanceof GenerateError ? err.code : "INTERNAL";
        setState({ status: "error", progress: 0, data: null, error: message, errorCode: code });
        return null;
      } finally {
        clearProgress();
      }
    },
    [clearProgress],
  );

  const reset = useCallback(() => {
    clearProgress();
    setState(INITIAL);
  }, [clearProgress]);

  const retry = useCallback((): Promise<StudioViewModel | null> => {
    if (lastParamsRef.current) return generate(lastParamsRef.current);
    reset();
    return Promise.resolve(null);
  }, [generate, reset]);

  return { ...state, isLoading: state.status === "loading", generate, reset, retry };
}

function toStudioViewModel(raw: unknown): StudioViewModel | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const slotAssignment = r.slotAssignment as SlotAssignment | undefined;
  const studioConfig = r.studioConfig as StudioFinalPayload["studioConfig"] | undefined;
  if (!slotAssignment || !studioConfig) return null;

  const picked = pickInfographicPayload(r);
  if (!picked) return null;

  const style = picked.style ?? picked.content?.style;
  const contentRaw = picked.content ?? (Array.isArray(picked.sections) ? {
    title: picked.title,
    summary: picked.summary,
    sections: picked.sections,
    metadata: picked.metadata,
    heroImageUrl: picked.heroImageUrl,
  } : null);
  if (!contentRaw) return null;

  const content = normalizeInfographicContent(contentRaw as Record<string, unknown>);
  if (!Array.isArray(content.sections) || content.sections.length === 0) return null;

  return {
    title: content.title,
    summary: content.summary,
    sections: content.sections,
    heroImageUrl: content.heroImageUrl,
    style,
    slotAssignment,
    studioConfig,
  };
}

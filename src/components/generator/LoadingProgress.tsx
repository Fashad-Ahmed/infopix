"use client";

import { useTranslations } from "next-intl";
import type { GenerationMode } from "../../types/infographic";

type LoadingProgressProps = {
  progress: number;
  mode: GenerationMode | "studio";
};

const STEP_RANGES: Record<string, [number, number][]> = {
  url:    [[0, 35], [35, 60], [60, 80], [80, 100]],
  topic:  [[0, 35], [35, 60], [60, 80], [80, 100]],
  studio: [[0, 20], [20, 40], [40, 55], [55, 75], [75, 100]],
};

export function LoadingProgress({ progress, mode }: LoadingProgressProps) {
  const t = useTranslations(`loading.${mode}`);
  const ranges = STEP_RANGES[mode] ?? STEP_RANGES.url;

  const steps = ranges.map((range, i) => ({
    step: i + 1,
    label: t(`step${i + 1}Label`),
    desc: t(`step${i + 1}Desc`),
    range,
  }));

  return (
    <div
      className="max-w-2xl mx-auto rounded-[1.75rem] p-8 animate-slide-down"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Processing
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color: "var(--primary)" }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden border"
          style={{ backgroundColor: "var(--surface-alt)", borderColor: "var(--border)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--primary)",
              boxShadow: "0 0 14px var(--progress-glow)",
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((item) => {
          const done = progress >= item.range[1];
          const active = progress >= item.range[0] && progress < item.range[1];
          return (
            <div
              key={item.step}
              className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300"
              style={{
                backgroundColor: active ? "var(--primary-soft)" : done ? "var(--surface-alt)" : "var(--surface-alt)",
                border: active ? "1px solid var(--border-strong)" : "1px solid transparent",
                opacity: !done && !active && progress > item.range[0] + 5 ? 0.5 : 1,
              }}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 transition-all duration-300 text-sm font-bold"
                style={{
                  backgroundColor: done ? "var(--success, #22c55e)" : active ? "var(--primary)" : "var(--surface)",
                  color: done || active ? "var(--on-primary)" : "var(--muted)",
                  border: done || active ? "none" : "1px solid var(--border)",
                  animation: active ? "step-pulse 1.5s ease-in-out infinite" : "none",
                }}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : item.step}
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className="font-semibold transition-colors duration-300"
                  style={{ color: done ? "var(--success, #22c55e)" : active ? "var(--primary)" : "var(--muted)" }}
                >
                  {item.label}
                </h4>
                <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>
                  {item.desc}
                </p>
              </div>
              {done && (
                <span className="text-xs font-semibold shrink-0 mt-0.5" style={{ color: "var(--success, #22c55e)" }}>
                  Done
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

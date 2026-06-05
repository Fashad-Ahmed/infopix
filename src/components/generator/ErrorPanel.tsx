"use client";

import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

type Props = {
  message: string;
  code?: string | null;
  onRetry?: () => void;
};

const HINTS: Record<string, string> = {
  QUOTA_EXCEEDED:
    "GPT-4o backup is active. If this keeps happening, check your API key credits in Google AI Studio.",
  URL_INACCESSIBLE:
    "Check the URL exists, is not behind a login or paywall, and is publicly accessible.",
  VALIDATION_FAILED:
    "The AI returned unexpected data. Try a shorter or more specific topic.",
  GENERATION_FAILED:
    "The workflow completed but produced no output. Try rephrasing your topic.",
};

export function ErrorPanel({ message, code, onRetry }: Props) {
  const hint = code ? HINTS[code] : null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-3xl p-8 animate-slide-down"
      style={{
        backgroundColor: "color-mix(in srgb, var(--error) 7%, var(--surface))",
        border: "1px solid color-mix(in srgb, var(--error) 28%, var(--border))",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0"
          style={{ backgroundColor: "color-mix(in srgb, var(--error) 14%, var(--surface-alt))" }}
        >
          <AlertCircle className="w-5 h-5" style={{ color: "var(--error)" }} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "var(--error)" }}>
            Generation failed
          </p>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--foreground)" }}>
            {message}
          </p>
          {hint && (
            <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
              {hint}
            </p>
          )}
        </div>
      </div>

      {onRetry && (
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              boxShadow: "var(--btn-shadow)",
            }}
          >
            <RefreshCw className="w-4 h-4" aria-hidden />
            Try again
          </button>
          {code === "QUOTA_EXCEEDED" && (
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: "var(--muted)" }}
            >
              <ExternalLink className="w-3 h-3" aria-hidden />
              Manage API keys
            </a>
          )}
        </div>
      )}
    </div>
  );
}

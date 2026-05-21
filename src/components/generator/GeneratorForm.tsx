"use client";

import { useState } from "react";
import { Palette, X } from "lucide-react";
import type { GenerationMode } from "../../types/infographic";
import { ModeToggle } from "./ModeToggle";

const PLACEHOLDERS: Record<GenerationMode, string> = {
  url: "https://raw.githubusercontent.com/...",
  topic: "e.g. The history of the Roman aqueduct",
};

export type GeneratorFormValues = {
  rawText: string;
  mode: GenerationMode;
  stylePrompt: string;
  generateImages: boolean;
};

type GeneratorFormProps = {
  loading: boolean;
  onSubmit: (values: GeneratorFormValues) => void;
};

export function GeneratorForm({ loading, onSubmit }: GeneratorFormProps) {
  const [rawText, setRawText] = useState("");
  const [mode, setMode] = useState<GenerationMode>("url");
  const [stylePrompt, setStylePrompt] = useState("");
  const [generateImages, setGenerateImages] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rawText, mode, stylePrompt, generateImages });
  };

  const canSubmit = !loading && rawText.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-0" noValidate>
      <ModeToggle mode={mode} onChange={setMode} />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative group">
          <input
            type={mode === "url" ? "url" : "text"}
            required
            placeholder={PLACEHOLDERS[mode]}
            className="w-full rounded-2xl px-6 py-4 text-lg outline-none transition-all duration-200"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: inputFocused
                ? "2px solid var(--primary)"
                : "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            disabled={loading}
          />
          {rawText && (
            <button
              type="button"
              onClick={() => setRawText("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-[var(--foreground)]"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-2xl px-8 py-4 text-lg font-semibold transition-all duration-200 whitespace-nowrap hover:scale-105 active:scale-95"
          style={{
            backgroundColor: loading
              ? "var(--btn-loading-bg)"
              : "var(--primary)",
            color: "var(--on-primary)",
            boxShadow: loading ? "var(--btn-loading-shadow)" : "var(--btn-shadow)",
            opacity: !canSubmit && !loading ? 0.7 : 1,
            cursor: !canSubmit ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              Generate
            </span>
          )}
        </button>
      </div>

      <div className="mb-4">
        <label
          className="block text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--muted)" }}
        >
          Style prompt (optional)
        </label>
        <input
          type="text"
          placeholder="e.g. minimalist, dark navy + neon accent, modern sans"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
          style={{
            backgroundColor: "var(--surface-alt)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          disabled={loading}
        />
      </div>

      {mode === "url" ? (
        <label
          className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer select-none"
          style={{
            backgroundColor: "var(--surface-alt)",
            borderColor: "var(--border)",
          }}
        >
          <input
            type="checkbox"
            checked={generateImages}
            onChange={(e) => setGenerateImages(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 accent-[var(--primary)]"
          />
          <Palette
            className="w-4 h-4"
            aria-hidden
            style={{ color: "var(--muted)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            Generate AI imagery (uses OpenAI; adds 15–30s)
          </span>
        </label>
      ) : (
        <p className="text-xs px-1" style={{ color: "var(--muted)" }}>
          Topic mode automatically generates AI imagery for the hero and each
          section.
        </p>
      )}
    </form>
  );
}

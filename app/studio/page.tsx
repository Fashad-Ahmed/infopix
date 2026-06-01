"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { StudioForm } from "../../src/components/studio/StudioForm";
import { StudioCanvas } from "../../src/components/studio/StudioCanvas";
import { DownloadToolbar } from "../../src/components/generator/DownloadToolbar";
import { ToastStack } from "../../src/components/generator/ToastStack";
import { LoadingProgress } from "../../src/components/generator/LoadingProgress";
import { useTranslations } from "next-intl";
import { useStudioGenerator } from "../../src/hooks/useStudioGenerator";
import { useInfographicDownload } from "../../src/hooks/useInfographicDownload";
import { useTheme } from "../../src/hooks/useTheme";
import { useToasts } from "../../src/hooks/useToasts";
import type { StudioGenerateRequest } from "../../src/lib/api-client";

const PILL_STYLE = {
  borderColor: "var(--border)",
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
} as const;

export default function StudioPage() {
  const t = useTranslations("studio");
  const tTheme = useTranslations("theme");
  const tToast = useTranslations("toast");
  const { theme, toggle: toggleTheme, mounted } = useTheme();
  const { toasts, add: addToast, remove: removeToast } = useToasts();
  const generator = useStudioGenerator();
  const infographicRef = useRef<HTMLDivElement | null>(null);
  const downloader = useInfographicDownload({
    node: infographicRef.current,
    title: generator.data?.title,
    theme,
  });

  const handleGenerate = useCallback(
    async (values: Omit<StudioGenerateRequest, "generateImages">) => {
      if (!values.rawText.trim()) {
        addToast(
          values.mode === "url" ? t("toast.enterUrl") : t("toast.enterTopic"),
          "error",
        );
        return;
      }
      const result = await generator.generate(values);
      if (result) {
        addToast(t("toast.generated"), "success");
      } else if (generator.error) {
        addToast(generator.error, "error");
      }
    },
    [addToast, generator],
  );

  const handleDownload = useCallback(
    async (kind: "png" | "pdf") => {
      const result = await downloader.download(kind);
      if (result.ok) {
        addToast(tToast("downloadSuccess", { format: kind.toUpperCase() }), "success");
      } else {
        addToast(result.error ?? tToast("downloadFailed"), "error");
      }
    },
    [addToast, downloader],
  );

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <ToastStack toasts={toasts} onDismiss={removeToast} />

      {/* Nav */}
      <div className="max-w-6xl mx-auto mb-10 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold transition-colors duration-200"
          style={{ color: "var(--muted)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          {t("back")}
        </Link>

        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
              color: "var(--primary)",
              border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
            }}
          >
            {t("badge")}
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-full border w-9 h-9 transition-all duration-200 hover:bg-[var(--hover)]"
            style={PILL_STYLE}
            aria-label={tTheme("toggle")}
          >
            {theme === "dark" ? <Moon className="w-4 h-4" aria-hidden /> : <Sun className="w-4 h-4" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
          {t("title")}
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--muted)" }}>
          {t("subtitle")}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">

        {/* Left: form */}
        <div
          className="rounded-3xl p-6 sticky top-8 overflow-y-auto"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)", maxHeight: "calc(100vh - 5rem)" }}
        >
          <StudioForm loading={generator.isLoading} onSubmit={handleGenerate} />
        </div>

        {/* Right: output */}
        <div className="space-y-6">
          {generator.isLoading && (
            <LoadingProgress progress={generator.progress} mode="studio" />
          )}

          {!generator.data && !generator.isLoading && (
            <div
              className="rounded-3xl p-12 text-center"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
                {t("emptyTitle")}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                {t("emptyHint")}
              </p>
            </div>
          )}

          {generator.data && !generator.isLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">
              <DownloadToolbar onDownload={handleDownload} pending={downloader.pending} />
              <StudioCanvas
                ref={infographicRef}
                data={generator.data}
                displayWidth={640}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

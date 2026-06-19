"use client";

import { useCallback, useMemo, useRef } from "react";
import { AppNav } from "../src/components/AppNav";
import { StudioForm } from "../src/components/studio/StudioForm";
import { StudioCanvas } from "../src/components/studio/StudioCanvas";
import { DownloadToolbar } from "../src/components/generator/DownloadToolbar";
import { ErrorPanel } from "../src/components/generator/ErrorPanel";
import { ToastStack } from "../src/components/generator/ToastStack";
import { LoadingProgress } from "../src/components/generator/LoadingProgress";
import { useTranslations } from "next-intl";
import { useStudioGenerator } from "../src/hooks/useStudioGenerator";
import { useStudioEditor } from "../src/hooks/useStudioEditor";
import { StudioEditPanel } from "../src/components/studio/StudioEditPanel";
import { useBrandKit } from "../src/hooks/useBrandKit";
import { BrandKitPanel } from "../src/components/studio/BrandKitPanel";
import { applyBrandStyle } from "../src/lib/brand-kit";
import { useDesignKit } from "../src/hooks/useDesignKit";
import { DesignKitPanel } from "../src/components/studio/DesignKitPanel";
import { applyDesignOverrides } from "../src/lib/design-kit";
import { Pencil } from "lucide-react";
import { useInfographicDownload } from "../src/hooks/useInfographicDownload";
import { useTheme } from "../src/hooks/useTheme";
import { useToasts } from "../src/hooks/useToasts";
import type { StudioGenerateRequest } from "../src/lib/api-client";

export default function StudioPage() {
  const t = useTranslations("studio");
  const tToast = useTranslations("toast");
  const { theme, toggle: toggleTheme } = useTheme();
  const { toasts, add: addToast, remove: removeToast } = useToasts();
  const generator = useStudioGenerator();
  const editor = useStudioEditor(generator.data);
  const brandKit = useBrandKit();
  const designKit = useDesignKit();

  const displayViewModel = useMemo(() => {
    if (!editor.viewModel) return null;
    if (!brandKit.isActive && !designKit.isActive) return editor.viewModel;
    return {
      ...editor.viewModel,
      style: brandKit.isActive ? applyBrandStyle(editor.viewModel.style, brandKit.draft) : editor.viewModel.style,
      studioConfig: designKit.isActive
        ? applyDesignOverrides(editor.viewModel.studioConfig, designKit.draft)
        : editor.viewModel.studioConfig,
    };
  }, [editor.viewModel, brandKit.isActive, brandKit.draft, designKit.isActive, designKit.draft]);

  const infographicRef = useRef<HTMLDivElement | null>(null);
  const downloader = useInfographicDownload({
    node: infographicRef.current,
    title: displayViewModel?.title,
    theme,
    backgroundColor: displayViewModel?.style?.secondaryColor ?? "#f8f5ef",
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
    [addToast, generator, t],
  );

  const handleDownload = useCallback(
    async (kind: "png" | "pdf" | "html") => {
      const result = await downloader.download(kind);
      if (result.ok) {
        addToast(tToast("downloadSuccess", { format: kind.toUpperCase() }), "success");
      } else {
        addToast(result.error ?? tToast("downloadFailed"), "error");
      }
    },
    [addToast, downloader, tToast],
  );

  return (
    <main className="min-h-screen transition-colors duration-300">
      <ToastStack toasts={toasts} onDismiss={removeToast} />

      {/* Nav */}
      <div className="px-6 sm:px-10 lg:px-14 pt-6">
        <AppNav
          theme={theme}
          onToggleTheme={toggleTheme}
          secondaryHref="/classic"
          secondaryLabel="Quick Infographic"
        />
      </div>

      {/* Hero header */}
      <header className="px-6 sm:px-10 lg:px-14 pt-4 pb-10">
        <div className="max-w-[1200px] mx-auto">
          <h1
            className="leading-none tracking-tight mb-4"
            style={{
              fontFamily: 'var(--font-display), "Darker Grotesque", system-ui, sans-serif',
              fontSize: "clamp(2.75rem, 5vw, 4.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--foreground)",
            }}
          >
            Publication&#8209;grade{" "}
            <em
              style={{
                fontStyle: "italic",
                color: "var(--accent)",
                fontWeight: 700,
              }}
            >
              infographics
            </em>
          </h1>
          <p
            className="text-base max-w-lg leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            {t("subtitle")}
          </p>
        </div>
      </header>

      {/* Two-column workspace */}
      <div className="px-6 sm:px-10 lg:px-14 pb-20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">

          {/* Left: form panel */}
          <div
            className="rounded-3xl sticky top-8 overflow-y-auto"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              maxHeight: "calc(100vh - 4rem)",
            }}
          >
            <StudioForm loading={generator.isLoading} onSubmit={handleGenerate} />
          </div>

          {/* Right: output area */}
          <div className="space-y-6 min-w-0">
            {generator.isLoading && (
              <LoadingProgress progress={generator.progress} mode="studio" />
            )}

            {generator.status === "error" && !generator.isLoading && (
              <ErrorPanel
                message={generator.error ?? "Generation failed."}
                code={generator.errorCode}
                onRetry={generator.retry}
              />
            )}

            {!generator.data && !generator.isLoading && generator.status !== "error" && (
              <EmptyCanvas />
            )}

            {displayViewModel && !generator.isLoading && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                <div className="space-y-4 pb-1">
                  <div className="flex items-center justify-between gap-3">
                    <DownloadToolbar onDownload={handleDownload} pending={downloader.pending} />
                    <button
                      type="button"
                      onClick={editor.toggleEditing}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-4 py-2 transition-colors duration-150"
                      style={{
                        border: `1.5px solid ${editor.editing ? "var(--primary)" : "var(--border)"}`,
                        color: editor.editing ? "var(--primary)" : "var(--muted)",
                        backgroundColor: editor.editing ? "var(--primary-soft)" : "var(--surface)",
                      }}
                      aria-pressed={editor.editing}
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden />
                      {editor.editing ? "Done editing" : "Edit content"}
                    </button>
                  </div>

                  <StudioCanvas
                    ref={infographicRef}
                    data={displayViewModel}
                    displayWidth={620}
                    editable={editor.editing}
                    selectedSlot={editor.selectedSlot}
                    onSlotClick={editor.handleSlotClick}
                    logoDataUrl={brandKit.draft.logoDataUrl}
                    logoPlacement={brandKit.draft.logoPlacement}
                    footerText={brandKit.draft.footerText}
                  />
                </div>

                <StudioEditPanel editor={editor} />
                <DesignKitPanel designKit={designKit} />
                <BrandKitPanel brandKit={brandKit} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function EmptyCanvas() {
  return (
    <div
      className="rounded-3xl flex flex-col items-center justify-center gap-6 text-center select-none"
      style={{
        backgroundColor: "var(--surface)",
        border: "2px dashed var(--border)",
        minHeight: 420,
        padding: "4rem 2.5rem",
      }}
    >
      {/* Decorative grid of squares — editorial feel */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(3, 28px)" }}
        aria-hidden="true"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="block rounded-lg"
            style={{
              width: 28,
              height: 28,
              backgroundColor:
                i === 4
                  ? "var(--accent)"
                  : i % 2 === 0
                  ? "var(--primary-soft)"
                  : "var(--border)",
              opacity: i === 4 ? 1 : 0.6 + (i % 3) * 0.13,
            }}
          />
        ))}
      </div>

      <div>
        <p
          className="font-semibold mb-2"
          style={{
            fontFamily: 'var(--font-display), "Darker Grotesque", system-ui, sans-serif',
            fontSize: "1.15rem",
            letterSpacing: "-0.01em",
            color: "var(--foreground)",
          }}
        >
          Your infographic will appear here
        </p>
        <p
          className="text-sm leading-relaxed max-w-[280px]"
          style={{ color: "var(--muted)" }}
        >
          Choose a topic or paste a URL, pick your canvas and palette, then generate.
        </p>
      </div>
    </div>
  );
}

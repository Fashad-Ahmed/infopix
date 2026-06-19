"use client";

import { useCallback, useRef, useState } from "react";
import type { GenerationMode } from "../../src/types/infographic";
import Infographic from "../../src/components/infographic";
import { AppNav } from "../../src/components/AppNav";
import { DownloadToolbar } from "../../src/components/generator/DownloadToolbar";
import { ErrorPanel } from "../../src/components/generator/ErrorPanel";
import {
  GeneratorForm,
  type GeneratorFormValues,
} from "../../src/components/generator/GeneratorForm";
import { HeroPanel } from "../../src/components/generator/HeroPanel";
import { LoadingProgress } from "../../src/components/generator/LoadingProgress";
import { ToastStack } from "../../src/components/generator/ToastStack";
import { useTranslations } from "next-intl";
import { useInfographicDownload } from "../../src/hooks/useInfographicDownload";
import { useInfographicGenerator } from "../../src/hooks/useInfographicGenerator";
import { useTheme } from "../../src/hooks/useTheme";
import { useToasts } from "../../src/hooks/useToasts";

export default function ClassicPage() {
  const t = useTranslations("toast");
  const { theme, toggle: toggleTheme, mounted } = useTheme();
  const { toasts, add: addToast, remove: removeToast } = useToasts();
  const generator = useInfographicGenerator();
  const [lastMode, setLastMode] = useState<GenerationMode>("url");
  const infographicRef = useRef<HTMLDivElement | null>(null);
  const downloader = useInfographicDownload({
    node: infographicRef.current,
    title: generator.data?.title,
    theme,
  });

  const handleGenerate = useCallback(
    async (values: GeneratorFormValues) => {
      if (!values.rawText.trim()) {
        addToast(
          values.mode === "url" ? t("enterUrl") : t("enterTopic"),
          "error",
        );
        return;
      }

      setLastMode(values.mode);
      const result = await generator.generate({
        rawText: values.rawText,
        mode: values.mode,
        stylePrompt: values.stylePrompt.trim() || undefined,
        generateImages: values.generateImages,
      });

      if (result) {
        addToast(t("generated"), "success");
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
        addToast(t("downloadSuccess", { format: kind.toUpperCase() }), "success");
      } else {
        addToast(result.error ?? t("downloadFailed"), "error");
      }
    },
    [addToast, downloader, t],
  );

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <ToastStack toasts={toasts} onDismiss={removeToast} />

      <div className="max-w-3xl mx-auto">
        <AppNav
          theme={theme}
          onToggleTheme={toggleTheme}
          backHref="/"
          backLabel="MemorAIz"
        />

        <HeroPanel loading={generator.isLoading}>
          <GeneratorForm
            loading={generator.isLoading}
            onSubmit={handleGenerate}
          />
        </HeroPanel>
      </div>

      {generator.isLoading && (
        <div className="max-w-3xl mx-auto mt-8">
          <LoadingProgress progress={generator.progress} mode={lastMode} />
        </div>
      )}

      {generator.status === "error" && !generator.isLoading && (
        <div className="max-w-3xl mx-auto mt-8">
          <ErrorPanel
            message={generator.error ?? "Generation failed."}
            code={generator.errorCode}
            onRetry={generator.retry}
          />
        </div>
      )}

      {generator.data && !generator.isLoading && (
        <div
          className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out pb-20 mt-8"
        >
          <DownloadToolbar
            onDownload={handleDownload}
            pending={downloader.pending}
          />
          <Infographic
            ref={infographicRef}
            data={generator.data}
            isDark={mounted ? theme === "dark" : undefined}
          />
        </div>
      )}
    </main>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import type { GenerationMode } from "../src/types/infographic";
import Infographic from "../src/components/infographic";
import { DownloadToolbar } from "../src/components/generator/DownloadToolbar";
import {
  GeneratorForm,
  type GeneratorFormValues,
} from "../src/components/generator/GeneratorForm";
import { HeaderBar } from "../src/components/generator/HeaderBar";
import { HeroPanel } from "../src/components/generator/HeroPanel";
import { LoadingProgress } from "../src/components/generator/LoadingProgress";
import { ToastStack } from "../src/components/generator/ToastStack";
import { useInfographicDownload } from "../src/hooks/useInfographicDownload";
import { useInfographicGenerator } from "../src/hooks/useInfographicGenerator";
import { useTheme } from "../src/hooks/useTheme";
import { useToasts } from "../src/hooks/useToasts";

export default function Home() {
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
          values.mode === "url"
            ? "Please enter a valid URL"
            : "Please enter a topic",
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
        addToast("Infographic generated successfully!", "success");
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
        addToast(`${kind.toUpperCase()} downloaded`, "success");
      } else {
        addToast(result.error ?? "Download failed", "error");
      }
    },
    [addToast, downloader],
  );

  return (
    <main className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <ToastStack toasts={toasts} onDismiss={removeToast} />

      <div className="relative max-w-3xl mx-auto mb-16">
        <HeaderBar theme={theme} onToggleTheme={toggleTheme} />
        <HeroPanel loading={generator.isLoading}>
          <GeneratorForm
            loading={generator.isLoading}
            onSubmit={handleGenerate}
          />
        </HeroPanel>
      </div>

      {generator.isLoading && (
        <LoadingProgress progress={generator.progress} mode={lastMode} />
      )}

      {generator.data && !generator.isLoading && (
        <div
          className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out pb-20"
          style={{ animation: "slideInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
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

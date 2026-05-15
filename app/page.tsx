/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import Infographic from "../src/components/Infographic";
import {
  pickInfographicPayload,
  normalizeInfographicContent,
} from "../src/lib/infographic-payload";

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [infographicData, setInfographicData] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [urlFocused, setUrlFocused] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : prefersDark
          ? "dark"
          : "light";

    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    setMounted(true);
  }, []);

  const addToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearUrl = () => {
    setUrl("");
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      addToast("Please enter a valid URL", "error");
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setInfographicData(null);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 30;
      });
    }, 400);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: url,
          density: "standard",
          narrativeFocus: "data-heavy",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend Error Details:", errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      
      const rawData = await response.json();

      const picked = pickInfographicPayload(rawData);
      if (!picked) {
        console.error("Invalid Data Shape:", rawData);
        addToast(
          "Generated data format unexpected. Check console for details.",
          "error",
        );
        return;
      }

      const style = picked.style ?? picked.content?.style;
      const contentRaw =
        picked.content ??
        (Array.isArray(picked.sections)
          ? {
              title: picked.title,
              summary: picked.summary,
              sections: picked.sections,
              metadata: picked.metadata,
            }
          : null);

      if (!contentRaw) {
        console.error("Invalid Data Shape:", rawData);
        addToast(
          "Generated data format unexpected. Check console for details.",
          "error",
        );
        return;
      }

      const content = normalizeInfographicContent(
        contentRaw as Record<string, any>,
      );
      const sections = content.sections;

      if (Array.isArray(sections) && sections.length > 0) {
        setLoadingProgress(100);
        setInfographicData({
          title: content.title,
          summary: content.summary,
          sections,
          style,
        });
        addToast("Infographic generated successfully!", "success");
      } else {
        console.error("Invalid Data Shape:", rawData);
        addToast(
          "Generated data format unexpected. Check console for details.",
          "error",
        );
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      addToast("Generation failed. Check terminal logs.", "error");
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  return (
    <main className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-panel animate-slide-down rounded-xl px-5 py-3 text-sm font-medium shadow-lg pointer-events-auto cursor-pointer border ${
              toast.type === "success"
                ? "toast-panel--success"
                : toast.type === "error"
                  ? "toast-panel--error"
                  : "toast-panel--info"
            }`}
            onClick={() => removeToast(toast.id)}
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" && <span>✓</span>}
              {toast.type === "error" && <span>✕</span>}
              {toast.type === "info" && <span>ⓘ</span>}
              {toast.message}
            </div>
          </div>
        ))}
      </div>

      <div className="relative max-w-3xl mx-auto mb-16">
        <div className="absolute right-0 top-0 hidden sm:flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-[var(--hover)]"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
            }}
            aria-label="Toggle color mode"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>

        <div
          className="overflow-hidden rounded-[2rem] border px-8 py-12 shadow-[var(--card-shadow)] transition-all duration-300 hover:shadow-lg"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="inline-flex items-center justify-center rounded-full bg-[var(--primary-soft)] p-3 mb-6 w-16 h-16 transition-transform duration-300"
            style={{
              animation: loading
                ? "pulse-glow 2s ease-in-out infinite"
                : "none",
            }}
          >
            <svg
              aria-hidden="true"
              className="w-8 h-8 text-[var(--primary)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3L4.5 9.25v5.5L12 21l7.5-6.25v-5.5L12 3z" />
              <path d="M12 12.5V3" />
              <path d="M4.5 9.25L12 15.5l7.5-6.25" />
            </svg>
          </div>

          <h1
            className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-4"
            style={{ color: "var(--foreground)" }}
          >
            InfoPix Engine
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl leading-8 mb-10"
            style={{ color: "var(--muted)" }}
          >
            Paste a GitHub README or documentation URL and watch as the workflow
            intelligently scrapes, analyzes, and crafts a visually stunning
            infographic.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-0"
            noValidate
          >
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative group">
                <input
                  type="url"
                  required
                  placeholder="https://raw.githubusercontent.com/..."
                  className="w-full rounded-2xl px-6 py-4 text-lg outline-none transition-all duration-200"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    border: urlFocused
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onFocus={() => setUrlFocused(true)}
                  onBlur={() => setUrlFocused(false)}
                  disabled={loading}
                />
                {url && (
                  <button
                    type="button"
                    onClick={clearUrl}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-[var(--foreground)]"
                    aria-label="Clear URL"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="rounded-2xl px-8 py-4 text-lg font-semibold transition-all duration-200 whitespace-nowrap hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: loading
                    ? "var(--btn-loading-bg)"
                    : "var(--primary)",
                  color: "var(--on-primary)",
                  boxShadow: loading
                    ? "var(--btn-loading-shadow)"
                    : "var(--btn-shadow)",
                  opacity: !url.trim() && !loading ? 0.7 : 1,
                  cursor: loading || !url.trim() ? "not-allowed" : "pointer",
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
                    ✨ Generate
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading && (
        <div
          className="max-w-2xl mx-auto rounded-[1.75rem] p-8 animate-slide-down"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div
              className="h-2 rounded-full overflow-hidden border"
              style={{
                backgroundColor: "var(--surface-alt)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${loadingProgress}%`,
                  backgroundColor: "var(--primary)",
                  boxShadow: "0 0 14px var(--progress-glow)",
                }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="space-y-4">
            {[
              {
                step: 1,
                label: "Content Extraction",
                desc: "Scraping and parsing URL content",
                active: loadingProgress < 40,
              },
              {
                step: 2,
                label: "Structure Formatting",
                desc: "Organizing into JSON schema",
                active: loadingProgress >= 40 && loadingProgress < 70,
              },
              {
                step: 3,
                label: "Quality Verification",
                desc: "Critic Agent validating accuracy",
                active: loadingProgress >= 70,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: item.active
                    ? "var(--primary-soft)"
                    : "var(--surface-alt)",
                  border: item.active
                    ? "1px solid var(--border-strong)"
                    : "1px solid transparent",
                }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: item.active
                      ? "var(--primary)"
                      : "var(--surface)",
                    color: item.active ? "var(--on-primary)" : "var(--muted)",
                    border: item.active ? "none" : "1px solid var(--border)",
                    animation: item.active
                      ? "step-pulse 1.5s ease-in-out infinite"
                      : "none",
                  }}
                >
                  {item.step}
                </div>
                <div className="flex-1">
                  <h4
                    className="font-semibold transition-colors duration-300"
                    style={{
                      color: item.active ? "var(--primary)" : "var(--muted)",
                    }}
                  >
                    {item.label}
                  </h4>
                  <p
                    className="text-sm mt-1"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {infographicData && !loading && (
        <div
          className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out pb-20"
          style={{
            animation: "slideInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Infographic data={infographicData} isDark={mounted ? theme === "dark" : undefined} />
        </div>
      )}
    </main>
  );
}

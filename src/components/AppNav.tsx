"use client";

import Link from "next/link";
import Image from "next/image";
import { Moon, Sun, Globe } from "lucide-react";
import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocale } from "../actions/locale";
import type { Theme } from "../hooks/useTheme";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "it", label: "IT" },
] as const;

function LocaleToggle() {
  const serverLocale = useLocale();
  const [displayLocale, setDisplayLocale] = useState(serverLocale);
  const [isPending, startTransition] = useTransition();
  const next = displayLocale === "en" ? "it" : "en";

  const handleSwitch = () => {
    setDisplayLocale(next); // instant visual update
    startTransition(async () => {
      await setLocale(next as "en" | "it");
      // Full browser reload so next-intl server messages update cleanly.
      // This is the standard approach — locale change = reload with new cookie.
      window.location.reload();
    });
  };

  return (
    <button
      type="button"
      onClick={handleSwitch}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold transition-all duration-150 hover:bg-[var(--hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--muted)",
        opacity: isPending ? 0.5 : 1,
      }}
      aria-label={`Switch language to ${LOCALES.find(l => l.code === next)?.label}`}
    >
      <Globe className="w-3 h-3" aria-hidden />
      {displayLocale.toUpperCase()}
    </button>
  );
}

type Props = {
  theme: Theme;
  onToggleTheme: () => void;
  backHref?: string;
  backLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function AppNav({
  theme,
  onToggleTheme,
  backHref,
  backLabel,
  secondaryHref,
  secondaryLabel,
}: Props) {
  return (
    <nav
      className="flex items-center justify-between mb-10"
      aria-label="Site navigation"
    >
      {/* Left */}
      {backHref ? (
        <Link
          href={backHref}
          className="flex items-center gap-2 transition-opacity duration-150 hover:opacity-70"
          aria-label={`Back to ${backLabel ?? "home"}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--muted)" }}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <Image
            src="/memoraiz-logo.png"
            alt={backLabel ?? "MemorAIz"}
            width={100}
            height={28}
            style={{ height: 28, width: "auto" }}
          />
        </Link>
      ) : (
        <Link href="/" aria-label="MemorAIz home">
          <Image
            src="/memoraiz-logo.png"
            alt="MemorAIz"
            width={120}
            height={33}
            priority
            style={{ height: 33, width: "auto" }}
          />
        </Link>
      )}

      {/* Right */}
      <div className="flex items-center gap-2">
        {secondaryHref && secondaryLabel && (
          <Link
            href={secondaryHref}
            className="hidden sm:inline-flex text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-150"
            style={{
              borderColor: "var(--border)",
              color: "var(--muted)",
              backgroundColor: "var(--surface)",
              letterSpacing: "0.01em",
            }}
          >
            {secondaryLabel}
          </Link>
        )}
        <LocaleToggle />
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex items-center justify-center rounded-full border w-9 h-9 transition-all duration-200 hover:bg-[var(--hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Moon className="w-4 h-4" aria-hidden /> : <Sun className="w-4 h-4" aria-hidden />}
        </button>
      </div>
    </nav>
  );
}

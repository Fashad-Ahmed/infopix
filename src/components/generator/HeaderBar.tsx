"use client";

import Link from "next/link";
import type { Theme } from "../../hooks/useTheme";

type HeaderBarProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

const PILL_STYLE = {
  borderColor: "var(--border)",
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
} as const;

export function HeaderBar({ theme, onToggleTheme }: HeaderBarProps) {
  return (
    <div className="absolute right-0 top-0 hidden sm:flex items-center gap-3">
      <Link
        href="/whatsapp"
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-[var(--hover)]"
        style={PILL_STYLE}
      >
        💬 WhatsApp
      </Link>
      <button
        type="button"
        onClick={onToggleTheme}
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-[var(--hover)]"
        style={PILL_STYLE}
        aria-label="Toggle color mode"
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}

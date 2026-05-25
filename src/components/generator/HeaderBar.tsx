"use client";

import { Moon, Sun } from "lucide-react";
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
      <button
        type="button"
        onClick={onToggleTheme}
        className="inline-flex items-center justify-center rounded-full border w-10 h-10 transition-all duration-200 hover:bg-[var(--hover)]"
        style={PILL_STYLE}
        aria-label="Toggle color mode"
      >
        {theme === "dark" ? (
          <Moon className="w-4 h-4" aria-hidden />
        ) : (
          <Sun className="w-4 h-4" aria-hidden />
        )}
      </button>
    </div>
  );
}

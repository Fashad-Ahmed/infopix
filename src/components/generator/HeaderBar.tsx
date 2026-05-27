"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "../LocaleSwitcher";
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
  const t = useTranslations("theme");
  const tNav = useTranslations("nav");

  return (
    <div className="absolute right-0 top-0 hidden sm:flex items-center gap-3">
      <Link
        href="/studio"
        className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-[var(--hover)]"
        style={PILL_STYLE}
      >
        {tNav("studio")}
      </Link>
      <LocaleSwitcher />
      <button
        type="button"
        onClick={onToggleTheme}
        className="inline-flex items-center justify-center rounded-full border w-10 h-10 transition-all duration-200 hover:bg-[var(--hover)]"
        style={PILL_STYLE}
        aria-label={t("toggle")}
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

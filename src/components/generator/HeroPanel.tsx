"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

type HeroPanelProps = {
  loading: boolean;
  children: ReactNode;
};

export function HeroPanel({ loading, children }: HeroPanelProps) {
  const t = useTranslations("hero");

  return (
    <div
      className="overflow-hidden rounded-4xl border px-8 py-12 shadow-[var(--card-shadow)] transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="inline-flex items-center justify-center rounded-full bg-[var(--primary-soft)] p-3 mb-6 w-16 h-16 transition-transform duration-300"
        style={{
          animation: loading ? "pulse-glow 2s ease-in-out infinite" : "none",
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
        className="mb-4"
        style={{
          fontFamily: 'var(--font-display), "Darker Grotesque", system-ui, sans-serif',
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 0.95,
          color: "var(--foreground)",
        }}
      >
        {t("title")}
      </h1>
      <p
        className="text-lg md:text-xl max-w-2xl leading-8 mb-8"
        style={{ color: "var(--muted)" }}
      >
        {t("subtitle")}
      </p>

      {children}
    </div>
  );
}

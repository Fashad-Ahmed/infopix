"use client";

import type { ReactNode } from "react";

type HeroPanelProps = {
  loading: boolean;
  children: ReactNode;
};

export function HeroPanel({ loading, children }: HeroPanelProps) {
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
        className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-4"
        style={{ color: "var(--foreground)" }}
      >
        InfoPix Engine
      </h1>
      <p
        className="text-lg md:text-xl max-w-2xl leading-8 mb-8"
        style={{ color: "var(--muted)" }}
      >
        Paste a URL or name a topic. The workflow intelligently extracts,
        structures, and crafts a visually stunning infographic with optional
        AI imagery and custom styling.
      </p>

      {children}
    </div>
  );
}

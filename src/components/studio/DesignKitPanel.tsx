"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { UseDesignKitReturn } from "../../hooks/useDesignKit";
import { ACCENT_STYLE_OPTIONS, FONT_OPTIONS } from "../../lib/design-kit";

const FONT_PREVIEW_STACKS: Record<string, string> = {
  "condensed-sans": '"Arial Narrow", "Franklin Gothic Medium", "Trebuchet MS", sans-serif',
  "modern-sans": 'Inter, "Helvetica Neue", Arial, sans-serif',
  slab: '"Rockwell", "Courier New", Georgia, serif',
  "display-serif": 'Georgia, "Garamond", "Times New Roman", serif',
};

function PillButton({
  active,
  onClick,
  children,
  fontFamily,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  fontFamily?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="text-xs font-semibold rounded-full transition-colors duration-150"
      style={{
        padding: "0.4rem 0.9rem",
        border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
        backgroundColor: active ? "var(--primary-soft)" : "transparent",
        color: active ? "var(--primary)" : "var(--muted)",
        whiteSpace: "nowrap",
        fontFamily,
      }}
    >
      {children}
    </button>
  );
}

type Props = {
  designKit: UseDesignKitReturn;
};

export function DesignKitPanel({ designKit }: Props) {
  const { draft, isActive, setFont, setAccentStyle, reset } = designKit;
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-3xl space-y-4"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "1.5rem" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div>
          <p
            style={{
              fontFamily: 'var(--font-display), "Darker Grotesque", system-ui, sans-serif',
              fontSize: "1.1rem",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--foreground)",
            }}
          >
            Typography &amp; accents
          </p>
          <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--muted)" }}>
            {isActive
              ? "Active — your font and accent choices override the generated design."
              : "Try a different typeface or banner accent without regenerating."}
          </p>
        </div>
        <span
          className="shrink-0 text-xs font-semibold rounded-full px-3 py-1.5"
          style={{
            border: `1.5px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
            color: isActive ? "var(--primary)" : "var(--muted)",
            backgroundColor: isActive ? "var(--primary-soft)" : "transparent",
          }}
        >
          {isActive ? "Active" : open ? "Hide" : "Configure"}
        </span>
      </button>

      {open && (
        <div className="space-y-5">
          <div className="space-y-2">
            <span className="block text-[0.65rem] font-bold uppercase" style={{ letterSpacing: "0.1em", color: "var(--muted)" }}>
              Font
            </span>
            <div className="flex flex-wrap gap-2">
              {FONT_OPTIONS.map((option) => (
                <PillButton
                  key={option.value}
                  active={draft.primaryFont === option.value}
                  onClick={() => setFont(option.value)}
                  fontFamily={FONT_PREVIEW_STACKS[option.value]}
                >
                  {option.label}
                </PillButton>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-[0.65rem] font-bold uppercase" style={{ letterSpacing: "0.1em", color: "var(--muted)" }}>
              Banner accent
            </span>
            <div className="flex flex-wrap gap-2">
              {ACCENT_STYLE_OPTIONS.map((option) => (
                <PillButton
                  key={option.value}
                  active={draft.accentStyle === option.value}
                  onClick={() => setAccentStyle(option.value)}
                >
                  {option.label}
                </PillButton>
              ))}
            </div>
          </div>

          {isActive && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-4 py-2 transition-colors duration-150"
              style={{ border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "transparent" }}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden />
              Use generated design
            </button>
          )}
        </div>
      )}
    </div>
  );
}

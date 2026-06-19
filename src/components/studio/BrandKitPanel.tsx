"use client";

import { useRef, useState } from "react";
import { Upload, X, Trash2, Check } from "lucide-react";
import type { BrandKitController, LogoUploadError } from "../../hooks/useBrandKit";
import { LOGO_PLACEMENTS, type LogoPlacement } from "../../lib/brand-kit";

const PLACEMENT_LABELS: Record<LogoPlacement, string> = {
  "banner-left": "Banner · left",
  "banner-right": "Banner · right",
  "footer-left": "Footer · left",
  "footer-right": "Footer · right",
  none: "Hidden",
};

const LOGO_ERROR_MESSAGES: Record<LogoUploadError, string> = {
  "unsupported-type": "Unsupported file type — use PNG, JPEG, SVG, or WebP.",
  "too-large": "Logo is too large — keep it under ~450KB.",
  unreadable: "Couldn't read that file — try another.",
};

const COLOR_FIELDS = [
  { key: "primaryColor", label: "Primary" },
  { key: "accentColor", label: "Accent" },
  { key: "secondaryColor", label: "Background" },
] as const;

const TEXT_INPUT_STYLE = {
  backgroundColor: "var(--surface-alt)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  borderRadius: "0.625rem",
  padding: "0.55rem 0.75rem",
  fontSize: "0.8rem",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
} as const;

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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
      }}
    >
      {children}
    </button>
  );
}

function ColorOverrideField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const active = value !== null;
  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 cursor-pointer flex-1">
        <input
          type="color"
          value={value ?? "#888888"}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 32,
            height: 32,
            borderRadius: "0.5rem",
            cursor: "pointer",
            border: "1px solid var(--border)",
            padding: 2,
            backgroundColor: "transparent",
            opacity: active ? 1 : 0.4,
          }}
        />
        <span style={{ fontSize: "0.78rem", color: "var(--foreground)", fontWeight: 500 }}>{label}</span>
      </label>
      {active && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[0.65rem] font-semibold rounded-full px-2.5 py-1 transition-colors duration-150"
          style={{ border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "transparent" }}
        >
          Use generated
        </button>
      )}
    </div>
  );
}

type Props = {
  brandKit: BrandKitController;
};

export function BrandKitPanel({ brandKit }: Props) {
  const {
    draft,
    profiles,
    logoError,
    isActive,
    setName,
    setLogo,
    clearLogo,
    setLogoPlacement,
    setColor,
    setFooterText,
    resetDraft,
    saveProfile,
    loadProfile,
    deleteProfile,
  } = brandKit;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void setLogo(file);
    e.target.value = "";
  };

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
            Brand kit
          </p>
          <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--muted)" }}>
            {isActive
              ? "Active your logo and colors are layered on top of the generated design."
              : "Add your logo and brand colors, then save it as a reusable profile."}
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
          {/* Profile name + saved profiles */}
          <div className="space-y-2">
            <span className="block text-[0.65rem] font-bold uppercase" style={{ letterSpacing: "0.1em", color: "var(--muted)" }}>
              Profile name
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                style={TEXT_INPUT_STYLE}
              />
              <button
                type="button"
                onClick={saveProfile}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-4 transition-colors duration-150"
                style={{ border: "1.5px solid var(--primary)", color: "var(--primary)", backgroundColor: "var(--primary-soft)" }}
              >
                <Check className="w-3.5 h-3.5" aria-hidden />
                Save
              </button>
            </div>

            {profiles.length > 0 && (
              <ul className="space-y-1.5 pt-1">
                {profiles.map((profile) => (
                  <li
                    key={profile.id}
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
                    style={{
                      backgroundColor: profile.id === draft.id ? "var(--primary-soft)" : "var(--surface-alt)",
                      border: `1px solid ${profile.id === draft.id ? "var(--primary)" : "var(--border)"}`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => loadProfile(profile.id)}
                      className="text-xs font-semibold text-left flex-1 truncate"
                      style={{ color: profile.id === draft.id ? "var(--primary)" : "var(--foreground)" }}
                    >
                      {profile.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProfile(profile.id)}
                      aria-label={`Delete ${profile.name} profile`}
                      className="shrink-0 rounded-full p-1.5 transition-colors duration-150"
                      style={{ color: "var(--muted)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <span className="block text-[0.65rem] font-bold uppercase" style={{ letterSpacing: "0.1em", color: "var(--muted)" }}>
              Logo
            </span>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Upload logo"
              />
              {draft.logoDataUrl ? (
                <>
                  <div
                    className="shrink-0 flex items-center justify-center rounded-xl overflow-hidden"
                    style={{ width: 44, height: 44, backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={draft.logoDataUrl} alt="Brand logo preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 transition-colors duration-150"
                    style={{ border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "transparent" }}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden />
                    Remove
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-4 py-2 transition-colors duration-150"
                  style={{ border: "1.5px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface-alt)" }}
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden />
                  Upload logo
                </button>
              )}
            </div>
            {logoError && (
              <p className="text-[0.7rem] leading-relaxed" style={{ color: "var(--destructive)" }}>
                {LOGO_ERROR_MESSAGES[logoError]}
              </p>
            )}

            {draft.logoDataUrl && (
              <div className="flex flex-wrap gap-2 pt-1">
                {LOGO_PLACEMENTS.map((placement) => (
                  <PillButton key={placement} active={draft.logoPlacement === placement} onClick={() => setLogoPlacement(placement)}>
                    {PLACEMENT_LABELS[placement]}
                  </PillButton>
                ))}
              </div>
            )}
          </div>

          {/* Colors */}
          <div className="space-y-2.5">
            <span className="block text-[0.65rem] font-bold uppercase" style={{ letterSpacing: "0.1em", color: "var(--muted)" }}>
              Brand colors
            </span>
            {COLOR_FIELDS.map(({ key, label }) => (
              <ColorOverrideField
                key={key}
                label={label}
                value={draft[key]}
                onChange={(next) => setColor(key, next)}
              />
            ))}
          </div>

          {/* Footer text */}
          <div className="space-y-2">
            <span className="block text-[0.65rem] font-bold uppercase" style={{ letterSpacing: "0.1em", color: "var(--muted)" }}>
              Footer credit
            </span>
            <input
              type="text"
              value={draft.footerText ?? ""}
              onChange={(e) => setFooterText(e.target.value || null)}
              placeholder="e.g. Acme Research Team"
              maxLength={80}
              style={TEXT_INPUT_STYLE}
            />
          </div>

          {isActive && (
            <button
              type="button"
              onClick={resetDraft}
              className="text-xs font-semibold rounded-full px-3 py-1.5 transition-colors duration-150"
              style={{ border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "transparent" }}
            >
              Clear all overrides
            </button>
          )}
        </div>
      )}
    </div>
  );
}

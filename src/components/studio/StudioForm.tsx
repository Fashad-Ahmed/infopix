"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { StudioGenerateRequest } from "../../lib/api-client";
import { COLOR_SCHEME_PRESETS } from "../../mastra/schemas/schema";

type StudioFormValues = Omit<StudioGenerateRequest, "generateImages">;

type Props = {
  loading: boolean;
  onSubmit: (values: StudioFormValues) => void;
};

const INPUT_STYLE = {
  backgroundColor: "var(--surface-alt)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
} as const;

const SCHEME_META: Array<{ id: keyof typeof COLOR_SCHEME_PRESETS; label: string }> = [
  { id: "editorial", label: "Editorial" },
  { id: "coral",     label: "Coral" },
  { id: "coffee",    label: "Coffee" },
  { id: "ocean",     label: "Ocean" },
  { id: "forest",    label: "Forest" },
  { id: "midnight",  label: "Midnight" },
  { id: "vivid",     label: "Vivid" },
];

export function StudioForm({ loading, onSubmit }: Props) {
  const t = useTranslations("studio.form");
  const [mode, setMode] = useState<"url" | "topic">("url");
  const [rawText, setRawText] = useState("");
  const [stylePrompt, setStylePrompt] = useState("");
  const [template, setTemplate] = useState<StudioFormValues["template"]>("editorial-portrait");
  const [primaryFont, setPrimaryFont] = useState<StudioFormValues["primaryFont"]>("modern-sans");
  const [accentStyle, setAccentStyle] = useState<StudioFormValues["accentStyle"]>("rule");
  const [illustrationStyle, setIllustrationStyle] = useState<StudioFormValues["illustrationStyle"]>("flat");
  const [showSourceFooter, setShowSourceFooter] = useState(true);
  const [density, setDensity] = useState<StudioFormValues["density"]>("standard");
  const [colorScheme, setColorScheme] = useState<StudioFormValues["colorScheme"]>("editorial");
  const [userPrimary, setUserPrimary]       = useState("#0f172a");
  const [userAccent, setUserAccent]         = useState("#f59e0b");
  const [userBackground, setUserBackground] = useState("#f8f5ef");

  const TEMPLATES = [
    { value: "editorial-portrait"  as const, label: t("templates.editorial-portrait"),  hint: t("templateHints.editorial-portrait") },
    { value: "editorial-landscape" as const, label: t("templates.editorial-landscape"), hint: t("templateHints.editorial-landscape") },
    { value: "social-square"       as const, label: t("templates.social-square"),        hint: t("templateHints.social-square") },
    { value: "social-wide"         as const, label: t("templates.social-wide"),          hint: t("templateHints.social-wide") },
    { value: "poster"              as const, label: t("templates.poster"),               hint: t("templateHints.poster") },
  ];
  const FONTS = [
    { value: "condensed-sans" as const, label: t("fonts.condensed-sans") },
    { value: "modern-sans"    as const, label: t("fonts.modern-sans") },
    { value: "slab"           as const, label: t("fonts.slab") },
    { value: "display-serif"  as const, label: t("fonts.display-serif") },
  ];
  const ACCENT_STYLES = [
    { value: "rule"   as const, label: t("accents.rule") },
    { value: "ribbon" as const, label: t("accents.ribbon") },
    { value: "stamp"  as const, label: t("accents.stamp") },
    { value: "none"   as const, label: t("accents.none") },
  ];
  const ILLUSTRATION_STYLES = [
    { value: "flat"     as const, label: t("illustrations.flat") },
    { value: "editorial" as const, label: t("illustrations.editorial") },
    { value: "minimal"  as const, label: t("illustrations.minimal") },
    { value: "none"     as const, label: t("illustrations.none") },
  ];
  const DEPTHS = [
    { value: "executive-summary" as const, label: t("depths.executive-summary") },
    { value: "standard"          as const, label: t("depths.standard") },
    { value: "deep-dive"         as const, label: t("depths.deep-dive") },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base: StudioFormValues = {
      rawText,
      mode,
      stylePrompt: stylePrompt.trim() || undefined,
      template,
      primaryFont,
      accentStyle,
      illustrationStyle,
      showSourceFooter,
      density,
      narrativeFocus: "data-heavy",
      colorScheme: colorScheme ?? "editorial",
    };
    if (colorScheme === "custom") {
      base.userPrimary    = userPrimary;
      base.userAccent     = userAccent;
      base.userBackground = userBackground;
    }
    onSubmit(base);
  };

  const labelStyle = { color: "var(--muted)" };
  const pillBase = "inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-150 select-none";

  function PillGroup<T extends string>({
    options,
    value,
    onChange,
  }: {
    options: readonly { value: T; label: string; hint?: string }[];
    value: T;
    onChange: (v: T) => void;
  }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            title={o.hint}
            className={pillBase}
            style={{
              borderColor: value === o.value ? "var(--primary)" : "var(--border)",
              backgroundColor: value === o.value ? "var(--primary-soft)" : "var(--surface-alt)",
              color: value === o.value ? "var(--primary)" : "var(--muted)",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={labelStyle}>{t("input")}</p>
        <div className="flex gap-2 mb-3">
          {(["url", "topic"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={pillBase}
              style={{
                borderColor: mode === m ? "var(--primary)" : "var(--border)",
                backgroundColor: mode === m ? "var(--primary-soft)" : "var(--surface-alt)",
                color: mode === m ? "var(--primary)" : "var(--muted)",
              }}
            >
              {m === "url" ? t("url") : t("topic")}
            </button>
          ))}
        </div>
        <input
          type={mode === "url" ? "url" : "text"}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={mode === "url" ? t("placeholder.url") : t("placeholder.topic")}
          disabled={loading}
          required
          className="w-full rounded-2xl px-5 py-4 text-sm outline-none"
          style={INPUT_STYLE}
        />
      </div>

      {/* Color palette */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={labelStyle}>Color palette</p>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {SCHEME_META.map(({ id, label }) => {
            const p = COLOR_SCHEME_PRESETS[id];
            const selected = colorScheme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setColorScheme(id)}
                className="flex flex-col items-center gap-1.5 rounded-xl p-2 border transition-all duration-150"
                style={{
                  borderColor: selected ? "var(--primary)" : "var(--border)",
                  backgroundColor: selected ? "var(--primary-soft)" : "var(--surface-alt)",
                }}
              >
                {/* Three-swatch preview */}
                <div className="flex gap-1">
                  {([p.primary, p.secondary, p.accent] as const).map((color, i) => (
                    <span key={i} style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: color, border: "1px solid rgba(0,0,0,0.12)", display: "block" }} />
                  ))}
                </div>
                <span className="text-xs font-semibold leading-none" style={{ color: selected ? "var(--primary)" : "var(--muted)" }}>
                  {label}
                </span>
              </button>
            );
          })}

          {/* Custom */}
          <button
            type="button"
            onClick={() => setColorScheme("custom")}
            className="flex flex-col items-center gap-1.5 rounded-xl p-2 border transition-all duration-150"
            style={{
              borderColor: colorScheme === "custom" ? "var(--primary)" : "var(--border)",
              backgroundColor: colorScheme === "custom" ? "var(--primary-soft)" : "var(--surface-alt)",
            }}
          >
            <div className="flex gap-1">
              {[userPrimary, userBackground, userAccent].map((color, i) => (
                <span key={i} style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: color, border: "1px solid rgba(0,0,0,0.12)", display: "block" }} />
              ))}
            </div>
            <span className="text-xs font-semibold leading-none" style={{ color: colorScheme === "custom" ? "var(--primary)" : "var(--muted)" }}>
              Custom
            </span>
          </button>
        </div>

        {colorScheme === "custom" && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {([
              { label: "Primary", value: userPrimary, set: setUserPrimary },
              { label: "Accent",  value: userAccent,  set: setUserAccent },
              { label: "Background", value: userBackground, set: setUserBackground },
            ] as const).map(({ label, value, set }) => (
              <label key={label} className="flex flex-col items-center gap-1 cursor-pointer">
                <input type="color" value={value} onChange={(e) => (set as (v: string) => void)(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border"
                  style={{ border: "1px solid var(--border)", padding: 2 }}
                />
                <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Template */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={labelStyle}>{t("canvasSize")}</p>
        <PillGroup options={TEMPLATES} value={template} onChange={setTemplate} />
      </div>

      {/* Font */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={labelStyle}>{t("font")}</p>
        <PillGroup options={FONTS} value={primaryFont} onChange={setPrimaryFont} />
      </div>

      {/* Accent */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={labelStyle}>{t("titleAccent")}</p>
        <PillGroup options={ACCENT_STYLES} value={accentStyle} onChange={setAccentStyle} />
      </div>

      {/* Illustration */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={labelStyle}>{t("illustrationStyle")}</p>
        <PillGroup options={ILLUSTRATION_STYLES} value={illustrationStyle} onChange={setIllustrationStyle} />
      </div>

      {/* Density */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={labelStyle}>{t("depth")}</p>
        <PillGroup options={DEPTHS} value={density} onChange={setDensity} />
      </div>

      {/* Style prompt */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={labelStyle}>
          {t("styleDescription")} <span style={{ color: "var(--muted)", fontWeight: 400 }}>{t("styleOptional")}</span>
        </p>
        <input
          type="text"
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          placeholder={t("stylePlaceholder")}
          disabled={loading}
          maxLength={400}
          className="w-full rounded-2xl px-5 py-3 text-sm outline-none"
          style={INPUT_STYLE}
        />
      </div>

      {/* Footer toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={showSourceFooter}
          onClick={() => setShowSourceFooter((v) => !v)}
          className="w-10 h-6 rounded-full transition-colors duration-200 shrink-0"
          style={{ backgroundColor: showSourceFooter ? "var(--primary)" : "var(--border)" }}
        >
          <span
            className="block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
            style={{ transform: showSourceFooter ? "translateX(18px)" : "translateX(2px)" }}
          />
        </button>
        <span className="text-sm" style={{ color: "var(--muted)" }}>{t("showFooter")}</span>
      </div>

      <button
        type="submit"
        disabled={loading || !rawText.trim()}
        className="w-full rounded-2xl py-4 text-sm font-semibold transition-all duration-200"
        style={{
          backgroundColor: loading ? "var(--btn-loading-bg)" : "var(--primary)",
          color: "var(--on-primary)",
          opacity: !rawText.trim() && !loading ? 0.6 : 1,
          cursor: loading || !rawText.trim() ? "not-allowed" : "pointer",
          boxShadow: "var(--btn-shadow)",
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t("generating")}
          </span>
        ) : (
          t("generate")
        )}
      </button>
    </form>
  );
}

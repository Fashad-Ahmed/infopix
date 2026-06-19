"use client";

import { useTranslations } from "next-intl";
import { COLOR_SCHEME_PRESETS } from "../../mastra/schemas/schema";
import { SectionLabel } from "./SectionLabel";
import { PillGroup } from "./PillGroup";
import { SCHEME_META, INPUT_STYLE } from "./studioFormConstants";
import { useStudioFormOptions } from "./useStudioFormOptions";
import { useStudioFormState, type StudioFormValues } from "./useStudioFormState";

type Props = {
  loading: boolean;
  onSubmit: (values: StudioFormValues) => void;
};

export function StudioForm({ loading, onSubmit }: Props) {
  const t = useTranslations("studio.form");
  const { TEMPLATES, FONTS, ACCENT_STYLES, ILLUSTRATION_STYLES, DEPTHS } = useStudioFormOptions(t);
  const {
    mode, setMode,
    rawText, setRawText,
    stylePrompt, setStylePrompt,
    template, setTemplate,
    primaryFont, setPrimaryFont,
    accentStyle, setAccentStyle,
    illustrationStyle, setIllustrationStyle,
    showSourceFooter, setShowSourceFooter,
    density, setDensity,
    colorScheme, setColorScheme,
    userPrimary, setUserPrimary,
    userAccent, setUserAccent,
    userBackground, setUserBackground,
    handleSubmit,
  } = useStudioFormState(onSubmit);

  return (
    <form onSubmit={handleSubmit}>
      {/* Form header */}
      <div
        className="px-6 pt-6 pb-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display), "Darker Grotesque", system-ui, sans-serif',
            fontSize: "1.05rem",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "var(--foreground)",
            marginBottom: "0.2rem",
          }}
        >
          Configure
        </p>
        <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
          Set up your infographic layout and style
        </p>
      </div>

      <div className="px-6 py-5 space-y-6">

        {/* Mode + input */}
        <div>
          <SectionLabel>{t("input")}</SectionLabel>

          {/* Mode tabs */}
          <div
            className="flex mb-4 p-1 gap-1 rounded-2xl"
            style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
          >
            {(["topic", "url"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="flex-1 rounded-xl text-xs font-semibold transition-all duration-150"
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: mode === m ? "var(--surface)" : "transparent",
                  color: mode === m ? "var(--foreground)" : "var(--muted)",
                  border: mode === m ? "1px solid var(--border)" : "1px solid transparent",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
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
            style={INPUT_STYLE}
          />
        </div>

        {/* Palette */}
        <div>
          <SectionLabel>Color palette</SectionLabel>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {SCHEME_META.map(({ id, label }) => {
              const p = COLOR_SCHEME_PRESETS[id];
              const selected = colorScheme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setColorScheme(id)}
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 border transition-all duration-150"
                  style={{
                    borderColor: selected ? "var(--primary)" : "var(--border)",
                    backgroundColor: selected ? "var(--primary-soft)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  {/* Stacked color dots */}
                  <div className="flex gap-0.5 shrink-0">
                    {([p.primary, p.accent, p.secondary] as const).map((color, i) => (
                      <span
                        key={i}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: color,
                          border: "1px solid rgba(0,0,0,0.1)",
                          display: "block",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: "0.73rem",
                      fontWeight: 600,
                      color: selected ? "var(--primary)" : "var(--foreground)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}

            {/* Custom */}
            <button
              type="button"
              onClick={() => setColorScheme("custom")}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 border transition-all duration-150"
              style={{
                borderColor: colorScheme === "custom" ? "var(--primary)" : "var(--border)",
                backgroundColor: colorScheme === "custom" ? "var(--primary-soft)" : "transparent",
                cursor: "pointer",
              }}
            >
              <div className="flex gap-0.5 shrink-0">
                {[userPrimary, userAccent, userBackground].map((color, i) => (
                  <span
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: color,
                      border: "1px solid rgba(0,0,0,0.1)",
                      display: "block",
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: "0.73rem",
                  fontWeight: 600,
                  color: colorScheme === "custom" ? "var(--primary)" : "var(--foreground)",
                }}
              >
                Custom
              </span>
            </button>
          </div>

          {colorScheme === "custom" && (
            <div
              className="flex gap-4 mt-3 p-3 rounded-2xl"
              style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
            >
              {([
                { label: "Primary",    value: userPrimary,    set: setUserPrimary },
                { label: "Accent",     value: userAccent,     set: setUserAccent },
                { label: "Background", value: userBackground, set: setUserBackground },
              ] as const).map(({ label, value, set }) => (
                <label key={label} className="flex flex-col items-center gap-1.5 cursor-pointer">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => (set as (v: string) => void)(e.target.value)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      border: "1px solid var(--border)",
                      padding: 2,
                      backgroundColor: "transparent",
                    }}
                  />
                  <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 500 }}>{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Canvas size */}
        <div>
          <SectionLabel>{t("canvasSize")}</SectionLabel>
          <PillGroup options={TEMPLATES} value={template} onChange={setTemplate} small />
        </div>

        {/* Font */}
        <div>
          <SectionLabel>{t("font")}</SectionLabel>
          <PillGroup options={FONTS} value={primaryFont} onChange={setPrimaryFont} small />
        </div>

        {/* Accent */}
        <div>
          <SectionLabel>{t("titleAccent")}</SectionLabel>
          <PillGroup options={ACCENT_STYLES} value={accentStyle} onChange={setAccentStyle} small />
        </div>

        {/* Illustration */}
        <div>
          <SectionLabel>{t("illustrationStyle")}</SectionLabel>
          <PillGroup options={ILLUSTRATION_STYLES} value={illustrationStyle} onChange={setIllustrationStyle} small />
        </div>

        {/* Depth */}
        <div>
          <SectionLabel>{t("depth")}</SectionLabel>
          <PillGroup options={DEPTHS} value={density} onChange={setDensity} small />
        </div>

        {/* Style description */}
        <div>
          <SectionLabel>
            {t("styleDescription")}
            <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
              {t("styleOptional")}
            </span>
          </SectionLabel>
          <input
            type="text"
            value={stylePrompt}
            onChange={(e) => setStylePrompt(e.target.value)}
            placeholder={t("stylePlaceholder")}
            disabled={loading}
            maxLength={400}
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
            className="shrink-0 transition-colors duration-200"
            style={{
              width: 40,
              height: 24,
              borderRadius: 9999,
              backgroundColor: showSourceFooter ? "var(--primary)" : "var(--border)",
              border: "none",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: showSourceFooter ? 18 : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s ease",
              }}
            />
          </button>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{t("showFooter")}</span>
        </div>

      </div>

      {/* Submit — sticky at bottom */}
      <div
        className="px-6 pb-6 pt-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          type="submit"
          disabled={loading || !rawText.trim()}
          className="w-full font-semibold transition-all duration-200"
          style={{
            borderRadius: 9999,
            padding: "0.9rem 1.5rem",
            fontSize: "0.875rem",
            backgroundColor: loading
              ? "var(--btn-loading-bg)"
              : !rawText.trim()
              ? "var(--border)"
              : "var(--primary)",
            color: !rawText.trim() && !loading ? "var(--muted)" : "var(--on-primary)",
            border: "none",
            cursor: loading || !rawText.trim() ? "not-allowed" : "pointer",
            boxShadow: rawText.trim() && !loading ? "var(--btn-shadow)" : "none",
            transition: "background-color 0.2s, box-shadow 0.2s, transform 0.1s",
          }}
          onMouseEnter={(e) => {
            if (!loading && rawText.trim()) {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2.5">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t("generating")}
            </span>
          ) : (
            t("generate")
          )}
        </button>
      </div>
    </form>
  );
}

"use client";

import { TEMPLATE_DEFINITIONS } from "../../mastra/schemas/schema";
import { CHART_TYPES, editableFieldsFor, type ChartType } from "../../lib/studio-editor";
import type { useStudioEditor } from "../../hooks/useStudioEditor";
import type { InfographicSection } from "../../types/infographic";

const TEMPLATE_LABELS: Record<string, string> = {
  "editorial-portrait": "Editorial portrait",
  "editorial-landscape": "Editorial landscape",
  "social-square": "Social square",
  "social-wide": "Social wide",
  poster: "Poster",
  "sidebar-portrait": "Sidebar portrait",
  "asymmetric-landscape": "Asymmetric landscape",
  "banner-bottom-square": "Banner bottom square",
  "magazine-grid": "Magazine grid",
};

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: "Bar",
  donut: "Donut",
  pie: "Pie",
  bubble: "Bubble",
  radial: "Radial",
  area: "Area",
};

function Pill({
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
        padding: "0.35rem 0.8rem",
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

const FIELD_LABELS: Record<string, string> = {
  heading: "Heading",
  subheading: "Subheading",
  value: "Value",
  unit: "Unit",
  insight: "Insight",
  quote: "Quote",
  stat: "Stat",
  attribution: "Attribution",
  scaleDescription: "Scale description",
  iconLabel: "Icon label",
};

const MULTILINE_FIELDS = new Set(["insight", "quote", "subheading"]);

function fieldValue(section: InfographicSection, field: string): string {
  const value = (section as unknown as Record<string, unknown>)[field];
  return typeof value === "string" ? value : "";
}

const FIELD_INPUT_STYLE = {
  backgroundColor: "var(--surface-alt)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  borderRadius: "0.625rem",
  padding: "0.55rem 0.75rem",
  fontSize: "0.8rem",
  width: "100%",
  outline: "none",
  resize: "vertical" as const,
  fontFamily: "inherit",
};

type Editor = ReturnType<typeof useStudioEditor>;

type Props = {
  editor: Editor;
};

export function StudioEditPanel({ editor }: Props) {
  const {
    editing,
    viewModel,
    isDirty,
    reset,
    selectedSlot,
    handleSlotClick,
    setField,
    setChartType,
    setTemplate,
    swapTargetsFor,
  } = editor;

  if (!editing || !viewModel) return null;

  const def = TEMPLATE_DEFINITIONS[viewModel.slotAssignment.template];
  if (!def) return null;

  const contentSlots = Object.entries(def.slots).filter(
    ([, slotDef]) => slotDef.acceptedTypes.length > 0,
  );

  return (
    <div
      className="rounded-3xl space-y-4"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "1.5rem" }}
    >
      <div className="flex items-center justify-between">
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
            Edit content
          </p>
          <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--muted)" }}>
            {selectedSlot
              ? "Pick another section to swap places — only compatible types are offered."
              : "Edit text inline, or click a section then click another to reorder."}
          </p>
        </div>
        {isDirty && (
          <button
            type="button"
            onClick={reset}
            className="text-xs font-semibold rounded-full px-3 py-1.5 transition-colors duration-150"
            style={{ border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "transparent" }}
          >
            Reset to generated
          </button>
        )}
      </div>

      <div className="space-y-2">
        <span className="block text-[0.65rem] font-bold uppercase" style={{ letterSpacing: "0.1em", color: "var(--muted)" }}>
          Layout
        </span>
        <div className="flex flex-wrap gap-2">
          {Object.keys(TEMPLATE_DEFINITIONS).map((templateId) => (
            <Pill
              key={templateId}
              active={viewModel.slotAssignment.template === templateId}
              onClick={() => setTemplate(templateId)}
            >
              {TEMPLATE_LABELS[templateId] ?? templateId}
            </Pill>
          ))}
        </div>
        <p className="text-[0.7rem] leading-relaxed" style={{ color: "var(--muted)" }}>
          Switching layout re-fits your sections into the new slots — anything that doesn&apos;t fit stays in your content but is hidden until you switch back.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 items-start">
        {contentSlots.map(([slotName]) => {
          const sectionIndex = viewModel.slotAssignment.slots[slotName] ?? null;
          const section = sectionIndex !== null ? viewModel.sections[sectionIndex] ?? null : null;
          if (!section || sectionIndex === null) return null;

          const isSelected = selectedSlot === slotName;
          const targets = swapTargetsFor(slotName);

          return (
            <div
              key={slotName}
              className="rounded-2xl space-y-2.5 transition-shadow duration-150"
              style={{
                backgroundColor: "var(--surface-alt)",
                border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                padding: "1rem",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[0.65rem] font-bold uppercase"
                  style={{ letterSpacing: "0.1em", color: "var(--muted)" }}
                >
                  {slotName.replace("-", " ")} · {section.type}
                </span>
                <button
                  type="button"
                  onClick={() => handleSlotClick(slotName)}
                  className="text-xs font-semibold rounded-full px-3 py-1 transition-colors duration-150"
                  style={{
                    border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                    color: isSelected ? "var(--primary)" : "var(--muted)",
                    backgroundColor: isSelected ? "var(--primary-soft)" : "transparent",
                  }}
                  aria-pressed={isSelected}
                >
                  {isSelected ? "Cancel swap" : "Swap"}
                </button>
              </div>

              {section.type === "chart" && (
                <div className="space-y-1.5">
                  <span
                    className="block text-[0.6rem] font-semibold uppercase"
                    style={{ letterSpacing: "0.08em", color: "var(--muted)" }}
                  >
                    Chart style
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CHART_TYPES.map((chartType) => (
                      <Pill
                        key={chartType}
                        active={section.chartType === chartType}
                        onClick={() => setChartType(sectionIndex, chartType)}
                      >
                        {CHART_TYPE_LABELS[chartType]}
                      </Pill>
                    ))}
                  </div>
                </div>
              )}

              {editableFieldsFor(section).map((field) => (
                <label key={field} className="block">
                  <span
                    className="block text-[0.6rem] font-semibold uppercase mb-1"
                    style={{ letterSpacing: "0.08em", color: "var(--muted)" }}
                  >
                    {FIELD_LABELS[field] ?? field}
                  </span>
                  {MULTILINE_FIELDS.has(field) ? (
                    <textarea
                      value={fieldValue(section, field)}
                      onChange={(e) => setField(sectionIndex, field, e.target.value)}
                      rows={2}
                      style={FIELD_INPUT_STYLE}
                    />
                  ) : (
                    <input
                      type="text"
                      value={fieldValue(section, field)}
                      onChange={(e) => setField(sectionIndex, field, e.target.value)}
                      style={FIELD_INPUT_STYLE}
                    />
                  )}
                </label>
              ))}

              {isSelected && targets.length > 0 && (
                <p className="text-[0.7rem] leading-relaxed" style={{ color: "var(--muted)" }}>
                  Click a highlighted slot above to swap with it.
                </p>
              )}
              {isSelected && targets.length === 0 && (
                <p className="text-[0.7rem] leading-relaxed" style={{ color: "var(--destructive)" }}>
                  No compatible slot to swap with right now.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

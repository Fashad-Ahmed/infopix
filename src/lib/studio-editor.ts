import { TEMPLATE_DEFINITIONS } from "../mastra/schemas/schema";
import type { InfographicSection, SlotAssignment } from "../types/infographic";

/**
 * Scalar text fields each section type exposes for inline editing.
 * Deliberately excludes nested arrays (comparison items, chart data, takeaway
 * points, pictograph rows) — those need dedicated list editors, not text inputs.
 */
const EDITABLE_TEXT_FIELDS: Record<InfographicSection["type"], readonly string[]> = {
  metric: ["heading", "subheading", "value", "unit", "insight"],
  comparison: ["heading", "subheading", "scaleDescription", "insight"],
  chart: ["heading", "subheading", "unit", "insight"],
  takeaway: ["heading", "subheading", "insight"],
  callout: ["heading", "subheading", "quote", "stat", "attribution"],
  pictograph: ["heading", "subheading", "iconLabel", "insight"],
};

export function editableFieldsFor(section: InfographicSection): readonly string[] {
  return EDITABLE_TEXT_FIELDS[section.type] ?? [];
}

export function isEditableField(section: InfographicSection, field: string): boolean {
  return editableFieldsFor(section).includes(field);
}

/**
 * Immutably patches one scalar text field on one section.
 * No-ops (returns the same array reference) on out-of-range index or a field
 * that isn't editable for that section's type — callers can compare by
 * reference to detect whether anything actually changed.
 */
export function updateSectionField(
  sections: InfographicSection[],
  index: number,
  field: string,
  value: string,
): InfographicSection[] {
  if (index < 0 || index >= sections.length) return sections;
  const section = sections[index];
  if (!isEditableField(section, field)) return sections;

  const next = sections.slice();
  next[index] = { ...section, [field]: value } as InfographicSection;
  return next;
}

/**
 * Visual chart representations a "chart" section can switch between, without
 * touching its underlying data — purely a render-style swap.
 */
export const CHART_TYPES = ["pie", "donut", "bar", "bubble", "radial", "area"] as const;
export type ChartType = (typeof CHART_TYPES)[number];

const CHART_TYPE_VALUES = new Set<ChartType>(CHART_TYPES);

export function isChartType(value: unknown): value is ChartType {
  return typeof value === "string" && CHART_TYPE_VALUES.has(value as ChartType);
}

/**
 * Immutably swaps a chart section's visual representation (e.g. bar → donut).
 * No-ops on out-of-range index, a non-chart section, an unknown chart type,
 * or when the type is already current — same reference-equality contract as
 * `updateSectionField`.
 */
export function updateChartType(
  sections: InfographicSection[],
  index: number,
  chartType: string,
): InfographicSection[] {
  if (index < 0 || index >= sections.length) return sections;
  const section = sections[index];
  if (section.type !== "chart") return sections;
  if (!isChartType(chartType) || section.chartType === chartType) return sections;

  const next = sections.slice();
  next[index] = { ...section, chartType };
  return next;
}

type SlotLookup = {
  slotName: string;
  sectionIndex: number | null;
  section: InfographicSection | null;
};

export function resolveSlot(
  templateId: string,
  slotAssignment: SlotAssignment,
  sections: InfographicSection[],
  slotName: string,
): SlotLookup | null {
  const def = TEMPLATE_DEFINITIONS[templateId];
  if (!def || !def.slots[slotName]) return null;

  const sectionIndex = slotAssignment.slots[slotName] ?? null;
  const section = sectionIndex !== null ? sections[sectionIndex] ?? null : null;
  return { slotName, sectionIndex, section };
}

/**
 * Returns true when the sections currently in slotA and slotB can trade
 * places without violating either slot's `acceptedTypes`.
 *
 * Edge cases handled:
 * - same slot → false
 * - unknown template / slot name → false
 * - structural slots (banner, footer — empty acceptedTypes) → false
 * - both slots empty → false (nothing to move)
 * - either occupant's type isn't accepted by the destination slot → false
 */
export function canSwapSlots(
  templateId: string,
  slotAssignment: SlotAssignment,
  sections: InfographicSection[],
  slotA: string,
  slotB: string,
): boolean {
  if (slotA === slotB) return false;

  const def = TEMPLATE_DEFINITIONS[templateId];
  if (!def) return false;

  const defA = def.slots[slotA];
  const defB = def.slots[slotB];
  if (!defA || !defB) return false;
  if (defA.acceptedTypes.length === 0 || defB.acceptedTypes.length === 0) return false;

  const idxA = slotAssignment.slots[slotA] ?? null;
  const idxB = slotAssignment.slots[slotB] ?? null;
  if (idxA === null && idxB === null) return false;

  const sectionA = idxA !== null ? sections[idxA] ?? null : null;
  const sectionB = idxB !== null ? sections[idxB] ?? null : null;

  if (sectionB && !defA.acceptedTypes.includes(sectionB.type)) return false;
  if (sectionA && !defB.acceptedTypes.includes(sectionA.type)) return false;

  return true;
}

/**
 * Immutably swaps the section indices assigned to two slots.
 * Caller is expected to have validated with `canSwapSlots` first — this
 * function performs the swap unconditionally (it's the "commit" half of the
 * check/commit pair, kept separate so the check can drive UI affordances).
 */
export function swapSlots(
  slotAssignment: SlotAssignment,
  slotA: string,
  slotB: string,
): SlotAssignment {
  const a = slotAssignment.slots[slotA] ?? null;
  const b = slotAssignment.slots[slotB] ?? null;
  return {
    ...slotAssignment,
    slots: {
      ...slotAssignment.slots,
      [slotA]: b,
      [slotB]: a,
    },
  };
}

/**
 * Lists slot names (excluding `from`) that `from`'s current occupant could
 * legally move into — drives "swap with..." pickers.
 */
export function compatibleSwapTargets(
  templateId: string,
  slotAssignment: SlotAssignment,
  sections: InfographicSection[],
  from: string,
): string[] {
  const def = TEMPLATE_DEFINITIONS[templateId];
  if (!def) return [];
  return Object.keys(def.slots).filter((slotName) =>
    canSwapSlots(templateId, slotAssignment, sections, from, slotName),
  );
}

/**
 * Re-lays the same sections out onto a different template's slots.
 *
 * Templates differ in slot count, names, and `acceptedTypes`, so this can't
 * be a 1:1 remap. Instead it greedily places each currently-assigned section
 * (visited in the source template's slot order, which mirrors reading order)
 * into the first not-yet-used target slot whose `acceptedTypes` accepts it.
 * Sections that find no home are simply left unassigned (slot → null) —
 * they remain in `sections` untouched, just not shown until the user swaps
 * the layout again.
 *
 * Edge cases handled:
 * - unknown target template → null (caller should no-op)
 * - target === current template → returns `current` unchanged (reference equality, no-op)
 * - unknown source template (shouldn't happen, but data could be stale) → nothing pre-assigned, every target slot starts empty
 */
export function remapSlotAssignment(
  targetTemplateId: string,
  sections: InfographicSection[],
  current: SlotAssignment,
): SlotAssignment | null {
  const targetDef = TEMPLATE_DEFINITIONS[targetTemplateId];
  if (!targetDef) return null;
  if (current.template === targetTemplateId) return current;

  const sourceDef = TEMPLATE_DEFINITIONS[current.template];
  const assigned: InfographicSection[] = [];
  const assignedIndices: number[] = [];
  if (sourceDef) {
    for (const slotName of Object.keys(sourceDef.slots)) {
      const sectionIndex = current.slots[slotName] ?? null;
      if (sectionIndex === null) continue;
      const section = sections[sectionIndex];
      if (section) {
        assigned.push(section);
        assignedIndices.push(sectionIndex);
      }
    }
  }

  const targetSlotNames = Object.keys(targetDef.slots);
  const nextSlots: Record<string, number | null> = {};
  for (const slotName of targetSlotNames) nextSlots[slotName] = null;

  const usedSlots = new Set<string>();
  assigned.forEach((section, i) => {
    const target = targetSlotNames.find(
      (slotName) =>
        !usedSlots.has(slotName) && targetDef.slots[slotName].acceptedTypes.includes(section.type),
    );
    if (target) {
      nextSlots[target] = assignedIndices[i];
      usedSlots.add(target);
    }
  });

  return { template: targetTemplateId, slots: nextSlots };
}

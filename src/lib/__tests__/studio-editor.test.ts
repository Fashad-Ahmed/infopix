import { describe, it, expect } from "vitest";
import {
  editableFieldsFor,
  isEditableField,
  updateSectionField,
  resolveSlot,
  canSwapSlots,
  swapSlots,
  compatibleSwapTargets,
  isChartType,
  updateChartType,
  remapSlotAssignment,
  CHART_TYPES,
} from "../studio-editor";
import { TEMPLATE_DEFINITIONS } from "../../mastra/schemas/schema";
import type { InfographicSection, SlotAssignment } from "../../types/infographic";

// Minimal section fixtures covering every discriminated type the schema supports.
const metric: InfographicSection = {
  type: "metric",
  heading: "Revenue",
  subheading: "FY24",
  value: "$523M",
  unit: "USD",
  insight: "Up 12% YoY",
} as InfographicSection;

const comparison: InfographicSection = {
  type: "comparison",
  heading: "Market share",
  scaleDescription: "Relative %, higher = larger",
  items: [
    { label: "A", value: 80, isHighlight: true },
    { label: "B", value: 40, isHighlight: false },
  ],
  insight: "A leads by 2x",
} as InfographicSection;

const chart: InfographicSection = {
  type: "chart",
  heading: "Growth",
  chartType: "bar",
  data: [
    { label: "2023", value: 10 },
    { label: "2024", value: 20 },
  ],
  unit: "%",
  insight: "Doubling YoY",
} as InfographicSection;

const takeaway: InfographicSection = {
  type: "takeaway",
  heading: "Key points",
  points: ["Point one", "Point two"],
  insight: "Big picture",
} as InfographicSection;

const callout: InfographicSection = {
  type: "callout",
  heading: "Standout fact",
  quote: "Coldplay sold 5M tickets",
  stat: "5M",
  attribution: "Pollstar 2024",
} as InfographicSection;

const pictograph: InfographicSection = {
  type: "pictograph",
  heading: "Coffee habits",
  rows: [{ label: "USA", count: 5, total: 10 }],
  iconLabel: "cups per week",
  iconToken: "coffee",
  insight: "Half drink 5+ cups",
} as InfographicSection;

const sections: InfographicSection[] = [metric, comparison, chart, takeaway, callout, pictograph];

// Mirrors TEMPLATE_DEFINITIONS["editorial-portrait"] slot/section index wiring.
const slotAssignment: SlotAssignment = {
  template: "editorial-portrait",
  slots: {
    banner: null,
    "stat-a": 0, // metric
    "stat-b": 4, // callout
    chart: 2, // chart
    comparison: 1, // comparison
    takeaway: 3, // takeaway
    footer: null,
  },
};

describe("editableFieldsFor / isEditableField", () => {
  it("returns the scalar text fields for each section type", () => {
    expect(editableFieldsFor(metric)).toEqual(["heading", "subheading", "value", "unit", "insight"]);
    expect(editableFieldsFor(callout)).toEqual(["heading", "subheading", "quote", "stat", "attribution"]);
  });

  it("excludes nested-array fields like items/data/points/rows", () => {
    expect(isEditableField(comparison, "items")).toBe(false);
    expect(isEditableField(chart, "data")).toBe(false);
    expect(isEditableField(takeaway, "points")).toBe(false);
    expect(isEditableField(pictograph, "rows")).toBe(false);
  });

  it("rejects fields that belong to a different section type", () => {
    expect(isEditableField(metric, "quote")).toBe(false);
    expect(isEditableField(callout, "value")).toBe(false);
  });
});

describe("updateSectionField", () => {
  it("immutably patches a valid scalar field", () => {
    const next = updateSectionField(sections, 0, "heading", "Total Revenue");
    expect(next).not.toBe(sections);
    expect(next[0]).toMatchObject({ heading: "Total Revenue" });
    expect(sections[0]).toMatchObject({ heading: "Revenue" }); // original untouched
  });

  it("does not mutate the original section object", () => {
    const original = sections[0];
    updateSectionField(sections, 0, "heading", "Changed");
    expect(original.heading).toBe("Revenue");
  });

  it("no-ops (same reference) for an out-of-range index", () => {
    expect(updateSectionField(sections, 99, "heading", "x")).toBe(sections);
    expect(updateSectionField(sections, -1, "heading", "x")).toBe(sections);
  });

  it("no-ops for a field not editable on that section's type", () => {
    expect(updateSectionField(sections, 0, "quote", "nope")).toBe(sections);
  });

  it("no-ops for an unknown field name", () => {
    expect(updateSectionField(sections, 0, "bogus", "x")).toBe(sections);
  });

  it("preserves non-target sections by reference", () => {
    const next = updateSectionField(sections, 0, "heading", "Total Revenue");
    expect(next[1]).toBe(sections[1]);
    expect(next[2]).toBe(sections[2]);
  });
});

describe("resolveSlot", () => {
  it("returns slot name, section index, and section for an occupied slot", () => {
    expect(resolveSlot("editorial-portrait", slotAssignment, sections, "stat-a")).toEqual({
      slotName: "stat-a",
      sectionIndex: 0,
      section: metric,
    });
  });

  it("returns null section/index for an empty structural slot", () => {
    expect(resolveSlot("editorial-portrait", slotAssignment, sections, "banner")).toEqual({
      slotName: "banner",
      sectionIndex: null,
      section: null,
    });
  });

  it("returns null for an unknown slot name", () => {
    expect(resolveSlot("editorial-portrait", slotAssignment, sections, "nope")).toBeNull();
  });

  it("returns null for an unknown template id", () => {
    expect(resolveSlot("not-a-template", slotAssignment, sections, "stat-a")).toBeNull();
  });
});

describe("canSwapSlots", () => {
  it("allows swapping two stat slots whose occupants both fit (metric <-> callout)", () => {
    expect(canSwapSlots("editorial-portrait", slotAssignment, sections, "stat-a", "stat-b")).toBe(true);
  });

  it("allows swapping comparison <-> chart slots (cross-accepted types)", () => {
    expect(canSwapSlots("editorial-portrait", slotAssignment, sections, "chart", "comparison")).toBe(true);
  });

  it("rejects swapping a slot with itself", () => {
    expect(canSwapSlots("editorial-portrait", slotAssignment, sections, "stat-a", "stat-a")).toBe(false);
  });

  it("rejects when destination slot doesn't accept the moving section's type", () => {
    // takeaway slot only accepts takeaway/callout/pictograph — chart section can't move there.
    expect(canSwapSlots("editorial-portrait", slotAssignment, sections, "chart", "takeaway")).toBe(false);
  });

  it("rejects swaps involving structural slots (banner/footer have no acceptedTypes)", () => {
    expect(canSwapSlots("editorial-portrait", slotAssignment, sections, "banner", "stat-a")).toBe(false);
    expect(canSwapSlots("editorial-portrait", slotAssignment, sections, "stat-a", "footer")).toBe(false);
  });

  it("rejects swapping two empty slots", () => {
    const emptyBoth: SlotAssignment = {
      template: "editorial-portrait",
      slots: { ...slotAssignment.slots, "stat-a": null, "stat-b": null },
    };
    expect(canSwapSlots("editorial-portrait", emptyBoth, sections, "stat-a", "stat-b")).toBe(false);
  });

  it("allows moving a section into an empty compatible slot", () => {
    const oneEmpty: SlotAssignment = {
      template: "editorial-portrait",
      slots: { ...slotAssignment.slots, "stat-b": null },
    };
    expect(canSwapSlots("editorial-portrait", oneEmpty, sections, "stat-a", "stat-b")).toBe(true);
  });

  it("returns false for unknown template id", () => {
    expect(canSwapSlots("not-a-template", slotAssignment, sections, "stat-a", "stat-b")).toBe(false);
  });

  it("returns false for unknown slot names", () => {
    expect(canSwapSlots("editorial-portrait", slotAssignment, sections, "stat-a", "nope")).toBe(false);
  });
});

describe("swapSlots", () => {
  it("immutably exchanges section indices between two slots", () => {
    const next = swapSlots(slotAssignment, "stat-a", "stat-b");
    expect(next).not.toBe(slotAssignment);
    expect(next.slots["stat-a"]).toBe(4);
    expect(next.slots["stat-b"]).toBe(0);
    // original untouched
    expect(slotAssignment.slots["stat-a"]).toBe(0);
    expect(slotAssignment.slots["stat-b"]).toBe(4);
  });

  it("handles swapping an occupied slot with an empty one", () => {
    const oneEmpty: SlotAssignment = {
      template: "editorial-portrait",
      slots: { ...slotAssignment.slots, "stat-b": null },
    };
    const next = swapSlots(oneEmpty, "stat-a", "stat-b");
    expect(next.slots["stat-a"]).toBeNull();
    expect(next.slots["stat-b"]).toBe(0);
  });

  it("leaves unrelated slot assignments untouched", () => {
    const next = swapSlots(slotAssignment, "stat-a", "stat-b");
    expect(next.slots.chart).toBe(slotAssignment.slots.chart);
    expect(next.slots.takeaway).toBe(slotAssignment.slots.takeaway);
  });
});

describe("compatibleSwapTargets", () => {
  it("lists only slots that pass canSwapSlots in both directions", () => {
    const targets = compatibleSwapTargets("editorial-portrait", slotAssignment, sections, "stat-a");
    expect(targets).toContain("stat-b");
    expect(targets).not.toContain("banner");
    expect(targets).not.toContain("footer");
    expect(targets).not.toContain("stat-a");
  });

  it("returns an empty list for an unknown template", () => {
    expect(compatibleSwapTargets("nope", slotAssignment, sections, "stat-a")).toEqual([]);
  });

  it("returns an empty list when the occupant's type fits nowhere else", () => {
    // "takeaway" sections only fit the "takeaway" slot in editorial-portrait —
    // every other occupied slot rejects it, and every other slot's occupant
    // (metric/chart/comparison/callout) is rejected by the "takeaway" slot too.
    const targets = compatibleSwapTargets("editorial-portrait", slotAssignment, sections, "takeaway");
    expect(targets).toEqual([]);
  });
});

describe("isChartType / updateChartType", () => {
  it("accepts every known chart type", () => {
    for (const ct of CHART_TYPES) expect(isChartType(ct)).toBe(true);
  });

  it("rejects unknown or non-string values", () => {
    expect(isChartType("scatter")).toBe(false);
    expect(isChartType(null)).toBe(false);
    expect(isChartType(7)).toBe(false);
  });

  it("swaps a chart section's chartType immutably", () => {
    const next = updateChartType(sections, 2, "donut");
    expect(next).not.toBe(sections);
    expect((next[2] as { chartType: string }).chartType).toBe("donut");
    expect((sections[2] as { chartType: string }).chartType).toBe("bar"); // source untouched
  });

  it("no-ops on a non-chart section", () => {
    expect(updateChartType(sections, 0, "donut")).toBe(sections); // metric
  });

  it("no-ops on an unknown chart type", () => {
    expect(updateChartType(sections, 2, "scatter")).toBe(sections);
  });

  it("no-ops when the chart type is already current", () => {
    expect(updateChartType(sections, 2, "bar")).toBe(sections);
  });

  it("no-ops on out-of-range index", () => {
    expect(updateChartType(sections, 99, "donut")).toBe(sections);
    expect(updateChartType(sections, -1, "donut")).toBe(sections);
  });
});

describe("remapSlotAssignment", () => {
  it("returns the same assignment unchanged when target equals current template", () => {
    const result = remapSlotAssignment("editorial-portrait", sections, slotAssignment);
    expect(result).toBe(slotAssignment);
  });

  it("returns null for an unknown target template", () => {
    expect(remapSlotAssignment("nope", sections, slotAssignment)).toBeNull();
  });

  it("places sections into compatible slots of the new template, dropping what doesn't fit", () => {
    // social-square has: banner, stat-a, stat-b, chart, takeaway, footer — no "comparison" slot.
    const result = remapSlotAssignment("social-square", sections, slotAssignment);
    expect(result).not.toBeNull();
    expect(result!.template).toBe("social-square");

    // Every assigned section index must land in a slot whose acceptedTypes include its type.
    const def = TEMPLATE_DEFINITIONS["social-square"];
    for (const [slotName, idx] of Object.entries(result!.slots)) {
      if (idx === null) continue;
      expect(def.slots[slotName].acceptedTypes).toContain(sections[idx].type);
    }

    // No slot collisions — every assigned index appears at most once.
    const used = Object.values(result!.slots).filter((v) => v !== null);
    expect(new Set(used).size).toBe(used.length);

    // Every target slot key exists.
    expect(Object.keys(result!.slots).sort()).toEqual(Object.keys(def.slots).sort());
  });

  it("leaves structural slots (banner/footer) unassigned", () => {
    const result = remapSlotAssignment("social-wide", sections, slotAssignment);
    expect(result!.slots.banner).toBeNull();
    expect(result!.slots.footer).toBeNull();
  });

  it("is a pure function — does not mutate inputs", () => {
    const beforeSections = sections.map((s) => ({ ...s }));
    const beforeAssignment = JSON.parse(JSON.stringify(slotAssignment));
    remapSlotAssignment("poster", sections, slotAssignment);
    expect(sections).toEqual(beforeSections);
    expect(slotAssignment).toEqual(beforeAssignment);
  });
});

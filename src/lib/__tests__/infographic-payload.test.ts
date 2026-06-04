import { describe, it, expect } from "vitest";
import {
  pickInfographicPayload,
  normalizeInfographicContent,
} from "../infographic-payload";

const SECTIONS = [
  { type: "metric", heading: "Stat", value: "42", unit: "%", insight: "Big." },
];

describe("pickInfographicPayload", () => {
  it("returns null for null input", () => {
    expect(pickInfographicPayload(null as never)).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(pickInfographicPayload("string" as never)).toBeNull();
  });

  it("returns object when root has sections", () => {
    const raw = { sections: SECTIONS };
    expect(pickInfographicPayload(raw)).toBe(raw);
  });

  it("returns nested result when result.content.sections exists", () => {
    const raw = { result: { content: { sections: SECTIONS } } };
    const picked = pickInfographicPayload(raw);
    expect(picked?.content?.sections).toBe(SECTIONS);
  });

  it("returns nested content when root.content.sections exists", () => {
    const raw = { content: { sections: SECTIONS } };
    const picked = pickInfographicPayload(raw);
    expect(picked?.sections ?? picked?.content?.sections).toBeDefined();
  });

  it("returns first candidate when no sections found", () => {
    const raw = { title: "No sections here" };
    expect(pickInfographicPayload(raw)).toBe(raw);
  });

  it("returns null for empty object with no candidates", () => {
    const result = pickInfographicPayload({});
    expect(result).toBeDefined();
  });

  it("ignores candidates with empty sections array", () => {
    const raw = { sections: [] };
    const picked = pickInfographicPayload(raw);
    expect(picked).not.toBeNull();
  });
});

describe("normalizeInfographicContent", () => {
  it("preserves correctly-shaped sections unchanged", () => {
    const content = { sections: SECTIONS };
    const result = normalizeInfographicContent(content);
    expect(result.sections[0]).toEqual(SECTIONS[0]);
  });

  it("injects default metadata when missing", () => {
    const content = { sections: SECTIONS };
    const result = normalizeInfographicContent(content);
    expect(result.metadata).toBeDefined();
    expect(typeof result.metadata.confidenceScore).toBe("number");
  });

  it("preserves existing metadata", () => {
    const meta = { confidenceScore: 0.95, reasoning: "solid" };
    const content = { sections: SECTIONS, metadata: meta };
    const result = normalizeInfographicContent(content);
    expect(result.metadata).toBe(meta);
  });

  it("sets empty sections array when sections field missing", () => {
    const result = normalizeInfographicContent({ title: "No sections" });
    expect(result.sections).toEqual([]);
  });

  it("converts comparison.values array to items", () => {
    const section = {
      type: "comparison",
      heading: "Rank",
      values: ["Alpha", "Beta", "Gamma"],
    };
    const result = normalizeInfographicContent({ sections: [section] });
    const normalized = result.sections[0];
    expect(Array.isArray(normalized.items)).toBe(true);
    expect(normalized.items).toHaveLength(3);
    expect(normalized.items[0].isHighlight).toBe(true);
  });

  it("leaves comparison section alone when items already exists", () => {
    const items = [{ label: "A", value: 80, isHighlight: true }];
    const section = { type: "comparison", heading: "Rank", items };
    const result = normalizeInfographicContent({ sections: [section] });
    expect(result.sections[0].items).toBe(items);
  });

  it("converts takeaway string value to points array", () => {
    const section = {
      type: "takeaway",
      heading: "Key Points",
      value: "First fact. Second fact. Third fact.",
    };
    const result = normalizeInfographicContent({ sections: [section] });
    const normalized = result.sections[0];
    expect(Array.isArray(normalized.points)).toBe(true);
    expect(normalized.points.length).toBeGreaterThanOrEqual(2);
  });

  it("leaves takeaway alone when points already exists", () => {
    const points = ["A", "B"];
    const section = { type: "takeaway", heading: "Points", points };
    const result = normalizeInfographicContent({ sections: [section] });
    expect(result.sections[0].points).toBe(points);
  });

  it("converts numeric metric value to string", () => {
    const section = { type: "metric", heading: "Count", value: 1800000 };
    const result = normalizeInfographicContent({ sections: [section] });
    expect(typeof result.sections[0].value).toBe("string");
    expect(result.sections[0].value).toBe("1800000");
  });

  it("leaves string metric value unchanged", () => {
    const section = { type: "metric", heading: "Count", value: "1.8M" };
    const result = normalizeInfographicContent({ sections: [section] });
    expect(result.sections[0].value).toBe("1.8M");
  });
});

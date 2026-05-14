/* eslint-disable @typescript-eslint/no-explicit-any */

/** Pick the workflow JSON body that actually contains infographic sections. */
export function pickInfographicPayload(raw: Record<string, any>): Record<string, any> | null {
  if (!raw || typeof raw !== "object") return null;

  const candidates: Record<string, any>[] = [];
  const push = (v: unknown) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      candidates.push(v as Record<string, any>);
    }
  };

  push(raw);
  push(raw.result);
  push(raw.output);
  push(raw.data);

  const hasSections = (o: Record<string, any>) => {
    const s = o.content?.sections ?? o.sections;
    return Array.isArray(s) && s.length > 0;
  };

  for (const c of candidates) {
    if (hasSections(c)) return c;
  }

  return candidates[0] ?? null;
}

function normalizeSection(section: any): any {
  if (!section || typeof section !== "object") return section;

  const type = section.type;
  if (type === "comparison" && Array.isArray(section.values) && !Array.isArray(section.items)) {
    const values = section.values as string[];
    const n = Math.max(values.length, 1);
    return {
      ...section,
      items: values.map((label, i) => ({
        label: String(label),
        value: Math.max(5, Math.round((100 / n) * (n - i))),
        isHighlight: i === 0,
      })),
    };
  }
  if (type === "takeaway" && typeof section.value === "string" && !Array.isArray(section.points)) {
    const parts = section.value.split(/(?<=[.!?])\s+/).filter(Boolean);
    const points =
      parts.length >= 2 ? parts.slice(0, 3) : [section.value, "See source for more detail."];
    const { value: _v, ...rest } = section;
    return { ...rest, points };
  }
  if (type === "metric" && section.value != null && typeof section.value !== "string") {
    return { ...section, value: String(section.value) };
  }
  return section;
}

/** Ensure content matches what <Infographic /> expects (sections + metadata for schema). */
export function normalizeInfographicContent(content: Record<string, any>): Record<string, any> {
  const sections = Array.isArray(content.sections)
    ? content.sections.map(normalizeSection)
    : [];
  const metadata = content.metadata ?? {
    confidenceScore: 0.7,
    reasoning: "Normalized client-side: source omitted or used alternate field names.",
  };
  return { ...content, sections, metadata };
}
